# Component library

`assets/components/` holds 24 effects in 16 plain ES modules. Each one is switched on by data attributes, falls back to static content without GSAP or with reduced motion, and was run with real GSAP 3.15 and Lenis 1.3 in Chrome at 1440, 768 and 390 px (wheel and touch scrolling, hover and keyboard passes).

Use them to serve the idea, not to collect effects. A good page uses three to six, plus one custom signature moment.

## Contents
1. Wiring
2. Catalogue (what, when, markup)
3. Choosing for a direction
4. Rules every component follows
5. Testing a page that uses them
6. Pitfalls found in real testing

## 1. Wiring

Copy `assets/components/` into the site as `components/`. Then:

```html
<head>
  <script>
    /* motion class before first paint, curtain cover on arrival, 7 s failsafe */
    (function (d) { var r = d.documentElement;
      try { if (sessionStorage.getItem('pt')) r.classList.add('pt-enter'); } catch (e) {}
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { r.classList.add('no-motion'); return; }
      r.classList.add('motion');
      setTimeout(function () { if (window.__awwwardsReady) return; r.classList.remove('motion', 'pt-enter'); r.classList.add('no-motion'); }, 7000);
    })(document);
  </script>
  <link rel="stylesheet" href="components/components.css">
  <link rel="stylesheet" href="site.css">
  <script defer src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js"></script>
  <!-- only the plugins you use: SplitText, Flip, Draggable, InertiaPlugin, ScrambleTextPlugin -->
  <script defer src="https://cdn.jsdelivr.net/npm/lenis@1/dist/lenis.min.js"></script>
  <script type="module">
    import { boot } from './components/index.js';
    boot({ smooth: { fineOnly: true, anchorOffset: 80 } });
  </script>
</head>
```

Module scripts run after deferred classic scripts, in document order, so GSAP is ready when `boot()` runs. `boot()` sets `.motion` or `.no-motion` for real, starts Lenis, plays the arrival transition, then calls `initAll()`, which wires every component found and sorts and refreshes ScrollTrigger once.

For one or two effects, import the module directly: `import { init } from './components/stack-cards.js'; init();`. Every `init` returns a cleanup function (call it on route change in SPAs).

Pages must be served over HTTP. ES modules do not load from `file://`.

## 2. Catalogue

| Effect | Module | Plugins | Markup | Good for |
|---|---|---|---|---|
| Smooth scroll + anchors | `scroll.js` | Lenis (optional) | automatic in `boot()` | every page |
| Page transitions | `page-transition.js` | — | `.curtain` element; `<html data-transition="curtain\|view">`; `data-transition-label` on links | multi-page sites |
| Line / word / char reveal | `split-reveal.js` | SplitText (fallback built in) | `data-reveal-split="lines\|words\|chars"`, `data-trigger="load"`, `data-delay`, `data-stagger` | headlines, ledes |
| Text scramble | `text-scramble.js` | ScrambleText (fallback built in) | `data-scramble` or `data-scramble="hover"` | labels, nav, status lines |
| Image trail | `image-trail.js` | — | `data-image-trail="a.webp, b.webp"` on a section | portfolio heroes, fine pointer |
| Stacking cards | `stack-cards.js` | ScrollTrigger | `data-stack` > `data-stack-card` | services, steps, chapters |
| Filter / layout with Flip | `flip-filter.js` | Flip | `data-flip-filter`, `data-filter`, `data-layout`, `data-flip-grid`, `data-flip-status` | work indexes, shops |
| Draggable slider | `drag-slider.js` | Draggable, InertiaPlugin | `data-drag-slider` > `data-track`, `data-progress` | galleries; native swipe on touch |
| SVG draw | `draw-svg.js` | — | `data-draw` or `data-draw="scrub"` on an svg | signatures, routes, diagrams |
| WebGL image distortion | `webgl-distort.js` | — | `data-distort` on a figure with an img; `data-distort-scroll` | hero images, key projects |
| Shader background | `shader-bg.js` | — | `data-shader-bg="#c1, #c2, #c3"`, `data-grain`, `data-resolution` | heroes, footers |
| Cursor-proximity weight | `variable-type.js` | variable font | `data-proximity data-weight="300,800"` | one statement per page |
| Scroll-driven font axis | `variable-type.js` | ScrollTrigger, variable font | `data-scroll-axis="wght" data-from data-to` | principles, manifestos |
| Expanding media | `expand-media.js` | ScrollTrigger | `data-expand` > `data-expand-media`, `data-expand-left/right` | chapter breaks, featured project |
| Batch reveal | `interactions.js` | ScrollTrigger | `data-reveal="up\|fade\|scale"` | grids, lists, cards |
| Image inside frame drift | `interactions.js` | ScrollTrigger | `data-inner-parallax="8"` on a figure | editorial images |
| Element parallax | `interactions.js` | ScrollTrigger | `data-speed="0.85"` | uneven photo layouts, headers |
| Custom cursor | `interactions.js` | — | automatic; `data-cursor="View"` for labels | fine pointer sites |
| Magnetic | `interactions.js` | — | `data-magnetic` or `data-magnetic="0.3"` | CTAs, nav |
| 3D tilt + glare | `interactions.js` | — | `data-tilt="8"` | cards, product shots |
| Marquee | `interactions.js` | — | `data-marquee` > one row with content duplicated (copy `aria-hidden`) | clients, partners |
| Count-up | `interactions.js` | — | `data-count="64" data-suffix="%"` | numbers that matter |
| Smooth accordion | `interactions.js` | — | `<details data-accordion>` | FAQ, specs |
| Scroll progress | `interactions.js` | ScrollTrigger | `.progress-bar > i` | long pages |
| 3D object on the page | `../three/stage.js` (separate entry, needs the three import map) | Three.js r187 | `data-stage data-model data-mode data-keyframes data-reveal` | heroes, products, athletes; see `references/10-3d-modeling.md` |

## 3. Choosing for a direction

| Direction (from 01) | Components that fit |
|---|---|
| Name as monument | split-reveal chars on load, parallax, marquee, magnetic CTA, cursor |
| Sentence is the layout | split-reveal lines, word fill (monument starter), variable-type proximity |
| Pinned poster | expand-media, stack-cards, custom pinned timeline |
| Colour chapters | colour chapter recipe (03, 3.6), reveal, counters |
| The place carries it | expand-media, inner-parallax, shader-bg with photo colours |
| The object, large | depth hero, tilt, webgl-distort on hover |
| Uneven photographs | parallax with mixed speeds, inner-parallax, drag-slider, image-trail |
| The product performs | stack-cards for states, flip-filter, counters |
| The dark room | shader-bg dark, cursor with labels, distort |
| Split stage | cursor labels, hover pair recipe (03, 3.11) |
| The quiet instrument | split-reveal lines only, accordion, one draw-svg line |
| Type and nothing else | variable-type both modes, scramble, split chars |

## 4. Rules every component follows

- **Static first**: without GSAP, with reduced motion, or on a coarse pointer (for pointer effects) the markup stays readable and usable. The drag slider is a native scroll-snap row; stacking cards still stick with CSS; the accordion is native `<details>`.
- **Start states set by GSAP**, never by CSS transforms. CSS only hides elements under `.motion` until a component marks them (`is-split`, `is-revealed`).
- **Accessible**: split and variable text keep an `aria-label` with the real words; decorative layers are `aria-hidden`; Flip status is announced in a live region; the slider moves with arrow keys; the cursor never hides on inputs.
- **Cheap when idle**: WebGL and rAF loops stop when off-screen, when the tab is hidden, or when nothing changes. Distortion redraws only while hovered unless `data-distort-scroll` is set.
- **Cleanup**: every `init` returns a function that reverts what it changed.

## 5. Testing a page that uses them

```bash
node <skill>/scripts/vendor.mjs                     # only when CDNs are blocked
node <skill>/scripts/shoot.mjs http://localhost:4173/ --vendor .awwwards/vendor --out .awwwards/home
python3 <skill>/scripts/filmstrip.py .awwwards/home --width 1440
```

Run the inspector on every page, not only the home page. Then click through things the scroll cannot reach: a page transition and the back button, each filter, list view, an accordion, the slider by drag and by keys.

## 6. Pitfalls found in real testing

Each of these shipped or nearly shipped while building v2, and each was caught only with real libraries and real input:

1. **Headline stuck in its mask.** CSS `translateY(110%)` plus GSAP `yPercent: 0` leaves a pixel offset. Inspector code: `stuck-hidden (clipped by …)`.
2. **Revealed content hidden again.** A reveal that clears its inline opacity (`clearProps`) lets the CSS start state (`opacity: 0`) win again. Mark the element (`is-revealed`) before clearing and scope the CSS rule with `:not(.is-revealed)`.
3. **Desktop code never running in tests.** Headless Chrome reports no hover and no fine pointer, so Lenis, the cursor and magnetic effects silently stayed off. The inspector now forces a fine pointer on desktop widths and a touch pointer on phone widths.
4. **One-time reveals invisible to the motion test.** They had already fired during the stepped screenshots. The inspector now reloads the page before the real-input pass.
5. **Headings that vanish.** A pinned split headline faded to opacity 0 at the end of its timeline. Move words out through the edges instead; a heading should never become invisible.
6. **Display type overflowing when the font fails.** A condensed display face that does not load falls back to a wide font and the monument headline overflows. The monument starter's `data-fit` scales the headline to the width actually available.
7. **WebGL everywhere.** Eight distortion canvases redrawing on every scroll frame is heavy on any GPU. Scroll-driven distortion is now opt-in per image.
8. **Synthetic touch gestures do nothing in headless Chrome.** The inspector drags with raw touch events instead.
