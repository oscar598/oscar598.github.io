// SC 07 · Yosemite: one photo cut into three depths (sky, ridges, Oscar).
// Pinned; scrolling dollies the camera in, so near layers grow faster than far ones.
// The pointer adds a little look-around on top.

import { reduceMotion } from "../core/util.js";

const { gsap } = window;

export function initYosemite() {
  const root = document.getElementById("yos");
  const $ = (s) => root.querySelector(s);
  const [sky, land, haze, me] = [".yos-sky", ".yos-land", ".yos-haze", ".yos-me"].map($);
  const caption = $(".yos-caption");
  const prints = root.querySelectorAll(".polaroid--yos");
  const story = root.querySelectorAll(".yos-story p");

  if (reduceMotion) {
    gsap.set([caption, ...prints, ...story], { opacity: 1 });
    return {};
  }

  // Phones show a narrow slice of the frame, so the dolly is gentler there.
  const build = (meScale, end) => {
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: root, start: "top top", end, pin: true, scrub: 0.6 },
    });
    tl.fromTo(sky, { scale: 1.02, yPercent: 0 }, { scale: 1.08, yPercent: 2 }, 0)
      .fromTo(land, { scale: 1.02, yPercent: 0 }, { scale: 1.2, yPercent: -3 }, 0)
      .fromTo(haze, { opacity: 0 }, { opacity: 0.55 }, 0)
      .fromTo(me, { scale: 1, xPercent: 0 }, { scale: meScale, xPercent: -2 }, 0)
      .fromTo(caption, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }, 0.1)
      .fromTo(story, { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.08, duration: 0.2, ease: "power2.out" }, 0.22)
      .fromTo(prints[0], { opacity: 0, y: 120, rotate: 12 }, { opacity: 1, y: 0, rotate: 5, duration: 0.35, ease: "power2.out" }, 0.45)
      .fromTo(prints[1], { opacity: 0, y: -80, rotate: -12 }, { opacity: 1, y: 0, rotate: -4, duration: 0.35, ease: "power2.out" }, 0.55);
  };
  const mm = gsap.matchMedia();
  mm.add("(min-width: 861px)", () => build(1.36, "+=160%"));
  mm.add("(max-width: 860px)", () => build(1.12, "+=120%"));

  // Look-around: inner images shift by depth as the pointer moves.
  if (matchMedia("(pointer: fine)").matches) {
    const layers = [
      [sky.querySelector("img"), 0.4],
      [land.querySelector("img"), 1],
      [me.querySelector("img"), 2.2],
    ].map(([el, depth]) => ({ x: gsap.quickTo(el, "x", { duration: 0.8, ease: "power3" }), y: gsap.quickTo(el, "y", { duration: 0.8, ease: "power3" }), depth }));
    root.addEventListener("pointermove", (e) => {
      const r = root.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5;
      const dy = (e.clientY - r.top) / r.height - 0.5;
      layers.forEach((l) => { l.x(-dx * 12 * l.depth); l.y(-dy * 6 * l.depth); });
    });
  }
  return {};
}
