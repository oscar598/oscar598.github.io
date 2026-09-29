// Renders HTML templates to PNG with headless Chromium (Playwright).
//   node own-a-car/tools/render.js <file.html>[#card-id] <out.png> <width> <height> [scale]
// With #card-id, only the element with that id is captured, so one HTML file can hold many cards.
const path = require("path");
const { chromium } = require("playwright");

(async () => {
  const [src, out, w, h, scale = "1"] = process.argv.slice(2);
  if (!src || !out) throw new Error("usage: render.js <file.html>[#id] <out.png> <width> <height> [scale]");
  const [file, id] = src.split("#");
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" }).catch(() => chromium.launch());
  const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +scale });
  await page.goto("file://" + path.resolve(file) + (id ? "#" + id : ""));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  // TRANSPARENT=1 keeps the page background out of the PNG (for video overlays).
  const omitBackground = process.env.TRANSPARENT === "1";
  if (id) await page.locator("#" + id).screenshot({ path: out, omitBackground });
  else await page.screenshot({ path: out, omitBackground });
  await browser.close();
  console.log(out);
})();
