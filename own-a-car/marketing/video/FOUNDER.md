# Founder video: shoot sheet

Script C from `../research/launch-video-frameworks.md`. ~40 s, you to camera, deadpan. Post it on day 2 (or after the first
milestone) to answer "why?". Teleprompter: open `teleprompter.html` on a laptop behind the phone (space = play/pause,
↑/↓ = speed, R = restart, M = mirror for a glass prompter).

## Set (20 minutes)
- **Background:** seamless black (black sheet, or a dark room with the wall 2 m behind you, unlit).
- **Light:** one hard light 45° to one side, at head height. A desk lamp with the shade off works. Nothing else on.
- **Camera:** phone on a tripod at eye level, **vertical 4K**, locked exposure and focus (long-press on your face).
  Leave headroom so a 16:9 crop from the same take is possible.
- **Wardrobe:** black. **Prop:** one brass key (or the best stand-in you have) in frame from the first frame.
- **Audio:** phone close (≤ 1 m) or a lav. Record **30 s of silent room tone** at the end.

## Delivery
- One sentence per take. Look into the lens, not at the screen. Slightly slower than normal. No smiling.
- Do each line three times, then move on. Jump cuts between sentences are the style. Don't hide them.
- Shoot all three opening hooks (below). They get posted on different days.

## Lines (in order, one take each)

| # | Line | Cutaway in the edit |
|---|---|---|
| 1 | I'm selling one Lamborghini to as many people as want it. | (on you, key up in frame) |
| 2 | It's fifty dollars. You get a key. | key macro |
| 3 | There's no limit. If a hundred thousand people buy one, a hundred thousand people own it. | (on you) |
| 4 | Every new owner makes the car more owned, and every owner less of an owner. | The Shatter, 1 → 100,000 |
| 5 | You can't drive it. The key doesn't start it. | (on you, tighter) |
| 6 | Your name goes on the car. At six thousand owners, it's about eighteen millimetres tall. | the Name Wrap loupe |
| 7 | It isn't an investment. It's worse. It's art. | (on you). *Counsel may cut this line; shoot it anyway.* |
| 8 | I wanted to know what ownership means when everybody has it. | crowd still |
| 9 | If six thousand people don't buy a key by December ninth, everyone gets their money back, and the car stays a picture. | (on you) |
| 10 | Right now it's a render. | car render, CONCEPT RENDER label |

**Alternative openings** (replace line 1):
- A. "This key doesn't start anything. It costs fifty dollars."
- B. "How many people can own one car? I'm going to find out."

## After the shoot
1. Pick your best take of each line and save it as `own-a-car/marketing/video/raw/01.mp4` … `10.mp4`
   (gitignored; any phone format works).
2. Optional: edit `founder.json`. Change a caption, set `"trim": [in, out]` on a line whose automatic trim is off,
   or delete lines 7–8 for the 30 s cut.
3. Run it (needs the site recordings from the launch video, see `tools/launch_video.py`):
   ```bash
   python3 own-a-car/tools/founder_video.py <frames> both
   ```
   → `marketing/x/clips/founder-9x16.mp4` and `founder-16x9.mp4`. Silence at both ends of each take is cut
   automatically, with a breath kept. Captions are burned in, cutaways keep your voice underneath, and the audio
   is levelled to −16 LUFS.
