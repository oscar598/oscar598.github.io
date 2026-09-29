// SC 01 · Origin
// Pinned while you scroll: the objects of a kid's hustle pour into the frame and pile up.
// Oranges and juice cups (age 8), eBay boxes and phone cases (age 10), a bike wheel (the hour-long ride),
// coins for every sale. You can grab and throw everything.

import { createWorld, drawBodies } from "../core/world.js";
import { rand, reduceMotion } from "../core/util.js";
import { stats } from "../core/stats.js";

const { Bodies, Body } = window.Matter;
const { ScrollTrigger } = window;

// Waves of objects, in story order. `at` = scroll progress when the wave starts.
const WAVES = [
  { at: 0.0, caption: "age 8 · orange juice, $1 a cup", kinds: ["orange", "orange", "juice", "coin", "orange", "juice", "coin", "orange", "orange", "juice", "coin", "orange"] },
  { at: 0.3, caption: "age 10 · phone accessories on eBay", kinds: ["box", "phone", "box", "coin", "phone", "box", "coin", "phone", "box", "phone", "coin"] },
  { at: 0.6, caption: "an hour each way · the bike ride to school", kinds: ["bike", "coin", "coin", "orange", "box"] },
  { at: 0.85, caption: "→ it all adds up", kinds: ["coin", "coin", "coin", "coin", "coin", "coin", "coin", "coin", "coin", "coin", "coin", "coin"] },
];

export function initOrigin() {
  const section = document.getElementById("origin");
  const canvas = document.getElementById("origin-world");
  const caption = document.getElementById("origin-caption");
  const sprites = window.ASSETS?.sprites || {};
  const images = {};
  Object.entries(sprites).forEach(([k, src]) => {
    if (!src) return;
    const img = new Image();
    img.src = src;
    images[k] = img;
  });

  const world = createWorld(canvas, {
    walls: { floor: true, left: true, right: true, ceiling: false },
    onGrab: () => stats.objects++,
    // Soft drop shadow; canvas shadows ignore rotation, so they always fall down-right.
    draw(ctx, w, h, api) {
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.45)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 6;
      drawBodies(ctx, api.bodies());
      ctx.restore();
    },
    beforeDraw(ctx, w, h) {
      // Faint ruled paper
      ctx.strokeStyle = "rgba(242,237,227,0.05)";
      for (let y = 30; y < h; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    },
  });

  // Queue of kinds to spawn; filled as scroll passes each wave.
  const queue = [];
  let waveIndex = -1;
  let spawnTimer = 0;
  const unit = () => Math.max(16, Math.min(world.w, world.h) / 12.5);

  function spawn(kind) {
    const u = unit();
    const x = rand(world.w * 0.15, world.w * 0.85);
    const y = -u * 3;
    const common = { restitution: 0.3, friction: 0.4, frictionAir: 0.01, angle: rand(-1, 1) };
    let body;
    switch (kind) {
      case "orange":
        body = Bodies.circle(x, y, u * 0.9, { ...common, restitution: 0.45 });
        body.plugin.draw = spriteOr("orange", u * 1.8, u * 1.8, (c) => {
          c.fillStyle = "#f28c28";
          c.beginPath();
          c.arc(0, 0, u * 0.9, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = "rgba(255,255,255,0.25)";
          c.beginPath();
          c.arc(-u * 0.3, -u * 0.3, u * 0.25, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = "#3f7d2f";
          c.beginPath();
          c.ellipse(u * 0.15, -u * 0.95, u * 0.28, u * 0.12, -0.5, 0, Math.PI * 2);
          c.fill();
        }, (c) => {
          c.beginPath();
          c.arc(0, 0, u * 0.9, 0, Math.PI * 2);
        });
        break;
      case "juice": {
        const w = u * 1.2;
        const h = u * 1.7;
        body = Bodies.trapezoid(x, y, w, h, 0.2, { ...common, density: 0.0012 });
        body.plugin.draw = spriteOr("juice", h * 0.72, h * 1.28, (c) => {
          c.fillStyle = "#f2ede3";
          c.beginPath();
          c.moveTo(-w * 0.4, -h / 2);
          c.lineTo(w * 0.4, -h / 2);
          c.lineTo(w * 0.5, h / 2);
          c.lineTo(-w * 0.5, h / 2);
          c.closePath();
          c.fill();
          c.fillStyle = "#ffb13b";
          c.fillRect(-w * 0.42, -h * 0.15, w * 0.84, h * 0.6);
          c.strokeStyle = "#ff4b2b";
          c.lineWidth = 3;
          c.beginPath();
          c.moveTo(w * 0.1, -h / 2);
          c.lineTo(w * 0.3, -h * 0.85);
          c.stroke();
        }, (c) => {
          c.beginPath();
          c.moveTo(-w * 0.4, -h / 2);
          c.lineTo(w * 0.4, -h / 2);
          c.lineTo(w * 0.5, h / 2);
          c.lineTo(-w * 0.5, h / 2);
          c.closePath();
        }, Math.PI); // the body is flipped so cups land upright; flip the photo to match
        // Physics trapezoid points down; flip so cups land upright more often.
        Body.setAngle(body, Math.PI + rand(-0.4, 0.4));
        break;
      }
      case "box": {
        const w = u * rand(1.8, 2.6);
        const h = u * rand(1.2, 1.7);
        body = Bodies.rectangle(x, y, w, h, { ...common, chamfer: { radius: 3 }, density: 0.0015 });
        body.plugin.draw = spriteOr("box", w, h, (c) => {
          c.fillStyle = "#c9a26b";
          c.fillRect(-w / 2, -h / 2, w, h);
          c.fillStyle = "#b08850";
          c.fillRect(-w * 0.08, -h / 2, w * 0.16, h);
          c.fillStyle = "#f2ede3";
          c.fillRect(-w * 0.35, h * 0.05, w * 0.3, h * 0.25);
          c.fillStyle = "#0e0d0b";
          c.font = `700 ${Math.max(9, u * 0.35)}px "JetBrains Mono", monospace`;
          c.textAlign = "center";
          c.textBaseline = "middle";
          c.fillText("eBay", w * 0.25, -h * 0.2);
        }, (c) => {
          c.beginPath();
          c.rect(-w / 2, -h / 2, w, h);
        });
        break;
      }
      case "phone": {
        const w = u * 0.95;
        const h = u * 1.9;
        body = Bodies.rectangle(x, y, w, h, { ...common, chamfer: { radius: w * 0.2 }, density: 0.002 });
        body.plugin.draw = spriteOr("phone", w, h, (c) => {
          c.fillStyle = ["#ff4b2b", "#3b82f6", "#f2ede3", "#a3e635"][Math.floor(Math.abs(body.id) % 4)];
          roundRect(c, -w / 2, -h / 2, w, h, w * 0.2);
          c.fill();
          c.fillStyle = "#0e0d0b";
          roundRect(c, -w * 0.32, -h * 0.4, w * 0.3, w * 0.3, 3);
          c.fill();
        }, (c) => roundRect(c, -w / 2, -h / 2, w, h, w * 0.2));
        break;
      }
      case "bike": {
        const r = u * 1.6;
        body = Bodies.circle(x, y, r, { ...common, restitution: 0.5, density: 0.0009 });
        body.plugin.draw = spriteOr("bike", r * 2, r * 2, (c) => {
          c.strokeStyle = "#f2ede3";
          c.lineWidth = u * 0.28;
          c.beginPath();
          c.arc(0, 0, r - u * 0.14, 0, Math.PI * 2);
          c.stroke();
          c.lineWidth = 1;
          c.strokeStyle = "rgba(242,237,227,0.7)";
          for (let i = 0; i < 16; i++) {
            const a = (i / 16) * Math.PI * 2;
            c.beginPath();
            c.moveTo(0, 0);
            c.lineTo(Math.cos(a) * (r - u * 0.3), Math.sin(a) * (r - u * 0.3));
            c.stroke();
          }
          c.fillStyle = "#ff4b2b";
          c.beginPath();
          c.arc(0, 0, u * 0.22, 0, Math.PI * 2);
          c.fill();
        });
        break;
      }
      default: {
        const r = u * 0.45;
        body = Bodies.circle(x, y, r, { ...common, restitution: 0.6, density: 0.003 });
        body.plugin.draw = (c, b) => {
          c.fillStyle = "#e8c547";
          c.beginPath();
          c.arc(0, 0, r, 0, Math.PI * 2);
          c.fill();
          clayLight(c, b, (cc) => {
            cc.beginPath();
            cc.arc(0, 0, r, 0, Math.PI * 2);
          }, r * 2);
          c.strokeStyle = "#b8942a";
          c.lineWidth = 1.5;
          c.beginPath();
          c.arc(0, 0, r * 0.7, 0, Math.PI * 2);
          c.stroke();
          c.fillStyle = "#8a6d18";
          c.font = `700 ${r}px "JetBrains Mono", monospace`;
          c.textAlign = "center";
          c.textBaseline = "middle";
          c.fillText("$", 0, 1);
        };
      }
    }
    Body.setVelocity(body, { x: rand(-2, 2), y: rand(2, 6) });
    Body.setAngularVelocity(body, rand(-0.15, 0.15));
    world.add(body);
  }

  // Use an AI sprite if one exists in assets.js, otherwise the procedural drawing
  // plus "clay" lighting: a soft light from the top-left that stays fixed while the object spins.
  function spriteOr(key, w, h, fallback, outline, spriteRotation = 0) {
    return (c, body) => {
      const img = images[key];
      if (img && img.complete && img.naturalWidth) {
        if (spriteRotation) c.rotate(spriteRotation);
        c.drawImage(img, -w / 2, -h / 2, w, h);
        return;
      }
      fallback(c);
      if (outline) clayLight(c, body, outline, Math.max(w, h));
    };
  }

  function clayLight(c, body, outline, size) {
    c.save();
    c.shadowColor = "transparent"; // the light overlay shouldn't cast its own shadow
    outline(c);
    c.clip();
    c.rotate(-body.angle); // back to world space: light always comes from the top-left
    const g = c.createLinearGradient(-size * 0.6, -size * 0.6, size * 0.6, size * 0.6);
    g.addColorStop(0, "rgba(255,255,255,0.32)");
    g.addColorStop(0.45, "rgba(255,255,255,0)");
    g.addColorStop(1, "rgba(0,0,0,0.35)");
    c.fillStyle = g;
    c.fillRect(-size, -size, size * 2, size * 2);
    c.restore();
  }

  function setWave(i) {
    if (i <= waveIndex) return;
    for (let k = waveIndex + 1; k <= i; k++) {
      queue.push(...WAVES[k].kinds);
    }
    waveIndex = i;
    caption.textContent = WAVES[i].caption;
  }

  // Drip-feed the queue so things pour rather than appear all at once.
  world.engine && window.Matter.Events.on(world.engine, "beforeUpdate", () => {
    spawnTimer += 1;
    if (queue.length && spawnTimer > 7) {
      spawnTimer = 0;
      spawn(queue.shift());
    }
    // Cap the pile so it never fills the frame completely.
    const bodies = world.bodies();
    if (bodies.length > 70) world.remove(bodies[0]);
  });

  if (reduceMotion) {
    WAVES.forEach((_, i) => setWave(i));
  } else {
    const onUpdate = (self) => {
      let idx = 0;
      WAVES.forEach((wv, i) => {
        if (self.progress >= wv.at) idx = i;
      });
      setWave(idx);
    };
    // Desktop pins the whole scene; phones pin just the stage (text scrolls past first).
    const mm = window.gsap.matchMedia();
    mm.add("(min-width: 861px)", () => {
      ScrollTrigger.create({ trigger: section, start: "top top", end: "+=160%", pin: true, onUpdate, onEnter: () => setWave(0) });
    });
    mm.add("(max-width: 860px)", () => {
      const stage = canvas.parentElement;
      ScrollTrigger.create({ trigger: stage, start: "top 64px", end: "+=140%", pin: true, onUpdate, onEnter: () => setWave(0) });
    });
  }

  // Click (not drag) to drop another object.
  let downAt = null;
  canvas.addEventListener("pointerdown", (e) => (downAt = { x: e.clientX, y: e.clientY }));
  canvas.addEventListener("click", (e) => {
    if (e.detail > 1) return;
    if (downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6) return;
    spawn(["orange", "coin", "box", "phone"][Math.floor(Math.random() * 4)]);
  });

  return { world };
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
