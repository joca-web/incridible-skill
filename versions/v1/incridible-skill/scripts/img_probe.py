#!/usr/bin/env python3
"""img_probe.py: image tools for the image-to-code route of incridible-skill.

Subcommands (needs Pillow; numpy is used when present):
  info   IMG                         size, aspect ratio, mode, DPR hint
  tiles  IMG [--height 1200] [--overlap 120] [--out DIR]
                                     slice a tall image into readable tiles
  ruler  IMG [--step 100] [--out FILE]
                                     draw a labelled pixel grid to read exact positions
  palette IMG [--n 8]                dominant colours, guessed roles, CSS variables, contrast
  crop   IMG x,y,w,h [--out FILE] [--scale 1] [--grid STEP]
                                     crop (and optionally upscale / grid) a region
  fake-depth IMG [--out FILE]        procedural radial depth map, for demos and tests only
"""
import argparse
import colorsys
import os
import sys

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    sys.exit("Pillow is required (pip install pillow). If installs are blocked, read the image by eye and measure manually.")


def load(path):
    im = Image.open(path)
    im.load()
    return im


def rgb(im):
    if im.mode in ("RGBA", "LA"):
        bg = Image.new("RGB", im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[-1])
        return bg
    return im.convert("RGB")


def font(size):
    for name in ("DejaVuSans-Bold.ttf", "DejaVuSans.ttf", "Arial.ttf", "Helvetica.ttc"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def cmd_info(a):
    im = load(a.image)
    w, h = im.size
    from math import gcd
    g = gcd(w, h)
    print(f"file: {a.image}")
    print(f"size: {w} x {h}px   mode: {im.mode}   aspect: {w/h:.3f} ({w//g}:{h//g})")
    hints = []
    if w in (2880, 2560, 3024, 3456):
        hints.append("looks like a 2x retina capture: CSS width is probably %d" % (w // 2))
    if w in (1440, 1920, 1280, 1366, 1536):
        hints.append("common desktop width")
    if w in (390, 393, 375, 412, 430, 780, 786, 750):
        hints.append("phone width (780/786/750 are 2x captures)")
    if h > 4 * w:
        hints.append("very tall: use `tiles` to read it section by section")
    for t in hints:
        print("hint:", t)


def cmd_tiles(a):
    im = rgb(load(a.image))
    w, h = im.size
    out = a.out
    os.makedirs(out, exist_ok=True)
    step = a.height - a.overlap
    n = 0
    y = 0
    while y < h:
        box = (0, y, w, min(h, y + a.height))
        tile = im.crop(box)
        path = os.path.join(out, f"tile-{n:02d}-y{y}.png")
        tile.save(path)
        print(path, f"(y {box[1]}..{box[3]})")
        n += 1
        if box[3] >= h:
            break
        y += step
    print(f"{n} tile(s) written to {out}")


def cmd_ruler(a):
    im = rgb(load(a.image)).convert("RGBA")
    w, h = im.size
    over = Image.new("RGBA", im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(over)
    f = font(max(11, min(w, h) // 90))
    for x in range(0, w, a.step):
        d.line([(x, 0), (x, h)], fill=(255, 0, 80, 110), width=1)
        d.text((x + 3, 3), str(x), fill=(255, 0, 80, 255), font=f)
        d.text((x + 3, h - 16), str(x), fill=(255, 0, 80, 255), font=f)
    for y in range(0, h, a.step):
        d.line([(0, y), (w, y)], fill=(0, 120, 255, 110), width=1)
        d.text((3, y + 3), str(y), fill=(0, 120, 255, 255), font=f)
        d.text((w - 48, y + 3), str(y), fill=(0, 120, 255, 255), font=f)
    out = Image.alpha_composite(im, over).convert("RGB")
    path = a.out or os.path.join(".incridible", "ruler.png")
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    out.save(path)
    print(path, f"({w}x{h}, grid every {a.step}px; red = x, blue = y)")


def lum(c):
    def ch(v):
        v /= 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    return 0.2126 * ch(c[0]) + 0.7152 * ch(c[1]) + 0.0722 * ch(c[2])


def contrast(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def hexc(c):
    return "#%02X%02X%02X" % c


def cmd_palette(a):
    im = rgb(load(a.image))
    im.thumbnail((400, 400))
    q = im.quantize(colors=a.n * 2, method=Image.Quantize.MEDIANCUT)
    pal = q.getpalette()
    counts = sorted(q.getcolors(), reverse=True)
    total = sum(c for c, _ in counts)
    items = []
    for c, idx in counts:
        col = tuple(pal[idx * 3: idx * 3 + 3])
        # merge near-duplicates
        if any(sum(abs(col[i] - e["rgb"][i]) for i in range(3)) < 30 for e in items):
            for e in items:
                if sum(abs(col[i] - e["rgb"][i]) for i in range(3)) < 30:
                    e["share"] += c / total
                    break
            continue
        items.append({"rgb": col, "share": c / total})
    items = sorted(items, key=lambda e: -e["share"])[: a.n]
    bg = items[0]["rgb"]
    def sat(c):
        r, g, b = [v / 255 for v in c]
        return colorsys.rgb_to_hls(r, g, b)[2]
    ink = max(items, key=lambda e: contrast(e["rgb"], bg))["rgb"]
    accent_pool = [e for e in items if e["rgb"] not in (bg, ink)]
    accent = max(accent_pool, key=lambda e: sat(e["rgb"]) * (0.5 + min(e["share"], 0.2) * 2))["rgb"] if accent_pool else ink
    # Median-cut averages small saturated areas into muddy tones, so also look for the most common vivid colour.
    buckets = {}
    pixels = im.get_flattened_data() if hasattr(im, "get_flattened_data") else im.getdata()
    for r, g, b in pixels:
        h, l, sa = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
        if sa > 0.55 and 0.25 < l < 0.75:
            k = (r >> 4, g >> 4, b >> 4)
            n, sr, sg, sb = buckets.get(k, (0, 0, 0, 0))
            buckets[k] = (n + 1, sr + r, sg + g, sb + b)
    if buckets:
        n, sr, sg, sb = max(buckets.values(), key=lambda v: v[0])
        if n >= 0.002 * (im.width * im.height):
            accent = (sr // n, sg // n, sb // n)
            items.append({"rgb": accent, "share": n / (im.width * im.height)})
    print("colour        share   hex")
    for e in items:
        print(f"  {hexc(e['rgb'])}   {e['share']*100:5.1f}%")
    print("\nguessed roles (verify against the image; sample exact pixels for flat colours):")
    print(f"  --bg:     {hexc(bg)}\n  --ink:    {hexc(ink)}   contrast vs bg {contrast(ink, bg):.2f}:1")
    print(f"  --accent: {hexc(accent)}   contrast vs bg {contrast(accent, bg):.2f}:1")
    print("\n:root {")
    print(f"  --bg: {hexc(bg)};\n  --ink: {hexc(ink)};\n  --accent: {hexc(accent)};")
    for i, e in enumerate([e for e in items if e["rgb"] not in (bg, ink, accent)][:4], 1):
        print(f"  --tone-{i}: {hexc(e['rgb'])};")
    print("}")


def cmd_crop(a):
    im = load(a.image)
    x, y, w, h = [int(v) for v in a.box.split(",")]
    c = im.crop((x, y, x + w, y + h))
    if a.scale != 1:
        c = c.resize((int(c.width * a.scale), int(c.height * a.scale)), Image.LANCZOS)
    if a.grid:
        c = rgb(c).convert("RGBA")
        over = Image.new("RGBA", c.size, (0, 0, 0, 0))
        d = ImageDraw.Draw(over)
        f = font(11)
        s = a.grid * a.scale
        k = 0
        while k * s < c.width:
            d.line([(k * s, 0), (k * s, c.height)], fill=(255, 0, 80, 120))
            d.text((k * s + 2, 2), str(x + k * a.grid), fill=(255, 0, 80, 255), font=f)
            k += 1
        k = 0
        while k * s < c.height:
            d.line([(0, k * s), (c.width, k * s)], fill=(0, 120, 255, 120))
            d.text((2, k * s + 2), str(y + k * a.grid), fill=(0, 120, 255, 255), font=f)
            k += 1
        c = Image.alpha_composite(c, over)
    out = a.out or os.path.join(".incridible", f"crop-{x}-{y}-{w}x{h}.png")
    os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
    ext = os.path.splitext(out)[1].lower()
    if ext in (".jpg", ".jpeg") or (ext == ".webp" and c.mode == "RGBA" and False):
        c = rgb(c)
    c.save(out, quality=90) if ext in (".jpg", ".jpeg", ".webp") else c.save(out)
    print(out, c.size)


def cmd_fake_depth(a):
    import math
    im = load(a.image)
    w, h = im.size
    small = (max(64, w // 4), max(64, h // 4))
    d = Image.new("L", small)
    px = d.load()
    cx, cy = small[0] * 0.5, small[1] * 0.58
    for yy in range(small[1]):
        for xx in range(small[0]):
            dx = (xx - cx) / (small[0] * 0.38)
            dy = (yy - cy) / (small[1] * 0.5)
            v = max(0.0, 1.0 - math.sqrt(dx * dx + dy * dy))
            px[xx, yy] = int(255 * (v ** 0.8))
    d = d.resize((w, h), Image.BICUBIC)
    out = a.out or os.path.splitext(a.image)[0] + "-depth.png"
    d.save(out)
    print(out, "(procedural stand-in: replace with a real depth map)")


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = p.add_subparsers(dest="cmd", required=True)
    s = sp.add_parser("info"); s.add_argument("image"); s.set_defaults(fn=cmd_info)
    s = sp.add_parser("tiles"); s.add_argument("image"); s.add_argument("--height", type=int, default=1200)
    s.add_argument("--overlap", type=int, default=120); s.add_argument("--out", default=os.path.join(".incridible", "tiles")); s.set_defaults(fn=cmd_tiles)
    s = sp.add_parser("ruler"); s.add_argument("image"); s.add_argument("--step", type=int, default=100); s.add_argument("--out"); s.set_defaults(fn=cmd_ruler)
    s = sp.add_parser("palette"); s.add_argument("image"); s.add_argument("--n", type=int, default=8); s.set_defaults(fn=cmd_palette)
    s = sp.add_parser("crop"); s.add_argument("image"); s.add_argument("box"); s.add_argument("--out"); s.add_argument("--scale", type=float, default=1.0)
    s.add_argument("--grid", type=int, default=0); s.set_defaults(fn=cmd_crop)
    s = sp.add_parser("fake-depth"); s.add_argument("image"); s.add_argument("--out"); s.set_defaults(fn=cmd_fake_depth)
    a = p.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
