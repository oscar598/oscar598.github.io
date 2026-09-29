# OWN A CAR · master plan

**Thesis:** a viral art project. $50 buys a key to a Lamborghini, the key is mailed to your door, and every buyer is an owner.
**Status:** every draft is built. Nothing takes money until the steps marked **[you]** in Phase 0 are done.

What's where: `README.md`. Every guess I made and every question for you: `OPEN_QUESTIONS.md`.

---

## The money

### Per $50 key (`config.json → perKeyBreakdownUsd`, shown on the site as "Open books")
| | $ |
|---|---|
| Card processing (2.9% + 30¢) | 1.75 |
| Key, box, certificate | 13.00 |
| Shipping (US) | 6.00 |
| Tax reserve (~30% of the margin; confirm with the CPA) | 8.80 |
| **Car fund** | **20.45** |

International buyers pay +$15 shipping, and sales tax is collected on top of the $50, so neither eats the margin.

### At the 6,000-key goal
| | $ |
|---|---|
| Gross | 300,000 |
| Fees + keys + shipping | −124,500 |
| Tax reserve | −52,800 |
| **Car fund** | **122,700** |
| Gallardo 2006–08, ~40k miles | ~95,000 |
| Sales tax, title, registration (~8%) | ~7,600 |
| Pre-purchase inspection + transport | ~2,500 |
| Name wrap (design + print + install) | ~5,000 |
| Year-1 insurance + storage | ~11,000 |
| **Car all-in** | **~121,100** |
| Contingency | ~1,600 |

It's tight on purpose: the goal is the minimum that works. Every key past 6,000 adds $20.45 to the car fund.
Stretch goals: **14,000 keys → Huracán** (car fund ~$286k vs ~$250k all-in) · **24,000 → Aventador** (~$490k vs ~$450k all-in).

### Before the presale (out of pocket)
| | $ |
|---|---|
| LLC filing + registered agent | 100–500 |
| Attorney (flat-fee review of structure, terms, marketing claims) | 1,000–3,000 |
| CPA consult | 200–500 |
| Key, box and certificate samples (2 vendors each) | 500–1,200 |
| Domain + email | 30 |
| X Premium (2 accounts, 3 months) | ~50 |
| Runway top-up for final renders | 15–35 |
| Optional launch promotion on X | 300–500 |
| **Total** | **≈ $2,200–5,800** |

Plus the risk budget: if the goal is missed, refunds cost the unrecoverable card fees, ~$1.75 × orders (~$3,500 at 2,000 orders).

---

## Timeline

| Dates | Phase | [you] | [auto] / built |
|---|---|---|---|
| **Sep 29 – Oct 10** | **0 · Legal and money** | Form the LLC, EIN, bank. Book the attorney and CPA (bring `terms.html`, `privacy.html`, `OPEN_QUESTIONS.md` § Legal). Apply for Stripe. Order key and box samples (`packaging/README.md`) | Site, systems, brand, posts: done |
| **Oct 11 – Oct 25** | **1 · Make it real** | Buy the domain. Claim @ownacar. Build the Discord (`marketing/discord.md`). Run `fetch_assets.sh`. Photograph the samples | `ops.py setup-stripe` in test mode, end-to-end test purchase |
| **Oct 26 – Nov 8** | **2 · Tease** | Post the pre-launch posts (`marketing/x/posts.md`). DM 40–60 people (`marketing/x/PLAYBOOK.md` § 7) | Counter at 0; site in "opens Nov 9" mode |
| **Nov 9, 12 pm ET** | **3 · Launch** | The launch-day hour-by-hour | Buy buttons switch on by themselves at `presaleOpens` |
| **Nov 9 – Dec 9** | **4 · Presale** | 45 min/day: posts, replies, wall moderation, welcome emails | Registry sync every 15 min |
| **Dec 9, 11:59 pm ET** | **5 · Close** | Funded → `phase funded`. Missed → `refund --execute` | Payment Links close by themselves |
| **Dec 10 – Jan 15** | **6 · The car** | Payout settles (watch for a Stripe reserve). Shortlist 3 cars, owners vote in Discord, inspection, buy, scan the key | — |
| **Jan 15 – Mar 1** | **7 · Production** | Cast keys (4–6 weeks), print the wrap with every name, wrap the car, print certificates | `export`, `certificates` |
| **Mar 1 – Apr 30** | **8 · Ship** | Pack and ship in batches; film it | `labels`, `mark shipped`, `emails shipped` |
| **May 2027 →** | **9 · The life of the car** | Owners' days, the tour, the documentary | — |

---

## Who does what

**Automated / built (done):**
- Site with live counter, share calculator, name-size calculator, stretch goals, open books, owners' wall
- Checkout (Stripe Payment Links: name, email, shipping address, tax, wall name, terms consent) created by one command
- Order registry, private tracking links, public certificates, the "Post it on X" share
- All-or-nothing: auto-close at the deadline, one-command full refunds
- Fulfilment exports: engraving list, printable certificates, Pirate Ship labels, email mail-merge
- Brand system, logos, OG and X images, 15 X post cards, launch thread and post bank, press kit, Discord blueprint, packaging print files

**Needs you (can't be automated):** signing things (LLC, Stripe, attorney), your face and voice on X, choosing and paying
for the car, approving samples, packing boxes (or paying a fulfilment house above ~2,000 orders).

**Can be automated next** (ask me):
- Dealer search: a weekly shortlist of Gallardos (price, miles, history, location) + outreach drafts in Gmail
- Welcome emails sent automatically (a Resend or Loops API key + an Action), not by CSV
- Discord owner verification bot (hashes the private link, matches the registry)
- Drafting and scheduling X posts from `posts.md` with the counter numbers filled in
