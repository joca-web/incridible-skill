#!/usr/bin/env python3
"""compare.py: diff a reference image against a screenshot of the build.

  python3 compare.py REF.png SHOT.png [--out DIR] [--grid 12x8] [--region x,y,w,h]

The screenshot is resized to the reference width (aspect ratio kept) and padded or cropped
to the reference height, so a full-page screenshot at the same CSS width lines up.
Writes to DIR: side-by-side.png (reference | screenshot | diff), heatmap.png, report.json.
Needs Pillow and numpy.
"""
import argparse
import json
import os
import sys

try:
    import numpy as np
    from PIL import Image
except ImportError:
    sys.exit("Pillow and numpy are required. If installs are blocked, compare by eye with img_probe.py tiles and ruler.")


def to_rgb(path):
    im = Image.open(path)
    im.load()
    if im.mode in ("RGBA", "LA"):
        bg = Image.new("RGB", im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[-1])
        return bg
    return im.convert("RGB")


def box_mean(a, k):
    """Mean over non-overlapping kxk blocks (a is 2D). Trims the edge."""
    h, w = a.shape
    h2, w2 = h - h % k, w - w % k
    return a[:h2, :w2].reshape(h2 // k, k, w2 // k, k).mean(axis=(1, 3))


def ssim_map(a, b, k=8):
    """Block SSIM on grayscale float arrays in 0..255. Returns a (h/k, w/k) map."""
    c1, c2 = (0.01 * 255) ** 2, (0.03 * 255) ** 2
    mu_a, mu_b = box_mean(a, k), box_mean(b, k)
    var_a = box_mean(a * a, k) - mu_a ** 2
    var_b = box_mean(b * b, k) - mu_b ** 2
    cov = box_mean(a * b, k) - mu_a * mu_b
    return ((2 * mu_a * mu_b + c1) * (2 * cov + c2)) / ((mu_a ** 2 + mu_b ** 2 + c1) * (var_a + var_b + c2))


def where(r, c, rows, cols):
    v = "top" if r < rows / 3 else "bottom" if r >= 2 * rows / 3 else "middle"
    h = "left" if c < cols / 3 else "right" if c >= 2 * cols / 3 else "center"
    return f"{v}-{h}"


def main():
    p = argparse.ArgumentParser()
    p.add_argument("ref")
    p.add_argument("shot")
    p.add_argument("--out", default=os.path.join(".incridible", "diff"))
    p.add_argument("--grid", default="12x8", help="COLSxROWS for the per-cell ranking")
    p.add_argument("--region", help="x,y,w,h in reference pixels: compare only this region")
    a = p.parse_args()
    os.makedirs(a.out, exist_ok=True)

    ref = to_rgb(a.ref)
    shot = to_rgb(a.shot)
    warnings = []
    if shot.width != ref.width:
        nh = round(shot.height * ref.width / shot.width)
        warnings.append(f"screenshot width {shot.width} resized to {ref.width}")
        shot = shot.resize((ref.width, nh), Image.LANCZOS)
    if abs(shot.height - ref.height) > 0.02 * ref.height:
        warnings.append(f"heights differ: reference {ref.height}px, screenshot {shot.height}px ({(shot.height - ref.height) / ref.height * 100:+.1f}%)")
    canvas = Image.new("RGB", ref.size, (255, 0, 255))
    canvas.paste(shot.crop((0, 0, ref.width, min(shot.height, ref.height))), (0, 0))
    shot = canvas

    if a.region:
        x, y, w, h = [int(v) for v in a.region.split(",")]
        ref, shot = ref.crop((x, y, x + w, y + h)), shot.crop((x, y, x + w, y + h))
        origin = (x, y)
    else:
        origin = (0, 0)

    ra = np.asarray(ref, dtype=np.float32)
    sa = np.asarray(shot, dtype=np.float32)
    absdiff = np.abs(ra - sa).mean(axis=2)
    ga = ra @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    gb = sa @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    sm = ssim_map(ga, gb, 8)
    overall = float(sm.mean())
    mad = float(absdiff.mean())

    cols, rows = [int(v) for v in a.grid.lower().split("x")]
    H, W = absdiff.shape
    cells = []
    for r in range(rows):
        for c in range(cols):
            y0, y1 = r * H // rows, (r + 1) * H // rows
            x0, x1 = c * W // cols, (c + 1) * W // cols
            ca, cb = ga[y0:y1, x0:x1], gb[y0:y1, x0:x1]
            k = 8
            if ca.shape[0] >= k and ca.shape[1] >= k:
                s = float(ssim_map(ca, cb, k).mean())
            else:
                s = 1.0
            cells.append({
                "row": r, "col": c, "area": where(r, c, rows, cols),
                "ssim": round(s, 3), "mean_abs_diff": round(float(absdiff[y0:y1, x0:x1].mean()), 2),
                "box_ref_px": [origin[0] + x0, origin[1] + y0, x1 - x0, y1 - y0],
            })
    worst = sorted(cells, key=lambda c: c["ssim"])[:8]

    # heatmap
    norm = np.clip(absdiff / 64.0, 0, 1)
    base = (ra * 0.35 + 255 * 0.65 * 0).astype(np.uint8)
    heat = base.copy()
    heat[..., 0] = np.clip(base[..., 0] + norm * 220, 0, 255)
    heat[..., 1] = (base[..., 1] * (1 - norm * 0.8)).astype(np.uint8)
    heat[..., 2] = (base[..., 2] * (1 - norm * 0.8)).astype(np.uint8)
    heat_im = Image.fromarray(heat.astype(np.uint8))
    heat_im.save(os.path.join(a.out, "heatmap.png"))

    gap = 12
    sbs = Image.new("RGB", (ref.width * 3 + gap * 2, ref.height), (30, 30, 30))
    sbs.paste(ref, (0, 0))
    sbs.paste(shot, (ref.width + gap, 0))
    sbs.paste(heat_im, ((ref.width + gap) * 2, 0))
    sbs.save(os.path.join(a.out, "side-by-side.png"))

    report = {
        "reference": a.ref, "screenshot": a.shot, "size_px": [ref.width, ref.height],
        "structural_similarity": round(overall, 4), "mean_abs_diff_0_255": round(mad, 2),
        "worst_cells": worst, "warnings": warnings,
    }
    with open(os.path.join(a.out, "report.json"), "w") as f:
        json.dump(report, f, indent=2)

    print(f"size {ref.width}x{ref.height}   structural similarity {overall:.3f}   mean abs diff {mad:.2f}/255")
    for w in warnings:
        print("warning:", w)
    print("worst cells (ssim, area, box x,y,w,h in reference px):")
    for c in worst:
        print(f"  {c['ssim']:.3f}  {c['area']:<14} {c['box_ref_px']}  diff {c['mean_abs_diff']}")
    verdict = "good" if overall >= 0.95 else "close" if overall >= 0.90 else "keep working"
    print(f"verdict: {verdict}   files in {a.out}")


if __name__ == "__main__":
    main()
