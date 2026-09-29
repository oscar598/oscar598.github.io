// v2 entry point. Wires global chrome (smooth scroll, cursor, rope, film strip, sound, easter eggs)
// and boots each scene. Scenes are loaded independently, so one failing never blanks the page.

import { initSmooth } from "./core/smooth.js";
import { initCursor } from "./core/cursor.js";
import { initRope } from "./core/rope.js";
import { runLeader } from "./core/leader.js";
import { sound } from "./core/sound.js";
import { renderCopy } from "./scenes/copy.js";
import { initFilmstrip } from "./core/filmstrip.js";
import { initMedia } from "./core/media.js";
import { initEggs } from "./core/eggs.js";
import { initTilt } from "./core/tilt.js";
import { initCommentary } from "./core/commentary.js";
import { initKeys } from "./core/keys.js";
import { initTldr } from "./core/tldr.js";
import { initTab } from "./core/tab.js";

const { ScrollTrigger } = window;
const site = window.SITE;

async function boot() {
  initSmooth();
  initCursor();
  renderCopy(site);
  initMedia();

  const rope = initRope();

  // Sound toggle
  const soundBtn = document.getElementById("sound-toggle");
  soundBtn.addEventListener("click", () => {
    const on = sound.toggle();
    soundBtn.textContent = on ? "sound: on" : "sound: off";
    soundBtn.setAttribute("aria-pressed", String(on));
  });

  // Scenes (each in its own module; errors are contained)
  const scenes = {};
  const load = async (name, path, fn) => {
    try {
      const mod = await import(path);
      scenes[name] = await mod[fn](site);
    } catch (err) {
      console.error(`[v2] scene "${name}" failed:`, err);
    }
  };

  // Load in page order: pinned scenes add scroll distance, so later triggers must be created after earlier pins.
  const order = [
    ["open", "./scenes/open.js", "initOpen"],
    ["origin", "./scenes/origin.js", "initOrigin"],
    ["spark", "./scenes/spark.js", "initSpark"],
    ["email", "./scenes/email.js", "initEmail"],
    ["ukraine", "./scenes/ukraine.js", "initUkraine"],
    ["farm", "./scenes/farm.js", "initFarm"],
    ["tested", "./scenes/tested.js", "initTested"],
    ["now", "./scenes/now.js", "initNow"],
    ["next", "./scenes/next.js", "initNext"],
  ];
  for (const [name, path, fn] of order) await load(name, path, fn);
  try {
    const { initCredits } = await import("./scenes/credits.js");
    scenes.credits = initCredits(site, scenes);
  } catch (err) {
    console.error('[v2] scene "credits" failed:', err);
  }
  window.__ol = scenes; // handy for debugging in the console

  // ?debug: helpers for testing when animation frames are paused (e.g. a hidden tab).
  //   await __go("origin", 0.5)  → jump to 50% through a scene (pinned or not)
  //   __stepAll(300)             → advance every physics world 300 steps
  if (location.search.includes("debug")) {
    window.__go = async (id, p = 0.5) => {
      const st = ScrollTrigger.getAll().find((t) => t.pin && (t.trigger.id === id || t.trigger.closest(`#${id}`)));
      let y;
      if (st) y = st.start + (st.end - st.start) * p;
      else {
        const el = document.getElementById(id);
        y = el.getBoundingClientRect().top + scrollY + Math.max(0, el.offsetHeight - innerHeight) * p;
      }
      window.scrollTo(0, y);
      ScrollTrigger.update();
      await new Promise((r) => setTimeout(r, 200));
      ScrollTrigger.update();
      return Math.round(y);
    };
    window.__stepAll = (n = 200) => Object.values(scenes).forEach((s) => s?.world?.step?.(n));
  }

  // Rope year follows whichever scene crosses the middle of the screen.
  document.querySelectorAll(".scene").forEach((scene) => {
    ScrollTrigger.create({
      trigger: scene,
      start: "top 55%",
      end: "bottom 45%",
      onEnter: () => rope.setYear(scene.dataset.year),
      onEnterBack: () => rope.setYear(scene.dataset.year),
    });
  });

  initFilmstrip();
  initEggs(scenes);
  initTilt();
  const commentary = initCommentary();
  const tldr = initTldr(site);
  initKeys({ commentary, tldr });
  initTab();
  ScrollTrigger.refresh();

  await runLeader();
  scenes.open?.begin();

  // Deep links like v2/#farm (scenes are built by JS, so jump after layout settles).
  if (location.hash) {
    const el = document.querySelector(location.hash);
    if (el) setTimeout(() => el.scrollIntoView(), 50);
  }
}

boot();
