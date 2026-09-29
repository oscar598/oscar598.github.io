// SC 04 · "What are you doing about it?"
// Deliberately calm. No toys here: black screen, one question revealed word by word,
// then 400 bedding sets lighting up (one day's work), the numbers, and the IYTC network
// drawing itself from seven countries to Dublin.

import { reduceMotion, formatNumber, seeded } from "../core/util.js";

const { gsap, ScrollTrigger } = window;

const QUESTION = "So what are you doing about it?";

export function initUkraine() {
  const q = document.getElementById("question");
  const line = document.getElementById("question-line");
  const bedding = document.getElementById("bedding");
  const stats = document.getElementById("ukraine-stats");
  const network = document.getElementById("network");

  // ---- The question ----
  line.innerHTML = QUESTION.split(" ")
    .map((w, i, arr) => `<span class="w${i >= arr.length - 3 ? " is-strong" : ""}">${w}</span>`)
    .join(" ");
  const attribution = document.createElement("p");
  attribution.className = "mono";
  attribution.style.cssText = "position:absolute;bottom:14vh;left:0;right:0;text-align:center;font-size:12px;color:#9a9387;opacity:0";
  attribution.textContent = "— my dad, February 2022";
  q.style.position = "relative";
  q.appendChild(attribution);
  const words = [...line.querySelectorAll(".w")];

  if (reduceMotion) {
    gsap.set(words, { opacity: 1 });
    gsap.set(attribution, { opacity: 1 });
  } else {
    const tl = gsap.timeline({
      scrollTrigger: { trigger: q, start: "top top", end: "+=140%", pin: true, scrub: 0.6 },
    });
    tl.to(words, { opacity: 1, stagger: 0.25, duration: 0.5, ease: "none" })
      .to(attribution, { opacity: 1, duration: 0.5 }, ">-0.2")
      .to({}, { duration: 0.6 });
  }

  // ---- 400 bedding sets ----
  const cells = [];
  for (let i = 0; i < 400; i++) {
    const c = document.createElement("i");
    bedding.appendChild(c);
    cells.push(c);
  }
  const cap = document.createElement("p");
  cap.className = "bedding-cap";
  cap.innerHTML = `<span id="bed-n">0</span> / 400 bedding sets washed in one day. Then again, 7 days straight.`;
  bedding.appendChild(cap);
  const bedN = cap.querySelector("#bed-n");

  if (reduceMotion) {
    cells.forEach((c) => c.classList.add("on"));
    bedN.textContent = "400";
  } else {
    ScrollTrigger.create({
      trigger: bedding,
      start: "top 75%",
      end: "bottom 35%",
      scrub: true,
      onUpdate(self) {
        const n = Math.round(self.progress * 400);
        bedN.textContent = n;
        for (let i = 0; i < 400; i++) cells[i].classList.toggle("on", i < n);
      },
    });
  }

  // ---- Stats ----
  const STATS = [
    { n: 7, suffix: "", label: "days at the refugee center" },
    { n: 14, suffix: "-hr", label: "shifts" },
    { n: 25, prefix: "$", suffix: "K+", label: "cold-emailed from Google & Wix" },
    { n: 4, suffix: "M+", label: "people reached (Dr. Tedros share)" },
  ];
  stats.innerHTML = STATS.map(
    (s) => `<div class="stat"><b data-n="${s.n}" data-prefix="${s.prefix || ""}" data-suffix="${s.suffix}">0</b><span>${s.label}</span></div>`
  ).join("");
  stats.querySelectorAll("b").forEach((b) => {
    const target = Number(b.dataset.n);
    const obj = { v: 0 };
    const render = () => (b.textContent = `${b.dataset.prefix}${formatNumber(obj.v)}${b.dataset.suffix}`);
    if (reduceMotion) {
      obj.v = target;
      render();
      return;
    }
    ScrollTrigger.create({
      trigger: b,
      start: "top 85%",
      once: true,
      onEnter: () => gsap.to(obj, { v: target, duration: 1.6, ease: "power3.out", onUpdate: render }),
    });
  });

  // ---- Network: 7 contributor countries → Dublin; 60+ countries as faint dots ----
  const W = 800;
  const H = 420;
  const hub = { x: 400, y: 150 };
  const rnd = seeded(7);
  let svg = "";
  // Faint ring of 60 dots = member countries
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const rx = 360 + rnd() * 20;
    const ry = 170 + rnd() * 20;
    svg += `<circle cx="${(W / 2 + Math.cos(a) * rx).toFixed(1)}" cy="${(H / 2 + Math.sin(a) * ry).toFixed(1)}" r="2" fill="rgba(242,237,227,0.25)"/>`;
  }
  const nodes = Array.from({ length: 7 }, (_, i) => {
    const a = Math.PI * 0.15 + (i / 6) * Math.PI * 0.7 + Math.PI;
    return { x: W / 2 + Math.cos(a) * 330 * (0.8 + rnd() * 0.25), y: H * 0.95 + Math.sin(a) * -0.1 * 0 - rnd() * 60 };
  });
  nodes.forEach((n, i) => {
    const mx = (n.x + hub.x) / 2;
    const my = Math.min(n.y, hub.y) - 120;
    svg += `<path class="link" d="M${n.x.toFixed(1)},${n.y.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${hub.x},${hub.y}"/>`;
    svg += `<g class="city"><circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="5"/><text x="${n.x.toFixed(1)}" y="${(n.y + 20).toFixed(1)}" text-anchor="middle">${String(i + 1).padStart(2, "0")}</text></g>`;
  });
  svg += `<g class="city is-hub"><circle cx="${hub.x}" cy="${hub.y}" r="9"/><text x="${hub.x}" y="${hub.y - 20}" text-anchor="middle">DUBLIN · World Conference on Tobacco Control</text></g>`;
  svg += `<text x="${W / 2}" y="${H - 4}" text-anchor="middle">14 contributors · 7 countries · one WHO film → 4M+ people</text>`;
  network.innerHTML = svg;

  const links = [...network.querySelectorAll(".link")];
  links.forEach((p) => {
    const len = p.getTotalLength();
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = reduceMotion ? 0 : len;
  });
  if (!reduceMotion) {
    gsap.to(links, {
      strokeDashoffset: 0,
      stagger: 0.08,
      ease: "none",
      scrollTrigger: { trigger: network, start: "top 80%", end: "bottom 50%", scrub: 0.5 },
    });
    gsap.from(network.querySelectorAll(".city"), {
      scale: 0,
      transformOrigin: "center",
      opacity: 0,
      stagger: 0.05,
      duration: 0.6,
      ease: "back.out(3)",
      scrollTrigger: { trigger: network, start: "top 80%" },
    });
  }

  return {};
}
