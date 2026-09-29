// Small helpers shared by every scene.

export const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const isTouch = window.matchMedia("(pointer: coarse)").matches;

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const mapRange = (v, a, b, c, d) => c + ((v - a) / (b - a)) * (d - c);
export const rand = (min, max) => min + Math.random() * (max - min);
export const pick = (list) => list[Math.floor(Math.random() * list.length)];

// Deterministic random, so procedural art (mountains, etc.) looks the same every visit.
export function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function esc(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Size a canvas to its CSS box at device pixel ratio (capped at 2 for speed).
// Returns a context already scaled so you can draw in CSS pixels.
export function fitCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h, dpr };
}

// Run `onChange(true/false)` when an element enters/leaves the screen.
export function onVisible(el, onChange, rootMargin = "100px") {
  const io = new IntersectionObserver((entries) => entries.forEach((e) => onChange(e.isIntersecting)), { rootMargin });
  io.observe(el);
  return () => io.disconnect();
}

// Split a heading into word spans so each word can animate on its own.
export function splitWords(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map((w) => `<span class="w">${esc(w)}</span>`).join(" ");
  return [...el.querySelectorAll(".w")];
}

// Debounced resize listener.
export function onResize(fn, wait = 150) {
  let t;
  let lastW = window.innerWidth;
  window.addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      // Mobile browsers fire resize when the URL bar hides; only react to real width changes.
      if (Math.abs(window.innerWidth - lastW) < 2 && window.innerWidth < 900) return;
      lastW = window.innerWidth;
      fn();
    }, wait);
  });
}

export function toast(message, ms = 2400) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  document.body.appendChild(el);
  window.gsap?.fromTo(el, { y: -12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" });
  setTimeout(() => {
    window.gsap?.to(el, { opacity: 0, duration: 0.3, onComplete: () => el.remove() }) ?? el.remove();
  }, ms);
}

export function formatNumber(n) {
  return Math.round(n).toLocaleString("en-US");
}
