// Bottom film-strip navigation: one frame per scene. The active frame lights up and
// its bottom bar fills as you scroll through that scene. Click a frame to jump.

import { scrollTo } from "./smooth.js";

const { ScrollTrigger, gsap } = window;

export function initFilmstrip() {
  const strip = document.getElementById("filmstrip");
  const scenes = [...document.querySelectorAll(".scene")];

  scenes.forEach((scene, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "frame-btn";
    btn.setAttribute("aria-label", `Go to ${scene.dataset.label}`);
    btn.innerHTML = `<span>${String(i).padStart(2, "0")}</span><i class="frame-fill"></i><em class="frame-tip mono">${scene.dataset.label}</em>`;
    btn.addEventListener("click", () => scrollTo(scene));
    btn.addEventListener("pointerenter", () => gsap.to(btn.querySelector(".frame-tip"), { opacity: 1, y: 0, duration: 0.2 }));
    btn.addEventListener("pointerleave", () => gsap.to(btn.querySelector(".frame-tip"), { opacity: 0, y: 4, duration: 0.2 }));
    strip.appendChild(btn);

    const fill = btn.querySelector(".frame-fill");
    ScrollTrigger.create({
      trigger: scene,
      start: "top center",
      end: "bottom center",
      onToggle: (self) => btn.classList.toggle("is-active", self.isActive),
      onUpdate: (self) => gsap.set(fill, { scaleX: self.progress }),
    });
  });
}
