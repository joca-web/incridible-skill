# Performance, accessibility, semantics (the Developer Award criteria)

Awwwards scores sites for the Developer Award on six things: Semantics / SEO, Animations / Transitions, Accessibility, WPO (web performance optimisation), Responsive design, and Markup / Meta-data. The Lando Norris site, a Site of the Year, scored high on animations (8.6 of 10) but lowest on accessibility (7.0). Treat accessibility as the cheapest place to gain points over comparable work.

## Contents
1. Semantics and SEO
2. Animations and transitions
3. Accessibility
4. Performance (WPO)
5. Responsive
6. Markup and metadata
7. Budgets

## 1. Semantics and SEO

- One `<h1>` that states what the page is, in real text, visible within a second. Headings descend in order.
- Landmarks: `<header>`, `<nav>`, `<main>`, `<footer>`; sections have headings or `aria-label`.
- Real `<a>` for navigation, real `<button>` for actions. No clickable `div`s.
- Meaningful `<title>` (under 60 characters), `<meta name="description">` (under 160), canonical URL, `lang` on `<html>`.
- JSON-LD for the entity (Person, Organization, Product, Event) when it fits.
- Text lives in HTML, not in images or canvas. When splitting headlines for animation, keep a screen-reader copy of the original text.
- A `sitemap.xml` and `robots.txt` for multi-page sites.

## 2. Animations and transitions

- Transform and opacity first; no layout-thrashing properties.
- Everything honours `prefers-reduced-motion`: replace big movements with fades or nothing, stop marquees and autoplaying video, drop parallax, keep the content in its final state.
- Hidden start states only apply when JS and GSAP have loaded (the `.motion` class pattern). The inspector fails any text left invisible.
- Add a failsafe timer that reveals content if initialisation did not complete.
- Provide pause controls for anything that moves for more than 5 seconds.
- Scroll-jacking: never block native keyboard, find-in-page, or anchor navigation. Lenis supports these; test them.
- Page transitions complete under 1 second and never trap the user.

## 3. Accessibility

- Contrast: 4.5:1 normal text, 3:1 large text and UI parts. Check every colour chapter.
- Focus: visible custom focus ring on every interactive element, logical order, no focus traps except modals; close menus on Escape and return focus.
- Skip link as the first focusable element: `<a class="skip" href="#main">Skip to content</a>`.
- Menu overlays: `aria-expanded` on the toggle, `inert` or `aria-hidden` on the page behind while open, focus moves into the overlay.
- Custom cursor is decoration: `aria-hidden`, only for `(hover: hover) and (pointer: fine)`, never hides the native cursor over inputs or text selection.
- Images have `alt`; decorative ones `alt=""`; inline SVG icons with meaning get `role="img"` and a label, otherwise `aria-hidden="true"`.
- Hit targets 44 x 44 px minimum on touch.
- Games and special interactions need a non-interactive alternative or a clear skip.
- Do not rely on colour or hover alone to convey state.
- Videos: captions when there is speech; no autoplaying audio.
- Zoom: `<meta name="viewport" content="width=device-width, initial-scale=1">`, no `user-scalable=no`.

## 4. Performance (WPO)

Targets on a mid-range phone over fast 4G: LCP under 2.5 s, CLS under 0.1, INP under 200 ms, total transfer under 3 MB for the first view.

- **Critical path**: inline minimal critical CSS or keep one small CSS file; `defer` scripts; preconnect to font and CDN hosts; preload the display font and the LCP image.
- **Images**: AVIF or WebP, correct dimensions (do not ship 4000 px for a 600 px slot), `srcset`, `loading="lazy"` for below the fold, `decoding="async"`, `fetchpriority="high"` for the hero image.
- **Preloader**: must not delay LCP beyond the real load; do not preload everything. Cap at about 2.5 s unless assets truly need longer.
- **JS**: GSAP core is about 70 KB gzipped with ScrollTrigger; Lenis is small. Do not add three libraries for one effect. Load WebGL code only if the hero uses it and `requestIdleCallback` the setup.
- **WebGL and video**: cap DPR at 2 (render soft effects such as noise backgrounds below device resolution), pause off-screen, poster for video, lazy-start below the fold. Keep live WebGL contexts to about six per page; browsers drop the oldest beyond roughly sixteen, and every canvas that redraws during scroll costs a draw call per frame.
- **Fonts**: two families at most, subset, `font-display: swap`, fallback with `size-adjust`.
- **Layout shift**: explicit `width`/`height` or `aspect-ratio` on all media; reserve space for fonts; animate with transforms.
- **Caching**: long `Cache-Control` for hashed assets when you control the server.
- **Third parties**: none by default. Analytics load after interaction.

## 5. Responsive

- Test the seven widths in `05-typography-color-layout.md`, plus landscape phone.
- No horizontal scrolling except intentional tracks. `shoot.mjs` fails `overflow-x`.
- Touch alternatives for every hover state.
- Use `svh`/`dvh` units, safe-area insets, and avoid fixed pixel widths on containers.

## 6. Markup and metadata

- Valid HTML (no duplicate ids, closed tags), doctype, charset, viewport.
- Open Graph: `og:title`, `og:description`, `og:image` (1200 x 630), `og:url`, `twitter:card`.
- Favicon set (SVG + 180 px apple-touch-icon), `theme-color` matching the first screen.
- Clean class names that follow one convention (BEM or utility); data attributes (`data-reveal`, `data-split`, `data-magnetic`, `data-cursor`) tie behaviour to markup so JS selectors are explicit.
- Comment only the non-obvious (why a trigger starts at 85%).

## 7. Budgets

| Metric | Target | Where measured |
|---|---|---|
| LCP | under 2.5 s | `shoot.mjs` report (software headless, treat as a relative number) |
| CLS | under 0.1 | `shoot.mjs` |
| Transfer, first load | under 3 MB | `shoot.mjs` |
| Moving elements | 8 or more | `shoot.mjs` (`movers`) |
| Console errors | 0 | `shoot.mjs` |
| Contrast | 4.5:1 text | `img_probe.py palette` and manual |
| Reduced motion | all text visible | `shoot.mjs` reduced pass |
