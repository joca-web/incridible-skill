# Typography, colour, layout, imagery, responsive

Read this in Phase 4, before writing CSS.

## Contents
1. Type
2. Fluid scale
3. Colour
4. Layout and grid
5. Imagery
6. Responsive: a second composition, not a shrink
7. Details that add up

## 1. Type

- Maximum two families: one display, one text. A third only for a tiny accent role. One variable font with a width or optical-size axis can replace two.
- Scale contrast is the highest-impact decision. Display type at 12 to 30 vw for monument heroes; body 16 to 20 px; labels 11 to 13 px uppercase with letter-spacing 0.06 to 0.12em.
- Tight display: `line-height: 0.8 to 0.95`, `letter-spacing: -0.02em to -0.06em`, `text-transform: uppercase` for condensed or heavy faces. Add `padding-bottom: 0.08em` inside masked lines so descenders are not clipped.
- Emphasis inside a sentence: swap 1 to 3 words to the accent colour or a heavier weight rather than bolding at random. A full statement set big with highlighted words is a signature look on top sites.
- Body copy: 60 to 75 characters per line, `line-height: 1.5 to 1.65`, `text-wrap: pretty`; headings `text-wrap: balance`.
- Numbers: `font-variant-numeric: tabular-nums` for counters and tables.
- Performance: self-host or use Fontshare / Google Fonts with `preconnect`, `font-display: swap`, subset to the languages used, and preload the display face. Use `size-adjust` fallbacks (`@font-face` for a local fallback) to stop layout shift.

Mood to pairing (all free; verify licence for commercial use):

| Mood | Display | Text |
|---|---|---|
| Racing, sport, loud | Anton, Bebas Neue, Big Shoulders Display, Archivo (condensed black) | Inter Tight, Hanken Grotesk, DM Sans |
| Editorial, luxury | Instrument Serif, Fraunces, Gambarino, Erode, Boska | General Sans, Switzer, Newsreader |
| Tech, product | Space Grotesk, Geist, Unbounded, Syne | Inter, Geist, IBM Plex Sans |
| Playful, youth | Bricolage Grotesque, Clash Display, Cabinet Grotesk | Satoshi, Manrope |
| Architecture, craft | Neue-style grotesks (Switzer, General Sans), Hanken Grotesk | Same family, light weights |
| Brutalist, raw | Archivo Black, Space Mono, JetBrains Mono | Space Mono, IBM Plex Mono |

## 2. Fluid scale

```css
:root {
  --font-display: "Archivo", "Arial Narrow", system-ui, sans-serif;
  --font-text: "Inter Tight", system-ui, sans-serif;

  --step--1: clamp(0.78rem, 0.74rem + 0.2vw, 0.9rem);
  --step-0:  clamp(1rem, 0.95rem + 0.3vw, 1.2rem);
  --step-1:  clamp(1.25rem, 1.1rem + 0.8vw, 1.8rem);
  --step-2:  clamp(1.8rem, 1.4rem + 2vw, 3.2rem);
  --step-3:  clamp(2.6rem, 1.8rem + 4vw, 5.5rem);
  --step-4:  clamp(4rem, 2rem + 10vw, 11rem);
  --step-5:  clamp(5rem, 1rem + 22vw, 24rem);   /* monument */

  --space-1: clamp(0.5rem, 0.45rem + 0.25vw, 0.75rem);
  --space-2: clamp(1rem, 0.9rem + 0.5vw, 1.5rem);
  --space-3: clamp(1.5rem, 1.2rem + 1.5vw, 3rem);
  --space-4: clamp(3rem, 2rem + 5vw, 7rem);
  --space-5: clamp(5rem, 3rem + 10vw, 12rem);
  --gutter: clamp(1rem, 0.6rem + 2vw, 2.5rem);
}
```

Always test the longest word of every display heading at 390 px; `clamp` minimums must let it fit with side margins.

## 3. Colour

- 2 to 4 colours. Landonorris.com is the model: a single electric lime (`#D2FF00` as listed on Awwwards) on near-black (`#111112`), with an off-white (`#F4F3F1`) and a muted olive grey for support. The two-colour core carries the whole identity.
- Take the accent from the subject. Keep it under 10% of any viewport. Use it for the one thing you want seen.
- Avoid pure `#000` and `#fff`. Near-black with a hint of hue and warm off-white feel expensive and reduce harsh contrast.
- Body text contrast 4.5:1 or better; large display text 3:1. `img_probe.py palette` prints ratios.
- Gradients: rare, soft, and sourced from the imagery. Flat colour plus grain (`<svg>` turbulence or a PNG noise overlay at 4 to 8% opacity) gives tactility without cliché.
- Dark mode is not an inversion. If the direction is dark, design the dark first and only add a light variant if asked.
- Selection and caret: `::selection { background: var(--accent); color: var(--bg); }`, `caret-color: var(--accent)`.

## 4. Layout and grid

- 12-column CSS grid with a fluid gutter; break the grid on purpose: a headline that spans 11 columns, an image that bleeds off one edge, a caption set in column 11.
- Sections are `min-height: 100svh` only when they are scenes; content sections use padding from the space scale.
- Asymmetry over symmetry: align to a strong left edge, offset images by half a column, overlap type and image.
- Edge to edge media at key moments (the hero, one chapter break), contained media elsewhere.
- Use `container-type: inline-size` for components that must adapt to their slot, not just the viewport.
- Fixed UI (nav, cursor, progress) stays minimal: a logo mark, a menu button, one cue. Everything else belongs to the scroll.
- Sticky and pinned: prefer `position: sticky` for simple holds; ScrollTrigger pin for scrubbed timelines.

## 5. Imagery

Order of preference: the client's own, generated if an image tool exists, openly licensed real pictures of the subject's world (Wikimedia Commons, museum open-access collections, Unsplash with its licence) with credits recorded, drawn in code only for what no honest picture exists of, then flagged placeholders. Never present a found picture as the client's own product, room, person or team. Put licence credits in the footer or a credits page.

- At least 4 real visuals on a page, usually 6 to 12.
- One consistent grade: same contrast, temperature and grain, or a duotone/mask treatment, so mixed sources feel like one set.
- Fixed aspect ratios (`aspect-ratio: 4/5`, `3/2`, `16/9`), `object-fit: cover`, one radius token (or none).
- Responsive images: `srcset` and `sizes`, WebP or AVIF, explicit `width` and `height`, `loading="lazy"` below the fold, `fetchpriority="high"` on the LCP image.
- Small, specific captions ("Barcelona, 2024") add an editorial voice.
- Cutouts and base/hover pairs (helmets, sneakers, bottles) need clean edges and consistent lighting between the pair.
- Every `<img>` gets an `alt` describing it, or `alt=""` when decorative.

## 6. Responsive: a second composition, not a shrink

Design mobile as its own page:
- Rethink the hero. A giant name may stack into two lines; the subject can move behind the text or beneath it.
- Replace hover with tap or visible controls; replace horizontal pin with a swipe row; replace multi-column grids with a single column or a 2-column mosaic.
- Keep the signature moment alive on touch (tilt, drag, tap-to-lock), and use the same brand voice (landonorris.com even addresses phone users with a rotate message and a vertical-drive game).
- Use `svh` and `dvh` for heights; `100vh` jumps when the browser bar moves.
- Test 320, 390, 768, 1024, 1280, 1440, 1920. At 1920 and above, cap line lengths and scale display type with a clamp maximum, or the page looks stretched.
- Respect safe areas (`env(safe-area-inset-*)`).

## 7. Details that add up

- Custom focus ring that matches the accent, visible on both dark and light chapters.
- `scroll-behavior: smooth` is replaced by Lenis; keep anchor links working with `lenis.scrollTo(target, { offset: -80 })`.
- Favicon (SVG), `theme-color`, Open Graph image at 1200x630, Twitter card.
- A designed 404 and a designed empty state.
- Copy-to-clipboard, external-link arrows, `rel="noopener"` on new-tab links.
- A footer that is a destination: a giant call to action, the real contact, social links, credits and licences.
- Print stylesheet only if relevant.
