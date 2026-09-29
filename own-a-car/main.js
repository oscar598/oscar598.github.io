(() => {
  const c = window.OWN_A_CAR;
  const $ = (id) => document.getElementById(id);
  const deadline = new Date(c.deadline);
  const open = Boolean(c.checkoutUrl) && Date.now() < deadline;

  const buy = $("buy");
  if (open) {
    buy.href = c.checkoutUrl;
    buy.removeAttribute("aria-disabled");
    buy.textContent = `Buy a key · $${c.priceUsd}`;
  } else {
    buy.addEventListener("click", (e) => e.preventDefault());
    if (c.checkoutUrl) buy.textContent = "Presale closed";
  }

  $("goal").textContent = c.goalKeys.toLocaleString();
  $("ship").textContent = `Estimated ${c.shipWindow}, after the presale closes and the car is bought.`;

  const days = Math.ceil((deadline - Date.now()) / 864e5);
  $("left").textContent = days > 0 ? `${days} days left` : "closed";

  fetch("progress.json", { cache: "no-store" })
    .then((r) => r.json())
    .then(({ keys }) => {
      $("sold").textContent = keys.toLocaleString();
      $("fill").style.width = Math.min(100, (keys / c.goalKeys) * 100) + "%";
    })
    .catch(() => {});
})();
