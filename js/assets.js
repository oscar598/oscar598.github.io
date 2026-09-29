// Media manifest for v2. Keys are referenced by data-asset="..." in index.html and by the scenes.
// Everything here is a PLACEHOLDER generated with Runway (see assets/PROMPTS.md) until you swap in
// your real photos. Leave a path empty to fall back to the procedural drawing.

window.ASSETS = {
  harvard:  { img: "assets/harvard.jpg", video: "", alt: "Clay basketball above a sliver of hardwood court (placeholder)" },
  yosemite: { img: "assets/yosemite.jpg", video: "assets/yosemite.mp4", alt: "Granite dome at first light (placeholder)" },
  origin:   { img: "assets/origin.jpg", video: "", alt: "Clay diorama of an LA orange juice stand (placeholder)" },
  farm:     { img: "assets/farm.jpg", video: "", alt: "Yearbooks, lacrosse stick and graduation cap (placeholder)" },
  ukraine:  { img: "", video: "", alt: "Refugee center, Przemyśl (placeholder)" },

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
