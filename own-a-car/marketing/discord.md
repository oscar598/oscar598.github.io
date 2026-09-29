# Owners' Discord: server blueprint

Setup takes about 30 minutes by hand. Then put the invite in `config.json → discordUrl`, and it appears on every buyer's key page.

## Server
- **Name:** OWN A CAR · Owners
- **Icon:** `brand/x-avatar.png` · **Banner:** `brand/x-header.png`
- **Invite:** Server settings → Invites → create one that **never expires** with **no max uses**
- **Verification level:** Medium (verified email and 5 minutes on Discord). This stops most raid bots.
- **Explicit media filter:** all members
- Turn on **Community** (for Onboarding, Rules screening and Announcement channels)

## Roles
| Role | Color | Who | How |
|---|---|---|---|
| `Artist` | Brass #c9a24a | Oscar | Manual |
| `Crew` | Bone #f4efe6 | Moderators (recruit 2–3 trusted owners) | Manual |
| `Owner` | Brass #c9a24a | Verified buyers | Phase 2 (below) |
| `Early` | Dim #8d877c | Anyone who joined before a purchase | Default on join |

**Phase 1 (launch):** everyone who joins gets `Early`. Keep it open: the Discord is part of the marketing.
**Phase 2 (once there are >500 owners):** verify owners so `Owner`-only channels mean something. The simplest method that
needs no code: a `#verify` channel where owners post their key number, and a Crew member checks it against
`key.html?n=<number>` and the name on it, then gives the role. If it gets heavy, a small bot that asks the owner for their
private key link, hashes it and matches `data/registry.json` (same method as the key page) would automate it.

## Channels
```
📌 START
  #welcome          (read-only)  what this is, the rules, the links
  #announcements    (read-only)  counter milestones, the car, shipping. Follow-able as an Announcement channel
  #faq              (read-only)  a copy of the site FAQ

🔑 OWNERS
  #the-car          everything about the car: the hunt, inspections, pickup, the wrap
  #votes            polls: city, wrap color, name of the car, owners' days
  #show-your-key    certificates now, unboxings later
  #owners-chat      general
  #memes            obviously

🛠 BEHIND THE SCENES
  #studio           Oscar posts works-in-progress: key samples, box samples, casting
  #questions        ask anything; Crew answers or escalates

🔒 OWNER-ONLY (phase 2)
  #owners-lounge
  #owners-days      organizing meetups with the car
```

## #welcome (paste this)

> **You now own a car.**
>
> OWN A CAR is an art project by Oscar Lu. $50 buys a key to a Lamborghini. There's no limit on keys, and everyone who holds one owns it.
>
> **Links:** site [link] · your key: [link]/key.html · X: @ownacar
>
> **How it works:** if 6,000 keys sell by Dec 9 (11:59 pm ET), we buy the car, wrap it in every owner's name, and cast
> your brass key. If not, everyone's refunded automatically.
>
> **Rules**
> 1. Be decent. No harassment, slurs or hate. One strike for anything serious.
> 2. No selling, trading or "investing" talk. Keys are art. There's no secondary market here and none is endorsed.
> 3. No spam, no self-promo, no DMing people you don't know.
> 4. Don't post your private key link (the one with `?o=` in it). Share the public one (`?n=`) instead.
> 5. Crew decisions are final. Questions → #questions.
>
> React with 🔑 to unlock the server.

## Onboarding questions (Server settings → Onboarding)
1. "Do you already own a key?" → Yes (shows #verify) · Not yet (shows the buy link in #welcome)
2. "Where are you?" → US West · US East · US Central · Europe · Elsewhere (used later for owners' days)

## Rhythm
- `#announcements`: at every milestone (same copy as X), weekly during fulfilment.
- `#votes`: one vote a week during the presale. It keeps owners coming back and making content.
- Oscar posts in `#studio` at least twice a week. The behind-the-scenes posts are why people stay.

## Moderation
- AutoMod: block slurs (Discord's preset), block invite links, flag messages with "invest", "resell", "flip", "profit" for Crew review (rule 2).
- Slowmode 10 s on `#owners-chat` during launch week.
