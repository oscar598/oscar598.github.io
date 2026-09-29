# Auto-posting

Every post lives in `queue.json`. Nothing posts unless its `status` is `approved` and its time has passed.
Replies and quote-posts wait for the post they point at. `{keys}`, `{grams}`, `{thing}`, `{days_left}` and `{link}`
fill in from the live registry at the moment of posting, so counter posts are always true.

```bash
python3 own-a-car/tools/xpost.py list     # everything, with status and time
python3 own-a-car/tools/xpost.py check    # lint: length, missing media, banned words, broken threads
python3 own-a-car/tools/xpost.py due      # dry run: what would post right now
python3 own-a-car/tools/xpost.py post --live
```

## Route A: X API (fully automatic)

1. developer.x.com → create a Project + App (free tier allows posting; check the current monthly write limit).
2. App settings → User authentication → **Read and write**, OAuth 1.0a.
3. For **each** account (@ownacar and Oscar's): log in as that account and generate its Access Token + Secret.
4. Save as GitHub Actions secrets (repo Settings → Secrets):
   `X_OWNACAR_API_KEY`, `X_OWNACAR_API_SECRET`, `X_OWNACAR_ACCESS_TOKEN`, `X_OWNACAR_ACCESS_SECRET`,
   and the same four with `X_OSCAR_…`.
5. That's it: `.github/workflows/own-a-car-xpost.yml` runs every 10 minutes (from `main`), posts whatever is approved
   and due, and commits `queue.json` back so posted IDs are recorded and threads chain. It skips itself until the
   secrets exist.

The media upload uses X's 2025 v2 endpoints and hasn't been run against a live account yet. Do the first
real run by hand (`--id T1`) and watch it.

## Route B: the Claude desktop app's built-in browser

The desktop app's browser can post as you with no API keys, using your logged-in X session. It isn't
available in this cloud session. From a desktop-app session, ask: "post the due entries from
own-a-car/marketing/x/queue.json with the browser", and it will open x.com, compose each due post with its media,
and mark it posted in the queue. That's a good fit for polls (the API needs extra setup for those) and for
anything you want to eyeball before it goes.

## Rules the queue enforces

- Never posts drafts. You approve by editing the status, one post at a time or a whole block.
- Blocks the words that turn art into a securities or lottery problem: invest, returns, profit, stake,
  shares in, dividend, win, lucky, raffle, giveaway.
- Puts links in the last post of a thread, never in the main post.
