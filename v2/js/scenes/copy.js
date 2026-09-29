// Fills every [data-chapter] block with that chapter's words from data.js,
// splits the headline into words, and animates them in on scroll.

import { esc, splitWords, reduceMotion } from "../core/util.js";
import { scrollState } from "../core/smooth.js";

const { gsap, ScrollTrigger } = window;

export function renderCopy(site) {
  document.querySelectorAll("[data-chapter]").forEach((block) => {
    const i = Number(block.dataset.chapter);
    const ch = site.chapters[i];
    if (!ch) return;
    const n = String(i + 1).padStart(2, "0");
    block.innerHTML = `
      <p class="label">SC. ${n} · ${esc(ch.years)}</p>
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
    gsap.set(block.querySelectorAll(".line, .proof li, blockquote, .label, .place"), { y: 24, opacity: 0 });

    ScrollTrigger.create({
      trigger: block,
      start: "top 80%",
      once: true,
      onEnter: () => {
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
