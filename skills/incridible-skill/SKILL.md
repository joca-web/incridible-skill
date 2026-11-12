---
name: incridible-skill
description: Builds Awwwards-level websites with art direction, GSAP + ScrollTrigger + Lenis motion, a tested component library (split-text reveals, scramble, image trail, stacking cards, Flip filters, draggable sliders, SVG drawing, WebGL distortion, shader backgrounds, variable fonts, expanding media, page transitions), WebGL depth heroes and image-to-code, then proves the motion in a real browser with real input. Use it whenever the user wants a premium, award-winning, "Awwwards", "SOTD", immersive or highly animated website, landing page, portfolio, launch or brand site, or says "make it look like landonorris.com", "site nível awwwards", "site com animações e scrolltrigger", "screenshot/Figma to code", "clone this design", "page transitions", "make it look expensive", or complains AI pages look generic. Also use it for any frontend build where visual craft and motion matter more than speed, even if "awwwards" is never said.
---

# Incridible Skill

Most AI-built sites look generated because every decision was a default: the same centered hero, the same three cards, a purple gradient, fade-up on everything. Awwwards-level sites start from one idea that belongs to the subject, express it through type, colour, imagery and motion that agree with each other, and ship fast enough that the motion feels like butter.

Awwwards judges on Design 40%, Usability 30%, Creativity 20%, Content 10%, and the Developer Award on semantics/SEO, animations, accessibility, performance, responsiveness and markup. This skill is organised around those scores.

This version (2.0) adds a tested component library, a second starter (multi-page, with transitions) and an inspector that scrolls with real wheel and touch input. Every component and both starters were run with real GSAP 3.15 and Lenis 1.3 in Chrome, and the bugs that testing found are written into the references so you do not repeat them.

## Six rules that decide the result

1. **Idea before pixels.** Write the one-sentence concept (Phase 3) before any markup. Without it the page falls back to template layout.
2. **Content is never hidden by animation.** Add the `motion` class from an inline `<head>` script, with a timeout that removes it if the libraries never arrive, and put hidden start states only under `.motion`. A page that is blank when a CDN hiccups scores zero.
3. **Start states come from GSAP, not CSS transforms.** GSAP reads a CSS `translateY(110%)` as pixels, so tweening `yPercent` back to 0 leaves headlines stuck inside their masks. This exact bug shipped in v1 and only real-library testing caught it.
4. **Real imagery and real copy.** Grey boxes and "Lorem ipsum" read as unfinished within one second. Find, generate or ask for real pictures, and write the words first.
5. **Motion is a system, not a sprinkle.** One easing family, a duration scale, a stagger rule, and a reason for every move (guide attention, show depth, confirm input, express brand voice).
6. **Prove it in a real browser with the real libraries.** Run `scripts/shoot.mjs`, look at the screenshots and the motion filmstrip at three widths, and fix every FAIL before reporting. Simulated or stubbed libraries hide the bugs that matter.

## Pick the route

| The user gives you | Route |
|---|---|
| A brief or nothing but a topic | **New build**: Phases 1 to 8 |
| A screenshot, mockup, Figma frame or photo of a design | **Image to code**: read `references/02-image-to-code.md` first, then Phases 4 to 8 |
| An existing site or repo to improve | **Redesign**: record "before" with `shoot.mjs`, keep stack, content and routes, then Phases 2 to 8 |
| A live site they admire ("like landonorris.com") | **Reference-inspired build**: tear it down with `references/07-reference-teardowns.md`, borrow technique and structure, never its photos, logos, text, brand names or characters. Ask for the user's own assets |

Always work in the user's stack when one exists. With no stack, start from a starter (below), because static HTML runs anywhere and is easiest to verify. React and Next work too: see the cleanup notes at the end of `references/03-motion-system.md`; the components are plain ES modules that can be called from an effect.

## Starters

| Starter | Direction | Use when |
|---|---|---|
| `assets/starters/monument/` | Name as monument, dark, single page, one file of JS | Personal brands, events, sport, launches. Loud, few sections |
| `assets/starters/editorial/` | Uneven photographs and sentence as layout, light paper, serif, three pages with curtain transitions | Studios, portfolios, hospitality, architecture, anything with a body of work |

Both are starting points to restyle, not templates to fill. Change the tokens, the type and the composition to match your direction; keep the safety patterns (inline motion class, failsafe, static fallback). The editorial starter imports the component library: copy `assets/components/` next to it as `components/`. Read `assets/starters/README.md` before using either.

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
3. **Depth**: WebGL or layered cutouts for one hero object (`references/04-webgl-and-depth.md`), or a shader background.
4. **Polish**: hover, focus, active and empty states, selection colour, favicon, OG image, 404.

Motion budget: at least 8 distinct elements move on a normal scroll, but only 1 or 2 things are loud in any viewport.

### Phase 6: Image to code (when a visual reference exists)
Follow `references/02-image-to-code.md`: probe, tile, extract tokens, build static, then loop `scripts/compare.py` until the diff is clean. Note which motion you invented.

### Phase 7: Gate
Serve the page over HTTP (ES modules do not load from `file://`) and run the inspector:

```bash
python3 -m http.server 4173 --directory <site-dir> &
node <skill>/scripts/shoot.mjs http://localhost:4173 --out .incridible/after
python3 <skill>/scripts/filmstrip.py .incridible/after --width 1440
```

At 1440, 768 and 390 px it checks static quality, scrolls in steps, then reloads and scrolls with **real wheel input (desktop, through Lenis) and real touch drags (mobile)**, measuring frame times and recording frames. It hovers every interactive element, tabs through the page for visible focus, and runs a reduced-motion pass. It catches text stuck inside masks, pages that do not scroll, flat hovers and library warnings. Look at the filmstrip: reveals mid-way, pins holding, nothing blank between frames.

When the CDNs are blocked (sandboxes, CI), get the real libraries first and serve them locally: `node <skill>/scripts/vendor.mjs` then add `--vendor .incridible/vendor`. Never judge motion with stub libraries. Also run once with `--block-cdn`: every section must still read.

Fix every FAIL. Then score the screenshots with the rubric in `references/08-qa-checklist.md`, fix the top three problems and shoot again, up to three rounds. For multi-page sites, click through one transition yourself (or script it) and check the back button.

If Chrome or Node 22 is missing, say so, use whatever browser tool exists, and run the checklist by hand.

### Phase 8: Report
Short and honest: direction and idea sentence, signature moment, stack and why, final inspector numbers (movers, real-input reach, p95 frame time, LCP, CLS, weight), what is placeholder, image credits, and anything not verified (for example "WebGL smoothness measured only in software rendering"). Do not recap every step.

## Stack defaults

- **Smooth scroll**: Lenis on fine pointers only, synced to GSAP's ticker; native momentum on touch (`components/scroll.js`).
- **Animation**: GSAP 3 with ScrollTrigger. GSAP and all its plugins (SplitText, Flip, Draggable, InertiaPlugin, ScrambleText, DrawSVG, MorphSVG, ScrollSmoother) are free, including commercial use. Use `gsap.matchMedia()` for breakpoints and reduced motion.
- **WebGL**: raw WebGL helpers in the components (distortion, shader background) and `assets/webgl/depth-hero.js`; Three.js only when you need a scene graph. Budget about 6 live WebGL canvases per page.
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
| `assets/components/` | 24 effects in 16 modules + `components.css`; `index.js` exports `boot()` and `initAll()` |
| `assets/starters/` | `monument/` (single page) and `editorial/` (three pages) |
| `assets/webgl/depth-hero.js` | Zero-dependency WebGL depth-parallax hero |
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
