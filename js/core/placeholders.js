// Designed, animated placeholders for media slots that don't have a real file yet.
// Each one is drawn in code, so the page looks finished before real photos/AI renders exist.
//   harvard  → a crimson recruiting poster with animated halftone and a spinning ball
//   yosemite → Half Dome at alpenglow with drifting mist and a slow sun glint
//   default  → a simple striped gradient

import { fitCanvas, onVisible, seeded, reduceMotion } from "./util.js";

const PAINTERS = { harvard: harvardPoster, yosemite: halfDome };

export function paintPlaceholder(slot, key) {
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
  slot.prepend(canvas);
  const painter = PAINTERS[key];
  if (!painter) return false;

  let state = null;
  let running = false;
  let t0 = performance.now();

  function setup() {
    const fit = fitCanvas(canvas);
    state = { ...fit, rnd: seeded(key.length * 97) };
  }
  setup();
  window.addEventListener("resize", () => setTimeout(setup, 200));

  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    painter(state, (now - t0) / 1000);
  }
  painter(state, 0);
  if (!reduceMotion) {
    onVisible(slot, (v) => {
      if (v && !running) {
        running = true;
        requestAnimationFrame(frame);
      } else if (!v) running = false;
    });
  }
  return true;
}

// ---------- Harvard recruiting poster ----------
function harvardPoster({ ctx, w, h }, t) {
  // Background
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#b3122e");
  g.addColorStop(1, "#5a0716");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Animated halftone field (drifts diagonally)
  const cell = Math.max(8, w / 34);
  ctx.fillStyle = "rgba(255,255,255,0.13)";
  for (let y = -cell; y < h + cell; y += cell) {
    for (let x = -cell; x < w + cell; x += cell) {
      const cx = x + ((t * 12) % cell);
      const cy = y + ((t * 12) % cell);
      const d = Math.hypot(cx - w * 0.75, cy - h * 0.3) / Math.hypot(w, h);
      const r = Math.max(0, (0.55 - d) * cell * 0.7);
      if (r > 0.3) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Big number
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.font = `900 ${h * 0.62}px Fraunces, Georgia, serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("13", w * 1.02, h * 0.72);
  ctx.restore();

  // Spinning basketball
  const r = Math.min(w, h) * 0.2;
  const bx = w * 0.66;
  const by = h * 0.36 + Math.sin(t * 2.2) * h * 0.015;
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(t * 0.6);
  ctx.fillStyle = "#e86a2c";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#2a0a0e";
  ctx.lineWidth = Math.max(1.5, r * 0.06);
  ctx.beginPath();
  ctx.moveTo(-r, 0);
  ctx.lineTo(r, 0);
  ctx.moveTo(0, -r);
  ctx.lineTo(0, r);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-r * 1.3, 0, r, -0.85, 0.85);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(r * 1.3, 0, r, Math.PI - 0.85, Math.PI + 0.85);
  ctx.stroke();
  ctx.restore();

  // Type
  ctx.fillStyle = "#f2ede3";
  ctx.textAlign = "left";
  ctx.font = `900 ${w * 0.15}px Fraunces, Georgia, serif`;
  ctx.fillText("GAME", w * 0.07, h * 0.7);
  ctx.fillText("DAY", w * 0.07, h * 0.7 + w * 0.14);
  ctx.font = `500 ${Math.max(9, w * 0.032)}px "JetBrains Mono", monospace`;
  ctx.fillStyle = "rgba(242,237,227,0.8)";
  ctx.fillText("CRIMSON · RECRUITING SERIES · VOL. 1", w * 0.07, h * 0.93);
  // Stripe
  ctx.fillStyle = "#f2ede3";
  ctx.fillRect(w * 0.07, h * 0.52, w * 0.18, Math.max(3, h * 0.008));
}

// ---------- Half Dome at alpenglow ----------
function halfDome({ ctx, w, h }, t) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#2b2350");
  sky.addColorStop(0.55, "#c86f7c");
  sky.addColorStop(1, "#f6b27a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Sun glint
  const sx = w * 0.18;
  const sy = h * 0.62;
  const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, h * 0.6);
  glow.addColorStop(0, `rgba(255,220,160,${0.55 + Math.sin(t * 0.8) * 0.08})`);
  glow.addColorStop(1, "rgba(255,220,160,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // Back ridge
  ctx.fillStyle = "#6a3f67";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.72);
  for (let x = 0; x <= w; x += w / 24) ctx.lineTo(x, h * (0.66 + Math.sin(x * 0.012) * 0.04 + Math.cos(x * 0.03) * 0.02));
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.fill();

  // Half Dome: rounded back, sheer cut face
  const baseY = h * 0.95;
  const cx = w * 0.62;
  const domeW = w * 0.34;
  const domeH = h * 0.66;
  const face = ctx.createLinearGradient(cx - domeW / 2, 0, cx + domeW / 2, 0);
  face.addColorStop(0, "#7c4a63");
  face.addColorStop(0.7, "#e79a8e");
  face.addColorStop(1, "#f6c0a0");
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.moveTo(cx - domeW * 0.75, baseY);
  ctx.bezierCurveTo(cx - domeW * 0.6, baseY - domeH * 0.55, cx - domeW * 0.3, baseY - domeH, cx + domeW * 0.18, baseY - domeH * 0.98);
  ctx.lineTo(cx + domeW * 0.22, baseY - domeH * 0.92);
  ctx.lineTo(cx + domeW * 0.26, baseY - domeH * 0.2);
  ctx.lineTo(cx + domeW * 0.5, baseY);
  ctx.closePath();
  ctx.fill();

  // Valley floor
  ctx.fillStyle = "#2b1f33";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.9);
  ctx.quadraticCurveTo(w * 0.5, h * 0.84, w, h * 0.92);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.fill();

  // Drifting mist bands
  for (let i = 0; i < 3; i++) {
    const y = h * (0.78 + i * 0.05);
    const x = ((t * (10 + i * 6)) % (w * 1.6)) - w * 0.3;
    const mist = ctx.createLinearGradient(x - w * 0.4, 0, x + w * 0.4, 0);
    mist.addColorStop(0, "rgba(255,240,235,0)");
    mist.addColorStop(0.5, "rgba(255,240,235,0.22)");
    mist.addColorStop(1, "rgba(255,240,235,0)");
    ctx.fillStyle = mist;
    ctx.fillRect(0, y, w, h * 0.05);
  }
}
