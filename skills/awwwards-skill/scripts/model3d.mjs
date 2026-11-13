#!/usr/bin/env node
// model3d.mjs: build, look at and export 3D models (awwwards-skill). Node 22 + Chrome, no installs.
//
//   node model3d.mjs models/helmet.js                 build the model, render views, export .glb
//   node model3d.mjs models/bottle.js --param color=#7a1f2b --param label="No. 7"
//   node model3d.mjs scene.glb                        inspect an existing .glb (views + stats)
//   node model3d.mjs models/helmet.js --frames 36     also save a 360° turntable (frames, then filmstrip.py --gif)
//
// Options: --out DIR (default .awwwards/models), --views 6, --size 560, --bg "#ececec",
//          --frames N, --no-glb, --poster (also <name>-poster.png: transparent 3/4 view for web fallbacks), --vendor DIR (serve three from a local folder when CDNs are blocked),
//          --three 0.187.0 (CDN version), --chrome PATH
//
// A model module exports `default function build({ THREE, kit, params })` returning an Object3D, and
// optionally `export const meta = { name, camera: { fov, elevation }, background }`.
// Writes <name>-views.png (front, 3/4, side, back, other 3/4, top), <name>.glb, <name>-report.json,
// and turntable frames <name>-turn-NN.jpg. Exit code 1 when the build fails or validate() finds problems.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const KIT = path.resolve(HERE, '../assets/three/kit.js');
const argv = process.argv.slice(2);
const input = argv.find((a, i) => !a.startsWith('--') && !(argv[i - 1] || '').match(/^--(out|views|size|bg|frames|vendor|three|chrome|param)$/));
const opt = (n, d) => { const i = argv.indexOf('--' + n); return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : d; };
const flag = (n) => argv.includes('--' + n);
if (!input) { console.error('usage: node model3d.mjs <model.js | model.glb> [--out DIR] [--param k=v] [--frames N] [--views 6] [--size 560] [--vendor DIR]'); process.exit(2); }
const INPUT = path.resolve(input);
if (!fs.existsSync(INPUT)) { console.error('not found: ' + INPUT); process.exit(2); }
const OUT = path.resolve(opt('out', '.awwwards/models'));
const VIEWS = Math.max(1, Math.min(6, parseInt(opt('views', '6'), 10)));
const SIZE = parseInt(opt('size', '560'), 10);
const FRAMES = parseInt(opt('frames', '0'), 10);
const THREE_V = opt('three', '0.187.0');
const VENDOR = opt('vendor') ? path.resolve(opt('vendor')) : null;
const params = {};
argv.forEach((a, i) => { if (a === '--param' && argv[i + 1]) { const [k, ...v] = argv[i + 1].split('='); params[k] = v.join('='); } });
fs.mkdirSync(OUT, { recursive: true });

// ---------- tiny static server: harness page, kit, the model's folder, optional vendored three ----------
const MIME = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.bin': 'application/octet-stream', '.svg': 'image/svg+xml', '.html': 'text/html' };
const cdn = `https://cdn.jsdelivr.net/npm/three@${THREE_V}`;
const importMap = VENDOR
  ? { imports: { three: '/vendor/three.module.js', 'three/addons/': '/vendor/addons/' } }
  : { imports: { three: `${cdn}/build/three.module.js`, 'three/addons/': `${cdn}/examples/jsm/` } };
const HARNESS = `<!doctype html><html><head><meta charset="utf-8"><script type="importmap">${JSON.stringify(importMap)}</script></head>
<body style="margin:0;background:#222"><script type="module">
import * as THREE from 'three';
import * as kit from '/kit/kit.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
window.__ready = true;
window.run = async (o) => {
  const out = { errors: [] };
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: true });
  renderer.setPixelRatio(1); renderer.setSize(o.size, o.size);
  renderer.toneMapping = THREE.NeutralToneMapping;   // keeps brand colours true (ACES washes out saturated paint) renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  let obj, meta = {};
  if (o.glb) {
    const gltf = await new GLTFLoader().loadAsync(o.src); obj = gltf.scene; meta = { name: o.name };
  } else {
    const mod = await import(o.src);
    meta = mod.meta || {};
    obj = await mod.default({ THREE, kit, params: o.params });
    if (!obj || !obj.isObject3D) throw new Error('build() must return a THREE.Object3D (got ' + typeof obj + ')');
  }
  scene.background = new THREE.Color(o.bg || meta.background || '#ececec');
  kit.studio(renderer, scene, meta.light || {});
  scene.add(obj);
  obj.updateMatrixWorld(true);
  if (meta.shadow !== false) scene.add(kit.contactShadow(obj));
  const cam = new THREE.PerspectiveCamera((meta.camera && meta.camera.fov) || 30, 1, 0.01, 100);
  const elev = (meta.camera && meta.camera.elevation) ?? 10;
  const views = [['front', 0, elev], ['three-quarter', 35, elev + 6], ['side', 90, elev], ['back', 180, elev], ['other three-quarter', -35, elev + 6], ['top', 0, 70]].slice(0, o.views);
  const cell = o.size, cols = Math.min(3, views.length), rows = Math.ceil(views.length / cols);
  const sheet = document.createElement('canvas'); sheet.width = cols * cell; sheet.height = rows * cell + rows * 26;
  const sx = sheet.getContext('2d'); sx.fillStyle = '#1b1b1b'; sx.fillRect(0, 0, sheet.width, sheet.height);
  views.forEach(([label, az, el], i) => {
    kit.frameCamera(cam, obj, { azimuth: az, elevation: el });
    renderer.render(scene, cam);
    const x = (i % cols) * cell, y = Math.floor(i / cols) * (cell + 26);
    sx.drawImage(renderer.domElement, x, y + 26);
    sx.fillStyle = '#ddd'; sx.font = '600 15px system-ui, sans-serif'; sx.fillText(label + '  (' + az + '°, ' + el + '°)', x + 10, y + 18);
  });
  out.sheet = sheet.toDataURL('image/png');
  out.frames = [];
  for (let f = 0; f < o.frames; f++) {
    kit.frameCamera(cam, obj, { azimuth: (360 * f) / o.frames, elevation: elev + 4 });
    renderer.render(scene, cam); out.frames.push(renderer.domElement.toDataURL('image/jpeg', 0.85));
  }
  if (o.poster) {                                    // transparent 3/4 view, 2x size, no shadow: <img> fallback for stage.js
    const bg = scene.background; scene.background = null; renderer.setClearColor(0x000000, 0);
    const sh = scene.getObjectByName('contact-shadow'); if (sh) sh.visible = false;
    renderer.setSize(o.size * 2, o.size * 2); kit.frameCamera(cam, obj, { azimuth: 25, elevation: elev + 4, margin: 1.05 });
    renderer.render(scene, cam); out.poster = renderer.domElement.toDataURL('image/png');
    renderer.setSize(o.size, o.size); scene.background = bg; if (sh) sh.visible = true;
  }
  out.stats = kit.stats(obj); out.issues = kit.validate(obj); out.meta = { name: meta.name || o.name, description: meta.description || '' };
  if (o.glb === false && o.exportGlb) {
    const ab = await new GLTFExporter().parseAsync(obj, { binary: true, maxTextureSize: 2048 });
    const bytes = new Uint8Array(ab); let s = ''; const CH = 0x8000;
    for (let i = 0; i < bytes.length; i += CH) s += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
    out.glb = btoa(s);
  }
  return out;
};
</script></body></html>`;

const modelDir = path.dirname(INPUT);
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = null;
  if (u === '/' || u === '/index.html') { res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end(HARNESS); }
  if (u === '/favicon.ico') { res.writeHead(204); return res.end(); }
  const inside = (f, root) => path.resolve(f).startsWith(path.resolve(root) + path.sep);
  if (u === '/kit/kit.js') file = KIT;
  else if (u.startsWith('/m/')) { file = path.join(modelDir, u.slice(3)); if (!inside(file, modelDir)) file = null; }   // the model's own folder only
  else if (u.startsWith('/vendor/') && VENDOR) file = path.join(VENDOR, path.basename(u));   // flat folder: match by file name
  if (!file || !fs.existsSync(file)) { res.writeHead(404); return res.end('not found: ' + u); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Access-Control-Allow-Origin': '*' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const PORT = server.address().port;

// ---------- chrome over CDP ----------
function findChrome() {
  const given = opt('chrome', process.env.CHROME_PATH); if (given) return given;
  return ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find((p) => fs.existsSync(p));
}
const chrome = findChrome();
if (!chrome) { console.error('Chrome/Chromium/Edge not found. Pass --chrome PATH or set CHROME_PATH.'); process.exit(2); }
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'awwwards-3d-'));
const proc = spawn(chrome, ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars', '--no-first-run',
  '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'],
  { stdio: ['ignore', 'ignore', 'pipe'] });
const wsUrl = await new Promise((res, rej) => {
  let b = ''; const t = setTimeout(() => rej(new Error('Chrome did not start')), 20000);
  proc.stderr.on('data', (d) => { b += d; const m = b.match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(t); res(m[1]); } });
});
const ws = new WebSocket(wsUrl); await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pend = new Map(); const logs = [];
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); return; }
  if (m.method === 'Runtime.exceptionThrown') logs.push('exception: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).split('\n').slice(0, 3).join(' | '));
  if (m.method === 'Runtime.consoleAPICalled' && /error|warning/.test(m.params.type)) logs.push(m.params.type + ': ' + (m.params.args || []).map((a) => a.value ?? a.description).join(' ').slice(0, 300));
  if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') logs.push('net: ' + m.params.entry.text.slice(0, 200) + ' ' + (m.params.entry.url || ''));
});
const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
const close = () => { try { ws.close(); } catch {} proc.kill('SIGKILL'); server.close(); try { fs.rmSync(profile, { recursive: true, force: true }); } catch {} };

let code = 0;
try {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const S = (m, p) => send(m, p, sessionId);
  await S('Runtime.enable'); await S('Log.enable'); await S('Page.enable');
  await S('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
  for (let i = 0; i < 100; i++) { const r = await S('Runtime.evaluate', { expression: '!!window.__ready', returnByValue: true }); if (r.result.value) break; await new Promise((r) => setTimeout(r, 150)); if (i === 99) throw new Error('harness did not load (three.js unreachable? try --vendor)'); }
  const isGlb = /\.glb$|\.gltf$/i.test(INPUT);
  const name = (path.basename(INPUT).replace(/\.(m?js|glb|gltf)$/i, '')) + (Object.keys(params).length ? '-' + Object.values(params).join('-').replace(/[^\w-]+/g, '').slice(0, 30) : '');
  const o = { src: `/m/${path.basename(INPUT)}?v=${Date.now()}`, glb: isGlb, name, params, size: SIZE, views: VIEWS, frames: FRAMES, bg: opt('bg'), exportGlb: !flag('no-glb'), poster: flag('poster') };
  const r = await S('Runtime.evaluate', { expression: `window.run(${JSON.stringify(o)})`, awaitPromise: true, returnByValue: true, timeout: 180000 });
  if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception?.description || r.exceptionDetails.text).split('\n').slice(0, 4).join('\n'));
  const out = r.result.value;
  const save = (file, dataUrl) => fs.writeFileSync(path.join(OUT, file), Buffer.from(dataUrl.split(',')[1], 'base64'));
  save(`${name}-views.png`, out.sheet);
  if (out.poster) save(`${name}-poster.png`, out.poster);
  out.frames.forEach((f, i) => save(`${name}-turn-${String(i).padStart(2, '0')}.jpg`, f));
  if (out.glb) fs.writeFileSync(path.join(OUT, `${name}.glb`), Buffer.from(out.glb, 'base64'));
  const glbBytes = out.glb ? Buffer.byteLength(out.glb, 'base64') : (isGlb ? fs.statSync(INPUT).size : 0);
  const report = { model: INPUT, params, ...out.meta, stats: out.stats, glbKB: Math.round(glbBytes / 1024), issues: out.issues, console: logs };
  fs.writeFileSync(path.join(OUT, `${name}-report.json`), JSON.stringify(report, null, 2));
  const s = out.stats;
  console.log(`${name}: ${s.meshes} meshes, ${s.triangles.toLocaleString()} triangles, ${s.materials} materials, ${s.textures} textures, size ${s.size.join(' x ')}${glbBytes ? `, glb ${Math.round(glbBytes / 1024)} KB` : ''}`);
  console.log(`views: ${path.join(OUT, name + '-views.png')}${out.frames.length ? `\nturntable: ${out.frames.length} frames (python3 filmstrip.py ${OUT} --pattern "${name}-turn-*.jpg" --gif)` : ''}${out.glb ? `\nglb: ${path.join(OUT, name + '.glb')}` : ''}`);
  if (out.issues.length) { console.log('ISSUES:\n- ' + out.issues.join('\n- ')); code = 1; }
  const bad = logs.filter((l) => /^exception|^error|^net/.test(l));
  if (bad.length) { console.log('CONSOLE:\n- ' + bad.slice(0, 6).join('\n- ')); }
  console.log('Look at the views image before using the model: proportions, gaps, z-fighting, flat or blown-out materials.');
} catch (e) {
  console.error('BUILD FAILED: ' + e.message);
  if (logs.length) console.error('console:\n- ' + logs.slice(0, 8).join('\n- '));
  code = 1;
} finally { close(); }
process.exit(code);
