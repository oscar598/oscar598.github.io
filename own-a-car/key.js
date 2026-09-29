(async () => {
  const { cfg, reg, st } = await OAC.load();
  const $ = (id) => document.getElementById(id);
  const show = (id) => ($(id).hidden = false);
  const params = new URLSearchParams(location.search);
  const session = params.get("o");
  const number = parseInt(params.get("n"), 10);

  OAC.wireBuy(cfg);
  if (cfg.discordUrl) document.querySelectorAll(".discord").forEach((a) => { a.href = cfg.discordUrl; a.hidden = false; });

  // No ?o or ?n: lookup form.
  if (!session && !number) {
    show("lookup");
    $("lookup-form").addEventListener("submit", (e) => {
      e.preventDefault();
      location.search = "?n=" + parseInt($("lookup-n").value, 10);
    });
    return;
  }

  // Private link (?o=checkout session ID) → the buyer's own order. Public link (?n=42) → one key.
  let order, isPrivate = false;
  if (session) {
    const h = await OAC.sha(session);
    order = reg.orders.find((o) => o.h === h);
    isPrivate = true;
    if (!order) return show("pending");
  } else {
    order = reg.orders.find((o) => o.from <= number && number <= o.to);
    if (!order || order.refunded) return show("missing");
  }

  show("owned");
  const first = isPrivate ? order.from : number;
  const range = order.to > order.from && isPrivate ? `${OAC.pad(order.from)}–${OAC.pad(order.to)}` : OAC.pad(first);
  const owners = reg.keys || 1;
  const g = OAC.shareGrams(cfg, owners);

  $("c-name").textContent = order.name || `Owner Nº ${OAC.pad(first)}`;
  $("c-key").textContent = range;
  $("c-date").textContent = new Date(order.at + "T12:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" });
  $("k-title").textContent = `Key Nº ${range}`;
  $("k-private").textContent = isPrivate ? "Your key · private link, bookmark it" : "A key to the car";
  $("k-share").textContent = `One of ${OAC.fmt(owners)} keys. Right now each key is ${OAC.grams(g)} of Lamborghini, about ${OAC.thing(g)}.`;
  document.title = `Key Nº ${OAC.pad(first)} · OWN A CAR`;

  // Status timeline: the project phase, with this order's own shipping step on top.
  if (order.refunded || st.phase === "refunding") {
    $("k-timeline").innerHTML = `<li class="now">Refunded in full${order.refunded ? "" : " (in progress)"}. Thank you for trying.</li>`;
  } else {
    const steps = ["Presale open", "Goal reached", "Car bought", "Keys being cast", "Your box is packed", "Your key shipped", "Delivered"];
    // The project phase sets the floor; this order's own status (from ops.py mark) can move it further.
    // The public ?n= view only ever shows the project phase.
    const byPhase = { soon: -1, presale: 0, funded: 1, car: 2, casting: 3, shipping: 3, done: 6 }[st.phase] ?? -1;
    const byOrder = isPrivate ? { packed: 4, shipped: 5, delivered: 6 }[st.orders?.[order.h]] ?? -1 : -1;
    const at = Math.max(byPhase, byOrder);
    $("k-timeline").innerHTML = steps
      .map((label, i) => `<li class="${i < at ? "done" : i === at ? "now" : ""}">${label}</li>`)
      .join("");
  }

  // Sharing always uses the public ?n= link, never the private session link.
  const publicUrl = new URL(`key.html?n=${first}`, location.href).href;
  $("k-post").href = OAC.xIntent(`I own a Lamborghini.\n\nKey Nº ${OAC.pad(first)} of ∞. @ownacar`, publicUrl);
  $("k-copy").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(publicUrl); $("k-copy").textContent = "Copied"; } catch { prompt("Copy this link:", publicUrl); }
  });
  $("k-note").textContent = isPrivate
    ? "Only share the public link. This page's address is your private tracking link."
    : "";
})();
