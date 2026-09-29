#!/usr/bin/env python3
"""Builds the launch video from type cards, stills and the site's physics recordings.

  1. Record the physics (demo site served at $SITE):
       node own-a-car/tools/record_clips.js <frames>/landscape landscape
       node own-a-car/tools/record_clips.js <frames>/portrait portrait
  2. python3 own-a-car/tools/launch_video.py <frames> [landscape|portrait|both]
     → marketing/x/clips/launch-16x9.mp4 and launch-9x16.mp4

Needs: Playwright + Chromium (for the cards), pip install imageio-ffmpeg (ffmpeg with H.264).
The edit (EDIT below) is one list for both formats. Deadpan by design: hard cuts, black cards, no music,
because X autoplays muted and the numbers carry the joke.
"""
import html
import os
import subprocess
import sys
import tempfile
from pathlib import Path

import imageio_ffmpeg

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "marketing" / "x" / "clips"
FF = imageio_ffmpeg.get_ffmpeg_exe()
FPS = 30
SIZES = {"landscape": (1920, 1080, "16x9"), "portrait": (1080, 1920, "9x16")}

# (kind, source, seconds, options). Cards: (kicker, headline). Clips: start second in the recording, speed.
EDIT = [
    ("card", ("DROP 001", "ONE CAR."), 1.4, {}),
    ("still", "assets/car.jpg", 2.4, {"pan": "in"}),
    ("card", ("", "UNLIMITED KEYS."), 1.1, {}),
    ("clip", "rain", 4.0, {"start": 1.2}),
    ("card", ("", "$50 EACH."), 1.0, {}),
    ("still", "assets/key.jpg", 1.5, {"pan": "in"}),
    ("card", ("", "EVERYONE WHO BUYS ONE OWNS IT."), 1.8, {}),
    ("clip", "shatter", 4.4, {"start": 1.0, "speed": 1.45}),
    ("card", ("1,430 KG ÷ OWNERS", "THE MORE OWNERS, THE LESS CAR."), 1.8, {}),
    ("card", ("", "YOUR NAME GOES ON IT."), 1.2, {}),
    ("clip", "names", 3.0, {"start": 0.6}),
    ("still", "assets/box.jpg", 1.6, {"pan": "down"}),
    ("card", ("ALL OR NOTHING", "6,000 KEYS, OR EVERYONE GETS THEIR MONEY BACK."), 2.2, {}),
    ("card", ("NOV 9 · 12 PM ET", "YOU NOW OWN A CAR."), 2.6, {"end": True}),
]


def run(cmd):
    subprocess.run(cmd, check=True)


def cards_html(w, h):
    """One page holding every card at the output size; rendered one element at a time."""
    scale = min(w, h) / 1080
    items = []
    for i, (kind, src, _, opt) in enumerate(EDIT):
        if kind != "card":
            continue
        kicker, head = src
        end = opt.get("end")
        items.append(f'''<section class="card{' end' if end else ''}" id="c{i}">
  {'<img class="key" src="../../brand/key.svg" alt="">' if end else ''}
  <div class="kick">{html.escape(kicker)}</div>
  <h1>{html.escape(head)}</h1>
  {'<img class="wm" src="../../brand/wordmark.svg" alt="">' if end else ''}
</section>''')
    return f'''<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../fonts/fonts.css">
<style>
  body {{ margin: 0; background: #000; }}
  .card {{ width: {w}px; height: {h}px; box-sizing: border-box; padding: {round(110 * scale)}px; background: #0a0a0a; color: #f4efe6;
          display: flex; flex-direction: column; justify-content: center; position: relative; overflow: hidden; }}
  .kick {{ font: 500 {round(26 * scale)}px "JetBrains Mono", monospace; letter-spacing: .2em; color: #c9a24a; min-height: 1em; margin-bottom: {round(28 * scale)}px; }}
  h1 {{ margin: 0; font: 400 {round((92 if w > h else 84) * scale)}px/1.12 "Michroma", sans-serif; letter-spacing: .01em; max-width: 15ch; }}
  .end h1 {{ font-size: {round(104 * scale)}px; }}
  .end .key {{ position: absolute; width: {round(620 * scale)}px; right: -{round(60 * scale)}px; top: {round(90 * scale)}px; transform: rotate(-12deg);
               filter: drop-shadow(0 30px 60px rgba(201,162,74,.35)); }}
  .end .wm {{ position: absolute; left: {round(110 * scale)}px; bottom: {round(90 * scale)}px; width: {round(320 * scale)}px; }}
</style></head><body>{"".join(items)}</body></html>'''


def render_cards(fmt, work):
    w, h, _ = SIZES[fmt]
    page = ROOT / "marketing" / "x" / f".cards-{fmt}.html"   # sits beside cards.html so relative paths resolve
    page.write_text(cards_html(w, h))
    env = {**os.environ, "NODE_PATH": os.environ.get("NODE_PATH") or subprocess.run(
        ["npm", "root", "-g"], capture_output=True, text=True).stdout.strip()}
    try:
        for i, (kind, *_rest) in enumerate(EDIT):
            if kind == "card":
                subprocess.run(["node", str(ROOT / "tools" / "render.js"), f"{page}#c{i}", str(work / f"c{i}.png"),
                                str(w + 100), str(h + 100)], check=True, env=env, capture_output=True)
    finally:
        page.unlink()


def cover(w, h):
    # Scale to cover the frame, then crop to it.
    return f"scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h}"


def segment(i, item, fmt, frames, work):
    kind, src, dur, opt = item
    w, h, _ = SIZES[fmt]
    out = work / f"s{i:02d}.mp4"
    enc = ["-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p", "-r", str(FPS), "-an", str(out)]
    if kind == "card":
        run([FF, "-loglevel", "error", "-y", "-loop", "1", "-t", str(dur), "-i", str(work / f"c{i}.png"),
             "-vf", f"scale={w}:{h},setsar=1,fps={FPS}", *enc])
    elif kind == "still":
        # A slow push: cover at 112%, then slide the crop window across the extra 12%.
        W, H = int(w * 1.12) // 2 * 2, int(h * 1.12) // 2 * 2
        if opt.get("pan") == "down":
            move = f"crop={w}:{h}:(iw-{w})/2:(ih-{h})*t/{dur}"
        else:
            move = f"crop={w}:{h}:(iw-{w})*(0.7-0.4*t/{dur}):(ih-{h})/2"
        run([FF, "-loglevel", "error", "-y", "-loop", "1", "-t", str(dur), "-i", str(ROOT / src),
             "-vf", f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},{move},setsar=1,fps={FPS}", *enc])
    else:
        speed = opt.get("speed", 1.0)
        start = int(opt.get("start", 0) * FPS)
        n = int(dur * speed * FPS)
        run([FF, "-loglevel", "error", "-y", "-framerate", str(FPS), "-start_number", str(start),
             "-i", str(Path(frames) / fmt / src / "%05d.jpg"), "-frames:v", str(n),
             "-vf", f"{cover(w, h)},setpts=PTS/{speed},setsar=1,fps={FPS}", "-t", str(dur), *enc])
    return out


def build(fmt, frames):
    _, _, tag = SIZES[fmt]
    with tempfile.TemporaryDirectory() as t:
        work = Path(t)
        render_cards(fmt, work)
        parts = [segment(i, item, fmt, frames, work) for i, item in enumerate(EDIT)]
        (work / "list.txt").write_text("".join(f"file '{p}'\n" for p in parts))
        OUT.mkdir(parents=True, exist_ok=True)
        dest = OUT / f"launch-{tag}.mp4"
        run([FF, "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(work / "list.txt"),
             "-c:v", "libx264", "-crf", "20", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(dest)])
    total = sum(d for _, _, d, _ in EDIT)
    print(f"{dest.relative_to(ROOT)}  {total:.1f} s")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    which = sys.argv[2] if len(sys.argv) > 2 else "both"
    for f in (["landscape", "portrait"] if which == "both" else [which]):
        build(f, sys.argv[1])
