// Custom cursor + magnetic buttons (desktop only).
//  - The red dot follows the mouse with a little lag.
//  - Over elements with data-cursor="drag" it grows and shows the word.
//  - Links/buttons turn it into a ring.
//  - Elements with data-magnetic pull toward the pointer.

import { isTouch, lerp, reduceMotion } from "./util.js";

export function initCursor() {
  if (isTouch) return;
  const el = document.getElementById("cursor");
  const label = el.querySelector(".cursor-label");
  document.body.classList.add("has-cursor");

  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const target = { x: pos.x, y: pos.y };

  el.style.opacity = "0"; // hidden until the mouse actually moves
  window.addEventListener(
    "pointermove",
    (e) => {
      if (el.style.opacity === "0") {
        el.style.opacity = "1";
        pos.x = e.clientX;
        pos.y = e.clientY;
      }
      target.x = e.clientX;
      target.y = e.clientY;
    },
    { passive: true }
  );
  document.addEventListener("pointerleave", () => (el.style.opacity = "0"));

  function loop() {
    pos.x = lerp(pos.x, target.x, reduceMotion ? 1 : 0.22);
    pos.y = lerp(pos.y, target.y, reduceMotion ? 1 : 0.22);
    el.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    requestAnimationFrame(loop);
  }
  loop();

  document.addEventListener("pointerover", (e) => {
    const big = e.target.closest("[data-cursor]");
    const link = e.target.closest("a, button");
    el.classList.toggle("is-big", !!big && !link);
    el.classList.toggle("is-link", !!link);
    label.textContent = big && !link ? big.dataset.cursor : "";
  });
  document.addEventListener("pointerdown", () => el.animate([{ scale: 1 }, { scale: 0.7 }, { scale: 1 }], { duration: 250 }));

  initMagnetic();
}

function initMagnetic() {
  const strength = 0.35;
  document.querySelectorAll("[data-magnetic]").forEach(bindMagnetic);
  // Buttons added later (e.g. CTA) call bindMagnetic themselves via this event.
  window.addEventListener("ol:magnetic", (e) => bindMagnetic(e.detail));

  function bindMagnetic(node) {
    if (!node || node.dataset.magBound) return;
    node.dataset.magBound = "1";
    node.style.transition = "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)";
    node.addEventListener("pointermove", (e) => {
      const r = node.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      node.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
    });
    node.addEventListener("pointerleave", () => {
      node.style.transform = "";
    });
  }
}
