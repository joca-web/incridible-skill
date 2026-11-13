# Starters

Three working bases. Restyle them to your direction; keep their safety patterns.

## monument/ (single page)

Dark, loud, name-as-monument hero. One `main.js` with no imports, so it works by just copying the folder.

- Preloader with count, hero headline that fits any width (`data-fit`), text behind a subject cutout, word-by-word fill, pinned horizontal gallery (native swipe on mobile), colour chapters, split stage with cursor labels, hover image pairs, count-up, velocity marquee, magnetic CTA, menu overlay with focus handling.
- Replace every `data-placeholder` block and `TODO(content)`; the inspector fails until you do.

## editorial/ (three pages)

Light paper, serif display, ultramarine accent, curtain transitions between `index.html`, `work.html` and `about.html`.

- Uses the component library. Copy `../components/` into this folder as `components/` before serving:
  `cp -r assets/components assets/starters/editorial/components` (PowerShell: `Copy-Item -Recurse`).
- Home: shader background with image trail, char-split title, cursor-proximity statement, expanding media, stacking service cards, draggable distortion slider, scrubbed signature line, counters, marquee.
- Work: Flip filters and list view, tilt and distortion on project images, batch reveals.
- Studio: parallax photos with inner drift, scroll-driven font weight, drawn line, smooth FAQ accordion.
- `img/ph-*.webp` are abstract placeholders generated for this starter (no third-party rights). They are marked `data-placeholder`; replace them with the client's photographs.

## product-3d/ (single page with live 3D)

Athlete or product site. Copy `../components/` here as `components/` and `../../three/` as `three/`.

- Hero: name as monument with a 3D helmet seen only through a circle that follows the cursor, over a frosted silhouette (landonorris.com technique). Touch devices get a one-time reveal.
- A pinned section where three 3D collectible cards turn and slide with scroll over drifting yard lines, halftone display type behind (jjettas.com technique).
- Product stages: headphones that spin and lean to the cursor, a bottle that turns with the page.
- Diagonal wipe into the dark chapter, magnetic CTA, progress bar.
- `img/*.webp` posters were rendered with `scripts/model3d.mjs --poster`; re-render them when you change a model.
- Needs the Three.js import map in `<head>` (already there, pinned to 0.187.0).

## All

- Serve over HTTP: `python3 -m http.server 4173` (Windows: `python -m http.server 4173`).
- The `<head>` inline script adds `motion` before first paint and removes it after 7 s if the libraries never arrived, so content can never stay hidden.
- Test: `node ../../scripts/shoot.mjs http://localhost:4173/ --out .awwwards/test` (add `--vendor DIR` when CDNs are blocked; see `scripts/vendor.mjs`).
