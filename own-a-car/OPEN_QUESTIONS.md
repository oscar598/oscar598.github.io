# Decisions, questions and concerns

You asked me to guess everything and list it. The guesses are below, each with where to change it. Most are one field in `config.json`.

---

## ⚠️ The big one: "part ownership"

Your thesis says **$50 gets you part ownership in a Lambo.** I built it as **symbolic ownership**, deliberately:

- Selling real fractional ownership of an asset to thousands of people, with the promoter managing it, is very close to the
  legal definition of a **security** (the Howey test). Unregistered securities offerings are a federal problem, and "unlimited" makes it worse.
- A DMV title can't hold 6,000 names anyway.

**What owners get instead, and what the site says:** a numbered brass key, a signed certificate of ownership, **their name printed
on the car**, their certificate page, the owners' Discord and votes on the car's life. The FAQ says plainly that legal title stays with the
project and that there's no profit, resale or driving. Every marketing line says "own" in the artwork's sense, and the fine print is consistent.

**Why this still delivers the thesis:** "own a Lambo" works as the hook, and the name wrap makes the ownership visible and
real enough to post about. **Ask the attorney:** "Given this structure and marketing, is there any securities, lottery or consumer-deception risk
in saying 'you own a car'?" If the answer is to soften it, the change is copy only: `index.html` hero and FAQ, and `posts.md`.

---

## Decisions I made for you

| # | Decision | My guess | Why | Change it in |
|---|---|---|---|---|
| 1 | Ownership model | Symbolic (see above) | Securities and lottery law | Copy + terms |
| 2 | Brand name | **OWN A CAR** (Lamborghini only in copy) | Deadpan joke, clean trademark position, already in the repo | `brand/`, everywhere |
| 3 | The car | Used **Gallardo 2006–08**, ~$95k | Cheapest real Lamborghini, and the V10 wedge shape reads instantly | `config.json → car` |
| 4 | Goal | **6,000 keys** ($300k gross) | The smallest number that buys the car after keys, fees, shipping and tax (see `PLAYBOOK.md` § money) | `goalKeys`, `stretchGoals` |
| 5 | Stretch goals | Huracán at 14,000, Aventador at 24,000 | Gives momentum after the goal; the math covers both | `stretchGoals` |
| 6 | Presale window | **Nov 9 – Dec 9, 2026** (30 days, Monday launch, noon ET) | ~6 weeks for legal and samples first; 30 days keeps urgency | `presaleOpens`, `presaleCloses` |
| 7 | Ship window | **March–April 2027** | Car purchase + scan + 4–6 weeks casting + packing | `shipWindow` |
| 8 | Payments | **Stripe Payment Links**, charge now, refund if the goal is missed | No server needed, works with GitHub Pages; you said no Kickstarter | `ops.py setup-stripe` |
| 9 | Shipping | Free in the US; +$15 for 34 countries | "Mailed to your door" for $50 flat in the US; the international cost is real | `intlShippingUsd`, `INTL_COUNTRIES` in `ops.py` |
| 10 | Keys per order | Max 10 | Allows gifts, limits card-testing fraud | `maxKeysPerOrder` |
| 11 | Wall names | Optional, 32 chars, anonymous "Owner Nº" by default | Privacy by default; moderation with `ops.py hide` | Payment Link custom field |
| 12 | Key material | Solid brass, ~70 g, cast from the real key's scan, laser-numbered | Weight = premium. Zinc fallback in the spec | `packaging/README.md`, site copy |
| 13 | Tax reserve | 30% of margin ($8.80/key) | Presale income is taxable and the car is probably not deductible that year | `perKeyBreakdownUsd` |
| 14 | Leftover money | Published and spent on the owners (wrap, owners' days, upkeep) | Keeps the art-not-profit story clean | Site copy § Open books |
| 15 | The car after | Never sold for profit; donated if it ever leaves | Kills the "is it an investment" question for good | FAQ, terms § 5 |
| 16 | Domain | Stay on `oscarludesign.com/own-a-car/` until you buy one | Works today | `siteUrl`, then re-run `setup-stripe` redirect |
| 17 | X handle | `@ownacar` (fallbacks in `brand/BRAND.md`) | Matches the name | `xHandle`, links in HTML |
| 18 | Accounts | Oscar's account leads, @ownacar posts facts and counters | Founder-led accounts get more reach on X | `marketing/x/PLAYBOOK.md` |
| 19 | Email sender | Resend or Loops by CSV import (not automated yet) | Nothing to set up until there are buyers | `marketing/email/README.md` |
| 20 | Label weight | 12 oz + 5 oz per extra key | Estimate; weigh the real sample | `cmd_labels` in `ops.py` |
| 21 | Launch promotion | $300–500 on the launch thread, only if it's already doing well | Cheap signal boost | X playbook § 8 |
| 22 | Dark-only site | No light mode | Night-garage brand; everything is designed dark | `style.css` |
| 23 | Typeface | **Michroma / Saira / JetBrains Mono** | You asked for type that feels like a real Lamborghini. Theirs is proprietary, so these open fonts carry the same wide, squared DNA | `fonts/`, `brand/BRAND.md` |
| 24 | Site direction | Night Garage + physics (keys pile up, the car shatters, names wrap it) | The wow factor; other directions (Homologation, Certificate) are on the design canvas | Design canvas, `physics/` |

---

## Questions only you can answer (most important first)

1. **Do you accept symbolic ownership** as the model (above)? If not, the alternative is a very different, much more expensive legal project.
2. **Whose name is on the LLC, the Stripe account and the bank account?** Stripe and banks require the account holder to be 18+.
3. **How much can you front before presale money arrives?** (~$2–6k; see `PLAYBOOK.md`.) Stripe may also hold a reserve until keys ship.
4. **The car:** Gallardo OK? Color preference? Where will it be stored and insured (you need a real answer before launch; buyers will ask)?
5. **Dates:** is Nov 9 – Dec 9 realistic with your classes? Moving it is one field.
6. **Price:** $50 flat with US shipping included, or $50 + shipping? (The latter adds ~$6/key to the car fund.)
7. **Where do owners' days happen?** Princeton/NJ first seems natural.
8. **The key design:** the ring-bow house key (`assets/key.jpg`) or the skeleton key (`assets/box.jpg`)?
9. **Real name or brand as the face?** The playbook assumes you post as yourself.
10. **Domain:** which one should I point everything at once you buy it?
11. **Contact email** for the site, terms and press.
12. **Do you want me to automate next:** dealer search, welcome emails, Discord verification, scheduled X posts?

---

## Concerns (and what I did about each)

### Legal
| Risk | What could happen | Mitigation built in | Still needs |
|---|---|---|---|
| **Securities** | "Part ownership" read as an investment contract | No profit/resale/returns anywhere; car never sold for profit; banned words list | Attorney sign-off |
| **Illegal lottery** | Prize + chance + payment | Nothing random, everyone gets the same thing, no giveaways; stated in terms § 8 and FAQ | Never add "one key wins" mechanics. Any giveaway needs the attorney |
| **Trademark** (Automobili Lamborghini) | Cease-and-desist over the name or marks | Brand is OWN A CAR; "Lamborghini" only in descriptive copy; no logos or crests in any asset; disclaimer on every page | Retouch any badge-like detail in renders. If a letter arrives: comply fast, rename copy to "an Italian supercar" |
| **Consumer protection / FTC** | "You own a Lamborghini" called misleading | FAQ and terms are explicit, checkout requires accepting the terms | Attorney review of the marketing lines |
| **FTC Mail Order Rule** | Shipping late without notice | Ship window stated; terms promise notice + refund option | Actually email if it slips |
| **Sales tax** | Uncollected tax liability | Stripe Tax on the Payment Links | Register in your state; watch Stripe's threshold alerts |
| **Income tax** | Big bill on presale revenue | 30% reserve in the model | CPA before launch |
| **Privacy** | Leaking addresses | No personal data in the repo, ever; the private link is hash-matched; `ops/private/` gitignored | Privacy policy review |
| **Minors** | Under-18 buyers | Terms § 12 | Attorney |
| **Endorsements** | Creators posting gifted keys without disclosure | Playbook requires `#ad` | Enforce it |
| **AI imagery** | Renders mistaken for the real product | Every doc says to label them "concept render" | Do it |

### Money and operations
- **Stripe risk review / reserve:** long presales get reviewed. Tell Stripe the model up front (`OPERATIONS.md`); don't plan to spend presale money before the car purchase.
- **Refund costs if the goal is missed:** card fees (~$1.75/order) aren't returned. Budgeted.
- **Chargebacks** before shipping are hard to win. The key page, terms consent and clear emails help.
- **Fraud / card testing:** max 10 per order, Radar rules, and the adjustable-quantity link is the only entry point.
- **Car costs beyond the purchase:** insurance for a car nobody drives (agreed-value/storage policy), storage and maintenance are in the model for year 1 only. Year 2+ is unfunded unless there's surplus.
- **Tight margin at exactly 6,000:** ~$1.6k contingency. A price bump to $55, or shipping charged separately, would give real slack.
- **Fulfilment load:** 6,000 boxes is weeks of packing. Above ~2,000, get a fulfilment-house quote (~$2–4/order).

### Technical
- **Pages and Actions only run from `main`:** merge this branch to go live (`OPERATIONS.md` step 5).
- **The registry updates every 15 min,** so new buyers see "being assigned" briefly. That's expected, and the page says so.
- **The sync Action commits to `main` up to ~96×/day** during the presale. Harmless, but noisy in history; it skips commits when nothing changed.
- **Runway renders:** 3 are in the repo. 9 need `tools/fetch_assets.sh` run on your machine **before the links expire (~Sept 30 – Oct 1)**,
  or a manual download from Runway → Assets. This environment's network policy blocked Runway's CDN.
- **Runway credits:** ~1,020 of 1,114 used (the three 1080p videos were ~840 of that). 94 left.

### Reputation
- **"Scam" accusations** are guaranteed, and they're also the distribution. Open books, automatic refunds and the terms answer them.
- **If the goal is missed:** the refund post is honest and still the piece. The playbook has it written already.
- **Moderation:** people will put slurs and jokes on the wall. `ops.py hide` plus daily review.
