// End credits. The roll scrolls up as you scroll down, and includes a "cast of your visit":
// how many letters you threw, cards you tossed, whether you sent the email, etc.
// Then: replay (back to the top, letters re-drop) and share.

import { esc, reduceMotion, toast } from "../core/util.js";
import { stats } from "../core/stats.js";
import { scrollTo } from "../core/smooth.js";

const { gsap, ScrollTrigger } = window;

export function initCredits(site, scenes) {
  const roll = document.getElementById("credits-roll");
  const p = site.person;

  const block = (role, names) =>
    `<div class="credit"><span class="mono">${esc(role)}</span><b>${names.map(esc).join("<br>")}</b></div>`;

  function render() {
    const you = [
      `${stats.letters} letter${stats.letters === 1 ? "" : "s"} thrown`,
      `${stats.objects} object${stats.objects === 1 ? "" : "s"} tossed in LA`,
      `${stats.cards} yearbook card${stats.cards === 1 ? "" : "s"} knocked over`,
      stats.emailSent ? "1 cold email sent" : "0 cold emails sent (there's still time)",
      ...(stats.visitorEmail ? ["and 1 written by you, thank you"] : []),
      `${stats.freshmen} extra freshm${stats.freshmen === 1 ? "an" : "en"} down the slide`,
    ];
    roll.innerHTML = `
      <p class="credits-title">A Life in Seven Chapters</p>
      ${block("Directed by", [p.name])}
      ${block("Written by", [p.name])}
      ${block("Starring", [p.name, "Victor Lu as the twin", "a basketball", "2,000 particles"])}
      ${block("Featuring your visit", you)}
      ${block("Physics", ["Matter.js"])}
      ${block("Motion", ["GSAP · Lenis"])}
      ${block("Type", ["Fraunces · Inter · JetBrains Mono"])}
      ${block("Placeholder art", ["drawn in code, frame by frame"])}
      ${block("Special thanks", ["everyone who answered a cold email", "the Farm", "my family"])}
      <p class="credits-fin">fin.<br><span class="mono">no letters were harmed. several were thrown.</span></p>
    `;
  }
  render();

  // Re-render when the credits come into view so the numbers are current.
  ScrollTrigger.create({ trigger: "#credits", start: "top bottom", onEnter: render, onEnterBack: render });

  if (!reduceMotion) {
    gsap.fromTo(
      roll,
      { yPercent: 30 },
      { yPercent: -20, ease: "none", scrollTrigger: { trigger: "#credits", start: "top bottom", end: "bottom top", scrub: true } }
    );
  }

  document.getElementById("replay").addEventListener("click", () => {
    scrollTo(0, { duration: 2.2 });
    setTimeout(() => scenes.open?.respawn?.(), 1600);
  });

  document.getElementById("share").addEventListener("click", async () => {
    const url = location.href.split("#")[0].replace(/\?debug.*/, "");
    const data = { title: `${p.name}: a life in seven chapters`, text: p.tagline, url };
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
