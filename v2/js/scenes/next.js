// SC 08 · Next chapter
// The ask. The title types itself, buttons are magnetic, and clicking "Email me"
// fires a physics confetti burst before the mail app opens.

import { createWorld } from "../core/world.js";
import { esc, rand, pick, reduceMotion } from "../core/util.js";
import { sound } from "../core/sound.js";

const { Bodies, Body } = window.Matter;
const { ScrollTrigger } = window;

export function initNext(site) {
  const title = document.getElementById("next-title");
  const body = document.getElementById("next-body");
  const cta = document.getElementById("cta");
  const canvas = document.getElementById("confetti-world");
  const p = site.person;

  body.textContent = site.next.body;
  const links = p.links
    .filter((l) => l.url)
    .map((l) => `<a class="btn" href="${esc(l.url)}" target="_blank" rel="noopener" data-magnetic>${esc(l.label)}</a>`)
    .join("");
  cta.innerHTML = `
    <a class="btn btn--primary" id="email-btn" href="mailto:${esc(p.email)}" data-magnetic>Email me</a>
    <a class="btn" href="../resume.html" data-magnetic>Resume</a>
    ${links}`;
  cta.querySelectorAll("[data-magnetic]").forEach((n) => window.dispatchEvent(new CustomEvent("ol:magnetic", { detail: n })));

  // Type the title when the scene arrives
  const full = site.next.title;
  if (reduceMotion) title.textContent = full;
  else {
    title.textContent = "";
    ScrollTrigger.create({
      trigger: title,
      start: "top 80%",
      once: true,
      onEnter() {
        let i = 0;
        const t = setInterval(() => {
          i++;
          title.textContent = full.slice(0, i);
          if (i % 2) sound.key();
          if (i >= full.length) clearInterval(t);
        }, 55);
      },
    });
  }

  // Confetti world: no walls except far below, no grabbing.
  const world = createWorld(canvas, {
    walls: { floor: false, left: false, right: false, ceiling: false },
    grab: false,
    collisionSound: false,
    useTilt: false,
    gravity: 0.8,
    onStep(api) {
      api.bodies().forEach((b) => {
        // flutter
        Body.applyForce(b, b.position, { x: Math.sin((b.id + performance.now() / 180) * 0.7) * 0.00002, y: 0 });
        if (b.position.y > api.h + 60) api.remove(b);
      });
    },
  });

  function confetti({ x, y, colors = ["#ff4b2b", "#ffb13b", "#f2ede3", "#7dd3fc", "#a3e635"], count = 90, fromTop = false } = {}) {
    if (reduceMotion) count = Math.min(count, 20);
    const r = canvas.getBoundingClientRect();
    // When triggered from elsewhere (easter egg), scroll-independent: rain from the top of this canvas.
    for (let i = 0; i < count; i++) {
      const w = rand(6, 12);
      const h = rand(10, 18);
      const bx = fromTop ? rand(0, r.width) : x - r.left;
      const by = fromTop ? rand(-200, 0) : y - r.top;
      const piece = Bodies.rectangle(bx, by, w, h, { frictionAir: 0.03, angle: rand(0, Math.PI), density: 0.0005 });
      const color = pick(colors);
      piece.plugin.draw = (c) => {
        c.fillStyle = color;
        c.fillRect(-w / 2, -h / 2, w, h);
      };
      if (!fromTop) Body.setVelocity(piece, { x: rand(-14, 14), y: rand(-22, -8) });
      Body.setAngularVelocity(piece, rand(-0.4, 0.4));
      world.add(piece);
    }
    world.start();
    sound.pop();
  }

  document.getElementById("email-btn").addEventListener("click", (e) => {
    confetti({ x: e.clientX, y: e.clientY });
  });

  // Easter egg: confetti from anywhere → scroll here first so it's visible
  return {
    world,
    confetti(opts) {
      const sec = document.getElementById("next");
      const rect = sec.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > innerHeight) {
        // Not visible: rain over the viewport using a temporary fixed canvas instead.
        rainOverViewport(opts);
        return;
      }
      confetti(opts);
    },
  };
}

// Viewport-wide confetti for easter eggs triggered anywhere on the page.
function rainOverViewport({ colors = ["#a51c30", "#f2ede3"], count = 140 } = {}) {
  const c = document.createElement("canvas");
  c.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;z-index:80;pointer-events:none";
  document.body.appendChild(c);
  const world = createWorld(c, {
    walls: { floor: false, left: false, right: false },
    grab: false,
    collisionSound: false,
    useTilt: false,
    gravity: 0.7,
  });
  for (let i = 0; i < count; i++) {
    const w = rand(6, 12);
    const h = rand(10, 18);
    const piece = Bodies.rectangle(rand(0, innerWidth), rand(-400, -10), w, h, { frictionAir: 0.035, angle: rand(0, Math.PI) });
    const color = pick(colors);
    piece.plugin.draw = (ctx) => {
      ctx.fillStyle = color;
      ctx.fillRect(-w / 2, -h / 2, w, h);
    };
    Body.setAngularVelocity(piece, rand(-0.3, 0.3));
    world.add(piece);
  }
  world.start();
  setTimeout(() => {
    world.destroy();
    c.remove();
  }, 6000);
}
