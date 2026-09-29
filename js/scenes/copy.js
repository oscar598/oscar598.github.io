// Fills every [data-chapter] block with that chapter's words from data.js,
// splits the headline into words, and animates them in on scroll.

import { esc, splitWords, reduceMotion } from "../core/util.js";
import { scrollState } from "../core/smooth.js";
import { sound } from "../core/sound.js";

const { gsap, ScrollTrigger } = window;

// Tiny clapperboard icon: the striped stick (top) hinges shut onto the slate.
const CLAPPER = `<svg class="clapper" viewBox="0 0 24 20" aria-hidden="true">
  <g class="clap-stick"><rect x="1" y="2" width="22" height="5" rx="1"/><path d="M5 2 8 7M11 2l3 5M17 2l3 5" stroke="var(--ink)" stroke-width="1.6"/></g>
  <rect x="1" y="8" width="22" height="11" rx="1.5"/>
</svg>`;

export function renderCopy(site) {
  document.querySelectorAll("[data-chapter]").forEach((block) => {
    const i = Number(block.dataset.chapter);
    const ch = site.chapters[i];
    if (!ch) return;
    const n = String(i + 1).padStart(2, "0");
    block.innerHTML = `
      <p class="label">${CLAPPER}SC. ${n} · ${esc(ch.years)}</p>
      <p class="place">${esc(ch.place)}</p>
      <h2>${esc(ch.title)}</h2>
      ${ch.body.map((line) => `<p class="line">${esc(line)}</p>`).join("")}
      <ul class="proof">${ch.proof.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
      ${ch.quote ? `<blockquote>“${esc(ch.quote)}”</blockquote>` : ""}
    `;
    // Year for the rope comes from the chapter; the section carries it.
    block.closest(".scene")?.setAttribute("data-year", ch.yearMark);

    const h2 = block.querySelector("h2");
    const words = splitWords(h2);
    if (reduceMotion) return;

    gsap.set(words, { yPercent: 110, rotate: 6, opacity: 0 });
    gsap.set(block.querySelector(".clap-stick"), { rotate: -32, transformOrigin: "0% 100%" });
    gsap.set(block.querySelectorAll(".line, .proof li, blockquote, .label, .place"), { y: 24, opacity: 0 });

    ScrollTrigger.create({
      trigger: block,
      start: "top 80%",
      once: true,
      onEnter: () => {
        // Clapperboard snaps shut as the chapter begins.
        const stick = block.querySelector(".clap-stick");
        if (stick) {
          gsap.fromTo(
            stick,
            { rotate: -32, transformOrigin: "0% 100%" },
            { rotate: 0, transformOrigin: "0% 100%", duration: 0.22, delay: 0.1, ease: "power4.in", onComplete: () => sound.clap() }
          );
        }
        gsap.to(words, { yPercent: 0, rotate: 0, opacity: 1, duration: 1, stagger: 0.06, ease: "expo.out" });
        gsap.to(block.querySelectorAll(".label, .place"), { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" });
        gsap.to(block.querySelectorAll(".line"), { y: 0, opacity: 1, duration: 0.9, stagger: 0.12, delay: 0.25, ease: "power3.out" });
        gsap.to(block.querySelectorAll(".proof li"), {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.06,
          delay: 0.55,
          ease: "back.out(2)",
        });
        gsap.to(block.querySelectorAll("blockquote"), { y: 0, opacity: 1, duration: 0.9, delay: 0.8, ease: "power3.out" });
      },
    });
  });

  // Headline letters shy away from the cursor and spring back.
  if (!reduceMotion && !window.matchMedia("(pointer: coarse)").matches) {
    document.querySelectorAll(".copy h2").forEach((h2) => {
      h2.querySelectorAll(".w").forEach((w) => {
        w.innerHTML = [...w.textContent].map((ch) => `<span class="l">${esc(ch)}</span>`).join("");
      });
      const letters = [...h2.querySelectorAll(".l")].map((el) => ({
        el,
        x: gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" }),
        y: gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" }),
      }));
      const RADIUS = 90;
      h2.addEventListener("pointermove", (e) => {
        letters.forEach((l) => {
          const r = l.el.getBoundingClientRect();
          const dx = r.left + r.width / 2 - e.clientX;
          const dy = r.top + r.height / 2 - e.clientY;
          const d = Math.hypot(dx, dy);
          if (d < RADIUS) {
            const f = (1 - d / RADIUS) * 22;
            l.x((dx / (d || 1)) * f);
            l.y((dy / (d || 1)) * f);
          } else {
            l.x(0);
            l.y(0);
          }
        });
      });
      h2.addEventListener("pointerleave", () => letters.forEach((l) => (l.x(0), l.y(0))));
    });
  }

  // Headlines lean with scroll speed (subtle, feels physical).
  if (!reduceMotion) {
    const heads = document.querySelectorAll(".copy h2");
    const setters = [...heads].map((h) => gsap.quickTo(h, "skewY", { duration: 0.5, ease: "power3.out" }));
    gsap.ticker.add(() => {
      const skew = Math.max(-6, Math.min(6, scrollState.velocity * 0.12));
      setters.forEach((set) => set(skew));
    });
  }
}
