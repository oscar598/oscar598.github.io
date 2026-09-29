// Media manifest. Keys are referenced by data-asset="..." in index.html and by the scenes.
// Real photos come from Oscar's old Wix site (assets/photos/). Anything still marked
// "placeholder" was generated with Runway (see assets/PROMPTS.md); swap in a real photo anytime.
// Leave a path empty to fall back to the procedural drawing.

window.ASSETS = {
  // Real photos
  harvard:  { img: "assets/photos/harvard-jumbotron.jpg", alt: "Oscar's recruiting graphic on the video board at Harvard's Lavietes Pavilion", real: true },
  meeting:  { img: "assets/photos/harvard-meeting.jpg", alt: "Oscar meeting with Harvard Men's Basketball staff", real: true },
  mpj:      { img: "assets/photos/mpj-daily.jpg", alt: "An early MPJ Daily fan-page graphic", real: true },
  candy:    { img: "assets/photos/first-paycheck-candy.jpg", alt: "The candy bought with the first design paycheck", real: true },
  dublin:   { img: "assets/photos/dublin-conference.jpg", alt: "Oscar at the World Conference on Tobacco Control 2025 in Dublin", real: true },
  taoiseach:{ img: "assets/photos/dublin-taoiseach.jpg", alt: "Oscar with Taoiseach Micheál Martin in Dublin", real: true },
  farm:     { img: "assets/photos/griffin-review-2024.jpg", alt: "The Griffin Review, 2024 edition", real: true },
  portrait: { img: "assets/photos/portrait.jpg", alt: "Oscar Lu", real: true },

  // AI placeholders (Runway)
  yosemite: { img: "assets/yosemite.jpg", video: "assets/yosemite.mp4", alt: "Granite dome at first light (placeholder)" },
  origin:   { img: "assets/origin.jpg", alt: "Clay diorama of an LA orange juice stand (placeholder)" },
  ukraine:  { img: "", alt: "Refugee center, Przemyśl (placeholder)" },

  // Sculptural objects used as physics sprites (transparent PNGs, trimmed).
  sprites: {
    orange: "assets/sprites/orange.png",
    juice:  "assets/sprites/juice.png",
    box:    "", // procedural box keeps the "eBay" label
    phone:  "assets/sprites/phone.png",
    bike:   "", // procedural wheel has see-through spokes
    lax:    "assets/sprites/lax.png",
  },
};
