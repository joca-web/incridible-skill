#!/usr/bin/env node
// shoot.mjs v2: zero-dependency real-browser inspector for incridible-skill.
// Needs Node 22+ (global WebSocket, fetch) and an installed Chrome, Chromium or Edge.
//
//   node shoot.mjs <url> [--out DIR] [--widths 1440,768,390] [--steps 10] [--settle 3200]
//                        [--vendor DIR] [--block-cdn] [--no-reduced] [--no-motion] [--chrome PATH]
//
// Passes per width: static checks, stepped scroll screenshots, full page, then a MOTION pass
// (real wheel or touch scrolling through Lenis/ScrollTrigger, frame timing, screencast frames),
// a POINTER pass (hover every interactive element) and a KEYBOARD pass (visible focus).
// --vendor DIR serves CDN scripts (jsdelivr, unpkg, cdnjs) from DIR by file name, so a page can be
//   tested offline with real libraries. --block-cdn simulates the libraries failing to load.
// Writes report.md, report.json, w<W>-s<N>.png, w<W>-full.png, w<W>-motion-<N>.jpg to DIR.
// Exit code 1 when any FAIL is found.

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// ---------- args ----------
const argv = process.argv.slice(2);
const url = argv.find((a) => !a.startsWith('--'));
const opt = (name, def) => {
  const i = argv.indexOf('--' + name);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : def;
};
const flag = (name) => argv.includes('--' + name);
if (!url) {
  console.error('usage: node shoot.mjs <url> [--out DIR] [--widths 1440,768,390] [--steps 10] [--settle 3200] [--vendor DIR] [--block-cdn] [--no-reduced] [--no-motion] [--chrome PATH]');
  process.exit(2);
}
const OUT = path.resolve(opt('out', '.incridible/shoot'));
const WIDTHS = opt('widths', '1440,768,390').split(',').map((n) => parseInt(n, 10)).filter(Boolean);
const STEPS = Math.max(2, parseInt(opt('steps', '10'), 10));
const SETTLE = parseInt(opt('settle', '3200'), 10);
const VENDOR = opt('vendor') ? path.resolve(opt('vendor')) : null;
if (VENDOR && !fs.existsSync(VENDOR)) { console.error('--vendor folder not found: ' + VENDOR); process.exit(2); }
const CDN_PATTERNS = ['*cdn.jsdelivr.net*', '*cdnjs.cloudflare.com*', '*unpkg.com*', '*cdn.skypack.dev*', '*esm.sh*'];
const MIME = { '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm' };
const HEIGHTS = { 1440: 900, 1920: 1080, 1280: 800, 1024: 768, 768: 1024, 390: 844, 375: 812, 320: 640 };
fs.mkdirSync(OUT, { recursive: true });

// ---------- find chrome ----------
function findChrome() {
  const given = opt('chrome', process.env.CHROME_PATH);
  if (given) return given;
  const candidates = [
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  return candidates.find((p) => fs.existsSync(p));
}

// ---------- minimal CDP client ----------
class CDP {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map(); this.handlers = [];
    ws.addEventListener('message', (e) => {
      const m = JSON.parse(e.data);
      if (m.id) {
        const p = this.pending.get(m.id);
        if (p) { this.pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); }
      } else this.handlers.forEach((h) => h(m));
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    const msg = { id, method, params };
    if (sessionId) msg.sessionId = sessionId;
    this.ws.send(JSON.stringify(msg));
    return new Promise((res, rej) => this.pending.set(id, { res, rej }));
  }
  on(h) { this.handlers.push(h); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch() {
  const chrome = findChrome();
  if (!chrome) throw new Error('Chrome/Chromium/Edge not found. Pass --chrome PATH or set CHROME_PATH.');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'incridible-chrome-'));
  const proc = spawn(chrome, [
    '--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars', '--mute-audio',
    '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
    // headless reports no hover and no fine pointer, so desktop-only code (Lenis, cursor, magnetic) would never run
    '--blink-settings=primaryPointerType=4,availablePointerTypes=4,primaryHoverType=2,availableHoverTypes=2',
    '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  const wsUrl = await new Promise((res, rej) => {
    let buf = '';
    const t = setTimeout(() => rej(new Error('Chrome did not start in 20s')), 20000);
    proc.stderr.on('data', (d) => {
      buf += d.toString();
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) { clearTimeout(t); res(m[1]); }
    });
    proc.on('exit', (c) => rej(new Error('Chrome exited early (' + c + '): ' + buf.slice(-300))));
  });
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', () => rej(new Error('CDP connect failed'))); });
  const cdp = new CDP(ws);
  const close = async () => {
    try { ws.close(); } catch {}
    proc.kill('SIGKILL');
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
  };
  return { cdp, close };
}

// ---------- in-page scripts ----------
const STATIC_SCRIPT = `(() => {
  const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden'; };
  const sel = (el) => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; else if (el.className && typeof el.className === 'string') s += '.' + el.className.trim().split(/\\s+/).slice(0,2).join('.'); return s; };
  const out = {};
  out.title = document.title; out.lang = document.documentElement.lang;
  out.description = !!document.querySelector('meta[name="description"]');
  out.viewportMeta = !!document.querySelector('meta[name="viewport"]');
  out.h1 = document.querySelectorAll('h1').length;
  out.main = !!document.querySelector('main, [role="main"]');
  out.overflowX = document.documentElement.scrollWidth - innerWidth;
  out.docHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
  const imgs = [...document.images];
  out.images = imgs.length;
  out.brokenImages = imgs.filter((i) => i.complete && i.naturalWidth === 0 && i.currentSrc).map((i) => i.currentSrc.slice(0, 120));
  out.missingAlt = imgs.filter((i) => !i.hasAttribute('alt')).length;
  const bgEls = [...document.querySelectorAll('*')].filter((e) => { const b = getComputedStyle(e).backgroundImage; return b && b.startsWith('url('); }).length;
  out.visuals = imgs.length + document.querySelectorAll('video, canvas, picture source').length + bgEls;
  // text sizes
  let minFont = 99; const tiny = [];
  document.querySelectorAll('p, a, li, span, button, h1, h2, h3, h4, label, figcaption, small').forEach((e) => {
    if (!e.childNodes.length || ![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return;
    if (!vis(e)) return;
    const fs = parseFloat(getComputedStyle(e).fontSize);
    if (fs < minFont) minFont = fs;
    if (fs < 12 && tiny.length < 5) tiny.push(sel(e) + ' ' + fs + 'px');
  });
  out.minFont = minFont === 99 ? null : minFont; out.tinyText = tiny;
  // tap targets
  const small = [];
  document.querySelectorAll('a[href], button, input, select, textarea, [role="button"]').forEach((e) => {
    if (!vis(e)) return; const r = e.getBoundingClientRect();
    if ((r.width < 24 || r.height < 24) && small.length < 5) small.push(sel(e) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
  });
  out.smallTargets = small;
  // fonts
  const fams = new Set();
  document.querySelectorAll('body *').forEach((e) => { if (e.childNodes.length && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) fams.add(getComputedStyle(e).fontFamily.split(',')[0].replace(/["']/g, '').trim()); });
  out.fontFamilies = [...fams];
  // placeholders
  const html = document.documentElement.outerHTML;
  out.placeholders = [];
  if (document.querySelector('[data-placeholder]')) out.placeholders.push('data-placeholder');
  if (/lorem ipsum/i.test(document.body.innerText)) out.placeholders.push('lorem ipsum');
  if (/TODO\\(content\\)/.test(html)) out.placeholders.push('TODO(content)');
  out.pointer = matchMedia('(hover: hover) and (pointer: fine)').matches ? 'fine' : 'coarse';
  out.libs = { gsap: !!window.gsap, scrollTrigger: !!window.ScrollTrigger && window.ScrollTrigger.getAll().length, lenis: !!(window.lenis || window.Lenis), three: !!window.THREE };
  return out;
})()`;

const SNAP_SCRIPT = `(() => {
  const els = [...document.querySelectorAll('body *')].slice(0, 3500);
  return els.map((e) => { const cs = getComputedStyle(e); return cs.transform + '|' + cs.opacity + '|' + cs.clipPath + '|' + cs.translate + '|' + cs.scale + '|' + cs.rotate; });
})()`;

const HIDDEN_SCRIPT = `(() => {
  const sel = (el) => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; else if (el.className && typeof el.className === 'string') s += '.' + el.className.trim().split(/\\s+/).slice(0,2).join('.'); return s; };
  const res = [];
  document.querySelectorAll('body *').forEach((e) => {
    if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1)) return;
    if (e.closest('[hidden], [inert], script, style, noscript, .sr-only, .loader')) return;
    // aria-hidden text is often the VISUAL copy of a split headline, so it still gets the mask check
    const inAria = !!e.closest('[aria-hidden="true"]');
    const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return;
    let o = 1, n = e; while (n && n !== document.documentElement) { const cs = getComputedStyle(n); if (cs.display === 'none') return; o *= parseFloat(cs.opacity); if (cs.visibility === 'hidden') { o = 0; } n = n.parentElement; }
    if (!inAria && o < 0.05 && res.length < 8) { res.push(sel(e) + ' "' + e.textContent.trim().slice(0, 30) + '"'); return; }
    if (o < 0.05) return;
    // text pushed out of a tight mask (line reveals that never ran): opacity is 1 but nothing shows
    const area = r.width * r.height;
    for (let a = e.parentElement, depth = 0; a && a !== document.body && depth < 2; a = a.parentElement, depth++) {
      const cs = getComputedStyle(a);
      const clips = /(hidden|clip)/.test(cs.overflow + cs.overflowX + cs.overflowY) || (cs.clipPath && cs.clipPath !== 'none');
      if (!clips) continue;
      const ar = a.getBoundingClientRect();
      if (ar.width * ar.height > area * 4) break;
      if (a.scrollWidth > a.clientWidth * 1.3 || a.scrollHeight > a.clientHeight * 1.3) break;   // tracks and marquees overflow on purpose
      const iw = Math.max(0, Math.min(r.right, ar.right) - Math.max(r.left, ar.left));
      const ih = Math.max(0, Math.min(r.bottom, ar.bottom) - Math.max(r.top, ar.top));
      if (iw * ih < area * 0.15 && res.length < 8) res.push(sel(e) + ' (clipped by ' + sel(a) + ') "' + e.textContent.trim().slice(0, 30) + '"');
      break;
    }
  });
  return res;
})()`;

const VITALS_SCRIPT = `new Promise((res) => {
  const sel = (el) => { if (!el || !el.tagName) return '?'; let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; else if (el.className && typeof el.className === 'string') s += '.' + el.className.trim().split(/\\s+/).slice(0,2).join('.'); return s; };
  let lcp = null, cls = 0; const shifts = [];
  try { new PerformanceObserver((l) => { const e = l.getEntries(); if (e.length) lcp = e[e.length - 1].startTime; }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch {}
  try { new PerformanceObserver((l) => { l.getEntries().forEach((e) => { if (!e.hadRecentInput) { cls += e.value; shifts.push({ v: +e.value.toFixed(3), t: Math.round(e.startTime), n: (e.sources || []).slice(0, 2).map((x) => sel(x.node)).join(' + ') }); } }); }).observe({ type: 'layout-shift', buffered: true }); } catch {}
  setTimeout(() => res({ lcp, cls, shifts: shifts.sort((a, b) => b.v - a.v).slice(0, 4), anims: document.getAnimations().length }), 300);
})`;

// ---------- run one width ----------
async function runWidth(cdp, width, { reduced = false, blockCdn = false } = {}) {
  const height = HEIGHTS[width] || 900;
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  const S = (m, p) => cdp.send(m, p, sessionId);
  const evalJs = async (expr, awaitPromise = false) => {
    const r = await S('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  const errors = []; const failedReqs = []; const libWarnings = []; const vendorMiss = []; const sizes = new Map();
  const frames = []; let recording = false;
  cdp.on((m) => {
    if (m.sessionId !== sessionId) return;
    if (m.method === 'Fetch.requestPaused') {
      const u = new URL(m.params.request.url); const name = path.basename(u.pathname);
      const file = VENDOR && path.join(VENDOR, name);
      if (file && fs.existsSync(file)) {
        S('Fetch.fulfillRequest', { requestId: m.params.requestId, responseCode: 200,
          responseHeaders: [{ name: 'Content-Type', value: MIME[path.extname(name)] || 'application/octet-stream' }, { name: 'Access-Control-Allow-Origin', value: '*' }],
          body: fs.readFileSync(file).toString('base64') }).catch(() => {});
      } else { vendorMiss.push(u.href); S('Fetch.continueRequest', { requestId: m.params.requestId }).catch(() => {}); }
    }
    if (m.method === 'Page.screencastFrame') {
      S('Page.screencastFrameAck', { sessionId: m.params.sessionId }).catch(() => {});
      if (recording) frames.push(m.params.data);
    }
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'warning') {
      const t = (m.params.args || []).map((a) => a.value ?? a.description ?? '').join(' ');
      if (/gsap|scrolltrigger|lenis|invalid property|not found|webgl/i.test(t)) libWarnings.push(t.slice(0, 200));
    }
    if (m.method === 'Runtime.exceptionThrown') errors.push((m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text || '').split('\n')[0].slice(0, 200));
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push('console.error: ' + (m.params.args || []).map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 200));
    if (m.method === 'Network.loadingFailed' && !m.params.blockedReason && !m.params.canceled) failedReqs.push(m.params.errorText);
    if (m.method === 'Network.dataReceived') sizes.set(m.params.requestId, (sizes.get(m.params.requestId) || 0) + m.params.dataLength);
  });
  await S('Page.enable'); await S('Runtime.enable'); await S('Network.enable');
  if (blockCdn) await S('Network.setBlockedURLs', { urls: CDN_PATTERNS });
  else if (VENDOR) await S('Fetch.enable', { patterns: CDN_PATTERNS.map((urlPattern) => ({ urlPattern, requestStage: 'Request' })) });
  await S('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 500 });
  if (width < 500) await S('Emulation.setTouchEmulationEnabled', { enabled: true });
  await S('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }] });

  const loaded = new Promise((res) => { cdp.on((m) => { if (m.sessionId === sessionId && m.method === 'Page.loadEventFired') res(true); }); setTimeout(() => res(false), 25000); });
  await S('Page.navigate', { url });
  const ok = await loaded;
  await sleep(SETTLE);

  const result = { width, reduced, loaded: ok, errors, failedReqs, libWarnings, vendorMiss };
  if (!ok) { await cdp.send('Target.closeTarget', { targetId }); return result; }

  result.static = await evalJs(STATIC_SCRIPT);
  const vitals = await evalJs(VITALS_SCRIPT, true);
  result.lcp = vitals.lcp; result.cls = vitals.cls; result.shifts = vitals.shifts;
  result.bytes = [...sizes.values()].reduce((a, b) => a + b, 0);

  const shot = async (file, extra = {}) => {
    const r = await S('Page.captureScreenshot', { format: 'png', ...extra });
    fs.writeFileSync(path.join(OUT, file), Buffer.from(r.data, 'base64'));
  };

  if (!reduced) {
    const docH = result.static.docHeight; const maxY = Math.max(0, docH - height);
    const first = await evalJs(SNAP_SCRIPT);
    const moved = new Set(); let maxAnims = vitals.anims;
    for (let i = 0; i < STEPS; i++) {
      const y = Math.round((maxY * i) / (STEPS - 1));
      await evalJs(`window.scrollTo(0, ${y})`);
      await sleep(750);
      await shot(`w${width}-s${String(i).padStart(2, '0')}.png`);
      const snap = await evalJs(SNAP_SCRIPT);
      for (let k = 0; k < Math.min(first.length, snap.length); k++) if (first[k] !== snap[k]) moved.add(k);
      const a = await evalJs('document.getAnimations().length'); if (a > maxAnims) maxAnims = a;
    }
    result.movers = moved.size; result.maxAnimations = maxAnims;
    // settle at bottom, then test stuck-hidden after a full pass
    await sleep(600);
    result.hiddenAfterPass = await evalJs(HIDDEN_SCRIPT);
    await evalJs('window.scrollTo(0, 0)'); await sleep(500);
    // full page screenshot (capped)
    const h = Math.min(result.static.docHeight, 14000);
    await shot(`w${width}-full.png`, { captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: h, scale: 1 } });
    if (!flag('no-motion')) {
      // fresh load, so one-time reveals fire under real input exactly as a first visit
      const reloaded = new Promise((res) => { cdp.on((m) => { if (m.sessionId === sessionId && m.method === 'Page.loadEventFired') res(true); }); setTimeout(() => res(false), 25000); });
      await S('Page.reload', { ignoreCache: false }); await reloaded; await sleep(SETTLE);
      result.motion = await motionPass(S, evalJs, width, height, maxY, frames, (v) => (recording = v));
      if (width >= 500) {
        result.pointer = await pointerPass(S, evalJs);
        result.keyboard = await keyboardPass(S, evalJs);
      }
    }
  } else {
    result.hiddenAfterPass = await evalJs(HIDDEN_SCRIPT);
    await shot(`w${width}-reduced.png`);
  }
  await cdp.send('Target.closeTarget', { targetId });
  return result;
}


// ---------- motion pass: real input scrolling, frame timing, screencast ----------
const TOP_SCRIPT = `(() => { if (window.lenis && window.lenis.scrollTo) window.lenis.scrollTo(0, { immediate: true, force: true }); window.scrollTo(0, 0); return scrollY; })()`;
const FRAME_START = `(() => { window.__fr = []; window.__frOn = true; const f = (t) => { window.__fr.push(t); if (window.__frOn) requestAnimationFrame(f); }; requestAnimationFrame(f); return true; })()`;
const FRAME_STOP = `(() => { window.__frOn = false; const t = window.__fr || []; const d = []; for (let i = 1; i < t.length; i++) d.push(t[i] - t[i - 1]); return d; })()`;
const pct = (arr, p) => { if (!arr.length) return null; const a = [...arr].sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor((p / 100) * a.length))]; };

async function motionPass(S, evalJs, width, height, maxY, frames, setRec) {
  await evalJs(TOP_SCRIPT); await sleep(900);
  const before = await evalJs(SNAP_SCRIPT);
  await evalJs(FRAME_START);
  frames.length = 0; setRec(true);
  await S('Page.startScreencast', { format: 'jpeg', quality: 55, maxWidth: Math.min(width, 960), everyNthFrame: 2 }).catch(() => {});
  const touch = width < 500;
  const speed = 1800; const t0 = Date.now();
  let reached = 0;
  // scroll in chunks so long pages do not time out, and so smooth scrollers keep receiving input
  for (let i = 0; i < 80 && Date.now() - t0 < 40000; i++) {
    const y = await evalJs('scrollY');
    reached = Math.max(reached, y);
    if (y >= maxY - 4) break;
    if (touch) {
      // synthesizeScrollGesture('touch') does not scroll in headless Chrome, so drag with raw touch events
      const x = Math.round(width / 2), y0 = Math.round(height * 0.8), steps = 30, dist = Math.round(height * 0.7);
      const pt = (yy) => [{ x, y: yy, id: 1, radiusX: 4, radiusY: 4, force: 1 }];
      await S('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(y0) });
      for (let k = 1; k <= steps; k++) { await S('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(y0 - Math.round((dist * k) / steps)) }); await sleep(16); }
      await S('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await sleep(250);
    } else {
      await S('Input.synthesizeScrollGesture', { x: Math.round(width / 2), y: Math.round(height * 0.6), yDistance: -Math.min(1400, height * 1.4),
        speed, gestureSourceType: 'mouse', preventFling: true }).catch(() => {});
      await sleep(120);
    }
  }
  await sleep(1200);
  reached = Math.max(reached, await evalJs('scrollY'));
  setRec(false);
  await S('Page.stopScreencast').catch(() => {});
  const deltas = (await evalJs(FRAME_STOP)).filter((d) => d > 0 && d < 1000);
  const after = await evalJs(SNAP_SCRIPT);
  let changed = 0; for (let k = 0; k < Math.min(before.length, after.length); k++) if (before[k] !== after[k]) changed++;
  // keep up to 16 evenly spaced frames as evidence of real animation
  const keep = []; const n = Math.min(16, frames.length);
  for (let i = 0; i < n; i++) keep.push(frames[Math.floor((i * (frames.length - 1)) / Math.max(1, n - 1))]);
  keep.forEach((b64, i) => fs.writeFileSync(path.join(OUT, `w${width}-motion-${String(i).padStart(2, '0')}.jpg`), Buffer.from(b64, 'base64')));
  const long = deltas.filter((d) => d > 50).length;
  return {
    input: touch ? 'touch' : 'wheel', maxY, reached: Math.round(reached), reachedPct: maxY ? Math.round((reached / maxY) * 100) : 100,
    frames: deltas.length, p50: pct(deltas, 50), p95: pct(deltas, 95), worst: deltas.length ? Math.max(...deltas) : null,
    longPct: deltas.length ? Math.round((long / deltas.length) * 100) : null, changed, savedFrames: keep.length,
  };
}

// ---------- pointer pass: hover each interactive element, look for feedback ----------
const HOVER_TARGETS = `(() => {
  const els = [...document.querySelectorAll('[data-cursor], [data-magnetic], [data-tilt], [data-hover], [data-distort], a[href], button, [role="button"], .pair, summary')]
    .filter((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 4 && r.height > 4 && cs.visibility !== 'hidden' && cs.display !== 'none' && !e.closest('[inert], [aria-hidden="true"]'); });
  window.__hv = els.slice(0, 14); return window.__hv.length;
})()`;
const HOVER_STATE = (i) => `(() => { const e = window.__hv[${i}]; const all = [e, ...e.querySelectorAll('*')].slice(0, 40);
  return all.map((x) => { const c = getComputedStyle(x); return [c.transform, c.opacity, c.clipPath, c.color, c.backgroundColor, c.borderColor, c.filter, c.scale, c.translate, c.textDecorationLine, c.boxShadow].join('|'); }).join('#')
    + '#cursor:' + [...document.querySelectorAll('.cursor, [class*="cursor"]')].map((c) => getComputedStyle(c).transform).join(','); })()`;
const HOVER_CENTER = (i) => `(() => { const e = window.__hv[${i}]; if (window.lenis && window.lenis.scrollTo) window.lenis.scrollTo(e, { immediate: true, offset: -innerHeight / 3, force: true }); else e.scrollIntoView({ block: 'center' });
  const r = e.getBoundingClientRect(); return [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2), (e.getAttribute('aria-label') || e.textContent || e.className || e.tagName).toString().trim().slice(0, 24)]; })()`;

async function pointerPass(S, evalJs) {
  await evalJs(TOP_SCRIPT); await sleep(400);
  const n = await evalJs(HOVER_TARGETS);
  let reactive = 0; const flat = [];
  for (let i = 0; i < n; i++) {
    const [x, y, label] = await evalJs(HOVER_CENTER(i)); await sleep(250);
    await S('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 5, y: 5 }); await sleep(250);
    const a = await evalJs(HOVER_STATE(i));
    for (let k = 0; k < 4; k++) { await S('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x - 6 + k * 4, y: y - 3 + k * 2 }); await sleep(60); }
    await sleep(500);
    const b = await evalJs(HOVER_STATE(i));
    if (a !== b) reactive++; else if (flat.length < 4) flat.push(label);
  }
  await S('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 5, y: 5 });
  return { tested: n, reactive, flat };
}

// ---------- keyboard pass: focus must be visible ----------
const FOCUS_STATE = `(() => { const e = document.activeElement; if (!e || e === document.body) return null; const c = getComputedStyle(e);
  const ring = (c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0) || (c.boxShadow && c.boxShadow !== 'none');
  const r = e.getBoundingClientRect(); const onScreen = r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  return { ring, onScreen, label: (e.getAttribute('aria-label') || e.textContent || e.tagName).trim().slice(0, 24) }; })()`;

async function keyboardPass(S, evalJs) {
  await evalJs(TOP_SCRIPT); await evalJs('document.activeElement && document.activeElement.blur && document.activeElement.blur()');
  let tested = 0; const noRing = []; const offScreen = [];
  for (let i = 0; i < 12; i++) {
    await S('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await S('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await sleep(350);
    const st = await evalJs(FOCUS_STATE); if (!st) continue; tested++;
    if (!st.ring && noRing.length < 4) noRing.push(st.label);
    if (!st.onScreen && offScreen.length < 4) offScreen.push(st.label);
  }
  return { tested, noRing, offScreen };
}

// ---------- evaluate ----------
function evaluate(runs) {
  const fails = []; const warns = [];
  const F = (code, msg) => fails.push({ code, msg });
  const W = (code, msg) => warns.push({ code, msg });
  const normal = runs.filter((r) => !r.reduced);
  for (const r of normal) {
    const tag = `@${r.width}`;
    if (!r.loaded) { F('load-failed', `${tag} page did not finish loading`); continue; }
    const s = r.static;
    if (s.overflowX > 1) F('overflow-x', `${tag} page is ${s.overflowX}px wider than the viewport`);
    if (s.h1 === 0) F('no-h1', `${tag} no <h1>`); if (s.h1 > 1) F('many-h1', `${tag} ${s.h1} <h1> elements`);
    if (s.brokenImages.length) F('broken-image', `${tag} ${s.brokenImages.length} broken: ${s.brokenImages.slice(0, 2).join(', ')}`);
    if (r.errors.length) F('console-error', `${tag} ${r.errors.length} error(s), first: ${r.errors[0]}`);
    if (r.movers !== undefined && r.movers < 8) F('still-page', `${tag} only ${r.movers} element(s) changed transform/opacity/clip while scrolling (need 8+)`);
    if (r.hiddenAfterPass?.length) F('stuck-hidden', `${tag} text invisible after a full scroll pass: ${r.hiddenAfterPass.slice(0, 3).join('; ')}`);
    if (s.placeholders.length) F('placeholder-left', `${tag} ${s.placeholders.join(', ')}`);
    if (s.minFont !== null && s.minFont < 12) W('small-text', `${tag} text as small as ${s.minFont}px: ${s.tinyText.join('; ')}`);
    if (r.width < 500 && s.smallTargets.length) W('tiny-target', `${tag} ${s.smallTargets.join('; ')}`);
    if (s.missingAlt) W('missing-alt', `${tag} ${s.missingAlt} image(s) without alt`);
    if (!s.lang) W('no-lang', `${tag} <html lang> missing`);
    if (!s.title) W('no-title', `${tag} <title> empty`);
    if (!s.description) W('no-description', `${tag} meta description missing`);
    if (!s.main) W('no-main', `${tag} no <main> landmark`);
    if (s.visuals < 4) W('few-visuals', `${tag} only ${s.visuals} images/videos/canvases/background images`);
    if (s.fontFamilies.length > 3) W('font-count', `${tag} ${s.fontFamilies.length} families in use: ${s.fontFamilies.join(', ')}`);
    if (r.bytes > 3 * 1024 * 1024) W('heavy-page', `${tag} ${(r.bytes / 1048576).toFixed(1)} MB transferred`);
    if (r.lcp && r.lcp > 2500) W('slow-lcp', `${tag} LCP ${(r.lcp / 1000).toFixed(2)} s (software headless, treat as relative)`);
    if (r.cls > 0.1) W('layout-shift', `${tag} CLS ${r.cls.toFixed(3)}; biggest: ${(r.shifts || []).map((x) => x.n + ' ' + x.v + ' @' + x.t + 'ms').join('; ')}`);
    if (r.failedReqs.length) W('failed-request', `${tag} ${r.failedReqs.length} failed request(s), e.g. ${r.failedReqs[0]}`);
    if (r.libWarnings.length) W('lib-warning', `${tag} ${r.libWarnings.length} library warning(s), first: ${r.libWarnings[0]}`);
    if (r.vendorMiss.length) W('vendor-miss', `${tag} --vendor has no file for: ${[...new Set(r.vendorMiss)].slice(0, 3).join(', ')}`);
    const m = r.motion;
    if (m) {
      if (m.maxY > 200 && m.reachedPct < 90) F('scroll-stuck', `${tag} real ${m.input} scrolling reached only ${m.reachedPct}% of the page (${m.reached}/${m.maxY}px): smooth scroll stopped, overflow hidden, or a pin traps input`);
      if (m.maxY > 200 && m.changed < 5) F('no-scroll-motion', `${tag} only ${m.changed} element(s) changed during real ${m.input} scrolling`);
      if (m.p95 && m.p95 > 50) W('jank', `${tag} frame time p95 ${m.p95.toFixed(1)}ms, ${m.longPct}% frames over 50ms during scroll (software rendering here; confirm on a real GPU)`);
    }
    const pt = r.pointer;
    if (pt && pt.tested >= 3 && pt.reactive / pt.tested < 0.5) W('flat-hover', `${tag} only ${pt.reactive}/${pt.tested} interactive elements give hover feedback; flat: ${pt.flat.join('; ')}`);
    const kb = r.keyboard;
    if (kb && kb.noRing.length) W('focus-invisible', `${tag} focus has no visible ring on: ${kb.noRing.join('; ')}`);
    if (kb && kb.offScreen.length) W('focus-offscreen', `${tag} focused element is off screen (hidden menu still tabbable?): ${kb.offScreen.join('; ')}`);
  }
  for (const r of runs.filter((x) => x.reduced)) {
    if (r.hiddenAfterPass?.length) F('reduced-hidden', `@${r.width} reduced motion leaves text invisible: ${r.hiddenAfterPass.slice(0, 3).join('; ')}`);
  }
  return { fails, warns };
}

// ---------- main ----------
const { cdp, close } = await launch();
const runs = [];
try {
  for (const w of WIDTHS) {
    process.stderr.write(`inspecting @${w} ...\n`);
    runs.push(await runWidth(cdp, w, { blockCdn: flag('block-cdn') }));
  }
  if (!flag('no-reduced')) {
    process.stderr.write('inspecting reduced motion ...\n');
    runs.push(await runWidth(cdp, WIDTHS.includes(1440) ? 1440 : WIDTHS[0], { reduced: true, blockCdn: flag('block-cdn') }));
  }
} finally { await close(); }

const { fails, warns } = evaluate(runs);
const lines = [];
lines.push(`# incridible inspect: ${url}`, '', `Widths: ${WIDTHS.join(', ')} | steps: ${STEPS} | block-cdn: ${flag('block-cdn')} | vendor: ${VENDOR ? 'yes' : 'no'}`, '');
lines.push('| width | movers | animations | LCP | CLS | weight | libs |', '|---|---|---|---|---|---|---|');
for (const r of runs.filter((x) => !x.reduced && x.loaded)) {
  const l = r.static.libs;
  lines.push(`| ${r.width} | ${r.movers} | ${r.maxAnimations} | ${r.lcp ? (r.lcp / 1000).toFixed(2) + 's' : 'n/a'} | ${r.cls.toFixed(3)} | ${(r.bytes / 1048576).toFixed(2)} MB | gsap:${l.gsap} st:${l.scrollTrigger} lenis:${l.lenis} three:${l.three} ptr:${r.static.pointer} |`);
}
const mrows = runs.filter((x) => x.motion);
if (mrows.length) {
  lines.push('', '### Motion (real input)', '', '| width | input | reached | changed | frames | p50 | p95 | >50ms | hover | focus ring |', '|---|---|---|---|---|---|---|---|---|---|');
  for (const r of mrows) {
    const m = r.motion; const f = (v) => (v == null ? 'n/a' : v.toFixed(1) + 'ms');
    lines.push(`| ${r.width} | ${m.input} | ${m.reachedPct}% | ${m.changed} | ${m.frames} | ${f(m.p50)} | ${f(m.p95)} | ${m.longPct ?? 'n/a'}% | ${r.pointer ? r.pointer.reactive + '/' + r.pointer.tested : '-'} | ${r.keyboard ? (r.keyboard.tested - r.keyboard.noRing.length) + '/' + r.keyboard.tested : '-'} |`);
  }
  lines.push('', 'Frame times come from headless software rendering: compare runs with each other, not with a real device.');
}
lines.push('', `## FAIL (${fails.length})`, ...(fails.length ? fails.map((f) => `- \`${f.code}\` ${f.msg}`) : ['none']));
lines.push('', `## WARN (${warns.length})`, ...(warns.length ? warns.map((f) => `- \`${f.code}\` ${f.msg}`) : ['none']));
lines.push('', 'Screenshots: ' + OUT);
const md = lines.join('\n');
fs.writeFileSync(path.join(OUT, 'report.md'), md);
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ url, runs, fails, warns }, null, 2));
console.log(md);
process.exit(fails.length ? 1 : 0);
