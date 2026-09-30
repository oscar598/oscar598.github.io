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
    // Pinned scenes grow the page after Lenis first measures it; re-measure whenever
    // ScrollTrigger re-lays out, or jumps get clamped to the old (shorter) page.
    ScrollTrigger.addEventListener("refresh", () => lenis.resize());
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

// A film "cut": flash to black, jump instantly, fade back in. Used for chapter navigation
// so jumping from 00 to 07 doesn't scroll through (and trigger) every scene in between.
let cutEl = null;
export function cutTo(target) {
  const el = typeof target === "string" ? document.querySelector(target) : target;
  if (!el) return;
  if (reduceMotion) {
    scrollTo(el, { immediate: true });
    return;
  }
  if (!cutEl) {
    cutEl = document.createElement("div");
    cutEl.className = "cut";
    document.body.appendChild(cutEl);
  }
  window.gsap
    .timeline()
    .to(cutEl, { opacity: 1, duration: 0.16, ease: "power2.in" })
    .add(() => {
      // A pinned section reports top=0 while pinned; its pin-spacer wrapper has the real position.
      const box = el.parentElement?.classList.contains("pin-spacer") ? el.parentElement : el;
      const y = box.getBoundingClientRect().top + window.scrollY;
      lenis?.resize();
      if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
      else window.scrollTo(0, y);
      window.ScrollTrigger.update();
    })
    .to(cutEl, { opacity: 0, duration: 0.45, ease: "power2.out", delay: 0.05 });
}

export function scrollTo(target, opts = {}) {
  if (lenis) {
    lenis.resize();
    lenis.scrollTo(target, { duration: 1.4, ...opts });
  }
  else {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    const y = typeof target === "number" ? target : el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: y, behavior: reduceMotion ? "auto" : "smooth" });
  }
}
