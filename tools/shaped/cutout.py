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


def cut(path, frame=None):
    rgb = np.asarray(Image.open(path).convert("RGB")).astype(np.int16)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    # Background: dark and blue-leaning. The cardinal's black mask is neutral, not blue,
    # so requiring a little extra blue keeps the face.
    # Some pictures have a near-black face mask with a hint of blue; the backdrop
    # is never that dark, so `min_lum` keeps very dark pixels in the bird.
    min_lum = (frame or {}).get("min_lum", 0)
    bg_like = (lum < 62) & (b >= r + 4) & (lum >= min_lum)

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
    if frame:
        return img.crop(frame["box"]).resize(frame["size"], Image.LANCZOS), frame["box"]
    ys, xs = np.nonzero(bird)
    pad = 6
    box = (max(0, xs.min() - pad), max(0, ys.min() - pad), min(img.width, xs.max() + pad), min(img.height, ys.max() + pad))
    return img.crop(box), box


# Pin a cut-out to a fixed frame so the control positions in src/shaped/skins.js
# stay valid when the art is replaced by a bigger or edited version. `box` is
# the frame in this source image's pixels; `size` is the output size; `units`
# converts output pixels to the skin's coordinate units.
# D: Eddie's Oct 2026 edit (metal plates removed) is the original at 1.958x,
# same framing (checked by image alignment), so its frame is the old crop
# (34, 18, 832, 996) x 1.958, written out at 2x the skin's units for sharpness.
FRAMES = {"d": {"box": (67, 35, 1629, 1950), "size": (1596, 1956), "units": 0.5, "min_lum": 9}}

# Screens whose live display must fit the painted glass exactly: a point inside
# the glass and a box to stay within. The glass is warm dark red with orange
# markings; its frame is neutral grey metal, so spreading out from the seed
# through warm pixels stops at the frame.
SCREENS = {"d": {"seed": (200, 470), "box": (160, 340, 520, 620)}}  # in skin units


def screen_mask(img, seed, box):
    rgb = np.asarray(img.convert("RGB")).astype(np.int16)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    warm = (r - np.maximum(g, b)) > 16
    inside = np.zeros_like(warm)
    x0, y0, x1, y1 = box
    inside[y0:y1, x0:x1] = True
    labels, _ = ndimage.label(warm & inside)
    glass = labels == labels[seed[1], seed[0]]
    glass = ndimage.binary_fill_holes(ndimage.binary_closing(glass, iterations=3))
    ys, xs = np.nonzero(glass)
    crop = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
    alpha = Image.fromarray((glass * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7)).crop(crop)
    return alpha, crop


# Eddie's Aviary birds (Oct 2026) share concept D's player and framing: each is
# D's source at 0.972x shifted (-7, +30) px (found by image alignment), so they
# reuse D's control map and screen outline. Backdrops differ (white, sky blue,
# navy, black), so the backdrop colour is read from the corners.
D_BOX = FRAMES["d"]["box"]
AVIARY = ["raven", "owl", "mockingbird", "phoenix"]
AVIARY_BOX = tuple(round(v) for v in (
    (D_BOX[0] - 7) * 0.972, (D_BOX[1] + 30) * 0.972, (D_BOX[2] - 7) * 0.972, (D_BOX[3] + 30) * 0.972,
))


# Skin-unit areas holding the player itself (body + volume dial), never cleared.
PLAYER_AREAS = [("box", 160, 285, 545, 760), ("circle", 592, 490, 104)]


def cut_on_backdrop(path, box, size, tol=48, pockets=False):
    rgb = np.asarray(Image.open(path).convert("RGB")).astype(np.int16)
    h, w = rgb.shape[:2]
    corners = np.array([rgb[4, 4], rgb[4, w - 5], rgb[h - 5, 4], rgb[h - 5, w - 5]])
    bg = np.median(corners, axis=0)
    near = np.sqrt(((rgb - bg) ** 2).sum(-1)) < tol
    labels, _ = ndimage.label(near)
    edge = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    fg = ~np.isin(labels, edge[edge > 0])
    fg = ndimage.binary_opening(fg, iterations=2)
    labels, n = ndimage.label(fg)
    sizes = ndimage.sum(fg, labels, range(1, n + 1))
    bird = ndimage.binary_fill_holes(labels == (int(np.argmax(sizes)) + 1))
    # Light backdrops leave a pale fringe in the anti-aliased edge; trim it.
    bird = ndimage.binary_erosion(bird, iterations=3 if bg.mean() > 100 else 1)
    if pockets:
        # Backdrop also showing *inside* the outline (between wings and head):
        # clear big near-backdrop pockets, but never in the player.
        k = (box[2] - box[0]) / (size[0] / 2)  # source px per skin unit
        yy, xx = np.mgrid[0:h, 0:w]
        ux, uy = (xx - box[0]) / k, (yy - box[1]) / k
        safe = np.zeros((h, w), bool)
        for area in PLAYER_AREAS:
            if area[0] == "box":
                safe |= (ux >= area[1]) & (uy >= area[2]) & (ux <= area[3]) & (uy <= area[4])
            else:
                safe |= (ux - area[1]) ** 2 + (uy - area[2]) ** 2 <= area[3] ** 2
        dark = (np.sqrt(((rgb - bg) ** 2).sum(-1)) < tol * 0.6) & bird & ~safe
        dark = ndimage.binary_opening(dark, iterations=2)
        labels, n = ndimage.label(dark)
        if n:
            sizes = ndimage.sum(dark, labels, range(1, n + 1))
            big = np.isin(labels, np.nonzero(sizes > 1500)[0] + 1)
            bird &= ~ndimage.binary_dilation(big, iterations=1)
    alpha = Image.fromarray((bird * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.9))
    img = Image.open(path).convert("RGBA")
    img.putalpha(alpha)
    ys, xs = np.nonzero(bird)
    inside = xs.min() >= box[0] and ys.min() >= box[1] and xs.max() < box[2] and ys.max() < box[3]
    return img.crop(box).resize(size, Image.LANCZOS), inside


if __name__ == "__main__":
    for name in AVIARY:
        src = ROOT / f"docs/design/bird-{name}.jpg"
        img, inside = cut_on_backdrop(src, AVIARY_BOX, FRAMES["d"]["size"], pockets=name == "phoenix")
        dest = OUT / f"bird-{name}.webp"
        img.save(dest, "WEBP", quality=88, method=6)
        note = "" if inside else "  (NOTE: bird reaches past the frame; edges trimmed)"
        print(f"{dest.relative_to(ROOT)}  {img.width}x{img.height}  {dest.stat().st_size // 1024} KB{note}")

    OUT.mkdir(parents=True, exist_ok=True)
    for key, src in SOURCES.items():
        frame = FRAMES.get(key)
        img, box = cut(src, frame)
        k = 1 / frame["units"] if frame else 1  # output px per skin unit
        dest = OUT / f"concept-{key}.webp"
        img.save(dest, "WEBP", quality=88, method=6)
        # crop offset matters: control positions are measured on the cut-out
        print(f"{dest.relative_to(ROOT)}  {img.width}x{img.height}  (crop {box})  {dest.stat().st_size // 1024} KB")
        if key in SCREENS:
            sc = SCREENS[key]
            seed = tuple(round(v * k) for v in sc["seed"])
            sbox = tuple(round(v * k) for v in sc["box"])
            alpha, crop = screen_mask(img, seed, sbox)
            mask = OUT / f"concept-{key}-screen.png"
            Image.merge("RGBA", (alpha, alpha, alpha, alpha)).save(mask, optimize=True)
            x0, y0, x1, y1 = (int(v) / k for v in crop)
            print(f"  screen mask {mask.relative_to(ROOT)} (skin units): x {x0:g}, y {y0:g}, w {x1 - x0:g}, h {y1 - y0:g}")
