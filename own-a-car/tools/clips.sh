#!/usr/bin/env bash
# Records and encodes the X clips: marketing/x/clips/{shatter,rain}.mp4 (1280x720, H.264, 2 s end card).
# Needs: Playwright (npm i -g playwright), pip install imageio-ffmpeg, and the site served with demo data
# (the counter must be above 0 or the pile is just key Nº 0001) at $SITE.
set -euo pipefail
cd "$(dirname "$0")/.."
work=$(mktemp -d)
( cd "$work" && NODE_PATH="${NODE_PATH:-$(npm root -g)}" node "$OLDPWD/tools/record_clips.js" )
FF=$(python3 -c "import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())")
mkdir -p marketing/x/clips
for n in shatter rain; do
  "$FF" -loglevel error -y -framerate 30 -i "$work/$n/%05d.jpg" -loop 1 -t 2 -i brand/og.png \
    -filter_complex "[0:v]scale=1280:720,setsar=1,format=yuv420p[a];[1:v]scale=1280:-2,pad=1280:720:0:(oh-ih)/2:color=0x0a0a0a,setsar=1,fps=30,format=yuv420p[b];[a][b]concat=n=2:v=1[v]" \
    -map "[v]" -c:v libx264 -crf 20 -preset slow -movflags +faststart -pix_fmt yuv420p "marketing/x/clips/$n.mp4"
  echo "marketing/x/clips/$n.mp4"
done
rm -rf "$work"
