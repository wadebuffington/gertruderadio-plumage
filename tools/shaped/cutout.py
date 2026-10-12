#!/usr/bin/env python3
"""Cut Eddie's cardinal concepts out of their dark backgrounds.

    python3 tools/shaped/cutout.py   # -> public/shaped/concept-a.webp, concept-d.webp

Prototype art only (Milestone 4 experiment): the source pictures are Eddie's
AI-generated concepts in docs/design/. The transparent edge of each cut-out
is the player's outline. Needs Pillow, numpy and scipy.

How: the background is dark blue-grey, the bird is red / grey metal with
dark reddish outlines. Flood in from the picture's edges through anything
background-coloured, keep the one big shape that's left (that drops the
"CONCEPT A" caption and faint circuit lines), fill any holes, then soften
the edge by a pixel.
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[2]
SOURCES = {
    "a": ROOT / "docs/design/concept-a.jpg",
    "d": ROOT / "docs/design/concept-d.jpg",
}
OUT = ROOT / "public/shaped"


def cut(path):
    rgb = np.asarray(Image.open(path).convert("RGB")).astype(np.int16)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    # Background: dark and blue-leaning. The cardinal's black mask is neutral, not blue,
    # so requiring a little extra blue keeps the face.
    bg_like = (lum < 62) & (b >= r + 4)

    # Only background-like pixels connected to the picture's edge count.
    labels, _ = ndimage.label(bg_like)
    edge = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    background = np.isin(labels, edge[edge > 0])

    fg = ~background
    fg = ndimage.binary_opening(fg, iterations=2)  # snip thin specks and lines
    labels, n = ndimage.label(fg)
    if n == 0:
        raise SystemExit(f"nothing found in {path}")
    sizes = ndimage.sum(fg, labels, range(1, n + 1))
    bird = labels == (int(np.argmax(sizes)) + 1)
    bird = ndimage.binary_fill_holes(bird)

    alpha = Image.fromarray((bird * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
    img = Image.open(path).convert("RGBA")
    img.putalpha(alpha)
    ys, xs = np.nonzero(bird)
    pad = 6
    box = (max(0, xs.min() - pad), max(0, ys.min() - pad), min(img.width, xs.max() + pad), min(img.height, ys.max() + pad))
    return img.crop(box), box


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for key, src in SOURCES.items():
        img, box = cut(src)
        dest = OUT / f"concept-{key}.webp"
        img.save(dest, "WEBP", quality=88, method=6)
        # crop offset matters: control positions are measured on the cut-out
        print(f"{dest.relative_to(ROOT)}  {img.width}x{img.height}  (crop {box})  {dest.stat().st_size // 1024} KB")
