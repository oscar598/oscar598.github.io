// End credits: a short roll that scrolls up as you scroll down, then replay, share, and the
// hidden mini-game.

import { esc, reduceMotion, toast } from "../core/util.js";
import { scrollTo } from "../core/smooth.js";

const { gsap, ScrollTrigger } = window;

// The mini-game is loaded only when someone asks for it.
let game = null;
export async function openGame(site) {
  if (game) return;
  const { openLevel } = await import("../game/level.js");
  game = openLevel(site);
  const done = () => {
    if (!document.querySelector(".level")) {
      game = null;
      observer.disconnect();
    }
  };
  const observer = new MutationObserver(done);
  observer.observe(document.body, { childList: true });
}

export function initCredits(site, scenes) {
  const roll = document.getElementById("credits-roll");
  const p = site.person;

  const block = (role, names) =>
    `<div class="credit"><span class="mono">${esc(role)}</span><b>${names.map(esc).join("<br>")}</b></div>`;

  roll.innerHTML = `
    <p class="credits-title">The Story So Far</p>
    ${block("Directed by", [p.name])}
    ${block("Written by", [p.name, "Claude Code"])}
    ${block("Starring", [p.name, "Victor Lu as the twin", "a basketball", "2,000 particles"])}
    ${block("Type", ["Fraunces · Inter · JetBrains Mono"])}
    ${block("Special thanks", ["everyone who answered a cold email", "the Farm", "my family"])}
  `;

  if (!reduceMotion) {
    gsap.fromTo(
      roll,
      { yPercent: 30 },
      { yPercent: -20, ease: "none", scrollTrigger: { trigger: "#credits", start: "top bottom", end: "bottom top", scrub: true } }
    );
  }

  document.getElementById("play-level").addEventListener("click", () => openGame(site));

  document.getElementById("replay").addEventListener("click", () => {
    scrollTo(0, { duration: 2.2 });
    setTimeout(() => scenes.open?.respawn?.(), 1600);
  });

  document.getElementById("share").addEventListener("click", async () => {
    const url = location.href.split("#")[0].replace(/\?debug.*/, "");
    const data = { title: `${p.name}: the story so far`, text: p.tagline, url };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(url);
        toast("link copied");
      }
    } catch {
      /* user cancelled the share sheet */
    }
  });

  document.querySelectorAll("#credits [data-magnetic]").forEach((n) => window.dispatchEvent(new CustomEvent("ol:magnetic", { detail: n })));
  return {};
}
