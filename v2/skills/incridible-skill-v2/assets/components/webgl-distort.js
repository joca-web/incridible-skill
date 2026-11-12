/* webgl-distort.js: images rendered through a shader that ripples under the cursor and splits RGB
 * with scroll speed. The <img> stays in the DOM for alt text and as the fallback.
 *   <figure data-distort><img src="work.webp" alt="…" width="1200" height="1500"></figure>
 *   data-distort-strength="1"  (0.5 subtle … 2 loud)
 *   data-distort-scroll          also wave and split RGB with scroll speed (off by default: every visible
 *                                image then redraws while scrolling, which costs one WebGL draw each per frame)
 * Fine pointer only, at most 8 per page, paused off-screen. The image must be same-origin or CORS-enabled. */
import { $, $$, canAnimate, finePointer, glProgram, visibilityGate, scrollVelocity, clamp } from './core.js';

const FRAG = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uScale, uMouse;
uniform float uHover, uTime, uVel, uAspect, uStrength;
void main() {
  vec2 uv = (vUv - 0.5) * uScale * (1.0 - 0.05 * uHover) + 0.5;
  vec2 d = vUv - uMouse; d.x *= uAspect;
  float dist = length(d);
  float w = smoothstep(0.5, 0.0, dist) * uHover;
  uv += normalize(d + 1e-5) * sin(dist * 26.0 - uTime * 4.0) * 0.012 * w * uStrength;
  uv.y += sin(uv.x * 7.0 + uTime * 1.5) * 0.006 * uVel * uStrength;
  float s = (0.006 * uVel + 0.004 * w) * uStrength;
  vec4 c = vec4(texture2D(uTex, uv + vec2(s, 0.0)).r, texture2D(uTex, uv).g, texture2D(uTex, uv - vec2(s, 0.0)).b, 1.0);
  gl_FragColor = c;
}`;

function setup(fig) {
  const img = $('img', fig);
  if (!img) return null;
  const canvas = document.createElement('canvas');
  canvas.className = 'distort-canvas'; canvas.setAttribute('aria-hidden', 'true');
  fig.appendChild(canvas);
  const p = glProgram(canvas, FRAG);
  if (!p) { canvas.remove(); return null; }
  const { gl, u, resize, draw, dispose } = p;
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach((k) => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.uniform1i(u.uTex, 0);
  gl.uniform1f(u.uStrength, parseFloat(fig.dataset.distortStrength) || 1);

  const onScroll = fig.hasAttribute('data-distort-scroll');
  const st = { hover: 0, hoverT: 0, mx: 0.5, my: 0.5, vel: 0, t: 0, running: false, visible: true, ready: false };
  const fit = () => {
    const [w, h] = resize();
    const ca = w / h, ia = img.naturalWidth / img.naturalHeight;
    gl.uniform2f(u.uScale, ca > ia ? 1 : ca / ia, ca > ia ? ia / ca : 1);
    gl.uniform1f(u.uAspect, ca);
  };
  const upload = () => {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img); } catch (e) { console.warn('webgl-distort: image not usable as texture (CORS?)', e.message); return false; }
    fit(); st.ready = true; fig.classList.add('is-gl'); frame(); return true;
  };
  let raf = 0;
  const frame = () => {
    raf = 0;
    if (!st.ready) return;
    st.t += 0.016;
    st.hover += (st.hoverT - st.hover) * 0.08;
    st.vel += ((onScroll ? clamp(Math.abs(scrollVelocity()) / 12, 0, 3) : 0) - st.vel) * 0.1;
    gl.uniform1f(u.uHover, st.hover); gl.uniform1f(u.uVel, st.vel); gl.uniform1f(u.uTime, st.t);
    gl.uniform2f(u.uMouse, st.mx, st.my);
    draw();
    const busy = st.hoverT > 0 || st.hover > 0.002 || st.vel > 0.01;
    if (busy && st.visible) raf = requestAnimationFrame(frame); else st.running = false;
  };
  const kick = () => { if (!raf && st.ready && st.visible) { st.running = true; raf = requestAnimationFrame(frame); } };

  const move = (e) => { const r = fig.getBoundingClientRect(); st.mx = (e.clientX - r.left) / r.width; st.my = 1 - (e.clientY - r.top) / r.height; kick(); };
  const enter = () => { st.hoverT = 1; kick(); };
  const leave = () => { st.hoverT = 0; kick(); };
  fig.addEventListener('pointermove', move); fig.addEventListener('pointerenter', enter); fig.addEventListener('pointerleave', leave);
  if (onScroll) addEventListener('scroll', kick, { passive: true });
  const ro = new ResizeObserver(() => { if (st.ready) { fit(); draw(); } }); ro.observe(fig);
  const gate = visibilityGate(fig, (v) => { st.visible = v; if (v) kick(); });
  if (img.complete && img.naturalWidth) upload(); else img.addEventListener('load', upload, { once: true });

  return () => {
    cancelAnimationFrame(raf); ro.disconnect(); gate();
    fig.removeEventListener('pointermove', move); fig.removeEventListener('pointerenter', enter); fig.removeEventListener('pointerleave', leave);
    removeEventListener('scroll', kick); gl.deleteTexture(tex); dispose(); canvas.remove(); fig.classList.remove('is-gl');
  };
}

export function init(root = document) {
  const figs = $$('[data-distort]', root).slice(0, 8);
  if (!figs.length || !canAnimate() || !finePointer()) return () => {};
  const cleanups = figs.map(setup).filter(Boolean);
  return () => cleanups.forEach((c) => c());
}
