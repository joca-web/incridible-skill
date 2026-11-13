# 3D modelling and 3D on the page

Read this when a site needs a 3D object (a helmet, a bottle, a shoe, headphones, cards, a product, a logo in 3D) or a 3D scene. It covers making the model, looking at it, exporting it, and putting it on a page with motion.

The sites this was built from: landonorris.com (a 3D helmet revealed piece by piece over a portrait as the cursor moves), jjettas.com (a gold cleat, headphones and cards turning, halftone type, diagonal wipes; Next.js, Lenis, several WebGL canvases), and santionispirits.com (a full WebGL world by Active Theory: glTF + Draco models, PBR with an HDR gain map, text rendered inside WebGL, sound design).

## Contents
1. Choose how to get the model
2. Building models in code with kit.js
3. The look-and-fix loop (model3d.mjs)
4. Recipes for common objects
5. Materials and light that read as expensive
6. Putting it on the page (stage.js)
7. Motion patterns from the references
8. Budgets and performance
9. Pitfalls found in real testing
10. Importing, generating and optimising .glb files

## 1. Choose how to get the model

| The object | Best route | Why |
|---|---|---|
| Hard-surface, symmetric, man-made: helmets, bottles, cans, glasses, headphones, cards, boxes, phones, lamps, logos, trophies, rings | **Build it in code with `assets/three/kit.js`** | Lathe, extrude, tubes and rounded boxes describe these exactly; parameters make variants for free; no files to license |
| A real product the client sells (their exact shoe, their exact bottle) | **Ask for their 3D file** (.glb, .gltf, .fbx, .obj from their designer or manufacturer) | Only the real file matches the real product |
| Organic or very detailed: a specific sneaker, a face, an animal, food, cloth | **An AI 3D generator** (text or image to 3D, e.g. Meshy, Tripo, Rodin) used by the user with their own account, or photogrammetry | Code cannot sculpt this convincingly. Say so instead of shipping a lumpy approximation |
| An abstract hero (blobs, ribbons, particles, a glass knot) | Code: kit + custom shaders | Abstract shapes are where code excels |
| A whole explorable world (santionispirits.com) | A 3D artist plus a WebGL developer; out of scope for one session | Say so; build one strong object instead |

Be honest in the report about which route was used and why. A procedural model is stylised; call it that.

## 2. Building models in code with kit.js

A model is an ES module:

```js
// models/thing.js
export const meta = { name: 'thing', camera: { fov: 28, elevation: 8 } };   // optional
export default function build({ THREE, kit, params }) {                    // may be async
  const g = new THREE.Group();
  // … meshes from kit helpers …
  return g;                                                                 // any Object3D
}
```

Conventions: Y is up, the front faces +Z, sizes roughly 0.5 to 3 units, everything centred near the origin. Read `params` for colours, text and numbers so one model makes many variants (`--param color=#ff4d1c`).

Kit helpers (all in `assets/three/kit.js`, documented in its header):

| Helper | Makes | Use for |
|---|---|---|
| `lathe([[r, h], …], { sharp })` | surface of revolution from a profile | bottles, glasses, cans, cups, vases, ear cups, knobs |
| `roundedBox(w, h, d, r)` | box with rounded edges | cards, phones, boxes, speakers, buttons |
| `tube(points, radius)` / `arc(r, from, to)` | tube along a smooth path | headphone bands, cables, handles, neon, frames |
| `panel(shape, depth)` + `roundedRectShape` | flat extruded shape with 0..1 UVs | faces of cards, badges, screens |
| `frame(w, h, border, depth)` | rectangle with a hole | card and picture frames |
| `extrudeSVG(d or <svg>, { width, depth })` | solid from an SVG path | logos, numbers, emblems |
| `wrap(radius, width, height)` | curved strip of a cylinder | labels on bottles and cans, curved screens |
| `deform(geo, fn)` | moves vertices with your function | sculpt primitives: stretch, pull a chin down, flare an edge |
| `canvasTexture(w, h, draw)` + `paint.*` | textures drawn with the 2D canvas | liveries, labels, card art, carbon, halftone, numbers |
| `mat.*` | PBR presets | gold, chrome, metal, glass, liquid, paint, plastic, rubber, fabric, carbon, emissive, textured |
| `studio`, `contactShadow`, `fit`, `frameCamera` | lighting, shadow, framing | used by model3d.mjs and stage.js |
| `stats`, `validate` | triangle and texture counts, problems | the report |

Sculpting tips:
- Start from the right primitive: sphere for shells, lathe for anything round in section, rounded box for anything rectangular.
- Write one `sculpt(v)` function and apply it to every part that must sit on the same surface (the helmet's shell, visor and seal all use it with a small outward push), so parts never float or intersect.
- Use enough segments for the silhouette (64 to 128 around), and not more.
- Paint details instead of modelling them: stripes, numbers, logos and labels belong in a canvas texture.
- Look at it after every few changes (section 3). Code that looks right is often wrong in 3D.

## 3. The look-and-fix loop (model3d.mjs)

```bash
node <skill>/scripts/model3d.mjs models/helmet.js --out .awwwards/models
node <skill>/scripts/model3d.mjs models/helmet.js --param color=#ff4d1c --param number=44 --param visor=gold
node <skill>/scripts/model3d.mjs models/helmet.js --frames 36 --poster
python3 <skill>/scripts/filmstrip.py .awwwards/models --pattern "helmet-turn-*.jpg" --gif
node <skill>/scripts/model3d.mjs client-file.glb            # inspect a model someone else made
```

It runs the module in real Chrome with Three.js and writes: `<name>-views.png` (front, three-quarter, side, back, other three-quarter, top), `<name>.glb` (glTF binary, ready for any engine or for Blender), `<name>-report.json` (meshes, triangles, materials, textures, size, problems), `<name>-poster.png` with `--poster` (transparent three-quarter view for the page fallback), and turntable frames with `--frames N`. Add `--vendor DIR` when CDNs are blocked (`scripts/vendor.mjs three` fetches three; see section 10).

Always open the views image and check, in this order: silhouette and proportions against a reference photo; parts floating or intersecting; the back and the top (they are forgotten most); texture direction and text readability; materials (glass reads as glass, gold as gold, not grey plastic); colour accuracy. Fix, render again. Three or four rounds is normal; this loop is what turns "a sphere with a stripe" into a helmet.

## 4. Recipes for common objects

`assets/three/models/` has four tested, parameterised examples to copy from:

| Model | Params | Techniques worth stealing |
|---|---|---|
| `helmet.js` | color, ink, number, visor (chrome, gold, smoke), seed | deformed sphere shell with a chin bar and angled bottom edge; visor as a band of a slightly larger sphere using the same sculpt; livery painted with squiggles and numbers; carbon spoiler |
| `bottle.js` | liquid, glass, label, sub, paper, ink, fill | lathe glass with sharp corners; liquid lathe inset by the wall thickness; label with `wrap()`; wood stopper texture |
| `headphones.js` | color, cushion, metal, badge | tube along an arc for the band; lathe cups turned to face sideways; flattened torus cushions |
| `card.js` | name, number, title, stat, top, bottom, image | rounded-box body; painted front panel; gold `frame()`; async build that can load a photo |

And how to approach others:
- **Can**: lathe with a necked top, `wrap()` label covering the body, chrome lid lathe.
- **Sneaker or cleat**: do not fake it in code. Use the client's file or an AI generator (section 1); then put it on the page with stage.js.
- **Trophy or award**: lathe base and cup, `extrudeSVG` emblem, gold.
- **Phone**: roundedBox body, panel screen with `canvasTexture` UI, small lathe camera rings.
- **Logo in 3D**: `extrudeSVG(path, { depth, bevel })` with chrome or emissive material, turning slowly.
- **Cereal box or packaging**: roundedBox with a small radius and one canvas texture per face (an array of six materials).

## 5. Materials and light that read as expensive

- `kit.studio()` lights with a room environment (reflections), a key and a rim light. No HDR file needed. For a specific mood, an HDRI file (from Poly Haven, CC0) loaded with RGBELoader beats any light setup.
- Tone mapping: `NeutralToneMapping` keeps brand colours true. ACES Filmic desaturates saturated paint (the lime helmet came out pale yellow with ACES).
- Metals need something to reflect: never judge chrome or gold on a flat background without an environment.
- Clear-coated paint (`mat.paint`) for helmets, cars and lacquer; `mat.plastic` for products; `mat.fabric` with a sheen tinted from its own colour (a white sheen turns dark fabric grey).
- Glass: `mat.glass()` uses transmission. Give it thickness, a faint tint, and keep a contact shadow so it sits on something.
- Colour comes mostly from textures and materials, not from lights. Keep lights white.

## 6. Putting it on the page (stage.js)

```html
<script type="importmap">{ "imports": {
  "three": "https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.187.0/examples/jsm/" } }</script>
<link rel="stylesheet" href="three/stage.css">

<div class="hero__stage" data-stage data-model="three/models/helmet.js" data-params='{"number":"07"}'
     data-mode="cursor float enter" data-reveal="cursor" data-ghost
     role="img" aria-label="Racing helmet in 3D, lime with black strokes">
  <img src="img/helmet.webp" alt="" width="800" height="800">   <!-- poster from model3d.mjs --poster -->
</div>

<script type="module">
  import { initStages } from './three/stage.js';
  initStages();
</script>
```

Copy `assets/three/` into the site as `three/`. The import map must come before any module script. Pin the Three.js version you tested.

| Attribute | Effect |
|---|---|
| `data-model` | a kit module (built in the browser, nothing to download beyond code) or a `.glb` |
| `data-params` | JSON for the module |
| `data-mode` | `cursor` (leans to the pointer), `spin`, `scroll` (turns with the page, `data-turns`), `enter` (grows and turns in), `float` |
| `data-keyframes` + `data-scroll` + `data-scroll-range="pin"` | a path of rotations, positions and scale across a pinned section |
| `data-reveal="cursor"` + `data-ghost` + `data-reveal-size` | the landonorris.com effect: the model shows through a soft circle at the cursor, a frosted silhouette elsewhere; touch devices get a one-time reveal |
| `el._stage.set({ rotY, x, scale })` | drive it from your own GSAP timeline |

Every stage needs an `aria-label` describing the object and a poster `<img alt="">` (decorative, because the label already describes it). Without WebGL, or before the first frame, the poster shows.

The `product-3d` starter (`assets/starters/product-3d/`) wires all of this: a cursor-revealed helmet hero, a pinned section where three cards turn on scroll over yard lines, product stages, halftone display type and a diagonal wipe.

## 7. Motion patterns from the references

- **Reveal over a portrait** (landonorris.com): portrait photo underneath, stage with `data-reveal="cursor"` aligned on top so the helmet sits on the head; ghost on. Align by placing the model with params or keyframes, and check with a screenshot.
- **Product turns as you read** (jjettas.com): stage with `data-mode="scroll"` beside text, 0.5 to 1 turn over the section.
- **Pinned hero object**: tall section (300vh) with a sticky inner, keyframes from "front and small" to "side and large" to "leaving left".
- **Objects that react**: `cursor` mode plus `enter`; keep tilt subtle (the stage caps it).
- **Halftone display type**: `background-clip: text` over a dot pattern (`.halftone-text` in the product-3d starter).
- **Diagonal chapter wipe**: animate `clip-path: polygon()` of the next section on scroll.

## 8. Budgets and performance

- Triangles: under 100k per object for heroes, 300k for the whole page. The examples are 6k to 75k.
- Live WebGL contexts: about six per page; the reveal ghost is a second context.
- Textures: 2048 px max, usually 1024. Canvas textures cost memory, not downloads.
- Transmission (glass) renders the scene an extra time: one glass object per view.
- Stages render only while something moves, pause off-screen, and use 1.25 pixel ratio on phones. Do not add continuous effects on touch devices.
- Test on a phone. Headless runs use software rendering, so frame times there are only relative; `shoot.mjs` reports `scroll-slow` when a heavy page is still scrolling but slowly.
- A kit module downloads as a few KB of code; a .glb of the same object is 1 to 2.5 MB with textures. Prefer modules for procedural objects; compress .glb files (section 10).

## 9. Pitfalls found in real testing

1. **Transparent inside transparent disappears.** A transmissive liquid inside transmissive glass rendered as nothing: Three.js renders transmission in one pass that sees only opaque objects. `mat.liquid` is opaque and glossy on purpose.
2. **Bending a two-triangle panel does nothing in the middle.** The label stayed flat and sank into the liquid, because only its corner vertices moved. Use `wrap()` or a subdivided plane.
3. **ACES tone mapping washes brand colours.** Lime became pale yellow; Neutral tone mapping fixed it.
4. **A white sheen greys dark fabric.** The neck roll looked like a light ring until the sheen took the fabric's own colour.
5. **Framing too tight.** Cursor tilt and the enter animation pushed the helmet out of its canvas; framing keeps a margin.
6. **Effects that never stop on phones.** A drifting reveal mask kept two contexts rendering every frame and made touch scrolling crawl; on touch, the reveal now plays once and the stage goes idle.

## 10. Importing, generating and optimising .glb files

- Inspect any file first: `node scripts/model3d.mjs file.glb`. Check the size, triangle count and materials; look at the views.
- Too heavy? With network access: `npx @gltf-transform/cli optimize in.glb out.glb --compress draco --texture-compress webp` (Draco or Meshopt geometry, WebP textures). Draco needs `DRACOLoader` on the page with its decoder path; Meshopt needs `MeshoptDecoder`.
- AI-generated models (Meshy, Tripo, Rodin and similar): the user runs them with their own account; ask for glTF/GLB output, then inspect, centre (`kit.fit`), relight with `kit.studio`, and compress. Their topology is often dense; decimate before shipping.
- Blender: if it is installed, `blender --background --python script.py` can build or convert models with its Python API; export glTF. Do not assume it exists.
- Offline sandboxes: `node scripts/vendor.mjs three` fetches the Three.js build from npm; if the registry is blocked too, a sparse clone of github.com/mrdoob/three.js (`build/` and the needed `examples/jsm/` files) works, then `--vendor` that folder.
- Licence: only use models the client owns or that are licensed for commercial use (CC0 sources such as Poly Haven). Never ship a model of someone else's branded product.
