// The timeline rope: a verlet-simulated string hanging from the top-left corner,
// with a paper tag showing the current year. It swings when you scroll and
// when your cursor brushes it.

import { fitCanvas, reduceMotion, onResize, isTouch } from "./util.js";
import { scrollState } from "./smooth.js";
import { sound } from "./sound.js";

const SEGMENTS = 14;

export function initRope() {
  const canvas = document.getElementById("rope");
  let { ctx, w, h } = fitCanvas(canvas);
  let anchorX = isTouch ? 30 : 46;
  let segLen = 0;
  let points = [];
  let year = "2008";
  let shownYear = 2008;
  let targetYear = 2008;
  let mouse = { x: -999, y: -999, px: -999, py: -999 };

  function build() {
    ({ ctx, w, h } = fitCanvas(canvas));
    anchorX = w < 100 ? 64 : 46;
    // Phones: a short rope so the tag hangs just under the logo instead of across the content.
    const length = window.innerWidth < 860 ? 44 : Math.min(h * 0.42, 360);
    segLen = length / SEGMENTS;
    points = [];
    for (let i = 0; i <= SEGMENTS; i++) {
      const y = i * segLen;
      points.push({ x: anchorX, y, px: anchorX, py: y });
    }
  }
  build();
  onResize(build);

  window.addEventListener(
    "pointermove",
    (e) => {
      mouse.px = mouse.x;
      mouse.py = mouse.y;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    },
    { passive: true }
  );

  let lastTickYear = 2008;

  function step() {
    const v = scrollState.velocity || 0;
    // Scrolling acts like a push on the rope; gravity pulls it straight.
    const gravity = 0.45;
    const push = Math.max(-40, Math.min(40, v)) * 0.05;

    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      const vx = (p.x - p.px) * 0.985;
      const vy = (p.y - p.py) * 0.985;
      p.px = p.x;
      p.py = p.y;
      p.x += vx + push * 0.35 * (i / SEGMENTS);
      p.y += vy + gravity - Math.abs(push) * 0.2;

      // Cursor brushes the rope
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 900) {
        p.x += (mouse.x - mouse.px) * 0.6;
        p.y += (mouse.y - mouse.py) * 0.3;
      }
    }

    // Constraints
    for (let k = 0; k < 6; k++) {
      points[0].x = anchorX;
      points[0].y = 0;
      for (let i = 0; i < points.length - 1; i++) {
        const a = points[i];
        const b = points[i + 1];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.0001;
        const diff = (dist - segLen) / dist;
        const ox = dx * 0.5 * diff;
        const oy = dy * 0.5 * diff;
        if (i !== 0) {
          a.x += ox;
          a.y += oy;
        }
        b.x -= ox;
        b.y -= oy;
      }
    }
    // Keep inside the canvas
    points.forEach((p) => {
      if (p.x < 6) p.x = 6;
      if (p.x > w - 6) p.x = w - 6;
    });
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    // Rope
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length - 1; i++) {
      const mx = (points[i].x + points[i + 1].x) / 2;
      const my = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, mx, my);
    }
    const end = points[points.length - 1];
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = "rgba(242,237,227,0.55)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Tag, rotated to follow the last segment
    const prev = points[points.length - 2];
    const angle = Math.atan2(end.y - prev.y, end.x - prev.x) - Math.PI / 2;
    const small = w < 100;
    const tw = small ? 50 : 70;
    const th = small ? 26 : 34;
    ctx.save();
    ctx.translate(end.x, end.y);
    ctx.rotate(angle);
    ctx.fillStyle = "#f2ede3";
    roundRect(ctx, -tw / 2, 0, tw, th, 4);
    ctx.fill();
    ctx.fillStyle = "#0e0d0b";
    ctx.beginPath();
    ctx.arc(0, 6, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ff4b2b";
    ctx.font = `900 ${small ? 13 : 17}px Fraunces, Georgia, serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(year, 0, th / 2 + 3);
    ctx.restore();
  }

  function tickYear() {
    if (typeof targetYear !== "number") {
      year = targetYear;
      return;
    }
    if (shownYear !== targetYear) {
      const diff = targetYear - shownYear;
      shownYear += Math.sign(diff) * Math.max(0.12, Math.abs(diff) * 0.08);
      if (Math.abs(targetYear - shownYear) < 0.15) shownYear = targetYear;
    }
    const rounded = Math.round(shownYear);
    if (rounded !== lastTickYear) {
      lastTickYear = rounded;
      sound.tick();
    }
    year = String(rounded);
  }

  function loop() {
    if (!reduceMotion) step();
    tickYear();
    draw();
    requestAnimationFrame(loop);
  }
  loop();

  return {
    setYear(y) {
      if (y === "next") {
        targetYear = "20??";
        return;
      }
      const n = Number(y);
      if (!Number.isFinite(n)) return;
      if (typeof targetYear !== "number") shownYear = n;
      targetYear = n;
      // A little jolt when the year changes
      const end = points[points.length - 1];
      end.px -= 6;
    },
  };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
