# Direction and concept

Read this in Phases 1 to 3. The goal is to leave with: an inventory, a direction, one idea sentence, one signature moment and written copy.

## Contents
1. What makes a page look generated
2. Inventory and claims
3. Directions menu
4. The idea sentence
5. Signature moment
6. Palette, rhythm and structure
7. Copy rules

## 1. What makes a page look generated

These are the habits to avoid. They are tells because every model reaches for them when it has no idea.

- Purple-to-blue gradients, glassmorphism cards, glowing blobs behind the hero.
- Centered hero: headline, subhead, two buttons, then a row of three icon cards.
- One font (usually Inter) at four weights, nothing set large enough to matter.
- Every block fading up 20px with the same easing and the same delay.
- Emoji as icons, "Revolutionize / Unlock / Seamless / Cutting-edge" copy, "Trusted by" logo rows with invented logos.
- Uniform card grids with equal padding, equal radius, equal shadow.
- Stock-style imagery or empty grey placeholders.
- Animation everywhere at the same intensity, so nothing stands out.

None of these is forbidden in isolation. They are a warning that no decision was made. When you notice one, ask what the subject would do instead.

## 2. Inventory and claims

Before design, list 8 to 12 things only this client has. Examples: the founder's nickname, the street address, the exact season dates, the unit of measure the audience uses, a signature object (a helmet, a roaster, a blueprint), a number that surprises (2,400 hours, 17 seats), a ritual (Monday roast day), a regional word.

Then write the page as claims with proof, one line per section:

```
Hero      Claim: He drives with more attitude than anyone on the grid.  Proof: the neon helmet, the signature, the number.
Results   Claim: The results are real and recent.                       Proof: last five races, current standing.
Off track Claim: There is a person behind the visor.                    Proof: campaigns, shoots, dog photos.
```

Sections that cannot name a proof get cut or merged.

## 3. Directions menu

Pick one. Each is a way of composing, not a theme. Combine at most two. For each: what it is, when it fits, motion pairing, the risk.

1. **The name as monument.** The name set enormous, cropped by the viewport, often behind or around the subject. Fits personal brands, studios, events. Motion: line mask reveal, parallax between text and cutout. Risk: weak if the name is long, so test the longest word at 390 px.
2. **Sentence is the layout.** One long statement sets the whole hero at poster size, key words in accent. Fits manifestos, agencies. Motion: word-by-word fill on scroll. Risk: needs excellent copy.
3. **The pinned poster.** One composition stays fixed while content scrolls through or over it. Fits product launches, films, sport. Motion: pin plus scrubbed timeline. Risk: heavy on mobile, use `position: sticky` there.
4. **Colour chapters.** Each section owns a colour; the background morphs as you scroll. Fits multi-topic brands, editorial. Motion: background colour tween on enter. Risk: contrast, so check every pair.
5. **The place carries it.** A full-bleed photo or video of the place, with minimal UI over it. Fits hospitality, architecture, travel. Motion: slow Ken Burns, clip-path wipes between scenes. Risk: needs excellent footage.
6. **The object, large.** One object photographed or rendered big and cropped, rotating or revealing parts. Fits products, helmets, cars, sneakers. Motion: depth parallax, 360 spin by scroll, hover pair swap. Risk: needs cut-out quality.
7. **Uneven photographs.** A gallery wall: images at different sizes, offsets and speeds, with tiny captions in the "Place, Year" style. Fits people, travel, journals. Motion: horizontal scroll, per-image parallax speeds. Risk: needs a consistent colour grade.
8. **The product performs.** The real interface or machine runs live in the hero. Fits software. Motion: staged UI states driven by scroll. Risk: build it as real UI with real data.
9. **The dark room.** Near-black space where only the lit objects exist. Fits music, luxury, cinema, motorsport. Motion: spotlight cursor, glows, slow reveals. Risk: banding and low contrast.
10. **Split stage.** Two halves with opposite roles (On Track / Off Track, Before / After, Day / Night). One half may stay fixed. Fits dual-identity brands. Motion: halves react to hover, cursor labels. Risk: mobile collapses to two chapters.
11. **The quiet instrument.** Small type, big space, a single exact interaction. Fits architects, high-end craft. Motion: restrained, precise easing. Risk: reads empty if the content is thin.
12. **Type and nothing else.** Only words and colour. Fits when you have no imagery and a strong voice. Motion: kinetic type, variable font axes on scroll. Risk: needs a great typeface.

## 4. The idea sentence

Template: "On this page, [something that belongs to the subject] becomes [the device the direction calls for]."

Good: "On this page, the helmet's neon colour becomes the only light in a dark garage." Good: "The roast curve becomes the scroll progress bar."
Bad: "A modern, clean, immersive experience." Bad: anything that survives swapping the brand name.

Competitor test: replace the client with the nearest competitor. If the sentence still works, rewrite it with a more specific object, number or ritual.

## 5. Signature moment

Choose one live thing the visitor does or triggers, tied to the idea sentence. Examples: steer a vertical drive, hold to lock a mode, drag a slider that reveals the other half, hover a helmet to flip its livery, scrub a timeline of the season, type a name and see it set in the display face. Make it work with keyboard and touch too. Give it brand-voice labels ("tap to lock", "Load Norris" style loader text).

## 6. Palette, rhythm and structure

- 2 to 4 colours. One loud accent, used on less than 10% of the surface. Near-black and off-white feel more expensive than pure black and white.
- Draw the accent from the subject (a helmet, a bottle, a flag), not from a trend.
- Alternate section density: hero (loud), statement (quiet), proof (dense), deep dive (immersive), social (light), footer (loud, a giant call to action).
- Make a modular split where the brand has two sides, so the visitor chooses a path (results vs culture, work vs studio).
- Keep the first screen honest: a clear title in one h1 within a second, a hint of what to do, and one striking visual.

## 7. Copy rules

- Write all copy before markup. Layout follows the real length of real words.
- Short, concrete, voiced. Numbers and names over adjectives.
- Captions in a consistent form ("Qatar, 2024", "Miami GP, 2024") give an editorial feel for free.
- Highlight 1 to 3 words per statement in the accent colour or heavier weight to give the eye a path.
- Labels and microcopy speak in the brand's voice, but buttons stay unambiguous ("Visit the store", not "Vroom!").
- No placeholder text left in the build. Search for `lorem`, `TODO(content)` and `data-placeholder` before reporting.
