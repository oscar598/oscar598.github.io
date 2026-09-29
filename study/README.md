# Recall Table (prototype)

One playable round to test whether the game layer is fun before building any AI.
Open `/study/` locally with `python3 -m http.server 8080`.

Round: 9 multiple-choice questions + 1 boss. Each question: pick an answer → bet
confidence (Sure +200/−150, Maybe +120/−40, Guessing +60/±0) → reveal → combo
(1× → 2× → 3× → On Fire 4×) → 15% crit (×3, correct answers only) → rank screen.

- Questions are hand-written fakes (BIO 110 cell energy). Every wrong option is a
  real misconception with its own explanation; every question cites a page.
- Rank (S/A/B/C) comes from accuracy only. Points are the fun currency and never affect it.
- "Playtest switches" at the bottom turn bets, combo, crits and juice on/off so you
  can compare runs with and without each mechanic.
- Keyboard: A–D or 1–4 to answer, S/M/G to bet, Enter for next.
- After 10 pm the rank screen tells the player to go sleep and demotes "Play again".
