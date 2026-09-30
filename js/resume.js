// Builds the resume page from window.SITE.resume (js/data.js).

const site = window.SITE;
const r = site.resume;
const p = site.person;

function esc(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function entry(item) {
  const bullets = (item.bullets || []).map((b) => `<li>${esc(b)}</li>`).join("");
  const title = item.role ? `<strong>${esc(item.role)}</strong>, ${esc(item.org)}` : `<strong>${esc(item.org)}</strong>`;
  return `
    <div class="entry">
      <div class="entry-head">
        <span>${title}<span class="entry-place"> · ${esc(item.place)}</span></span>
        <span class="entry-dates">${esc(item.dates)}</span>
      </div>
      ${item.detail ? `<p class="entry-detail">${esc(item.detail)}</p>` : ""}
      ${bullets ? `<ul>${bullets}</ul>` : ""}
    </div>`;
}

function section(title, items) {
  return `<section><h2>${esc(title)}</h2>${items.map(entry).join("")}</section>`;
}

const links = p.links
  .filter((link) => link.url)
  .map((link) => ` · <a href="${esc(link.url)}">${esc(link.label)}</a>`)
  .join("");

// Opened from v2's "Download PDF" button: go straight to the print dialog.
if (location.hash === "#print") {
  window.addEventListener("load", () => setTimeout(() => window.print(), 400));
}

document.getElementById("resume").innerHTML = `
  <header>
    <h1>${esc(p.name)}</h1>
    <p>${esc(r.headline)} · <a href="mailto:${esc(p.email)}">${esc(p.email)}</a>${links}</p>
  </header>
  ${section("Education", r.education)}
  ${section("Experience", r.experience)}
  ${section("Leadership & Initiative", r.leadership)}
  <section>
    <h2>Skills & Interests</h2>
    <p><strong>Skills:</strong> ${r.skills.map(esc).join("; ")}</p>
    <p><strong>Interests:</strong> ${esc(r.interests)}</p>
  </section>`;
