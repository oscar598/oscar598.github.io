# OWN A CAR

Art project by Oscar Lu. **$50 buys a key to a Lamborghini. There's no limit on keys. Everyone who holds one owns it.**
Your key is mailed to your door; your name goes on the car. All or nothing: if 6,000 keys don't sell, everyone is refunded.

**Start here:** `OPEN_QUESTIONS.md` (every guess I made + what I need from you) → `PLAYBOOK.md` (plan, money, timeline) → `OPERATIONS.md` (how to run it).

Live at `/own-a-car/` once this branch is merged. Preview locally:
```bash
python3 -m http.server 8080   # from the repo root, then open http://localhost:8080/own-a-car/
```

## Map

| Path | What |
|---|---|
| `config.json` | **The one file to edit.** Car, price, goal, stretch goals, dates, Stripe links, Discord, handles |
| `index.html` · `main.js` · `own.js` · `style.css` | The site: Key Rain hero, counter strip, The Shatter share calculator, the Name Wrap, how it works, goal, open books, the key, owners' wall, FAQ |
| `physics/` | The three physics pieces, plain JS with no libraries: `keyrain.js` (hero: a pile of brass keys, one per key sold, grab and throw), `shatter.js` (Your share: the car breaks into one shard per key), `names.js` (the car wrapped in every owner's name at true scale, with a loupe) |
| `key.html` · `key.js` | A buyer's private tracking page (`?o=`), a public certificate (`?n=42`) and lookup |
| `terms.html` · `privacy.html` | Drafts for attorney review |
| `data/registry.json` | Public order registry (key numbers, wall names). Written by the sync |
| `data/status.json` | Project phase + per-order shipping status + hidden names. Written by `ops.py` |
| `tools/ops.py` | Stripe setup, sync, refunds, auto-close, exports, certificates, labels, emails, status |
| `tools/test_ops.py` | End-to-end test against a fake Stripe |
| `tools/render.js` · `wordmark.py` · `packaging.py` | Rebuild PNG cards, logos and print files |
| `tools/fetch_assets.sh` | Pulls the Runway renders into `assets/` |
| `../.github/workflows/own-a-car-sync.yml` | Syncs Stripe → registry every 15 min |
| `brand/` | Logos, key mark, favicon, OG, X avatar and header, `BRAND.md`, visual guide (`brand/index.html`) |
| `assets/` | Runway renders + `RUNWAY.md` (task IDs, prompts, what's where) |
| `fonts/` | Self-hosted Fraunces, Inter, JetBrains Mono (OFL) |
| `marketing/x/` | X playbook, launch thread + post bank, 15 rendered post cards, tracker |
| `marketing/press/` | Press release, fact sheet, pitches |
| `marketing/email/` | Owner emails: welcome, milestone, funded, refund, shipped |
| `marketing/discord.md` | Owners' server blueprint |
| `packaging/` | Print-ready SVGs (lid, sleeve, seal, insert card), certificate template, spec + vendor quote request |
| `ops/private/` | Personal data exports. **Gitignored, never committed** |
