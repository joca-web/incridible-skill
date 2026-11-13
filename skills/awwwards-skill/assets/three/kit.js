/* kit.js: procedural 3D modelling kit for awwwards-skill (Three.js r187+, ES module).
 *
 * The AI builds models in code with these helpers, then `scripts/model3d.mjs` renders them from
 * several angles (so the result can be looked at and fixed) and exports a .glb. The same module
 * runs in the browser, so a site can build the model at load time instead of downloading a file.
 *
 *   import * as THREE from 'three';
 *   import * as kit from './kit.js';
 *
 * Coordinate convention: metres-ish units, Y up, the object faces +Z (towards the default camera).
 * Contents:
 *   shape helpers ...... profile, lathe, roundedBox, tube, arc, roundedRectShape, panel, frame, extrudeSVG, wrap, deform, bend
 *   textures ........... canvasTexture, paint.* (stripes, dots, squiggles, carbon, noise, gradient, text, halftone)
 *   materials .......... mat.* (gold, chrome, metal, glass, liquid, paint, plastic, rubber, carbon, fabric, emissive, textured)
 *   scene .............. studio, contactShadow, fit, frameCamera
 *   checks ............. stats, validate
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

export { THREE };
const V2 = (x, y) => new THREE.Vector2(x, y);
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
export { V2, V3 };

/* ------------------------------------------------------------------ shapes */

/** Smooth 2D profile through control points [[radius, height], …] (for lathe). Keeps the first and
 *  last points exact; `sharp` indexes are kept as hard corners. */
export function profile(points, { samples = 120, sharp = [] } = {}) {
  const pts = points.map(([x, y]) => V2(x, y));
  if (!sharp.length) return new THREE.SplineCurve(pts).getSpacedPoints(samples);
  // split at sharp corners, smooth each run separately
  const out = []; let start = 0;
  const cuts = [...sharp.filter((i) => i > 0 && i < pts.length - 1), pts.length - 1];
  for (const end of cuts) {
    const run = pts.slice(start, end + 1);
    const n = Math.max(2, Math.round((samples * (end - start)) / (pts.length - 1)));
    const seg = run.length > 2 ? new THREE.SplineCurve(run).getSpacedPoints(n) : run;
    out.push(...(out.length ? seg.slice(1) : seg));
    start = end;
  }
  return out;
}

/** Revolve a profile around Y. Points: Vector2 (x = radius ≥ 0, y = height) or [[r, h], …].
 *  Bottles, glasses, cans, lamp shades, ear cups, rings, vases. */
export function lathe(points, { segments = 96, smooth = true, samples = 120, sharp, phiStart = 0, phiLength = Math.PI * 2 } = {}) {
  const pts = Array.isArray(points[0]) ? (smooth ? profile(points, { samples, sharp }) : points.map(([x, y]) => V2(x, y))) : points;
  const g = new THREE.LatheGeometry(pts.map((p) => V2(Math.max(0, p.x), p.y)), segments, phiStart, phiLength);
  g.computeVertexNormals();
  return g;
}

/** Box with rounded edges: cards, phones, boxes, speakers. */
export function roundedBox(w, h, d, radius = Math.min(w, h, d) * 0.12, segments = 5) {
  return new RoundedBoxGeometry(w, h, d, segments, Math.min(radius, Math.min(w, h, d) / 2 - 1e-4));
}

/** Tube along a smooth path of [x, y, z] points: headphone bands, cables, handles, frames, neon. */
export function tube(points, radius = 0.02, { segments = 160, radial = 20, closed = false, tension = 0.5 } = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => (p.isVector3 ? p : V3(...p))), closed, 'catmullrom', tension);
  return new THREE.TubeGeometry(curve, segments, radius, radial, closed);
}

/** Points on a circular arc in the XY plane, for tube(): arc(radius, fromDeg, toDeg, n). */
export function arc(radius, from = 0, to = 180, n = 24, { z = 0, cx = 0, cy = 0 } = {}) {
  return Array.from({ length: n }, (_, i) => {
    const a = THREE.MathUtils.degToRad(from + ((to - from) * i) / (n - 1));
    return [cx + Math.cos(a) * radius, cy + Math.sin(a) * radius, z];
  });
}

/** 2D rounded rectangle Shape centred on the origin. */
export function roundedRectShape(w, h, r = Math.min(w, h) * 0.08) {
  const s = new THREE.Shape(); const x = -w / 2, y = -h / 2;
  r = Math.min(r, w / 2, h / 2);
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** Flat extruded panel from a Shape, centred on its depth (front face at +depth/2).
 *  UVs are remapped to 0..1 over the shape's bounds, so a canvas texture fills the face. */
export function panel(shape, depth = 0.01, { bevel = 0, bevelSegments = 3, curveSegments = 24 } = {}) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments, curveSegments });
  g.translate(0, 0, -depth / 2);
  normalizeUV(g);
  g.computeVertexNormals();
  return g;
}

/** Rectangular frame (border with a hole): card frames, picture frames, screens, badges. */
export function frame(w, h, border, depth = 0.01, { radius = 0.02, bevel = 0.002 } = {}) {
  const outer = roundedRectShape(w, h, radius);
  const inner = roundedRectShape(w - border * 2, h - border * 2, Math.max(0.001, radius - border * 0.5));
  outer.holes.push(new THREE.Path(inner.getPoints(48).reverse()));
  return panel(outer, depth, { bevel });
}

/** Extrude an SVG path `d` string (or a whole <svg> string) into a solid: logos, numbers, emblems.
 *  The result is centred, Y-up (SVG is flipped), scaled so its width equals `width`. */
export function extrudeSVG(svg, { width = 1, depth = 0.05, bevel = 0.004, curveSegments = 18 } = {}) {
  const markup = svg.trim().startsWith('<') ? svg : `<svg xmlns="http://www.w3.org/2000/svg"><path d="${svg}"/></svg>`;
  const data = new SVGLoader().parse(markup);
  const shapes = data.paths.flatMap((p) => SVGLoader.createShapes(p));
  const g = new THREE.ExtrudeGeometry(shapes, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments });
  g.scale(1, -1, 1);                       // SVG y points down
  g.computeBoundingBox();
  const b = g.boundingBox; const s = width / Math.max(1e-6, b.max.x - b.min.x);
  g.translate(-(b.min.x + b.max.x) / 2, -(b.min.y + b.max.y) / 2, -depth / 2);
  g.scale(s, s, 1);
  g.computeVertexNormals();
  return g;
}

/** Move every vertex with fn(v: Vector3, i) -> void (edit v in place), then fix normals.
 *  Use it to stretch, flatten, squash or sculpt primitives into organic shapes. */
export function deform(geometry, fn, { weld = false } = {}) {
  // weld: merge duplicate vertices first, so seams stay closed after displacement
  const g = weld ? mergeVertices(geometry, 1e-4) : geometry;
  const pos = g.attributes.position; const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); fn(v, i); pos.setXYZ(i, v.x, v.y, v.z); }
  pos.needsUpdate = true;
  g.computeVertexNormals(); g.computeBoundingBox(); g.computeBoundingSphere();
  return g;
}

/** Curved strip of a cylinder facing +Z: bottle and can labels, wristbands, curved screens.
 *  width and height are measured on the surface; UVs run left to right and bottom to top. */
export function wrap(radius, width, height, { segments = 64, open = true } = {}) {
  const len = width / radius;
  const g = new THREE.CylinderGeometry(radius, radius, height, segments, 1, open, -len / 2, len);
  return g;
}

/** Bend a geometry around the Y axis (onto a cylinder of `radius`). Only vertices move, so the
 *  geometry needs many vertices along X: a 2-triangle panel stays flat and cuts through the object.
 *  Use PlaneGeometry(w, h, 64, 1) or kit.wrap() for labels. */
export function bend(geometry, radius) {
  return deform(geometry, (v) => {
    const a = v.x / radius; const r = radius + v.z;
    v.x = Math.sin(a) * r; v.z = Math.cos(a) * r - radius;
  });
}

/** Remap UVs of a geometry to 0..1 across its XY bounding box (front-face projection). */
export function normalizeUV(g) {
  g.computeBoundingBox();
  const b = g.boundingBox; const pos = g.attributes.position; const uv = g.attributes.uv;
  if (!uv) return g;
  const w = b.max.x - b.min.x || 1, h = b.max.y - b.min.y || 1;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - b.min.x) / w, (pos.getY(i) - b.min.y) / h);
  uv.needsUpdate = true;
  return g;
}

/* ---------------------------------------------------------------- textures */

/** Draw a texture with the 2D canvas API. draw(ctx, w, h) paints it. Colour textures are sRGB;
 *  pass { data: true } for roughness/normal-like data maps. Works in the browser and in model3d.mjs. */
export function canvasTexture(w, h, draw, { data = false, repeat, wrap = false, flipY = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = data ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.anisotropy = 8; t.flipY = flipY;
  if (wrap || repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; if (repeat) t.repeat.set(...repeat); }
  t.needsUpdate = true;
  return t;
}

/** Seeded random, so a "random" livery is the same every render. */
export function rng(seed = 1) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

/** Painting helpers for canvasTexture. Each takes ctx, w, h and options. */
export const paint = {
  fill(ctx, w, h, color) { ctx.fillStyle = color; ctx.fillRect(0, 0, w, h); },
  gradient(ctx, w, h, stops, { angle = 90 } = {}) {
    const a = THREE.MathUtils.degToRad(angle); const cx = w / 2, cy = h / 2, r = Math.hypot(w, h) / 2;
    const g = ctx.createLinearGradient(cx - Math.cos(a) * r, cy - Math.sin(a) * r, cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    stops.forEach((c, i) => g.addColorStop(i / Math.max(1, stops.length - 1), c));
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  },
  stripes(ctx, w, h, { colors = ['#111', '#eee'], width = 40, angle = 0 } = {}) {
    ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate(THREE.MathUtils.degToRad(angle));
    const d = Math.hypot(w, h);
    for (let x = -d, i = 0; x < d; x += width, i++) { ctx.fillStyle = colors[i % colors.length]; ctx.fillRect(x, -d, width, d * 2); }
    ctx.restore();
  },
  dots(ctx, w, h, { color = '#000', spacing = 24, radius = 5, jitter = 0, seed = 1 } = {}) {
    const r = rng(seed); ctx.fillStyle = color;
    for (let y = spacing / 2; y < h; y += spacing) for (let x = spacing / 2; x < w; x += spacing) {
      ctx.beginPath(); ctx.arc(x + (r() - 0.5) * jitter, y + (r() - 0.5) * jitter, radius, 0, Math.PI * 2); ctx.fill();
    }
  },
  /** halftone: dot size follows a value function f(u, v) in 0..1 */
  halftone(ctx, w, h, { color = '#000', spacing = 14, f = (u, v) => v } = {}) {
    ctx.fillStyle = color;
    for (let y = 0; y < h; y += spacing) for (let x = (y / spacing) % 2 ? spacing / 2 : 0; x < w; x += spacing) {
      const k = Math.max(0, Math.min(1, f(x / w, y / h)));
      if (k > 0.02) { ctx.beginPath(); ctx.arc(x, y, (spacing / 2) * Math.sqrt(k), 0, Math.PI * 2); ctx.fill(); }
    }
  },
  /** organic worm-like strokes (racing liveries, streetwear prints) */
  squiggles(ctx, w, h, { color = '#111', count = 40, width = 22, length = 260, seed = 7, round = true } = {}) {
    const r = rng(seed); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = round ? 'round' : 'butt'; ctx.lineJoin = 'round';
    for (let i = 0; i < count; i++) {
      let x = r() * w, y = r() * h, a = r() * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let s = 0; s < length / 8; s++) { a += (r() - 0.5) * 0.9; x += Math.cos(a) * 8; y += Math.sin(a) * 8; ctx.lineTo(x, y); }
      ctx.stroke();
    }
  },
  carbon(ctx, w, h, { cell = 16, a = '#1b1b1d', b = '#2a2a2e' } = {}) {
    for (let y = 0; y < h; y += cell) for (let x = 0; x < w; x += cell) {
      const even = ((x + y) / cell) % 2 === 0;
      const g = ctx.createLinearGradient(x, y, even ? x + cell : x, even ? y : y + cell);
      g.addColorStop(0, a); g.addColorStop(0.5, b); g.addColorStop(1, a);
      ctx.fillStyle = g; ctx.fillRect(x, y, cell, cell);
    }
  },
  noise(ctx, w, h, { amount = 0.08, seed = 3, mono = true } = {}) {
    const r = rng(seed); const img = ctx.getImageData(0, 0, w, h); const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (r() - 0.5) * 255 * amount;
      d[i] += n; d[i + 1] += mono ? n : (r() - 0.5) * 255 * amount; d[i + 2] += mono ? n : (r() - 0.5) * 255 * amount;
    }
    ctx.putImageData(img, 0, 0);
  },
  text(ctx, text, x, y, { size = 64, font = 'Arial, Helvetica, sans-serif', weight = 800, color = '#111', align = 'center', baseline = 'middle', italic = false, tracking = 0, maxWidth } = {}) {
    ctx.save(); ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = baseline;
    ctx.font = `${italic ? 'italic ' : ''}${weight} ${size}px ${font}`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${tracking}px`;
    ctx.fillText(text, x, y, maxWidth);
    ctx.restore();
  },
};

/* --------------------------------------------------------------- materials */

/** Physically based material presets. Every function returns a new material; pass overrides. */
export const mat = {
  gold: (o = {}) => new THREE.MeshPhysicalMaterial({ color: '#e7b74d', metalness: 1, roughness: 0.22, clearcoat: 0.4, clearcoatRoughness: 0.1, ...o }),
  chrome: (o = {}) => new THREE.MeshPhysicalMaterial({ color: '#f2f2f2', metalness: 1, roughness: 0.05, ...o }),
  metal: (color = '#9aa0a6', o = {}) => new THREE.MeshStandardMaterial({ color, metalness: 1, roughness: 0.35, ...o }),
  /** clear or tinted glass; set `tint` for coloured bottles */
  glass: ({ tint = '#ffffff', thickness = 0.04, roughness = 0.04, ior = 1.5, ...o } = {}) => new THREE.MeshPhysicalMaterial({
    color: '#ffffff', metalness: 0, roughness, transmission: 1, thickness, ior, attenuationColor: new THREE.Color(tint), attenuationDistance: 0.35,
    specularIntensity: 1, envMapIntensity: 1.2, side: THREE.DoubleSide, transparent: false, ...o }),
  /** a liquid seen through glass. Deliberately NOT transmissive: Three.js renders transmission in one
   *  pass that only sees opaque objects, so a transmissive liquid inside transmissive glass vanishes.
   *  A glossy, slightly glowing opaque body reads as liquid once the glass is around it. */
  liquid: (color = '#b5651d', o = {}) => new THREE.MeshPhysicalMaterial({
    color, roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05,
    emissive: new THREE.Color(color), emissiveIntensity: 0.18, ...o }),
  /** car or helmet paint with a clear coat */
  paint: (color = '#d2ff00', o = {}) => new THREE.MeshPhysicalMaterial({ color, metalness: 0.15, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.06, ...o }),
  plastic: (color = '#f1f1f1', o = {}) => new THREE.MeshPhysicalMaterial({ color, metalness: 0, roughness: 0.45, clearcoat: 0.2, ...o }),
  matte: (color = '#cccccc', o = {}) => new THREE.MeshStandardMaterial({ color, metalness: 0, roughness: 0.9, ...o }),
  rubber: (color = '#1a1a1a', o = {}) => new THREE.MeshStandardMaterial({ color, metalness: 0, roughness: 0.95, ...o }),
  /** sheen follows the fabric's own colour, so dark fabric stays dark (a white sheen greys it out) */
  fabric: (color = '#2b2b2b', o = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 1, sheen: 0.6, sheenRoughness: 0.7, sheenColor: new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.25), ...o }),
  carbon: (o = {}) => new THREE.MeshPhysicalMaterial({
    map: canvasTexture(256, 256, (c, w, h) => paint.carbon(c, w, h), { repeat: [6, 6] }), metalness: 0.3, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.05, ...o }),
  emissive: (color = '#ffffff', intensity = 3, o = {}) => new THREE.MeshStandardMaterial({ color: '#000000', emissive: color, emissiveIntensity: intensity, ...o }),
  /** any texture painted with canvasTexture, as clear-coated paint */
  textured: (map, o = {}) => new THREE.MeshPhysicalMaterial({ map, metalness: 0.1, roughness: 0.4, clearcoat: 0.8, clearcoatRoughness: 0.08, ...o }),
};

/* ------------------------------------------------------------------- scene */

/** Studio lighting that needs no HDR file: a PMREM of RoomEnvironment for reflections, plus a key
 *  and a rim light. Call once per renderer/scene. Returns the lights so a page can animate them. */
export function studio(renderer, scene, { intensity = 1, key = true, rim = true, envIntensity = 1 } = {}) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = new RoomEnvironment();
  scene.environment = pmrem.fromScene(env, 0.04).texture;
  scene.environmentIntensity = envIntensity;
  env.dispose?.(); pmrem.dispose();
  const lights = new THREE.Group(); lights.name = 'studio-lights';
  if (key) { const k = new THREE.DirectionalLight('#ffffff', 2.2 * intensity); k.position.set(2.5, 4, 3); lights.add(k); }
  if (rim) { const r = new THREE.DirectionalLight('#dfe8ff', 1.6 * intensity); r.position.set(-3, 2, -3.5); lights.add(r); }
  lights.add(new THREE.HemisphereLight('#ffffff', '#444444', 0.35 * intensity));
  scene.add(lights);
  return lights;
}

/** Soft fake contact shadow under an object (no shadow maps needed). */
export function contactShadow(object, { opacity = 0.45, scale = 1.6, color = '0,0,0' } = {}) {
  const box = new THREE.Box3().setFromObject(object); const size = box.getSize(V3());
  const tex = canvasTexture(256, 256, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, `rgba(${color},${opacity})`); g.addColorStop(1, `rgba(${color},0)`);
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.scale.set(size.x * scale, size.z * scale || size.x * scale, 1);
  m.position.set((box.min.x + box.max.x) / 2, box.min.y + 0.001, (box.min.z + box.max.z) / 2);
  m.name = 'contact-shadow'; m.userData.helper = true;
  return m;
}

/** Centre an object on the origin and scale it so its largest dimension equals `size`. */
export function fit(object, size = 1, { ground = false } = {}) {
  const box = new THREE.Box3().setFromObject(object); const s = box.getSize(V3()); const c = box.getCenter(V3());
  const k = size / Math.max(s.x, s.y, s.z, 1e-6);
  object.scale.multiplyScalar(k);
  object.position.sub(c.multiplyScalar(k));
  if (ground) object.position.y += (s.y * k) / 2;
  return object;
}

/** Place a perspective camera so the whole object fits, from azimuth/elevation in degrees. */
export function frameCamera(camera, object, { azimuth = 0, elevation = 12, margin = 1.15 } = {}) {
  const sphere = new THREE.Box3().setFromObject(object).getBoundingSphere(new THREE.Sphere());
  const fov = THREE.MathUtils.degToRad(camera.fov);
  const fit = Math.min(fov, 2 * Math.atan(Math.tan(fov / 2) * camera.aspect));
  const dist = (sphere.radius * margin) / Math.sin(fit / 2);
  const az = THREE.MathUtils.degToRad(azimuth), el = THREE.MathUtils.degToRad(elevation);
  camera.position.set(sphere.center.x + dist * Math.cos(el) * Math.sin(az), sphere.center.y + dist * Math.sin(el), sphere.center.z + dist * Math.cos(el) * Math.cos(az));
  camera.near = dist / 100; camera.far = dist * 10; camera.updateProjectionMatrix();
  camera.lookAt(sphere.center);
  return { center: sphere.center, distance: dist };
}

/* ------------------------------------------------------------------ checks */

/** Triangle, mesh, material and texture counts plus size: what a page will pay for. */
export function stats(object) {
  let meshes = 0, triangles = 0, vertices = 0; const materials = new Set(), textures = new Set();
  object.traverse((o) => {
    if (!o.isMesh || o.userData.helper) return;
    meshes++;
    const g = o.geometry; vertices += g.attributes.position.count;
    triangles += g.index ? g.index.count / 3 : g.attributes.position.count / 3;
    [].concat(o.material).forEach((m) => { materials.add(m); for (const k of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'alphaMap']) if (m[k]) textures.add(m[k]); });
  });
  const size = new THREE.Box3().setFromObject(object).getSize(V3());
  return { meshes, triangles: Math.round(triangles), vertices, materials: materials.size, textures: textures.size,
    size: [size.x, size.y, size.z].map((v) => +v.toFixed(3)) };
}

/** Problems that make a model look broken or cost too much. Returns a list of strings. */
export function validate(object, { maxTriangles = 300000, maxTexture = 2048 } = {}) {
  const issues = []; const st = stats(object);
  if (!st.meshes) issues.push('no meshes: build() returned an empty object');
  if (st.triangles > maxTriangles) issues.push(`${st.triangles} triangles: heavy for the web (aim under ${maxTriangles}; lower segments)`);
  object.traverse((o) => {
    if (!o.isMesh) return;
    const p = o.geometry.attributes.position;
    for (let i = 0; i < p.array.length; i++) if (!Number.isFinite(p.array[i])) { issues.push(`${o.name || 'mesh'}: NaN or infinite vertex (check deform math)`); break; }
    if (!o.geometry.attributes.normal) issues.push(`${o.name || 'mesh'}: no normals (call computeVertexNormals)`);
    [].concat(o.material).forEach((m) => {
      const img = m.map && m.map.image; if (img && Math.max(img.width, img.height) > maxTexture) issues.push(`${o.name || 'mesh'}: texture ${img.width}x${img.height} over ${maxTexture}px`);
      if (m.transmission > 0 && m.side !== THREE.DoubleSide && m.thickness === 0) issues.push(`${o.name || 'mesh'}: transmissive material with zero thickness looks flat`);
    });
  });
  const s = st.size; if (Math.max(...s) > 50 || Math.max(...s) < 0.01) issues.push(`size ${s.join(' x ')}: use roughly 0.1 to 10 units so lighting and cameras behave`);
  return issues;
}
