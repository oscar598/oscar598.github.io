#!/usr/bin/env python3
"""Cuts the founder video (Script C) from Oscar's takes, per marketing/video/founder.json.

  python3 own-a-car/tools/founder_video.py <frames> [landscape|portrait|both] [--raw DIR] [--out NAME]
    <frames>  the site recordings made for the launch video (record_clips.js, CLEAN=1)
    --raw     where the takes are (default marketing/video/raw/)
    → marketing/x/clips/founder-9x16.mp4 and founder-16x9.mp4

Each line: the take, trimmed to speech (silence at each end is cut automatically unless 'trim' is set),
cropped to the frame, with its caption burned in. A 'cutaway' swaps the picture for a site recording or a
still while the voice keeps playing. Ends on the OWN A CAR card. Reuses launch_video.py's cards, captions and footage.
"""
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import launch_video as LV

ROOT = LV.ROOT
PLAN = ROOT / "marketing" / "video" / "founder.json"
FF, FPS = LV.FF, LV.FPS
PAD = 0.12   # seconds of breath kept either side of speech
SCENE_START = {"rain": 1.4, "shatter": 1.0, "names": 0.6}


def speech_bounds(path):
    """First and last moment of speech: the edges of the first and last silence ffmpeg finds."""
    r = subprocess.run([FF, "-hide_banner", "-i", str(path), "-af", "silencedetect=noise=-35dB:d=0.25", "-f", "null", "-"],
                       capture_output=True, text=True)
    h, m, sec = re.search(r"Duration: (\d+):(\d+):([\d.]+)", r.stderr).groups()
    dur = int(h) * 3600 + int(m) * 60 + float(sec)
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", r.stderr)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r.stderr)]
    ends += [dur] * (len(starts) - len(ends))            # a silence running to the end may report no end
    spans = list(zip(starts, ends))
    first = spans[0][1] if spans and spans[0][0] < 0.05 else 0.0          # leading silence ends here
    last = spans[-1][0] if spans and spans[-1][1] > dur - 0.05 else dur    # trailing silence starts here
    return max(0.0, first - PAD), min(dur, last + PAD)


def build(fmt, frames, raw, name):
    w, h, tag = LV.SIZES[fmt]
    plan = json.loads(PLAN.read_text())
    with tempfile.TemporaryDirectory() as t:
        work = Path(t)
        # One edit list in launch_video's shape, so its caption renderer and footage cutter do the work.
        edit, spans = [], []
        for line in plan["lines"]:
            take = raw / line["take"]
            if not take.exists():  # iPhones record .mov: accept any extension with the same number
                found = sorted(raw.glob(Path(line["take"]).stem + ".*"))
                if not found:
                    sys.exit(f"missing take {line['take']} in {raw}")
                take = found[0]
            a, b = line.get("trim") or speech_bounds(take)
            spans.append((take, a, b - a))
            src = line.get("cutaway")
            kind = "head" if not src else ("still" if "/" in src else "clip")
            # Captions sit in the lower third, smaller, so they read over a face and wrap to at most ~3 lines.
            opt = {"text": line["caption"], "corner": line.get("corner"), "pan": "in", "pos": "low", "small": True}
            if kind == "clip":
                # Skip the recording's page-load second; the shatter sweep is sped up to fit the whole 1 → 100,000.
                opt.update(start=SCENE_START.get(src, 0), speed=max(1.0, 7.5 / (b - a)) if src == "shatter" else 1.0)
            edit.append((kind, src or str(take), b - a, opt))
        end = plan["end"]
        edit.append(("card", (end["kicker"], end["headline"]), end["seconds"], {"end": True}))
        LV.render_overlays(fmt, work, edit)

        parts = []
        for i, (kind, src, dur, opt) in enumerate(edit):
            out = work / f"f{i:02d}.mp4"
            aenc = ["-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "1"]
            venc = ["-c:v", "libx264", "-crf", "17", "-preset", "medium", "-pix_fmt", "yuv420p", "-r", str(FPS)]
            if kind == "head":
                take, a, d = spans[i]
                vf = f"scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},setsar=1,fps={FPS}"
                LV.run([FF, "-loglevel", "error", "-y", "-ss", f"{a:.3f}", "-t", f"{d:.3f}", "-i", str(take),
                        "-i", str(work / f"o{i}.png"), "-filter_complex", f"[0:v]{vf}[b];[b][1:v]overlay=0:0[v]",
                        "-map", "[v]", "-map", "0:a", *venc, *aenc, str(out)])
            elif kind == "card":
                silent = LV.segment(i, (kind, src, dur, opt), fmt, frames, work)
                LV.run([FF, "-loglevel", "error", "-y", "-i", str(silent), "-f", "lavfi", "-t", str(dur),
                        "-i", "anullsrc=r=48000:cl=mono", "-map", "0:v", "-map", "1:a", "-c:v", "copy", *aenc, "-shortest", str(out)])
            else:
                # Cutaway: footage (with the caption) under the take's own audio.
                take, a, d = spans[i]
                pic = LV.segment(i, (kind, src, dur, opt), fmt, frames, work)
                LV.run([FF, "-loglevel", "error", "-y", "-i", str(pic), "-ss", f"{a:.3f}", "-t", f"{d:.3f}", "-i", str(take),
                        "-map", "0:v", "-map", "1:a", "-c:v", "copy", *aenc, "-shortest", str(out)])
            parts.append(out)

        (work / "list.txt").write_text("".join(f"file '{p}'\n" for p in parts))
        LV.OUT.mkdir(parents=True, exist_ok=True)
        dest = LV.OUT / f"{name}-{tag}.mp4"
        LV.run([FF, "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(work / "list.txt"),
                "-c:v", "libx264", "-crf", "19", "-preset", "slow", "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-b:a", "160k", "-af", "loudnorm=I=-16:TP=-1.5", "-ar", "48000", "-movflags", "+faststart", str(dest)])
    total = sum(d for _, _, d, _ in edit)
    print(f"{dest.relative_to(ROOT)}  {total:.1f} s")


if __name__ == "__main__":
    args = sys.argv[1:]
    if not args:
        sys.exit(__doc__)
    raw = Path(args[args.index("--raw") + 1]) if "--raw" in args else ROOT / "marketing" / "video" / "raw"
    name = args[args.index("--out") + 1] if "--out" in args else "founder"
    which = args[1] if len(args) > 1 and not args[1].startswith("--") else "both"
    for f in (["portrait", "landscape"] if which == "both" else [which]):
        build(f, args[0], raw, name)
