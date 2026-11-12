/*
 * depth-hero.js: dependency-free WebGL depth-parallax hero (incridible-skill).
 *
 * A colour image plus a grayscale depth map (white = near, black = far), same framing.
 * The image shifts per pixel by depth as the pointer moves, so the subject seems to sit in
 * 3D space. Optional soft ripple under the cursor. Cover-fits its canvas.
 *
 *   import { DepthHero } from './depth-hero.js';        // also sets window.DepthHero
 *   const hero = await DepthHero.create(canvas, {
 *     image: 'hero.webp', depth: 'hero-depth.webp',
 *     strength: 0.035, ripple: 0.4, zoom: 1.06, maxDPR: 2,
 *     fallback: document.querySelector('.hero__fallback'),   // hidden after the first frame
 *   });
 *   // hero === null when WebGL or the images are unavailable: keep the fallback visible.
 *   hero.destroy();
 *
 * Behaviour: pauses off-screen and in hidden tabs, renders one still frame under
 * prefers-reduced-motion, sways gently when the pointer is idle, supports device tilt via
 * hero.enableTilt() (call from a user gesture, required by iOS), releases GPU memory on destroy.
 */

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uImg;
uniform sampler2D uDepth;
uniform vec2 uScale;      // cover fit and zoom
uniform vec2 uMouse;      // smoothed pointer, -1..1
uniform vec2 uPtr;        // pointer in 0..1, y up
uniform float uPtrOn;     // 0..1 fade of the ripple
uniform float uStrength;
uniform float uRipple;
uniform float uTime;
uniform float uAspect;
void main() {
  vec2 uv = (vUv - 0.5) * uScale + 0.5;
  float d = texture2D(uDepth, uv).r;
  vec2 p = uv - uMouse * (d - 0.5) * uStrength;
  if (uRipple > 0.0) {
    vec2 dp = vUv - uPtr; dp.x *= uAspect;
    float dist = length(dp);
    float w = exp(-dist * dist * 14.0) * uPtrOn;
    p += normalize(dp + 1e-5) * sin(dist * 38.0 - uTime * 3.0) * 0.0045 * uRipple * w;
  }
  gl_FragColor = vec4(texture2D(uImg, clamp(p, 0.0, 1.0)).rgb, 1.0);
}
`;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('depth-hero: could not load ' + src));
    img.src = src;
  });
}

export class DepthHero {
  static async create(canvas, opts = {}) {
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'high-performance' });
    if (!gl) return null;
    let img, dep;
    try { [img, dep] = await Promise.all([loadImage(opts.image), loadImage(opts.depth)]); } catch (e) { console.warn(e.message); return null; }
    const hero = new DepthHero(canvas, gl, img, dep, opts);
    if (!hero.ok) return null;
    await hero.ready;
    return hero;
  }

  constructor(canvas, gl, img, dep, opts) {
    this.canvas = canvas; this.gl = gl; this.img = img; this.dep = dep;
    this.o = Object.assign({ strength: 0.035, ripple: 0.4, zoom: 1.06, maxDPR: 2, fallback: null, idleSway: true }, opts);
    this.reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.mouse = { x: 0, y: 0 }; this.target = { x: 0, y: 0 };
    this.ptr = { x: 0.5, y: 0.5 }; this.ptrOn = 0; this.ptrTarget = 0;
    this.lastMove = -1e9; this.time = 0; this.visible = true; this.running = false; this.destroyed = false;
    this.ok = this._init();
    if (!this.ok) return;
    this.ready = new Promise((r) => { this._resolveReady = r; });
    this._bind();
    this._resize();
    this._frame(performance.now(), true);
    this._kick();
  }

  _init() {
    const gl = this.gl;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; } return s; };
    const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return false;
    const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(prog)); return false; }
    this.prog = prog; gl.useProgram(prog);
    this.buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const tex = (image, unit) => {
      const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    };
    this.tImg = tex(this.img, 0); this.tDep = tex(this.dep, 1);
    this.u = {};
    ['uImg', 'uDepth', 'uScale', 'uMouse', 'uPtr', 'uPtrOn', 'uStrength', 'uRipple', 'uTime', 'uAspect'].forEach((n) => (this.u[n] = gl.getUniformLocation(prog, n)));
    gl.uniform1i(this.u.uImg, 0); gl.uniform1i(this.u.uDepth, 1);
    return true;
  }

  _bind() {
    const c = this.canvas;
    this._onMove = (e) => {
      const r = c.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height;
      this.target.x = (nx - 0.5) * 2; this.target.y = -(ny - 0.5) * 2;
      this.ptr.x = nx; this.ptr.y = 1 - ny; this.ptrTarget = 1; this.lastMove = performance.now();
      this._kick();
    };
    this._onLeave = () => { this.ptrTarget = 0; this.lastMove = performance.now(); this._kick(); };
    this._onTilt = (e) => {
      if (e.gamma == null) return;
      this.target.x = Math.max(-1, Math.min(1, e.gamma / 25)); this.target.y = Math.max(-1, Math.min(1, (e.beta - 45) / 25));
      this.lastMove = performance.now(); this._kick();
    };
    window.addEventListener('pointermove', this._onMove, { passive: true });
    c.addEventListener('pointerleave', this._onLeave);
    this._ro = new ResizeObserver(() => { this._resize(); this._kick(); });
    this._ro.observe(c);
    this._io = new IntersectionObserver(([en]) => { this.visible = en.isIntersecting; if (this.visible) this._kick(); }, { threshold: 0 });
    this._io.observe(c);
    this._onVis = () => { if (!document.hidden) this._kick(); };
    document.addEventListener('visibilitychange', this._onVis);
    this._onLost = (e) => { e.preventDefault(); this.running = false; if (this.o.fallback) this.o.fallback.hidden = false; };
    this._onRestored = () => { this.ok = this._init(); this._resize(); this._kick(); };
    c.addEventListener('webglcontextlost', this._onLost);
    c.addEventListener('webglcontextrestored', this._onRestored);
  }

  enableTilt() {
    const start = () => window.addEventListener('deviceorientation', this._onTilt);
    const D = window.DeviceOrientationEvent;
    if (D && typeof D.requestPermission === 'function') return D.requestPermission().then((s) => s === 'granted' && start()).catch(() => {});
    start();
  }

  _resize() {
    const c = this.canvas, dpr = Math.min(window.devicePixelRatio || 1, this.o.maxDPR);
    const w = Math.max(2, Math.round(c.clientWidth * dpr)), h = Math.max(2, Math.round(c.clientHeight * dpr));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    this.gl.viewport(0, 0, w, h);
    const ca = w / h, ia = this.img.naturalWidth / this.img.naturalHeight;
    const fx = ca > ia ? 1 : ca / ia, fy = ca > ia ? ia / ca : 1;
    this.fit = [fx / this.o.zoom, fy / this.o.zoom]; this.aspect = ca;
  }

  _kick() { if (this.destroyed || this.running || !this.visible || document.hidden) return; if (this.reduce) { this._frame(performance.now(), true); return; } this.running = true; this._last = performance.now(); requestAnimationFrame((t) => this._frame(t)); }

  _frame(now, once = false) {
    if (this.destroyed || !this.ok) return;
    const gl = this.gl;
    const dt = Math.min(0.05, ((now - (this._last || now)) / 1000) || 0.016); this._last = now; this.time += dt;
    if (!this.reduce) {
      const idle = now - this.lastMove > 2500;
      if (idle && this.o.idleSway) { this.target.x = Math.sin(this.time * 0.45) * 0.45; this.target.y = Math.cos(this.time * 0.33) * 0.25; }
      this.mouse.x += (this.target.x - this.mouse.x) * 0.06; this.mouse.y += (this.target.y - this.mouse.y) * 0.06;
      this.ptrOn += (this.ptrTarget - this.ptrOn) * 0.08;
    } else { this.mouse.x = this.mouse.y = 0; this.ptrOn = 0; }
    const u = this.u;
    gl.useProgram(this.prog);
    gl.uniform2f(u.uScale, this.fit[0], this.fit[1]);
    gl.uniform2f(u.uMouse, this.mouse.x, this.mouse.y);
    gl.uniform2f(u.uPtr, this.ptr.x, this.ptr.y);
    gl.uniform1f(u.uPtrOn, this.ptrOn);
    gl.uniform1f(u.uStrength, this.o.strength);
    gl.uniform1f(u.uRipple, this.reduce ? 0 : this.o.ripple);
    gl.uniform1f(u.uTime, this.time);
    gl.uniform1f(u.uAspect, this.aspect);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (this._resolveReady) {
      this._resolveReady(true); this._resolveReady = null;
      this.canvas.dataset.ready = '1';
      if (this.o.fallback) this.o.fallback.hidden = true;
    }
    if (once || this.reduce) { this.running = false; return; }
    const settled = Math.abs(this.target.x - this.mouse.x) < 0.0005 && Math.abs(this.target.y - this.mouse.y) < 0.0005 && this.ptrOn < 0.001 && !this.o.idleSway;
    if (this.destroyed || !this.visible || document.hidden || settled) { this.running = false; return; }
    requestAnimationFrame((t) => this._frame(t));
  }

  destroy() {
    this.destroyed = true; this.running = false;
    window.removeEventListener('pointermove', this._onMove);
    window.removeEventListener('deviceorientation', this._onTilt);
    this.canvas.removeEventListener('pointerleave', this._onLeave);
    this.canvas.removeEventListener('webglcontextlost', this._onLost);
    this.canvas.removeEventListener('webglcontextrestored', this._onRestored);
    document.removeEventListener('visibilitychange', this._onVis);
    this._ro && this._ro.disconnect(); this._io && this._io.disconnect();
    const gl = this.gl;
    if (gl) { gl.deleteTexture(this.tImg); gl.deleteTexture(this.tDep); gl.deleteBuffer(this.buf); gl.deleteProgram(this.prog); const ext = gl.getExtension('WEBGL_lose_context'); ext && ext.loseContext(); }
  }
}

if (typeof window !== 'undefined') window.DepthHero = DepthHero;
