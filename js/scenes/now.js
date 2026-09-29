// SC 07 · Now: the Princeton slip 'n slide
// A physics slide. Freshmen (little bodies) pour down it when you arrive; the counter tallies
// everyone who makes it to the bottom. Tap/click to send a wave of ten more.

import { createWorld } from "../core/world.js";
import { rand, pick, onVisible } from "../core/util.js";
import { sound } from "../core/sound.js";
import { stats } from "../core/stats.js";

const { Bodies, Body, Composite } = window.Matter;
const COLORS = ["#f2ede3", "#f2ede3", "#ff4b2b", "#ffb13b", "#7dd3fc", "#f2ede3", "#e8c547"];
const TARGET = 200;

export function initNow() {
  const canvas = document.getElementById("slide-world");
  const numEl = document.getElementById("slide-num");
  const stage = canvas.parentElement;

  let slideBodies = [];
  let slidePoints = [];
  let arrived = 0;
  let yours = 0;
  let queued = 0;
  let queuedYours = 0;
  const youEl = document.createElement("small");
  youEl.className = "mono slide-you";
  numEl.parentElement.appendChild(youEl);
  let pouring = false;
  let tick = 0;

  const world = createWorld(canvas, {
    walls: { floor: true, left: true, right: true, ceiling: false },
    beforeDraw(ctx, w, h) {
      // Water sheen on the slide
      if (!slidePoints.length) return;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#1d4ed8";
      ctx.lineWidth = 16;
      stroke(ctx, slidePoints);
      ctx.strokeStyle = "rgba(125,211,252,0.85)";
      ctx.lineWidth = 6;
      stroke(ctx, slidePoints);
      // Moving highlights
      ctx.setLineDash([6, 22]);
      ctx.lineDashOffset = -tick * 2;
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.lineWidth = 2;
      stroke(ctx, slidePoints);
      ctx.setLineDash([]);
      // Finish line
      const fx = w * 0.8;
      ctx.strokeStyle = "rgba(242,237,227,0.25)";
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(fx, h * 0.55);
      ctx.lineTo(fx, h);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(242,237,227,0.4)";
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText("the lawn", fx + 8, h - 10);
      ctx.fillText("start", 14, h * 0.12 - 14);
    },
    onStep(api) {
      tick++;
      // Pour: one freshman every few frames while there's a queue.
      if (queued > 0 && tick % 4 === 0) {
        queued--;
        spawn(false);
      } else if (queuedYours > 0 && tick % 4 === 2) {
        queuedYours--;
        spawn(true);
      }
      // Count arrivals, recycle bodies that settled on the lawn.
      api.bodies().forEach((b) => {
        // Counted when they cross the finish line or land anywhere on the lawn below the slide.
        if (!b.plugin.counted && (b.position.x > api.w * 0.8 || b.position.y > api.h * 0.86)) {
          b.plugin.counted = true;
          if (b.plugin.yours) {
            yours++;
            youEl.textContent = `+${yours} from you`;
          } else {
            arrived++;
            numEl.textContent = arrived >= TARGET ? "200+" : String(arrived);
            if (arrived === TARGET) {
              sound.chime();
              stage.animate([{ transform: "scale(1)" }, { transform: "scale(1.02)" }, { transform: "scale(1)" }], { duration: 400 });
            }
          }
          if ((arrived + yours) % 5 === 0) sound.pop();
        }
      });
      const bodies = api.bodies();
      if (bodies.length > 140) {
        // remove the oldest counted ones first
        const old = bodies.find((b) => b.plugin.counted);
        if (old) api.remove(old);
      }
    },
  });

  function stroke(ctx, pts) {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  }

  // Slide = a curve from top-left to lower-right, built out of short static segments.
  function buildSlide() {
    slideBodies.forEach((b) => world.remove(b));
    slideBodies = [];
    slidePoints = [];
    const w = world.w;
    const h = world.h;
    const N = 18;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const x = w * 0.02 + t * w * 0.72;
      // Steep at first, flattening near the bottom (a real slide curve), with a kicker at the end
      const y = h * 0.12 + Math.pow(t, 0.62) * h * 0.66 - Math.max(0, t - 0.9) * h * 0.25;
      slidePoints.push([x, y]);
    }
    for (let i = 0; i < slidePoints.length - 1; i++) {
      const [x1, y1] = slidePoints[i];
      const [x2, y2] = slidePoints[i + 1];
      const len = Math.hypot(x2 - x1, y2 - y1);
      const seg = Bodies.rectangle((x1 + x2) / 2, (y1 + y2) / 2, len + 2, 10, {
        isStatic: true,
        angle: Math.atan2(y2 - y1, x2 - x1),
        friction: 0.0005,
        frictionStatic: 0,
        restitution: 0.1,
        label: "slide",
      });
      slideBodies.push(seg);
    }
    // A little rail at the start so bodies don't fall off the back
    slideBodies.push(Bodies.rectangle(w * 0.01, h * 0.06, 8, h * 0.14, { isStatic: true }));
    Composite.add(world.world, slideBodies);
  }

  function spawn(isYours) {
    const w = world.w;
    const h = world.h;
    const r = Math.max(5, Math.min(w, h) / 70) * rand(0.85, 1.2);
    const b = Bodies.circle(w * 0.05 + rand(0, 10), h * 0.02, r, {
      friction: 0.0005,
      frictionAir: 0.003,
      restitution: 0.35,
      density: 0.002,
    });
    b.plugin.yours = isYours;
    const color = isYours ? "#a3e635" : pick(COLORS); // yours are lime so you can spot them
    b.plugin.draw = (c) => {
      c.fillStyle = color;
      c.beginPath();
      c.arc(0, 0, r, 0, Math.PI * 2);
      c.fill();
      // tiny face so they read as people from far away
      c.fillStyle = "#0e0d0b";
      c.fillRect(-r * 0.35, -r * 0.2, r * 0.18, r * 0.18);
      c.fillRect(r * 0.18, -r * 0.2, r * 0.18, r * 0.18);
    };
    Body.setVelocity(b, { x: rand(1, 3), y: 0 });
    world.add(b);
  }

  buildSlide();
  const origResize = world.resize;
  window.addEventListener("resize", () => setTimeout(buildSlide, 200));
  void origResize;

  onVisible(stage, (v) => {
    if (v && !pouring) {
      pouring = true;
      queued += TARGET;
    }
  }, "-15% 0px");

  canvas.addEventListener("click", () => {
    queuedYours += 10;
    stats.freshmen += 10;
    sound.pop();
  });

  return { world };
}
