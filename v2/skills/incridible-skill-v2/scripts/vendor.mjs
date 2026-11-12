#!/usr/bin/env node
// vendor.mjs: fetch real library builds for offline testing with `shoot.mjs --vendor DIR`.
// Zero dependencies (Node 18+). Downloads npm tarballs and keeps only the browser builds.
//
//   node vendor.mjs                          gsap + lenis into .incridible/vendor
//   node vendor.mjs gsap lenis three --out vendor
//   node vendor.mjs --tgz ./gsap-3.15.1.tgz  extract from a tarball you already have (no network)
//
// Files are flattened by name (gsap.min.js, ScrollTrigger.min.js, lenis.min.js …), which is exactly how
// shoot.mjs --vendor matches CDN requests. When the npm registry is blocked too, clone the library's
// public GitHub repository instead (GSAP ships dist/ in https://github.com/greensock/gsap) and point
// --vendor at its dist folder.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const argv = process.argv.slice(2);
const val = (n, d) => { const i = argv.indexOf('--' + n); return i >= 0 ? argv[i + 1] : d; };
const OUT = path.resolve(val('out', '.incridible/vendor'));
const TGZ = val('tgz');
const pkgs = argv.filter((a, i) => !a.startsWith('--') && !['--out', '--tgz'].includes(argv[i - 1]));
if (!TGZ && !pkgs.length) pkgs.push('gsap', 'lenis');
fs.mkdirSync(OUT, { recursive: true });

// keep browser-ready builds only: minified UMD/IIFE files and stylesheets from dist/ or build/
const KEEP = /^package\/(dist|build)\/(?:[^/]+\/)?[^/]+\.(min\.js|css)$|^package\/(dist|build)\/[^/]+\.(umd|iife|module)\.js$/;

function untar(buf, onFile) {
  for (let off = 0; off + 512 <= buf.length;) {
    const h = buf.subarray(off, off + 512);
    if (h.every((b) => b === 0)) break;
    const str = (a, b) => h.subarray(a, b).toString('utf8').replace(/\0.*$/s, '');
    const size = parseInt(str(124, 136).trim() || '0', 8);
    const type = String.fromCharCode(h[156] || 48);
    const prefix = str(345, 500);
    const name = (prefix ? prefix + '/' : '') + str(0, 100);
    const body = buf.subarray(off + 512, off + 512 + size);
    if (type === '0' || type === '\0') onFile(name, body);
    off += 512 + Math.ceil(size / 512) * 512;
  }
}

function extract(tgz, label) {
  const tar = zlib.gunzipSync(tgz);
  const kept = [];
  untar(tar, (name, body) => {
    if (!KEEP.test(name)) return;
    const base = path.basename(name);
    fs.writeFileSync(path.join(OUT, base), body);
    kept.push(base);
  });
  console.log(`${label}: ${kept.length} file(s) -> ${OUT}`);
  if (kept.length) console.log('  ' + kept.sort().join(', '));
  return kept.length;
}

async function fromRegistry(spec) {
  const [name, ver = 'latest'] = spec.startsWith('@') ? [spec.split('@').slice(0, 2).join('@'), spec.split('@')[2]] : spec.split('@');
  const meta = await (await fetch(`https://registry.npmjs.org/${name.replace('/', '%2f')}/${ver || 'latest'}`)).json();
  if (!meta.dist) throw new Error(`no such package/version: ${spec}`);
  const res = await fetch(meta.dist.tarball);
  if (!res.ok) throw new Error(`download failed ${res.status} for ${meta.dist.tarball}`);
  return extract(Buffer.from(await res.arrayBuffer()), `${name}@${meta.version}`);
}

let failed = 0;
if (TGZ) {
  if (!extract(fs.readFileSync(TGZ), path.basename(TGZ))) failed++;
} else {
  for (const p of pkgs) {
    try { if (!(await fromRegistry(p))) failed++; }
    catch (e) { failed++; console.error(`${p}: ${e.message}. If the registry is blocked, clone the library from GitHub or pass --tgz.`); }
  }
}
const shown = path.relative(process.cwd(), OUT).startsWith('..') ? OUT : path.relative(process.cwd(), OUT) || '.';
console.log(failed ? `\n${failed} package(s) failed` : `\nnext: node shoot.mjs <url> --vendor ${shown}`);
process.exit(failed ? 1 : 0);
