// Fills every [data-asset] slot from window.ASSETS (js/assets.js).
// Real photos render plainly; AI placeholders get a small label. A slot with no file
// falls back to a CSS gradient (see .media.is-empty) so the layout never looks broken.

import { esc } from "./util.js";

// Every photo ships as AVIF (about half the bytes) with the JPEG/PNG as a fallback.
export function picture(src, alt = "", attrs = 'loading="lazy" decoding="async"') {
  const avif = src.replace(/\.(jpe?g|png)$/, ".avif");
  return `<picture><source srcset="${esc(avif)}" type="image/avif"><img src="${esc(src)}" alt="${esc(alt)}" ${attrs}></picture>`;
}

export function initMedia() {
  const assets = window.ASSETS || {};
  document.querySelectorAll("[data-asset]").forEach((slot) => {
    const a = assets[slot.dataset.asset] || {};
    if (a.img) {
      slot.innerHTML = picture(a.img, a.alt) + (a.real ? "" : '<span class="tag">placeholder · AI</span>');
    } else {
      slot.classList.add("is-empty");
      slot.setAttribute("role", "img");
      slot.setAttribute("aria-label", a.alt || slot.dataset.asset);
    }
  });
}
