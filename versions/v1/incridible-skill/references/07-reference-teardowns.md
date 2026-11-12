# Reference teardowns

Use this to study a live site the user admires and turn its craft into your own work. Borrow technique, structure and rhythm. Do not copy the photographs, logos, text, brand names, characters or code of the site.

## Contents
1. Procedure for tearing down any live site
2. Stack detector snippet
3. Verified notes: landonorris.com
4. Verified notes: Taste Skill (tasteskill.dev)
5. Lessons from public case studies
6. Sites that could not be analysed here
7. Teardown template

## 1. Procedure for tearing down any live site

1. **Look first.** Open the page at 1440 and 390, scroll slowly top to bottom, note what moves and what does not. Record the order of sections and what each one claims.
2. **Screenshot by scroll position.** `node <skill>/scripts/shoot.mjs <url> --out .incridible/ref --steps 16` gives you frames at even scroll positions plus the full page.
3. **Detect the stack** with the snippet below (run it in a browser tool's JavaScript console, or evaluate it through a browser MCP).
4. **Inspect structure.** Read headings, landmarks, data attributes, class naming, which parts are canvas or video versus DOM.
5. **Inspect motion.** Look for GSAP/ScrollTrigger counts, Lenis, `getAnimations()`, CSS transitions on key elements. Note easing and durations by watching.
6. **Note tokens.** Colours (computed styles), fonts (`document.fonts`, computed font-family), type sizes, spacing.
7. **Write the teardown** (template at the end), then decide which techniques serve your own idea sentence. Skip the rest.

If a fetch tool refuses a site, say so and ask the user for screenshots or a screen recording instead of guessing.

## 2. Stack detector snippet

```js
(() => {
  const w = window, out = {};
  out.gsap = !!w.gsap && w.gsap.version;
  out.scrollTrigger = !!w.ScrollTrigger && w.ScrollTrigger.getAll().length;
  out.lenis = !!(w.lenis || w.Lenis);
  out.locomotive = !!w.LocomotiveScroll;
  out.three = !!w.THREE && w.THREE.REVISION;
  out.pixi = !!w.PIXI; out.barba = !!w.barba; out.swup = !!w.Swup;
  out.rive = !!w.rive || [...document.scripts].some(s => /rive/i.test(s.src));
  out.webflow = !!w.Webflow || document.documentElement.hasAttribute('data-wf-site');
  out.framer = !!document.querySelector('[data-framer-name]');
  out.next = !!w.__NEXT_DATA__; out.nuxt = !!w.__NUXT__;
  out.canvases = [...document.querySelectorAll('canvas')].map(c => c.width + 'x' + c.height);
  out.videos = document.querySelectorAll('video').length;
  out.runningAnimations = document.getAnimations().length;
  out.scripts = [...document.scripts].map(s => s.src).filter(Boolean).slice(0, 40);
  out.fonts = [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight);
  out.bodyBg = getComputedStyle(document.body).backgroundColor;
  return out;
})();
```

## 3. Verified notes: landonorris.com

Facts from the page source and public write-ups (Awwwards, DesignRush, a Syntax stack explainer). Treat as a bar for craft.

**Recognition.** Awwwards Site of the Day (17 Nov 2025) and Site of the Year 2025, plus the Developer Award. Built by the agency OFF+BRAND. Awwwards lists its colour palette as two colours, `#D2FF00` and `#111112`; DesignRush lists four, adding `#2D3126`, `#F4F3F1` and `#7F8177`.

**Stack signals.**
- Built on Webflow (assets served from `cdn.prod.website-files.com`), with custom code on top.
- Three.js with depth maps and custom shaders for the hero, CSS masking for several effects, and Rive for interactive vector pieces (Rive placeholders exist in the markup for the footer and the collaborations area). The Syntax explainer also notes performance-minded choices: animating with transforms and avoiding drop shadows.
- The hero image is reactive: blob-like overlays move across it with the cursor, turning a still photo into a responsive surface.

**Structure and rhythm (from the home page markup).**
- Loader and first screen: a loader labelled in the brand's voice, then a hero with the name as the monument, a "next race" cue, and a "tap to lock" interaction. On phones the site asks to rotate the device because the intro is a vertical drive.
- A message section: large statement with single words emphasised, signature SVG in the accent colour, and a run of photographs in a horizontal flow, each captioned "Place, Year" (for example "Qatar, 2024").
- A modular split: giant stacked words "ON TRACK" and "OFF TRACK", each with a one-line description and a link, separating results from culture.
- A "Hall of Fame" section: a long list of helmets, each with a base and a hover image and a mask extender image, grouped by year. This is the base/hover pair recipe (`03-motion-system.md` 3.11).
- Store feature, partner and campaign logos (marquee-style), social grid, a footer with a giant line ("Always bringing the fight."), a 360-style helmet image and a row of partner logos.
- Pages: Home, On Track, Off Track, Partnerships, Calendar, plus a store on a separate domain.

**Why it wins.**
- One idea, personal identity as racing: the name as monument, the neon helmet as the accent, "vertical drive" as the signature interaction.
- Two-colour discipline. The accent never competes with photography.
- Tiny editorial details (captions, signature, labels) carry the voice.
- Strong content structure: results vs culture; helmets as a collectible archive.
- Weak spot to beat: accessibility scored the lowest in the Developer Award votes (7.0 of 10).

## 4. Verified notes: Taste Skill (tasteskill.dev)

An open-source agent skill for design taste. Useful process ideas, restated:
- The build is a pipeline: inventory what only the client has, deal a direction from a library of researched compositions, write the idea in one sentence with a live element, build with real pictures, run a real-browser inspector, then look at screenshots and fix the top problems for up to three rounds.
- Its inspector checks headline line counts, a clear title in one `h1` within 1.2 seconds, equal outer margins, no giant blank stretches, enough real pictures (at least four), at least eight moving elements, no text hidden under reduced motion, and font and contrast sanity at 1440, 768 and 390 px.
- Imagery order: the project's own, generated, openly licensed real pictures with credits recorded, drawn in code, then placeholders. Only commercial-use licences and the credit stays on the page.
- Judging uses the Awwwards weights (design 40, usability 30, creativity 20, content 10).
- A redesign records the "before", keeps the stack and content, and proves the "after" with side-by-side measurements.

This skill adopts the process (inventory, idea, inspect, look-and-fix) and the thresholds, and adds the motion, WebGL and image-to-code layers.

## 5. Lessons from public case studies

From Codrops write-ups of Webflow + GSAP builds that won recognition:
- Complex motion in Webflow usually needs custom GSAP; keep selectors explicit via data attributes, and keep the animation code organised by section.
- Disable Lenis on mobile if scrolling feels wrong in in-app browsers.
- Replace GSAP pinning with CSS sticky where the interaction allows.
- In scrubbed callbacks use `gsap.set`, not `gsap.to`.
- ScrollTrigger parallax can replace a heavier scroll library for simple depth effects.

## 6. Sites that could not be analysed here

The following were provided as references but could not be opened with the available tools when this skill was written, so there are no verified notes for them. Do not infer details.
- `why.zero.university`
- `auge-xp.com`

If the user wants them included, open them with a browser tool, run the stack detector and `shoot.mjs --steps 16`, and fill the template below. Add the result to this file.

## 7. Teardown template

```
Site / URL / agency / award:
Idea sentence (inferred):
Stack (from detector):
Palette (hex, roles):
Type (families, sizes of hero, body, label):
Sections in order, each with: claim, composition, motion:
Signature interaction:
Loader / transitions:
Mobile adaptation:
What to borrow (technique only):
What not to borrow (assets, brand, copy):
Weak spots to beat:
```
