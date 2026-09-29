// The browser tab follows the story: the favicon shows the current scene number,
// the title shows the chapter, and leaving the tab gets a little nudge.

const { ScrollTrigger } = window;

export function initTab() {
  const base = "Oscar Lu";
  let current = `${base} · A Life in Seven Chapters`;

  const link = document.querySelector('link[rel="icon"]') || document.head.appendChild(Object.assign(document.createElement("link"), { rel: "icon" }));
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const x = c.getContext("2d");

  function favicon(label) {
    x.clearRect(0, 0, 64, 64);
    x.fillStyle = "#0e0d0b";
    x.beginPath();
    x.roundRect ? x.roundRect(0, 0, 64, 64, 14) : x.rect(0, 0, 64, 64);
    x.fill();
    x.fillStyle = "#ff4b2b";
    x.font = "900 36px Fraunces, Georgia, serif";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText(label, 32, 35);
    link.href = c.toDataURL("image/png");
  }

  const scenes = [...document.querySelectorAll(".scene")];
  scenes.forEach((scene, i) => {
    const n = String(i).padStart(2, "0");
    const heading = scene.querySelector(".copy h2")?.textContent?.trim();
    const label = heading || scene.dataset.label;
    ScrollTrigger.create({
      trigger: scene,
      start: "top center",
      end: "bottom center",
      onToggle(self) {
        if (!self.isActive) return;
        current = i === 0 ? `${base} · A Life in Seven Chapters` : `${n} · ${label} · ${base}`;
        if (!document.hidden) document.title = current;
        favicon(i === 0 ? "OL" : n);
      },
    });
  });

  document.addEventListener("visibilitychange", () => {
    document.title = document.hidden ? "come back, the letters miss you" : current;
  });

  favicon("OL");
}
