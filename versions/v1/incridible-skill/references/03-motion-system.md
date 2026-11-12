# Motion system

Read this in Phase 5. All snippets assume vanilla JS with GSAP 3 and ScrollTrigger loaded globally, and Lenis for smooth scroll. The same code works in React or Next with the cleanup notes at the end. A working assembly of most recipes is in `assets/starter/main.js`.

## Contents
1. Principles and tokens
2. Setup: Lenis + ScrollTrigger + reduced motion
3. Recipes
   1. Preloader and hero gate
   2. Line reveal for headlines
   3. Pinned scrubbed scene
   4. Horizontal scroll gallery
   5. Clip-path image reveal with inner parallax
   6. Colour chapters
   7. Word-by-word scroll fill
   8. Marquee with velocity
   9. Magnetic button
   10. Custom cursor with blob follower and labels
   11. Hover image pair with mask
   12. Count-up numbers
   13. Menu overlay
   14. Page transitions
   15. Scroll-velocity skew
4. Performance rules
5. Debugging
6. React and Next

## 1. Principles and tokens

Every move needs a reason: guide attention, show depth, confirm input, express brand voice. If there is no reason, delete it.

Define the system once and reuse it.

```css
:root {
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);      /* expo-out feel: fast start, long settle */
  --ease-inout: cubic-bezier(0.76, 0, 0.24, 1);   /* panels, curtains */
  --ease-soft: cubic-bezier(0.25, 1, 0.5, 1);     /* hovers */
  --dur-micro: 0.25s;  /* hovers, presses */
  --dur-ui: 0.6s;      /* menus, toggles */
  --dur-reveal: 1.1s;  /* text and image reveals */
  --dur-scene: 1.6s;   /* hero and loader */
}
```

GSAP equivalents: `power4.out` or `expo.out` for reveals, `power3.inOut` or `expo.inOut` for panels, `power2.out` for hovers. Use `CustomEase` only when a recipe truly needs it.

Rules of rhythm:
- Stagger 0.06 to 0.12s per item for lines or words, never more than 0.6s total.
- One easing family per page. Mixed bounce, elastic and linear reads as amateur.
- Entering things decelerate (`out`), leaving things accelerate (`in`), moving between positions ease both ends (`inOut`).
- Slow is expensive. Reveals longer than 1.4s annoy on the second scroll. Preloader at most 2.5s unless the real load is longer.
- Loud moves: 1 to 2 per viewport. Everything else subtle.

## 2. Setup

```html
<script defer src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/lenis@1/dist/lenis.min.js"></script>
<script defer src="main.js"></script>
```

```js
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canMove = !!(window.gsap && window.ScrollTrigger) && !reduce;

// Hidden start states in CSS only exist under .motion, so a failed script never hides content.
// Add `motion` from a tiny inline <head> script (before first paint, so layout never jumps), with a
// 7 s timeout that removes it if the libraries never arrive. The starter's index.html shows the pattern.
document.documentElement.classList.toggle('motion', canMove);
document.documentElement.classList.toggle('no-motion', !canMove);
if (!canMove) { /* remove preloader, show everything, stop here */ }

gsap.registerPlugin(ScrollTrigger);

// Smooth scroll, driven by GSAP's ticker so both share one clock.
const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
```

Notes learned from shipped Awwwards-level Webflow and GSAP builds:
- If Lenis causes jank on phones or in in-app browsers, simply skip it on touch devices (`if (matchMedia('(pointer: fine)').matches) { ...new Lenis }`). Native momentum scrolling on mobile is usually better than a simulated one.
- Pinning with `pin: true` can be heavy on mobile; swapping it for CSS `position: sticky` plus a scrubbed tween on the inner element is more robust.
- Inside a scrubbed `onUpdate`, write with `gsap.set` (or `quickSetter`), not `gsap.to`, so no new tween is created every frame.
- Call `ScrollTrigger.refresh()` after fonts and images finish loading (`document.fonts.ready`, `window.addEventListener('load')`), because layout shifts move every trigger.

Reduced motion with `gsap.matchMedia`:

```js
const mm = gsap.matchMedia();
mm.add({ full: '(prefers-reduced-motion: no-preference)', small: '(max-width: 767px)' }, (ctx) => {
  const { full, small } = ctx.conditions;
  if (!full) return;            // reduced motion: leave the static layout alone
  // build tweens here; they are reverted automatically when the condition stops matching
});
```

## 3. Recipes

### 3.1 Preloader and hero gate

The preloader is part of the brand voice, not a spinner. Keep it short and make the hero entrance start as it exits. Never let it block content longer than the real load.

```html
<div class="loader" aria-hidden="true">
  <span class="loader__label">Loading the lap</span>
  <span class="loader__count">0</span>
</div>
```

```js
function runLoader() {
  const loader = document.querySelector('.loader');
  const count = loader.querySelector('.loader__count');
  const state = { n: 0 };
  const done = new Promise((res) => {
    const tl = gsap.timeline({ onComplete: res });
    tl.to(state, { n: 100, duration: 1.4, ease: 'power2.inOut',
        onUpdate: () => (count.textContent = Math.round(state.n)) })
      .to(loader, { yPercent: -100, duration: 0.9, ease: 'expo.inOut' }, '+=0.1');
  });
  return done;
}
// Wait for the real load as well, with a timeout, so a slow image never hangs the page.
const ready = Promise.race([
  Promise.all([document.fonts.ready, new Promise((r) => addEventListener('load', r, { once: true }))]),
  new Promise((r) => setTimeout(r, 4000)),
]);
Promise.all([ready, runLoader()]).then(() => { loader.remove(); playHeroIn(); });
```

Add the failsafe: if anything throws, remove the loader and show content.

### 3.2 Line reveal for headlines

Wrap each visual line in a mask and slide the inner span up. Split after fonts are ready and re-split on resize (debounced), otherwise line breaks are wrong.

```css
.line { display: block; overflow: hidden; padding-bottom: 0.08em; margin-bottom: -0.08em; } /* room for descenders */
.line__inner { display: inline-block; will-change: transform; }
.motion [data-split] .line__inner { transform: translateY(110%); }
```

```js
gsap.from(inners, { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.09,
  scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
```

Keep a visually hidden copy of the text for screen readers and mark the visual lines `aria-hidden`. GSAP's SplitText (now free) is the robust choice when the heading contains inline markup; the starter's own splitter handles plain text.

### 3.3 Pinned scrubbed scene

```js
const tl = gsap.timeline({
  scrollTrigger: { trigger: '.scene', start: 'top top', end: '+=250%', scrub: 0.6, pin: true, anticipatePin: 1 },
});
tl.to('.scene__bg', { scale: 1.25, ease: 'none' }, 0)
  .to('.scene__title', { yPercent: -40, opacity: 0, ease: 'none' }, 0.1)
  .from('.scene__card', { yPercent: 40, opacity: 0, stagger: 0.2, ease: 'none' }, 0.3);
```

Use `ease: 'none'` for scrubbed tweens so motion tracks the scroll exactly, and shape timing with positions in the timeline. Total scroll length should be proportional to content (150% to 400%), not arbitrary.

### 3.4 Horizontal scroll gallery

```js
const track = document.querySelector('.hscroll__track');
const dist = () => track.scrollWidth - innerWidth;
gsap.to(track, {
  x: () => -dist(), ease: 'none',
  scrollTrigger: { trigger: '.hscroll', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.5, invalidateOnRefresh: true },
});
```

Give captions in the "Place, Year" form, and parallax the images inside their frames by a few percent at different speeds. On mobile, replace with a native `overflow-x: auto; scroll-snap-type: x mandatory` row.

### 3.5 Clip-path image reveal with inner parallax

```css
.reveal { overflow: hidden; }
.motion .reveal { clip-path: inset(0 0 100% 0); }
.reveal img { width: 100%; height: 115%; object-fit: cover; }
```

```js
gsap.to('.reveal', { clipPath: 'inset(0 0 0% 0)', duration: 1.3, ease: 'expo.inOut',
  scrollTrigger: { trigger: '.reveal', start: 'top 80%', once: true } });
gsap.fromTo('.reveal img', { yPercent: -8 }, { yPercent: 8, ease: 'none',
  scrollTrigger: { trigger: '.reveal', start: 'top bottom', end: 'bottom top', scrub: true } });
```

### 3.6 Colour chapters

```js
document.querySelectorAll('[data-bg]').forEach((sec) => {
  ScrollTrigger.create({
    trigger: sec, start: 'top 55%', end: 'bottom 55%',
    onEnter: () => tweenTheme(sec), onEnterBack: () => tweenTheme(sec),
  });
});
function tweenTheme(sec) {
  gsap.to(document.body, { backgroundColor: sec.dataset.bg, color: sec.dataset.ink, duration: 0.7, ease: 'power2.out', overwrite: true });
}
```

HTML: `<section data-bg="#111112" data-ink="#f4f3f1">`. Give sections a transparent background so the body colour shows through. Check contrast for every pair, and keep a CSS default for no-JS.

### 3.7 Word-by-word scroll fill

```js
const words = splitWords(el); // wrap each word in a span with class "w"
gsap.fromTo(words, { opacity: 0.15 }, { opacity: 1, stagger: 0.1, ease: 'none',
  scrollTrigger: { trigger: el, start: 'top 75%', end: 'bottom 45%', scrub: true } });
```

### 3.8 Marquee with velocity

```js
function marquee(el, base = 1) {
  const inner = el.firstElementChild;                 // contains the items duplicated once
  const w = () => inner.scrollWidth / 2;
  let x = 0, dir = base;
  gsap.ticker.add((t, dt) => {
    x -= dir * (dt / 16.67) * 1.2 * (1 + Math.min(Math.abs(lenis.velocity || 0), 20) * 0.15);
    if (x <= -w()) x += w(); if (x > 0) x -= w();
    gsap.set(inner, { x });
  });
  lenis.on('scroll', ({ direction }) => (dir = base * (direction || 1)));
}
```

Pause when off-screen with an IntersectionObserver, and stop it under reduced motion (show a static, wrapped row).

### 3.9 Magnetic button

```js
document.querySelectorAll('[data-magnetic]').forEach((el) => {
  const qx = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
  const qy = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    qx((e.clientX - (r.left + r.width / 2)) * 0.35);
    qy((e.clientY - (r.top + r.height / 2)) * 0.35);
  });
  el.addEventListener('pointerleave', () => { qx(0); qy(0); });
});
```

Only on `(hover: hover) and (pointer: fine)`.

### 3.10 Custom cursor with blob follower and labels

```css
@media (hover: hover) and (pointer: fine) { .cursor { display: block; } }
.cursor { position: fixed; inset: 0 auto auto 0; width: 14px; height: 14px; border-radius: 50%; background: var(--accent);
  pointer-events: none; mix-blend-mode: difference; z-index: 999; display: none; }
.cursor__label { position: absolute; left: 20px; top: 20px; font: 600 11px/1 var(--font-text); white-space: nowrap; }
```

```js
const cursor = document.querySelector('.cursor');
const x = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3.out' });
const y = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3.out' });
addEventListener('pointermove', (e) => { x(e.clientX); y(e.clientY); });
document.querySelectorAll('[data-cursor]').forEach((el) => {
  el.addEventListener('pointerenter', () => { cursor.dataset.state = el.dataset.cursor; gsap.to(cursor, { scale: 4, duration: 0.4 }); });
  el.addEventListener('pointerleave', () => { cursor.dataset.state = ''; gsap.to(cursor, { scale: 1, duration: 0.4 }); });
});
```

Never remove the native cursor on elements people click unless the custom one shows state clearly, and never on touch.

### 3.11 Hover image pair with mask

Show a base and a hover image stacked; on hover wipe the second in with `clip-path`. Works for liveries, product colourways, before and after.

```css
.pair { position: relative; aspect-ratio: 4/5; overflow: hidden; }
.pair img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.pair .hover { clip-path: circle(0% at var(--mx, 50%) var(--my, 50%)); transition: clip-path 0.7s var(--ease-out); }
.pair:hover .hover { clip-path: circle(150% at var(--mx, 50%) var(--my, 50%)); }
```

```js
el.addEventListener('pointermove', (e) => {
  const r = el.getBoundingClientRect();
  el.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
  el.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
});
```

On touch, make a tap toggle a class instead of relying on hover.

### 3.12 Count-up numbers

```js
const o = { v: 0 };
gsap.to(o, { v: target, duration: 1.6, ease: 'power3.out', snap: { v: 1 },
  onUpdate: () => (el.textContent = o.v.toLocaleString()),
  scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
```

Use `font-variant-numeric: tabular-nums` so digits do not jitter.

### 3.13 Menu overlay

Open: clip-path circle or inset wipe from the button, then stagger links by line mask. Trap focus inside, close on Escape, restore focus to the button, set `inert` on the page behind, and `lenis.stop()` while open (`lenis.start()` on close). Update `aria-expanded`.

### 3.14 Page transitions

Native and simplest, for multi-page sites:

```css
@view-transition { navigation: auto; }
::view-transition-old(root) { animation: 0.5s var(--ease-inout) both out; }
::view-transition-new(root) { animation: 0.7s var(--ease-out) both in; }
@keyframes out { to { opacity: 0; transform: translateY(-2vh); } }
@keyframes in { from { opacity: 0; transform: translateY(4vh); } }
```

Fallback for browsers without support: intercept same-origin link clicks, play a curtain `clip-path` wipe, navigate on complete, and play the reverse on the new page's load. For SPAs, wrap route changes in `document.startViewTransition(() => render())` when available.

### 3.15 Scroll-velocity skew

```js
const skew = gsap.quickTo('.skewable', 'skewY', { duration: 0.4, ease: 'power3.out' });
lenis.on('scroll', ({ velocity }) => skew(gsap.utils.clamp(-4, 4, velocity * 0.15)));
```

Use sparingly, only on images or large type, and disable for reduced motion.

## 4. Performance rules

- Animate `transform` and `opacity` (and `clip-path` for masks). Do not animate `top`, `left`, `width`, `height`, `box-shadow`, `filter: blur()` on large areas.
- Avoid resting drop shadows on large animated layers. They are costly and flatten the look; use tonal steps or borders.
- `will-change: transform` only on elements that are animating, and remove it afterwards for long-lived pages.
- Use `quickTo` or `quickSetter` for pointer-driven values.
- One ScrollTrigger per concept. Prefer `batch()` for lists (`ScrollTrigger.batch('.card', { onEnter: (els) => gsap.from(els, { y: 40, opacity: 0, stagger: 0.08 }) })`).
- Use `once: true` for reveals so they are not recomputed on scroll back.
- `ScrollTrigger.config({ ignoreMobileResize: true })` stops address-bar resize storms on phones. Use `svh`/`dvh` for hero heights.
- Set explicit `width`/`height` or `aspect-ratio` on media so triggers do not move after images load.
- Pause rAF-driven effects (WebGL, marquee, cursor loops) when the tab is hidden or the element is off-screen.
- Test with CPU throttling 4x in DevTools if you suspect jank.

## 5. Debugging

- `ScrollTrigger.defaults({ markers: true })` while developing, never in the build you report.
- Triggers in the wrong place: something loaded late. Call `ScrollTrigger.refresh()` on `load` and `document.fonts.ready`.
- Pin spacing jumps: parent has `overflow: hidden` or `transform`. Pin elements whose ancestors have no transform or filter.
- Content missing after reload: ScrollTrigger restores scroll position. Use `history.scrollRestoration = 'manual'` and scroll to top on load if the preloader must replay.
- A reveal that never fires leaves text invisible: shoot.mjs reports it as `stuck-hidden`.

## 6. React and Next

- `npm i gsap @gsap/react lenis`, use `useGSAP(() => {...}, { scope: ref })` so everything is reverted on unmount; create Lenis in a client component effect and `lenis.destroy()` on cleanup.
- Register plugins once: `gsap.registerPlugin(useGSAP, ScrollTrigger)`.
- Never read layout during render. Split text in effects, after fonts are ready.
- In Next, mark animated components `'use client'`; keep server-rendered content visible by default and hide it only inside the effect.
