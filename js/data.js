// Single source of truth for the whole site.
// Both the story (index.html) and the resume (resume.html) render from this file.
// Edit words here, not in the HTML.
//
// Lines marked "UNCONFIRMED" are still open in story/oscar-story-dossier.md. Check them before sharing widely.

window.SITE = {
  person: {
    name: "Oscar Lu",
    tagline: "I cold-emailed Harvard Basketball at 13. They said yes.",
    subtitle: "A life in seven chapters. Scroll.",
    thesis: "Getting things done has always been my motto.",
    location: "Los Angeles → Princeton",
    email: "ol7039@princeton.edu",
    links: [
      { label: "Instagram", url: "https://www.instagram.com/oscarl.u/" },
      { label: "GitHub", url: "https://github.com/oscar598" },
      { label: "LinkedIn", url: "https://www.linkedin.com/in/oscarlu23/" },
    ],
  },

  // The story. Each chapter is one full-screen scene.
  chapters: [
    {
      id: "origin",
      years: "2008–2020",
      yearMark: 2008,
      place: "Los Angeles, CA",
      title: "The hustle before the hustle",
      body: [
        "I grew up in LA with my twin brother, Victor. At 8 I was selling orange juice. At 10 it was phone accessories on eBay.",
        "Money was tight. Before boarding school I slept in the living room and biked an hour to school, which is exactly why I learned to make things happen myself.",
      ],
      proof: ["Orange juice stand, age 8", "eBay store, age 10", "A Better Chance Scholar, 2018"],
      quote: "",
      image: { src: "", alt: "Oscar as a kid in Los Angeles", idea: "Childhood photo in LA: the beach, or the orange juice stand if one exists" },
    },
    {
      id: "spark",
      years: "2020–2021",
      yearMark: 2020,
      place: "Home, lockdown",
      title: "Stuck at home with Photoshop",
      body: [
        "COVID locked me inside in 7th grade, so I taught myself Photoshop by reverse-engineering NBA graphics.",
        "A Michael Pittman Jr. fan page grew into @mpjgfx, a 2,000-member sports design community with free resources and contests. My first paid design came in February 2021. I spent all of it on candy.",
      ],
      proof: ["2,000+ community members", "First paid design, Feb 2021"],
      quote: "",
      image: { src: "", alt: "Early sports graphic from the @mpjgfx era", idea: "Screenshot of an early fan-page graphic, shown inside a phone frame" },
    },
    {
      id: "cold-email",
      years: "2021–2022",
      yearMark: 2021,
      place: "Cambridge, MA (by email)",
      title: "Harvard said yes",
      body: [
        "At 13, with an improvised portfolio, I emailed Harvard Men's Basketball. A few emails later we were on a call, and by the end of it we were in business: four years of recruiting graphics, social and arena work.",
        "At 14 I turned it into Oscar Lu Design Co. I led a four-person team, worked with Big Baller Brand, and ran it to five-figure profit before closing it after high school.",
      ],
      proof: ["4-year client: Harvard Men's Basketball", "Big Baller Brand", "Five-figure profit"],
      quote: "That one bold move gave me the confidence to launch my own design agency.",
      image: { src: "", alt: "Harvard Men's Basketball recruiting graphic designed by Oscar", idea: "Your best Harvard MBB graphic, full-bleed" },
    },
    {
      id: "ukraine",
      years: "2021–2025",
      yearMark: 2022,
      place: "Przemyśl, Poland → Dublin",
      title: "“What are you doing about it?”",
      body: [
        "When Russia invaded Ukraine, I told my dad that people only talked about standing with Ukraine. He asked what I was doing about it. Within a week we had raised money through our church, and we spent seven days at a refugee center in Przemyśl, Poland, on the Ukrainian border.",
        "Meanwhile I was building the tech behind International Youth Tobacco Control. I cold-emailed Google and Wix for funding and directed a WHO film that Dr. Tedros shared with 4M+ people.",
      ],
      proof: ["7 days · 14-hour shifts · 400 bedding sets a day", "$25K+ from Google & Wix", "WHO film shared to 4M+", "Presented at the World Conference on Tobacco Control, Dublin"],
      quote: "If you wanted to, you could. (Martin, a volunteer I met at the border)",
      image: { src: "", alt: "Refugee center in Przemyśl, Poland", idea: "Photo from Przemyśl, or the Dublin conference photo with the Taoiseach" },
    },
    {
      id: "farm",
      years: "2022–2026",
      yearMark: 2022,
      place: "Church Farm School, Exton, PA",
      title: "First night under the sheets",
      body: [
        "I arrived at an all-boys boarding school in Pennsylvania knowing nobody but my twin. The first night I hid under my sheets until classmates introduced themselves over fruit snacks.",
        "Four years later I gave the valedictorian speech. In between I revived the school magazine and got it printed for the first time in a decade, served as class co-president, captained lacrosse to the championship game, and built an outdoor program from zero into a J-Term course.",
      ],
      proof: ["Valedictorian · 4.0 · 1540 SAT", "DECA Pennsylvania State Champion", "Magazine EIC · 40-person team · $3K raised", "Lacrosse captain · All-League First Team"],
      quote: "",
      image: { src: "", alt: "Graduation at Church Farm School", idea: "Graduation photo, or you holding the first printed Griffin Review" },
    },
    {
      id: "tested",
      years: "2024–2025",
      yearMark: 2024,
      place: "Leadville, CO · West Point, NY",
      title: "Type Two fun",
      body: [
        "I spent a semester at the High Mountain Institute backpacking the Rockies and Utah's canyons, and summited a 14,000-foot peak in the dark to catch the sunrise.",
        "Then came West Point's Summer Leadership Experience, a documentary co-produced with Fast & Furious writer Kelly Turner, and Dublin. On weekends I caddied at Aronimink to help pay my own way.",
      ],
      proof: ["HMI semester, Leadville CO", "14er at sunrise", "West Point SLE", "Wiley Center documentary"],
      quote: "The kind of fun that tests you in the moment but shines in memory.",
      image: { src: "", alt: "Backpacking in the Colorado Rockies", idea: "Summit sunrise photo from HMI" },
    },
    {
      id: "now",
      years: "2026",
      yearMark: 2026,
      place: "Princeton, NJ",
      title: "Playing in the arena",
      body: [
        "This summer I sold cars at Toyota Southern California. Then I wanted to go backpacking, and three days later I was alone in Yosemite for a week.",
        "Now I'm at Princeton. In my first week the orientation socials were flat, so I pitched ten friends, had a slip 'n slide Instacarted to campus, and 200+ freshmen showed up.",
      ],
      proof: ["Princeton '30 · Economics", "Sales intern · Toyota SoCal", "Weeklong solo, Yosemite", "200+ at the slip 'n slide"],
      quote: "Gotta play in the arena if you want to get hit.",
      image: { src: "", alt: "Half Dome at sunrise", idea: "Your Yosemite footage: the Half Dome summit at first light" },
    },
  ],

  next: {
    title: "Next chapter: your team?",
    body: "I want to take action on things I'm not satisfied with, and give more than I take. If you're building something like that, let's talk.",
  },

  // The resume. Plain, printable, one page.
  resume: {
    headline: "Princeton '30 · Seeking internships",
    education: [
      {
        org: "Princeton University", place: "Princeton, NJ", dates: "May 2030",
        detail: "Intended A.B. in Economics · QuestBridge Finalist",
      },
      {
        org: "Harvard University, Summer School", place: "Cambridge, MA", dates: "Jul–Aug 2024",
        detail: "MGMT S-4105: Cultivating Authentic Leadership",
      },
      {
        org: "Church Farm School", place: "Exton, PA", dates: "May 2026",
        detail: "GPA 4.0 · SAT 1540 · Valedictorian · DECA Pennsylvania State Champion · Varsity Lacrosse Captain · Penn-Jersey All-League First Team · National Honor Society",
      },
    ],
    experience: [
      {
        role: "Founder & Creative Director", org: "Oscar Lu Design Co.", place: "Los Angeles, CA", dates: "Jun 2022 – 2026",
        bullets: [
          "Turned self-taught design skills into a business with five-figure profit, using a social-media portfolio and cold outreach to win Harvard Men's Basketball, Big Baller Brand, and other direct clients.",
          "Created brand identities, recruiting graphics, and uniform concepts; led a four-person team from pitch through final delivery.",
        ],
      },
      {
        role: "Sales Intern", org: "Toyota Southern California", place: "Costa Mesa, CA", dates: "Jun–Aug 2026",
        bullets: [
          "Opened conversations with walk-in customers, uncovered their needs and budgets, and guided them toward relevant vehicles.",
          "Qualified prospects and handed off leads to the sales team.",
        ],
      },
      {
        // UNCONFIRMED: caddie dates
        role: "Caddie", org: "Aronimink Golf Club", place: "Newtown Square, PA", dates: "2025 – 2026",
        bullets: [
          "Advised members at a Golf Digest Top 100 course and 2026 PGA Championship venue on club selection, strategy, and green reading.",
        ],
      },
    ],
    leadership: [
      {
        // UNCONFIRMED: exact title
        role: "Board Director & Former Global IT Director", org: "International Youth Tobacco Control", place: "Remote", dates: "2021 – Present",
        bullets: [
          "Built the website, shared workspace, and member database used by 200+ youth advocates across 60+ countries.",
          "Cold-emailed Google and Wix, led the resulting pitch meetings, and secured $25K+ in funding.",
          "Directed 14 contributors across seven countries on a WHO campaign amplified by Director-General Dr. Tedros to 4M+ people; selected to present at the World Conference on Tobacco Control in Dublin.",
        ],
      },
      {
        // UNCONFIRMED: exact years as class co-president
        role: "Class Co-President", org: "Church Farm School", place: "Exton, PA", dates: "2024 – 2026",
        bullets: [
          "Created an outdoor program from zero: recruited 15 students, secured funding, piloted camping trips, and persuaded leadership to establish an outdoor-education J-Term course.",
        ],
      },
      {
        role: "Editor-in-Chief", org: "The Griffin Review", place: "Exton, PA", dates: "2023 – 2026",
        bullets: [
          "Revived the school magazine and led a 40-person team; raised $3K to print it for the first time in a decade.",
        ],
      },
    ],
    skills: [
      "Adobe Premiere Pro, Photoshop, Illustrator, After Effects, Figma",
      // UNCONFIRMED: proficiency levels
      "Mandarin, Spanish",
    ],
    interests: "Golf, backpacking, surfing, hot yoga, consumer brands, sports and entertainment",
  },
};
