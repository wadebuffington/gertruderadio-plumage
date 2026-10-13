#!/usr/bin/env python3
"""Cut Eddie's button artwork into round images for the shaped players.

    python3 tools/shaped/buttons.py   # -> public/shaped/button-*.webp

Each source is a round button on black; we keep the disc (with a soft edge)
and shrink it to a small square image.
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
# name -> source, disc centre and radius in source pixels (found from the
# bright area's bounding box), output size
BUTTONS = {
    "open": {"src": ROOT / "docs/design/button-open.jpg", "cx": 999, "cy": 987, "r": 604, "size": 128},
}

# Eddie's button sheet (Oct 2026): two rows of five, found automatically
# (bright discs on black), named in reading order.
SHEETS = [
    {
        "src": ROOT / "docs/design/buttons-set-1.jpg",
        "names": ["stop", "rewind", "play", "forward", "volume", "previous", "pause", "next", "repeat", "shuffle"],
        "size": 128,
    },
]


def find_discs(path):
    from scipy import ndimage

    a = np.asarray(Image.open(path).convert("RGB")).astype(int)
    bright = ndimage.binary_fill_holes(ndimage.binary_opening(a.sum(-1) / 3 > 30, iterations=3))
    labels, _ = ndimage.label(bright)
    discs = []
    for ys, xs in ndimage.find_objects(labels):
        w, h = xs.stop - xs.start, ys.stop - ys.start
        if w > 150:  # ignore specks
            discs.append(((xs.start + xs.stop) // 2, (ys.start + ys.stop) // 2, (w + h) // 4))
    # reading order: rows (by centre height, coarsely), then left to right
    row_h = max(d[2] for d in discs)
    return sorted(discs, key=lambda d: (d[1] // row_h, d[0]))


for sheet in SHEETS:
    discs = find_discs(sheet["src"])
    if len(discs) != len(sheet["names"]):
        raise SystemExit(f"{sheet['src'].name}: found {len(discs)} buttons, expected {len(sheet['names'])}")
    for name, (cx, cy, r) in zip(sheet["names"], discs):
        BUTTONS[name] = {"src": sheet["src"], "cx": cx, "cy": cy, "r": r, "size": sheet["size"]}

for name, b in BUTTONS.items():
    img = Image.open(b["src"]).convert("RGB")
    box = (b["cx"] - b["r"], b["cy"] - b["r"], b["cx"] + b["r"], b["cy"] + b["r"])
    disc = img.crop(box)
    d = disc.width
    mask = Image.new("L", (d * 4, d * 4), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, d * 4 - 1, d * 4 - 1), fill=255)
    mask = mask.resize((d, d), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.5))
    disc.putalpha(mask)
    out = ROOT / "public/shaped" / f"button-{name}.webp"
    disc.resize((b["size"], b["size"]), Image.LANCZOS).save(out, "WEBP", quality=90, method=6)
    print(f"{out.relative_to(ROOT)}  {out.stat().st_size // 1024} KB")
