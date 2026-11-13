# WebGL, depth and layered effects

Read this when one hero object should feel alive: a subject that tilts in 3D as the pointer moves, text that sits behind a person, blobs that follow the cursor, a shader transition, a looping video.

## Contents
1. Choose the lightest technique that works
2. Depth-map hero (`assets/webgl/depth-hero.js`)
3. Getting a depth map and a cutout
4. The text-behind-subject sandwich (no WebGL)
5. Cursor-reactive blobs (gooey SVG filter)
6. Three.js notes
7. Video
8. Rive
9. Safety rails

## 1. Choose the lightest technique that works

| Want | Use |
|---|---|
| Images that ripple and split RGB on hover (and optionally with scroll speed) | `components/webgl-distort.js` (`data-distort`) |
| A living gradient with grain behind a section | `components/shader-bg.js` (`data-shader-bg`) |
| Subject tilts with the pointer, real depth feel | Depth-map shader (section 2) |
| Name or headline behind the subject | CSS sandwich (section 4), add depth shader later if worthwhile |
| Soft shapes chasing the cursor over an image | Gooey SVG filter or a 2D canvas (section 5) |
| A 3D object built by you, or a .glb, on the page | `references/10-3d-modeling.md` (kit.js, model3d.mjs, stage.js) |
| A full 3D scene, many objects | Three.js (section 6) |
| Animated character with states | Rive (section 8) |
| Motion footage | Video (section 7) |

The Awwwards Site of the Year winner landonorris.com combines Three.js with depth maps and custom shaders, CSS masking and Rive. The lesson is the combination: each tool does one job, and CSS does everything it can before shaders are added.

## 2. Depth-map hero

`assets/webgl/depth-hero.js` is a dependency-free WebGL 1 module. It takes a colour image and a grayscale depth image of the same framing (white is near, black is far) and renders the image on a canvas with parallax that follows the pointer (or device tilt), plus an optional soft ripple under the cursor.

```html
<div class="hero__media"><canvas id="hero-canvas"></canvas>
  <img class="hero__fallback" src="hero.webp" alt="…"></div>
```

```js
import { DepthHero } from './webgl/depth-hero.js';  // inside <script type="module">; the module also sets window.DepthHero

const hero = await DepthHero.create(document.getElementById('hero-canvas'), {
  image: 'hero.webp',
  depth: 'hero-depth.webp',
  strength: 0.035,      // parallax amount in UV units
  ripple: 0.4,          // 0 disables the cursor ripple
  maxDPR: 2,
});
// hero is null when WebGL is unavailable: keep the fallback <img> visible.
```

Behaviour you get for free: the canvas covers its container like `object-fit: cover`; resizes with `ResizeObserver`; pauses when off-screen or when the tab is hidden; keeps a still frame under `prefers-reduced-motion`; uses device tilt on phones when permitted, otherwise a gentle idle sway; `hero.destroy()` releases GPU memory.

Always include the `<img class="hero__fallback">` so the first paint and no-WebGL users see the hero. Hide it once the canvas has drawn (`hero.ready` resolves after the first frame).

## 3. Getting a depth map and a cutout

- **Best**: run a monocular depth model (Depth Anything V2 or MiDaS) on the hero photo, normalise to 0 to 255, save as WebP at the same size. If Python with `transformers` is installed: `pipeline('depth-estimation', model='depth-anything/Depth-Anything-V2-Small-hf')`. Check before assuming it exists, and do not try to install packages if the environment blocks it.
- **Hand-painted**: in any editor, paint a grayscale image where the subject is white, mid-ground grey and background black, then blur 20 to 40 px so edges do not tear.
- **Procedural stand-in** (for demos and tests): `scripts/img_probe.py` can generate a radial depth gradient: `python3 scripts/img_probe.py fake-depth hero.png --out hero-depth.png`. Say in the report that it is a stand-in.
- **Cutout** (transparent PNG/WebP of the subject): a background-removal tool (rembg, Photoshop, remove.bg). Clean the edge, no halo.

Keep the depth map smooth. Hard steps in depth tear the image.

## 4. The text-behind-subject sandwich

Three layers: background image, giant text, cutout of the subject on top. No JavaScript is needed for the look; GSAP adds parallax at different speeds.

```html
<section class="sandwich">
  <img class="sandwich__bg" src="bg.webp" alt="">
  <h1 class="sandwich__title">LANDO</h1>   <!-- your name here -->
  <img class="sandwich__subject" src="subject-cutout.webp" alt="Portrait of …">
</section>
```

```css
.sandwich { position: relative; height: 100svh; overflow: hidden; background: var(--bg); }
.sandwich__bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.sandwich__title { position: absolute; left: 50%; top: 52%; translate: -50% -50%; margin: 0;
  font: 900 clamp(6rem, 28vw, 30rem)/0.8 var(--font-display); letter-spacing: -0.04em; color: var(--accent); z-index: 1; white-space: nowrap; }
.sandwich__subject { position: absolute; bottom: 0; left: 50%; translate: -50% 0; height: 92%; width: auto; z-index: 2; }
```

```js
gsap.timeline({ scrollTrigger: { trigger: '.sandwich', start: 'top top', end: 'bottom top', scrub: true } })
  .to('.sandwich__bg', { yPercent: 8, ease: 'none' }, 0)
  .to('.sandwich__title', { yPercent: -18, scale: 1.08, ease: 'none' }, 0)
  .to('.sandwich__subject', { yPercent: 6, ease: 'none' }, 0);
```

Use `translate`/`scale` individual properties or GSAP so they do not fight each other. Make sure the h1 is still real text (it is) and the title fits at 390 px.

## 5. Cursor-reactive blobs (gooey filter)

Blob-like shapes that merge and follow the pointer over an image, using only SVG and CSS.

```html
<svg width="0" height="0" aria-hidden="true"><defs>
  <filter id="goo"><feGaussianBlur in="SourceGraphic" stdDeviation="14" result="b"/>
    <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"/></filter>
</defs></svg>
<div class="blobs" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
```

```css
.blobs { position: absolute; inset: 0; filter: url(#goo); mix-blend-mode: multiply; pointer-events: none; }
.blobs i { position: absolute; width: 90px; height: 90px; border-radius: 50%; background: var(--accent); left: 0; top: 0; }
```

```js
const dots = [...document.querySelectorAll('.blobs i')];
dots.forEach((d, i) => {
  const x = gsap.quickTo(d, 'x', { duration: 0.35 + i * 0.18, ease: 'power3.out' });
  const y = gsap.quickTo(d, 'y', { duration: 0.35 + i * 0.18, ease: 'power3.out' });
  d._move = (cx, cy) => { x(cx - 45); y(cy - 45); };
});
heroEl.addEventListener('pointermove', (e) => { const r = heroEl.getBoundingClientRect(); dots.forEach((d) => d._move(e.clientX - r.left, e.clientY - r.top)); });
```

Large SVG filters are expensive. Keep the filtered area to the hero, keep blur 10 to 16, and switch the effect off on touch devices and under reduced motion.

## 6. Three.js notes

- Load from a CDN module (`https://cdn.jsdelivr.net/npm/three@0.17x/build/three.module.js` via an import map) or bundle it. Check the current version before pinning.
- One renderer, one rAF loop. `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`.
- Dispose geometries, materials and textures on teardown. Stop rendering when off-screen.
- Compress textures (WebP, KTX2 for big sets), keep models under 2 MB, draco-compress GLB.
- Drive scene parameters from ScrollTrigger by tweening a plain object (`uniforms.uProgress.value`), not by touching three objects inside scroll callbacks directly.
- Provide a static poster fallback.

## 7. Video

- `muted playsinline autoplay loop preload="metadata"` plus a `poster`. Autoplay only works muted.
- Ship WebM (VP9 or AV1) plus MP4 (H.264); target 1.5 to 4 Mbps for hero loops, 8 to 12 seconds long.
- Defer the source on mobile or replace by the poster when `navigator.connection.saveData` is true.
- Pause when off-screen. Never let video be the LCP unless the poster is.
- Never auto-play audio.

## 8. Rive

For interactive vector characters or UI with state machines: `@rive-app/canvas`, one `.riv` file, drive inputs from pointer or scroll (`stateMachine.inputs`). Always provide a static SVG or image placeholder inside the same container while it loads; landonorris.com keeps Rive placeholders in its markup for the footer and collaborations area. Keep the `.riv` file small and pause it when off-screen.

## 9. Safety rails

- Feature-detect: `canvas.getContext('webgl')`. No context means the fallback image stays.
- Cap pixel ratio at 2 and canvas size to the container.
- Handle `webglcontextlost` by showing the fallback.
- Test the effect at 390 px wide and with reduced motion on.
- In the headless inspector WebGL runs in software, so judge smoothness on your own machine and say in the report that it was not measured.
