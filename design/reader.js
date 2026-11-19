// Magazine reader. Wide screens show spreads (cover alone, then 2–3, 4–5 …),
// narrow screens show one page. Arrows, ← → keys and swipes turn pages.
// Only the current and next spreads load, so a 36-page issue stays light.

(() => {
  const dialog = document.querySelector(".reader");
  const spread = dialog.querySelector(".spread");
  const count = dialog.querySelector(".count");
  const prevBtn = dialog.querySelector(".prev");
  const nextBtn = dialog.querySelector(".next");
  const wide = matchMedia("(min-width: 900px) and (min-aspect-ratio: 1/1)");
  const calm = matchMedia("(prefers-reduced-motion: reduce)");

  let year = null;
  let pages = 0;
  let page = 1; // first page of the current view
  let busy = false;

  const src = (n) => `../assets/griffin/${year}/${String(n).padStart(2, "0")}.jpg`;

  // Pages shown together with page n.
  function view(n) {
    if (!wide.matches) return [n];
    if (n === 1) return [1];
    const left = n % 2 === 0 ? n : n - 1;
    return left + 1 <= pages ? [left, left + 1] : [left];
  }
  const step = () => (wide.matches ? 2 : 1);
  const nextStart = () => (wide.matches ? (page === 1 ? 2 : view(page)[0] + 2) : page + 1);
  const prevStart = () => (wide.matches ? Math.max(1, view(page)[0] - 2) : page - 1);

  function preload(n) {
    if (n < 1 || n > pages) return;
    view(n).forEach((p) => { const i = new Image(); i.src = src(p); });
  }

  function render() {
    const shown = view(page);
    page = shown[0];
    spread.className = "spread" + (shown.length === 2 ? " two" : "");
    spread.replaceChildren(...shown.map((p) => {
      const img = new Image();
      img.src = src(p);
      img.alt = `Page ${p}`;
      img.decoding = "async";
      img.draggable = false;
      return img;
    }));
    count.textContent = `${shown.join("–")} / ${pages}`;
    prevBtn.disabled = page <= 1;
    nextBtn.disabled = shown[shown.length - 1] >= pages;
    preload(nextStart());
    preload(prevStart());
  }

  function turn(dir) {
    if (busy) return;
    const target = dir > 0 ? nextStart() : prevStart();
    if (target < 1 || target > pages || target === page) return;
    const kind = dir > 0 ? "next" : "prev";
    if (calm.matches) { page = target; render(); return; }
    busy = true;
    spread.classList.add(`out-${kind}`);
    setTimeout(() => {
      page = target;
      render();
      spread.classList.add(`in-${kind}`);
      setTimeout(() => { spread.classList.remove(`in-${kind}`); busy = false; }, 420);
    }, 240);
  }

  function open(btn) {
    year = btn.dataset.year;
    pages = Number(btn.dataset.pages);
    page = 1;
    render();
    dialog.showModal();
    history.replaceState(null, "", `#${year}`);
  }

  document.querySelectorAll(".issue").forEach((btn) => btn.addEventListener("click", () => open(btn)));
  prevBtn.addEventListener("click", () => turn(-1));
  nextBtn.addEventListener("click", () => turn(1));
  dialog.querySelector(".close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => history.replaceState(null, "", location.pathname));

  // Tap the left or right half of a page to turn, like a book.
  spread.addEventListener("click", (e) => turn(e.clientX < innerWidth / 2 ? -1 : 1));

  document.addEventListener("keydown", (e) => {
    if (!dialog.open) return;
    if (e.key === "ArrowRight") turn(1);
    if (e.key === "ArrowLeft") turn(-1);
  });

  let x0 = null;
  dialog.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  dialog.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 40) turn(dx < 0 ? 1 : -1);
  });

  wide.addEventListener("change", () => { if (dialog.open) render(); });

  // Deep link: /design/#2025 opens that issue.
  const linked = document.querySelector(`.issue[data-year="${location.hash.slice(1)}"]`);
  if (linked) open(linked);
})();
