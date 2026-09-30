// Film-leader countdown (3 · 2 · 1) on first visit. Skippable; shown once per session.

import { fitCanvas, reduceMotion } from "./util.js";
import { sound } from "./sound.js";

export function runLeader() {
  const el = document.getElementById("leader");
  let seen = false;
  try {
    seen = sessionStorage.getItem("ol-leader") === "1";
  } catch {}
  if (seen || reduceMotion || location.search.includes("debug")) {
    el.remove();
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const canvas = document.getElementById("leader-canvas");
    const { ctx, w, h } = fitCanvas(canvas);
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) * 0.36;
    const start = performance.now();
    const perNumber = 700;
    let done = false;
    let lastN = 4;

    function finish() {
      if (done) return;
      done = true;
      try {
        sessionStorage.setItem("ol-leader", "1");
      } catch {}
      el.classList.add("is-done");
      setTimeout(() => el.remove(), 700);
      window.removeEventListener("keydown", onKey);
      resolve();
    }
    function onKey(e) {
      if (e.key === "Enter" || e.key === "Escape" || e.key === " ") finish();
    }
    el.querySelector(".leader-skip").addEventListener("click", finish);
    el.addEventListener("click", finish);
    window.addEventListener("keydown", onKey);

    function frame(now) {
      if (done) return;
      const t = now - start;
      const n = 3 - Math.floor(t / perNumber);
      if (n <= 0) {
        finish();
        return;
      }
      if (n !== lastN) {
        lastN = n;
        sound.tick();
      }
      const local = (t % perNumber) / perNumber;

      ctx.clearRect(0, 0, w, h);
      // Paper disc
      ctx.fillStyle = "#1c1a16";
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      // Sweep
      ctx.fillStyle = "#2c2821";
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + local * Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      // Rings + crosshair
      ctx.strokeStyle = "rgba(242,237,227,0.6)";
      ctx.lineWidth = 2;
      [r, r * 0.82].forEach((rr) => {
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.beginPath();
      ctx.moveTo(cx - r * 1.15, cy);
      ctx.lineTo(cx + r * 1.15, cy);
      ctx.moveTo(cx, cy - r * 1.15);
      ctx.lineTo(cx, cy + r * 1.15);
      ctx.stroke();
      // Number
      ctx.fillStyle = "#f2ede3";
      ctx.font = `900 ${r * 1.1}px Fraunces, Georgia, serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(n), cx, cy + r * 0.06);
      // Label
      ctx.fillStyle = "#ff4b2b";
      ctx.font = `500 12px "JetBrains Mono", monospace`;
      ctx.fillText("OSCAR LU · THE STORY SO FAR", cx, cy + r + 28);

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
}
