// Records the site's physics pieces as frames for X clips (CDP screencast, resampled to 30 fps).
// Serve a copy of own-a-car/ with demo data on SITE (default http://localhost:8094/own-a-car/),
// then: bash own-a-car/tools/clips.sh   (records + encodes marketing/x/clips/*.mp4)
const { chromium } = require('playwright');
const fs = require('fs');
const SITE = process.env.SITE || SITE;
async function capture(page, dir, ms, action) {
  fs.mkdirSync(dir, { recursive: true });
  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  cdp.on('Page.screencastFrame', async (f) => { frames.push({ t: f.metadata.timestamp, d: f.data }); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, everyNthFrame: 1 });
  await action();
  await page.waitForTimeout(ms);
  await cdp.send('Page.stopScreencast');
  // Resample to a steady 30 fps by holding the latest frame at each tick.
  const t0 = frames[0].t, t1 = frames[frames.length - 1].t; let i = 0, n = 0;
  for (let t = t0; t <= t1; t += 1 / 30) { while (i + 1 < frames.length && frames[i + 1].t <= t) i++; fs.writeFileSync(`${dir}/${String(n++).padStart(5, '0')}.jpg`, Buffer.from(frames[i].d, 'base64')); }
  console.log(dir, n, 'frames from', frames.length);
}
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  // 1 · The Shatter: sweep owners from 1 to 100,000.
  let p;
  if (!process.argv.includes('--rain-only')) {
  p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto(SITE + '#share'); await p.waitForTimeout(500);
  await p.evaluate(() => { document.querySelector('.bar').style.display = 'none'; const s = document.getElementById('share'); window.scrollTo(0, s.offsetTop + 150); });
  await p.evaluate(() => { const r = document.getElementById('s-range'); r.value = 0; r.dispatchEvent(new Event('input')); });
  await p.waitForTimeout(2500);
  await capture(p, 'shatter', 9500, async () => {
    p.evaluate(() => new Promise((res) => {
      const r = document.getElementById('s-range'); let v = 0;
      setTimeout(function step() { v += 7; r.value = Math.min(1000, v); r.dispatchEvent(new Event('input')); if (v < 1000) setTimeout(step, 55); else res(); }, 900);
    })).catch(() => {});
  });
  await p.close();
  }
  // 2 · Key Rain: the pile falls in, one key gets thrown, then "Drop a key".
  p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await capture(p, 'rain', 8000, async () => {
    await p.goto(SITE);
    setTimeout(async () => {
      const c = await p.locator('#rain').boundingBox();
      await p.mouse.move(c.x + c.width * 0.62, c.y + c.height - 30); await p.mouse.down();
      for (let i = 0; i < 14; i++) { await p.mouse.move(c.x + c.width * (0.62 - i * 0.02), c.y + c.height - 40 - i * 26); await p.waitForTimeout(16); }
      await p.mouse.up();
      await p.waitForTimeout(1600); await p.click('#rain-drop');
    }, 3200);
  });
  await b.close();
})();
