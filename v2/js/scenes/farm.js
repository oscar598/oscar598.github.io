// SC 05 · The Farm
// Four years of receipts as physical yearbook cards. They drop into a pile when you arrive;
// grab them, throw them, and fling the lacrosse ball into the stack.
// The cards are real DOM elements (crisp text, selectable by screen readers) whose
// transforms are driven by Matter.js bodies every frame.

import { createWorld } from "../core/world.js";
import { rand, reduceMotion, onVisible, onResize } from "../core/util.js";
import { stats } from "../core/stats.js";

const { Bodies, Body } = window.Matter;

const CARDS = [
  { big: "Valedictorian", small: "Class of 2026", style: "accent" },
  { big: "4.0", small: "GPA" },
  { big: "1540", small: "SAT" },
  { big: "DECA", small: "Pennsylvania State Champion", style: "ink" },
  { big: "Editor-in-Chief", small: "40-person team" },
  { big: "$3K", small: "raised · first print in a decade" },
  { big: "Captain", small: "varsity lacrosse → championship game", style: "ink" },
  { big: "All-League", small: "Penn-Jersey First Team" },
  { big: "Co-President", small: "class government" },
  { big: "J-Term", small: "outdoor program, built from zero", style: "accent" },
  { big: "0 → 10+", small: "student activities" },
  { big: "Fruit snacks", small: "night one, under the sheets" },
];

export function initFarm() {
  const pile = document.getElementById("pile");
  const canvas = document.createElement("canvas");
  canvas.className = "world";
  canvas.style.pointerEvents = "none";
  pile.appendChild(canvas);

  let items = []; // { el, body }  (declared before the world: its first render calls sync)
  let dropped = false;

  const world = createWorld(canvas, {
    sizeFrom: pile,
    domTarget: pile,
    onGrab: () => stats.cards++,
    walls: { floor: true, left: true, right: true, ceiling: false },
    draw: sync, // no canvas drawing; we move DOM nodes instead
  });

  function makeCard(data, i) {
    const el = document.createElement("div");
    el.className = "card" + (data.style ? ` card--${data.style}` : "");
    el.innerHTML = `<b>${data.big}</b><span>${data.small}</span>`;
    pile.appendChild(el);
    const r = el.getBoundingClientRect();
    const w = r.width;
    const h = r.height;
    const x = rand(w / 2 + 10, world.w - w / 2 - 10);
    const y = reduceMotion ? world.h - h / 2 - 10 - (i % 3) * h : -h - i * 70;
    const body = Bodies.rectangle(x, y, w, h, {
      chamfer: { radius: 6 },
      restitution: 0.2,
      friction: 0.6,
      frictionAir: 0.015,
      density: 0.0012,
      angle: rand(-0.5, 0.5),
    });
    body.plugin.w = w;
    body.plugin.h = h;
    world.add(body);
    items.push({ el, body });
  }

  function makeBall() {
    const el = document.createElement("div");
    el.className = "ball";
    el.setAttribute("aria-hidden", "true");
    pile.appendChild(el);
    const r = 22;
    const body = Bodies.circle(world.w + 60, world.h * 0.35, r, {
      restitution: 0.8,
      friction: 0.05,
      frictionAir: 0.004,
      density: 0.02, // heavy: it should knock cards over
    });
    body.plugin.w = r * 2;
    body.plugin.h = r * 2;
    world.add(body);
    items.push({ el, body });
    Body.setVelocity(body, { x: -38, y: -6 });
  }

  function sync() {
    for (const { el, body } of items) {
      const { x, y } = body.position;
      el.style.transform = `translate(${x - body.plugin.w / 2}px, ${y - body.plugin.h / 2}px) rotate(${body.angle}rad)`;
    }
  }

  function drop() {
    if (dropped) return;
    dropped = true;
    CARDS.forEach((c, i) => makeCard(c, i));
    // The ball comes in once the pile has settled.
    setTimeout(makeBall, reduceMotion ? 0 : 3200);
  }

  function reset() {
    items.forEach(({ el, body }) => {
      el.remove();
      world.remove(body);
    });
    items = [];
    dropped = false;
    drop();
  }

  onVisible(pile, (v) => v && drop(), "-20% 0px");
  onResize(() => dropped && reset(), 300);

  // Double-click the pile to re-drop.
  pile.addEventListener("dblclick", reset);

  // Click empty space: toss a graduation cap (class of 2026).
  let downAt = null;
  pile.addEventListener("pointerdown", (e) => (downAt = { x: e.clientX, y: e.clientY }));
  pile.addEventListener("click", (e) => {
    if (e.target.closest(".card, .ball, .cap")) return;
    if (downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6) return;
    const r = pile.getBoundingClientRect();
    tossCap(e.clientX - r.left, e.clientY - r.top);
  });

  function tossCap(x, y) {
    const el = document.createElement("div");
    el.className = "cap";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = "<i></i>";
    pile.appendChild(el);
    const w = 64;
    const h = 16;
    const body = Bodies.rectangle(x, Math.min(y, world.h - 40), w, h, {
      restitution: 0.35,
      friction: 0.4,
      frictionAir: 0.02,
      density: 0.0015,
    });
    body.plugin.w = w;
    body.plugin.h = h;
    world.add(body);
    items.push({ el, body });
    Body.setVelocity(body, { x: rand(-4, 4), y: rand(-22, -16) });
    Body.setAngularVelocity(body, rand(-0.35, 0.35));
    // Keep the pile tidy: at most 12 caps
    const caps = items.filter((it) => it.el.classList.contains("cap"));
    if (caps.length > 12) {
      const old = caps[0];
      old.el.remove();
      world.remove(old.body);
      items = items.filter((it) => it !== old);
    }
  }

  return { world, reset };
}
