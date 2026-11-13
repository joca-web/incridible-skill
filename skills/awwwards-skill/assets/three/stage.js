/* stage.js: put a 3D model on a web page and make it react (awwwards-skill, Three.js r187+).
 *
 *   <div class="stage" data-stage data-model="three/models/helmet.js" data-params='{"number":"07"}'
 *        data-mode="cursor spin" data-poster="img/helmet.webp" aria-label="Racing helmet, 3D"></div>
 *
 *   import { initStages } from './three/stage.js';
 *   initStages();                        // every [data-stage] on the page
 *
 * data-model     a kit model module (.js, built in the browser, no download) or a .glb/.gltf file
 * data-params    JSON passed to the module's build({ params })
 * data-mode      any of: spin (idle turn), cursor (leans toward the pointer), scroll (turns with the
 *                page), enter (grows and turns in when first seen), float (gentle bob)
 * data-turns     turns over the scroll range in scroll mode (default 1)
 * data-keyframes JSON [{ "at": 0, "rotY": 0, "rotX": 0, "x": 0, "y": 0, "z": 0, "scale": 1 }, …] played
 *                across the scroll range of data-scroll (a selector; default the stage itself).
 *                Angles in degrees, positions in model units. Pair it with a pinned section and
 *                data-scroll-range="pin" (progress runs only while the sticky section holds).
 * data-reveal    "cursor": the model is seen only through a soft circle that follows the pointer
 *                (landonorris.com style); data-reveal-size (px, default 220); data-ghost adds a faint
 *                silhouette of the whole model so people know something is there
 * data-poster    image shown until the first frame and kept when WebGL is unavailable (render it with
 *                scripts/model3d.mjs); data-fov, data-elevation, data-zoom (camera framing)
 *
 * Behaviour: transparent canvas over the page background, studio lighting with no HDR file, renders
 * only while something moves, pauses off-screen and in hidden tabs, a single still frame under
 * prefers-reduced-motion, pixel ratio capped at 1.75. element._stage exposes { THREE, scene, camera,
 * model, render, set } so a custom GSAP timeline can drive it: el._stage.set({ rotY: 90 }).
 * Needs an import map for "three" and "three/addons/" (see references/10-3d-modeling.md). */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as kit from './kit.js';

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
const lerp = (a, b, t) => a + (b - a) * t;
const D = THREE.MathUtils.degToRad;

function interpolate(frames, p) {
  if (!frames.length) return {};
  if (p <= frames[0].at) return frames[0];
  for (let i = 1; i < frames.length; i++) {
    const a = frames[i - 1], b = frames[i];
    if (p <= b.at) {
      const t = (p - a.at) / Math.max(1e-6, b.at - a.at);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;    // ease in-out per segment
      const out = {}; for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) if (k !== 'at') out[k] = lerp(a[k] ?? b[k] ?? 0, b[k] ?? a[k] ?? 0, e);
      return out;
    }
  }
  return frames[frames.length - 1];
}

async function loadModel(url, params) {
  if (/\.(glb|gltf)(\?|$)/i.test(url)) { const g = await new GLTFLoader().loadAsync(url); return g.scene; }
  const mod = await import(new URL(url, document.baseURI).href);
  return mod.default({ THREE, kit, params });
}

export async function createStage(el) {
  if (el._stage) return el._stage;
  const modes = new Set((el.dataset.mode || 'cursor').split(/\s+/));
  const still = reduce();
  const poster = el.querySelector('img');
  let params = {}; try { params = JSON.parse(el.dataset.params || '{}'); } catch { console.warn('stage: data-params is not valid JSON'); }
  let frames = []; try { frames = JSON.parse(el.dataset.keyframes || '[]').sort((a, b) => a.at - b.at); } catch { console.warn('stage: data-keyframes is not valid JSON'); }

  const canvas = document.createElement('canvas');
  canvas.className = 'stage__canvas'; canvas.setAttribute('aria-hidden', 'true');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
  catch { el.classList.add('is-fallback'); return null; }            // no WebGL: the poster stays
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, fine() ? 1.75 : 1.25));   // phones: fewer pixels, same look
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
  el.appendChild(canvas);

  const scene = new THREE.Scene();
  kit.studio(renderer, scene);
  const camera = new THREE.PerspectiveCamera(parseFloat(el.dataset.fov) || 28, 1, 0.01, 100);
  let model;
  try { model = await loadModel(el.dataset.model, params); }
  catch (err) { console.warn('stage: model failed, poster kept', err); canvas.remove(); renderer.dispose(); el.classList.add('is-fallback'); return null; }
  const pivot = new THREE.Group(); pivot.add(model); scene.add(pivot);
  kit.fit(model, 1.6);
  const shadow = kit.contactShadow(model, { opacity: 0.35 }); pivot.add(shadow);

  // ghost: a second, faint render of the silhouette under the cursor mask
  let ghost = null;
  if (el.dataset.reveal === 'cursor' && el.hasAttribute('data-ghost') && fine()) {   // touch gets a one-time reveal instead, so no second context
    const gc = document.createElement('canvas'); gc.className = 'stage__ghost'; gc.setAttribute('aria-hidden', 'true');
    const gr = new THREE.WebGLRenderer({ canvas: gc, antialias: true, alpha: true });
    gr.setPixelRatio(renderer.getPixelRatio());
    el.insertBefore(gc, canvas);
    // frosted, see-through shell of the whole model: it says "something is here" before the cursor finds it
    const override = new THREE.MeshPhysicalMaterial({ color: el.dataset.ghost || '#ffffff', roughness: 0.25, transparent: true, opacity: 0.22, depthWrite: true });
    ghost = { renderer: gr, canvas: gc, override };
  }

  const st = { rotY: 0, rotX: 0, x: 0, y: 0, z: 0, scale: 1, tiltX: 0, tiltY: 0, spin: 0, enter: modes.has('enter') && !still ? 0 : 1, t: 0,
    pointer: { x: 0, y: 0, tx: 0, ty: 0 }, mask: { x: -999, y: -999, tx: -999, ty: -999, r: 0, tr: 0 }, visible: true, running: false, dirty: true, manual: null };

  const size = () => {
    const w = el.clientWidth || 1, h = el.clientHeight || 1;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    if (ghost) ghost.renderer.setSize(w, h, false);
    kit.frameCamera(camera, model, { azimuth: 0, elevation: parseFloat(el.dataset.elevation ?? 6), margin: 1.2 / (parseFloat(el.dataset.zoom) || 1) });   // room for cursor tilt and the enter scale
    st.dirty = true; kick();
  };

  const progress = () => {
    const trig = el.dataset.scroll ? document.querySelector(el.dataset.scroll) : el;
    if (!trig) return 0;
    const r = trig.getBoundingClientRect();
    if (el.dataset.scrollRange === 'pin') {                             // tall section with a sticky inner: 0 when it hits the top, 1 when it is about to leave
      return Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
    }
    const total = r.height + innerHeight;                               // default: from entering at the bottom to leaving at the top
    return Math.min(1, Math.max(0, (innerHeight - r.top) / total));
  };

  const render = () => {
    renderer.render(scene, camera);
    if (ghost) { scene.overrideMaterial = ghost.override; shadow.visible = false; ghost.renderer.render(scene, camera); scene.overrideMaterial = null; shadow.visible = true; }
  };

  let last = performance.now(), raf = 0;
  const frame = (now) => {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; st.t += dt;
    let moving = false;
    const p = st.pointer; p.x = lerp(p.x, p.tx, 0.08); p.y = lerp(p.y, p.ty, 0.08);
    if (Math.abs(p.x - p.tx) + Math.abs(p.y - p.ty) > 0.001) moving = true;
    if (modes.has('spin') && !still) { st.spin += dt * 0.35; moving = true; }
    if (st.enter < 1) { st.enter = Math.min(1, st.enter + dt / 1.6); moving = true; }
    let k = st.manual || {};
    if (!st.manual && (frames.length || modes.has('scroll'))) {
      const pr = progress();
      k = frames.length ? interpolate(frames, pr) : { rotY: 360 * (parseFloat(el.dataset.turns) || 1) * pr };
    }
    const e = 1 - Math.pow(1 - st.enter, 3);
    pivot.rotation.y = D(k.rotY || 0) + st.spin + (modes.has('cursor') ? p.x * 0.5 : 0) + (1 - e) * -1.4;
    pivot.rotation.x = D(k.rotX || 0) + (modes.has('cursor') ? p.y * 0.25 : 0);
    const floating = modes.has('float') && !still && fine();   // bobbing keeps a phone GPU busy for little gain
    pivot.position.set(k.x || 0, (k.y || 0) + (floating ? Math.sin(st.t * 1.2) * 0.04 : 0), k.z || 0);
    pivot.scale.setScalar((k.scale ?? 1) * (0.6 + 0.4 * e));
    if (floating) moving = true;
    // cursor mask
    if (el.dataset.reveal === 'cursor') {
      const m = st.mask; m.x = lerp(m.x, m.tx, 0.18); m.y = lerp(m.y, m.ty, 0.18); m.r = lerp(m.r, m.tr, 0.12);
      if (!fine() && !still && m.tr < 1) {   // touch: one reveal that opens from the centre, then the stage can go idle
        m.x = m.tx = el.clientWidth / 2; m.y = m.ty = el.clientHeight / 2; m.tr = Math.hypot(el.clientWidth, el.clientHeight);
      }
      canvas.style.setProperty('--mx', m.x.toFixed(1) + 'px'); canvas.style.setProperty('--my', m.y.toFixed(1) + 'px'); canvas.style.setProperty('--mr', Math.max(0, m.r).toFixed(1) + 'px');
      if (Math.abs(m.r - m.tr) > 0.5 || Math.abs(m.x - m.tx) > 0.5) moving = true;
    }
    render();
    if (!el.classList.contains('is-ready')) { el.classList.add('is-ready'); if (poster) poster.setAttribute('aria-hidden', 'true'); }
    st.dirty = false;
    const scrollDriven = frames.length || modes.has('scroll');
    if (!still && st.visible && !document.hidden && (moving || scrollDriven)) { raf = requestAnimationFrame(frame); st.running = true; }
    else st.running = false;
  };
  const kick = () => { if (!raf && st.visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };

  // input
  const onMove = (e) => {
    const r = el.getBoundingClientRect();
    st.pointer.tx = ((e.clientX - r.left) / r.width - 0.5) * 2; st.pointer.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    if (el.dataset.reveal === 'cursor') { st.mask.tx = e.clientX - r.left; st.mask.ty = e.clientY - r.top; st.mask.tr = parseFloat(el.dataset.revealSize) || 220; }
    kick();
  };
  const onLeave = () => { st.pointer.tx = st.pointer.ty = 0; st.mask.tr = 0; kick(); };
  if (!still && fine()) { (el.dataset.reveal === 'cursor' ? el : window).addEventListener('pointermove', onMove, { passive: true }); el.addEventListener('pointerleave', onLeave); }
  if (el.dataset.reveal === 'cursor') { el.classList.add('is-reveal'); if (still) { st.mask.tr = st.mask.r = 9999; st.mask.x = st.mask.tx = el.clientWidth / 2; st.mask.y = st.mask.ty = el.clientHeight / 2; } }
  addEventListener('scroll', kick, { passive: true });
  const ro = new ResizeObserver(size); ro.observe(el);
  const io = new IntersectionObserver(([en]) => { st.visible = en.isIntersecting; if (st.visible) kick(); }, { rootMargin: '10% 0px' }); io.observe(el);
  const vis = () => { if (!document.hidden) kick(); }; document.addEventListener('visibilitychange', vis);
  size();

  const api = {
    THREE, scene, camera, model, pivot, renderer, render: () => { render(); },
    /** drive the stage yourself (GSAP timeline): set({ rotY, rotX, x, y, z, scale }) in degrees and units */
    set(vals) { st.manual = { ...(st.manual || {}), ...vals }; kick(); },
    release() { st.manual = null; kick(); },
    destroy() {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); removeEventListener('scroll', kick); document.removeEventListener('visibilitychange', vis);
      window.removeEventListener('pointermove', onMove); el.removeEventListener('pointermove', onMove);
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); [].concat(o.material || []).forEach((m) => { for (const k in m) if (m[k] && m[k].isTexture) m[k].dispose(); m.dispose(); }); });
      renderer.dispose(); canvas.remove(); if (ghost) { ghost.renderer.dispose(); ghost.canvas.remove(); }
      delete el._stage;
    },
  };
  el._stage = api;
  return api;
}

/** Create a stage for every [data-stage] inside root, lazily: each loads when it nears the viewport. */
export function initStages(root = document) {
  const els = [...root.querySelectorAll('[data-stage]')];
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return; io.unobserve(e.target);
    createStage(e.target).catch((err) => console.warn('stage failed', err));
  }), { rootMargin: '50% 0px' });
  els.forEach((el) => io.observe(el));
  return () => { io.disconnect(); els.forEach((el) => el._stage && el._stage.destroy()); };
}
