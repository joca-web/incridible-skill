---
name: awwwards-skill
description: Builds Awwwards-level websites and the 3D models in them. Art direction, GSAP + ScrollTrigger + Lenis motion, a tested component library, page transitions, image-to-code, and real 3D. It models objects in code (helmets, bottles, headphones, cards, logos), renders them to check, exports .glb, and puts them on the page with scroll, cursor and reveal effects, then verifies everything in a real browser. Use it whenever the user wants a premium, award-winning, "Awwwards", immersive or highly animated website, landing page, portfolio, launch or brand site, a 3D product or object on a site, a 3D model made by the AI, or says "like landonorris.com", "site nível awwwards", "modelo 3d", "site com animações e scrolltrigger", "screenshot/Figma to code", "page transitions", or complains AI pages look generic, even if "awwwards" or "3D" is never said.
---

# Awwwards Skill

Most AI-built sites look generated because every decision was a default: the same centered hero, the same three cards, a purple gradient, fade-up on everything. Awwwards-level sites start from one idea that belongs to the subject, express it through type, colour, imagery and motion that agree with each other, and ship fast enough that the motion feels like butter.

Awwwards judges on Design 40%, Usability 30%, Creativity 20%, Content 10%, and the Developer Award on semantics/SEO, animations, accessibility, performance, responsiveness and markup. This skill is organised around those scores.

It gives you a tested component library, three starters, an inspector that scrolls with real wheel and touch input, and **3D**: a modelling kit to build objects in code, a renderer that shows you the model from six angles so you can look at it and fix it, a .glb exporter, and a stage that puts models on a page with scroll, cursor and reveal effects. Everything was run with real GSAP 3.15, Lenis 1.3 and Three.js r187 in Chrome, and the bugs that testing found are written into the references so you do not repeat them.

## Seven rules that decide the result

1. **Idea before pixels.** Write the one-sentence concept (Phase 3) before any markup. Without it the page falls back to template layout.
2. **Content is never hidden by animation.** Add the `motion` class from an inline `<head>` script, with a timeout that removes it if the libraries never arrive, and put hidden start states only under `.motion`. A page that is blank when a CDN hiccups scores zero.
3. **Start states come from GSAP, not CSS transforms.** GSAP reads a CSS `translateY(110%)` as pixels, so tweening `yPercent` back to 0 leaves headlines stuck inside their masks. This exact bug shipped in v1 and only real-library testing caught it.
4. **Real imagery and real copy.** Grey boxes and "Lorem ipsum" read as unfinished within one second. Find, generate or ask for real pictures, and write the words first.
5. **Motion is a system, not a sprinkle.** One easing family, a duration scale, a stagger rule, and a reason for every move (guide attention, show depth, confirm input, express brand voice).
6. **Look at your 3D before you ship it.** A model that reads correctly in code is often wrong in 3D. Render it with `scripts/model3d.mjs`, open the views image, fix, repeat.
7. **Prove it in a real browser with the real libraries.** Run `scripts/shoot.mjs`, look at the screenshots and the motion filmstrip at three widths, and fix every FAIL before reporting. Simulated or stubbed libraries hide the bugs that matter.

## Pick the route

| The user gives you | Route |
|---|---|
| A brief or nothing but a topic | **New build**: Phases 1 to 8 |
| A screenshot, mockup, Figma frame or photo of a design | **Image to code**: read `references/02-image-to-code.md` first, then Phases 4 to 8 |
| An existing site or repo to improve | **Redesign**: record "before" with `shoot.mjs`, keep stack, content and routes, then Phases 2 to 8 |
| A 3D object or a 3D moment ("a helmet that turns", "modelo 3d do produto", a site like landonorris.com or jjettas.com) | **3D**: read `references/10-3d-modeling.md`, choose how to get the model, build it with `assets/three/kit.js`, loop `scripts/model3d.mjs` until it looks right, place it with `assets/three/stage.js` |
| A live site they admire ("like landonorris.com") | **Reference-inspired build**: tear it down with `references/07-reference-teardowns.md`, borrow technique and structure, never its photos, logos, text, brand names or characters. Ask for the user's own assets |

Always work in the user's stack when one exists. With no stack, start from a starter (below), because static HTML runs anywhere and is easiest to verify. React and Next work too: see the cleanup notes at the end of `references/03-motion-system.md`; the components are plain ES modules that can be called from an effect.

## Starters

| Starter | Direction | Use when |
|---|---|---|
| `assets/starters/monument/` | Name as monument, dark, single page, one file of JS | Personal brands, events, sport, launches. Loud, few sections |
| `assets/starters/editorial/` | Uneven photographs and sentence as layout, light paper, serif, three pages with curtain transitions | Studios, portfolios, hospitality, architecture, anything with a body of work |
| `assets/starters/product-3d/` | Athlete or product site with live 3D: cursor-revealed helmet hero, pinned 3D cards, product stages, halftone type, diagonal wipes | Athletes, products, drinks, tech, launches where an object is the hero |

All three are starting points to restyle, not templates to fill. Change the tokens, the type and the composition to match your direction; keep the safety patterns (inline motion class, failsafe, static fallback). The editorial and product-3d starters import the component library: copy `assets/components/` next to them as `components/` (and `assets/three/` as `three/` for product-3d). Read `assets/starters/README.md` before using either.

## Workflow

### Phase 1: Inventory and brief
List 8 to 12 specifics only this client has: the name and its meaning, numbers, places, materials, a signature object, a catchphrase, the audience's slang, one hard constraint. Write the page as claims with proof, one line per section. Sections come from the argument, never from a template. If the brief is thin, ask at most one question, or state the assumption and go on.

### Phase 2: Direction
Choose one art direction from `references/01-direction-and-concept.md`. Fix the palette (2 to 4 colours, one loud accent), type pair, imagery treatment and motion character as design tokens now.

### Phase 3: The idea and the signature moment
Write one sentence: "On this page, [something that belongs to the subject] becomes [the device the direction calls for]." If it still works for the nearest competitor, it is too generic. Plan exactly one signature interaction the visitor can do or trigger. Everything else supports it. `references/09-components.md` lists ready parts that make good signature moments.

### Phase 4: Foundations
Tokens in CSS custom properties: colours, fluid type scale (`clamp()`), spacing, easings, durations, radii. Fonts from `references/05-typography-color-layout.md`. Grid and responsive rules. Plan mobile as its own composition.

### Phase 5: Build in layers
1. **Static**: semantic HTML, all real content, tokens, layout, responsive. It must look designed with JavaScript off.
2. **Motion**: components from `references/09-components.md` where they fit, custom GSAP from `references/03-motion-system.md` for the signature moment.
3. **Depth and 3D**: a real 3D object built and checked with the 3D route (`references/10-3d-modeling.md`), WebGL or layered cutouts (`references/04-webgl-and-depth.md`), or a shader background.
4. **Polish**: hover, focus, active and empty states, selection colour, favicon, OG image, 404.

Motion budget: at least 8 distinct elements move on a normal scroll, but only 1 or 2 things are loud in any viewport.

### Phase 6: Image to code (when a visual reference exists)
Follow `references/02-image-to-code.md`: probe, tile, extract tokens, build static, then loop `scripts/compare.py` until the diff is clean. Note which motion you invented.

### Phase 7: Gate
Serve the page over HTTP (ES modules do not load from `file://`) and run the inspector:

```bash
python3 -m http.server 4173 --directory <site-dir> &
node <skill>/scripts/shoot.mjs http://localhost:4173 --out .awwwards/after
python3 <skill>/scripts/filmstrip.py .awwwards/after --width 1440
```

At 1440, 768 and 390 px it checks static quality, scrolls in steps, then reloads and scrolls with **real wheel input (desktop, through Lenis) and real touch drags (mobile)**, measuring frame times and recording frames. It hovers every interactive element, tabs through the page for visible focus, and runs a reduced-motion pass. It catches text stuck inside masks, pages that do not scroll, flat hovers and library warnings. Look at the filmstrip: reveals mid-way, pins holding, nothing blank between frames.

When the CDNs are blocked (sandboxes, CI), get the real libraries first and serve them locally: `node <skill>/scripts/vendor.mjs` then add `--vendor .awwwards/vendor`. Never judge motion with stub libraries. Also run once with `--block-cdn`: every section must still read.

For every 3D object, also run `scripts/model3d.mjs` and look at the views; on the page, hover the stage and scroll through it.

Fix every FAIL. Then score the screenshots with the rubric in `references/08-qa-checklist.md`, fix the top three problems and shoot again, up to three rounds. For multi-page sites, click through one transition yourself (or script it) and check the back button.

If Chrome or Node 22 is missing, say so, use whatever browser tool exists, and run the checklist by hand.

### Phase 8: Report
Short and honest: direction and idea sentence, signature moment, stack and why, final inspector numbers (movers, real-input reach, p95 frame time, LCP, CLS, weight), what is placeholder, image credits, and anything not verified (for example "WebGL smoothness measured only in software rendering"). Do not recap every step.

## Stack defaults

- **Smooth scroll**: Lenis on fine pointers only, synced to GSAP's ticker; native momentum on touch (`components/scroll.js`).
- **Animation**: GSAP 3 with ScrollTrigger. GSAP and all its plugins (SplitText, Flip, Draggable, InertiaPlugin, ScrambleText, DrawSVG, MorphSVG, ScrollSmoother) are free, including commercial use. Use `gsap.matchMedia()` for breakpoints and reduced motion.
- **WebGL and 3D**: Three.js r187 through an import map for models and stages; raw WebGL helpers for distortion, shader backgrounds and the depth hero. Budget about 6 live WebGL canvases and 300k triangles per page.
- **Fonts**: two families at most; variable fonts unlock `variable-type.js`.
- **Transitions between pages**: `components/page-transition.js` (branded curtain everywhere, or native View Transitions with a curtain fallback).
- CDN tags use major-version URLs (`gsap@3`, `lenis@1`). Pin exact versions before production.

## Bundled resources

Read these when the phase calls for them, not all at once.

| File | Read when |
|---|---|
| `references/01-direction-and-concept.md` | Phases 1 to 3: anti-generic list, directions menu, idea test, content rules |
| `references/02-image-to-code.md` | The user supplied any picture of a design |
| `references/03-motion-system.md` | Custom motion: tokens, 15 recipes, lessons from real-browser testing, performance, React |
| `references/04-webgl-and-depth.md` | Hero depth effect, shaders, cutout sandwich, video, Rive |
| `references/05-typography-color-layout.md` | Phase 4: type pairs, scale, colour, grid, imagery, responsive |
| `references/06-performance-a11y.md` | Developer-award criteria and the fixes for each |
| `references/07-reference-teardowns.md` | Studying a live reference; notes on landonorris.com and Taste Skill |
| `references/08-qa-checklist.md` | Phase 7: inspector codes, rubric, report format |
| `references/09-components.md` | Choosing and wiring library components; markup for each |
| `references/10-3d-modeling.md` | Any 3D object: routes, kit, look-and-fix loop, recipes, materials, stage, budgets, pitfalls |
| `assets/components/` | 24 effects in 16 modules + `components.css`; `index.js` exports `boot()` and `initAll()` |
| `assets/starters/` | `monument/` (single page) and `editorial/` (three pages) |
| `assets/three/kit.js` | 3D modelling kit: lathe, tubes, rounded boxes, SVG extrude, wrap, deform, canvas textures, PBR materials, studio light |
| `assets/three/models/` | Tested parameterised models: helmet, bottle, headphones, card |
| `assets/three/stage.js` + `stage.css` | 3D on the page: scroll, cursor, keyframes, cursor reveal with ghost, poster fallback |
| `assets/webgl/depth-hero.js` | Zero-dependency WebGL depth-parallax hero |
| `scripts/model3d.mjs` | Builds a model in real Chrome, renders six views, exports .glb, poster and turntable, reports triangles and problems |
| `scripts/shoot.mjs` | Real-browser inspector with real-input motion pass (Node 22 + Chrome, no installs) |
| `scripts/filmstrip.py` | Contact sheet (and GIF) of the frames recorded while scrolling |
| `scripts/vendor.mjs` | Downloads GSAP, Lenis or other browser builds for offline testing |
| `scripts/compare.py` | Diff between a reference image and a screenshot |
| `scripts/img_probe.py` | Image info, palette, pixel ruler, tiles, crops |

## Taste calls that separate 7s from 9s

- Scale contrast: one thing huge, the rest small. Timid type is the fastest tell.
- Spend the accent colour like money. On landonorris.com a single lime on near-black does all the work.
- Show the subject, not decoration. Photography and the product beat gradients and icons; a shader background supports a hero, it is never the idea.
- Use components to serve the idea, never to collect effects. Three well-chosen components beat twelve.
- Brand voice in micro-interactions: loader labels, cursor text, curtain labels, hover captions.
- Rhythm: alternate dense and empty, loud and quiet, dark and light sections.
- Edit hard. Remove the third animation on a section, the fourth font weight, the fifth colour.
- Details nobody asked for: focus ring, selection colour, favicon, `theme-color`, a real 404.
