// "The Level": a tiny endless-runner version of the story (loaded only when opened).
// Run through six zones from LA to Princeton, collect each chapter's objects, jump the obstacles.
// Controls: Space / ↑ / tap to jump (double jump allowed). Esc to quit.
// (The Ukraine chapter is intentionally not part of the game.)

import { fitCanvas, reduceMotion } from "../core/util.js";
import { sound } from "../core/sound.js";

const ZONES = [
  { name: "LOS ANGELES", year: "2008", sky: ["#f6b27a", "#e86a2c"], ground: "#6b3b1f", item: "orange", obstacle: "box" },
  { name: "LOCKDOWN", year: "2020", sky: ["#1f2a44", "#0e1424"], ground: "#2a2f3d", item: "ps", obstacle: "couch" },
  { name: "HARVARD HARDWOOD", year: "2021", sky: ["#a51c30", "#3b0a12"], ground: "#c8995c", item: "mail", obstacle: "cone" },
  { name: "THE FARM", year: "2022", sky: ["#6fa36a", "#2f5d3a"], ground: "#3d2b1a", item: "card", obstacle: "hurdle" },
  { name: "LEADVILLE, 10,152 FT", year: "2024", sky: ["#2b2350", "#c86f7c"], ground: "#433049", item: "peak", obstacle: "rock" },
  { name: "PRINCETON", year: "2026", sky: ["#ff8a3d", "#1c1c3a"], ground: "#2d3b2a", item: "ball", obstacle: "bench" },
];
const ZONE_LENGTH = 2200; // px of running per zone
const GRAVITY = 0.62;
const JUMP = -12.5;

export function openLevel(site) {
  const overlay = document.createElement("div");
  overlay.className = "level";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-label", "The Level: a playable mini-game");
  overlay.setAttribute("data-lenis-prevent", "");
  overlay.innerHTML = `
    <canvas></canvas>
    <div class="level-hud mono"><span class="lv-zone"></span><span class="lv-score"></span><span class="lv-hearts"></span></div>
    <button class="level-close" type="button" aria-label="Quit the level">esc ✕</button>
    <div class="level-card" hidden></div>`;
  document.body.appendChild(overlay);
  document.documentElement.style.overflow = "hidden";

  const canvas = overlay.querySelector("canvas");
  const hudZone = overlay.querySelector(".lv-zone");
  const hudScore = overlay.querySelector(".lv-score");
  const hudHearts = overlay.querySelector(".lv-hearts");
  const card = overlay.querySelector(".level-card");
  let { ctx, w, h } = fitCanvas(canvas);

  let state;
  let raf = 0;
  let best = 0;
  try {
    best = Number(localStorage.getItem("ol-level-best") || 0);
  } catch {}

  function reset() {
    state = {
      dist: 0,
      speed: 6.2,
      player: { x: w * 0.18, y: 0, vy: 0, jumps: 0, onGround: true, hurtUntil: 0, frame: 0 },
      items: [],
      obstacles: [],
      particles: [],
      score: 0,
      hearts: 3,
      zone: -1,
      banner: 0,
      over: false,
      nextItem: 400,
      nextObstacle: 900,
    };
    card.hidden = true;
  }

  const groundY = () => h * 0.78;

  function jump() {
    const p = state.player;
    if (state.over) return;
    if (p.jumps < 2) {
      p.vy = JUMP * (p.jumps ? 0.85 : 1);
      p.jumps++;
      p.onGround = false;
      sound.pop();
    }
  }

  // ---------- Input ----------
  function onKey(e) {
    if (e.key === "Escape") return close();
    if (e.key === " " || e.key === "ArrowUp" || e.key === "w") {
      e.preventDefault();
      if (state.over) return;
      jump();
    }
  }
  window.addEventListener("keydown", onKey);
  canvas.addEventListener("pointerdown", jump);
  overlay.querySelector(".level-close").addEventListener("click", close);

  // ---------- Spawning ----------
  function spawn() {
    const z = ZONES[state.zone] || ZONES[0];
    if (state.dist > state.nextItem) {
      const high = Math.random() < 0.45;
      state.items.push({ x: w + 40, y: groundY() - (high ? 150 : 50), kind: z.item, bob: Math.random() * 6 });
      state.nextItem = state.dist + 260 + Math.random() * 320;
    }
    if (state.dist > state.nextObstacle) {
      state.obstacles.push({ x: w + 40, kind: z.obstacle, w: 34 + Math.random() * 16, h: 34 + Math.random() * 22 });
      state.nextObstacle = state.dist + 520 + Math.random() * 520 - Math.min(state.speed * 12, 160);
    }
  }

  // ---------- Update ----------
  function update() {
    const s = state;
    if (s.over) return;
    s.dist += s.speed;
    s.speed = Math.min(11, s.speed + 0.0012);

    const zone = Math.min(ZONES.length - 1, Math.floor(s.dist / ZONE_LENGTH));
    if (zone !== s.zone) {
      s.zone = zone;
      s.banner = 140;
      hudZone.textContent = `${ZONES[zone].year} · ${ZONES[zone].name}`;
      sound.chime();
    }
    if (s.dist > ZONE_LENGTH * ZONES.length) return win();

    const p = s.player;
    p.vy += GRAVITY;
    p.y += p.vy;
    if (p.y >= 0) {
      p.y = 0;
      p.vy = 0;
      p.jumps = 0;
      p.onGround = true;
    }
    p.frame += s.speed * 0.05;

    spawn();
    const px = p.x;
    const py = groundY() + p.y;

    s.items.forEach((it) => (it.x -= s.speed));
    s.items = s.items.filter((it) => {
      if (Math.abs(it.x - px) < 30 && Math.abs(it.y + Math.sin((s.dist + it.bob * 40) * 0.04) * 6 - (py - 36)) < 44) {
        s.score++;
        burst(it.x, it.y, "#ffb13b");
        sound.pop();
        return false;
      }
      return it.x > -60;
    });

    s.obstacles.forEach((o) => (o.x -= s.speed));
    s.obstacles = s.obstacles.filter((o) => {
      const hit = px + 12 > o.x && px - 12 < o.x + o.w && py > groundY() - o.h + 4;
      if (hit && performance.now() > p.hurtUntil) {
        s.hearts--;
        p.hurtUntil = performance.now() + 1200;
        burst(px, py - 30, "#ff4b2b");
        sound.thump(1);
        if (s.hearts <= 0) lose();
      }
      return o.x > -80;
    });

    s.particles.forEach((q) => {
      q.x += q.vx;
      q.y += q.vy;
      q.vy += 0.3;
      q.life--;
    });
    s.particles = s.particles.filter((q) => q.life > 0);
    if (s.banner > 0) s.banner--;

    hudScore.textContent = `★ ${s.score}${best ? ` · best ${best}` : ""}`;
    hudHearts.textContent = "♥".repeat(Math.max(0, s.hearts)) + "♡".repeat(Math.max(0, 3 - s.hearts));
  }

  function burst(x, y, color) {
    for (let i = 0; i < 12; i++) {
      state.particles.push({ x, y, vx: (Math.random() - 0.5) * 7, vy: -Math.random() * 6, life: 28, color });
    }
  }

  // ---------- Draw ----------
  function draw() {
    const s = state;
    const z = ZONES[Math.max(0, s.zone)];
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, z.sky[0]);
    g.addColorStop(1, z.sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Parallax skyline blocks
    for (let layer = 0; layer < 2; layer++) {
      const speed = layer ? 0.5 : 0.2;
      ctx.fillStyle = layer ? "rgba(0,0,0,0.22)" : "rgba(0,0,0,0.12)";
      const base = groundY() - (layer ? 40 : 110);
      for (let i = -1; i < w / 120 + 2; i++) {
        const x = i * 120 - ((s.dist * speed) % 120);
        const hh = 40 + ((i * 97 + layer * 31 + Math.floor((s.dist * speed) / 120) * 13) % 70);
        ctx.fillRect(x, base - hh, 90, hh + (layer ? 40 : 110));
      }
    }

    // Ground
    ctx.fillStyle = z.ground;
    ctx.fillRect(0, groundY(), w, h - groundY());
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    for (let i = 0; i < w / 40 + 2; i++) ctx.fillRect(i * 40 - (s.dist % 40), groundY() + 10, 20, 3);

    s.items.forEach((it) => drawItem(it.kind, it.x, it.y + Math.sin((s.dist + it.bob * 40) * 0.04) * 6));
    s.obstacles.forEach((o) => drawObstacle(o));
    drawPlayer();

    s.particles.forEach((q) => {
      ctx.globalAlpha = q.life / 28;
      ctx.fillStyle = q.color;
      ctx.fillRect(q.x, q.y, 4, 4);
    });
    ctx.globalAlpha = 1;

    // Zone banner
    if (s.banner > 0) {
      const a = Math.min(1, s.banner / 30);
      ctx.globalAlpha = a;
      ctx.fillStyle = "#f2ede3";
      ctx.textAlign = "center";
      ctx.font = `900 ${Math.min(64, w / 12)}px Fraunces, Georgia, serif`;
      ctx.fillText(z.name, w / 2, h * 0.32);
      ctx.font = `500 14px "JetBrains Mono", monospace`;
      ctx.fillText(`CHAPTER ${String(s.zone + 1).padStart(2, "0")} · ${z.year}`, w / 2, h * 0.32 + 32);
      ctx.globalAlpha = 1;
      ctx.textAlign = "left";
    }

    // Progress bar
    const prog = Math.min(1, s.dist / (ZONE_LENGTH * ZONES.length));
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(24, h - 20, w - 48, 4);
    ctx.fillStyle = "#ff4b2b";
    ctx.fillRect(24, h - 20, (w - 48) * prog, 4);
  }

  function drawPlayer() {
    const p = state.player;
    const x = p.x;
    const y = groundY() + p.y;
    const blink = performance.now() < p.hurtUntil && Math.floor(performance.now() / 80) % 2;
    if (blink) return;
    ctx.save();
    ctx.translate(x, y);
    // legs
    ctx.strokeStyle = "#0e0d0b";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    const swingA = p.onGround ? Math.sin(p.frame) * 0.7 : 0.4;
    [swingA, -swingA].forEach((a) => {
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(Math.sin(a) * 14, -2);
      ctx.stroke();
    });
    // body (red hoodie)
    ctx.fillStyle = "#ff4b2b";
    ctx.fillRect(-10, -48, 20, 28);
    // head
    ctx.fillStyle = "#f2ede3";
    ctx.beginPath();
    ctx.arc(0, -58, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0e0d0b";
    ctx.fillRect(-10, -68, 20, 6); // hair
    ctx.fillRect(3, -60, 3, 3); // eye
    ctx.restore();
  }

  function drawItem(kind, x, y) {
    ctx.save();
    ctx.translate(x, y);
    switch (kind) {
      case "orange":
        ctx.fillStyle = "#f28c28";
        ctx.beginPath();
        ctx.arc(0, 0, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#3f7d2f";
        ctx.fillRect(1, -17, 8, 4);
        break;
      case "ps":
        ctx.fillStyle = "#001e36";
        ctx.fillRect(-14, -14, 28, 28);
        ctx.fillStyle = "#31a8ff";
        ctx.font = "700 14px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Ps", 0, 5);
        break;
      case "mail":
        ctx.fillStyle = "#f2ede3";
        ctx.fillRect(-16, -11, 32, 22);
        ctx.strokeStyle = "#a51c30";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-16, -11);
        ctx.lineTo(0, 2);
        ctx.lineTo(16, -11);
        ctx.stroke();
        break;
      case "card":
        ctx.fillStyle = "#fff";
        ctx.fillRect(-15, -10, 30, 20);
        ctx.fillStyle = "#ff4b2b";
        ctx.fillRect(-11, -5, 22, 3);
        ctx.fillRect(-11, 1, 14, 3);
        break;
      case "peak":
        ctx.fillStyle = "#f2ede3";
        ctx.beginPath();
        ctx.moveTo(-15, 11);
        ctx.lineTo(0, -13);
        ctx.lineTo(15, 11);
        ctx.fill();
        ctx.fillStyle = "#ff4b2b";
        ctx.fillRect(-1, -20, 2, 9);
        ctx.fillRect(1, -20, 7, 4);
        break;
      default:
        ctx.fillStyle = "#7dd3fc";
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
  }

  function drawObstacle(o) {
    const top = groundY() - o.h;
    ctx.fillStyle = {
      box: "#c9a26b",
      couch: "#5b4b8a",
      cone: "#ff8a3d",
      hurdle: "#f2ede3",
      rock: "#8a8190",
      bench: "#4a3b2a",
    }[o.kind] || "#999";
    if (o.kind === "cone") {
      ctx.beginPath();
      ctx.moveTo(o.x, groundY());
      ctx.lineTo(o.x + o.w / 2, top);
      ctx.lineTo(o.x + o.w, groundY());
      ctx.fill();
    } else if (o.kind === "hurdle") {
      ctx.fillRect(o.x, top, o.w, 6);
      ctx.fillRect(o.x + 2, top, 4, o.h);
      ctx.fillRect(o.x + o.w - 6, top, 4, o.h);
    } else if (o.kind === "rock") {
      ctx.beginPath();
      ctx.ellipse(o.x + o.w / 2, groundY(), o.w / 2, o.h, 0, Math.PI, 0);
      ctx.fill();
    } else {
      ctx.fillRect(o.x, top, o.w, o.h);
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(o.x, top, o.w, 5);
    }
  }

  // ---------- End states ----------
  function saveBest() {
    if (state.score > best) {
      best = state.score;
      try {
        localStorage.setItem("ol-level-best", String(best));
      } catch {}
    }
  }

  function lose() {
    state.over = true;
    saveBest();
    showCard(`<p class="label">Take 2</p><h3>Everybody stumbles.</h3><p>You collected ${state.score} and made it to ${ZONES[state.zone].name.toLowerCase()}.</p>
      <div class="lv-cta"><button class="btn btn--primary" data-retry>Run it back</button><button class="btn" data-quit>Back to the story</button></div>`);
  }

  function win() {
    state.over = true;
    saveBest();
    sound.chime();
    showCard(`<p class="label">Level complete · ★ ${state.score}</p><h3>That's the story so far.</h3><p>Your team is the next level.</p>
      <div class="lv-cta"><a class="btn btn--primary" href="mailto:${site.person.email}">Email Oscar</a><a class="btn" href="resume.html">Resume</a><button class="btn" data-retry>Play again</button></div>`);
  }

  function showCard(html) {
    card.innerHTML = html;
    card.hidden = false;
    card.querySelector("[data-retry]")?.addEventListener("click", () => {
      reset();
      canvas.focus();
    });
    card.querySelector("[data-quit]")?.addEventListener("click", close);
  }

  // ---------- Loop ----------
  function loop() {
    raf = requestAnimationFrame(loop);
    update();
    draw();
  }

  function close() {
    cancelAnimationFrame(raf);
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("resize", onResize);
    document.documentElement.style.overflow = "";
    overlay.remove();
  }

  function onResize() {
    ({ ctx, w, h } = fitCanvas(canvas));
  }
  window.addEventListener("resize", onResize);

  reset();
  if (reduceMotion) state.speed = 4.5;
  loop();
  if (location.search.includes("debug")) {
    // Test hooks: advance frames without rAF; a simple bot that jumps near obstacles.
    window.__level = {
      step(n = 1, bot = true) {
        for (let i = 0; i < n; i++) {
          if (bot && !state.over) {
            const near = state.obstacles.find((o) => o.x - state.player.x < 70 && o.x - state.player.x > 20);
            if (near && state.player.onGround) jump();
          }
          update();
        }
        draw();
        return { dist: Math.round(state.dist), zone: state.zone, score: state.score, hearts: state.hearts, over: state.over };
      },
    };
  }
  return { close };
}
