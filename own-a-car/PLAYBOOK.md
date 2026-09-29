# Own a Car: the playbook

Everything needed to go from brief to shipped keys, in order. **[auto]** marks steps that are already
automated in this folder or that Claude can run for you. **[you]** marks steps that need you, a signature
or a professional.

---

## 0. Decide these first, because the law turns on them

The same idea can be an artwork, a lottery or an unregistered security depending on the wording.

| Decision | Keep it art | Don't do this |
|---|---|---|
| What the buyer gets | A numbered sculptural key + a place in the piece | A legal share of the car |
| Money | No return, ever | Resale profits, rental income, "your key will be worth more" |
| Chance | Every buyer gets the same thing | "One key starts the car and wins it" (prize + chance + payment = **illegal lottery**) |
| The car's future | Decide now: displayed, never sold (or donated) | Selling it later and splitting the proceeds with key holders (that makes it a **security**) |
| The key | Cast from the real key, non-functional | Unlimited working copies of a real car key |
| Brand | "a Lambo" named as the subject, plus a "not affiliated" disclaimer | The bull logo, the wordmark, their fonts on your box. Lamborghini enforces its trademarks hard |

The page copy and `terms.html` already follow the left-hand column.

## 1. Legal and money setup **[you]**

1. **Form an LLC** (~$50–$500 depending on state). The car is titled to the LLC, not to you personally.
2. **EIN** (free, irs.gov, 10 min) → **business bank account**.
3. **Attorney review (~$500–$2,000 flat).** Ask exactly: "Is this a security or a lottery? Please approve
   my terms of sale." Bring `terms.html`. Look for an art-law or startup attorney; many law schools run
   free clinics for students.
4. **CPA, before launch.** This one bites: presale money is taxable income to the LLC, and buying the car
   probably isn't a full deduction that year (it's an asset). You could owe tax on most of what you raise.
   The goal has to cover that.
5. **Sales tax.** Keys are physical goods, so you owe sales tax in states where you cross thresholds.
   Kickstarter or Stripe Tax can collect it.
6. **FTC Mail Order Rule.** You must ship by the date you promise, or email buyers a new date and offer a refund.
   That's why `config.js` has `shipWindow`.
7. **Insurance and storage** for the car once bought (~$3k–$8k/yr for insurance, more for secure storage).

## 2. The math **[auto: edit `config.js` when you settle it]**

Per $50 key, shipping included:

| | |
|---|---|
| Payment fees (~2.9% + 30¢) | −$1.75 |
| Key + premium box, at volume | −$10 to −$18 |
| Domestic shipping | −$5 to −$7 |
| **Left toward the car** | **≈ $25–$33** |

Suggestion: charge shipping separately, which gets you to ≈ $32–$38 a key.

| Car | Typical used price | + tax/title/insurance (~12%) | Keys needed at $30 net | Before income tax |
|---|---|---|---|---|
| Gallardo (2004–13) | $85k–$130k | ~$120k | **~4,000** | add 20–35% |
| Huracán (2015+) | $180k–$260k | ~$250k | ~8,300 | add 20–35% |
| Urus | $180k–$230k | ~$230k | ~7,700 | add 20–35% |

`goalKeys` is currently 4,000, which is a Gallardo with no tax buffer. Change it once your CPA gives you a number.

## 3. Taking the money: all-or-nothing

**Recommended: Kickstarter.** All-or-nothing is how it works: nobody is charged unless the goal is hit,
so there are no refunds to process. It also has an Art category and its own audience.
Fees are 5% plus about 3–5% for payments. Put the Kickstarter URL in `config.checkoutUrl`, and this site
is the gallery that points to it.

**Alternative: Stripe Payment Link.** It collects name, email and shipping address at checkout, which
covers your whole form. The catch is that you charge at purchase and refund if the goal is missed,
and **Stripe doesn't return its fees on refunds**, so a miss costs you ~$1.75 a key out of pocket.
Stripe can't hold a card authorization for a presale-length window. If you go this route:

- **[auto]** `tools/stripe_keys.py count` → updates `progress.json` → the page's meter.
- **[auto]** `.github/workflows/own-a-car-progress.yml` runs that hourly once you add the `STRIPE_SECRET_KEY`
  secret and the `PAYMENT_LINK_ID` variable (it only schedules from the default branch).
- **[auto]** `tools/stripe_keys.py refund` shows a dry run of every refund. `--execute` refunds everyone. It's safe to re-run.
- Set the Payment Link's confirmation page to `https://oscarludesign.com/own-a-car/thanks.html`.

Either way: **don't open checkout until step 1 is done.** The button stays "Presale opens soon" while `checkoutUrl` is empty.

## 4. The website **[auto: done]**

`/own-a-car/`: hero, live key meter, how it works, artist statement, straight-answer FAQ,
terms and a thanks page with the Discord button. It's all driven by `config.js`, so you don't need to touch the HTML.

## 5. Discord **[you: 20 min, then auto]**

1. Create the server with channels: `#welcome`, `#announcements` (read-only), `#the-car`, `#owners`, `#show-your-key`.
2. Create a non-expiring invite and put it in `config.discordUrl`. It then appears on the thanks page.
   Put it in the Kickstarter/Stripe receipt too.
3. Later, when you want only buyers inside: a Stripe → Discord role bot (Zapier/Make, or a small bot).

## 6. Finding the car **[auto: the search; you: the purchase]**

- Sources: Cars.com, Autotrader, Bring a Trailer, duPont Registry, Lamborghini dealer CPO inventory.
- **[auto]** Claude can sweep listings into a shortlist (price, miles, history, location) and write
  outreach emails as Gmail **drafts** for you to send.
- **[you]** Before any money moves: Carfax/AutoCheck, and a **pre-purchase inspection at a Lamborghini
  dealer** ($500–$1,000). Gallardo clutches and e-gear pumps are expensive.
- Buy only after the presale closes and the funds have settled.
- Film the purchase, the pickup and the key. That footage is your best marketing asset.

## 7. The key and the packaging **[you: choose vendors; auto: mockups]**

The box is the piece people will keep. See `PACKAGING.md`.

## 8. Marketing **[auto: content; you: face and voice]**

The hook sells itself: *"I'm selling unlimited keys to one Lambo. $50 each. Everyone who buys one owns it."*

- **The counter is the story.** Post daily: "1,212 people own this car now." The meter does the math for you.
- Series: day 1 announce → the math → the dealer hunt → the key sample arriving → the unboxing → buying the car.
- Press: art/culture writers and car media (Jalopnik, Hypebeast, Highsnobiety, The Drive).
  The "is it art or a scam?" debate is coverage, and the FAQ answers it up front.
- **[auto]** Claude can generate teaser video and stills (Higgsfield/Runway), mock up the box (Canva), and draft
  and schedule TikTok posts through Higgsfield once you approve each one.
- Don't claim a key will gain value. That's the security line again.

## 9. Fulfilment **[auto: the list; you: the boxes]**

1. Export orders (Kickstarter survey or Stripe) → CSV of name, email, address, key number (in purchase order).
2. **[auto]** Claude turns the CSV into personalized ownership certificates (PDF) and a shipping-label batch.
3. Ship with Pirate Ship (cheapest USPS rates, bulk CSV import) or hand it to a fulfilment house above ~2,000 keys.
4. Email tracking plus a "post your key in #show-your-key" message.

## Timeline (example)

| Week | |
|---|---|
| 1–2 | LLC, EIN, bank, attorney and CPA calls, key sample ordered |
| 3–4 | Key sample in hand, box sample, film teaser, Discord live |
| 5 | Presale opens (Kickstarter: 30–45 days) |
| 10 | Presale closes → funds settle (~2 weeks) |
| 12 | Buy the car, cast production keys |
| 16–20 | Pack and ship |
