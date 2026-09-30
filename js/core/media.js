// Fills every [data-asset] slot from window.ASSETS (js/assets.js).
// Real photos render plainly; AI placeholders get a small label. A slot with no file
// falls back to a CSS gradient (see .media.is-empty) so the layout never looks broken.

import { esc, reduceMotion } from "./util.js";

export function initMedia() {
  const assets = window.ASSETS || {};
  document.querySelectorAll("[data-asset]").forEach((slot) => {
    const a = assets[slot.dataset.asset] || {};
    const tag = a.real ? "" : '<span class="tag">placeholder · AI</span>';
    if (a.video && !reduceMotion) {
      slot.innerHTML = `<video src="${esc(a.video)}" ${a.img ? `poster="${esc(a.img)}"` : ""} muted loop playsinline autoplay preload="metadata" aria-label="${esc(a.alt || "")}"></video>${tag}`;
    } else if (a.img) {
      slot.innerHTML = `<img src="${esc(a.img)}" alt="${esc(a.alt || "")}" loading="lazy" decoding="async">${tag}`;
    } else {
      slot.classList.add("is-empty");
      slot.setAttribute("role", "img");
      slot.setAttribute("aria-label", a.alt || slot.dataset.asset);
    }
  });
}
