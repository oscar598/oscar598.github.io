(async () => {
  const { cfg, reg } = await OAC.load();
  const $ = (id) => document.getElementById(id);
  const { fmt } = OAC;
  const sold = reg.keys || 0;
  const state = OAC.windowState(cfg);

  OAC.wireBuy(cfg);

  // Ticker.
  $("t-keys").textContent = fmt(sold);
  $("t-grams").textContent = OAC.grams(OAC.shareGrams(cfg, Math.max(1, sold)));
  $("t-goal").textContent = fmt(cfg.goalKeys);
  $("t-days-label").textContent = state === "soon" ? "Days to launch" : "Days left";
  $("t-days").textContent = state === "closed" ? "Closed" : OAC.daysLeft(cfg);
  $("f-ship").textContent = `Estimated ${cfg.shipWindow}, after the presale closes and the car is bought. Your key page shows every step.`;

  // Share calculator. Slider is log-scaled from 1 to 100,000 keys; it starts at "you, if you buy now".
  const range = $("s-range");
  const MAX = 100000;
  const toKeys = (v) => Math.max(1, Math.round(Math.pow(MAX, v / 1000)));
  const toValue = (n) => Math.round((Math.log(n) / Math.log(MAX)) * 1000);
  function renderShare(n) {
    const g = OAC.shareGrams(cfg, n);
    $("s-grams").textContent = OAC.grams(g);
    $("s-owners").textContent = fmt(n);
    $("s-line").textContent = n === sold + 1
      ? `Buy now and you'd hold key Nº ${fmt(n)}. Your share: about ${OAC.thing(g)}.`
      : `At ${fmt(n)} keys, each one owns about ${OAC.thing(g)}.`;
    $("n-owners").textContent = fmt(n);
    $("n-mm").textContent = OAC.nameHeightMm(cfg, n).toFixed(0) + " mm";
  }
  range.value = toValue(sold + 1);
  range.addEventListener("input", () => renderShare(toKeys(+range.value)));
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
