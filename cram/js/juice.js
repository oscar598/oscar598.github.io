// Juice: synthesized sounds, a small particle burst, and count-ups.
// Only practice blocks use it. Diagnostic and the final mock stay silent on purpose.

let ctx = null;
let master = null;

export const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export const sound = {
  enabled: true,
  set(on) { this.enabled = on; if (on) ensure(); },
};

function ensure() {
  if (ctx) { if (ctx.state === "suspended") ctx.resume(); return ctx; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.32;
  master.connect(ctx.destination);
  return ctx;
}

// Browsers only allow audio after a user gesture; unlock on the first one.
export function unlockAudio() { if (sound.enabled) ensure(); }

function tone({ freq, type = "sine", at = 0, attack = 0.004, decay = 0.25, gain = 0.3, slideTo = null }) {
  if (!sound.enabled || !ensure()) return;
  const t = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + decay);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + attack + decay + 0.05);
}

export const sfx = {
  // Bright two-partial bell.
  ding() {
    tone({ freq: 1046.5, decay: 0.45, gain: 0.22 });
    tone({ freq: 2093, decay: 0.25, gain: 0.07 });
  },
  // Quiet and short: information, not punishment.
  miss() { tone({ freq: 196, type: "triangle", decay: 0.16, gain: 0.14, slideTo: 174 }); },
  // The best sound in the app: a missed item that came back and was answered right.
  recovered() {
    [659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
      tone({ freq: f, at: i * 0.075, decay: 0.5 - i * 0.06, gain: 0.18 }));
    tone({ freq: 2637, at: 0.3, decay: 0.3, gain: 0.05 });
  },
  tick() { tone({ freq: 1800, type: "square", decay: 0.02, gain: 0.025 }); },
  // Low bell for "Time. Pencils down."
  pencils() {
    tone({ freq: 392, decay: 1.6, gain: 0.26 });
    tone({ freq: 784, decay: 1.1, gain: 0.08 });
    tone({ freq: 196, type: "triangle", decay: 1.2, gain: 0.12 });
  },
  start() { tone({ freq: 523.25, decay: 0.18, gain: 0.14 }); tone({ freq: 784, at: 0.1, decay: 0.3, gain: 0.14 }); },
  select() { tone({ freq: 1400, decay: 0.03, gain: 0.03 }); },
};

export function haptic(pattern) {
  if (navigator.vibrate) try { navigator.vibrate(pattern); } catch {}
}

// Particle burst from an element's center. Canvas is shared and sits above everything.
let canvas = null, c2d = null, parts = [], raf = 0;
export function burst(el, { count = 18, big = false } = {}) {
  if (reducedMotion() || !el) return;
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.className = "fx";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    c2d = canvas.getContext("2d");
  }
  const dpr = devicePixelRatio || 1;
  canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
  c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const colors = getComputedStyle(document.documentElement).getPropertyValue("--burst").split(",").map(s => s.trim());
  const n = big ? count * 2 : count;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = (big ? 4 : 2.6) + Math.random() * 3;
    parts.push({ x: cx + (Math.random() - 0.5) * r.width * 0.5, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2,
      life: 1, size: 2 + Math.random() * 3, color: colors[i % colors.length] || "#3b82f6" });
  }
  if (!raf) raf = requestAnimationFrame(step);
}
function step() {
  c2d.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter(p => p.life > 0);
  for (const p of parts) {
    p.x += p.vx; p.y += p.vy; p.vy += 0.16; p.vx *= 0.98; p.life -= 0.022;
    c2d.globalAlpha = Math.max(0, p.life);
    c2d.fillStyle = p.color;
    c2d.beginPath(); c2d.arc(p.x, p.y, p.size * p.life + 0.5, 0, Math.PI * 2); c2d.fill();
  }
  c2d.globalAlpha = 1;
  raf = parts.length ? requestAnimationFrame(step) : 0;
  if (!raf) c2d.clearRect(0, 0, innerWidth, innerHeight);
}

// Count a number up inside an element, ticking softly.
export function countUp(el, from, to, { ms = 900, suffix = "", ticks = true } = {}) {
  if (!el) return;
  if (reducedMotion() || from === to) { el.textContent = to + suffix; return; }
  const t0 = performance.now();
  let last = from;
  const frame = now => {
    const k = Math.min(1, (now - t0) / ms);
    const e = 1 - Math.pow(1 - k, 3);
    const v = Math.round(from + (to - from) * e);
    if (v !== last && ticks && Math.abs(v - last) >= 1 && (v % 3 === 0)) sfx.tick();
    last = v;
    el.textContent = v + suffix;
    if (k < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

// Little "+1" pop on the tally.
export function pop(el) {
  if (!el || reducedMotion()) return;
  el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
}
