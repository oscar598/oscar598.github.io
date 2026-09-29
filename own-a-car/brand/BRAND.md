# OWN A CAR · brand

Visual guide: `brand/index.html`. Files are in this folder.

## The idea in one line
**$50 buys a key to a Lamborghini. There's no limit on keys. Everyone who holds one owns it.**

## Name
**OWN A CAR.** It's deadpan and literal, and it sits at the opposite end from the object, which is the joke.
The Lamborghini lives in the copy, never in the name or logo: that keeps the brand clean of
Lamborghini's trademarks while every post still says what the car is.

- Written as `OWN A CAR` in the logo and all-caps contexts, *Own a Car* in running text when it names the artwork.
- X handle: **@ownacar** (fallbacks, in order: @ownacarkey, @ownacar_art, @ownacarxyz)
- Hashtag: **#OwnACar**
- Domain to buy: ownacar.com is likely taken; try ownacar.co, ownacar.xyz, ownacar.art, getakey.to.
  Until then: oscarludesign.com/own-a-car

## Taglines
- Primary: **You now own a car.**
- Supporting: *Unlimited keys. One car.* · *Edition of ∞.* · *How much Lamborghini is $50?* · *The more of us own it, the less any of us does.*

## Voice
Deadpan, exact, a little dry. It states things like a title deed. Numbers do the jokes.

| Do | Don't |
|---|---|
| "1,212 people own this car now." | "🚀 LFG FAM WE'RE SO BACK" |
| "Each key is 683 g of Lamborghini. About a football." | "Own a piece of luxury!" |
| "If we miss the goal, you get your money back. Automatically." | "Don't miss out!!! Limited time!!!" (it isn't limited: that's the point) |
| "The key doesn't start the car. Nothing does, for you." | Anything implying a key gains value, pays out, or can be resold for profit |

**Never say:** investment, returns, profit, appreciate, stake, shares, dividend, "to the moon", "your key will be worth…",
"win the car", "lucky key", raffle, giveaway.
**Always true:** every key gets the same thing; ownership here means your key, certificate and name on the car.

## Color
| Token | Hex | Use |
|---|---|---|
| Garage black | `#0a0a0a` | Every background |
| Bone | `#f4efe6` | Text, the certificate paper |
| Dim | `#8d877c` | Secondary text |
| Line | `#262420` | Rules and borders |
| Brass | `#c9a24a` | The accent: buttons, numbers, the key |
| Brass high / low | `#f3dc9a` / `#7a5a1c` | The key's gradient; gold type on hero numbers |

Brass appears once or twice per surface, never as a background fill (except the primary button).
In print, brass = **gold foil** (e.g. Kurz Luxor 220 or the printer's closest match).

## Type
- **Fraunces Black (900)** for headlines and the wordmark, tracked tight (−3%) in headlines and +280 in the wordmark.
- **Fraunces Italic** for ledes and asides.
- **JetBrains Mono** for every number, label and key number (`KEY Nº 0042`), uppercase, +8–14% tracking.
- **Inter** for body copy and buttons.
All four are SIL Open Font License and self-hosted in `/own-a-car/fonts/`.

## The key mark
`key.svg` (brass gradient) and `key-mono.svg` (single color, uses `currentColor`). It's a ring bow, a collar and a blade with three teeth.
It's drawn, not traced from any real key, so it's ours. Rotate it −8° to −35° when it's a hero; never stretch it.
Clear space: one ring-diameter all around.

## Logo files
| File | Use |
|---|---|
| `wordmark.svg` / `-black` / `-gold` | The name alone (outlined paths, no font needed) |
| `lockup.svg` / `-black` | Key + name, for the box sleeve, letterheads and stickers |
| `favicon.svg` | Browser tab |
| `x-avatar.png` (400²) | X profile picture |
| `x-header.png` (1500×500) | X header |
| `og.png` (1200×630) | Link previews everywhere |

## Photography (Runway prompts in `assets/RUNWAY.md`)
Night garages, one hard light, deep black, brass glowing. Ordinary people and a very expensive object.
The car never shows a badge, a crest or a readable plate, and neither does anything else we make.

## Numbering
Keys are `Nº 0001` onward: four digits minimum, mono, never rounded. The edition is always "of ∞".

## Rebuilding
```bash
python3 own-a-car/tools/wordmark.py                   # logos (pip install fonttools brotli)
export NODE_PATH=$(npm root -g)                       # needs playwright installed globally
node own-a-car/tools/render.js 'own-a-car/brand/cards.html#og' own-a-car/brand/og.png 1300 700
node own-a-car/tools/render.js 'own-a-car/brand/cards.html#avatar' own-a-car/brand/x-avatar.png 1300 1200
node own-a-car/tools/render.js 'own-a-car/brand/cards.html#header' own-a-car/brand/x-header.png 1600 1800
```
