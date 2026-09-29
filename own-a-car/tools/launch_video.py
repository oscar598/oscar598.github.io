#!/usr/bin/env python3
"""Builds the launch video (Script A in marketing/research/launch-video-frameworks.md):
State. Show. Divide. Name. Count. 22.5 s, vertical first.

  1. Record the physics from a demo copy of the site served at $SITE, without the page's own copy:
       CLEAN=1 node own-a-car/tools/record_clips.js <frames>/landscape landscape
       CLEAN=1 node own-a-car/tools/record_clips.js <frames>/portrait portrait
  2. python3 own-a-car/tools/launch_video.py <frames> [landscape|portrait|both] [launch teaser-key teaser-shatter teaser-names]
     → marketing/x/clips/<name>-9x16.mp4 and <name>-16x9.mp4

Needs Playwright + Chromium (cards and captions are HTML) and `pip install imageio-ffmpeg`.
Frame 1 is the lit key with text (X counts a view at 2 s; a black first frame loses it).
Every AI render carries CONCEPT RENDER; every site recording carries SCREEN RECORDING.
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

# (kind, source, seconds, options)
#   card:  source = (kicker, headline); options: end=True for the closing lockup, small=… for its second line
#   still: source = image path; options: text, corner, pan
#   clip:  source = recorded scene; options: start (s into the recording), speed, text, corner
LAUNCH = [
    ("still", "assets/key.jpg", 2.0, {"text": "THIS IS A KEY TO A LAMBORGHINI.", "corner": "CONCEPT RENDER", "pan": "in"}),
    ("card", ("", "IT COSTS $50."), 1.5, {}),
    ("still", "assets/car.jpg", 4.0, {"text": "THIS IS THE LAMBORGHINI.", "corner": "CONCEPT RENDER", "pan": "in"}),
    ("card", ("", "THERE IS NO LIMIT ON KEYS."), 1.5, {}),
    ("clip", "rain", 3.0, {"start": 1.4, "text": "EVERYONE WHO HOLDS ONE OWNS IT.", "corner": "SCREEN RECORDING", "pos": "top"}),
    ("clip", "shatter", 3.5, {"start": 1.0, "speed": 2.2, "text": "OWNERS: 1 → 100,000", "corner": "SCREEN RECORDING"}),
    ("clip", "names", 2.5, {"start": 1.0, "text": "YOUR NAME GOES ON THE CAR.", "corner": "SCREEN RECORDING"}),
    ("still", "assets/box.jpg", 1.5, {"text": "KEY. BOX. CERTIFICATE.", "corner": "CONCEPT RENDER", "pan": "down"}),
    ("card", ("ALL OR NOTHING", "6,000 KEYS BY DEC 9. OR EVERYONE IS REFUNDED."), 1.5, {}),
    ("card", ("", "OWN A CAR."), 1.5, {"end": True, "small": "THE KEY DOES NOT START THE CAR."}),
]

# Teaser week (Script B variants): one idea each, ending on the date.
DATE = ("", "NOV 10.")
EDITS = {
    "launch": LAUNCH,
    "teaser-key": [
        ("still", "assets/key.jpg", 2.6, {"text": "A KEY.", "corner": "CONCEPT RENDER", "pan": "in"}),
        ("still", "assets/box.jpg", 2.4, {"text": "TO A LAMBORGHINI.", "corner": "CONCEPT RENDER", "pan": "down"}),
        ("card", DATE, 1.6, {"end": True}),
    ],
    "teaser-shatter": [
        ("clip", "shatter", 6.0, {"start": 1.0, "speed": 1.3, "text": "ONE CAR. HOW MANY OWNERS?", "corner": "SCREEN RECORDING"}),
        ("card", DATE, 1.6, {"end": True}),
    ],
    # The full slider sweep for the thread reply that explains "how much of it is yours".
    "shatter": [
        ("clip", "shatter", 7.5, {"start": 1.0, "speed": 1.1, "text": "OWNERS: 1 → 100,000", "corner": "SCREEN RECORDING"}),
        ("card", ("", "OWN A CAR."), 1.6, {"end": True, "small": "THE MORE OWNERS, THE LESS CAR."}),
    ],
    "teaser-names": [
        ("clip", "names", 4.5, {"start": 0.6, "text": "EVERY OWNER'S NAME. ON THE CAR.", "corner": "SCREEN RECORDING"}),
        ("card", DATE, 1.6, {"end": True}),
    ],
}


def run(cmd):
    subprocess.run(cmd, check=True)


def node_env():
    root = os.environ.get("NODE_PATH") or subprocess.run(["npm", "root", "-g"], capture_output=True, text=True).stdout.strip()
    return {**os.environ, "NODE_PATH": root}


def page_html(w, h, edit):
    """Every card and every caption overlay for one format, one element each."""
    s = min(w, h) / 1080
    lower = w > h                      # landscape: captions in the lower third; portrait: the centre third
    els = []
    for i, (kind, src, _, opt) in enumerate(edit):
        if kind == "card":
            kicker, head = src
            end = opt.get("end")
            els.append(f'''<section class="card{' end' if end else ''}" id="c{i}">
  {'<img class="key" src="../../brand/key.svg" alt="">' if end else ''}
  <div class="kick">{html.escape(kicker)}</div><h1>{html.escape(head)}</h1>
  {f'<p class="small">{html.escape(opt["small"])}</p>' if opt.get("small") else ''}
</section>''')
        elif opt.get("text"):
            els.append(f'''<section class="over" id="o{i}">
  <div class="cap {opt.get('pos') or ('low' if lower or kind == 'clip' else 'mid')}"><span>{html.escape(opt["text"])}</span></div>
  {f'<div class="corner">{html.escape(opt["corner"])}</div>' if opt.get("corner") else ''}
</section>''')
    return f'''<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../fonts/fonts.css">
<style>
  body {{ margin: 0; background: transparent; }}
  section {{ width: {w}px; height: {h}px; position: relative; overflow: hidden; box-sizing: border-box; }}
  .card {{ padding: {round(110 * s)}px; background: #0a0a0a; color: #f4efe6; display: flex; flex-direction: column; justify-content: center; }}
  .kick {{ font: 500 {round(26 * s)}px "JetBrains Mono", monospace; letter-spacing: .2em; color: #c9a24a; min-height: 1em; margin-bottom: {round(28 * s)}px; }}
  h1 {{ margin: 0; font: 400 {round((88 if lower else 80) * s)}px/1.14 "Michroma", sans-serif; letter-spacing: .01em; max-width: 15ch; }}
  .end h1 {{ font-size: {round(118 * s)}px; }}
  .small {{ margin: {round(34 * s)}px 0 0; font: 500 {round(28 * s)}px "JetBrains Mono", monospace; letter-spacing: .16em; color: #c9a24a; }}
  .end .key {{ position: absolute; width: {round(620 * s)}px; right: -{round(60 * s)}px; top: {round(110 * s)}px; transform: rotate(-12deg);
               filter: drop-shadow(0 30px 60px rgba(201,162,74,.35)); }}
  /* A scrim behind every caption so it reads over brass and white paint. */
  .over {{ background: linear-gradient(180deg, transparent 0%, transparent 42%, rgba(10,10,10,.55) 56%, rgba(10,10,10,.6) 70%, transparent 82%); }}
  .over:has(.top) {{ background: linear-gradient(180deg, rgba(10,10,10,.7) 0%, rgba(10,10,10,.55) 30%, transparent 48%); }}
  .over:has(.low) {{ background: linear-gradient(180deg, transparent 0%, transparent 58%, rgba(10,10,10,.72) 84%, rgba(10,10,10,.8) 100%); }}
  .cap {{ position: absolute; left: 0; right: 0; display: flex; justify-content: center; padding: 0 {round(80 * s)}px; }}
  .cap.low {{ bottom: {round((90 if lower else 260) * s)}px; }}
  .cap.mid {{ top: 58%; }}
  .cap.top {{ top: {round((120 if lower else 330) * s)}px; }}
  .cap span {{ font: 400 {round((54 if lower else 58) * s)}px/1.25 "Michroma", sans-serif; color: #f4efe6; text-align: center; letter-spacing: .01em;
              text-shadow: 0 2px {round(24 * s)}px rgba(0,0,0,.9), 0 0 {round(6 * s)}px rgba(0,0,0,.8); max-width: 20ch; }}
  .corner {{ position: absolute; right: {round(44 * s)}px; top: {round(40 * s)}px; font: 500 {round(18 * s)}px "JetBrains Mono", monospace;
             letter-spacing: .2em; color: rgba(244,239,230,.75); text-shadow: 0 1px 8px rgba(0,0,0,.9); }}
</style></head><body>{"".join(els)}</body></html>'''


def render_overlays(fmt, work, edit):
    w, h, _ = SIZES[fmt]
    page = ROOT / "marketing" / "x" / f".video-{fmt}.html"   # beside cards.html so ../../ paths resolve
    page.write_text(page_html(w, h, edit))
    env = node_env()
    try:
        for i, (kind, _src, _d, opt) in enumerate(edit):
            if kind == "card" or opt.get("text"):
                el = f"c{i}" if kind == "card" else f"o{i}"
                subprocess.run(["node", str(ROOT / "tools" / "render.js"), f"{page}#{el}", str(work / f"{el}.png"),
                                str(w + 100), str(h + 100)], check=True, capture_output=True,
                               env={**env, "TRANSPARENT": "0" if kind == "card" else "1"})
    finally:
        page.unlink()


def segment(i, item, fmt, frames, work):
    kind, src, dur, opt = item
    w, h, _ = SIZES[fmt]
    out = work / f"s{i:02d}.mp4"
    enc = ["-c:v", "libx264", "-crf", "17", "-preset", "medium", "-pix_fmt", "yuv420p", "-r", str(FPS), "-an", str(out)]
    over = work / f"o{i}.png"
    if kind == "card":
        run([FF, "-loglevel", "error", "-y", "-loop", "1", "-t", str(dur), "-i", str(work / f"c{i}.png"),
             "-vf", f"scale={w}:{h},setsar=1,fps={FPS}", *enc])
        return out
    if kind == "still":
        # Slow push: cover at 108%, slide the crop window across the extra.
        W, H = int(w * 1.08) // 2 * 2, int(h * 1.08) // 2 * 2
        move = (f"crop={w}:{h}:(iw-{w})/2:(ih-{h})*t/{dur}" if opt.get("pan") == "down"
                else f"crop={w}:{h}:(iw-{w})*(0.65-0.3*t/{dur}):(ih-{h})/2")
        src_in = ["-loop", "1", "-t", str(dur), "-i", str(ROOT / src)]
        base = f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},{move},setsar=1,fps={FPS}"
    else:
        speed, start = opt.get("speed", 1.0), int(opt.get("start", 0) * FPS)
        src_in = ["-framerate", str(FPS), "-start_number", str(start), "-i", str(Path(frames) / fmt / src / "%05d.jpg")]
        base = (f"scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},"
                f"setpts=PTS/{speed},setsar=1,fps={FPS},trim=duration={dur}")
    if over.exists():
        run([FF, "-loglevel", "error", "-y", *src_in, "-i", str(over),
             "-filter_complex", f"[0:v]{base}[b];[b][1:v]overlay=0:0,trim=duration={dur}", "-t", str(dur), *enc])
    else:
        run([FF, "-loglevel", "error", "-y", *src_in, "-vf", base, "-t", str(dur), *enc])
    return out


def soundtrack(work, total):
    """Room tone plus a brass 'tink' at 0.2 s and at the last half second (the loop cue)."""
    tink = "sin(2*PI*2637*t)*exp(-9*t)*0.35+sin(2*PI*3951*t)*exp(-14*t)*0.18+sin(2*PI*5274*t)*exp(-22*t)*0.08"
    out = work / "audio.m4a"
    run([FF, "-loglevel", "error", "-y",
         "-f", "lavfi", "-i", f"anoisesrc=color=brown:amplitude=0.012:duration={total}",
         "-f", "lavfi", "-i", f"aevalsrc='{tink}':s=48000:d=1.2",
         "-filter_complex",
         f"[1:a]asplit=2[t1][t2];[t1]adelay=200|200[a1];[t2]adelay={int((total - 0.6) * 1000)}|{int((total - 0.6) * 1000)}[a2];"
         f"[0:a]lowpass=f=400[bed];[bed][a1][a2]amix=inputs=3:normalize=0,atrim=duration={total}[a]",
         "-map", "[a]", "-c:a", "aac", "-b:a", "160k", str(out)])
    return out


def build(name, fmt, frames):
    _, _, tag = SIZES[fmt]
    edit = EDITS[name]
    total = sum(d for _, _, d, _ in edit)
    with tempfile.TemporaryDirectory() as t:
        work = Path(t)
        render_overlays(fmt, work, edit)
        parts = [segment(i, item, fmt, frames, work) for i, item in enumerate(edit)]
        (work / "list.txt").write_text("".join(f"file '{p}'\n" for p in parts))
        audio = soundtrack(work, total)
        OUT.mkdir(parents=True, exist_ok=True)
        dest = OUT / f"{name}-{tag}.mp4"
        run([FF, "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(work / "list.txt"), "-i", str(audio),
             "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-crf", "19", "-preset", "slow", "-pix_fmt", "yuv420p",
             "-c:a", "copy", "-shortest", "-movflags", "+faststart", str(dest)])
    print(f"{dest.relative_to(ROOT)}  {total:.1f} s")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    which = sys.argv[2] if len(sys.argv) > 2 else "both"
    names = sys.argv[3:] or list(EDITS)
    for n in names:
        for f in (["portrait", "landscape"] if which == "both" else [which]):
            build(n, f, sys.argv[1])
