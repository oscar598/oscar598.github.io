// Tiny synthesized sound kit (no audio files). On by default; the header toggle turns it off
// (remembered per visitor). Browsers only allow audio after the first click/tap/keypress,
// so nothing plays until then.
// Every sound is a few oscillators with a fast envelope, so it costs nothing to load.

let ctx = null;
let master = null;
let lastThump = 0;
let unlocked = false; // becomes true on the visitor's first gesture

function readPref() {
  try {
    return localStorage.getItem("ol-sound") !== "0";
  } catch {
    return true;
  }
}

// Unlock audio on the first real gesture (wheel scrolling doesn't count in browsers).
["pointerdown", "keydown", "touchstart"].forEach((type) =>
  window.addEventListener(
    type,
    () => {
      if (unlocked) return;
      unlocked = true;
      if (sound.enabled && ensure()) ctx.resume();
    },
    { once: true, passive: true, capture: true }
  )
);

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.35;
  master.connect(ctx.destination);
  return ctx;
}

function blip({ freq = 440, type = "sine", attack = 0.002, decay = 0.12, gain = 0.3, slideTo = null }) {
  if (!sound.enabled || !unlocked || !ensure()) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + decay);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + attack + decay + 0.02);
}

export const sound = {
  enabled: readPref(),

  toggle() {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem("ol-sound", this.enabled ? "1" : "0");
    } catch {}
    if (this.enabled) {
      unlocked = true;
      ensure();
      ctx?.resume();
      this.chime();
    }
    return this.enabled;
  },

  // Physics collision: low thud, louder for harder hits. Rate-limited so piles don't roar.
  thump(strength = 0.5) {
    const now = performance.now();
    if (now - lastThump < 45) return;
    lastThump = now;
    blip({ freq: 90 + Math.random() * 60, type: "sine", decay: 0.09, gain: 0.08 + strength * 0.25, slideTo: 50 });
  },

  tick() {
    blip({ freq: 1800 + Math.random() * 300, type: "square", decay: 0.015, gain: 0.03 });
  },

  key() {
    blip({ freq: 700 + Math.random() * 200, type: "triangle", decay: 0.03, gain: 0.05 });
  },

  whoosh() {
    blip({ freq: 300, type: "sawtooth", decay: 0.35, gain: 0.05, slideTo: 1400 });
  },

  chime() {
    blip({ freq: 880, type: "sine", decay: 0.5, gain: 0.12 });
    setTimeout(() => blip({ freq: 1320, type: "sine", decay: 0.6, gain: 0.1 }), 90);
  },

  // Clapperboard: a sharp noise-like crack (two detuned square blips)
  clap() {
    blip({ freq: 2400, type: "square", decay: 0.025, gain: 0.07 });
    blip({ freq: 180, type: "triangle", decay: 0.05, gain: 0.12, slideTo: 90 });
  },

  pop() {
    blip({ freq: 500 + Math.random() * 400, type: "sine", decay: 0.06, gain: 0.08, slideTo: 1200 });
  },
};
