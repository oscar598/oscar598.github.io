#!/usr/bin/env bash
# Renders every card in cards.html to cards/<id>.png (1200×1200). Needs Playwright (npm i -g playwright).
set -euo pipefail
cd "$(dirname "$0")"
export NODE_PATH="${NODE_PATH:-$(npm root -g)}"
mkdir -p cards
for id in launch shrink math count-100 count-1000 count-2500 count-5000 count-6000 names refund certificate deadline notinvest statement nostart; do
  node ../../tools/render.js "cards.html#$id" "cards/$id.png" 1300 1300 >/dev/null && echo "cards/$id.png"
done
