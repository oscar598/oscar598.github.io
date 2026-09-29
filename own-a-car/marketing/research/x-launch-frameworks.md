# OWN A CAR: how launches go viral on X, and the post frameworks to use

Research compiled 2026-09-29 for the OWN A CAR launch (planned for about Mon Nov 9, 2026). Scope: case studies of viral launches and stunts, the patterns behind them, X algorithm notes with dates and sources, failure modes, and post templates written for OWN A CAR.

How to read this:
- Numbers come from the linked press and primary coverage.
- Claims from third-party "algorithm guide" blogs are marked **(practitioner claim)**. They are directionally useful but not verified against X's code.
- Anything I couldn't confirm is marked **unverified**.
- Many X, Reddit, Nieman Lab, Buffer, Hypebeast and Medium pages were blocked by the research proxy. Where that happened, the figures come from search-result snippets of those pages. They are cited, but I didn't read the full text.

---

## 1. Summary (10 bullets)

1. **The closest precedent is MSCHF's Key4All (Sept 2022).** It sold 1,000 identical $20 keys to a single 2004 PT Cruiser. It got wide press, then the car "traveled across the U.S. before becoming impounded" ([key4all.com](https://key4all.com/), [Highsnobiety](https://www.highsnobiety.com/p/mschf-key-4-all-car-game-gta-drop-game/)). OWN A CAR is the luxury, non-competitive version. Name the lineage in interviews rather than let replies "discover" it.
2. **The second-closest precedent is Duolingo's "Death of Duo" (Feb 2025).** Its resurrection was gated on a collective goal (50B XP). It drew about 1.7B impressions in two weeks ([Meltwater](https://www.meltwater.com/en/blog/duolingo-dead-mascot-campaign), [NPR](https://npr.org/2025/02/26/nx-s1-5309785/duolingo-owl-mascot-lives)). A public, collective, all-or-nothing counter turns every buyer into a recruiter. The 6,000-key goal is OWN A CAR's version of that engine.
3. **Viral hooks are usually one deadpan sentence plus one striking visual**, with the explaining done in replies. Examples:
   - Friend.com: "introducing friend. not imaginary." with a video, about 23–26M views ([X](https://x.com/AviSchiffmann/status/1818284595902922884), [Wikipedia](https://en.wikipedia.org/wiki/Friend_(product))).
   - Cluely: "Cluely is out. cheat on everything." with a video, 13M+ views ([X](https://x.com/im_roy_lee/status/1914061483149001132), [TechCrunch](https://techcrunch.com/2025/04/21/columbia-student-suspended-over-interview-cheating-tool-raises-5-3m-to-cheat-on-everything/)).
4. **Controversy has to be about the idea, not about getting scammed.** The Cybertruck's broken window and MSCHF's Satan Shoes turned outrage into demand because the outrage was aesthetic or moral. ConstitutionDAO, Spice DAO and $HAWK lost goodwill because outrage was about money and misunderstood ownership. OWN A CAR has to pre-answer "is this a scam" in the first reply, not the 40th.
5. **The founder account should lead, and the brand account should be the deadpan "institution."** Every 2024–26 example above launched from a person (Avi, Roy, Pieter Levels, Josh Miller, Brett Adcock). The brand account works as the dry registrar: counters, certificates, key numbers.
6. **Video carries the launch post.** Native video or a GIF in the root post, not a link card:
   - Pieter Levels' flight sim started with "3 hours of code, here's the video." The saga reportedly passed 100M views (**unverified**, self-reported).
   - X's 2026 open-source ranker explicitly predicts "video quality view", dwell time and dwell duration ([xai-org/x-algorithm](https://github.com/xai-org/x-algorithm)).
7. **Links are no longer officially penalized, but link posts still earn fewer of the signals that drive ranking.**
   - Bier and Musk said in Oct 2025 and again on Jul 28, 2026 that links aren't deboosted.
   - The engagement gap existed because the in-app browser covered the like and reply buttons.
   - Buffer measured 0% median engagement on link posts from free accounts after March 2025.
   - For launch day: keep the root post link-free and native, and put the link in the first self-reply. Treat that as a hedge, not superstition.
8. **Replies that the author engages with are the heaviest positive signal we have numbers for.**
   - In the 2023 open-source heavy ranker, a "reply engaged by author" weighed 75, against 0.5 for a like and 1 for a retweet. A report weighed −369.
   - The 2026 Grok-based ranker keeps the same structure (weighted sum of predicted actions, with negative weights for mute, block, report and "not interested") but hides the weights.
   - Answer 50–150 replies in the first two hours, from both accounts, in deadpan voice.
9. **Timing: launch mid-week, late morning Eastern, and avoid news-saturated days.** Buffer's 2026 data says Tue/Wed 9–11am. Sprout says Tue–Thu 12–6pm. Nov 9, 2026 is a Monday, six days after the Nov 3 US midterms. If there is flexibility, Tue Nov 10 at 9:30–10:30am ET is the data-backed slot; Wed Nov 11 is Veterans Day.
10. **Design a counter from day one, then post milestones on the goal gradient.**
    - Kickstarter research shows support is U-shaped (first and last week) and accelerates as projects near their goal ([Kuppuswamy & Bayus, SSRN](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2234765)).
    - Pre-plan milestone posts at 1 / 100 / 1,000 / 3,000 / 5,000 / 5,900 / 6,000, plus a "T-minus" countdown for the final 72 hours.

---

## 2. Case studies

### 2a. Table

| # | Launch / stunt (year) | What they posted (hook) | Format | Why it spread (mechanic) | Numbers | Source |
|---|---|---|---|---|---|---|
| 1 | **MSCHF Key4All** (Sep 2022) | "1,000 keys. 1 car." One key unlocks a shared mystery car; whoever finds it drives it (exact tweet text **unverified**) | Drop via MSCHF app/texts, product photos, hotline for GPS | Absurd shared ownership, a GTA-style game, local IRL chase | 1,000 keys at $20; PT Cruiser crossed the U.S., then was impounded | [key4all.com](https://key4all.com/), [Highsnobiety](https://www.highsnobiety.com/p/mschf-key-4-all-car-game-gta-drop-game/), [Hypebeast](https://hypebeast.com/2022/9/mschf-1000-keys-shared-mystery-car), [Secret NYC](https://secretnyc.co/mschf-keys4all-nyc/) |
| 2 | **MSCHF Jesus Shoes** (Oct 2019) | Air Max 97s with Jordan River holy water in the sole, "MT. 14:25" | Product photos, drop | Sacrilege plus luxury pricing, a "can they do that?" reaction, press pickup | 24 pairs at $1,425 sold in under a minute; resale about $4,000 | [CBS](https://www.cbsnews.com/news/nike-air-max-97-jesus-shoes-filled-with-holy-water-selling-for-4000-2019-10-11/), [Campaign](https://www.campaignlive.com/article/mschf-inject-nikes-holy-water-call-jesus-shoes-sell-2k/1661884) |
| 3 | **MSCHF x Lil Nas X Satan Shoes** (Mar 2021) | 666 pairs, a drop of human blood, $1,018 | Celebrity post plus music video tie-in | Moral outrage, then a Nike lawsuit, then a second news cycle | Sold out in under a minute; settled with a buyback | [CBS](https://www.cbsnews.com/news/lil-nas-x-shoe-nike-settles-with-company-that-produced-satan-shoes/), [Highsnobiety](https://www.highsnobiety.com/p/mschf-lil-nas-x-nike-air-max-97-satan-release-info/) |
| 4 | **MSCHF Birkinstocks** (Feb 2021) | "The most exclusive sandals ever made" | Photos; celebrity owners (Kylie Jenner, Future) posted theirs | Destroying a luxury icon, then outrage and "is it upcycling?" think-pieces | Four Birkins worth $122,500 cut up; sandals priced $34k–$76k | [The Fashion Law](https://www.thefashionlaw.com/mschf-drops-the-most-exclusive-sandals-ever-made-theyre-called-birkinstocks/), [CNN](https://www.cnn.com/style/article/mschf-birkinstock-from-birkin-bags) |
| 5 | **MSCHF Big Red Boots** (Feb 2023) | Astro Boy "cartoon boots for a 3D world" | Photo campaign (Sarah Snyder posed like a game character), celebrity seeding at NY Fashion Week | Images that look unreal, "is this AI?" debate, a meme template | $350; sold out in minutes; resale over $1,700 | [CNN](https://edition.cnn.com/style/article/mschf-big-red-boots/index.html), [Hypebae](https://hypebae.com/2023/2/mschf-big-red-boots-images-sarah-snyder-campaign-release-info) |
| 6 | **Cards Against Humanity Holiday Hole** (Black Friday 2016) | "As long as money keeps coming in, we'll keep digging." | Livestream plus site counter | Paying for nothing, a live counter, and a reply to critics: "Why aren't YOU giving all this money to charity?" | $100,573; 3.6M YouTube views in 3 days | [NPR](https://www.npr.org/sections/thetwo-way/2016/11/27/503502142/people-donated-nearly-100-000-to-dig-a-big-pointless-hole-in-the-ground), [Tubefilter](https://www.tubefilter.com/2016/11/28/cards-against-humanity-holiday-hole/) |
| 7 | **CAH Saves America / border land** (Nov 2017), revived as **CAH vs SpaceX** (Sep 2024) | "$15 to save America": bought land to block the wall. 2024: "Elon Musk Owes You $100" | Microsite, email to 150k holders, press | Symbolic collective ownership plus a map and certificate; seven years later the same holders were re-mobilized | 150,000 slots sold out in hours; $15M suit, settled | [CNN](https://www.cnn.com/2017/11/15/us/cards-against-humanity-land-grab-trnd), [TechCrunch](https://techcrunch.com/2024/09/20/cards-against-humanity-sues-elon-musks-spacex-for-trespassing/), [cahsuesmusk.com](https://www.cahsuesmusk.com/) |
| 8 | **CAH "Give us $5, get nothing"** (2015) | "Give us $5 and get absolutely nothing in return" | Site plus social | Deadpan anti-commerce | $71,145 from 11,248 people | [Inc](https://www.inc.com/business-insider/cards-against-humanity-sold-nothing-on-black-friday-for-5-dollars.html), [TechCrunch](https://techcrunch.com/2015/11/28/heres-what-cards-against-humanity-is-doing-with-the-71145-they-made-on-black-friday) |
| 9 | **Million Dollar Homepage** (2005) | "$1 per pixel" | Single web page plus press release | A student in debt, a simple idea and a visible counter; the press release after 1,100 pixels triggered coverage | $1,037,100 in about 5 months | [Wikipedia](https://en.wikipedia.org/wiki/The_Million_Dollar_Homepage), [Web Design Museum](https://www.webdesignmuseum.org/gallery/the-million-dollar-homepage-2005) |
| 10 | **Reddit r/place** (2017) | Shared canvas, one pixel every 5–20 minutes | Platform feature | Collective ownership of a shared artifact, faction rivalry | 1M+ users, about 16M pixels, 72 hours | [Wikipedia](https://en.wikipedia.org/wiki/R/place), [Adweek](https://www.adweek.com/media/reddits-r-place-april-fools-stunt-was-the-place-to-be/) |
| 11 | **One Million Checkboxes** (Jun 2024) | One page, a million shared checkboxes | Site shared on X, HN, Mastodon | Shared state plus emergent community art; went "really viral in Japan" | About 500k players, 650M checks in 2 weeks | [Wikipedia](https://en.wikipedia.org/wiki/One_Million_Checkboxes), [Bryan Braun](https://www.bryanbraun.com/2024/08/10/one-million-checkboxes-and-the-fear-of-viral-success/) |
| 12 | **ConstitutionDAO** (Nov 2021) | Austin Cain's tweet about a "high profile acquiring DAO", then "DM me" (paraphrase) | Tweet, then a brand account, a Discord and a Juicebox counter | Absurd goal, public counter, one-week deadline | $47M from 17,437 wallets, median $206; lost the auction; refund gas ate small donations | [Wikipedia](https://en.wikipedia.org/wiki/ConstitutionDAO), [The Defiant](https://thedefiant.io/news/nfts-and-web3/constitutiondao-refunds-gas-fees), [Vice](https://www.vice.com/en/article/constitutiondao-aftermath-everyone-very-mad-confused-losing-lots-of-money-fighting-crying-etc/) |
| 13 | **Tesla Cybertruck reveal** (Nov 2019) | Musk's follow-up video of the ball *not* breaking the glass; later tweeted "250k" | Livestream, then a clip, then counter tweets | Onstage failure became a meme and a debate, with preorder counts posted as milestones | 6M+ views on the follow-up clip in 3 days; 200k orders claimed in 3 days, 250k in 5 | [CNBC](https://www.cnbc.com/2019/11/27/elon-musk-suggests-tesla-received-250000-pre-orders-for-cybertruck.html), [ABC](https://abcnews.com/Business/elon-musk-explains-cybertrucks-armor-glass-windows-shattered/story?id=67316874) |
| 14 | **Friend.com** (Jul 2024; subway ads Sep–Oct 2025) | "introducing friend. not imaginary. order now at [link]" | Single post with cinematic video | Uncanny premise, a love/hate split, then quote-tweet dunks; later "vandalism was part of the plan" | About 23–26M views (sources vary); $1M+ on 11,000 subway-car ads | [X](https://x.com/AviSchiffmann/status/1818284595902922884), [Wikipedia](https://en.wikipedia.org/wiki/Friend_(product)), [Futurism](https://futurism.com/artificial-intelligence/million-dollar-ai-campaign-defaced) |
| 15 | **Cluely** (Apr 2025) | "Cluely is out. cheat on everything." | Single post with a short-film video (blind-date cheating) | Moralized premise, "Black Mirror" quote-tweets, founder backstory (suspended by Columbia) | 13M+ views on X; $5.3M seed | [X](https://x.com/im_roy_lee/status/1914061483149001132), [TechCrunch](https://techcrunch.com/2025/04/21/columbia-student-suspended-over-interview-cheating-tool-raises-5-3m-to-cheat-on-everything/) |
| 16 | **Pieter Levels, fly.pieter.com** (Feb–Mar 2025) | "3 hours of code, here's the video" (per secondary coverage), then Stripe screenshot milestones | Video/GIF, then a public revenue counter as milestone posts | Build-in-public counter, ad slots sold to followers; Musk quote-posted | "$1M ARR in 17 days" (self-reported); "100M views" (self-reported, **unverified**); later dropped to $0/mo | [levels.io](https://levels.io/fly-pieter-com-vibecoded-flight-simulator), [DEV](https://dev.to/promptway/he-built-a-flight-simulator-in-three-hours-and-hit-1m-a-year-in-17-days-then-it-went-to-zero-1b1l) |
| 17 | **Duolingo "Death of Duo"** (Feb 2025) | Duo is dead (hit by a Cybertruck); revival tied to a collective 50B XP goal | Icon change, three videos, then a resurrection reel | Mock tragedy, a collective goal and a counter, brand-to-brand replies | 1.7B impressions in 2 weeks; #ripduo used 45k+ times | [NPR](https://www.npr.org/2025/02/13/nx-s1-5295597/duolingo-owl-mascot-death), [Meltwater](https://www.meltwater.com/en/blog/duolingo-dead-mascot-campaign), [PR Daily](https://www.prdaily.com/duolingo-shares-pr-secrets-of-viral-death-of-duo-campaign/) |
| 18 | **Rabbit R1** (CES, Jan 2024) | Founder video: black tee, black backdrop, orange device (Apple-keynote pastiche) | Keynote video cut for X, then counter posts | Clean single-object visual, "sold 10,000 in a day", then batch counters | 10k preorders on day 1, 50k in 5 days; then brutal reviews | [Fast Company](https://www.fastcompany.com/91013196/how-design-drove-10m-in-pre-orders-for-rabbit-r1-ai-hardware), [The Decoder](https://the-decoder.com/rabbits-r1-ai-first-hardware-sold-out-the-first-three-batches-in-days/) |
| 19 | **Humane AI Pin** (Nov 2023), a failure | Polished launch video | Long video | Factual errors inside the launch video (eclipse, almond protein) got clipped and dunked; later MKBHD called it "the worst product I've ever reviewed" | Company shut down after $230M raised | [SFGate](https://www.sfgate.com/tech/article/humane-ai-pin-false-info-video-18483434.php), [Dexerto](https://www.dexerto.com/tech/marques-brownlee-slams-humane-ai-pin-as-the-worst-product-hes-ever-reviewed-2646829/) |
| 20 | **Comedian (Cattelan banana) sale** (Nov 2024) | The buyer gets a certificate, not the banana; Justin Sun ate it | Auction, then press, then an eating video | "You bought a *certificate*?" debate. Art ownership is symbolic and documented, which is the exact philosophical frame for OWN A CAR | $6.2M | [NPR](https://www.npr.org/2024/11/21/nx-s1-5199568/a-duct-taped-banana-sells-for-6-2-million-at-an-art-auction), [HKFP](https://hongkongfp.com/2024/11/30/crypto-boss-justin-sun-eats-banana-art-he-bought-for-us6-2-million/) |
| 21 | **Exploding Kittens Kickstarter** (Jan 2015) | $10k goal | Kickstarter page plus The Oatmeal's audience | Existing audience, an instantly legible joke, "achievements" instead of stretch goals | $1.33M on day 1; 219,382 backers | [Wikipedia](https://en.wikipedia.org/wiki/Exploding_Kittens), [Kickstarter](https://www.kickstarter.com/blog/exploding-kittens-is-the-most-backed-project-of-all-time) |
| 22 | **Arc Search** (Jan 2024) | Josh Miller launched it "in a tweet moments before boarding a flight" on a Sunday | Founder post plus demo video | Founder voice, demo-first; reaction was "strongest ever" per the company | n/a | [Contrary](https://research.contrary.com/company/the-browser-company), [Lenny's](https://www.lennysnewsletter.com/p/competing-with-giants-an-inside-look) |

### 2b. Short notes

- **Key4All is the benchmark to beat and the critique to pre-empt.** Tech/art press will say "MSCHF did this". Answer it in advance:
  - Key4All was a competitive chase. Only one person could hold the car at a time, so there was a winner.
  - OWN A CAR is simultaneous, non-competitive ownership. Everyone holds it at once, and nobody drives off with it.
  - That difference is also the legal line: nothing to win, so no sweepstakes framing.
  - Key4All's car ended up impounded. Publish where the Lamborghini lives, who insures it, and what happens to it.
- **MSCHF's pattern (Jesus, Satan, Birkinstocks, Boots):**
  - An object that is instantly legible in a single photo.
  - A price or scarcity number in the first line.
  - A sacrilege of a luxury or sacred icon.
  - The collective lets the press and quote-tweets do the explaining.
  - Founder Gabe Whaley: design "for a feeling," optimize for responses people choose to give ([Startup Spells](https://startupspells.com/p/marketing-mschf-emotion-first-playbook-behind-viral-hits)). Head of commerce Daniel Greenberg: "If we can make people a fan of the brand and not the product, we can do whatever the f*ck we want" ([LinkedIn teardown](https://www.linkedin.com/pulse/secret-sauce-virality-how-mschfs-big-red-boots-alain-van-den-donk)).
- **CAH is the best model for deadpan answers to critics.** "Why aren't YOU giving all this money to charity? It's your money." It also proves that symbolic ownership plus a certificate plus a map is enough: 150,000 people paid $15 for a sliver of symbolic land.
- **Duolingo shows the collective-goal mechanic at scale.** "Do X together, or the thing doesn't happen." Brands and creators joined in the replies, which is the brand-to-brand reply play.
- **Friend and Cluely are the 2024–25 template for founder launch videos:**
  - A lowercase, 3–6 word, declarative caption.
  - A cinematic 60–90s video that makes a premise, not a feature list.
  - The founder personally absorbs the dunks and replies. The controversy is the distribution.
- **Cybertruck and Pieter Levels show milestones as content.** "250k" posted as a bare number is itself a post that spreads.

---

## 3. Patterns

### 3.1 Hook formulas for the first line (what the examples share)

1. **Bare declarative plus absurd object:** "introducing friend. not imaginary." / "Cluely is out. cheat on everything." Lowercase, no exclamation mark, no emoji.
2. **Number plus object plus price:** "1,000 keys. 1 car." / "$1 per pixel." / "666 pairs." Numbers are scannable and screenshot-able.
3. **Impossible ownership:** "We're buying the Constitution." / "You can own a Lamborghini for $50." This frame is the core of OWN A CAR.
4. **Rule statement plus deadpan consequence:** "As long as money keeps coming in, we'll keep digging." / "If we don't reach 6,000, everyone gets their money back."
5. **Mock-institutional voice:** certificates, registrar language, numbered editions (MSCHF drop numbers, CAH certificates). It reads as art, not as a pitch.

Anti-patterns:
- Hype adjectives like "revolutionary" or "insane".
- Asking for engagement ("RT if…", "follow everyone who replies"). X now removes accounts from creator revenue share for this and forwards repeat offenders for suspension (July 2026 enforcement, per [Backpack](https://learn.backpack.exchange/articles/nikita-bier-crypto-twitter); secondary source).
- A link in the first line.
- Explaining the joke.

### 3.2 Single post vs thread

- **All of the viral launch hooks found were single posts with native media** (Friend, Cluely, Arc Search, Pieter Levels, Cybertruck clip). Explanations went into self-replies or a thread under the video.
- Threads help with dwell time. Practitioner guides say threads keep readers 30–90s longer **(practitioner claim)**. But a thread splits engagement across posts, and the root post is what gets quote-tweeted.
- **Recommendation: a root post (video plus one line), then a 4–6 post self-reply thread** covering what you get, how all-or-nothing works, where the car lives, the refund guarantee and the link. The root stands alone. The thread is the FAQ.
- X Articles (long-form) are reportedly treated well for dwell **(practitioner claim)**. Use one for the artist statement on day 2, not as the launch.

### 3.3 Role of video and images

- In X's Grok-era ranker (released Jan 2026; README currently dated Aug 13, 2026), the predicted actions include "video quality view," "dwell," "dwell time," "photo expand," and "click dwell time" ([xai-org/x-algorithm](https://github.com/xai-org/x-algorithm)). Media that holds attention is directly scored.
- Musk said in Oct 2025 that "Grok will literally read every post and watch every video (100M+ per day)" ([X](https://x.com/elonmusk/status/1979217645854511402)). The *content* of the video, not just its metadata, affects who sees it.
- Native video of 60–90s with 50%+ completion is claimed to get the strongest push **(practitioner claim)** ([SocialPilot, Aug 2026](https://www.socialpilot.co/blog/twitter-algorithm)).
- **For OWN A CAR:**
  - The launch video: the car, then one brass key turning, then a wall of 6,000 key hooks, then names being printed on the wrap. Under 45 seconds, silent-friendly, first frame already beautiful.
  - A second asset: a single photo of the brass key numbered "No. 0001" on black velvet. That becomes the reply and quote image.

### 3.4 The debate and quote-tweet dynamic

- Quote-tweets are how absurd objects spread. Satan Shoes, Birkinstocks, Friend and Cluely were all carried by people quote-tweeting to argue.
- **But negative signals are penalized hard.** In the 2023 heavy ranker, negative feedback (show less, block, mute) weighed −74 and a report weighed −369, against 0.5 for a like ([twitter/the-algorithm-ml](https://github.com/twitter/the-algorithm-ml/blob/main/projects/home/recap/README.md)). The 2026 ranker keeps negative weights for "not interested, mute, block, report, not dwelled."
- The goal is *debate about the idea* ("is this art?", "what does owning mean?"), not *anger at the audience* (rage bait, insults) and not *fear of fraud* (reports).
- **Built-in debate prompts for OWN A CAR:**
  - "Is it ownership if 6,000 people own it?"
  - "Is a key without a car-start a key?"
  - "Would you rather own 1/6000 of a Lamborghini or 100% of a Corolla?"
  - "Is this better or worse than a $6.2M banana?"

### 3.5 Scarcity vs spectacle

- MSCHF used scarcity: 24 or 666 pairs, sold out in a minute.
- OWN A CAR has **no cap**, so it's a spectacle-plus-threshold model, like ConstitutionDAO, Duolingo XP or Exploding Kittens.
- The tension to post about is not "will you get one" but "**will it happen at all**." The all-or-nothing goal is the scarcity.
- Kickstarter data backs this up: backers cluster in the first and last week, and contributions accelerate as the goal nears ([Kuppuswamy & Bayus](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2234765)). "If you get one backer, your chances of more jump from 39% to 70%" (Kickstarter-sourced stat via [PledgeBox](https://www.pledgebox.com/post/review-of-kickstarter), **unverified** primary).
- Low numbered keys (No. 0001–0100) are a legitimate soft-scarcity hook: first-come numbering, not a prize.

### 3.6 Founder account vs brand account

- **The founder (Oscar) is the protagonist.** Every 2024–26 example launched from a person.
  - Friend and Cluely: the founders' faces are in the video.
  - Arc: "The founders announce product launches and features from their accounts."
  - A Princeton freshman who "bought a Lamborghini for 6,000 people" is the press angle, like the Million Dollar Homepage's "student in debt."
- **The brand (@ownacar) is the deadpan institution, the registrar.** It posts:
  - the counter
  - key numbers ("Key No. 0412 issued to @handle")
  - certificates
  - "The car is fine." status updates
  - replies in formal voice
- **Sequencing:** Oscar posts the root and the brand quote-tweets it with the counter, or the reverse. Premium accounts get prioritized reply placement, which matters for the brand's FAQ replies.
- Put Premium on **both** accounts. Buffer (18.8M posts) found Premium accounts get about 6x the reach of free ones, and Premium+ about 15x ([Buffer via search](https://buffer.com/resources/x-premium-review/), [Social Media Today](https://www.socialmediatoday.com/news/report-shows-paying-for-x-twitter-premkum-has-significant-reach-benefits/801881/)).

### 3.7 Timing (day and hour)

- **Buffer 2026 (8.7M X posts):** best slots are Tue 9am, Wed 10am and Wed 9am; 9–11am is the most reliable window every weekday ([socialk.it summary](https://socialk.it/en/best-time-to-post/x)).
- **Sprout Social 2026 (about 2B engagements, Nov 2025–Feb 2026):** Tue–Thu 12–6pm ([Sprout](https://sproutsocial.com/insights/best-times-to-post-on-twitter/)). The reconciled advice is "publish late morning, harvest the afternoon."
- **Calendar around the launch:**
  - Nov 9, 2026 is a **Monday**.
  - The US midterms are Tue Nov 3, so the political news cycle will still be loud.
  - Nov 11 is Veterans Day.
  - Black Friday is Nov 27, when CAH-style stunts compete.
- **Recommendation:** go live Tue Nov 10, 9:30–10:00am ET (still morning in Europe, and US college students are awake). If Nov 9 is locked, post at 10:00am ET, not early morning. Do not launch on a weekend. Arc Search's Sunday launch worked because the account already had a large audience.
- Keep the campaign short. A study of 48,500 projects found shorter campaigns succeed more often because long ones "signify a lack of confidence" (via [CXL](https://cxl.com/blog/crowdfunding-campaigns/)). Aim for 14–30 days with a hard deadline, and put the deadline in the hook.

### 3.8 First-hour reply strategy

- Practitioner consensus is that the first 15–60 minutes decide whether a post breaks out of the follower pool; the score reportedly halves about every 6 hours **(practitioner claim)** ([OpenTweet](https://opentweet.io/blog/how-twitter-x-algorithm-works-2026)).
- The only hard number is 2023's "reply engaged by author" weight of 75. It is the largest positive weight in that config.
- **Playbook:**
  1. **T+0:** Oscar posts the root. **T+30s:** the first self-reply carries the link and the one-line FAQ. **T+60s:** @ownacar quote-posts with "Key No. 0001 has been issued." and the key photo.
  2. **T+0 to T+120 min:** both accounts reply to every substantive reply in deadpan voice. Target 50–150 replies. Answer skeptics first, because a visible "is this a scam?" left unanswered is a report magnet.
  3. Keep 10–15 pre-written answers ready for predictable questions: scam, legality, "I can't drive it?", "where does the money go?", "what if you don't hit 6,000?", "MSCHF did this", "why a Lamborghini?"
  4. At T+60 to 90 min, post the first counter update as a self-reply ("Keys issued: 412"). It gives the thread new activity.
  5. Do not like-farm, do not ask for reposts, and do not follow-for-follow.

### 3.9 Seeding and DM strategy (pre-launch, the week before)

- **Nothing went viral from zero.** Exploding Kittens had The Oatmeal's audience. Pieter Levels had 600k followers built over 10 years. Big Red Boots had Fashion Week celebrities. ConstitutionDAO started when a core member tweeted "DM me."
- **Seeding plan (no paid posts, no asks to "RT"):**
  - DM 30–60 people *personally* with a private preview (the video plus key photo) and the time of launch. Ask for "honest reaction," not reposts. Targets:
    - design and art Twitter (people who covered MSCHF)
    - car and supercar accounts
    - Princeton and Ivy-student accounts
    - indie-maker accounts
    - newsletter writers (Garbage Day, Trung Phan, Not Boring each covered ConstitutionDAO or MSCHF-style stunts)
  - **Pre-sell the first 100–300 keys privately**, from friends, classmates and early DMs, *at launch minute*, so the first counter update isn't "3." ConstitutionDAO and Exploding Kittens both show early momentum drives more momentum.
  - Pitch a press embargo (**unverified** that these outlets would bite) to 2–3 art and design outlets (Hypebeast, Highsnobiety, Dezeen, Artnet) and the Daily Princetonian, lifting at launch hour. The Million Dollar Homepage only exploded after a press release.
- **Disclosure:** anyone who received a free key or preview and posts about it should say so. It protects against "astroturf" call-outs.

### 3.10 Brand-to-brand and quote-bait

- Duolingo's death campaign spread through other brands joining in the replies.
- For OWN A CAR:
  - Deadpan replies from @ownacar to big car, art and luxury accounts. Only where relevant, and never spam; X now uses Grok to detect engagement farming (Bier, 2026, [X](https://x.com/muskonomy/status/2028467036154958136)).
  - One well-placed reply under a viral car post beats 50 generic ones.

---

## 4. Algorithm notes (dated and sourced)

| Date | What | Source | Confidence |
|---|---|---|---|
| **Apr 5, 2023** | Open-sourced heavy-ranker weights: like 0.5, retweet 1, reply 13.5, profile click then engage 12, good click 11, **reply engaged by author 75**, negative feedback **−74**, report **−369**, video playback ≥50% 0.005 | [twitter/the-algorithm-ml README](https://github.com/twitter/the-algorithm-ml/blob/main/projects/home/recap/README.md) | High (primary), but it is the 2023 system |
| 2023 | Premium ("Blue verified") boost reported as 4x in-network and 2x out-of-network | Code discussion, via [Buffer](https://buffer.com/resources/x-premium-review/) | Medium |
| **Apr 25, 2025** | Musk: "there is no explicit rule limiting the reach of links in posts… the algorithm tries to maximize user-seconds… Best to post a text/image/video summary." | [X](https://x.com/elonmusk/status/1915806794393457034) | High (primary) |
| **Mar 2025 onward** | Buffer: link posts from free accounts have **0% median engagement** after March 2025; Premium link posts about 0.28% (18.8M posts, 71k accounts) | [Buffer: links on X](https://buffer.com/resources/links-on-x/) (via search snippet) | Medium-high |
| 2025 | Buffer: Premium gets about 6x the reach of free, Premium+ about 15x | [Buffer: Premium review](https://buffer.com/resources/x-premium-review/) | Medium-high |
| **Sep 2025** | Musk: "The algorithm will be purely AI by November… open source every two weeks or so." | [X](https://x.com/elonmusk/status/1969081066578149547) | High |
| **Oct 12–13, 2025** | Bier: purged 1.7M reply-spam bots. Announced a new link-sharing test "to ensure all content… has equal visibility." | [X](https://x.com/nikitabier/status/1977446408136650785), [X](https://x.com/nikitabier/status/1977422602328232415) | High |
| **Oct 17–18, 2025** | Musk: "deletion of all heuristics within 4 to 6 weeks. Grok will literally read every post and watch every video." | [X](https://x.com/elonmusk/status/1979217645854511402) | High |
| **Oct 2025** | Bier: iOS in-app browser keeps the like/reply bar visible. "posts with links tend to get lower reach… because the web browser covers the post and people forget to Like or Reply." | [X](https://x.com/nikitabier/status/1979994223224209709), [Social Media Today](https://www.socialmediatoday.com/news/x-formerly-twitter-testing-links-in-app-link-post-penalties/803176/) | High |
| **Nov 2025** | Following feed also ranked by Grok, with a chronological option still available | [Social Media Today](https://www.socialmediatoday.com/news/x-formerly-twitter-sorts-following-feed-algorithm-ai-grok/806617/) | High |
| **Jan 2026** | xAI open-sources the Grok/"Phoenix" For You ranker. Score = Σ weight × P(action). Actions: like, reply, repost, quote, share, share via DM, share via copy link, clicks, video quality view, dwell, follow; negatives: not interested, mute, block, report, not dwelled. Adjustments: author-diversity decay, **out-of-network discount**, **new-author boost**. Published weights default to 0.0, and real values are set in private config. | [xai-org/x-algorithm](https://github.com/xai-org/x-algorithm) (README dated Aug 13, 2026 when fetched), [Publora](https://publora.com/blog/x-algorithm-open-source) | High on structure; weights unknown |
| **Jan 15, 2026** | X revokes API access for "infofi" pay-to-post apps (Kaito etc.) to curb reply spam | [Bankr summary on X](https://x.com/bankrbot/status/2011884821291950350) | Medium (secondary) |
| **Feb 2026** | Community posts visible to all and eligible for For You | [search summary](https://www.teract.ai/resources/twitter-algorithm-2026) | Low-medium **(practitioner claim)** |
| **~Apr 2026** | Bier: "1. Links were never 'deboosted' 2. They received lower engagement because websites cover the very buttons… 3. Today, the buttons are no longer covered, so links now have the same shot" | [X](https://x.com/nikitabier/status/2041911302541730237) | High (primary; date inferred from post ID) |
| **Jul 2026** | Soliciting engagement 3+ times leads to removal from creator rev share and referral for suspension; about 4,000 accounts removed | [Backpack](https://learn.backpack.exchange/articles/nikita-bier-crypto-twitter) | Medium (secondary) |
| **Jul 28, 2026** | Bier to Zuckerberg: "you do not need to put the links in replies anymore." Musk confirmed no link penalty "for more than a year." | [X](https://x.com/nikitabier/status/2082217171506344297), [AdTechRadar](https://adtechradar.com/2026/07/28/x-throttling-posts-with-links/) | High |

**What this means for OWN A CAR:**
1. **Links:** officially neutral as of July 2026, but a link card replaces the video, and video drives dwell and watch-quality predictions. **Root post: video, no link. First self-reply: the link.** Once the launch is running, milestone posts can include the link directly.
2. **Replies from the author are the strongest *known* positive signal.** Staff the first two hours.
3. **Avoid actions that trigger reports, mutes or "not interested":**
   - no giveaways or "win" language (which reads as scam or engagement bait)
   - no mass-tagging
   - no copy-paste replies
4. **The out-of-network discount means quote-tweets and reposts by *other* people are what break you out.** Seeding matters more than posting volume.
5. **The new-author boost helps @ownacar:** a new account with low impressions gets a lift. Use the brand account for real content, not only reposts.
6. **Author-diversity decay** means posting 10 times an hour from one account hurts each post. Space brand posts at 2–4 hours or more, and use self-replies for rapid updates.

---

## 5. Failure modes and how to pre-empt them

| Failure | What happened | Lesson for OWN A CAR |
|---|---|---|
| **ConstitutionDAO refunds** (2021) | Lost the auction. Refunds cost gas, often about $50–60, on a $206 median donation, so small donors lost most of their money. About $23M sat unclaimed for weeks. Then a token controversy. ([The Defiant](https://thedefiant.io/news/nfts-and-web3/constitutiondao-refunds-gas-fees), [Vice](https://www.vice.com/en/article/constitutiondao-aftermath-everyone-very-mad-confused-losing-lots-of-money-fighting-crying-etc/)) | **Guarantee a 100% refund, automatic, to the original card, with the project absorbing processor fees.** State this in the first reply. Better: authorize now and capture only on success, or hold funds in escrow (check with the payment processor). |
| **Spice DAO / Dune bible** (2022) | Bought a $3M book believing it came with IP rights, and was widely mocked ([CBR](https://www.cbr.com/jodorosky-dune-auction-crypto-group-mocked-ip-rights/)) | **Say exactly what "own" means.** You get a key, a certificate and your name on the wrap. You do not get to drive it, sell it, or receive any money from it. The honesty is the art. |
| **Key4All ending** (2022–23) | The car traveled, then was impounded | Publish the car's custody plan: where it's stored, insurance, how often it's shown, and what happens in 1, 5 and 10 years. |
| **Satan Shoes lawsuit** (2021) | Nike sued for trademark, MSCHF settled and bought the shoes back ([CBS](https://www.cbsnews.com/news/lil-nas-x-shoe-nike-settles-with-company-that-produced-satan-shoes/)) | **Don't use Lamborghini's logo, bull or wordmark as brand elements.** Say "a real Lamborghini" factually, and add "not affiliated with Automobili Lamborghini" on the site and certificate. Get counsel on the wrap design if it shows the badge. |
| **NFT-era "own a piece" projects** (2021–22) | Celebrity projects sued as unregistered securities or pump-and-dumps (BAYC suit, Logan Paul's CryptoZoo) ([Art Newspaper](https://www.theartnewspaper.com/2022/12/14/celebrities-accused-fraud-bored-ape-yach-club-nft-lawsuit-celebrities)). Fractional car-share platforms like Rally carry real securities regulation and poor returns ([Hagerty](https://www.hagerty.com/media/news/investing-shares-of-collector-cars-rally-road/)). | **Never say invest, profit, return, share, stake, token, appreciate, resale or floor.** No secondary market, no transferable "share." Frame it like CAH's land or Cattelan's certificate: symbolic, documentary ownership as an artwork. |
| **$HAWK memecoin** (Dec 2024) | Launched, spiked to $500M, crashed 90% within hours, then insider allegations and lawsuits ([Forbes](https://www.forbes.com/sites/conormurray/2024/12/05/hawk-tuah-creator-haliey-welch-criticized-for-chaotic-memecoin-launch-in-latest-bizarre-internet-stunt/)) | No token, no crypto, no "early holder" advantage. The key number is only an edition number. |
| **Coolest Cooler** (2014–19) | Raised $13M; 20,000+ backers never got their reward ([GeekWire](https://www.geekwire.com/2019/coolest-cooler-shuts-5-year-saga-leaving-20000-backers-without-kickstarter-reward/)) | **Show the brass key is real and costed before launch.** Say the fulfilment window, and budget the metal cost of 6,000+ keys *per key*, since there's no cap. |
| **Humane launch video** (2023) | Factual errors inside the hero video were clipped and dunked ([SFGate](https://www.sfgate.com/tech/article/humane-ai-pin-false-info-video-18483434.php)) | Every claim in the video has to be literally true: the car exists, the key is brass, the goal is 6,000. |
| **Friend subway ads** (2025) | Mass vandalism: "stop profiting off of loneliness" ([Futurism](https://futurism.com/artificial-intelligence/million-dollar-ai-campaign-defaced)) | Expect "rich kid / wasteful / money should go to charity" takes. Have a CAH-style deadpan line ready, and consider a transparent allocation (e.g., a public cost breakdown). |
| **Raffle or sweepstakes confusion** | Key4All's "whoever finds it keeps it" had a prize element | Never say win, raffle, draw, prize or lucky. All keys are identical in rights, so there is no chance element. |
| **Engagement-farming enforcement** (2026) | X removes accounts that solicit engagement | No "reply with your key number for a follow," no giveaways for reposts. |

**Pre-emptive FAQ block (pin as the second self-reply and on the site):**
- **What do I get?** A numbered brass key, a certificate, and your name printed on the car.
- **Can I drive it?** No. You own it the way everyone owns it.
- **What if you don't reach 6,000?** Everyone is refunded in full, automatically.
- **Is this an investment?** No. It is an artwork. There is nothing to sell.
- **Where is the car?** [storage / exhibition plan]
- **Who's behind it?** Oscar Lu, artist, Princeton. [link to statement]
- **Is this affiliated with Lamborghini?** No.

---

## 6. The framework: templates and OWN A CAR examples

Voice rules:
- Deadpan and luxury-institutional.
- Lowercase or sentence case. No exclamation marks. One emoji at most, ideally none.
- Numbers as numerals.
- **Banned words:** investment, invest, profit, return, win, winner, raffle, prize, lucky, share(s), token, stake, flip, resale, floor.

### (a) The launch thread (root plus 5 self-replies)

| Slot | Purpose | Rule |
|---|---|---|
| **Root** | Hook plus native video | 1–2 lines, under 120 characters, no link. The video starts on the car. |
| **R1** (T+30s) | The mechanic in 3 short lines, plus the link | $50, a key, "everyone owns it", all-or-nothing, deadline, link |
| **R2** | What you get | key, certificate, name on the car, one photo of the key |
| **R3** | The honest "no" list | not an investment, can't drive it, nothing to sell, not affiliated |
| **R4** | The all-or-nothing and refund guarantee | 6,000 or full refund; the counter lives at [site] |
| **R5** | The artist line | one sentence of intent, plus a pointer to @ownacar for the count |

**Example 1 (from Oscar):**

> **Root:** I bought a Lamborghini. You can own it for $50.
> *[video, 30s: car in a white room, then a brass key turned in the door, then a wall of numbered keys, then names being printed onto the wrap]*
>
> **R1:** $50 buys a brass key to the car. There is no limit on keys. Everyone who holds one owns it. If 6,000 keys aren't claimed by Dec 9, everyone is refunded. ownacar.com
>
> **R2:** You get: a numbered brass key, a certificate of ownership, and your name printed on the car. *[photo: Key No. 0001 on black velvet]*
>
> **R3:** You do not get: to drive it, to sell your part of it, or any money from it. It is not an investment. It is a car that 6,000 people own.
>
> **R4:** 6,000 keys or nothing. The count is public: @ownacar
>
> **R5:** I wanted to know what ownership means when nobody can use the thing and everybody has the key.

**Example 2 (quieter variant):**

> **Root:** one car. unlimited owners.
> *[video]*
>
> **R1:** $50. a brass key. your name on the car. 6,000 keys or everyone gets their money back. ownacar.com

### (b) The single-post version (for the brand account, reposts and press)

Structure: **[Impossible ownership claim]. [Price]. [Condition].** Media is a single image or video. The link goes in a reply.

> A Lamborghini, owned by everyone who has $50.
> 6,000 keys or it doesn't happen.
> *[photo: the car with an empty name-grid wrap]*

> Now accepting owners.
> $50. One key. Same car.
> *[photo: brass key, "No. 0001"]*

### (c) Quote-tweet and reply-bait posts (debate about the idea, never the audience)

Structure: a **binary or philosophical question** plus one deadpan line, with an image. Post every 2–3 days, from Oscar (question) or the brand (statement).

> Would you rather own 100% of a Corolla or 1/6000th of a Lamborghini.

> A banana with a certificate sold for $6.2M. This is a Lamborghini with a certificate for $50. We are not going to explain the art market to you.

> Is it ownership if you can't drive it. (You can't drive yours either. It's in traffic.)

Replies to critics (@ownacar voice):
- "Is this a scam?" → "If we don't reach 6,000, you get all $50 back. If we do, you get a key, a certificate, and your name on a Lamborghini. That is the whole thing."
- "Why not give it to charity?" → "You can. It's your $50." (CAH lineage)
- "MSCHF did this." → "They gave 1,000 people a PT Cruiser and made them fight for it. This one is shared."
- "Can I drive it?" → "No. Nobody can. That's what makes it fair."

### (d) Milestone and counter posts

Structure: **bare number** (Cybertruck "250k" style), then **one deadpan status line**, then optionally a photo of the key or a name on the wrap. Post from @ownacar. Oscar quote-posts the big ones (1,000 / 3,000 / 6,000).

Planned beats: first key, 100, 500, 1,000, 2,000, 3,000 (halfway), 4,500, 5,000, 5,500, 5,900, 5,999, 6,000.

> 1,000.
> The car now has more owners than most companies have employees.

> 3,000 owners. Halfway.
> The car is aware.

> Key No. 4,812 has been issued. The car has no comment.

> 6,000.
> It's yours. All of you.
> *[video: the final name printed on the wrap]*

After the goal, keep counting. There's no cap, so every extra owner is a name:

> 6,001. Welcome. There's room on the roof.

### (e) Countdown posts

Structure: **T-minus / time left**, then **keys remaining to goal**, then **the consequence of failure, stated flatly**. The goal gradient means these are the highest-leverage posts. Use them in the final 72 hours, and daily in the last week.

> 72 hours.
> 1,140 keys to go.
> If we don't get there, the car goes back to having one owner.

> Tomorrow at midnight the car either belongs to 6,000 people or to nobody. 212 keys left.

> 11:00pm. 38 keys. We are not sending another reminder.

Pre-launch teasers (T-7 to T-1, from Oscar, no explanation):
- Image of a single brass key on black, caption "Nov 10."
- A photo of the car under a sheet, caption "It needs owners."
- Video of 6,000 blank key tags, caption "these are yours. you just don't know it yet."

---

## 7. Sources

Case studies
- https://key4all.com/
- https://www.highsnobiety.com/p/mschf-key-4-all-car-game-gta-drop-game/
- https://hypebeast.com/2022/9/mschf-1000-keys-shared-mystery-car
- https://secretnyc.co/mschf-keys4all-nyc/
- https://mobokey.com/key4all-car-sharing-powered-mschf/
- https://www.cbsnews.com/news/nike-air-max-97-jesus-shoes-filled-with-holy-water-selling-for-4000-2019-10-11/
- https://www.campaignlive.com/article/mschf-inject-nikes-holy-water-call-jesus-shoes-sell-2k/1661884
- https://www.cbsnews.com/news/lil-nas-x-shoe-nike-settles-with-company-that-produced-satan-shoes/
- https://www.highsnobiety.com/p/mschf-lil-nas-x-nike-air-max-97-satan-release-info/
- https://www.thefashionlaw.com/mschf-drops-the-most-exclusive-sandals-ever-made-theyre-called-birkinstocks/
- https://www.cnn.com/style/article/mschf-birkinstock-from-birkin-bags
- https://edition.cnn.com/style/article/mschf-big-red-boots/index.html
- https://hypebae.com/2023/2/mschf-big-red-boots-images-sarah-snyder-campaign-release-info
- https://www.linkedin.com/pulse/secret-sauce-virality-how-mschfs-big-red-boots-alain-van-den-donk
- https://startupspells.com/p/marketing-mschf-emotion-first-playbook-behind-viral-hits
- https://thehustle.co/02042020-mschf-marketing-commentary
- https://www.npr.org/sections/thetwo-way/2016/11/27/503502142/people-donated-nearly-100-000-to-dig-a-big-pointless-hole-in-the-ground
- https://www.tubefilter.com/2016/11/28/cards-against-humanity-holiday-hole/
- https://www.cnn.com/2017/11/15/us/cards-against-humanity-land-grab-trnd
- https://techcrunch.com/2024/09/20/cards-against-humanity-sues-elon-musks-spacex-for-trespassing/
- https://www.cahsuesmusk.com/
- https://www.inc.com/business-insider/cards-against-humanity-sold-nothing-on-black-friday-for-5-dollars.html
- https://resellcalendar.com/news/news/cards-humanity-black-friday-99-percent-sale-reseller/
- https://en.wikipedia.org/wiki/The_Million_Dollar_Homepage
- https://www.webdesignmuseum.org/gallery/the-million-dollar-homepage-2005
- https://en.wikipedia.org/wiki/R/place
- https://en.wikipedia.org/wiki/One_Million_Checkboxes
- https://www.bryanbraun.com/2024/08/10/one-million-checkboxes-and-the-fear-of-viral-success/
- https://en.wikipedia.org/wiki/ConstitutionDAO
- https://www.notboring.co/p/lets-buy-the-us-constitution
- https://www.readtrung.com/p/constitutiondao
- https://www.cnbc.com/2019/11/27/elon-musk-suggests-tesla-received-250000-pre-orders-for-cybertruck.html
- https://abcnews.com/Business/elon-musk-explains-cybertrucks-armor-glass-windows-shattered/story?id=67316874
- https://x.com/AviSchiffmann/status/1818284595902922884
- https://en.wikipedia.org/wiki/Friend_(product)
- https://futurism.com/artificial-intelligence/million-dollar-ai-campaign-defaced
- https://x.com/im_roy_lee/status/1914061483149001132
- https://techcrunch.com/2025/04/21/columbia-student-suspended-over-interview-cheating-tool-raises-5-3m-to-cheat-on-everything/
- https://levels.io/fly-pieter-com-vibecoded-flight-simulator
- https://dev.to/promptway/he-built-a-flight-simulator-in-three-hours-and-hit-1m-a-year-in-17-days-then-it-went-to-zero-1b1l
- https://www.npr.org/2025/02/13/nx-s1-5295597/duolingo-owl-mascot-death
- https://npr.org/2025/02/26/nx-s1-5309785/duolingo-owl-mascot-lives
- https://www.meltwater.com/en/blog/duolingo-dead-mascot-campaign
- https://www.prdaily.com/duolingo-shares-pr-secrets-of-viral-death-of-duo-campaign/
- https://www.fastcompany.com/91013196/how-design-drove-10m-in-pre-orders-for-rabbit-r1-ai-hardware
- https://the-decoder.com/rabbits-r1-ai-first-hardware-sold-out-the-first-three-batches-in-days/
- https://www.sfgate.com/tech/article/humane-ai-pin-false-info-video-18483434.php
- https://www.dexerto.com/tech/marques-brownlee-slams-humane-ai-pin-as-the-worst-product-hes-ever-reviewed-2646829/
- https://www.npr.org/2024/11/21/nx-s1-5199568/a-duct-taped-banana-sells-for-6-2-million-at-an-art-auction
- https://hongkongfp.com/2024/11/30/crypto-boss-justin-sun-eats-banana-art-he-bought-for-us6-2-million/
- https://en.wikipedia.org/wiki/Exploding_Kittens
- https://www.kickstarter.com/blog/exploding-kittens-is-the-most-backed-project-of-all-time
- https://research.contrary.com/company/the-browser-company
- https://www.lennysnewsletter.com/p/competing-with-giants-an-inside-look
- https://www.news.aakashg.com/p/how-linear-grows

Algorithm and timing
- https://github.com/xai-org/x-algorithm
- https://github.com/twitter/the-algorithm-ml/blob/main/projects/home/recap/README.md
- https://x.com/elonmusk/status/1915806794393457034
- https://x.com/elonmusk/status/1969081066578149547
- https://x.com/elonmusk/status/1979217645854511402
- https://x.com/nikitabier/status/1977422602328232415
- https://x.com/nikitabier/status/1977446408136650785
- https://x.com/nikitabier/status/1979994223224209709
- https://x.com/nikitabier/status/2041911302541730237
- https://x.com/nikitabier/status/2082217171506344297
- https://adtechradar.com/2026/07/28/x-throttling-posts-with-links/
- https://www.socialmediatoday.com/news/x-formerly-twitter-testing-links-in-app-link-post-penalties/803176/
- https://www.socialmediatoday.com/news/x-formerly-twitter-switching-to-fully-ai-powered-grok-algorithm/803174/
- https://www.socialmediatoday.com/news/x-formerly-twitter-sorts-following-feed-algorithm-ai-grok/806617/
- https://www.socialmediatoday.com/news/report-shows-paying-for-x-twitter-premkum-has-significant-reach-benefits/801881/
- https://buffer.com/resources/links-on-x/
- https://buffer.com/resources/x-premium-review/
- https://buffer.com/resources/state-of-social-media-engagement-2026/
- https://sproutsocial.com/insights/best-times-to-post-on-twitter/
- https://socialk.it/en/best-time-to-post/x
- https://www.socialpilot.co/blog/twitter-algorithm
- https://publora.com/blog/x-algorithm-open-source
- https://opentweet.io/blog/how-twitter-x-algorithm-works-2026
- https://learn.backpack.exchange/articles/nikita-bier-crypto-twitter
- https://x.com/bankrbot/status/2011884821291950350
- https://x.com/muskonomy/status/2028467036154958136

Crowdfunding psychology
- https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2234765
- https://cxl.com/blog/crowdfunding-campaigns/
- https://help.kickstarter.com/hc/en-us/articles/115005047893-Why-is-funding-all-or-nothing

Failure modes
- https://thedefiant.io/news/nfts-and-web3/constitutiondao-refunds-gas-fees
- https://www.vice.com/en/article/constitutiondao-aftermath-everyone-very-mad-confused-losing-lots-of-money-fighting-crying-etc/
- https://www.cbr.com/jodorosky-dune-auction-crypto-group-mocked-ip-rights/
- https://www.theartnewspaper.com/2022/12/14/celebrities-accused-fraud-bored-ape-yach-club-nft-lawsuit-celebrities
- https://www.hagerty.com/media/news/investing-shares-of-collector-cars-rally-road/
- https://www.forbes.com/sites/conormurray/2024/12/05/hawk-tuah-creator-haliey-welch-criticized-for-chaotic-memecoin-launch-in-latest-bizarre-internet-stunt/
- https://www.geekwire.com/2019/coolest-cooler-shuts-5-year-saga-leaving-20000-backers-without-kickstarter-reward/
