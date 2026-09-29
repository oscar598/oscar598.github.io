// Shared by every OWN A CAR page: loads config + registry + status and does the math.
window.OAC = (() => {
  const get = (path) => fetch(path, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null);

  async function load(base = "") {
    const [cfg, reg, st] = await Promise.all([get(base + "config.json"), get(base + "data/registry.json"), get(base + "data/status.json")]);
    return { cfg, reg: reg || { keys: 0, orders: [] }, st: st || { phase: "soon", orders: {} } };
  }

  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const pad = (n) => String(n).padStart(4, "0");

  function windowState(cfg, now = Date.now()) {
    if (now < Date.parse(cfg.presaleOpens)) return "soon";
    if (now <= Date.parse(cfg.presaleCloses)) return "open";
    return "closed";
  }

  // With `owners` people holding keys, one key's share of the car.
  const shareGrams = (cfg, owners) => (cfg.car.weightKg * 1000) / Math.max(1, owners);

  const THINGS = [
    [60000, "a whole person"], [20000, "a wheel and tire"], [7000, "a bowling ball"], [2500, "a brick"],
    [1000, "a liter of water"], [400, "a football"], [330, "a can of soda"], [170, "a phone"],
    [57, "a tennis ball"], [30, "a lug nut"], [10, "a car key"], [4, "a nickel"], [1, "a paperclip"],
    [0.3, "a grain of rice"], [0, "a speck of paint"],
  ];
  const thing = (g) => THINGS.find(([min]) => g >= min)[1];

  function grams(g) {
    if (g >= 1000) return (g / 1000).toFixed(g >= 10000 ? 0 : 1) + " kg";
    if (g >= 10) return fmt(g) + " g";
    if (g >= 1) return g.toFixed(1) + " g";
    return (g * 1000).toFixed(0) + " mg";
  }

  // Names wrap the car. Each name gets wrapArea / owners; a name is ~12 characters at 0.6 em wide
  // with 1.3 line spacing, so area ≈ 9.36 h².
  const nameHeightMm = (cfg, owners) => Math.sqrt(cfg.car.wrapAreaM2 / Math.max(1, owners) / 9.36) * 1000;

  function daysLeft(cfg) {
    const s = windowState(cfg);
    const target = s === "soon" ? cfg.presaleOpens : cfg.presaleCloses;
    return Math.max(0, Math.ceil((Date.parse(target) - Date.now()) / 864e5));
  }

  function openDate(cfg) {
    return new Date(cfg.presaleOpens).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  // Wires every [data-buy="us|intl"] link to its Payment Link, or leaves it disabled with the right label.
  function wireBuy(cfg) {
    const s = windowState(cfg);
    document.querySelectorAll("[data-buy]").forEach((a) => {
      const url = cfg.stripe[a.dataset.buy]?.url;
      if (s === "open" && url) {
        a.href = url;
        a.removeAttribute("aria-disabled");
        return;
      }
      a.setAttribute("aria-disabled", "true");
      a.addEventListener("click", (e) => e.preventDefault());
      if (a.dataset.buy === "us") a.textContent = s === "closed" ? "Presale closed" : `Presale opens ${openDate(cfg)}`;
      else a.hidden = true;
    });
  }

  async function sha(text) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 20);
  }

  const xIntent = (text, url) =>
    `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

  return { load, fmt, pad, windowState, shareGrams, thing, grams, nameHeightMm, daysLeft, openDate, wireBuy, sha, xIntent };
})();
