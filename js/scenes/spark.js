// SC 02 · Spark
// 2,000 particles, one per community member. As you scroll they fly from a scatter into
// the "Ps" logo (teaching himself Photoshop), then "@mpjgfx", then "2,000".
// Each particle is a spring, so the cursor can knock them loose and they snap back.

import { fitCanvas, onResize, reduceMotion, rand, onVisible, formatNumber } from "../core/util.js";

const COUNT = 2000;
const { ScrollTrigger } = window;

export async function initSpark() {
  const section = document.getElementById("spark");
  const canvas = document.getElementById("spark-particles");
  const countEl = document.getElementById("spark-count");
  try {
    await document.fonts.load('900 200px "Fraunces"');
  } catch {}

  let { ctx, w, h } = fitCanvas(canvas);
  const count = w < 600 ? 1200 : COUNT; // fewer on phones
  const xs = new Float32Array(count);
  const ys = new Float32Array(count);
  const vx = new Float32Array(count);
  const vy = new Float32Array(count);
  const tx = new Float32Array(count);
  const ty = new Float32Array(count);
  const hot = new Uint8Array(count);
  for (let i = 0; i < count; i++) {
    xs[i] = rand(0, w);
    ys[i] = rand(0, h);
    hot[i] = Math.random() < 0.07 ? 1 : 0;
  }

  let shapes = [];
  let mouse = { x: -9999, y: -9999 };
  let progress = 0;
  let running = false;

  // Where shapes form: the open right side on desktop (copy panel is on the left),
  // the upper part of the screen on phones (copy sits at the bottom).
  function region() {
    if (w > 860) {
      const panel = section.querySelector(".copy--glass")?.getBoundingClientRect();
      const x = Math.max(w * 0.44, (panel?.right || 0) + 32);
      return { x, y: h * 0.22, w: Math.max(200, w - x - 48), h: h * 0.64 };
    }
    return { x: w * 0.04, y: h * 0.16, w: w * 0.92, h: h * 0.34 };
  }

  // Sample a shape by drawing text offscreen and reading back its pixels.
  function sampleText(text, weight = 900, family = "Fraunces", scale = 1) {
    const off = document.createElement("canvas");
    const reg = region();
    const ow = Math.round(reg.w);
    const oh = Math.round(reg.h);
    off.width = ow;
    off.height = oh;
    const o = off.getContext("2d");
    let size = Math.min(oh * 0.8, (ow / Math.max(text.length, 2)) * 1.7) * scale;
    o.font = `${weight} ${size}px ${family}`;
    while (o.measureText(text).width > ow * 0.95 && size > 20) {
      size *= 0.92;
      o.font = `${weight} ${size}px ${family}`;
    }
    o.fillStyle = "#fff";
    o.textAlign = "center";
    o.textBaseline = "middle";
    o.fillText(text, ow / 2, oh / 2);
    return pixelsToPoints(o, ow, oh);
  }

  function sampleLogo() {
    // A rounded square with "Ps" knocked out (a nod, not the real logo).
    const off = document.createElement("canvas");
    const reg = region();
    const s = Math.round(Math.min(reg.w, reg.h) * 0.85);
    off.width = s;
    off.height = s;
    const o = off.getContext("2d");
    o.fillStyle = "#fff";
    roundRect(o, s * 0.05, s * 0.05, s * 0.9, s * 0.9, s * 0.18);
    o.fill();
    o.globalCompositeOperation = "destination-out";
    o.font = `600 ${s * 0.46}px Inter, sans-serif`;
    o.textAlign = "center";
    o.textBaseline = "middle";
    o.fillText("Ps", s / 2, s * 0.53);
    o.globalCompositeOperation = "source-over";
    // Outline stroke so the letters read even with sparse particles
    return pixelsToPoints(o, s, s);
  }

  function pixelsToPoints(o, ow, oh) {
    const data = o.getImageData(0, 0, ow, oh).data;
    const pts = [];
    const stepPx = 3;
    for (let y = 0; y < oh; y += stepPx) {
      for (let x = 0; x < ow; x += stepPx) {
        if (data[(y * ow + x) * 4 + 3] > 128) pts.push([x, y]);
      }
    }
    // Center inside the shape region
    const reg = region();
    const offX = reg.x + (reg.w - ow) / 2;
    const offY = reg.y + (reg.h - oh) / 2;
    // Shuffle then take `count` (repeat if we have fewer points)
    for (let i = pts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pts[i], pts[j]] = [pts[j], pts[i]];
    }
    const out = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      const p = pts[i % pts.length] || [ow / 2, oh / 2];
      out[i * 2] = p[0] + offX + rand(-0.8, 0.8);
      out[i * 2 + 1] = p[1] + offY + rand(-0.8, 0.8);
    }
    return out;
  }

  function scatter() {
    const out = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      out[i * 2] = rand(0, w);
      out[i * 2 + 1] = rand(0, h);
    }
    return out;
  }

  function buildShapes() {
    shapes = [scatter(), sampleLogo(), sampleText("@mpjgfx", 900, "Fraunces"), sampleText("2,000", 900, "Fraunces")];
  }
  buildShapes();

  // progress → which shape (with a blend window between shapes)
  function updateTargets() {
    const stops = [0, 0.18, 0.48, 0.78];
    let a = 0;
    for (let i = 0; i < stops.length; i++) if (progress >= stops[i]) a = i;
    const shape = shapes[a];
    for (let i = 0; i < count; i++) {
      tx[i] = shape[i * 2];
      ty[i] = shape[i * 2 + 1];
    }
    const members = Math.min(2000, Math.round((progress / 0.85) * 2000));
    countEl.textContent = formatNumber(members);
  }

  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    tickParticles();
  }

  function tickParticles() {
    const k = 0.045; // spring
    const damp = 0.86;
    const r2 = 110 * 110;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#f2ede3";
    // Low-power mode (slow machine detected): simulate every other particle.
    const stride = document.body.classList.contains("low-power") ? 2 : 1;
    for (let pass = 0; pass < 2; pass++) {
      ctx.fillStyle = pass ? "#ff4b2b" : "rgba(242,237,227,0.9)";
      for (let i = 0; i < count; i += stride) {
        if (hot[i] !== pass) continue;
        const dx = xs[i] - mouse.x;
        const dy = ys[i] - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < r2) {
          const f = (1 - d2 / r2) * 3.2;
          const d = Math.sqrt(d2) || 1;
          vx[i] += (dx / d) * f;
          vy[i] += (dy / d) * f;
        }
        vx[i] = (vx[i] + (tx[i] - xs[i]) * k) * damp;
        vy[i] = (vy[i] + (ty[i] - ys[i]) * k) * damp;
        xs[i] += vx[i];
        ys[i] += vy[i];
        ctx.fillRect(xs[i], ys[i], 1.8, 1.8);
      }
    }
  }

  canvas.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  });
  canvas.addEventListener("pointerleave", () => {
    mouse.x = mouse.y = -9999;
  });
  // Click = shockwave
  canvas.addEventListener("click", (e) => {
    const r = canvas.getBoundingClientRect();
    const cx = e.clientX - r.left;
    const cy = e.clientY - r.top;
    for (let i = 0; i < count; i++) {
      const dx = xs[i] - cx;
      const dy = ys[i] - cy;
      const d = Math.hypot(dx, dy) || 1;
      const f = Math.max(0, 400 - d) * 0.12;
      vx[i] += (dx / d) * f;
      vy[i] += (dy / d) * f;
    }
  });

  onVisible(section, (v) => {
    if (v && !running) {
      running = true;
      requestAnimationFrame(frame);
    } else if (!v) running = false;
  });

  if (reduceMotion) {
    progress = 0.9;
    updateTargets();
  } else {
    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "+=260%",
      pin: true,
      onUpdate(self) {
        progress = self.progress;
        updateTargets();
      },
    });
    updateTargets();
  }

  onResize(() => {
    ({ ctx, w, h } = fitCanvas(canvas));
    buildShapes();
    updateTargets();
  });

  // `world.step` mirrors the physics worlds so the ?debug helpers can advance it.
  return { world: { step: (n = 1) => { for (let i = 0; i < n; i++) tickParticles(); } } };
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
