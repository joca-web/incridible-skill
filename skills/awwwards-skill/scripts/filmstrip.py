#!/usr/bin/env python3
"""filmstrip.py: turn the motion frames recorded by shoot.mjs into one contact sheet (and a GIF).

  python3 filmstrip.py SHOOT_DIR [--width 1440] [--cols 4] [--gif]
  python3 filmstrip.py MODELS_DIR --pattern "helmet-turn-*.jpg" --gif     (a model3d.mjs turntable)

Reads SHOOT_DIR/w<width>-motion-*.jpg (or the files matching --pattern), writes a contact sheet
(<prefix>-filmstrip.png) and, with --gif, an animation (<prefix>-motion.gif). Look at the sheet to judge real motion: reveals mid-way, pins
holding, horizontal tracks moving, nothing blank between frames. Needs Pillow.
"""
import argparse
import glob
import os
import sys

try:
    from PIL import Image, ImageDraw
except ImportError:
    sys.exit("Pillow is required. Without it, open the w<width>-motion-*.jpg frames one by one.")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("dir")
    p.add_argument("--width", type=int, default=1440)
    p.add_argument("--cols", type=int, default=4)
    p.add_argument("--thumb", type=int, default=420, help="thumbnail width in px")
    p.add_argument("--gif", action="store_true")
    p.add_argument("--pattern", help='glob of frames inside DIR, e.g. "helmet-turn-*.jpg"')
    a = p.parse_args()

    pattern = a.pattern or f"w{a.width}-motion-*.jpg"
    files = sorted(glob.glob(os.path.join(a.dir, pattern)))
    if not files:
        sys.exit(f"no {pattern} frames in {a.dir}; run shoot.mjs (without --no-motion) or model3d.mjs --frames N first")
    prefix = a.pattern.split("*")[0].rstrip("-_") if a.pattern else f"w{a.width}"
    frames = [Image.open(f).convert("RGB") for f in files]
    tw = a.thumb
    th = round(frames[0].height * tw / frames[0].width)
    cols = min(a.cols, len(frames))
    rows = (len(frames) + cols - 1) // cols
    gap, label = 10, 18
    sheet = Image.new("RGB", (cols * tw + (cols + 1) * gap, rows * (th + label) + (rows + 1) * gap), (24, 24, 26))
    d = ImageDraw.Draw(sheet)
    for i, fr in enumerate(frames):
        r, c = divmod(i, cols)
        x = gap + c * (tw + gap)
        y = gap + r * (th + label + gap)
        sheet.paste(fr.resize((tw, th), Image.LANCZOS), (x, y + label))
        d.text((x, y + 2), f"frame {i + 1}/{len(frames)}", fill=(200, 200, 200))
    out = os.path.join(a.dir, f"{prefix}-filmstrip.png")
    sheet.save(out)
    print(out, f"({len(frames)} frames)")
    if a.gif:
        g = [f.resize((min(720, f.width), round(f.height * min(720, f.width) / f.width)), Image.LANCZOS) for f in frames]
        gout = os.path.join(a.dir, f"{prefix}-motion.gif")
        g[0].save(gout, save_all=True, append_images=g[1:], duration=220, loop=0, optimize=True)
        print(gout)


if __name__ == "__main__":
    main()
