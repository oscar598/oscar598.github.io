// The resume as a physical object: clicking "Resume" in the header drops a sheet of paper
// that swings from a pin (spring-damped pendulum), readable in place, with buttons to open
// the full page or print it. Built from the same data.js as /resume.html.

import { esc, reduceMotion, isTouch } from "./util.js";
import { sound } from "./sound.js";
import { lenis } from "./smooth.js";

export function initResumeDrop(site) {
  const r = site.resume;
  const p = site.person;
  const link = document.querySelector('.chrome a[href$="resume.html"]');
  if (!link || isTouch) return; // phones: the plain link is better

  const entry = (it) => `
    <div class="rd-entry">
      <div class="rd-head"><b>${esc(it.role ? `${it.role}, ${it.org}` : it.org)}</b><span>${esc(it.dates)}</span></div>
      ${it.detail ? `<p>${esc(it.detail)}</p>` : ""}
      ${(it.bullets || []).length ? `<ul>${it.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
    </div>`;

  const overlay = document.createElement("div");
  overlay.className = "rd";
  overlay.setAttribute("data-lenis-prevent", ""); // let the sheet scroll natively
  overlay.innerHTML = `
    <div class="rd-pin" aria-hidden="true"></div>
    <article class="rd-sheet" role="dialog" aria-modal="true" aria-label="Resume">
      <header>
        <h2>${esc(p.name)}</h2>
        <p>${esc(r.headline)} · ${esc(p.email)}</p>
      </header>
      <section><h3>Education</h3>${r.education.map(entry).join("")}</section>
      <section><h3>Experience</h3>${r.experience.map(entry).join("")}</section>
      <section><h3>Leadership &amp; Initiative</h3>${r.leadership.map(entry).join("")}</section>
      <section><h3>Skills</h3><p>${r.skills.map(esc).join("; ")}</p></section>
      <footer>
        <a class="btn btn--primary" href="../resume.html">Open full page</a>
        <a class="btn" href="../resume.html" data-print>Download PDF</a>
        <button class="btn" type="button" data-close>Put it back</button>
      </footer>
    </article>`;
  document.body.appendChild(overlay);
  const sheet = overlay.querySelector(".rd-sheet");

  // Spring pendulum: angle θ'' = -k·θ - c·θ'
  let angle = 0;
  let vel = 0;
  let raf = 0;
  function swing() {
    const k = 0.012;
    const c = 0.04;
    vel += -k * angle - c * vel;
    angle += vel;
    // gsap.set composes rotation with the drop's y-translation (both live on the sheet).
    window.gsap.set(sheet, { rotate: angle });
    if (Math.abs(angle) > 0.02 || Math.abs(vel) > 0.02) raf = requestAnimationFrame(swing);
    else window.gsap.set(sheet, { rotate: 0 });
  }

  function open(e) {
    e?.preventDefault();
    overlay.classList.add("is-on");
    lenis?.stop(); // the page behind shouldn't scroll while you read
    sound.whoosh();
    if (reduceMotion) return;
    window.gsap.fromTo(sheet, { y: -window.innerHeight }, { y: 0, duration: 0.7, ease: "bounce.out", onComplete: () => sound.thump(0.8) });
    angle = (Math.random() < 0.5 ? -1 : 1) * 9;
    vel = 0;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(swing);
  }
  function close() {
    lenis?.start();
    if (reduceMotion) {
      overlay.classList.remove("is-on");
      return;
    }
    window.gsap.to(sheet, { y: -window.innerHeight, rotate: 8, duration: 0.45, ease: "power3.in", onComplete: () => {
      overlay.classList.remove("is-on");
      window.gsap.set(sheet, { y: 0, rotate: 0 });
    } });
  }

  link.addEventListener("click", open);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay || e.target.closest("[data-close]")) close();
  });
  overlay.querySelector("[data-print]").addEventListener("click", (e) => {
    e.preventDefault();
    // Open the print-ready page and trigger the print dialog there.
    const w = window.open("../resume.html#print", "_blank");
    if (!w) location.href = "../resume.html";
  });
  window.addEventListener("keydown", (e) => e.key === "Escape" && overlay.classList.contains("is-on") && close());

  // Nudge the sheet by moving the mouse over it quickly (it's paper, after all).
  let lastX = 0;
  sheet.addEventListener("pointermove", (e) => {
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    if (Math.abs(dx) > 12 && !reduceMotion) {
      vel += dx * 0.01;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(swing);
    }
  });
}
