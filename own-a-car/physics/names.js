// OWN A CAR · "The Name Wrap": the car wrapped in every owner's name, drawn to scale.
// A key buys one name slot; N owners share the wrap's area, so each name is sized to fit N of them.
// A loupe follows the pointer so the names can actually be read.
// Needs physics/shatter.js first (it shares the car's outline). Plain script, no dependencies.
(function () {
"use strict";
var S = window.OACShatter;
var W = 1440, H = 440, OY = 260;            // same drawing space as The Shatter, cropped to the car band
var CAR_MM = 4300;                           // Gallardo length; the outline is 1,080 px long
var PX_PER_MM = (1000 * 1.08) / CAR_MM;
var LOUPE_R = 70, LOUPE_ZOOM = 3;

function pad(n) { var s = String(n); while (s.length < 4) s = "0" + s; return s; }

class NameWrap {
  // names: [{ n: keyNumber, name: "Maya K." | "" }] for keys sold so far; the rest are drawn as open slots.
  constructor(canvas, opts) {
    this.canvas = canvas;
    this.names = (opts && opts.names) || [];
    this.youAt = opts && opts.youAt;           // key number to set in brass ("YOU")
    this.owners = (opts && opts.owners) || 1;
    this.mmFor = opts.mmFor;                   // owners → name height in mm (shared with the page copy)
    this.ptr = null;
    var self = this;
    this._move = function (e) {
      var r = self.canvas.getBoundingClientRect();
      self.ptr = { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
      self._schedule();
    };
    this._leave = function () { self.ptr = null; self._schedule(); };
    canvas.addEventListener("pointermove", this._move);
    canvas.addEventListener("pointerleave", this._leave);
    this._render();
  }

  setOwners(n) {
    n = Math.max(1, Math.round(n));
    if (n === this.owners) return;
    this.owners = n;
    // Re-rendering thousands of names is the slow part: wait until the slider rests.
    var self = this;
    clearTimeout(this._t);
    this._t = setTimeout(function () { self._render(); }, 120);
  }

  _schedule() {
    var self = this;
    if (this._raf) return;
    this._raf = requestAnimationFrame(function () { self._raf = 0; self._draw(); });
  }

  // Paints the wrapped car at `scale` into a fresh canvas.
  _paint(scale) {
    var c = document.createElement("canvas");
    c.width = Math.round(W * scale);
    c.height = Math.round(H * scale);
    var g = c.getContext("2d");
    g.setTransform(scale, 0, 0, scale, 0, -OY * scale);

    var body = new Path2D(); S.traceBody(body);
    g.fillStyle = "#101010";
    g.fill(body);

    var px = this.mmFor(this.owners) * PX_PER_MM;   // name height in canvas px at scale 1
    var x0 = S.x(0), x1 = S.x(1000), y0 = S.y(30), y1 = S.y(222);
    g.save();
    g.clip(body);
    if (px * scale < 1.4) {
      // Too small to render as letters: draw the rows as a fine text-like texture.
      g.fillStyle = "rgba(244,239,230,0.34)";
      var lh = Math.max(0.8 / scale, px * 1.35);
      for (var ty = y0; ty < y1; ty += lh) g.fillRect(x0, ty, x1 - x0, Math.max(0.35 / scale, px * 0.55));
    } else {
      g.font = "500 " + px + "px Saira, sans-serif";
      g.textBaseline = "top";
      var gap = px * 0.9, line = px * 1.35, k = 0, N = this.owners, sold = this.names.length;
      for (var y = y0; y < y1 && k < N; y += line) {
        var x = x0 + ((y / line) % 2) * px * 3;       // stagger rows like printed wrap film
        while (x < x1 && k < N) {
          var entry = k < sold ? this.names[k] : null;
          var num = entry ? entry.n : k + 1;
          var label = num === this.youAt ? "YOU" : entry && entry.name ? entry.name : "Nº " + pad(num);
          g.fillStyle = num === this.youAt ? "#F3DC9A" : entry ? "rgba(244,239,230,0.78)" : "rgba(244,239,230,0.3)";
          g.fillText(label, x, y);
          x += g.measureText(label).width + gap;
          k++;
        }
      }
    }
    g.restore();

    // Outline and wheels.
    g.strokeStyle = "rgba(244,239,230,0.35)";
    g.lineWidth = 1 / scale;
    g.stroke(body);
    var wh = S.wheels;
    [wh.front, wh.rear].forEach(function (w) {
      g.beginPath();
      g.arc(S.x(w[0]), S.y(w[1]), wh.r * 1.08, 0, Math.PI * 2);
      g.fillStyle = "#0a0a0a"; g.fill();
      g.lineWidth = 3 / scale; g.strokeStyle = "#7A5A1C"; g.stroke();
      g.beginPath();
      g.arc(S.x(w[0]), S.y(w[1]), wh.r * 0.62, 0, Math.PI * 2);
      g.lineWidth = 1.5 / scale; g.strokeStyle = "#C9A24A"; g.stroke();
    });
    return c;
  }

  _render() {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(W * dpr);
    this.canvas.height = Math.round(H * dpr);
    this._dpr = dpr;
    this._base = this._paint(dpr);
    this._zoom = null;                          // the loupe's high-res copy is painted on first use
    this._draw();
  }

  _draw() {
    var ctx = this.canvas.getContext("2d"), dpr = this._dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.drawImage(this._base, 0, 0);
    if (!this.ptr) return;
    if (!this._zoom) this._zoom = this._paint(LOUPE_ZOOM);
    var p = this.ptr, z = LOUPE_ZOOM;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, LOUPE_R, 0, Math.PI * 2);
    ctx.fillStyle = "#0a0a0a";
    ctx.fill();
    ctx.clip();
    // Source: the same spot in the zoomed copy, 2R/z wide, drawn 2R wide.
    ctx.drawImage(this._zoom, (p.x - LOUPE_R / z) * z, (p.y - LOUPE_R / z) * z, LOUPE_R * 2, LOUPE_R * 2,
                  p.x - LOUPE_R, p.y - LOUPE_R, LOUPE_R * 2, LOUPE_R * 2);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(p.x, p.y, LOUPE_R, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#C9A24A";
    ctx.stroke();
    ctx.font = "500 10px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#C9A24A";
    ctx.textAlign = "center";
    ctx.fillText("× " + z + " · NAMES " + Math.round(this.mmFor(this.owners)) + " MM TALL", p.x, p.y + LOUPE_R + 16);
  }
}

window.OACNames = { NameWrap: NameWrap };
})();
