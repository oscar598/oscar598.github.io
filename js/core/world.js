// A thin wrapper around Matter.js used by every physics scene.
//
//   const w = createWorld(canvas, { draw, walls: { floor: true, left: true, right: true } });
//   w.add(Matter.Bodies.circle(100, 50, 20));
//
// It handles: canvas sizing, a fixed-step loop, pausing when off screen,
// grabbing/throwing bodies with mouse or touch, and global gravity events
// (tilt on phones, the Konami "gravity flip" easter egg).

import { fitCanvas, onVisible, reduceMotion, onResize } from "./util.js";
import { sound } from "./sound.js";

const { Engine, Composite, Bodies, Body, Constraint, Query, Events, Vector } = window.Matter;

const worlds = new Set();
let gravityFlip = 1; // 1 = normal, -1 = flipped (easter egg)
let tilt = { x: 0, y: 1 }; // phone tilt direction

export function setGravityFlip(flip) {
  gravityFlip = flip;
  worlds.forEach((w) => w.applyGravity());
}
export function setTilt(x, y) {
  tilt = { x, y };
  worlds.forEach((w) => w.applyGravity());
}
export function allWorlds() {
  return worlds;
}
// Calm mode: every world stays frozen (visibility won't restart it).
let calm = false;
export function setCalm(on) {
  calm = on;
  worlds.forEach((w) => (on ? w.stop() : w.start()));
}

export function createWorld(canvas, opts = {}) {
  const {
    gravity = 1,
    walls = { floor: true, left: true, right: true, ceiling: false },
    wallInset = 0,
    floorOffset = 0, // raise the floor this many px from the bottom edge
    draw = null, // (ctx, w, h, api) => void : custom draw; default draws every body
    beforeDraw = null, // (ctx, w, h, api) => void : draw under bodies
    afterDraw = null, // (ctx, w, h, api) => void : draw over bodies
    onStep = null, // (api, dt) => void
    grab = true, // allow grabbing bodies
    useTilt = true,
    collisionSound = true,
    domTarget = null, // element that receives pointer events (defaults to canvas)
    sizeFrom = null, // element whose size defines the world (defaults to canvas)
  } = opts;

  // Physics canvases are decorative; the story text sits next to them in real HTML.
  if (!canvas.hasAttribute("role")) canvas.setAttribute("aria-hidden", "true");

  const engine = Engine.create({ enableSleeping: false });
  engine.positionIterations = 8;
  engine.velocityIterations = 6;
  const world = engine.world;

  let ctx = null;
  let w = 1;
  let h = 1;
  let wallBodies = [];
  let running = false;
  let raf = 0;
  let last = 0;
  let acc = 0;
  let drag = null;
  const pointer = { x: -9999, y: -9999, vx: 0, vy: 0, down: false, inside: false };

  const api = {
    engine,
    world,
    canvas,
    get w() { return w; },
    get h() { return h; },
    get ctx() { return ctx; },
    pointer,
    add(body) { Composite.add(world, body); return body; },
    remove(body) { Composite.remove(world, body); },
    bodies() { return Composite.allBodies(world).filter((b) => !b.isStatic); },
    start,
    stop,
    resize,
    applyGravity,
    destroy() { stop(); worlds.delete(api); },
    // Test helper: advance the simulation n steps without animation frames, then draw.
    step(n = 1) {
      for (let i = 0; i < n; i++) {
        onStep?.(api, STEP);
        Engine.update(engine, STEP);
      }
      render();
    },
    get running() { return running; },
  };

  function applyGravity() {
    const g = gravity;
    if (useTilt && (tilt.x !== 0 || tilt.y !== 1)) {
      world.gravity.x = tilt.x * g;
      world.gravity.y = tilt.y * g * gravityFlip;
    } else {
      world.gravity.x = 0;
      world.gravity.y = g * gravityFlip;
    }
  }

  function buildWalls() {
    wallBodies.forEach((b) => Composite.remove(world, b));
    wallBodies = [];
    const t = 400; // thick walls so fast bodies can't tunnel through
    const i = wallInset;
    const opt = { isStatic: true, friction: 0.6, restitution: 0.2, label: "wall" };
    if (walls.floor) wallBodies.push(Bodies.rectangle(w / 2, h - i - floorOffset + t / 2, w * 3, t, opt));
    if (walls.ceiling) wallBodies.push(Bodies.rectangle(w / 2, i - t / 2, w * 3, t, opt));
    if (walls.left) wallBodies.push(Bodies.rectangle(i - t / 2, h / 2 - h, t, h * 4, opt));
    if (walls.right) wallBodies.push(Bodies.rectangle(w - i + t / 2, h / 2 - h, t, h * 4, opt));
    Composite.add(world, wallBodies);
  }

  function resize() {
    const sizeEl = sizeFrom || canvas;
    const oldW = w;
    const oldH = h;
    if (sizeFrom) {
      const r = sizeFrom.getBoundingClientRect();
      canvas.style.width = r.width + "px";
      canvas.style.height = r.height + "px";
    }
    const fit = fitCanvas(canvas);
    ctx = fit.ctx;
    w = fit.w;
    h = fit.h;
    buildWalls();
    // Keep existing bodies inside the new box.
    if (oldW > 1 && (oldW !== w || oldH !== h)) {
      api.bodies().forEach((b) => {
        Body.setPosition(b, { x: (b.position.x / oldW) * w, y: Math.min(b.position.y, h - 20) });
      });
    }
    void sizeEl;
    if (!running) render();
  }

  // ---------- Pointer: grab and throw ----------

  const target = domTarget || canvas;

  function localPoint(e) {
    const r = (sizeFrom || canvas).getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function onDown(e) {
    const p = localPoint(e);
    const hit = Query.point(api.bodies(), p).filter((b) => !b.plugin?.noGrab);
    if (!hit.length || !grab) return;
    const body = hit[hit.length - 1];
    e.preventDefault();
    target.setPointerCapture?.(e.pointerId);
    const local = Vector.sub(p, body.position);
    const rotated = Vector.rotate(local, -body.angle);
    drag = Constraint.create({
      pointA: p,
      bodyB: body,
      pointB: rotated,
      stiffness: 0.18,
      damping: 0.08,
      length: 0,
      render: { visible: false },
    });
    Composite.add(world, drag);
    pointer.down = true;
    document.body.classList.add("is-grabbing");
    opts.onGrab?.(body, api);
  }
  function onMove(e) {
    if (!running && !drag) return; // off-screen worlds don't need the pointer (saves layout reads)
    const p = localPoint(e);
    pointer.vx = p.x - pointer.x;
    pointer.vy = p.y - pointer.y;
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.inside = p.x >= 0 && p.y >= 0 && p.x <= w && p.y <= h;
    if (drag) drag.pointA = p;
  }
  function onUp() {
    if (drag) {
      Composite.remove(world, drag);
      drag = null;
    }
    pointer.down = false;
    document.body.classList.remove("is-grabbing");
  }
  function onLeave() {
    pointer.inside = false;
    pointer.x = -9999;
    pointer.y = -9999;
  }

  target.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
  target.addEventListener("pointerleave", onLeave);

  // ---------- Collision sounds ----------

  if (collisionSound) {
    Events.on(engine, "collisionStart", (ev) => {
      if (!sound.enabled) return;
      let strongest = 0;
      ev.pairs.forEach((pair) => {
        const v = Vector.magnitude(Vector.sub(pair.bodyA.velocity, pair.bodyB.velocity));
        if (v > strongest) strongest = v;
      });
      if (strongest > 4) sound.thump(Math.min(strongest / 30, 1));
    });
  }

  // ---------- Loop ----------

  const STEP = 1000 / 60;

  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(now - (last || now), 50);
    last = now;
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 3) {
      onStep?.(api, STEP);
      Engine.update(engine, STEP);
      acc -= STEP;
      steps++;
    }
    render();
  }

  function render() {
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    beforeDraw?.(ctx, w, h, api);
    if (draw) draw(ctx, w, h, api);
    else drawBodies(ctx, api.bodies());
    afterDraw?.(ctx, w, h, api);
  }

  function start() {
    if (running || calm) return;
    running = true;
    last = 0;
    acc = 0;
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  applyGravity();
  resize();
  worlds.add(api);
  onResize(resize);

  // Only simulate while on screen (saves battery; keeps 5+ worlds cheap).
  onVisible(sizeFrom || canvas, (visible) => (visible ? start() : stop()), "150px");

  if (reduceMotion) {
    // Still interactive, but gentler.
    engine.timing.timeScale = 0.8;
  }

  return api;
}

// Default renderer: each body can carry `body.plugin.draw(ctx, body)`; otherwise it's filled with body.render.fillStyle.
export function drawBodies(ctx, bodies) {
  bodies.forEach((b) => {
    if (b.plugin?.draw) {
      ctx.save();
      ctx.translate(b.position.x, b.position.y);
      ctx.rotate(b.angle);
      b.plugin.draw(ctx, b);
      ctx.restore();
      return;
    }
    ctx.beginPath();
    b.vertices.forEach((v, i) => (i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)));
    ctx.closePath();
    ctx.fillStyle = b.render.fillStyle || "#f2ede3";
    ctx.fill();
  });
}
