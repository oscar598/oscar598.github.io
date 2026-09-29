// Director's commentary: press "c" (or the header button) to overlay sticky notes that explain
// the design decision behind each scene. It's a portfolio of thinking, not just output.

import { esc } from "./util.js";

const NOTES = {
  open: "Your name is a toy. People remember what they touched: every letter is a physics body, and each one hides a chapter (hover them).",
  origin: "The hustle, told with objects instead of adjectives. Scrolling pours them in, in story order: juice at 8, eBay at 10, the bike ride.",
  spark: "2,000 particles = 2,000 community members. They assemble into the tools and the handle that started it. Move your cursor through them.",
  "cold-email": "The key moment is a message. Scroll types it, you press Send, and the reply lands. The visitor re-enacts the cold email.",
  ukraine: "The one scene with no toys. Black screen, one question, then the work counted out: 400 cells = 400 bedding sets in a day.",
  farm: "Achievements as physical yearbook cards you can knock over, because a list of honors is forgettable and a pile you threw isn't.",
  tested: "Scroll is the climb: 3 a.m. to sunrise, 10,152 ft to 14,000. The sky, ridges, sun and altimeter are all tied to one number.",
  now: "The slip 'n slide actually runs: 200+ freshmen slide down and get counted. It shows the same move again, at college scale.",
  next: "It ends on a blank page. The recruiter is the next chapter, so the call to action is the story's last beat, not a footer.",
};

export function initCommentary() {
  let on = false;
  const notes = [];

  Object.entries(NOTES).forEach(([id, text]) => {
    const scene = document.getElementById(id);
    if (!scene) return;
    const note = document.createElement("aside");
    note.className = "director-note";
    note.innerHTML = `<span class="mono">director's note</span><p>${esc(text)}</p>`;
    scene.appendChild(note);
    notes.push(note);
  });

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "chip";
  btn.id = "commentary-toggle";
  btn.setAttribute("aria-pressed", "false");
  btn.dataset.magnetic = "";
  btn.textContent = "commentary: off";
  document.querySelector(".chrome-right").prepend(btn);
  window.dispatchEvent(new CustomEvent("ol:magnetic", { detail: btn }));

  function toggle() {
    on = !on;
    document.body.classList.toggle("show-notes", on);
    btn.textContent = on ? "commentary: on" : "commentary: off";
    btn.setAttribute("aria-pressed", String(on));
  }
  btn.addEventListener("click", toggle);
  return { toggle };
}
