<div align="center">

# Awwwards Skill

**An agent skill for building Awwwards-level websites, and the 3D models in them.**
Art direction, GSAP + ScrollTrigger + Lenis motion, a tested component library, page transitions, 3D modelling in code with .glb export, 3D stages with scroll and cursor effects, image-to-code, and QA in a real browser with real input.

![License: MIT](https://img.shields.io/badge/license-MIT-blue)
![Agent Skill](https://img.shields.io/badge/agent%20skill-SKILL.md-black)
![Claude Code plugin](https://img.shields.io/badge/Claude%20Code-plugin-d97757)
![Three.js r187](https://img.shields.io/badge/three.js-r187-049ef4)
![Node 22+](https://img.shields.io/badge/node-%E2%89%A5%2022-339933)
![Version](https://img.shields.io/badge/version-3.0.0-orange)

[3D](#3d-models-made-by-the-ai) · [Install](#install) · [Usage](#usage) · [Components](#components) · [Tools](#verification-tools) · [Contributing](CONTRIBUTING.md) · [Português](README.pt-BR.md)

</div>

---

Most AI-built sites look generated because every decision was a default: a centered hero, three icon cards, a purple gradient, fade-up on everything. This skill gives a coding agent a repeatable way to do what award-winning studios do instead: start from one idea that belongs to the subject, carry it through type, colour, imagery, motion and 3D, then prove the result in a real browser.

It is organised around the Awwwards scoring weights (Design 40%, Usability 30%, Creativity 20%, Content 10%) and the Developer Award criteria (semantics, animations, accessibility, performance, responsiveness, markup).

> Formerly **incridible-skill**. Versions 1 and 2 are archived unchanged in [`versions/`](versions).

## 3D models made by the AI

New in 3.0. The agent can now build 3D objects itself, look at them, fix them, and put them on a page:

- **Model in code** with [`assets/three/kit.js`](skills/awwwards-skill/assets/three/kit.js): revolved profiles (bottles, glasses, ear cups), tubes along paths (headphone bands, cables), rounded boxes (cards, phones), SVG extrusion (logos, numbers), curved labels, vertex sculpting, textures painted with code (liveries, labels, card art, carbon, halftone) and PBR materials (gold, chrome, glass, liquid, clear-coated paint, plastic, rubber, fabric, carbon).
- **See what it built**: [`scripts/model3d.mjs`](skills/awwwards-skill/scripts/model3d.mjs) renders the model in real Chrome from six angles, lists triangles, materials and problems, and exports a **.glb** (works in any engine and in Blender), a transparent poster image and a 360° turntable.
- **Put it on a page**: [`assets/three/stage.js`](skills/awwwards-skill/assets/three/stage.js) adds scroll-driven turns, cursor tilt, keyframed paths through pinned sections, entrance animations, and the landonorris.com effect: the model seen only through a soft circle at the cursor, over a frosted silhouette.
- **Four tested, parameterised models**: racing helmet (colour, pattern, number, visor), spirits bottle (liquid, glass, label), over-ear headphones, collectible card with gold frame.
- **A 3D starter** with a cursor-revealed helmet hero, 3D cards that turn through a pinned section over yard lines, product stages, halftone type and diagonal wipes (techniques studied from landonorris.com, jjettas.com and santionispirits.com; no assets copied).
- **Honest limits** in [`references/10-3d-modeling.md`](skills/awwwards-skill/references/10-3d-modeling.md): code is great for hard-surface, symmetric objects; for a specific real sneaker or a face, use the client's file or an AI 3D generator, then inspect and place it with the same tools.

## What else you get

| Area | Included |
|---|---|
| **Workflow** | Inventory, direction, idea sentence, foundations, layered build (static, motion, depth and 3D, polish), gate, report |
| **Art direction** | 12 composition directions, anti-generic checklist, idea test, copy rules |
| **Motion** | 15 recipes plus 24 ready components: split-text reveals, scramble, image trail, stacking cards, Flip filters, draggable slider, SVG drawing, WebGL distortion, shader backgrounds, variable fonts, expanding media, page transitions and more |
| **Starters** | `monument` (single page), `editorial` (three pages with curtain transitions), `product-3d` (live 3D) |
| **Image to code** | Probe, tile, ruler, palette, crop, then a diff loop with measurable targets |
| **Quality gates** | Real-browser inspector with wheel and touch scrolling, frame timing, hover and focus passes, masked-text detection, reduced-motion and blocked-CDN passes |

## Install

Pick one.

### Claude Code plugin (recommended)

```text
/plugin marketplace add joca-web/incridible-skill
/plugin install awwwards-skill@awwwards-skill
```

From a terminal: `claude plugin marketplace add joca-web/incridible-skill` then `claude plugin install awwwards-skill@awwwards-skill`.

Coming from incridible-skill? Remove it first (`/plugin uninstall incridible-skill@incridible-skill` and `/plugin marketplace remove incridible-skill`), then add and install as above. Both would answer the same requests.

### Skills CLI (any agent that reads `SKILL.md`)

```bash
npx skills add joca-web/incridible-skill
```

Choose `awwwards-skill`.

### Installer scripts

Windows (PowerShell):

```powershell
git clone https://github.com/joca-web/incridible-skill.git
cd incridible-skill
.\install.ps1             # to $HOME\.claude\skills
.\install.ps1 -Project    # to .\.claude\skills in the current project
```

macOS and Linux:

```bash
git clone https://github.com/joca-web/incridible-skill.git
cd incridible-skill
./install.sh              # to ~/.claude/skills
./install.sh --project    # to ./.claude/skills in the current project
```

Run again to update; `--uninstall` / `-Uninstall` removes it. The installer warns if an old `incridible-skill` copy is still installed.

### Manual copy

Copy `skills/awwwards-skill` into `~/.claude/skills/` (user-wide) or `<project>/.claude/skills/`.

### Claude app (web, desktop)

Download [`dist/awwwards-skill.plugin`](dist/awwwards-skill.plugin) and open it in the Claude app to install it as a plugin, or [`dist/awwwards-skill.skill`](dist/awwwards-skill.skill) to add it as a skill. Use one, not both, and remove any older incridible-skill.

## Usage

```text
Build a site for a fictional racing driver with a 3D helmet in the hero that reveals under the cursor,
like landonorris.com. Use awwwards-skill: model the helmet, show me the views, then build and verify the page.
```

```text
Faça um modelo 3D de uma garrafa de gin com rótulo "Serra Alta", exporte em .glb e coloque num site
com a garrafa girando conforme o scroll.
```

```text
Here is our sneaker as a .glb (shoe.glb). Inspect it, compress it if it's heavy, and build a launch page where
it turns through a pinned section.
```

```text
Redesign this landing page so it stops looking AI-generated. Keep the stack and the content.
```

When you are inspired by a live site, the skill studies its technique and structure. It does not copy its photos, logos, text, models or brand.

## Components

Copy `assets/components/` into a site, then:

```html
<script type="module">
  import { boot } from './components/index.js';
  boot();   // smooth scroll, transitions and every data-attribute component on the page
</script>
```

3D stages are a separate entry (they need the Three.js import map): `import { initStages } from './three/stage.js'`. Full catalogue: [`references/09-components.md`](skills/awwwards-skill/references/09-components.md).

## Verification tools

Bundled in `skills/awwwards-skill/scripts/`.

| Script | Needs | Does |
|---|---|---|
| `model3d.mjs` | Node 22+, Chrome | Builds a 3D model module or inspects a .glb: six views, stats, problems, .glb export, poster, turntable |
| `shoot.mjs` | Node 22+, Chrome, Chromium or Edge | Static checks, stepped screenshots, real wheel/touch scroll pass with frame timing and recorded frames, hover and keyboard passes, reduced motion |
| `filmstrip.py` | Python 3, Pillow | Contact sheet or GIF of scroll frames or of a model turntable |
| `vendor.mjs` | Node 18+ | Downloads GSAP, Lenis and Three.js builds so the tools can test real libraries offline |
| `compare.py` | Python 3, Pillow, numpy | Structural diff between a reference image and a screenshot |
| `img_probe.py` | Python 3, Pillow | Image info, tiles, pixel ruler, palette with contrast, crops |

```bash
node skills/awwwards-skill/scripts/model3d.mjs skills/awwwards-skill/assets/three/models/helmet.js --param number=44
python3 -m http.server 4173 --directory my-site &
node skills/awwwards-skill/scripts/shoot.mjs http://localhost:4173 --out .awwwards/after
```

On Windows use `python` instead of `python3`, and start the server in a separate terminal.

## Repository layout

```text
.claude-plugin/              plugin and marketplace manifests
skills/awwwards-skill/
  SKILL.md                   workflow, rules, routing
  references/                10 guides (09 components, 10 3D modelling)
  assets/three/              kit.js, stage.js, stage.css, models/ (helmet, bottle, headphones, card)
  assets/components/         component library
  assets/starters/           monument, editorial, product-3d
  scripts/                   model3d.mjs, shoot.mjs, filmstrip.py, vendor.mjs, compare.py, img_probe.py
dist/                        awwwards-skill.skill and awwwards-skill.plugin
versions/                    v1 and v2 (incridible-skill), archived unchanged
tools/validate.py            repository checks (also run in CI)
install.sh, install.ps1      installers
```

## Scope and honest limits

- Everything was run with real GSAP 3.15.1, Lenis 1.3.27 and Three.js r187 in headless Chrome. WebGL there uses software rendering: frame times are relative, and heavy 3D pages scroll slowly in the test. Check the 3D starter on a real phone.
- Procedural models are stylised. They are convincing for helmets, bottles, cards, headphones, packaging and logos; not for faces, animals or a specific branded shoe.
- `vendor.mjs` downloads were not exercised in the build environment (no network); extraction from real packages was. `install.ps1` was not run (no PowerShell).
- The repository keeps its old address (`joca-web/incridible-skill`). Renaming it on GitHub to `awwwards-skill` works; GitHub redirects the old URL.

## Roadmap

- [ ] Teardowns for `why.zero.university` and `auge-xp.com`
- [ ] More models: sneaker silhouette from an image, can, trophy, phone
- [ ] HDRI loading and Draco/Meshopt compression built into model3d.mjs
- [ ] React Three Fiber version of the stage

## Credits and disclaimer

- Process ideas were informed by [Taste Skill](https://www.tasteskill.dev/).
- Techniques were studied from landonorris.com (OFF+BRAND), jjettas.com and santionispirits.com (Active Theory). No assets, models or text from them are included. This project is not affiliated with any of them, with Awwwards, McLaren or the NFL.
- GSAP (GreenSock, free under its standard license), Lenis (MIT) and Three.js (MIT) belong to their authors and are loaded from CDNs, not bundled.

## License

[MIT](LICENSE)
