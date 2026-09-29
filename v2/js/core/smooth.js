// Smooth scrolling (Lenis) wired into GSAP ScrollTrigger, plus a shared scroll-velocity value
// that other modules read (the rope swings with it, headings skew with it).

import { reduceMotion } from "./util.js";

const { gsap, ScrollTrigger } = window;
gsap.registerPlugin(ScrollTrigger);

export const scrollState = { velocity: 0, progress: 0 };
export let lenis = null;

export function initSmooth() {
  if (!reduceMotion && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
    lenis.on("scroll", (e) => {
      scrollState.velocity = e.velocity;
      scrollState.progress = e.progress;
      ScrollTrigger.update();
    });
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    let lastY = window.scrollY;
    window.addEventListener(
      "scroll",
      () => {
        scrollState.velocity = window.scrollY - lastY;
        lastY = window.scrollY;
      },
      { passive: true }
    );
  }
  // Velocity decays toward 0 when scrolling stops.
  gsap.ticker.add(() => {
    scrollState.velocity *= 0.9;
  });
}

export function scrollTo(target, opts = {}) {
  if (lenis) lenis.scrollTo(target, { duration: 1.4, ...opts });
  else {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    const y = typeof target === "number" ? target : el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: y, behavior: reduceMotion ? "auto" : "smooth" });
  }
}
