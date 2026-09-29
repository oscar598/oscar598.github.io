# Own a Car

Art project. $50 buys a key. Unlimited keys. Every key holder owns the Lambo.

Live at `/own-a-car/` once merged.

## Brief (v0)
- $50 presale per key, no cap on keys
- Refund everyone if the presale goal isn't hit
- Checkout form: name, email, shipping address
- Buyers get invited to a Discord server
- Key ships in premium, branded packaging

## Files
| File | What |
|---|---|
| `index.html` / `style.css` / `main.js` | The page: hero, live key meter, how it works, statement, FAQ |
| `config.js` | **The only file you need to edit**: checkout URL, Discord invite, goal, deadline, ship date |
| `thanks.html` | Post-checkout page with the Discord button |
| `terms.html` | Draft terms of sale (needs a lawyer before launch) |
| `progress.json` | Key count shown on the meter (updated by the Stripe sync) |
| `tools/stripe_keys.py` | `count` → updates progress.json; `refund [--execute]` → refunds everyone if the goal is missed |
| `PLAYBOOK.md` | Everything from LLC to shipping, in order |
| `PACKAGING.md` | Box and key spec, costs, vendors |

## Status
Design phase. Nothing is live. The buy button stays disabled until `checkoutUrl` is set, and it shouldn't be
set until the legal steps in `PLAYBOOK.md` §1 are done.
