// v2 entry point. Wires global chrome (smooth scroll, cursor, rope, film strip, sound, easter eggs)
// and boots each scene. Scenes are loaded independently, so one failing never blanks the page.

import { initSmooth, cutTo, lenis } from "./core/smooth.js";
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
import { initFilm } from "./core/film.js";
import { initResumeDrop } from "./core/resume-drop.js";

const { ScrollTrigger } = window;
const site = window.SITE;

// Pinned scenes change the page height as they're built; a browser-restored scroll position
// would land in the wrong scene. Always start at the top (or at a #deep-link).
if ("scrollRestoration" in history) history.scrollRestoration = "manual";

async function boot() {
  initSmooth();
  initCursor();
  renderCopy(site);
  initMedia();

  const rope = initRope();

  // Sound toggle
  const soundBtn = document.getElementById("sound-toggle");
  // Reflect the default/remembered state (sound is on unless the visitor turned it off).
  soundBtn.textContent = sound.enabled ? "sound: on" : "sound: off";
  soundBtn.setAttribute("aria-pressed", String(sound.enabled));
  soundBtn.addEventListener("click", () => {
    const on = sound.toggle();
    soundBtn.textContent = on ? "sound: on" : "sound: off";
    soundBtn.setAttribute("aria-pressed", String(on));
  });

  // Scenes (each in its own module; errors are contained)
  const scenes = {};
  const load = async (name, modulePromise, fn) => {
    try {
      const mod = await modulePromise;
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
    ["yosemite", "./scenes/yosemite.js", "initYosemite"],
    ["next", "./scenes/next.js", "initNext"],
  ];
  // Fetch every scene module in parallel, then set them up in page order.
  const modules = order.map(([, path]) => import(path));
  modules.forEach((m) => m.catch(() => {})); // failures are reported by load()
  for (let i = 0; i < order.length; i++) await load(order[i][0], modules[i], order[i][2]);
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
      lenis?.resize();
      if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
      else window.scrollTo(0, y);
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
  initFilm();
  initResumeDrop(site);

  // In-page links (#open etc.) use the film cut instead of a long scroll.
  document.querySelectorAll('a[href^="#"]').forEach((a) =>
    a.addEventListener("click", (e) => {
      const target = document.querySelector(a.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      cutTo(target);
    })
  );
  ScrollTrigger.refresh();
  // Web fonts change text height; recompute every trigger once they've loaded.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  await runLeader();
  scenes.open?.begin();

  // Deep links like /#farm (scenes are built by JS, so jump after layout settles).
  if (location.hash) {
    const el = document.querySelector(location.hash);
    if (el) setTimeout(() => cutTo(el), 60);
  }
}

boot();
