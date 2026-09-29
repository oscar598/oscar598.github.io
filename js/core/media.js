// Fills every [data-asset] slot from window.ASSETS (js/assets.js).
// If there's no file yet, it draws a procedural placeholder so the layout never looks broken.

import { esc, reduceMotion } from "./util.js";
import { paintPlaceholder } from "./placeholders.js";

export function initMedia() {
  const assets = window.ASSETS || {};
  document.querySelectorAll("[data-asset]").forEach((slot) => {
    const key = slot.dataset.asset;
    const a = assets[key] || {};
    if (a.video && !reduceMotion) {
      slot.innerHTML = `
        <video src="${esc(a.video)}" ${a.img ? `poster="${esc(a.img)}"` : ""} muted loop playsinline autoplay preload="metadata" aria-label="${esc(a.alt || "")}"></video>
        <span class="tag">placeholder · AI</span>`;
    } else if (a.img) {
      slot.innerHTML = `<img src="${esc(a.img)}" alt="${esc(a.alt || "")}" loading="lazy"><span class="tag">placeholder · AI</span>`;
    } else {
      slot.innerHTML = `<span class="tag">placeholder</span>`;
      slot.setAttribute("role", "img");
      slot.setAttribute("aria-label", a.alt || key);
      // Designed animated placeholder if we have one for this key, else a simple gradient.
      if (!paintPlaceholder(slot, key)) {
        slot.insertAdjacentHTML("beforeend", `<span class="ph">${esc(a.alt || key)}</span>`);
        paintFallback(slot.querySelector("canvas"), key);
      }
    }
  });
}

// Procedural gradient art keyed by the slot name, so each placeholder looks distinct.
function paintFallback(canvas, key) {
  const rect = canvas.parentElement.getBoundingClientRect();
  const w = Math.max(200, Math.round(rect.width || 600));
  const h = Math.max(150, Math.round(rect.height || 400));
  canvas.width = w;
  canvas.height = h;
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%";
  const ctx = canvas.getContext("2d");
  const palettes = {
    harvard: ["#a51c30", "#3b0a12", "#f2ede3"],
    yosemite: ["#f7a35c", "#5b3a6e", "#0e1a2b"],
    origin: ["#ffb13b", "#e86a2c", "#2a1a0e"],
    farm: ["#2f5d3a", "#0e2014", "#f2ede3"],
    ukraine: ["#1f3b73", "#e8c547", "#0e0d0b"],
  };
  const [a, b, c] = palettes[key] || ["#333", "#111", "#666"];
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = c;
  for (let i = -h; i < w; i += 14) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + h, h);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
