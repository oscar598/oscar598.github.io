#!/usr/bin/env python3
"""Builds the packaging print files in packaging/ at real size (mm), from the brand vectors.
Needs: pip install segno   (for the QR code)

  python3 own-a-car/tools/packaging.py

Layer convention for the printer, by color in the SVGs:
  #0a0a0a  soft-touch black stock (no ink)
  #c9a24a  GOLD FOIL  (hot-foil stamp)
  #ff00ff  BLIND DEBOSS (no ink or foil; pressure only; magenta is only the marker)
  #00a0ff  dieline / fold / cut guides (not printed)
"""
import json
import re
from pathlib import Path

import segno
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "packaging"
cfg = json.loads((ROOT / "config.json").read_text())

word_svg = (ROOT / "brand" / "wordmark.svg").read_text()
WORD_VB = [float(v) for v in re.search(r'viewBox="([^"]+)"', word_svg).group(1).split()]
WORD = re.search(r"<g[^>]*>(.*)</g>", word_svg, re.S).group(1)
key_svg = (ROOT / "brand" / "key-mono.svg").read_text()
KEY = re.search(r'aria-label="[^"]*">(.*)</svg>', key_svg, re.S).group(1).replace('fill="currentColor"', "")

GOLD, BLACK, DEBOSS, GUIDE, BONE = "#c9a24a", "#0a0a0a", "#ff00ff", "#00a0ff", "#f4efe6"


def wordmark(x, y, width, fill):
    s = width / WORD_VB[2]
    return f'<g transform="translate({x:.2f} {y:.2f}) scale({s:.6f})" fill="{fill}">{WORD}</g>'


def key(x, y, width, fill, rotate=0, stroke=None):
    s = width / 300
    paint = f'fill="none" stroke="{stroke}" stroke-width="{0.35 / s:.2f}"' if stroke else f'fill="{fill}"'
    return (f'<g transform="translate({x:.2f} {y:.2f}) rotate({rotate}) scale({s:.5f})" {paint}>{KEY}</g>')


FONTS = {("JetBrains Mono", 500): "jetbrains-mono-latin-500-normal", ("Michroma", 400): "michroma-latin-400-normal",
         ("Saira", 400): "saira-latin-400-normal"}
_fonts = {}


def text(x, y, size, body, fill, anchor="middle", family="JetBrains Mono", weight=500, spacing=0.2):
    """Text as outlined paths (printers need outlines; SVG <text> also loses the font). size and spacing in mm."""
    name = FONTS[(family, weight)]
    font = _fonts.setdefault(name, TTFont(ROOT / "fonts" / f"{name}.woff2"))
    upm, cmap, glyphs, hmtx = font["head"].unitsPerEm, font.getBestCmap(), font.getGlyphSet(), font["hmtx"]
    k = size / upm
    names = [cmap[ord(ch)] for ch in body]  # KeyError here means a character outside the latin subset
    width = sum(hmtx[g][0] * k for g in names) + spacing * (len(names) - 1)
    cx = x - {"start": 0, "middle": width / 2, "end": width}[anchor]
    pen = SVGPathPen(glyphs)
    for g in names:
        glyphs[g].draw(TransformPen(pen, (k, 0, 0, -k, cx, y)))
        cx += hmtx[g][0] * k + spacing
    return f'<path fill="{fill}" d="{pen.getCommands()}"/>'


def svg(name, w, h, body, note):
    (OUT / name).write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}mm" height="{h}mm" viewBox="0 0 {w} {h}">\n'
        f"<!-- {note} -->\n{body}\n</svg>\n")
    print(name)


def main():
    # Rigid box lid, top panel: 120 × 80 mm. Blind-debossed key, small foil wordmark.
    w, h = 120, 80
    svg("box-lid.svg", w, h,
        f'<rect width="{w}" height="{h}" fill="{BLACK}"/>'
        + key(22, 22, 76, None, stroke=DEBOSS)
        + wordmark(35, 62, 50, GOLD)
        + f'<rect x=".5" y=".5" width="{w - 1}" height="{h - 1}" fill="none" stroke="{GUIDE}" stroke-width=".25" stroke-dasharray="1 1"/>',
        "Lid top, 120x80 mm, soft-touch black wrap. Magenta = blind deboss (0.6 mm), gold = foil. Blue = trim.")

    # Sleeve: a 60 mm band wrapping the box's short way. Panels: back 80 | side 35 | front 80 | side 35 | glue 15.
    panels = [("back", 80), ("side", 35), ("front", 80), ("side", 35), ("glue", 15)]
    W, H = sum(p[1] for p in panels), 60
    body = f'<rect width="{W}" height="{H}" fill="{BLACK}"/>'
    x = 0
    for name, pw in panels:
        if name == "front":
            body += wordmark(x + 12, 16, pw - 24, GOLD)
            body += text(x + pw / 2, 40, 3.2, "KEY Nº ______", GOLD)
            body += text(x + pw / 2, 49, 2.2, "YOU NOW OWN A CAR.", BONE, spacing=0.5)
        if name == "back":
            body += text(x + pw / 2, 30, 2.2, "AN ART PROJECT BY OSCAR LU", "#8d877c", spacing=0.4)
            body += text(x + pw / 2, 35, 2.2, "UNLIMITED EDITION", "#8d877c", spacing=0.4)
        if name == "side":
            body += f'<g transform="translate({x + pw / 2} {H / 2}) rotate(-90)">{text(0, 1, 2.4, "OWN A CAR", GOLD, spacing=1.2)}</g>'
        x += pw
        if x < W:
            body += f'<line x1="{x}" y1="0" x2="{x}" y2="{H}" stroke="{GUIDE}" stroke-width=".25" stroke-dasharray="1.5 1"/>'
    body += f'<rect x="{W - 15}" y="0" width="15" height="{H}" fill="#1a1917"/>'
    svg("sleeve.svg", W, H, body,
        "Sleeve, 245x60 mm flat. Uncoated black 350 gsm. Gold = foil. The key number is foil-stamped as a blank line "
        "and hand-numbered in gold pen, or digitally printed per unit. Blue = folds. Glue flap on the right.")

    # Round seal sticker for the mailer and tissue: 40 mm.
    svg("seal.svg", 40, 40,
        f'<circle cx="20" cy="20" r="20" fill="{GOLD}"/><circle cx="20" cy="20" r="16.5" fill="none" stroke="{BLACK}" stroke-width=".35"/>'
        + text(20, 13.2, 2.3, "OWN A CAR", BLACK, spacing=0.9)
        + key(8.5, 15.5, 23, BLACK)
        + text(20, 30.5, 1.7, "UNLIMITED EDITION", BLACK, spacing=0.45),
        "40 mm round sticker, gold foil paper stock, black print. Seals the tissue inside the mailer.")

    # Insert card, 3.5 × 2 in (89 × 51 mm): QR to the key page lookup and Discord.
    qr = segno.make(cfg["siteUrl"] + "key.html", error="m")
    matrix = list(qr.matrix)
    n = len(matrix)
    size, qx, qy = 30, 52, 10.5
    cell = size / n
    rects = "".join(f'<rect x="{qx + c * cell:.3f}" y="{qy + r * cell:.3f}" width="{cell + .01:.3f}" height="{cell + .01:.3f}"/>'
                    for r, row in enumerate(matrix) for c, v in enumerate(row) if v)
    svg("insert-card.svg", 89, 51,
        f'<rect width="89" height="51" fill="{BLACK}"/>'
        + wordmark(6, 8, 36, GOLD)
        + text(6, 20, 3.4, "Welcome, owner.", BONE, anchor="start", family="Michroma", weight=400, spacing=0)
        + text(6, 27, 2.2, "Track your key, find your", "#cfc8bb", anchor="start", family="Saira", weight=400, spacing=0)
        + text(6, 30.4, 2.2, "certificate, join the owners.", "#cfc8bb", anchor="start", family="Saira", weight=400, spacing=0)
        + text(6, 42, 2, "POST IT: #OWNACAR @OWNACAR", GOLD, anchor="start", spacing=0.3)
        + f'<rect x="{qx - 2}" y="{qy - 2}" width="{size + 4}" height="{size + 4}" fill="{BONE}"/>'
        + f'<g fill="{BLACK}">{rects}</g>',
        "Insert card 89x51 mm, 600 gsm black board, digital print + gold foil wordmark. QR → the key page lookup.")


if __name__ == "__main__":
    main()
