# Oscar Lu: "The Story So Far"

The homepage (`/`) is the physics + motion version: every chapter is a scene you can play with. Live at https://oscar598.github.io/
Both read the **same words** from `/js/data.js`, and both link to the same `/resume.html`.

Run it locally:

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080/ (add `?debug` to skip the intro countdown).

## The scenes

| # | Scene | What happens | File |
|---|---|---|---|
| 00 | Cold open | "OSCAR LU" drops in as physics letters; grab/throw them, hover for the acrostic, a basketball joins | `js/scenes/open.js` |
| 01 | Origin | Scrolling pours in the hustle: oranges, juice cups, eBay boxes, phones, coins | `js/scenes/origin.js` |
| 02 | Spark | 2,000 particles (one per community member) morph: scatter → "Ps" → @mpjgfx → 2,000 | `js/scenes/spark.js` |
| 03 | Cold email | Scroll types the email → Send → paper plane → Harvard replies → poster slams down → 4 years | `js/scenes/email.js` |
| 04 | "What are you doing about it?" | Calm on purpose: the question, 400 bedding sets lighting up, the numbers, the network to Dublin | `js/scenes/ukraine.js` |
| 05 | The Farm | Yearbook cards are physical; the lacrosse ball knocks them over; click to toss grad caps | `js/scenes/farm.js` |
| 06 | Tested | Scroll = the climb: 3 a.m. to sunrise, 10,152 → 14,000 ft, headlamp on the trail, shooting star | `js/scenes/tested.js` |
| 07 | Now | A working slip 'n slide: 200+ freshmen slide down and get counted; click to add your own | `js/scenes/now.js` |
| 08 | Next chapter | The visitor writes the cold email to Oscar; paper plane; opens their mail app | `js/scenes/next.js` |
| 09 | Credits | A short film-style roll, then replay, share and the hidden level | `js/scenes/credits.js` |

## Everything around the scenes

- **Rope timeline** (`core/rope.js`): a verlet-simulated string with a year tag; swings with scroll and your cursor.
- **Film strip** (`core/filmstrip.js`): chapter nav; clicking does a film *cut*, not a long scroll.
- **Film leader** (`core/leader.js`): 3·2·1 countdown, first visit per session only.
- **Director's commentary** (`core/commentary.js`): press **C**; sticky notes explain each design decision.
- **TL;DR** (`core/tldr.js`): press **T**; the 20-second version for recruiters, plus calm mode and a skip link.
- **Tab** (`core/tab.js`): favicon + title follow the chapter; leaving the tab says "come back, the letters miss you".
- **Sound** (`core/sound.js`): off by default; synthesized (no audio files).
- **Easter eggs** (`core/eggs.js`): ↑↑↓↓←→←→BA flips gravity, type "harvard", press G for zero-g.
- **Phones**: tilt your phone to tilt gravity (`core/tilt.js`); stages pin separately so nothing hides off-screen.
- **Reduced motion**: respected everywhere; also a "motion: calm" toggle in the header.

## Editing

- **Words** → `/js/data.js` (shared with the resume).
- **Scene-specific lines** (email text, credits, acrostic facts, director's notes) live at the top of each scene file.
- **Media** → `js/assets.js`. Real photos live in `assets/photos/`; the only AI placeholder left is the LA diorama. Put a file in `assets/` and set its path, e.g.
  `harvard: { img: "assets/harvard.jpg" }`. Video works too (`video: "assets/clip.mp4"`).
- **Physics sprites** for the Origin scene → `ASSETS.sprites` (transparent PNGs). Prompts ready in `assets/PROMPTS.md`.
- **Share card** → `assets/og.jpg`, rendered by `tools/og.html` (regenerate after changing the tagline).

## Getting AI placeholders from Runway

Runway isn't connected to this workspace yet. To connect it:
1. In the Claude desktop app: **Settings → Connectors → Add custom connector**, URL `https://mcp.runwayml.com/mcp`, then sign in to Runway.
2. Enable it for the session, then ask Claude to "generate the v2 placeholders from assets/PROMPTS.md".

## Deploying

Push to `main` and GitHub Pages redeploys in about a minute. Browsers cache files for ~10 minutes,
so when you change CSS or JS, bump the `?v=` value on the `<link>`/`<script>` tags in `index.html`
and `resume.html` (e.g. `?v=20260930b`) so visitors get the new files right away.

## Debugging

`?debug` adds two console helpers: `await __go("farm", 0.5)` jumps halfway through a scene, and `__stepAll(300)` advances every physics world (useful when the tab is in the background and animation frames are paused).
