// Keyboard shortcuts.
//   J / K   next / previous scene
//   C       director's commentary
//   ?       show this list

import { cutTo as scrollTo } from "./smooth.js";
import { toast } from "./util.js";

export function initKeys({ commentary, tldr }) {
  const scenes = () => [...document.querySelectorAll(".scene")];

  function currentIndex() {
    const mid = innerHeight / 2;
    let best = 0;
    scenes().forEach((s, i) => {
      const r = s.getBoundingClientRect();
      if (r.top <= mid) best = i;
    });
    return best;
  }

  const overlay = document.createElement("div");
  overlay.className = "keys-overlay";
  overlay.innerHTML = `
    <div class="keys-card">
      <p class="label">Shortcuts</p>
      <dl>
        <dt>J / K</dt><dd>next / previous chapter</dd>
        <dt>C</dt><dd>director's commentary</dd>
        <dt>T</dt><dd>the 20-second version</dd>
        <dt>P</dt><dd>play the level</dd>
        <dt>G</dt><dd>zero gravity</dd>
        <dt>↑↑↓↓←→←→BA</dt><dd>you know what this does</dd>
        <dt>type "harvard"</dt><dd>go crimson</dd>
        <dt>double-click</dt><dd>reset a physics scene</dd>
      </dl>
      <p class="mono keys-close">esc to close</p>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener("click", () => overlay.classList.remove("is-on"));

  // Letter shortcuts wait a beat: if another letter follows, you're typing a word
  // (like the "harvard" easter egg), so the shortcut is cancelled.
  let pending = null;
  const ACTIONS = {
    j: () => scrollTo(scenes()[Math.min(currentIndex() + 1, scenes().length - 1)]),
    k: () => scrollTo(scenes()[Math.max(currentIndex() - 1, 0)]),
    c: () => commentary?.toggle(),
    t: () => tldr?.open(),
    p: () => import("../scenes/credits.js").then((m) => m.openGame(window.SITE)),
  };

  window.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest("input, textarea, [contenteditable]")) return;
    if (document.querySelector(".level")) return; // the game owns the keyboard while open
    const k = e.key.toLowerCase();
    if (/^[a-z]$/.test(k)) {
      clearTimeout(pending);
      if (ACTIONS[k]) pending = setTimeout(ACTIONS[k], 280);
      return;
    }
    if (k === "?" || (k === "/" && e.shiftKey)) overlay.classList.toggle("is-on");
    else if (k === "escape") overlay.classList.remove("is-on");
  });

  // First-time hint (keyboards only)
  if (!window.matchMedia("(pointer: coarse)").matches) setTimeout(() => toast("press ? for shortcuts", 2600), 6000);
}
