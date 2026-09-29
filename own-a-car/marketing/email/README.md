# Owner emails

`python3 own-a-car/tools/ops.py emails <template>` writes `ops/private/email-<template>.csv`
(email, first_name, keys, qty, tracking_link). Import that CSV into the sender below and map the
`{{placeholders}}`. Project-wide values (`{{owners}}`, `{{goal}}`, `{{days_left}}`, `{{discord_url}}`,
`{{ship_window}}`, `{{share}}`) are the same for everyone, so paste them into the template before sending.

| Template | When |
|---|---|
| `welcome.md` | Daily batch during presale, to everyone who bought that day (their tracking link + Discord) |
| `milestone.md` | At 25%, 50%, 75% of the goal and on the last 48 hours |
| `funded.md` | The day the presale closes above the goal |
| `refund.md` | The day `ops.py refund --execute` runs |
| `shipped.md` | After each `ops.py mark shipped …` batch |

Sender: Resend or Loops (free tiers cover the first few thousand emails; both take CSV imports).
Use a sending domain you own and set up SPF/DKIM, or these land in spam.
Stripe separately sends each buyer a receipt automatically (turn on "Successful payments" under
Settings → Customer emails).
