# Image to code

Use when the user gives a screenshot, mockup, photo of a design, a Figma export, or several frames (desktop, mobile, states). The target is a page that matches the picture closely at the picture's width and stays fluid at every other width.

## Contents
1. Principles
2. Pipeline
3. Reading a picture precisely
4. Tokens from pixels
5. Fonts
6. Assets
7. The diff loop
8. Responsive derivation
9. Motion the picture implies
10. Figma and other sources
11. Common failure modes

## 1. Principles

- Images get downscaled when you view them, so fine detail is lost. Slice tall pictures into tiles and read each at full resolution.
- Estimate numbers by measuring, not by eye. A labelled pixel ruler turns "about 80px" into 84.
- Build static structure first. Do not add animation until the static page matches.
- Match at the reference width first, then make it fluid with `clamp()`, `%`, `fr` and container logic. Do not hard-code the reference's pixel widths into the final CSS.
- If the picture contains someone else's photos, logos or brand marks, do not copy them out. Use the user's own assets, licensed images or neutral stand-ins that are clearly flagged in the report.

## 2. Pipeline

Run these from the working directory. `<skill>` is this skill's folder.

```bash
# 1. Facts: dimensions, aspect, DPR guess
python3 <skill>/scripts/img_probe.py info ref.png

# 2. Readable tiles (default 1200px tall, 120px overlap) written to .awwwards/tiles/
python3 <skill>/scripts/img_probe.py tiles ref.png

# 3. Pixel ruler: grid labelled every 100px, so positions can be read exactly
python3 <skill>/scripts/img_probe.py ruler ref.png --step 100

# 4. Palette and roles as CSS variables, with contrast ratios
python3 <skill>/scripts/img_probe.py palette ref.png --n 8

# 5. Crop imagery you are allowed to reuse
python3 <skill>/scripts/img_probe.py crop ref.png 120,340,640,420 --out assets/hero.webp
```

Then:

6. **Decompose.** Read the tiles and write a spec file (`.awwwards/spec.md`): sections top to bottom, each with bounding box, background, grid columns, alignment, type styles, spacing, components, imagery, and what looks interactive.
7. **Tokens.** Put colours, type scale, spacing, radii and shadows into `:root` from the measurements below.
8. **Build static** semantic HTML + CSS at the reference width.
9. **Shoot and compare** (section 7). Fix the worst cells first.
10. **Make fluid and derive mobile** (section 8).
11. **Add motion** (section 9) and run the normal gate from `SKILL.md`.

## 3. Reading a picture precisely

For each section, answer in the spec:

- **Container**: left and right margins, max content width, is the content centered or flush left?
- **Grid**: number of columns, gutter, where items start and end. Count columns by the repeating edges.
- **Vertical rhythm**: top and bottom padding of each section, gap between title and content. Look for a base unit (4, 8, 12, 16 px) and a ratio between sections.
- **Type**: for each style, cap height or x-height to estimate size, line count and line height, letter-spacing (tight display type is usually -0.02em to -0.06em), case, weight, colour.
- **Components**: buttons (height, radius, padding, border), cards (radius, border, shadow, padding), tags, nav, inputs. Measure one and reuse it.
- **Alignment**: baselines, optical alignment, overlaps, elements that bleed off the canvas.
- **Layering**: what is in front of what. Text behind a cutout, overlapping images, floating labels.

Measure with the ruler image. When two edges are close, crop and zoom the area (`crop` with `--scale 3`).

## 4. Tokens from pixels

- **Colour**: take values from `palette`, then sample specific pixels when a flat colour matters (buttons, backgrounds). Prefer solid sampled values over averages. Snap near-black and near-white to named tokens.
- **Type scale**: collect all text heights, group them into 5 to 7 sizes, express as `clamp(min, preferred, max)` where max equals the reference size at the reference width.
- **Spacing**: derive a scale from the measured gaps, then round each gap to the nearest token.
- **Radius and shadow**: measure the corner radius on a zoomed crop. For shadows, look for a soft darker halo and estimate blur and offset; many "shadows" in modern references are actually 1px borders or tonal steps.
- **Easing and timing** are not in a still picture. Take them from `references/03-motion-system.md` tokens.

## 5. Fonts

Identify by features, not by guessing: terminals, the shape of a, g, R, Q, G, the width of a typical lowercase n, contrast between thick and thin strokes, x-height. Then pick the closest free face and say in the report that it is a substitute.

| If the reference looks like | Free options |
|---|---|
| Neo-grotesk, neutral (Helvetica, Neue Haas) | Inter Tight, Switzer, General Sans, Hanken Grotesk |
| Geometric (Futura, Gotham) | Outfit, Urbanist, Plus Jakarta Sans, Satoshi |
| Condensed heavy display (Anton, Druk, Compacta) | Anton, Bebas Neue, Big Shoulders Display, Archivo (width axis, extra condensed black) |
| Wide extended display | Unbounded, Syne, Archivo (width axis, expanded) |
| Quirky grotesk | Bricolage Grotesque, Familjen Grotesk, Cabinet Grotesk, Space Grotesk |
| High-contrast serif display | Fraunces, Instrument Serif, Gambarino, Erode, Playfair Display |
| Humanist or editorial serif text | Newsreader, Source Serif 4, Literata |
| Monospace labels | JetBrains Mono, IBM Plex Mono, Geist Mono |

Match the metrics: after loading, compare the width of the longest line with the reference and adjust `letter-spacing` and `font-size` until line breaks agree.

## 6. Assets

- Raster photos: crop from the reference only when the user owns or supplied them. Otherwise use their own files or sourced images of the same subject and framing.
- Icons and logos: redraw as inline SVG (simple shapes), keep `currentColor`.
- Backgrounds: gradients and noise are usually reproducible in CSS. Sample the gradient's end colours and the angle.
- Export WebP or AVIF at 1x and 2x for the displayed size. Keep the original crop for the diff loop.

## 7. The diff loop

```bash
node <skill>/scripts/shoot.mjs http://localhost:4173 --out .awwwards/shot --widths 1440 --no-reduced
python3 <skill>/scripts/compare.py ref.png .awwwards/shot/w1440-full.png --out .awwwards/diff
```

`compare.py` aligns the screenshot to the reference width, then writes `side-by-side.png` (reference, screenshot, diff), a heat map, and a ranked list of the worst grid cells with their pixel boxes. Use the boxes to decide where to look.

Targets for a static build, at the reference width:
- Overall structural similarity 0.90 or higher for photographic layouts, 0.95 or higher for flat UI layouts.
- No grid cell with similarity below 0.75, except cells containing photos you substituted.
- Section heights within 2% of the reference.

Fix in this order: section heights and vertical rhythm, column positions, type size and line breaks, colours, then borders, radii and shadows. After each batch, shoot and compare again. Stop when the numbers hit the targets or when the remaining difference is only substituted imagery and font substitution. State which.

## 8. Responsive derivation

The picture rarely shows every width. Derive:
- **Tablet (768)**: reduce columns by one step, keep display type fluid, keep image aspect ratios.
- **Mobile (390)**: single column, display type scaled by `clamp` (the longest word must fit with 20px side margins), cards stack, horizontal strips become swipe rows or stacked, hover becomes tap, side-by-side hero becomes stacked with image first or behind text.
- If a mobile frame is supplied, treat it as a second reference and diff it at 390.
- Never let content go under 14px body text on mobile or touch targets under 44px.

## 9. Motion the picture implies

Static cues and the motion they usually mean:

| In the picture | Likely motion |
|---|---|
| Huge cropped text | Line mask reveal, parallax, pinned scale |
| Overlapping images at different offsets | Per-layer parallax speeds |
| Text sandwiched between background and a cutout | Depth sandwich (see `04-webgl-and-depth.md`) |
| A row of cards bleeding off the right edge | Horizontal scroll |
| Sections with different background colours | Colour chapters |
| A big counter or number | Count-up on enter |
| Logos in a long strip | Marquee |
| A floating label near the pointer or a tiny arrow | Custom cursor states |

Write the invented motion into the report: "Motion is inferred, not specified".

## 10. Figma and other sources

If a Figma link or node is provided and the Figma tools are available, load the Figma design-to-code skill, call `get_design_context` for exact tokens and structure, then use screenshots from `get_screenshot` as the reference for the diff loop. Treat the generated code as a reference to adapt, not final output. For a video or screen recording, extract frames with `ffmpeg` (if installed) at scroll positions and treat each as a reference tile.

## 11. Common failure modes

- Approximating from the thumbnail, so every spacing is slightly off. Use tiles and the ruler.
- Hard-coded pixel widths that break at 1280 or 1920. Test 1280, 1440, 1920 before shipping.
- Copying the picture's raster text into the page. Text must be real HTML.
- Perfect desktop, broken mobile.
- Leaving substituted fonts or images unreported.
