// SC 06 · Tested: "Type Two fun"
// Pinned. Scrolling is the climb: the sky goes from 3 a.m. navy to sunrise, the sun clears
// the ridge, stars fade, four procedurally generated ridgelines drift at different speeds,
// a headlamp dot climbs the trail, and the altimeter runs from Leadville (10,152 ft) to 14,000+.

import { seeded, reduceMotion, lerp, formatNumber } from "../core/util.js";

const { gsap, ScrollTrigger } = window;

const SKY = [
  // [progress, top color, bottom color]
  [0.0, [5, 7, 18], [14, 20, 44]],
  [0.35, [18, 20, 52], [74, 44, 92]],
  [0.65, [60, 52, 110], [236, 120, 88]],
  [1.0, [120, 150, 210], [255, 196, 120]],
];

export function initTested() {
  const section = document.getElementById("tested");
  const sky = document.getElementById("sky");
  const svg = document.getElementById("ridges");
  const alt = document.getElementById("alt-num");

  // ---- Build ridges ----
  const rnd = seeded(14);
  const W = 1600;
  const H = 900;
  const layers = [
    { base: 420, amp: 160, rough: 0.9, color: [44, 48, 88], speed: 0.1 },
    { base: 520, amp: 140, rough: 0.8, color: [30, 32, 64], speed: 0.22 },
    { base: 640, amp: 120, rough: 0.7, color: [18, 20, 40], speed: 0.38 },
    { base: 760, amp: 110, rough: 0.6, color: [8, 9, 18], speed: 0.6 },
  ];
  let stars = "";
  for (let i = 0; i < 120; i++) {
    stars += `<circle cx="${(rnd() * W).toFixed(0)}" cy="${(rnd() * H * 0.55).toFixed(0)}" r="${(rnd() * 1.4 + 0.3).toFixed(2)}" fill="#fff" opacity="${(rnd() * 0.7 + 0.2).toFixed(2)}"/>`;
  }
  const sun = `<circle id="sun" cx="1060" cy="760" r="70" fill="#ffd28a"/><circle id="sun-glow" cx="1060" cy="760" r="240" fill="url(#glow)"/>`;
  const defs = `<defs><radialGradient id="glow"><stop offset="0" stop-color="#ffcf8a" stop-opacity="0.55"/><stop offset="1" stop-color="#ffcf8a" stop-opacity="0"/></radialGradient></defs>`;

  let ridgeSvg = "";
  let trailPath = "";
  layers.forEach((L, li) => {
    const pts = [];
    let y = L.base;
    const peakX = li === 3 ? 1050 : -1;
    for (let x = -100; x <= W + 100; x += 40) {
      y += (rnd() - 0.5) * L.amp * L.rough * 0.5;
      y = Math.max(L.base - L.amp, Math.min(L.base + L.amp * 0.4, y));
      // Front ridge: force a clear summit near the sun
      let yy = y;
      if (peakX > 0) yy = Math.min(yy, L.base + 60 - Math.max(0, 1 - Math.abs(x - peakX) / 520) * 330);
      pts.push([x, yy]);
    }
    const d = `M${pts.map((p) => p.join(",")).join(" L")} L${W + 100},${H + 10} L-100,${H + 10} Z`;
    ridgeSvg += `<path class="ridge" data-speed="${L.speed}" d="${d}" fill="rgb(${L.color.join(",")})"/>`;
    if (li === 3) {
      // Trail follows the front ridge from lower-left to the summit
      const trail = pts.filter(([x]) => x > 300 && x <= peakX + 10);
      trailPath = `M${trail.map((p) => `${p[0]},${p[1] - 4}`).join(" L")}`;
    }
  });

  svg.innerHTML = `${defs}<g id="stars">${stars}</g>${sun}${ridgeSvg}
    <path id="trail" d="${trailPath}" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="2" stroke-dasharray="2 8"/>
    <circle id="lamp" r="6" fill="#fff"/><circle id="lamp-glow" r="22" fill="rgba(255,240,200,0.25)"/>`;

  const ridges = [...svg.querySelectorAll(".ridge")];
  const trail = svg.querySelector("#trail");
  const lamp = svg.querySelector("#lamp");
  const lampGlow = svg.querySelector("#lamp-glow");
  const sunEl = svg.querySelector("#sun");
  const sunGlow = svg.querySelector("#sun-glow");
  const starsEl = svg.querySelector("#stars");
  const trailLen = trail.getTotalLength();

  function colorAt(p, idx) {
    for (let i = 0; i < SKY.length - 1; i++) {
      const [p0, ...c0] = SKY[i];
      const [p1, ...c1] = SKY[i + 1];
      if (p >= p0 && p <= p1) {
        const t = (p - p0) / (p1 - p0);
        return c0[idx].map((v, k) => Math.round(lerp(v, c1[idx][k], t)));
      }
    }
    return SKY[SKY.length - 1][idx + 1];
  }

  function render(p) {
    const top = colorAt(p, 0);
    const bottom = colorAt(p, 1);
    sky.style.background = `linear-gradient(to bottom, rgb(${top}) 0%, rgb(${bottom}) 100%)`;
    starsEl.setAttribute("opacity", String(Math.max(0, 1 - p * 1.6)));
    const sunY = lerp(820, 330, Math.min(1, Math.max(0, (p - 0.45) / 0.55)));
    sunEl.setAttribute("cy", sunY);
    sunGlow.setAttribute("cy", sunY);
    sunGlow.setAttribute("opacity", String(Math.min(1, Math.max(0, (p - 0.4) * 2))));
    ridges.forEach((r, i) => {
      const speed = Number(r.dataset.speed);
      // Nearer ridges sink faster as you climb (parallax); moving down never exposes a gap.
      r.setAttribute("transform", `translate(0 ${(p * speed * 120).toFixed(1)})`);
      // Ridges warm up as light arrives
      const warm = Math.max(0, (p - 0.5) * 2) * (0.5 - i * 0.1);
      r.style.filter = `brightness(${1 + warm})`;
    });
    const climb = Math.min(1, p / 0.92);
    const pt = trail.getPointAtLength(climb * trailLen);
    const frontShift = p * Number(ridges[3].dataset.speed) * 120;
    lamp.setAttribute("cx", pt.x);
    lamp.setAttribute("cy", pt.y + frontShift);
    lampGlow.setAttribute("cx", pt.x);
    lampGlow.setAttribute("cy", pt.y + frontShift);
    trail.setAttribute("transform", `translate(0 ${frontShift.toFixed(1)})`);
    lampGlow.setAttribute("opacity", String(Math.max(0, 1 - p)));
    const feet = lerp(10152, 14000, climb);
    alt.textContent = formatNumber(feet) + (climb >= 1 ? "+" : "");
  }

  if (reduceMotion) {
    render(1);
    return {};
  }
  render(0);
  ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: "+=220%",
    pin: true,
    scrub: true,
    onUpdate: (self) => render(self.progress),
  });
  void gsap;
  return {};
}
