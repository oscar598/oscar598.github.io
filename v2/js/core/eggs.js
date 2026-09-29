// Easter eggs.
//   ↑ ↑ ↓ ↓ ← → ← → B A   flips gravity in every physics scene
//   type "harvard"         crimson confetti
//   type "oscar"           re-drops the letters in the cold open
//   press "g"              toggles zero-gravity (everything floats)

import { toast } from "./util.js";
import { setGravityFlip, allWorlds } from "./world.js";
import { sound } from "./sound.js";

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

export function initEggs(scenes) {
  let keys = [];
  let typed = "";
  let flipped = false;
  let floating = false;
  let lastLetterAt = 0;

  window.addEventListener("keydown", (e) => {
    if (e.target.closest("input, textarea, [contenteditable]")) return;
    if (document.querySelector(".level")) return;
    keys = [...keys, e.key].slice(-KONAMI.length);
    typed = (typed + (e.key.length === 1 ? e.key.toLowerCase() : "")).slice(-12);

    if (keys.join(",") === KONAMI.join(",")) {
      flipped = !flipped;
      setGravityFlip(flipped ? -1 : 1);
      sound.whoosh();
      toast(flipped ? "gravity: upside down ↑" : "gravity: back to normal ↓");
      keys = [];
    }
    if (typed.endsWith("harvard")) {
      scenes.next?.confetti?.({ colors: ["#a51c30", "#f2ede3", "#0e0d0b"], count: 160, fromTop: true });
      toast("go crimson");
      typed = "";
    }
    if (typed.endsWith("oscar")) {
      scenes.open?.respawn?.();
      toast("again!");
      typed = "";
    }
    const now = performance.now();
    const typingWord = now - lastLetterAt < 400; // "g" inside a typed word doesn't count
    if (/^[a-z]$/i.test(e.key)) lastLetterAt = now;
    if (e.key === "g" && !e.metaKey && !e.ctrlKey && !typingWord) {
      floating = !floating;
      allWorlds().forEach((w) => {
        w.world.gravity.scale = floating ? 0 : 0.001;
        if (floating) {
          w.bodies().forEach((b) => window.Matter.Body.setVelocity(b, { x: (Math.random() - 0.5) * 4, y: -Math.random() * 4 }));
        }
      });
      toast(floating ? "zero-g (press g again)" : "gravity restored");
    }
  });

  // Console greeting for curious recruiters.
  console.log(
    `%cHey 👋  You opened the console. I like you already.\n%cTry: ↑↑↓↓←→←→BA · type "harvard" · press g\n${window.SITE?.person?.email || ""}`,
    "font: 700 14px Fraunces, serif; color: #ff4b2b",
    "font: 12px monospace; color: #9a9387"
  );
}
