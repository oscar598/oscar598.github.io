// Bakes the words from js/data.js into the static HTML so search engines and AI crawlers
// (most of which don't run JavaScript) can read the whole story and resume.
// The live scripts still re-render everything on load, so nothing changes for visitors.
//
// Run after editing js/data.js:   node tools/prerender.mjs
// Writes: index.html and resume.html (between markers), llms.txt, sitemap.xml.

import { readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";

const ROOT = new URL("..", import.meta.url).pathname;
const URL_BASE = "https://oscarludesign.com/";
const read = (f) => readFileSync(ROOT + f, "utf8");
const write = (f, s) => writeFileSync(ROOT + f, s);

const ctx = { window: {} };
vm.runInNewContext(read("js/data.js"), ctx);
const site = ctx.window.SITE;
const p = site.person;
const r = site.resume;

const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ---------- Structured profile (schema.org JSON-LD) ----------
// Only confirmed facts go here: this is what search and AI answers quote.
const sameAs = p.links.filter((l) => l.url).map((l) => l.url);
const person = {
  "@type": "Person",
  "@id": URL_BASE + "#oscar",
  name: p.name,
  url: URL_BASE,
  image: URL_BASE + "assets/photos/portrait.jpg",
  email: "mailto:" + p.email,
  jobTitle: "Graphic designer and founder",
  description:
    "Self-taught sports graphic designer and founder from Los Angeles, studying at Princeton University (Class of 2030). At 13 he cold-emailed Harvard Men's Basketball and designed their recruiting graphics for four years, then founded Oscar Lu Design Co.",
  homeLocation: { "@type": "Place", name: "Los Angeles, California" },
  affiliation: { "@type": "CollegeOrUniversity", name: "Princeton University", url: "https://www.princeton.edu/" },
  alumniOf: [{ "@type": "HighSchool", name: "Church Farm School", address: "Exton, Pennsylvania" }],
  founder: { "@type": "Organization", name: "Oscar Lu Design Co." },
  knowsAbout: [
    "Graphic design", "Sports graphic design", "Recruiting graphics", "Brand identity", "Social media design",
    "Video production", "Entrepreneurship", "Sales", "Youth advocacy", "Tobacco control",
    "Adobe Photoshop", "Adobe Illustrator", "Adobe Premiere Pro", "Adobe After Effects", "Figma",
  ],
  award: ["Valedictorian, Church Farm School (2026)", "DECA Pennsylvania State Champion", "QuestBridge Finalist", "A Better Chance Scholar (2018)"],
  sameAs,
};
const jsonld = (page) =>
  `<script type="application/ld+json">${JSON.stringify(
    { "@context": "https://schema.org", "@type": "ProfilePage", url: URL_BASE + page, name: `${p.name}: the story so far`, mainEntity: person },
    null,
    0
  )}</script>`;

function between(html, tag, content) {
  const open = `<!-- prerender:${tag} -->`;
  const close = `<!-- /prerender:${tag} -->`;
  const i = html.indexOf(open);
  const j = html.indexOf(close);
  if (i < 0 || j < 0) throw new Error(`missing markers for ${tag}`);
  return html.slice(0, i + open.length) + content + html.slice(j);
}

// ---------- index.html ----------
let index = read("index.html");
index = between(index, "jsonld", jsonld(""));
index = index.replace(/(<p class="open-tagline" id="open-tagline">)[\s\S]*?(<\/p>)/, `$1${esc(p.tagline)}$2`);
index = index.replace(/(<div class="copy[^"]*" data-chapter="(\d+)">)[\s\S]*?(<\/div>)/g, (m, open, i, close) => {
  const ch = site.chapters[Number(i)];
  if (!ch) return m;
  const n = String(Number(i) + 1).padStart(2, "0");
  return (
    open +
    `<p class="label">SC. ${n} · ${esc(ch.years)}</p><p class="place">${esc(ch.place)}</p><h2>${esc(ch.title)}</h2>` +
    ch.body.map((l) => `<p class="line">${esc(l)}</p>`).join("") +
    `<ul class="proof">${ch.proof.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` +
    (ch.quote ? `<blockquote>“${esc(ch.quote)}”</blockquote>` : "") +
    close
  );
});
index = index.replace(/(<h2 class="next-title" id="next-title">)[\s\S]*?(<\/h2>)/, `$1${esc(site.next.title)}$2`);
index = index.replace(/(<p class="next-body" id="next-body">)[\s\S]*?(<\/p>)/, `$1${esc(site.next.body)}$2`);
write("index.html", index);

// ---------- resume.html ----------
// Run the real resume.js against a stub DOM and capture what it renders.
let rendered = "";
const stubEl = { setAttribute() {}, set innerHTML(v) { rendered = v; } };
vm.runInNewContext(read("js/resume.js"), {
  window: { SITE: site, addEventListener() {} },
  location: { hash: "" },
  document: { getElementById: () => stubEl, referrer: "" },
});
let resume = read("resume.html");
resume = between(resume, "jsonld", jsonld("resume.html"));
resume = resume.replace(/(<main id="resume" class="resume">)[\s\S]*?(<\/main>)/, `$1${rendered}$2`);
write("resume.html", resume);

// ---------- llms.txt (plain-language summary for AI assistants) ----------
const entryMd = (e) =>
  `- **${e.role ? `${e.role}, ${e.org}` : e.org}** (${e.place}, ${e.dates})` +
  (e.detail ? `: ${e.detail}` : "") +
  (e.bullets || []).map((b) => `\n  - ${b}`).join("");
const llms = `# ${p.name}

> ${person.description}

${p.name} is a ${r.headline.replace(" · ", ", ").toLowerCase().replace("princeton '30", "Princeton University student (Class of 2030)")}. Contact: ${p.email}. Website: ${URL_BASE}

## The story so far

${site.chapters.map((ch) => `### ${ch.title} (${ch.years}, ${ch.place})\n\n${ch.body.join(" ")}\n\nHighlights: ${ch.proof.join("; ")}.`).join("\n\n")}

### ${site.next.title}

${site.next.body}

## Experience

${r.experience.map(entryMd).join("\n")}

## Leadership

${r.leadership.map(entryMd).join("\n")}

## Education

${r.education.map(entryMd).join("\n")}

## Skills

${r.skills.map((s) => `- ${s}`).join("\n")}

## Links

- [Interactive story](${URL_BASE})
- [Resume](${URL_BASE}resume.html)
${p.links.filter((l) => l.url).map((l) => `- [${l.label}](${l.url})`).join("\n")}
`;
write("llms.txt", llms);

// ---------- sitemap.xml ----------
const today = new Date().toISOString().slice(0, 10);
write(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${URL_BASE}</loc><lastmod>${today}</lastmod><priority>1.0</priority></url>
  <url><loc>${URL_BASE}resume.html</loc><lastmod>${today}</lastmod><priority>0.8</priority></url>
  <url><loc>${URL_BASE}llms.txt</loc><lastmod>${today}</lastmod><priority>0.5</priority></url>
</urlset>
`
);

console.log("prerendered index.html, resume.html, llms.txt, sitemap.xml");
