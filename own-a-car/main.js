(async () => {
  const { cfg, reg } = await OAC.load();
  const $ = (id) => document.getElementById(id);
  const { fmt } = OAC;
  const sold = reg.keys || 0;
  const state = OAC.windowState(cfg);

  OAC.wireBuy(cfg);

  // Key Rain: one drawn key per key sold (up to what the stage holds).
  const rain = new OACKeyRain.KeyRain($("rain"), { sold, shown: 140 });
  const ratio = Math.round(rain.ratio);
  $("rain-note").textContent = sold === 0 ? "Key Nº 0001 is still available. Grab it, throw it."
    : ratio > 1 ? `Each key drawn stands for ${ratio} sold. Grab one, throw it.` : "One key drawn per key sold. Grab one, throw it.";
  $("rain-drop").addEventListener("click", () => {
    const n = rain.drop();
    if (n) $("rain-note").textContent = `That one's Nº ${fmt(n)}. It's ${OAC.grams(OAC.shareGrams(cfg, n))} of the car.`;
  });

  // Ticker.
  $("t-keys").textContent = fmt(sold);
  $("t-grams").textContent = OAC.grams(OAC.shareGrams(cfg, Math.max(1, sold)));
  $("t-goal").textContent = fmt(cfg.goalKeys);
  $("t-days-label").textContent = state === "soon" ? "Days to launch" : "Days left";
  $("t-days").textContent = state === "closed" ? "Closed" : OAC.daysLeft(cfg);
  $("f-ship").textContent = `Estimated ${cfg.shipWindow}, after the presale closes and the car is bought. Your key page shows every step.`;

  // Same mapping as The Shatter: owners = 10^(v/200), snapping to round numbers near 1, 10 … 100,000.
  const range = $("s-range");
  const toKeys = (v) => OACShatter.owners(v);
  const toValue = (n) => Math.round(Math.log10(n) * 200);
  const small = matchMedia("(max-width: 720px)").matches;
  const shatter = new OACShatter.Shatter($("s-canvas"), { owners: sold + 1, maxShards: small ? 500 : 1200 });
  function renderShare(n) {
    const g = OAC.shareGrams(cfg, n);
    $("s-grams").textContent = OAC.grams(g);
    $("s-owners").textContent = fmt(n);
    $("s-line").textContent = n === sold + 1
      ? `Buy now and you'd hold key Nº ${fmt(n)}. Your share: about ${OAC.thing(g)}.`
      : `At ${fmt(n)} keys, each one owns about ${OAC.thing(g)}.`;
    $("n-owners").textContent = fmt(n);
    $("n-mm").textContent = OAC.nameHeightMm(cfg, n).toFixed(0) + " mm";
    names.setOwners(n);
  }
  // One name slot per key, in key order; anonymous keys show their number.
  const slots = [];
  reg.orders.filter((o) => !o.refunded).forEach((o) => { for (let k = o.from; k <= o.to; k++) slots.push({ n: k, name: o.name }); });
  const names = new OACNames.NameWrap($("n-canvas"), {
    names: slots, youAt: sold + 1, owners: sold + 1, mmFor: (n) => OAC.nameHeightMm(cfg, n),
  });
  range.value = toValue(sold + 1);
  range.addEventListener("input", () => {
    shatter.setValue(+range.value);
    renderShare(toKeys(+range.value));
  });
  renderShare(sold + 1);

  // Goal + stretch goals on one bar that runs to the last stretch goal.
  const top = cfg.stretchGoals[cfg.stretchGoals.length - 1].keys;
  $("g-title").textContent = `${fmt(cfg.goalKeys)} keys buys the car.`;
  $("g-fill").style.width = Math.min(100, (sold / top) * 100) + "%";
  cfg.stretchGoals.forEach((s) => {
    const tick = document.createElement("span");
    tick.className = "tick" + (sold >= s.keys ? " hit" : "");
    tick.style.left = (s.keys / top) * 100 + "%";
    $("g-bar").append(tick);
    const li = document.createElement("li");
    li.className = sold >= s.keys ? "hit" : "";
    li.innerHTML = `<b class="mono">${fmt(s.keys)}</b><span>${s.car}</span><small>${s.note}</small>`;
    $("g-stretch").append(li);
  });

  // Open books.
  const parts = Object.entries(cfg.perKeyBreakdownUsd);
  parts.forEach(([label, usd], i) => {
    const seg = document.createElement("div");
    seg.className = "seg seg" + i;
    seg.style.flexGrow = usd;
    seg.title = `${label}: $${usd.toFixed(2)}`;
    $("b-stack").append(seg);
    const li = document.createElement("li");
    li.innerHTML = `<i class="seg${i}"></i>${label} <b>$${usd.toFixed(2)}</b>`;
    $("b-legend").append(li);
  });

  // Owners' wall: newest first, one entry per key.
  $("w-count").textContent = fmt(sold);
  $("w-people").textContent = fmt(reg.owners || 0);
  const live = reg.orders.filter((o) => !o.refunded);
  if (live.length) {
    const names = $("w-names");
    names.innerHTML = "";
    const SHOW = 160;
    let shown = 0;
    for (const o of [...live].reverse()) {
      for (let k = o.to; k >= o.from && shown < SHOW; k--, shown++) {
        const li = document.createElement("li");
        li.innerHTML = `<a href="key.html?n=${k}"><span class="mono">${OAC.pad(k)}</span> ${o.name ? escapeHtml(o.name) : "Owner"}</a>`;
        names.append(li);
      }
    }
    if (sold > SHOW) names.insertAdjacentHTML("beforeend", `<li class="dim">and ${fmt(sold - SHOW)} more</li>`);
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }
})();
