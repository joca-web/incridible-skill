/* incridible components: shared helpers.
 * Every component is an ES module exporting init(root = document). It reads data attributes,
 * returns a cleanup function, and degrades to static content when GSAP is missing,
 * prefers-reduced-motion is on, or the pointer is coarse (where that matters).
 * GSAP and its plugins are expected as globals (classic <script> tags), Lenis optionally as window.lenis. */

export const $ = (s, c = document) => c.querySelector(s);
export const $$ = (s, c = document) => [...c.querySelectorAll(s)];

export const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
export const gsapReady = (...plugins) => !!window.gsap && plugins.every((p) => !!window[p]);
export const canAnimate = (...plugins) => gsapReady(...plugins) && !reduceMotion();

/** register whichever of the named plugins are loaded; returns true when all are */
export function usePlugins(...names) {
  const found = names.map((n) => window[n]).filter(Boolean);
  if (window.gsap && found.length) gsap.registerPlugin(...found);
  return found.length === names.length;
}

/** run fn once the element first enters the viewport (IntersectionObserver, no ScrollTrigger needed) */
export function onEnter(el, fn, { rootMargin = '0px 0px -12% 0px', once = true } = {}) {
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { fn(e.target); if (once) io.unobserve(e.target); }
  }), { rootMargin });
  io.observe(el);
  return () => io.disconnect();
}

/** pause a rAF-driven effect while its element is off-screen or the tab is hidden */
export function visibilityGate(el, onChange) {
  let inView = true;
  const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; onChange(inView && !document.hidden); });
  io.observe(el);
  const vis = () => onChange(inView && !document.hidden);
  document.addEventListener('visibilitychange', vis);
  return () => { io.disconnect(); document.removeEventListener('visibilitychange', vis); };
}

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;

/** read a CSS custom property as a colour string */
export const cssVar = (name, el = document.documentElement) => getComputedStyle(el).getPropertyValue(name).trim();

/** parse #rgb, #rrggbb or rgb() into [r,g,b] 0..1 for shaders */
export function toRGB(c) {
  c = (c || '').trim();
  if (c.startsWith('#')) {
    let h = c.slice(1); if (h.length === 3) h = [...h].map((x) => x + x).join('');
    const n = parseInt(h, 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  }
  const m = c.match(/[\d.]+/g); return m ? m.slice(0, 3).map((v) => +v / 255) : [0, 0, 0];
}

/** compile a fullscreen-quad WebGL program; returns null when WebGL is unavailable */
export function glProgram(canvas, frag, { alpha = true } = {}) {
  const gl = canvas.getContext('webgl', { alpha, antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: false });
  if (!gl) return null;
  const vert = 'attribute vec2 p;varying vec2 vUv;void main(){vUv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('webgl: ' + gl.getShaderInfoLog(s)); return null; } return s; };
  const v = sh(gl.VERTEX_SHADER, vert), f = sh(gl.FRAGMENT_SHADER, frag);
  if (!v || !f) return null;
  const prog = gl.createProgram(); gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn('webgl: ' + gl.getProgramInfoLog(prog)); return null; }
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = new Proxy({}, { get: (c, k) => (k in c ? c[k] : (c[k] = gl.getUniformLocation(prog, k))) });
  const resize = (maxDPR = 2) => {
    const d = Math.min(devicePixelRatio || 1, maxDPR);
    const w = Math.max(2, Math.round(canvas.clientWidth * d)), h = Math.max(2, Math.round(canvas.clientHeight * d));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h); return [w, h];
  };
  const draw = () => gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  const dispose = () => { gl.deleteBuffer(buf); gl.deleteProgram(prog); const x = gl.getExtension('WEBGL_lose_context'); x && x.loseContext(); };
  return { gl, prog, u, resize, draw, dispose };
}

/** smallest shared ticker: GSAP's when present, rAF otherwise */
export function tick(fn) {
  if (window.gsap) { gsap.ticker.add(fn); return () => gsap.ticker.remove(fn); }
  let id, last = performance.now();
  const loop = (t) => { fn(t / 1000, t - last); last = t; id = requestAnimationFrame(loop); };
  id = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(id);
}

/** current scroll velocity in px per frame, from Lenis if present, else measured */
let _lastY = scrollY, _vel = 0;
addEventListener('scroll', () => { _vel = scrollY - _lastY; _lastY = scrollY; }, { passive: true });
export const scrollVelocity = () => (window.lenis && typeof window.lenis.velocity === 'number' ? window.lenis.velocity : (_vel *= 0.9));
