// SC 08 · Next chapter
// The ask. The title types itself, buttons are magnetic, and clicking "Email me"
// fires a physics confetti burst before the mail app opens.

import { createWorld } from "../core/world.js";
import { esc, rand, pick, reduceMotion } from "../core/util.js";
import { sound } from "../core/sound.js";
import { stats } from "../core/stats.js";

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
    <a class="btn" href="resume.html" data-magnetic>Resume</a>
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

  // ---- Your turn: the visitor writes the cold email ----
  const form = document.getElementById("compose");
  const textarea = document.getElementById("compose-body");
  const count = document.getElementById("compose-count");
  textarea.addEventListener("input", () => {
    const words = textarea.value.trim().split(/\s+/).filter(Boolean).length;
    count.textContent = words ? `${words} word${words === 1 ? "" : "s"}${words > 60 ? " · keep it short, it works better" : ""}` : "a blank page";
    if (Math.random() < 0.5) sound.key();
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = textarea.value.trim();
    if (!text) {
      textarea.focus();
      form.animate([{ transform: "translateX(0)" }, { transform: "translateX(-8px)" }, { transform: "translateX(8px)" }, { transform: "translateX(0)" }], { duration: 300 });
      return;
    }
    stats.visitorEmail = true;
    const btn = form.querySelector("button");
    const r = btn.getBoundingClientRect();
    flyPlane(r.left + r.width / 2, r.top);
    confetti({ x: r.left + r.width / 2, y: r.top });
    sound.whoosh();
    const subject = encodeURIComponent("Re: the next chapter");
    const bodyText = encodeURIComponent(text);
    setTimeout(() => {
      window.location.href = `mailto:${p.email}?subject=${subject}&body=${bodyText}`;
      count.textContent = "sent to your mail app ✓";
    }, reduceMotion ? 0 : 900);
  });

  function flyPlane(x, y) {
    if (reduceMotion) return;
    const plane = document.getElementById("plane").cloneNode(true);
    plane.removeAttribute("id");
    plane.style.cssText = `position:fixed;left:${x - 22}px;top:${y - 22}px;width:44px;height:44px;opacity:1;z-index:90;color:#ff4b2b;pointer-events:none`;
    document.body.appendChild(plane);
    window.gsap.to(plane, {
      keyframes: [
        { x: 80, y: -60, rotate: -12, duration: 0.3 },
        { x: 320, y: -320, rotate: -30, duration: 0.45 },
        { x: 700, y: -760, rotate: -40, opacity: 0, duration: 0.5 },
      ],
      ease: "power1.in",
      onComplete: () => plane.remove(),
    });
  }

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
