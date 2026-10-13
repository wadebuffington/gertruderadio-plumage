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
