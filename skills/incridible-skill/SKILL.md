---
name: incridible-skill
description: Builds Awwwards-level websites with art direction, GSAP + ScrollTrigger + Lenis motion, WebGL/depth-map heroes, custom cursors, pinned and horizontal scroll, preloaders, page transitions and pixel-faithful image-to-code, then verifies the result in a real browser. Use this skill whenever the user wants a premium, award-winning, "Awwwards", "SOTD", immersive, cinematic or highly animated website or landing page, a portfolio, product launch, brand or personal-brand site, or says things like "make it look like landonorris.com", "site nível awwwards", "site com animações e scrolltrigger", "screenshot/image/Figma to code", "clone this design", "redesign this page so it looks expensive", or complains that AI-generated pages look generic. Also use it for any frontend build where visual craft, motion and interaction matter more than speed, even if the user never says "awwwards".
---

# Incridible Skill

Most AI-built sites look generated because every decision was a default: the same centered hero, the same three cards, a purple gradient, fade-up on everything. Awwwards-level sites are the opposite. They start from one idea that belongs to the subject, express it through type, colour, imagery and motion that all agree with each other, and ship fast enough that the motion feels like butter.

Awwwards judges on Design 40%, Usability 30%, Creativity 20%, Content 10%, and the Developer Award on semantics/SEO, animations, accessibility, performance, responsiveness and markup. This skill is organised around those scores, so every phase below says what it buys you.

## Five rules that decide the result

1. **Idea before pixels.** Write the one-sentence concept (Phase 3) before any markup. Without it the page falls back to template layout.
2. **Content is never hidden by animation.** Hidden start states are applied only after GSAP has loaded and `prefers-reduced-motion` is checked. If a script fails the page must still read. A beautiful page that is blank when a CDN hiccups scores zero.
3. **Real imagery and real copy.** Grey boxes and "Lorem ipsum" read as unfinished within one second. Find, generate or ask for real pictures, and write the words first.
4. **Motion is a system, not a sprinkle.** One easing family, a duration scale, a stagger rule, and a reason for every move (guide attention, show depth, confirm input, express brand voice).
5. **Verify in a real browser.** Run `scripts/shoot.mjs` and look at the screenshots at three widths before reporting. Claims like "looks great" need evidence.

## Pick the route

| The user gives you | Route |
|---|---|
| A brief or nothing but a topic | **New build**: Phases 1 to 8 |
| A screenshot, mockup, Figma frame or photo of a design | **Image to code**: read `references/02-image-to-code.md` first, then Phases 4 to 8 |
| An existing site or repo to improve | **Redesign**: record "before" with `shoot.mjs`, keep stack, content and routes, then Phases 2 to 8 |
| A live site they admire ("like landonorris.com") | **Reference-inspired build**: tear the reference down with `references/07-reference-teardowns.md`, borrow technique and structure, never its copyright (photos, logos, text, brand names, characters). Ask for the user's own assets |

Always work in the user's stack when one exists. With no stack, deliver a single-folder static site (`index.html`, `styles.css`, `main.js`) from `assets/starter/`, because it runs anywhere and is easiest to verify. React/Next works too: see the cleanup notes in `references/03-motion-system.md`.

## Workflow

### Phase 1: Inventory and brief
List 8 to 12 specifics that only this client has: the name and its meaning, numbers, places, materials, a signature object, a catchphrase, the audience's slang, one hard constraint. Then write the page as claims with proof, one line per section ("We roast on Mondays; proof: the 06:00 batch photo"). Sections come from the argument, never from a template. If the brief is thin, ask at most one question, or state the assumption in your report and go on.

### Phase 2: Direction
Choose one art direction from `references/01-direction-and-concept.md` (name as monument, pinned poster, colour chapters, the object large, uneven photographs, the dark room, and others). Choose the one that can carry something from your inventory. Fix the palette (2 to 4 colours with one loud accent), type pair, imagery treatment and motion character now, as design tokens, so later work stays coherent.

### Phase 3: The idea and the signature moment
Write one sentence: "On this page, [something that belongs to the subject] becomes [the device the direction calls for]." Test it: would it still work for the nearest competitor? If yes, it is too generic. Then plan exactly one signature interaction the visitor can do or trigger (drive a car vertically, scrub a timeline, lock the helmet, drag to reveal). Everything else supports it.

### Phase 4: Foundations
Set tokens in CSS custom properties: colours, fluid type scale (`clamp()`), spacing scale, easings, durations, radii. Choose fonts (`references/05-typography-color-layout.md`). Build the grid and the responsive rules. Plan mobile as its own composition, not a squeezed desktop.

### Phase 5: Build in layers
Layers, in this order, so each can be verified alone:
1. **Static**: semantic HTML, all real content, tokens, layout, responsive. It must already look designed with JavaScript off.
2. **Motion**: Lenis + GSAP ScrollTrigger recipes from `references/03-motion-system.md` (preloader, line reveals, pinned scenes, horizontal scroll, clip-path reveals, marquee, magnetic buttons, cursor, page transitions).
3. **Depth**: WebGL or layered cutouts for one hero object, from `references/04-webgl-and-depth.md`.
4. **Polish**: states (hover, focus, active, empty, loading), grain, selection colour, favicon, OG image, 404.

Motion budget: at least 8 distinct elements move on a normal scroll, but only 1 to 2 things are allowed to be "loud" in any viewport. Everything else is quiet. Motion that fights for attention reads as noise.

### Phase 6: Image to code (when a visual reference exists)
Follow `references/02-image-to-code.md`: probe the image, slice it into readable tiles, extract tokens, build static, then loop `scripts/compare.py` until the diff is clean. Infer the motion the picture implies (cropped giant type suggests pinning, overlapping layers suggest parallax) and note which motion you invented.

### Phase 7: Gate
Serve the page and run:

```bash
python3 -m http.server 4173 --directory <site-dir> &
node <skill>/scripts/shoot.mjs http://localhost:4173 --out .incridible/after
```

It opens real Chrome at 1440, 768 and 390 px, scrolls the whole page taking screenshots, counts moving elements, finds content stuck hidden, checks reduced motion, console errors, broken images, overflow, headings, alt text, tap targets, LCP, CLS and page weight. Every FAIL gets fixed. Then read the screenshots yourself and score them with the rubric in `references/08-qa-checklist.md`; fix the top three problems and shoot again, up to three rounds. For a reference-based build also run `compare.py`.

If Chrome or Node 22 is unavailable, say so in the report, take screenshots with whatever browser tool exists, and run the checklist by hand.

### Phase 8: Report
Short and honest: the direction and the idea sentence, the signature moment, the stack and why, final `shoot.mjs` numbers (movers, LCP, weight), what is placeholder or user-supplied, image credits and licences, and anything not verified (for example "WebGL checked only in software rendering"). Do not recap every step.

## Stack defaults

- **Smooth scroll**: Lenis, synced to GSAP's ticker. Disable it on touch devices if you see jank (see the sync snippet).
- **Animation**: GSAP 3 with ScrollTrigger (GSAP and its plugins are free to use). Use `gsap.matchMedia()` for breakpoints and reduced motion.
- **3D / shaders**: raw WebGL via `assets/webgl/depth-hero.js` for a depth-map hero, Three.js when you need a scene graph. Rive for interactive vector characters.
- **Fonts**: free families from Fontshare or Google Fonts, preloaded, `font-display: swap`, maximum two families.
- **Transitions between pages**: View Transitions API with a clip-path fallback.
- CDN tags use major-version URLs (`gsap@3`, `lenis@1`) so they resolve to current releases. Pin exact versions before production.

## Bundled resources

Read these when the phase calls for them, not all at once.

| File | Read when |
|---|---|
| `references/01-direction-and-concept.md` | Phases 1 to 3: anti-generic list, directions menu, idea test, content rules |
| `references/02-image-to-code.md` | The user supplied any picture of a design |
| `references/03-motion-system.md` | Phase 5 motion: tokens, 15 tested recipes, performance and cleanup rules |
| `references/04-webgl-and-depth.md` | Hero depth effect, shaders, gooey blobs, cutout text sandwich, video, Rive |
| `references/05-typography-color-layout.md` | Phase 4: type pairs, scale, colour, grid, imagery, responsive |
| `references/06-performance-a11y.md` | Developer-award criteria and the fixes for each |
| `references/07-reference-teardowns.md` | Studying a live reference; verified notes on landonorris.com and Taste Skill |
| `references/08-qa-checklist.md` | Phase 7: rubric, thresholds, report format |
| `assets/starter/` | Working base: preloader, Lenis+GSAP, line reveals, pinned and horizontal scenes, marquee, cursor, magnetic button |
| `assets/webgl/depth-hero.js` | Zero-dependency WebGL depth-parallax hero with cursor ripple |
| `scripts/shoot.mjs` | Real-browser inspector (Node 22 + Chrome, no installs) |
| `scripts/compare.py` | Pixel and structural diff between a reference image and a screenshot |
| `scripts/img_probe.py` | Image info, palette, labelled pixel ruler, tiles, crops |

## Taste calls that separate 7s from 9s

- Scale contrast: one thing huge, the rest small. Timid type is the fastest tell.
- Spend the accent colour like money. On landonorris.com a single lime on near-black does all the work.
- Show the subject, not decoration. Photography and the product itself beat gradients and icons.
- Brand voice in micro-interactions: loader labels, cursor text, rotate-your-device messages, hover captions. Write them like the subject would speak.
- Rhythm: alternate dense and empty, loud and quiet, dark and light sections. Monotone pacing is boring even when each section is good.
- Edit hard. Remove the third animation on a section, the fourth font weight, the fifth colour.
- Details nobody asked for: custom focus ring, selection colour, caret colour, scrollbar, favicon, `theme-color`, a real 404.
