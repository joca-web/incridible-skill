/* shader-bg.js: a living gradient (domain-warped noise) with film grain, behind a section.
 *   <section data-shader-bg="#0f0e0d, #ff4d1c, #f2efe9" data-grain="0.06" data-speed="1" data-resolution="0.6"> … </section>
 *   data-resolution: internal pixel ratio (0.6 default; the field is soft, so low resolution costs nothing visible)
 * Colours default to the CSS variables --bg, --accent, --ink. The pointer bends the field gently.
 * Reduced motion renders one still frame. Paused off-screen. The section keeps its CSS background as
 * the fallback, so set one. */
import { $$, reduceMotion, finePointer, glProgram, visibilityGate, toRGB, cssVar } from './core.js';

const FRAG = `
precision mediump float;
varying vec2 vUv;
uniform vec3 uC1, uC2, uC3;
uniform vec2 uRes, uMouse;
uniform float uTime, uGrain, uAspect;
float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h(i), h(i + vec2(1, 0)), u.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), u.x), u.y); }
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * n(p); p *= 2.03; a *= 0.5; } return v; }
void main() {
  vec2 p = vUv * vec2(uAspect, 1.0) * 1.8;
  vec2 q = vec2(fbm(p + uTime * 0.04), fbm(p + vec2(5.2, 1.3) - uTime * 0.035));
  vec2 m = (uMouse - 0.5) * vec2(uAspect, 1.0);
  float f = fbm(p + 2.2 * q + m * 0.5);
  vec3 col = mix(uC1, uC2, smoothstep(0.35, 0.85, f));
  col = mix(col, uC3, smoothstep(0.6, 1.1, f * length(q) * 1.6) * 0.6);
  col += (h(vUv * uRes + fract(uTime)) - 0.5) * uGrain;
  gl_FragColor = vec4(col, 1.0);
}`;

export function init(root = document) {
  const els = $$('[data-shader-bg]', root);
  if (!els.length) return () => {};
  const cleanups = [];
  els.forEach((el) => {
    const canvas = document.createElement('canvas');
    canvas.className = 'shader-bg'; canvas.setAttribute('aria-hidden', 'true');
    el.prepend(canvas);
    const p = glProgram(canvas, FRAG, { alpha: false });
    if (!p) { canvas.remove(); return; }
    const { gl, u, resize, draw, dispose } = p;
    const given = (el.dataset.shaderBg || '').split(',').map((s) => s.trim()).filter(Boolean);
    const [c1, c2, c3] = [given[0] || cssVar('--bg') || '#111', given[1] || cssVar('--accent') || '#f40', given[2] || cssVar('--ink') || '#eee'].map(toRGB);
    gl.uniform3f(u.uC1, ...c1); gl.uniform3f(u.uC2, ...c2); gl.uniform3f(u.uC3, ...c3);
    gl.uniform1f(u.uGrain, el.dataset.grain ? parseFloat(el.dataset.grain) : 0.06);
    const speed = parseFloat(el.dataset.speed) || 1;
    const still = reduceMotion();
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    let t = Math.random() * 50, raf = 0, on = true;
    // soft noise needs no detail: render below device resolution and let the browser upscale
    const size = () => { const [w, h] = resize(parseFloat(el.dataset.resolution) || 0.6); gl.uniform2f(u.uRes, w, h); gl.uniform1f(u.uAspect, w / h); };
    const frame = () => {
      raf = 0;
      t += 0.016 * speed;
      mouse.x += (mouse.tx - mouse.x) * 0.04; mouse.y += (mouse.ty - mouse.y) * 0.04;
      gl.uniform1f(u.uTime, t); gl.uniform2f(u.uMouse, mouse.x, mouse.y);
      draw();
      if (on && !still) raf = requestAnimationFrame(frame);
    };
    const move = (e) => { const r = el.getBoundingClientRect(); mouse.tx = (e.clientX - r.left) / r.width; mouse.ty = 1 - (e.clientY - r.top) / r.height; };
    if (finePointer()) el.addEventListener('pointermove', move);
    const ro = new ResizeObserver(() => { size(); if (still || !raf) draw(); }); ro.observe(el);
    const gate = visibilityGate(el, (v) => { on = v; if (v && !raf && !still) raf = requestAnimationFrame(frame); });
    size(); frame();
    el.classList.add('has-shader');
    cleanups.push(() => { on = false; cancelAnimationFrame(raf); ro.disconnect(); gate(); el.removeEventListener('pointermove', move); dispose(); canvas.remove(); el.classList.remove('has-shader'); });
  });
  return () => cleanups.forEach((c) => c());
}
