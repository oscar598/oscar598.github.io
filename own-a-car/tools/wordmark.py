#!/usr/bin/env python3
"""Outlines the OWN A CAR wordmark (Fraunces Black, +280 tracking) into brand/*.svg, so the logo
never depends on a font being installed. Needs: pip install fonttools brotli

  python3 own-a-car/tools/wordmark.py
"""
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
FONT = ROOT / "fonts" / "fraunces-latin-900-normal.woff2"
BRAND = ROOT / "brand"
KEY = (BRAND / "key-mono.svg").read_text().split(">", 1)[1].rsplit("</svg>", 1)[0]


def outline(text, tracking=0.28):
    font = TTFont(FONT)
    upm = font["head"].unitsPerEm
    cmap, glyphs, hmtx = font.getBestCmap(), font.getGlyphSet(), font["hmtx"]
    ascent = font["hhea"].ascent
    cap = font["OS/2"].sCapHeight or 0.7 * upm
    pen = SVGPathPen(glyphs)
    x = 0
    for i, ch in enumerate(text):
        name = cmap[ord(ch)]
        # Flip y (fonts are y-up) and move the baseline to the cap height.
        glyphs[name].draw(TransformPen(pen, (1, 0, 0, -1, x, cap)))
        x += hmtx[name][0] + (tracking * upm if i < len(text) - 1 else 0)
    return pen.getCommands(), x, cap, upm


def write(name, body, w, h, fill):
    (BRAND / name).write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" role="img" aria-label="OWN A CAR">'
        f'<g fill="{fill}">{body}</g></svg>\n')
    print(name)


def main():
    d, w, cap, upm = outline("OWN A CAR")
    pad = cap * 0.1
    word = f'<path transform="translate(0 {pad:.0f})" d="{d}"/>'
    for name, fill in [("wordmark.svg", "#f4efe6"), ("wordmark-black.svg", "#0a0a0a"), ("wordmark-gold.svg", "#c9a24a")]:
        write(name, word, w, cap + 2 * pad, fill)

    # Horizontal lockup: key (scaled to the cap height ×1.6) then the wordmark.
    key_h = cap * 1.6
    key_w = key_h * 3
    gap = cap * 0.9
    total_h = key_h
    lock = (f'<g transform="scale({key_h / 100:.4f})">{KEY}</g>'
            f'<path transform="translate({key_w + gap:.0f} {(total_h - cap) / 2:.0f})" d="{d}"/>')
    for name, fill in [("lockup.svg", "#f4efe6"), ("lockup-black.svg", "#0a0a0a")]:
        write(name, lock.replace('fill="currentColor"', ""), key_w + gap + w, total_h, fill)


if __name__ == "__main__":
    main()
