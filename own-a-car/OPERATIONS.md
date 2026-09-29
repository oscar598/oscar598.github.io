# Operations runbook

How the in-house system works and exactly what to run, from setup to the last key shipped.
Every command is `python3 own-a-car/tools/ops.py <command>` from the repo root. Plain Python 3, no installs.

## How it fits together

```
 buyer ──► Stripe Payment Link (name, email, address, $50, tax, optional wall name)
              │  redirect: key.html?o=<checkout session id>   ← the buyer's private tracking link
              ▼
          Stripe ◄──── ops.py sync (GitHub Action, every 15 min)
                          │ writes data/registry.json: key numbers, wall names, dates. No personal data.
                          ▼
     site: counter · share calculator · owners' wall · key pages   (static, GitHub Pages)
                          ▲
          data/status.json ◄── ops.py phase / mark / hide   (you, from your laptop)

 personal data (addresses, emails) exists only in Stripe and in ops/private/ on your laptop (gitignored)
```

- **Key numbers** are assigned once, in payment order, and never change, even if an earlier buyer refunds.
- **Private tracking link:** Stripe sends buyers to `key.html?o=cs_…`. The page hashes that ID in the browser and finds its
  order in the public registry by hash, so nobody can look up anyone else's order and no personal data is ever published.
- **Public link:** `key.html?n=42` shows key 42's certificate and the project phase. That's what the "Post it on X" button shares.

## One-time setup (≈1 hour, after the LLC and bank account exist)

1. **Stripe account** in the LLC's name. In the application, describe the business honestly: "Presale of a numbered art object
   (brass key + certificate) shipping March 2027; all-or-nothing, full refunds if the goal isn't met." Presales with long ship dates
   can trigger a **reserve** (Stripe holding part of the money until delivery), so ask about this up front and plan cash flow around it.
2. **Stripe settings:**
   - Settings → Public details: statement descriptor `OWNACAR KEY`, support email, and the terms URL (`…/own-a-car/terms.html`),
     which the Payment Link's required terms checkbox needs
   - Settings → Customer emails: turn on **Successful payments** and **Refunds**
   - Tax: add the LLC's address and turn on **Stripe Tax**, then register in your home state (Stripe tells you when other states need registering)
   - Radar: turn on the default rules; add "block if CVC fails"
3. **Create the Payment Links** (test mode first):
   ```bash
   STRIPE_SECRET_KEY=sk_test_… python3 own-a-car/tools/ops.py setup-stripe
   ```
   This writes both links into `config.json`. Buy a test key with card `4242 4242 4242 4242`, check the redirect lands on your key page,
   then clear the `stripe` block in `config.json` and repeat with `sk_live_…`. Commit `config.json`: the Buy buttons switch on
   automatically when `presaleOpens` arrives.
4. **Restricted key for the robot:** Stripe → Developers → API keys → Create restricted key with:
   Checkout Sessions **Read**, Payment Intents **Read**, Charges **Read**, Payment Links **Write** (so it can close them at the deadline).
   Save it as the GitHub secret `STRIPE_SECRET_KEY` (repo Settings → Secrets and variables → Actions).
5. **Merge `own-a-car` into `main`**, because GitHub Pages and scheduled Actions only run from the default branch. Then run the
   action once by hand (Actions → own-a-car sync → Run workflow) and check `data/registry.json` updates.
6. **Discord:** build it from `marketing/discord.md`, and put the invite in `config.json → discordUrl`.
7. Set `contactEmail`, and fill every `[bracket]` in `terms.html` and `privacy.html` after the attorney review.

## During the presale

| When | Do |
|---|---|
| Automatically, every 15 min | The Action syncs the registry. The counter, wall and key pages update |
| Daily | Glance at Stripe → Payments for disputes or Radar blocks. Moderate the wall: `ops.py hide 1234` for anything offensive |
| Daily (evening) | Welcome email: `ops.py emails welcome` → import the CSV into your email tool → send to that day's buyers |
| At 25/50/75% | `ops.py emails milestone` |
| If someone asks to cancel | Refund that payment in the Stripe dashboard. The next sync marks it refunded; its key numbers are retired, not reused |

## At the deadline

The Action closes both Payment Links automatically on the first sync after `presaleCloses`. Then:

**Goal reached**
```bash
python3 own-a-car/tools/ops.py phase funded      # every key page shows "Goal reached"
git commit -am "own-a-car: funded" && git push
python3 own-a-car/tools/ops.py emails funded
```

**Goal missed**
```bash
python3 own-a-car/tools/ops.py phase refunding
STRIPE_SECRET_KEY=sk_live_… python3 own-a-car/tools/ops.py refund             # dry run: read the list and the total
STRIPE_SECRET_KEY=sk_live_… python3 own-a-car/tools/ops.py refund --execute   # refunds every order in full; safe to re-run
python3 own-a-car/tools/ops.py emails refund
```
Refunds need Refunds **Write** permission, so use your full secret key locally, never the robot's.
**Card fees are not returned by Stripe on refunds**, so a missed goal costs about $1.75 × orders. Budget for it (see `PLAYBOOK.md`).

## Fulfilment

```bash
python3 own-a-car/tools/ops.py phase car          # after buying the car
python3 own-a-car/tools/ops.py phase casting      # keys in production
python3 own-a-car/tools/ops.py export             # ops/private/orders.csv: key numbers → engraving list for the foundry
python3 own-a-car/tools/ops.py certificates       # ops/private/certificates.html → print to PDF (5×7 in, no margins)
python3 own-a-car/tools/ops.py labels             # ops/private/pirateship.csv → Pirate Ship → Import spreadsheet
python3 own-a-car/tools/ops.py phase shipping
python3 own-a-car/tools/ops.py mark packed 1-500  # as batches get packed
python3 own-a-car/tools/ops.py mark shipped 1-500 # after the labels are scanned
python3 own-a-car/tools/ops.py emails shipped
git add own-a-car/data && git commit -m "own-a-car: batch 1 shipped" && git push
```
Tracking numbers stay in Pirate Ship (it emails buyers tracking itself if you include the email column). The key page only shows the status.

## If something goes wrong

| Problem | Fix |
|---|---|
| A buyer's key page says "being assigned" for over an hour | Actions tab → check the last `own-a-car sync` run. A red run usually means the secret expired or lacks a permission |
| A chargeback | Respond in Stripe with the order, terms, delivery status and the key page. Disputes before shipping are hard to win, so refunding may be cheaper |
| Offensive wall name | `ops.py hide <key number>`, then commit. It stays hidden through future syncs |
| Wrong phase shown | `ops.py phase <correct phase>`, then commit |
| Need to reprint one certificate | Run `export` and `certificates`, open the HTML and print just that page |
| Lost laptop | Nothing personal is in the repo. Rotate the Stripe keys; `ops/private/` can be regenerated from Stripe anytime |

## Tests
```bash
python3 own-a-car/tools/test_ops.py   # full run against a fake Stripe: numbering, refunds, privacy, hiding, exports, auto-close
```
