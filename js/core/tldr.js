// "TL;DR" for recruiters in a hurry: one card with the whole story in seven lines,
// built from data.js so it never drifts from the chapters. Also adds "calm mode"
// (turns off the physics/motion extras) for anyone who prefers a still page.

import { esc } from "./util.js";
import { setCalm as setWorldsCalm } from "./world.js";

export function initTldr(site) {
  const lines = site.chapters.map((ch) => ({
    years: ch.years,
    title: ch.title.replace(/[“”"]/g, ""),
    proof: ch.proof.slice(0, 2).join(" · "),
  }));

  const modal = document.createElement("div");
  modal.className = "tldr";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", "The short version");
  modal.setAttribute("data-lenis-prevent", "");
  modal.innerHTML = `
    <div class="tldr-card">
      <button class="tldr-close" type="button" aria-label="Close">×</button>
      <p class="label">The 20-second version</p>
      <h2>${esc(site.person.name)}</h2>
      <p class="tldr-thesis">${esc(site.person.tagline)} ${esc(site.person.thesis)}</p>
      <ol>
        ${lines
          .map(
            (l) => `<li><span class="mono">${esc(l.years)}</span><b>${esc(l.title)}</b><em>${esc(l.proof)}</em></li>`
          )
          .join("")}
      </ol>
      <div class="tldr-cta">
        <a class="btn btn--primary" href="resume.html">Resume</a>
        <a class="btn" href="mailto:${esc(site.person.email)}">Email</a>
        <button class="btn" type="button" data-watch>Watch the full story</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  const open = () => {
    modal.classList.add("is-on");
    modal.querySelector(".tldr-close").focus();
  };
  const close = () => modal.classList.remove("is-on");
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target.closest(".tldr-close") || e.target.closest("[data-watch]")) close();
  });
  window.addEventListener("keydown", (e) => e.key === "Escape" && close());

  // Header button
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "chip";
  btn.textContent = "TL;DR";
  btn.dataset.magnetic = "";
  btn.addEventListener("click", open);
  document.querySelector(".chrome-right").prepend(btn);
  window.dispatchEvent(new CustomEvent("ol:magnetic", { detail: btn }));

  // Skip link (first focusable element on the page)
  const skip = document.createElement("a");
  skip.className = "skip-link";
  skip.href = "resume.html";
  skip.textContent = "Skip the show: go to the resume";
  document.body.prepend(skip);

  // Calm mode: freeze physics worlds + hide grain. Remembered for this visitor.
  const calmBtn = document.createElement("button");
  calmBtn.type = "button";
  calmBtn.className = "chip chip--ghost";
  calmBtn.dataset.magnetic = "";
  const setCalm = (on) => {
    document.body.classList.toggle("is-calm", on);
    calmBtn.textContent = on ? "motion: calm" : "motion: full";
    setWorldsCalm(on);
    try {
      localStorage.setItem("ol-calm", on ? "1" : "0");
    } catch {}
  };
  calmBtn.addEventListener("click", () => setCalm(!document.body.classList.contains("is-calm")));
  document.querySelector(".chrome-right").prepend(calmBtn);
  window.dispatchEvent(new CustomEvent("ol:magnetic", { detail: calmBtn }));
  let saved = null;
  try {
    saved = localStorage.getItem("ol-calm");
  } catch {}
  if (saved === "1") setCalm(true);
  else calmBtn.textContent = "motion: full";

  return { open, close };
}
