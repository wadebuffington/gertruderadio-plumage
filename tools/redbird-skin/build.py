#!/usr/bin/env python3
"""Build the Redbird classic skin for Plumage.

Every pixel is drawn here, from scratch, so the skin is entirely our own
artwork (no copied or traced skin assets). It writes a standard classic
skin archive that Webamp loads:

    python3 tools/redbird-skin/build.py      # -> public/skins/redbird.wsz

Needs Python 3 and Pillow (`pip install pillow`). Only needed when changing
the skin; the site build just uses the .wsz file.

Sprite positions follow the classic skin format as Webamp reads it.
Look: gunmetal body, crimson trim, warm orange "LCD" readouts, gold titles,
a teal spark here and there — the Gertrude Radio palette, after Eddie's
cardinal concepts A and D.
"""
import io
import zipfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "skins" / "redbird.wsz"

# ---------------------------------------------------------------- palette
INK = (14, 11, 18)  # near-black
METAL_D = (24, 21, 30)
METAL = (38, 34, 46)
METAL_L = (58, 53, 68)
METAL_HI = (96, 90, 108)
CRIMSON = (155, 27, 48)
CRIMSON_L = (214, 58, 82)
CRIMSON_D = (92, 14, 28)
GOLD = (232, 187, 69)
GOLD_D = (150, 112, 30)
TEAL = (76, 196, 188)
LCD_BG = (22, 9, 10)  # warm dark glass, like concept D's display
LCD_ON = (255, 160, 52)  # orange readout (≈ 9:1 on LCD_BG)
LCD_DIM = (62, 28, 16)  # unlit segments
WHITE = (240, 236, 228)

# ------------------------------------------------------------ 3x5 font
# One glyph per character, drawn in a 5x6 cell. "#" = lit pixel.
FONT = {
    "A": ".#. #.# ### #.# #.#", "B": "##. #.# ##. #.# ##.", "C": ".## #.. #.. #.. .##",
    "D": "##. #.# #.# #.# ##.", "E": "### #.. ##. #.. ###", "F": "### #.. ##. #.. #..",
    "G": ".## #.. #.# #.# .##", "H": "#.# #.# ### #.# #.#", "I": "### .#. .#. .#. ###",
    "J": "..# ..# ..# #.# .#.", "K": "#.# #.# ##. #.# #.#", "L": "#.. #.. #.. #.. ###",
    "M": "#.# ### ### #.# #.#", "N": "##. #.# #.# #.# #.#", "O": ".#. #.# #.# #.# .#.",
    "P": "##. #.# ##. #.. #..", "Q": ".#. #.# #.# ##. .##", "R": "##. #.# ##. #.# #.#",
    "S": ".## #.. .#. ..# ##.", "T": "### .#. .#. .#. .#.", "U": "#.# #.# #.# #.# ###",
    "V": "#.# #.# #.# #.# .#.", "W": "#.# #.# ### ### #.#", "X": "#.# #.# .#. #.# #.#",
    "Y": "#.# #.# .#. .#. .#.", "Z": "### ..# .#. #.. ###",
    "0": "### #.# #.# #.# ###", "1": ".#. ##. .#. .#. ###", "2": "##. ..# .#. #.. ###",
    "3": "##. ..# .#. ..# ##.", "4": "#.# #.# ### ..# ..#", "5": "### #.. ##. ..# ##.",
    "6": ".## #.. ### #.# ###", "7": "### ..# .#. .#. .#.", "8": "### #.# ### #.# ###",
    "9": "### #.# ### ..# ##.",
    '"': "#.# #.# ... ... ...", "@": ".#. #.# #.# #.. .##", "…": "... ... ... ... #.#",
    ".": "... ... ... ... .#.", ":": "... .#. ... .#. ...", "(": "..# .#. .#. .#. ..#",
    ")": "#.. .#. .#. .#. #..", "-": "... ... ### ... ...", "'": ".#. .#. ... ... ...",
    "!": ".#. .#. .#. ... .#.", "_": "... ... ... ... ###", "+": "... .#. ### .#. ...",
    "\\": "#.. #.. .#. ..# ..#", "/": "..# ..# .#. #.. #..", "[": "##. #.. #.. #.. ##.",
    "]": ".## ..# ..# ..# .##", "^": ".#. #.# ... ... ...", "&": ".#. #.# .#. #.# .##",
    "%": "#.# ..# .#. #.. #.#", ",": "... ... ... .#. #..", "=": "... ### ... ### ...",
    "$": ".## ##. .#. .## ##.", "#": "#.# ### #.# ### #.#", "Å": ".#. ### #.# ### #.#",
    "Ö": "#.# .#. #.# #.# .#.", "Ä": "#.# .#. #.# ### #.#", "?": "##. ..# .#. ... .#.",
    "*": "... #.# .#. #.# ...", " ": "... ... ... ... ...",
}

# Where each character sits in text.bmp (row, column), as Webamp reads it.
TEXT_LAYOUT = [
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ\"@",
    "0123456789….:()-'!_+\\/[]^&%,=$#",
    "ÅÖÄ?*",
]


class Sheet:
    """A tiny pixel canvas with just the drawing tools a skin needs."""

    def __init__(self, w, h, bg=(255, 0, 255)):
        self.img = Image.new("RGB", (w, h), bg)
        self.px = self.img.load()
        self.w, self.h = w, h

    def put(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.px[x, y] = c

    def fill(self, x, y, w, h, c):
        for j in range(y, y + h):
            for i in range(x, x + w):
                self.put(i, j, c)

    def vgrad(self, x, y, w, h, top, bottom):
        for j in range(h):
            t = j / max(1, h - 1)
            c = tuple(round(a + (b - a) * t) for a, b in zip(top, bottom))
            self.fill(x, y + j, w, 1, c)

    def frame(self, x, y, w, h, light, dark):
        """1px bevel: light on top/left, dark on bottom/right."""
        self.fill(x, y, w, 1, light)
        self.fill(x, y, 1, h, light)
        self.fill(x, y + h - 1, w, 1, dark)
        self.fill(x + w - 1, y, 1, h, dark)

    def raised(self, x, y, w, h, face=METAL_L):
        self.fill(x, y, w, h, face)
        self.frame(x, y, w, h, METAL_HI, INK)

    def sunken(self, x, y, w, h, face=LCD_BG):
        self.fill(x, y, w, h, face)
        self.frame(x, y, w, h, INK, METAL_HI)

    def glyph(self, x, y, ch, c):
        rows = FONT.get(ch.upper(), FONT["?"]).split()
        for j, row in enumerate(rows):
            for i, p in enumerate(row):
                if p == "#":
                    self.put(x + i, y + j, c)

    def text(self, x, y, s, c, step=4):
        for k, ch in enumerate(s):
            self.glyph(x + k * step, y, ch, c)

    def text_w(self, s, step=4):
        return len(s) * step - 1

    def bitmap(self, x, y, rows, c):
        for j, row in enumerate(rows):
            for i, p in enumerate(row):
                if p == "#":
                    self.put(x + i, y + j, c)

    def bmp(self):
        buf = io.BytesIO()
        self.img.save(buf, "BMP")
        return buf.getvalue()


# ------------------------------------------------------------ icons (pixel art)
ICONS = {
    "prev": ["#..#", "#.##", "####", "#.##", "#..#"],
    "play": ["#...", "##..", "###.", "##..", "#..."],
    "pause": ["##.##", "##.##", "##.##", "##.##", "##.##"],
    "stop": ["#####", "#####", "#####", "#####", "#####"],
    "next": ["#..#", "##.#", "####", "##.#", "#..#"],
    "eject": ["..#..", ".###.", "#####", ".....", "#####"],
}

# A small cardinal head, facing right: crest, black mask, orange beak.
CARDINAL = [
    "....RR.......",
    "...RRR.......",
    "..RRRR.......",
    ".RRRRRR......",
    "RRRRRRRR.....",
    "RRRRRKKRO....",
    "RRRRKKWKOO...",
    "RRRRKKKKOOO..",
    "RRRRRKKKOO...",
    "RRRRRRKKO....",
    ".RRRRRRR.....",
    "..RRRRRR.....",
    "...RRRRR.....",
    "....RRR......",
    ".....R.......",
]
CARDINAL_COLORS = {"R": CRIMSON_L, "K": INK, "W": WHITE, "O": LCD_ON}


def draw_cardinal(s, x, y):
    for j, row in enumerate(CARDINAL):
        for i, p in enumerate(row):
            if p in CARDINAL_COLORS:
                s.put(x + i, y + j, CARDINAL_COLORS[p])


def body(s, x, y, w, h):
    """Gunmetal panel with a crisp outer edge."""
    s.vgrad(x, y, w, h, METAL_L, METAL_D)
    s.frame(x, y, w, h, METAL_HI, INK)


# ============================================================ main window
def main_bmp():
    s = Sheet(275, 116)
    body(s, 0, 0, 275, 116)
    # crimson trim lines under the title bar and above the transport row
    s.fill(3, 15, 269, 1, CRIMSON)
    s.fill(3, 84, 269, 1, CRIMSON_D)
    # clutter bar slot
    s.sunken(9, 21, 10, 45, METAL_D)
    # main display: time + visualizer
    s.sunken(21, 21, 84, 42)
    s.fill(24, 41, 78, 1, LCD_DIM)  # faint divider between time and vis
    # clock colon (the digits are drawn by the player; the colon is painted here)
    s.fill(71, 30, 2, 2, LCD_ON)
    s.fill(71, 35, 2, 2, LCD_ON)
    # song title window
    s.sunken(108, 22, 160, 16)
    # kbps / khz readouts and their labels
    s.sunken(109, 41, 19, 9)
    s.text(130, 43, "KBPS", GOLD)
    s.sunken(154, 41, 14, 9)
    s.text(170, 43, "KHZ", GOLD)
    # slider rails sit on a darker strip
    s.fill(105, 55, 112, 17, METAL_D)
    s.frame(105, 55, 112, 17, INK, METAL_L)
    # position bar channel
    s.sunken(14, 70, 252, 14, METAL_D)
    # transport row base
    s.fill(3, 86, 269, 27, METAL)
    s.fill(3, 86, 269, 1, METAL_HI)
    # emblem
    draw_cardinal(s, 253, 91)
    # little teal spark beside the clutter bar, a stained-glass wink
    s.put(14, 68, TEAL)
    return s


def titlebar_bmp():
    s = Sheet(344, 87)

    def bar(y, active):
        x = 27
        s.vgrad(x, y, 275, 14, CRIMSON if active else METAL_L, CRIMSON_D if active else METAL_D)
        s.frame(x, y, 275, 14, CRIMSON_L if active else METAL_HI, INK)
        label = "PLUMAGE - GERTRUDE RADIO"
        tw = s.text_w(label)
        tx = x + (275 - tw) // 2
        # stripes either side of the title, like rails
        for sy in (y + 5, y + 8):
            s.fill(x + 18, sy, tx - x - 24, 1, GOLD_D if active else METAL_HI)
            s.fill(tx + tw + 6, sy, (x + 238) - (tx + tw + 6), 1, GOLD_D if active else METAL_HI)
        s.text(tx, y + 4, label, GOLD if active else METAL_HI)

    bar(0, True)  # MAIN_TITLE_BAR_SELECTED
    bar(15, False)  # MAIN_TITLE_BAR
    bar(57, True)  # easter-egg variants: same bars
    bar(72, False)

    def small_button(x, y, icon, pressed):
        s.fill(x, y, 9, 9, METAL_D if pressed else METAL_L)
        s.frame(x, y, 9, 9, INK if pressed else METAL_HI, METAL_HI if pressed else INK)
        s.bitmap(x + 2, y + 2, icon, GOLD)

    menu = ["#####", ".....", "#####", ".....", "#####"]
    minimize = [".....", ".....", ".....", ".....", "#####"]
    close = ["#...#", ".#.#.", "..#..", ".#.#.", "#...#"]
    shade = ["#####", "#...#", "#...#", "#...#", "#####"]
    unshade = [".....", "#####", "#...#", "#####", "....."]
    for pressed, y in ((False, 0), (True, 9)):
        small_button(0, y, menu, pressed)
        small_button(9, y, minimize, pressed)
        small_button(18, y, close, pressed)
    small_button(0, 18, shade, False)
    small_button(9, 18, shade, True)
    small_button(0, 27, unshade, False)
    small_button(9, 27, unshade, True)

    # clutter bar (O A I D V), normal and disabled, and each letter "pressed"
    def clutter(x, lit):
        s.fill(x, 0, 8, 43, METAL_D)
        s.frame(x, 0, 8, 43, INK, METAL_L)
        for k, ch in enumerate("OAIDV"):
            s.glyph(x + 2, 3 + k * 8, ch, GOLD if lit else METAL_HI)

    clutter(304, True)
    clutter(312, False)
    for k, (bx, by, bh) in enumerate([(304, 47, 8), (312, 55, 7), (320, 62, 7), (328, 69, 8), (336, 77, 7)]):
        s.fill(bx, by, 8, bh, CRIMSON)
        s.glyph(bx + 2, by + 1, "OAIDV"[k], WHITE)

    # shade mode (window rolled up to a strip)
    for y, active in ((29, True), (42, False)):
        s.vgrad(27, y, 275, 14, CRIMSON if active else METAL_L, CRIMSON_D if active else METAL_D)
        s.frame(27, y, 275, 14, CRIMSON_L if active else METAL_HI, INK)
        s.text(33, y + 4, "PLUMAGE", GOLD if active else METAL_HI)
    s.sunken(0, 36, 17, 7, METAL_D)
    s.fill(17, 36, 3, 7, GOLD)
    s.fill(20, 36, 3, 7, GOLD)
    s.fill(23, 36, 3, 7, GOLD)
    return s


def cbuttons_bmp():
    s = Sheet(136, 36)
    specs = [(0, 23, "prev"), (23, 23, "play"), (46, 23, "pause"), (69, 23, "stop"), (92, 22, "next")]
    for x, w, icon in specs:
        for y, pressed in ((0, False), (18, True)):
            face = CRIMSON_D if pressed else METAL_L
            s.fill(x, y, w, 18, face)
            s.frame(x, y, w, 18, INK if pressed else METAL_HI, METAL_HI if pressed else INK)
            iw = len(ICONS[icon][0])
            s.bitmap(x + (w - iw) // 2 + (1 if pressed else 0), y + 7 + (1 if pressed else 0), ICONS[icon],
                     WHITE if pressed else GOLD)
    for y, pressed in ((0, False), (16, True)):
        s.fill(114, y, 22, 16, CRIMSON_D if pressed else METAL_L)
        s.frame(114, y, 22, 16, INK if pressed else METAL_HI, METAL_HI if pressed else INK)
        s.bitmap(122, y + 5, ICONS["eject"], WHITE if pressed else GOLD)
    return s


def posbar_bmp():
    s = Sheet(307, 10)
    s.fill(0, 0, 248, 10, METAL_D)
    s.fill(2, 4, 244, 2, INK)
    s.fill(2, 4, 244, 1, CRIMSON_D)
    for x, pressed in ((248, False), (278, True)):
        s.fill(x, 0, 29, 10, CRIMSON_L if pressed else CRIMSON)
        s.frame(x, 0, 29, 10, CRIMSON_L, CRIMSON_D)
        for gx in (x + 11, x + 14, x + 17):
            s.fill(gx, 3, 1, 4, GOLD)
    return s


def slider_strip(s, x0, w, frames=28):
    """28 frames, 15px apart, each a rail that fills with colour as the value rises."""
    for f in range(frames):
        y = f * 15
        s.fill(x0, y, w, 13, METAL_D)
        s.fill(x0 + 2, y + 5, w - 4, 3, INK)
        fill_w = round((w - 4) * f / (frames - 1))
        if fill_w:
            s.fill(x0 + 2, y + 5, fill_w, 3, CRIMSON_L if f > frames * 0.66 else GOLD if f > frames * 0.33 else TEAL)


def slider_thumbs(s, y=422):
    for x, pressed in ((15, False), (0, True)):
        s.fill(x, y, 14, 11, WHITE if pressed else METAL_HI)
        s.frame(x, y, 14, 11, WHITE, INK)
        s.fill(x + 6, y + 2, 2, 7, CRIMSON)


def volume_bmp():
    s = Sheet(68, 433)
    slider_strip(s, 0, 68)
    slider_thumbs(s)
    return s


def balance_bmp():
    s = Sheet(47, 433)
    for f in range(28):  # balance: centre is neutral, either side warms up
        y = f * 15
        s.fill(9, y, 38, 13, METAL_D)
        s.fill(11, y + 5, 34, 3, INK)
        s.fill(27, y + 4, 2, 5, GOLD_D)
        if f:
            s.fill(28 - f // 2, y + 5, f // 2, 3, GOLD)
    slider_thumbs(s)
    return s


def shufrep_bmp():
    s = Sheet(92, 85)

    def btn(x, y, w, h, label, lit, pressed):
        s.fill(x, y, w, h, CRIMSON_D if pressed else METAL_L)
        s.frame(x, y, w, h, INK if pressed else METAL_HI, METAL_HI if pressed else INK)
        s.fill(x + 3, y + (h - 3) // 2, 2, 3, LCD_ON if lit else METAL_D)  # indicator light
        s.text(x + 7, y + (h - 5) // 2, label, WHITE if lit else GOLD)

    for row, (lit, pressed) in enumerate(((False, False), (False, True), (True, False), (True, True))):
        btn(0, row * 15, 28, 15, "REP", lit, pressed)
        btn(28, row * 15, 47, 15, "SHUFFLE", lit, pressed)
    for x, label in ((0, "EQ"), (23, "PL")):
        btn(x, 61, 23, 12, label, False, False)
        btn(x, 73, 23, 12, label, True, False)
        btn(x + 46, 61, 23, 12, label, False, True)
        btn(x + 46, 73, 23, 12, label, True, True)
    return s


def monoster_bmp():
    s = Sheet(56, 24)
    for y, lit in ((0, True), (12, False)):
        s.sunken(0, y, 29, 12, LCD_BG)
        s.text(3, y + 4, "STEREO", LCD_ON if lit else LCD_DIM)
        s.sunken(29, y, 27, 12, LCD_BG)
        s.text(33, y + 4, "MONO", LCD_ON if lit else LCD_DIM)
    return s


def playpaus_bmp():
    s = Sheet(48, 9, LCD_BG)
    s.bitmap(2, 2, ICONS["play"], LCD_ON)
    s.bitmap(11, 2, ICONS["pause"], LCD_ON)
    s.fill(20, 2, 5, 5, LCD_ON)
    s.fill(36, 0, 3, 9, LCD_DIM)
    s.fill(39, 0, 3, 9, TEAL)
    return s


# seven-segment digits for the big clock
SEGMENTS = {  # a b c d e f g
    "0": "1111110", "1": "0110000", "2": "1101101", "3": "1111001", "4": "0110011",
    "5": "1011011", "6": "1011111", "7": "1110000", "8": "1111111", "9": "1111011",
}


def seven_seg(s, x, y, digit):
    on = SEGMENTS.get(digit, "0000000")
    segs = [  # (x, y, w, h) inside a 9x13 cell
        (2, 0, 5, 1), (7, 1, 1, 5), (7, 7, 1, 5), (2, 12, 5, 1), (1, 7, 1, 5), (1, 1, 1, 5), (2, 6, 5, 1),
    ]
    for k, (sx, sy, w, h) in enumerate(segs):
        s.fill(x + sx, y + sy, w, h, LCD_ON if on[k] == "1" else LCD_DIM)


def numbers_bmp():
    s = Sheet(99, 13, LCD_BG)
    for d in range(10):
        seven_seg(s, d * 9, 0, str(d))
    s.fill(9 * 10, 0, 9, 13, LCD_BG)
    return s


def nums_ex_bmp():
    s = Sheet(108, 13, LCD_BG)
    for d in range(10):
        seven_seg(s, d * 9, 0, str(d))
    s.fill(99 + 2, 6, 5, 1, LCD_ON)  # minus sign
    return s


def text_bmp():
    s = Sheet(155, 18, LCD_BG)
    for row, chars in enumerate(TEXT_LAYOUT):
        for col, ch in enumerate(chars):
            s.glyph(col * 5 + 1, row * 6, ch, LCD_ON)
    return s


# ============================================================ equalizer
def eqmain_bmp():
    s = Sheet(275, 315)
    body(s, 0, 0, 275, 116)
    s.fill(3, 15, 269, 1, CRIMSON)
    # slider wells
    s.sunken(18, 35, 20, 69, METAL_D)
    s.sunken(75, 35, 182, 69, METAL_D)
    s.text(45, 37, "+12DB", GOLD)
    s.text(49, 65, "0DB", GOLD)
    s.text(45, 96, "-12DB", GOLD)
    s.text(15, 106, "PREAMP", GOLD)
    for k, label in enumerate(["60", "170", "310", "600", "1K", "3K", "6K", "12K", "14K", "16K"]):
        cx = 78 + k * 18 + 7
        s.text(cx - s.text_w(label) // 2, 106, label, GOLD)
    # graph window
    s.sunken(85, 16, 115, 21)

    # title bars
    for y, active in ((134, True), (149, False)):
        s.vgrad(0, y, 275, 14, CRIMSON if active else METAL_L, CRIMSON_D if active else METAL_D)
        s.frame(0, y, 275, 14, CRIMSON_L if active else METAL_HI, INK)
        label = "PLUMAGE EQUALIZER"
        s.text((275 - s.text_w(label)) // 2, y + 4, label, GOLD if active else METAL_HI)
    # close buttons
    for y, pressed in ((116, False), (125, True)):
        s.fill(0, y, 9, 9, METAL_D if pressed else METAL_L)
        s.frame(0, y, 9, 9, METAL_HI, INK)
        s.bitmap(2, y + 2, ["#...#", ".#.#.", "..#..", ".#.#.", "#...#"], GOLD)
    s.fill(254, 152, 9, 9, METAL_L)

    # ON / AUTO / PRESETS buttons in their four states
    def toggle(x, y, w, label, lit, pressed):
        s.fill(x, y, w, 12, CRIMSON_D if pressed else METAL_L)
        s.frame(x, y, w, 12, INK if pressed else METAL_HI, METAL_HI if pressed else INK)
        s.fill(x + 3, y + 4, 2, 4, LCD_ON if lit else METAL_D)
        s.text(x + 7, y + 4, label, WHITE if lit else GOLD)

    toggle(10, 119, 26, "ON", False, False)
    toggle(128, 119, 26, "ON", False, True)
    toggle(69, 119, 26, "ON", True, False)
    toggle(187, 119, 26, "ON", True, True)
    toggle(36, 119, 32, "AUTO", False, False)
    toggle(154, 119, 32, "AUTO", False, True)
    toggle(95, 119, 32, "AUTO", True, False)
    toggle(213, 119, 32, "AUTO", True, True)
    for y, pressed in ((164, False), (176, True)):
        s.fill(224, y, 44, 12, CRIMSON_D if pressed else METAL_L)
        s.frame(224, y, 44, 12, INK if pressed else METAL_HI, METAL_HI if pressed else INK)
        s.text(224 + (44 - s.text_w("PRESETS")) // 2, y + 4, "PRESETS", GOLD)

    # slider track frames: 28 of them, 14 wide, 15 apart, two rows of 14
    for f in range(28):
        fx, fy = 13 + 15 * (f % 14), 164 + 65 * (f // 14)
        s.fill(fx, fy, 14, 63, METAL_D)
        s.fill(fx + 6, fy + 2, 2, 59, INK)
        lit = round(57 * f / 27)
        if lit:
            s.fill(fx + 6, fy + 61 - lit, 2, lit, CRIMSON_L if f > 18 else GOLD if f > 9 else TEAL)
    # slider thumbs
    for y, pressed in ((164, False), (176, True)):
        s.fill(0, y, 11, 11, WHITE if pressed else METAL_HI)
        s.frame(0, y, 11, 11, WHITE, INK)
        s.fill(2, y + 5, 7, 1, CRIMSON)

    # graph background + line colours (top = boost, bottom = cut)
    s.fill(0, 294, 113, 19, LCD_BG)
    for gy in (0, 9, 18):
        s.fill(0, 294 + gy, 113, 1, LCD_DIM)
    for j in range(19):
        t = j / 18
        c = tuple(round(a + (b - a) * t) for a, b in zip(CRIMSON_L, TEAL))
        s.put(115, 294 + j, c)
    s.fill(0, 314, 113, 1, GOLD_D)
    return s


def eq_ex_bmp():
    s = Sheet(275, 56)
    for y, active in ((0, True), (15, False)):
        s.vgrad(0, y, 275, 14, CRIMSON if active else METAL_L, CRIMSON_D if active else METAL_D)
        s.frame(0, y, 275, 14, CRIMSON_L if active else METAL_HI, INK)
        s.text(6, y + 4, "PLUMAGE EQ", GOLD if active else METAL_HI)
    for x in (1, 4, 7, 11, 14, 17):
        s.fill(x, 30, 3, 7, GOLD)
    for y in (38, 47):
        for x in (1, 11):
            s.fill(x, y, 9, 9, METAL_L)
            s.frame(x, y, 9, 9, METAL_HI, INK)
    return s


# ============================================================ playlist
def pledit_bmp():
    s = Sheet(280, 186)

    def top(y, active):
        base, lo = (CRIMSON, CRIMSON_D) if active else (METAL_L, METAL_D)
        edge = CRIMSON_L if active else METAL_HI
        for x, w in ((0, 25), (127, 25), (153, 25)):
            s.vgrad(x, y, w, 20, base, lo)
            s.fill(x, y, w, 1, edge)
            s.fill(x, y + 19, w, 1, INK)
        s.fill(0, y, 1, 20, edge)
        s.fill(177, y, 1, 20, INK)
        for x in (127, 0):  # rails on the tile and left corner
            for ry in (y + 8, y + 11):
                s.fill(x + (6 if x == 0 else 0), ry, 25 - (6 if x == 0 else 0), 1, GOLD_D if active else METAL_HI)
        s.vgrad(26, y, 100, 20, base, lo)
        s.fill(26, y, 100, 1, edge)
        s.fill(26, y + 19, 100, 1, INK)
        label = "PLAYLIST"
        s.text(26 + (100 - s.text_w(label)) // 2, y + 8, label, GOLD if active else METAL_HI)
        for ry in (y + 8, y + 11):
            s.fill(153, ry, 6, 1, GOLD_D if active else METAL_HI)

    top(0, True)
    top(21, False)
    # side tiles
    s.vgrad(0, 42, 12, 29, METAL_L, METAL)
    s.fill(0, 42, 1, 29, METAL_HI)
    s.fill(11, 42, 1, 29, INK)
    s.vgrad(31, 42, 20, 29, METAL_L, METAL)
    s.fill(31, 42, 1, 29, INK)
    s.fill(50, 42, 1, 29, INK)
    s.fill(36, 42, 8, 29, METAL_D)  # scrollbar channel
    # close / collapse / expand (pressed states)
    for x in (52, 62, 150):
        s.fill(x, 42, 9, 9, METAL_D)
        s.frame(x, 42, 9, 9, INK, METAL_HI)
    # scroll handles
    for x, c in ((52, METAL_HI), (61, GOLD)):
        s.fill(x, 53, 8, 18, c)
        s.frame(x, 53, 8, 18, WHITE, INK)
    # shade strips
    for y in (42, 57):
        s.vgrad(72, y, 25, 14, METAL_L, METAL_D)
        s.vgrad(99, y, 50, 14, METAL_L, METAL_D)

    # bottom pieces
    def bottom(x, w):
        s.vgrad(x, 72, w, 38, METAL_L, METAL_D)
        s.fill(x, 72, w, 1, METAL_HI)
        s.fill(x, 109, w, 1, INK)

    bottom(0, 125)
    s.fill(0, 72, 1, 38, METAL_HI)
    for bx, label in ((14, "ADD"), (43, "REM"), (72, "SEL"), (101, "MISC")):
        s.raised(bx, 80, 22, 18)
        s.text(bx + (22 - s.text_w(label)) // 2, 87, label, GOLD)
    bottom(126, 150)
    s.fill(275, 72, 1, 38, INK)
    s.sunken(126 + 5, 72 + 8, 92, 12)  # running-time display
    s.sunken(126 + 64, 72 + 21, 29, 9)  # mini time
    for k, icon in enumerate(["prev", "play", "pause", "stop", "next", "eject"]):
        s.bitmap(126 + 3 + k * 10 + 3, 72 + 22 + 3, [r[:4] for r in ICONS[icon]][:4], GOLD)
    s.raised(126 + 106, 80, 22, 18)
    s.text(126 + 106 + 3, 84, "LIST", GOLD)
    s.text(126 + 106 + 3, 90, "OPTS", GOLD)
    # repeating bottom tile
    s.vgrad(179, 0, 25, 38, METAL_L, METAL_D)
    s.fill(179, 0, 25, 1, METAL_HI)
    s.fill(179, 37, 25, 1, INK)
    # visualizer background (shown when the playlist is widened)
    s.sunken(205, 0, 75, 38, LCD_BG)

    # pop-up menu buttons (ADD URL, ADD DIR, ...), normal then selected
    menus = {
        0: ["URL", "DIR", "FILE"], 54: ["ALL", "CROP", "SEL", "MISC"], 104: ["INV", "NONE", "ALL"],
        154: ["SORT", "INFO", "OPTS"], 204: ["NEW", "SAVE", "LOAD"],
    }
    for x, labels in menus.items():
        for k, label in enumerate(labels):
            y = 111 + 19 * k
            for dx, sel in ((0, False), (23, True)):
                s.fill(x + dx, y, 22, 18, CRIMSON if sel else METAL_L)
                s.frame(x + dx, y, 22, 18, METAL_HI, INK)
                s.text(x + dx + (22 - s.text_w(label)) // 2, y + 7, label, WHITE if sel else GOLD)
    for x, h in ((48, 54), (100, 72), (150, 54), (200, 54), (250, 54)):
        s.fill(x, 111, 3, h, CRIMSON)
    return s


PLEDIT_TXT = """[Text]
Normal=#E8D9B0
Current=#FFFFFF
NormalBG=#0E0B12
SelectedBG=#9B1B30
Font=Arial
"""

# 24 colours: background, dots, 16 spectrum bars (top → bottom), 5 scope, peak.
VIS = [LCD_BG, LCD_DIM]
for k in range(16):
    t = k / 15
    VIS.append(tuple(round(a + (b - a) * t) for a, b in zip((255, 220, 120), CRIMSON)))
VIS += [LCD_ON, (240, 140, 40), (220, 110, 40), (200, 80, 40), (180, 60, 40), WHITE]
VISCOLOR_TXT = "\n".join(f"{r},{g},{b}," for r, g, b in VIS) + "\n"

README_TXT = """Redbird - a Plumage skin by Gertrude Radio (made by Redbird).
Original artwork, drawn in code (tools/redbird-skin/build.py).
Free to use with Plumage.
"""


# ------------------------------------------------------------ contrast check
def luminance(c):
    def ch(v):
        v /= 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = (ch(v) for v in c)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    la, lb = sorted((luminance(a), luminance(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


# Every text-on-background pairing the skin uses. WCAG AA asks 4.5:1 for text.
TEXT_PAIRS = [
    ("LCD readouts (time, title, kbps)", LCD_ON, LCD_BG),
    ("gold labels on the body", GOLD, METAL_D),
    ("gold labels on raised buttons", GOLD, METAL_L),
    ("white labels on pressed buttons", WHITE, CRIMSON_D),
    ("white labels on lit menu buttons", WHITE, CRIMSON),
    ("title text, active window", GOLD, CRIMSON_D),
    ("playlist text", hex_rgb("#E8D9B0"), hex_rgb("#0E0B12")),
    ("playlist current track", hex_rgb("#FFFFFF"), hex_rgb("#0E0B12")),
    ("playlist selected row", hex_rgb("#E8D9B0"), hex_rgb("#9B1B30")),
]


def contrast_report():
    worst = 99
    print("Contrast check (WCAG AA needs 4.5:1 for text):")
    for label, fg, bg in TEXT_PAIRS:
        r = contrast(fg, bg)
        worst = min(worst, r)
        print(f"  {'ok  ' if r >= 4.5 else 'FAIL'} {r:5.2f}:1  {label}")
    return worst >= 4.5


def build():
    files = {
        "main.bmp": main_bmp(),
        "titlebar.bmp": titlebar_bmp(),
        "cbuttons.bmp": cbuttons_bmp(),
        "posbar.bmp": posbar_bmp(),
        "volume.bmp": volume_bmp(),
        "balance.bmp": balance_bmp(),
        "shufrep.bmp": shufrep_bmp(),
        "monoster.bmp": monoster_bmp(),
        "playpaus.bmp": playpaus_bmp(),
        "numbers.bmp": numbers_bmp(),
        "nums_ex.bmp": nums_ex_bmp(),
        "text.bmp": text_bmp(),
        "eqmain.bmp": eqmain_bmp(),
        "eq_ex.bmp": eq_ex_bmp(),
        "pledit.bmp": pledit_bmp(),
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
        for name, sheet in files.items():
            z.writestr(name, sheet.bmp())
        z.writestr("pledit.txt", PLEDIT_TXT)
        z.writestr("viscolor.txt", VISCOLOR_TXT)
        z.writestr("readme.txt", README_TXT)
    return files


if __name__ == "__main__":
    if not contrast_report():
        raise SystemExit("Contrast check failed: fix the colours above before building.")
    sheets = build()
    preview = ROOT / "tools" / "redbird-skin" / "preview"
    preview.mkdir(exist_ok=True)
    for name, sheet in sheets.items():
        sheet.img.save(preview / name.replace(".bmp", ".png"))
    print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB)")
