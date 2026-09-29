# Runway renders

All generated in Runway on Sept 29, 2026 (workspace "Oscar"). About 1,020 of 1,114 credits used; 94 left.
Three stills are in this folder already. The rest are in your Runway account under **Assets**. This
environment couldn't download them (its network policy blocks Runway's CDN), so run:

```bash
bash own-a-car/tools/fetch_assets.sh      # works until the signed links expire (~Sept 30 – Oct 1)
```

After that date: download from app.runwayml.com → Assets, save into `own-a-car/assets/raw/` with the names below,
then `SKIP_DOWNLOAD=1 bash own-a-car/tools/fetch_assets.sh`.

| File | Status | Runway task | Used on | Prompt (short) |
|---|---|---|---|---|
| `car.jpg` | ✅ in repo | 246457ef-0b6e-415f-8abf-ca7a35bbd5a5 | Hero poster, X launch | White mid-2000s wedge supercar, black concrete studio, single spotlight |
| `key.jpg` | ✅ in repo | a219748a-6b90-441c-b3af-bac795a5af65 | Step 01, X product posts | Brass sculptural key engraved "Nº 0042" on black velvet |
| `box.jpg` | ✅ in repo | 1f14528a-789e-4c8b-aa96-c7e482c357b6 | "What arrives", X | Open black rigid box, gold-foil OWN A CAR lid, key in velvet |
| `names.jpg` | ⬇ fetch | 329a424f-f565-4597-9dce-eaca4b7f480b | "Every owner's name", X | Car wrapped in thousands of tiny white names |
| `crowd.jpg` | ⬇ fetch | a0c3b9ac-96f1-4d07-a2ee-ed1717c56d7d | Step 02, X launch thread | Crowd in a garage holding identical brass keys around the car |
| `door.jpg` | ⬇ fetch | 663d5bcb-fd63-4897-a0b1-6b5217773605 | Step 03, X | Black box with gold tape on a doorstep |
| `meme.jpg` | ⬇ fetch | 0ec76528-9716-4f5d-8663-c69eaf7086dd | X meme posts | Person in a hoodie holding up a brass key next to the car, flash |
| `warehouse.jpg` | ⬇ fetch | 8d9af50f-746a-42f9-b365-1ddd8e195db7 | X "shipping day" | Thousands of black boxes on a warehouse floor |
| `tour.jpg` | ⬇ fetch | ad0221ce-a816-4345-b7b4-cd95962cf521 | X stretch goals / owners' tour | Car on a flatbed through a small town, people filming |
| `hero.mp4` | ⬇ fetch | e5f6e430-55f9-4de0-978e-bc9ee74dbb5b | Site hero loop, X launch video | 8 s, spotlight flickers on, dolly toward the car (has audio) |
| `key.mp4` | ⬇ fetch | 83343b32-2e08-4c4d-bed6-33d48e08d03a | X product loop | 5 s, light sweeps across the key |
| `unbox.mp4` | ⬇ fetch | 182b1b56-60cc-4372-b327-e6088eb20e83 | Site "What arrives", X "what $50 gets you" | 8 s, hands lift the lid, pick up the key |

Every page slot falls back to the brass key mark until its file exists, so the site never shows a broken image.

## Notes on the renders
- The car renders read clearly as a Gallardo. No crest is visible, but **check wheel centers and
  the nose at full size before posting** and retouch anything badge-like (brand rule: no manufacturer marks).
- The key in `box.jpg` is a skeleton-key style, while `key.jpg` is a house-key style. Pick one design for the real
  cast (recommendation: the `key.jpg` shape, a thick ring bow with the number engraved on the bow) and re-render the other.
- These are AI concept renders. When they're used in marketing before the real key and box exist, label them
  "concept render" (X's rules on synthetic media, and plain honesty with buyers).

## Next renders (when credits are topped up; stills ~20 credits, 1080p video ~40 credits/s)
1. Re-render `box.jpg` with the `key.jpg` key design (reference-image edit, ~20 credits).
2. A 9:16 vertical cut of `hero.mp4` for X/TikTok/Reels.
3. "The name wrap" close-up: macro of tiny names on white paint, one name in brass.
