// Builds the story page from window.SITE (js/data.js), then adds the scroll behavior:
//   1. Scenes fade in as they enter the screen.
//   2. The year on the left rail counts up to each chapter's year.
//   3. The rail line fills as you scroll.

const site = window.SITE;
const story = document.getElementById("story");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Escape text before putting it into HTML, so a stray "<" in data.js can't break the page.
function esc(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sceneLabel(n) {
  return "SC. " + String(n).padStart(2, "0");
}

// ---------- Render ----------

function coldOpen() {
  const p = site.person;
  return `
    <section class="scene scene--open" data-year="${site.chapters[0].yearMark}">
      <div class="scene-inner">
        <p class="label reveal">${sceneLabel(0)} · Cold open</p>
        <h1 class="open-name reveal">${esc(p.name)}</h1>
        <p class="open-tagline reveal">${esc(p.tagline)}</p>
        <p class="open-sub reveal">${esc(p.subtitle)} <span class="scroll-cue" aria-hidden="true">↓</span></p>
      </div>
    </section>`;
}

// The image frame. Until you add a photo (image.src in data.js), it shows a storyboard placeholder
// that describes the shot to use.
function frame(chapter, n) {
  const img = chapter.image || {};
  const inside = img.src
    ? `<img src="${esc(img.src)}" alt="${esc(img.alt)}" loading="lazy">`
    : `<div class="frame-empty"><span>${esc(img.idea || "Photo goes here")}</span></div>`;
  return `
    <figure class="frame reveal">
      ${inside}
      <figcaption>${sceneLabel(n)} · ${esc(chapter.place)}</figcaption>
    </figure>`;
}

function chapterScene(chapter, i) {
  const n = i + 1;
  const body = chapter.body.map((line) => `<p>${esc(line)}</p>`).join("");
  const proof = chapter.proof.map((item) => `<li>${esc(item)}</li>`).join("");
  const quote = chapter.quote ? `<blockquote class="reveal">“${esc(chapter.quote)}”</blockquote>` : "";
  return `
    <section class="scene" id="${esc(chapter.id)}" data-year="${chapter.yearMark}">
      <div class="scene-inner scene-grid">
        <div class="scene-text">
          <p class="label reveal">${sceneLabel(n)} · ${esc(chapter.years)}</p>
          <h2 class="reveal">${esc(chapter.title)}</h2>
          <div class="scene-body reveal">${body}</div>
          <ul class="proof reveal">${proof}</ul>
          ${quote}
        </div>
        ${frame(chapter, n)}
      </div>
    </section>`;
}

function nextScene() {
  const p = site.person;
  const n = site.chapters.length + 1;
  const links = p.links
    .filter((link) => link.url)
    .map((link) => `<a href="${esc(link.url)}" target="_blank" rel="noopener">${esc(link.label)}</a>`)
    .join("");
  return `
    <section class="scene scene--next" data-year="next">
      <div class="scene-inner">
        <p class="label reveal">${sceneLabel(n)} · 20??</p>
        <h2 class="reveal">${esc(site.next.title)}</h2>
        <p class="next-body reveal">${esc(site.next.body)}</p>
        <div class="cta reveal">
          <a class="btn btn--primary" href="mailto:${esc(p.email)}">Email me</a>
          <a class="btn" href="../resume.html">Resume</a>
          ${links}
        </div>
        <p class="blank-page reveal" aria-hidden="true"><span class="cursor"></span></p>
      </div>
    </section>`;
}

story.innerHTML = coldOpen() + site.chapters.map(chapterScene).join("") + nextScene();

// Chapters are built by JS, so links like index.html#farm need a manual jump once they exist.
if (location.hash) {
  const target = document.getElementById(location.hash.slice(1));
  if (target) target.scrollIntoView();
}

// ---------- 1. Fade scenes in ----------

const revealer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll(".reveal").forEach((node) => revealer.observe(node));

// ---------- 2. Year counter ----------

const yearEl = document.getElementById("rail-year");
let shownYear = site.chapters[0].yearMark;
let countFrame = null;

function showYear(target) {
  cancelAnimationFrame(countFrame);
  if (target === "next") {
    yearEl.textContent = "20??";
    return;
  }
  const to = Number(target);
  const from = Number(shownYear) || to;
  shownYear = to;
  if (reduceMotion || from === to) {
    yearEl.textContent = to;
    return;
  }
  const start = performance.now();
  const duration = 600;
  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    yearEl.textContent = Math.round(from + (to - from) * t);
    if (t < 1) countFrame = requestAnimationFrame(tick);
  }
  countFrame = requestAnimationFrame(tick);
}

const yearWatcher = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) showYear(entry.target.dataset.year);
    });
  },
  { rootMargin: "-45% 0px -45% 0px" } // fires when a scene crosses the middle of the screen
);
document.querySelectorAll(".scene").forEach((scene) => yearWatcher.observe(scene));

// ---------- 3. Rail fill ----------

const fill = document.querySelector(".rail-fill");
function updateFill() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const progress = max > 0 ? window.scrollY / max : 0;
  fill.style.transform = `scaleY(${progress})`;
}
window.addEventListener("scroll", updateFill, { passive: true });
window.addEventListener("resize", updateFill);
updateFill();
