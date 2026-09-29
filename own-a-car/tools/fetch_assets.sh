#!/usr/bin/env bash
# Downloads the Runway renders into own-a-car/assets/ and makes web-sized copies.
# Run on your own machine:  bash own-a-car/tools/fetch_assets.sh
#
# The links below are Runway's signed URLs and EXPIRE around Sept 30 – Oct 1, 2026. After that,
# download the same files from app.runwayml.com → Assets (task IDs in assets/RUNWAY.md) and save
# them under the names on the left, then run this script with SKIP_DOWNLOAD=1 to just resize.
# Needs: curl, ffmpeg, and ImageMagick (`magick`) or macOS `sips`.
set -euo pipefail
cd "$(dirname "$0")/../assets"
mkdir -p raw

ASSETS=$(cat <<'LIST'
names.png https://dnznrvs05pmza.cloudfront.net/gemini/gemini-3-pro-image/images/329a424f-f565-4597-9dce-eaca4b7f480b/8280d116-c95b-4056-a92a-6be4ee5fc7a5/A_low_sharp_edged_Italian_wedge_supercar_in_a_dark_studio__i.png?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiNTlhZjdjMzU4NGYxYmEyNiIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MDgyOTYyMX0.UTTPHUjKFIrtKsupMSwY9afGT5DPv7bRzGt49GAfXLw
crowd.png https://dnznrvs05pmza.cloudfront.net/gemini/gemini-3-pro-image/images/a0c3b9ac-96f1-4d07-a2ee-ed1717c56d7d/03ae4670-0f8c-4960-a8f2-69de51b52850/Wide_photograph_in_a_dim_underground_parking_garage__a_crowd.png?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiMmYyNmFkOTExNzFhYzVhNyIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MDc5ODM1M30.jSar518FcgO3sddk4irGoy1V3_MWEE1xPNrWRNHhP6c
door.png https://dnznrvs05pmza.cloudfront.net/gemini/gemini-3-pro-image/images/663d5bcb-fd63-4897-a0b1-6b5217773605/a4511b63-9009-4171-a014-df6175675acf/A_small_matte_black_shipping_box_sitting_on_a_front_doorstep.png?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiYmNmZWJkYTBjNTk0MDA1NyIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MDgzMDQ5Nn0.CMKYAcMbp1cs-OLTB7w5Jp-Sfzn3Xoopssh-wA6fSVY
meme.png https://dnznrvs05pmza.cloudfront.net/gemini/gemini-3-pro-image/images/0ec76528-9716-4f5d-8663-c69eaf7086dd/0d3a5169-b7b9-49ac-8643-4b6013878344/Candid_phone_photo_at_night_in_a_parking_garage__a_smiling_y.png?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiZmU1MzFkZjkyZjNiZTA2ZCIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MDgwODgyNX0.kTqFUCbp43e11AUXMviG9RtW4CMhyyirH7B5R9FUDAY
warehouse.png https://dnznrvs05pmza.cloudfront.net/gemini/gemini-3-pro-image/images/8d9af50f-746a-42f9-b365-1ddd8e195db7/34cb88a3-6a98-47b6-a267-3df46192ac30/Overhead_photograph_of_a_warehouse_floor_covered_by_thousand.png?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiNmVjYmU2MjRkNGU2ZDNiNyIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MDg1OTY4NH0.pOgfAW8-VAwJqK11PCtbo9lHrBLBPmUVED0YGVmESuk
tour.png https://dnznrvs05pmza.cloudfront.net/gemini/gemini-3-pro-image/images/ad0221ce-a816-4345-b7b4-cd95962cf521/735aae36-a3b8-4cd0-8d2f-44126b8d66fe/A_white_wedge_shaped_Italian_supercar_strapped_onto_an_open_.png?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiOTYzNGRmYjVhYTIzNTllNyIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MDgzMTU0MX0.r2VEX7wkEUjzMSFLwljLWHePP3QvemuIaJ5XRlRm_zI
hero.mp4 https://dnznrvs05pmza.cloudfront.net/seedance_2/cgt-20260929232758-xgdfz/The_overhead_spotlight_flickers_on_with_a_soft_buzz__haze_drifts_through_the_light_beam__the_camera_.mp4?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiZWZlODMwYzBlOGI2NDVhNyIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MDg0MDI1Nn0.Q2g_OFwhR8ryG8Jt5rcEWDAiDkaxXoErc-6CZiBS-Vc
key.mp4 https://dnznrvs05pmza.cloudfront.net/seedance_2/cgt-20260929232806-24rqg/Extreme_close_up_macro__a_slow_sweep_of_warm_light_glides_across_the_brass_key_on_black_velvet__the_.mp4?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiZjMzOTA4M2NhOTNjMWVmOCIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MDgyODM0OH0.UCGgpfZOgnrGNbrmo2Fzdq5Pk_0zEBWs3nQBLK7SxA4
unbox.mp4 https://dnznrvs05pmza.cloudfront.net/seedance_2/cgt-20260929232813-8x6q6/Two_hands_enter_the_frame_and_slowly_lift_the_matte_black_lid__revealing_the_brass_key_resting_in_ve.mp4?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiZjdlYjBlNTE2YTYxZTZkMyIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MDgwNzM3N30.fzMDPn8qfsX_LYPzZ1jBAkxNrzwe2mgPM70BzD4hrkE
LIST
)

if [ -z "${SKIP_DOWNLOAD:-}" ]; then
  echo "$ASSETS" | while read -r f url; do
    echo "↓ $f"; curl -fsSL "$url" -o "raw/$f" || echo "  ✗ $f (link expired? download it from Runway → Assets)"
  done
fi

resize() {  # resize <in> <out.jpg> <max px>
  if command -v magick >/dev/null; then magick "$1" -resize "$3x$3>" -quality 82 -interlace Plane "$2"
  else sips -s format jpeg -s formatOptions 82 -Z "$3" "$1" --out "$2" >/dev/null; fi
}
for f in names crowd door meme warehouse tour; do
  [ -f "raw/$f.png" ] && resize "raw/$f.png" "$f.jpg" 1920 && echo "✓ $f.jpg"
done

# Web video: the site's copies are muted, H.264, ~1–3 MB. The raw files (with audio) are for X.
for f in hero key unbox; do
  [ -f "raw/$f.mp4" ] || continue
  ffmpeg -loglevel error -y -i "raw/$f.mp4" -an -c:v libx264 -crf 27 -preset slow -pix_fmt yuv420p -movflags +faststart -vf "scale='min(1600,iw)':-2" "$f.mp4"
  echo "✓ $f.mp4"
done
echo "Done. raw/ holds the full-quality originals for X: don't commit it (it's gitignored)."
