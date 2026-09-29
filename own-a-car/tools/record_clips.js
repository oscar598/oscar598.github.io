// Records the site's physics pieces as frame sequences for video (CDP screencast, resampled to 30 fps).
// Serve a copy of own-a-car/ with demo data (counter above 0) at SITE, then:
//   node own-a-car/tools/record_clips.js <outDir> [landscape|portrait] [scene ...]
// Scenes: rain, shatter, names. Landscape = 1280×720 at 1.5× (1920×1080); portrait = 432×768 at 2.5× (1080×1920).
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const SITE = process.env.SITE || "http://localhost:8094/own-a-car/";
const [outDir = "clips", format = "landscape", ...only] = process.argv.slice(2);
const VIEW = format === "portrait" ? { width: 432, height: 768, dpr: 2.5 } : { width: 1280, height: 720, dpr: 1.5 };

async function capture(page, dir, ms, action) {
  fs.mkdirSync(dir, { recursive: true });
  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  cdp.on("Page.screencastFrame", (f) => {
    frames.push({ t: f.metadata.timestamp, d: f.data });
    cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
  });
  const px = { maxWidth: Math.round(VIEW.width * VIEW.dpr), maxHeight: Math.round(VIEW.height * VIEW.dpr) };
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, everyNthFrame: 1, ...px });
  const run = action().catch(() => {});
  await page.waitForTimeout(ms);
  await cdp.send("Page.stopScreencast");
  await run;
  // Hold the latest frame at each 1/30 s tick so the output plays at a steady 30 fps.
  const t0 = frames[0].t, t1 = frames[frames.length - 1].t;
  let i = 0, n = 0;
  for (let t = t0; t <= t1; t += 1 / 30) {
    while (i + 1 < frames.length && frames[i + 1].t <= t) i++;
    fs.writeFileSync(path.join(dir, String(n++).padStart(5, "0") + ".jpg"), Buffer.from(frames[i].d, "base64"));
  }
  console.log(dir, n, "frames");
}

async function page(browser) {
  const p = await browser.newPage({ viewport: { width: VIEW.width, height: VIEW.height }, deviceScaleFactor: VIEW.dpr });
  return p;
}

// Hide the sticky header and put one section's top at the top of the frame.
const focus = (p, sel, offset = 0) => p.evaluate(([s, o]) => {
  document.querySelector(".bar").style.display = "none";
  window.scrollTo(0, document.querySelector(s).getBoundingClientRect().top + window.scrollY + o);
}, [sel, offset]);

const scenes = {
  // Keys pour in and pile up; one is thrown; "Drop a key" lands YOU.
  async rain(b) {
    const p = await page(b);
    await capture(p, path.join(outDir, "rain"), 8000, async () => {
      await p.goto(SITE);
      await p.evaluate(() => { document.querySelector(".bar").style.display = "none"; });
      await p.waitForTimeout(3000);
      const c = await p.locator("#rain").boundingBox();
      await p.mouse.move(c.x + c.width * 0.62, c.y + c.height - 30);
      await p.mouse.down();
      for (let i = 0; i < 14; i++) {
        await p.mouse.move(c.x + c.width * (0.62 - i * 0.02), c.y + c.height - 40 - i * 26);
        await p.waitForTimeout(16);
      }
      await p.mouse.up();
      await p.waitForTimeout(1500);
      await p.click("#rain-drop");
    });
    await p.close();
  },
  // The owner slider sweeps 1 → 100,000 and the car shatters.
  async shatter(b) {
    const p = await page(b);
    await p.goto(SITE);
    await focus(p, "#share", format === "portrait" ? 60 : 150);
    await p.evaluate(() => { const r = document.getElementById("s-range"); r.value = 0; r.dispatchEvent(new Event("input")); });
    await p.waitForTimeout(3000);
    await capture(p, path.join(outDir, "shatter"), 9500, () => p.evaluate(() => new Promise((res) => {
      const r = document.getElementById("s-range");
      let v = 0;
      setTimeout(function step() {
        v += 7; r.value = Math.min(1000, v); r.dispatchEvent(new Event("input"));
        if (v < 1000) setTimeout(step, 55); else res();
      }, 900);
    })));
    await p.close();
  },
  // The loupe drifts across the car, reading owners' names.
  async names(b) {
    const p = await page(b);
    await p.goto(SITE);
    await focus(p, ".names-band", format === "portrait" ? 40 : 120);
    await p.waitForTimeout(2000);
    const c = await p.locator("#n-canvas").boundingBox();
    await capture(p, path.join(outDir, "names"), 6000, async () => {
      for (let i = 0; i <= 60; i++) {
        await p.mouse.move(c.x + c.width * (0.2 + i * 0.01), c.y + c.height * (0.45 + 0.08 * Math.sin(i / 8)));
        await p.waitForTimeout(80);
      }
    });
    await p.close();
  },
};

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" }).catch(() => chromium.launch());
  for (const name of only.length ? only : Object.keys(scenes)) await scenes[name](b);
  await b.close();
})();
