// Film texture that reacts to you: grain gets heavier and vertical scratches flicker
// when you scroll fast, like a projector being pushed. Plus a frame-rate watchdog that
// switches the page to low-power mode on slow machines.

import { reduceMotion } from "./util.js";
import { scrollState } from "./smooth.js";

const { gsap } = window;

const perf = { lowPower: false };

export function initFilm() {
  const grain = document.querySelector(".grain");
  const scratches = document.createElement("div");
  scratches.className = "scratches";
  scratches.setAttribute("aria-hidden", "true");
  scratches.innerHTML = "<i></i><i></i><i></i>";
  document.body.appendChild(scratches);
  const lines = [...scratches.children];

  if (!reduceMotion) {
    gsap.ticker.add(() => {
      const v = Math.min(Math.abs(scrollState.velocity), 60);
      grain.style.opacity = String(0.07 + v * 0.0025);
      const on = v > 28;
      scratches.style.opacity = on ? String(Math.min(1, (v - 28) / 20)) : "0";
      if (on && Math.random() < 0.3) {
        lines.forEach((l) => {
          l.style.left = `${Math.random() * 100}%`;
          l.style.opacity = String(Math.random() * 0.7);
        });
      }
    });
  }

  // Frame-rate watchdog: if the average frame is slower than ~30fps for 2 seconds while
  // things are animating, drop to low-power (fewer particles, no grain animation).
  let samples = [];
  let last = performance.now();
  const startedAt = performance.now();
  gsap.ticker.add(() => {
    const now = performance.now();
    const dt = now - last;
    last = now;
    if (now - startedAt < 3000) return; // loading is always a bit janky; don't judge it
    if (document.hidden || perf.lowPower || dt > 250) return; // ignore tab switches
    samples.push(dt);
    if (samples.length > 120) samples.shift();
    if (samples.length === 120) {
      const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
      if (avg > 34) {
        perf.lowPower = true;
        document.body.classList.add("low-power");
        window.dispatchEvent(new CustomEvent("ol:lowpower"));
      }
    }
  });
}
