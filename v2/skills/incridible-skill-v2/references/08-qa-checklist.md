# QA checklist and report

Run this in Phase 7. It has three parts: the automated gate, the visual critique, and the report.

## Contents
1. Automated gate (`shoot.mjs`)
2. Visual critique rubric
3. Motion audit
4. Manual checks
5. Image-to-code gate
6. Report format

## 1. Automated gate

```bash
python3 -m http.server 4173 --directory <site-dir> >/dev/null 2>&1 &
node <skill>/scripts/shoot.mjs http://localhost:4173 --out .incridible/after
```

Useful flags: `--widths 1440,768,390` (default), `--steps 10` (scroll frames per width), `--settle 3200` (ms to wait after load for the preloader), `--vendor DIR` (serve jsdelivr/unpkg/cdnjs scripts from DIR by file name, to test real libraries offline; fill DIR with `scripts/vendor.mjs`), `--block-cdn` (simulate the libraries failing to load, the page must still read), `--no-motion` (skip the real-input, hover and keyboard passes), `--no-reduced` (skip the reduced-motion pass), `--chrome /path/to/chrome`.

What each width gets: static checks; stepped screenshots; a full-page shot; then a fresh reload and a **real-input motion pass** (wheel through Lenis on desktop widths, raw touch drags on phone widths) that records frame times and up to 16 frames (`w<W>-motion-NN.jpg`); on desktop widths a **pointer pass** that hovers up to 14 interactive elements, and a **keyboard pass** that tabs 12 times. Desktop widths run with a fine pointer and hover, phone widths with touch, so pointer-only code really runs. Turn the frames into one image with `python3 scripts/filmstrip.py OUT --width 1440` (add `--gif` for an animation).

Outputs in the out folder: `report.md`, `report.json`, `w<width>-s<step>.png` frames, `w<width>-full.png` full-page screenshot.

FAIL means the page is not done:

| Code | Meaning | Usual fix |
|---|---|---|
| `overflow-x` | Horizontal scroll at that width | Find the element wider than the viewport; check `100vw`, negative margins, giant type |
| `no-h1`, `many-h1` | Heading structure | One h1 |
| `broken-image` | Image failed to load | Path or format |
| `console-error` | Uncaught exception or error log | Fix the script |
| `still-page` | Fewer than 8 elements changed transform, opacity or clip while scrolling | Add real motion, or check the triggers fire |
| `stuck-hidden` | Text still invisible after scrolling the whole page, including text pushed out of a tight mask (`clipped by …`) | A reveal never fired; a CSS transform start state fought GSAP percentages; a reveal re-hid itself after `clearProps` (see 09-components, pitfalls) |
| `reduced-hidden` | Text invisible under reduced motion | Hidden start states must exist only inside the motion branch |
| `placeholder-left` | `data-placeholder`, `lorem`, `TODO(content)` still present | Replace |
| `load-failed` | Page did not load | Server or URL |
| `scroll-stuck` | Real wheel or touch scrolling reached under 90% of the page | `lenis.stop()` left on, `overflow: hidden` on html/body, a pin or overlay eating input |
| `no-scroll-motion` | Under 5 elements changed during real scrolling after a fresh load | Triggers never fire under real input, or the page has no scroll motion at all |

WARN means "usually wrong, fix or be able to explain it": `small-text` (under 12 px), `tiny-target` (under 24 px on mobile), `missing-alt`, `no-lang`, `no-title`, `no-description`, `no-main`, `few-visuals` (fewer than 4), `heavy-page` (over 3 MB), `slow-lcp` (over 2.5 s), `layout-shift` (CLS over 0.1, with the elements that shifted), `font-count` (more than 2 families), `jank` (p95 frame time over 50 ms during real scrolling; headless uses software rendering, so compare runs rather than trusting the number), `flat-hover` (under half of interactive elements change on hover), `focus-invisible` (focused element shows no ring), `focus-offscreen` (focus lands on something off screen, often a closed menu), `lib-warning` (GSAP, ScrollTrigger, Lenis or WebGL warnings in the console, e.g. a missing target), `vendor-miss` (`--vendor` had no file for a CDN request).

Run again with `--block-cdn`. The page must still show every section; only the animation is allowed to be missing.

## 2. Visual critique rubric

Open the screenshots (the frames and the full page). Score each 1 to 10 and write one sentence of evidence. Weights are the Awwwards weights.

| Criterion | Weight | A 9 looks like |
|---|---|---|
| Design | 40% | A clear idea carried by type, colour, image and layout; confident scale contrast; nothing generic; consistent system |
| Usability | 30% | First screen explains itself in 5 seconds; navigation obvious; interactions discoverable; mobile is its own composition; accessible |
| Creativity | 20% | A signature moment tied to the subject; a surprise that still serves the goal |
| Content | 10% | Real, specific copy and imagery; strong structure; consistent captions and voice |

Weighted score = 0.4 Design + 0.3 Usability + 0.2 Creativity + 0.1 Content. Under 8: fix the three lowest-scoring problems and shoot again. Maximum three rounds.

Tests that expose problems quickly:
- **Squint test**: blur or shrink the full-page screenshot. Can you see rhythm, hierarchy and one focal point per screen?
- **Swap test**: replace the brand name with a competitor's. If nothing breaks, the concept is generic.
- **Screenshot test**: would any single frame look good as a portfolio image?
- **First-second test**: what is visible 1.2 s after load, and is it the title and a striking visual?

## 3. Motion audit

For the scroll frames and a manual scroll:
- Is there a reason for every move? List the three loudest and say what each is for.
- Is the easing family consistent? Durations within the scale?
- Do reveals begin before the element is fully in view and finish before the reader needs it?
- Does anything block reading (long preloader, slow reveal after a fast scroll)?
- Do pinned scenes have enough scroll distance for their content?
- Does it feel smooth at 4x CPU throttle on the user's machine? (not measurable in the headless run; say so)
- Read the filmstrip: every frame should show content, reveals should be visible mid-way in some frames, pinned scenes should hold while their content changes, and no frame should be mostly empty.
- Click what scrolling cannot reach: one page transition and the back button, each filter, a slider by drag and by arrow keys, menus and accordions.

## 4. Manual checks

- Keyboard: tab through everything, focus visible and ordered, menu opens and closes with keys.
- Hover, focus, active and disabled states exist for every control.
- Text selection, find-in-page and anchor links work with smooth scroll.
- Resize between breakpoints without reloading; triggers refresh.
- Reload at the middle of the page; nothing is stuck hidden.
- Back/forward navigation and page transitions behave.
- No `lorem`, no TODO, no placeholder boxes, no broken links.

## 5. Image-to-code gate

When a reference image exists, also run:

```bash
python3 <skill>/scripts/compare.py ref.png .incridible/after/w1440-full.png --out .incridible/diff
```

Targets: similarity 0.90 or higher for photographic layouts, 0.95 or higher for flat UI; no grid cell under 0.75 except substituted imagery; section heights within 2%. Report remaining differences and why (substituted font, replaced photo, inferred motion).

## 6. Report format

Keep it short and plain.

```
Direction: <name>. Idea: <one sentence>. Signature moment: <what the visitor does>.
Stack: <libs>, why.
Result (shoot.mjs): 0 FAIL, <n> WARN; movers <n>; real-input reach 100% (wheel and touch); p95 frame <ms> (software); hover <n>/<n>; focus <n>/<n>; LCP <s>; weight <MB>; CLS <x>; reduced motion OK; blocked CDN OK; libraries: real (CDN or vendored).
Scores (last round): Design x, Usability x, Creativity x, Content x, weighted x. Remaining weakness: <one line>.
Placeholders / user must supply: <list>.
Images and licences: <title, creator, licence, source, where credited>.
Not verified here: <e.g. WebGL smoothness on real GPU, real-device touch>.
```
