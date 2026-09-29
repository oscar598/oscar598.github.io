// SC 00 · Cold open
// "OSCAR LU" drops in as physical letters you can grab and throw.
// Scrolling fast kicks them into the air. A basketball joins the pile (the Harvard hook).

import { createWorld } from "../core/world.js";
import { rand, reduceMotion, onResize } from "../core/util.js";
import { scrollState } from "../core/smooth.js";

const { Bodies, Body, Composite } = window.Matter;

export async function initOpen(site) {
  const section = document.getElementById("open");
  const canvas = document.getElementById("open-world");
  const tagline = document.getElementById("open-tagline");

  tagline.innerHTML = site.person.tagline.replace("at 13", "<em>at 13</em>").replace("They said yes.", "<em>They said yes.</em>");

  try {
    await document.fonts.load('900 120px "Fraunces"');
  } catch {}

  const letters = "OSCARLU".split("");
  let letterBodies = [];
  let fontSize = 100;

  const world = createWorld(canvas, {
    walls: { floor: true, left: true, right: true, ceiling: false },
    wallInset: 0,
    floorOffset: 78, // keep the pile above the film-strip nav
    beforeDraw(ctx, w, h) {
      // Floor line + frame marks
      ctx.strokeStyle = "rgba(242,237,227,0.14)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h - 78.5);
      ctx.lineTo(w, h - 78.5);
      ctx.stroke();
    },
    onStep(api) {
      // Scroll velocity kicks the letters (feels like the page is shaking them).
      const v = scrollState.velocity;
      if (Math.abs(v) > 18) {
        api.bodies().forEach((b) => {
          if (b.position.y > api.h * 0.4) {
            Body.applyForce(b, b.position, { x: rand(-0.02, 0.02) * b.mass, y: -Math.min(Math.abs(v), 80) * 0.0009 * b.mass });
          }
        });
      }
      // Cursor pushes letters it passes through quickly (without grabbing).
      const p = api.pointer;
      if (p.inside && !p.down) {
        const speed = Math.hypot(p.vx, p.vy);
        if (speed > 6) {
          api.bodies().forEach((b) => {
            const dx = b.position.x - p.x;
            const dy = b.position.y - p.y;
            const d = Math.hypot(dx, dy);
            if (d < fontSize * 0.6) {
              Body.applyForce(b, b.position, { x: p.vx * 0.00035 * b.mass, y: p.vy * 0.00035 * b.mass - 0.002 * b.mass });
            }
          });
        }
      }
    },
  });

  function makeLetter(ch, x, y) {
    const ctx = world.ctx;
    ctx.font = `900 ${fontSize}px Fraunces, Georgia, serif`;
    const m = ctx.measureText(ch);
    const bw = m.width * 0.94;
    const bh = fontSize * 0.74;
    const body = Bodies.rectangle(x, y, bw, bh, {
      chamfer: { radius: Math.min(bw, bh) * 0.12 },
      restitution: 0.25,
      friction: 0.5,
      frictionAir: 0.012,
      density: 0.002,
      angle: rand(-0.06, 0.06),
      label: "letter",
    });
    const isAccent = ch === "L" || ch === "U";
    body.plugin.char = ch;
    body.plugin.draw = (c) => {
      c.font = `900 ${fontSize}px Fraunces, Georgia, serif`;
      c.textAlign = "center";
      c.textBaseline = "alphabetic";
      c.fillStyle = isAccent ? "#ff4b2b" : "#f2ede3";
      c.fillText(ch, 0, bh * 0.5);
    };
    return body;
  }

  function makeBall(x, y) {
    const r = fontSize * 0.2;
    const ball = Bodies.circle(x, y, r, { restitution: 0.75, friction: 0.2, frictionAir: 0.005, density: 0.0015, label: "ball" });
    ball.plugin.draw = (c) => {
      c.fillStyle = "#e86a2c";
      c.beginPath();
      c.arc(0, 0, r, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = "#0e0d0b";
      c.lineWidth = Math.max(1.2, r * 0.07);
      c.beginPath();
      c.arc(0, 0, r, 0, Math.PI * 2);
      c.moveTo(-r, 0);
      c.lineTo(r, 0);
      c.moveTo(0, -r);
      c.lineTo(0, r);
      c.stroke();
      c.beginPath();
      c.arc(-r * 1.25, 0, r * 0.9, -0.9, 0.9);
      c.stroke();
      c.beginPath();
      c.arc(r * 1.25, 0, r * 0.9, Math.PI - 0.9, Math.PI + 0.9);
      c.stroke();
    };
    return ball;
  }

  let generation = 0;
  function drop() {
    const gen = ++generation; // cancels pending timers from an earlier drop
    letterBodies.forEach((b) => world.remove(b));
    letterBodies = [];
    const w = world.w;
    droppedAtWidth = w;
    fontSize = Math.max(56, Math.min(w / 6, world.h / 3, 230));
    // Lay the letters out so they land reading "OSCAR LU" (then they're yours to wreck).
    const ctx = world.ctx;
    ctx.font = `900 ${fontSize}px Fraunces, Georgia, serif`;
    const widths = letters.map((ch) => ctx.measureText(ch).width * 0.94);
    const gap = fontSize * 0.04;
    const wordGap = fontSize * 0.45; // space between OSCAR and LU
    const total = widths.reduce((a, b) => a + b, 0) + gap * (letters.length - 1) + wordGap;
    let cursorX = Math.max(10, (w - total) / 2);
    const xs = widths.map((bw, i) => {
      const x = cursorX + bw / 2;
      cursorX += bw + gap + (i === 4 ? wordGap : 0);
      return x;
    });
    letters.forEach((ch, i) => {
      const x = xs[i];
      const delay = reduceMotion ? 0 : 250 + i * 110;
      setTimeout(() => {
        if (gen !== generation) return;
        const b = makeLetter(ch, x, reduceMotion ? world.h - 78 - fontSize : -fontSize);
        letterBodies.push(b);
        world.add(b);
      }, delay);
    });
    setTimeout(() => {
      if (gen !== generation) return;
      const ball = makeBall(w * 0.85, -200);
      Body.setVelocity(ball, { x: -6, y: 0 });
      letterBodies.push(ball);
      world.add(ball);
    }, reduceMotion ? 0 : 1600);
  }

  // Start the drop once the leader is gone / the scene is visible.
  let dropped = false;
  function begin() {
    if (dropped) return;
    dropped = true;
    drop();
  }

  // The world resizes itself; re-drop so letter sizes match the new width.
  let droppedAtWidth = 0;
  onResize(() => {
    // Only re-drop for a real layout change (rotating a phone, resizing the window a lot).
    if (dropped && Math.abs(world.w - droppedAtWidth) > 120) drop();
  }, 300);

  // Double-click / double-tap: re-drop everything.
  canvas.addEventListener("dblclick", drop);

  // Acrostic: every letter hides a chapter. Hover (or tap) a letter to read it.
  const FACTS = {
    O: "Orange juice stand, age 8",
    S: "Self-taught Photoshop, 7th grade",
    C: "Cold email to Harvard, age 13",
    A: "A Better Chance Scholar",
    R: "Refugee center, 7 days, Przemyśl",
    L: "Lacrosse captain · valedictorian",
    U: "University: Princeton '30",
  };
  const tip = document.createElement("div");
  tip.className = "letter-tip mono";
  section.appendChild(tip);
  let tipFor = null;
  canvas.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    const p = { x: e.clientX - r.left, y: e.clientY - r.top };
    const hit = window.Matter.Query.point(letterBodies, p)[0];
    const ch = hit?.plugin.char;
    if (ch && FACTS[ch]) {
      if (tipFor !== hit) {
        tipFor = hit;
        tip.innerHTML = `<b>${ch}</b> ${FACTS[ch]}`;
        tip.classList.add("is-on");
      }
      tip.style.transform = `translate(${p.x + 18}px, ${p.y - 36}px)`;
    } else if (tipFor) {
      tipFor = null;
      tip.classList.remove("is-on");
    }
  });
  canvas.addEventListener("pointerleave", () => {
    tipFor = null;
    tip.classList.remove("is-on");
  });

  return { begin, world, section, respawn: drop, get bodies() { return Composite.allBodies(world.world); } };
}
