// OWN A CAR · "Key Rain": brass keys fall and pile up, one per key sold. Grab one, throw it.
// Ported from the design canvas artboard Physics-KeyRain. Plain script, no dependencies.
// Each key is 5 particles (verlet) snapped back to a rigid key every solver pass, with a
// spatial grid for collisions and sleeping for keys at rest.
// Usage: var r = new OACKeyRain.KeyRain(canvasEl, { sold: 2092 }); r.drop(); r.shake();
(function () {
"use strict";
var KR = (function () {
  var OFF = [0, 19, 35, 51, 66];          // particle offsets along key axis (ring -> tip)
  var RAD = [13, 7.5, 6.5, 6.5, 5.5];     // collision radii
  var MASS = [2.4, 1.1, 1, 1, 0.9];
  var PPK = 5, MAXK = 262, CAP = 250;
  var CS = 28, GX0 = -60, GY0 = -1400;
  var SX0 = -24, SY0 = -24, SW = 108, SH = 48, SS = 2;
  var ring = null, rim = null, body = null;
  function paths() {
    if (ring) return;
    ring = new Path2D();
    ring.arc(0, 0, 13.5, 0, Math.PI * 2);
    ring.moveTo(5, 0);
    ring.arc(0, 0, 5, 0, Math.PI * 2);
    rim = new Path2D();
    rim.arc(0, 0, 13.5, 0, Math.PI * 2);
    body = new Path2D();
    body.moveTo(11, -6); body.lineTo(13, -7.5); body.lineTo(20, -7.5); body.lineTo(21.5, -4.4);
    body.lineTo(68, -4.4); body.lineTo(72.5, 0); body.lineTo(69, 4.4);
    [62, 54, 46].forEach(function (tx) {
      body.lineTo(tx + 3, 4.4); body.lineTo(tx + 1.4, 9); body.lineTo(tx - 1.4, 9); body.lineTo(tx - 3, 4.4);
    });
    body.lineTo(21.5, 4.4); body.lineTo(20, 7.5); body.lineTo(13, 7.5); body.lineTo(11, 6);
    body.closePath();
  }
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
  var K = { OFF: OFF, RAD: RAD, MASS: MASS, PPK: PPK, MAXK: MAXK, CAP: CAP, CS: CS, GX0: GX0, GY0: GY0,
    SX0: SX0, SY0: SY0, SW: SW, SH: SH, SS: SS, paths: paths, P: function () { return { ring: ring, rim: rim, body: body }; }, fmt: fmt };
  K.size = function (w, h) { K.W = w; K.H = h; K.COLS = Math.ceil((w + 120) / CS); K.ROWS = Math.ceil((h + 1400 + 60) / CS); };
  return K;
})();

class KeyRain {
  // opts: { sold, shown (max keys drawn), gravity, onChange(state) }
  constructor(canvas, opts) {
    this.canvas = canvas;
    this.opts = opts || {};
    this._sold = this.opts.sold || 0;
    this._mine = 0;
    var self = this;
    this._h = {
      down: function (e) { self.onDown(e); }, move: function (e) { self.onMove(e); }, up: function (e) { self.onUp(e); }
    };
    canvas.addEventListener('pointerdown', this._h.down);
    canvas.addEventListener('pointermove', this._h.move);
    canvas.addEventListener('pointerup', this._h.up);
    canvas.addEventListener('pointercancel', this._h.up);
    canvas.addEventListener('pointerleave', this._h.up);
    this._resize = function () {
      clearTimeout(self._rt);
      self._rt = setTimeout(function () {
        var r = self.canvas.getBoundingClientRect();
        if (Math.abs(r.width - KR.W) > 40 || Math.abs(r.height - KR.H) > 120) self.init();
      }, 250);
    };
    window.addEventListener('resize', this._resize);
    this.start();
  }

  // How many keys the pile shows, and how many real keys each one stands for.
  get ratio() { var n = this.shownN(); return n ? Math.max(1, this._sold / n) : 1; }

  start() {
    this._alive = true;
    this.reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    this._t0 = 0; this._acc = 0;
    // Only run while the hero is on screen.
    this._visible = true;
    if ('IntersectionObserver' in window) {
      this._io = new IntersectionObserver((es) => {
        this._visible = es[0].isIntersecting;
        if (this._visible && this._alive && this.ready && !this.raf && !this.reduced) { this._t0 = 0; this.raf = requestAnimationFrame(this.loop); }
      });
      this._io.observe(this.canvas);
    }
    this.loop = (t) => {
      if (!this._alive) return;
      if (!this._visible) { this.raf = 0; return; }
      this.raf = requestAnimationFrame(this.loop);
      if (!this._t0) this._t0 = t;
      var dt = Math.min(50, t - this._t0); this._t0 = t;
      this._acc += dt;
      var n = 0;
      while (this._acc >= 16.667 && n < 3) { this.frame(); this._acc -= 16.667; n++; }
      if (n === 3) this._acc = 0;
      // Skip drawing while the whole pile is asleep and nothing is moving, fading or pulsing.
      if (this.awake || this.grab || this.queue.length || this.fading || this.fc < this._pulseUntil || this._dirty) {
        this.render();
        this._dirty = false;
      }
    };
    var boot = () => {
      if (!this._alive) return;
      if (!this.canvas) { this.raf = requestAnimationFrame(boot); return; }
      this.init();
      if (this.reduced) this.render();
      else this.raf = requestAnimationFrame(this.loop);
    };
    this.raf = requestAnimationFrame(boot);
  }

  destroy() {
    this._alive = false;
    cancelAnimationFrame(this.raf);
    if (this._io) this._io.disconnect();
    window.removeEventListener('resize', this._resize);
    var c = this.canvas, h = this._h;
    c.removeEventListener('pointerdown', h.down); c.removeEventListener('pointermove', h.move);
    c.removeEventListener('pointerup', h.up); c.removeEventListener('pointercancel', h.up); c.removeEventListener('pointerleave', h.up);
  }

  // ---------- setup ----------
  init() {
    var K = KR;
    K.paths();
    var cv = this.canvas;
    var r = cv.getBoundingClientRect();
    K.size(Math.max(320, Math.round(r.width)), Math.max(320, Math.round(r.height)));
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    this.dpr = dpr;
    cv.width = Math.round(K.W * dpr); cv.height = Math.round(K.H * dpr);
    this.ctx = cv.getContext('2d');
    var n = K.MAXK * K.PPK;
    this.X = new Float32Array(n); this.Y = new Float32Array(n);
    this.PX = new Float32Array(n); this.PY = new Float32Array(n);
    this.RR = new Float32Array(n); this.IM = new Float32Array(n); this.PK = new Int32Array(n);
    for (var j = 0; j < n; j++) { var i = j % K.PPK; this.RR[j] = K.RAD[i]; this.IM[j] = 1 / K.MASS[i]; this.PK[j] = (j / K.PPK) | 0; }
    this.act = new Int32Array(n); this.m = 0;
    this.CX = new Float32Array(n); this.CY = new Float32Array(n);
    this.pc = new Int32Array(n); this.items = new Int32Array(n);
    var NC = K.COLS * K.ROWS; this.NC = NC;
    this.cnt = new Int32Array(NC); this.st = new Int32Array(NC + 1); this.cur = new Int32Array(NC);
    this.keys = []; this.free = [];
    for (var s = 0; s < K.MAXK; s++) { this.keys.push({ alive: false, cv: null }); }
    for (var s2 = K.MAXK - 1; s2 >= 0; s2--) this.free.push(s2);
    this.order = []; this.queue = []; this.grab = null; this.fc = 0; this.awake = 0; this._pulseUntil = 0; this._dirty = true;
    var fog = this.ctx.createLinearGradient(0, K.H * 0.62, 0, K.H);
    fog.addColorStop(0, 'rgba(10,10,10,0)');
    fog.addColorStop(1, 'rgba(10,10,10,0.62)');
    this.fog = fog;

    var N = this.shownN();
    var rainN = this.reduced ? 0 : Math.min(30, Math.round(N * 0.16));
    var pre = N - rainN;
    var nums = [];
    for (var q = 0; q < N; q++) nums.push(Math.max(1, Math.round((q + 0.5) * this._sold / N)));
    if (!N) {  // before launch: key Nº 0001 falls alone, unclaimed
      nums.push(1); N = 1; rainN = this.reduced ? 0 : 1; pre = 0;
    }
    // prewarm: loose rows near the floor, then settle offscreen
    var perRow = Math.max(5, Math.round(K.W / 96)), cw = K.W / perRow;
    for (var q2 = 0; q2 < pre; q2++) {
      var row = (q2 / perRow) | 0, col = q2 % perRow;
      var steep = Math.random() < 0.1;
      var a = (Math.random() < 0.5 ? 0 : Math.PI) + (Math.random() - 0.5) * (steep ? 1.2 : 0.5);
      var cx = cw * (col + 0.5) + (row % 2 ? cw * 0.3 : -cw * 0.1) + (Math.random() - 0.5) * 20;
      var cy = K.H - 18 - row * 40;
      this.addKey(cx - Math.cos(a) * 33, cy - Math.sin(a) * 33, a, 0, 0, 0, nums[q2], false);
    }
    for (var f = 0; f < 200; f++) { this.frame(); if (f > 60 && this.awake < pre * 0.12) break; }
    for (var q3 = pre; q3 < N; q3++) this.queue.push(nums[q3]);
    if (this.reduced && this.queue.length) { while (this.queue.length) this.spawn(this.queue.shift(), false); this.settle(240); }
    this.ready = true;

    if (document.fonts && document.fonts.load) {
      Promise.all([document.fonts.load('500 7px "JetBrains Mono"'), document.fonts.load('10px Michroma')]).then(() => {
        if (!this._alive) return;
        for (var o = 0; o < this.order.length; o++) this.bake(this.keys[this.order[o]]);
        if (this.reduced) this.render();
      }).catch(function () {});
    }
  }

  shownN() {
    // One drawn key per real key until the stage is full; wider stages hold more.
    var cap = Math.round((this.opts.shown || 180) * Math.min(1.3, (KR.W || 1440) / 1440));
    return Math.min(this._sold, Math.max(24, cap));
  }

  settle(frames) { for (var f = 0; f < frames; f++) { this.frame(); if (f > 30 && this.awake === 0) break; } }

  // ---------- key lifecycle ----------
  addKey(x0, y0, a, vx, vy, w, num, you) {
    var K = KR;
    var live = 0, oldest = -1;
    for (var o = 0; o < this.order.length; o++) {
      var kk = this.keys[this.order[o]];
      if (kk.die > 0) continue;
      live++;
      if (oldest < 0 && !kk.you) oldest = this.order[o];
    }
    if (live >= K.CAP && oldest >= 0) { this.keys[oldest].die = 30; this.wakeAll(); }
    if (!this.free.length) {
      for (var o2 = 0; o2 < this.order.length; o2++) { if (this.keys[this.order[o2]].die > 0) { this.removeKey(this.order[o2]); break; } }
      if (!this.free.length) return -1;
    }
    var s = this.free.pop(), k = this.keys[s];
    k.alive = true; k.sleep = false; k.still = 0; k.die = 0; k.you = !!you; k.num = num;
    k.flip = Math.random() < 0.5; k.born = this.fc;
    var c = Math.cos(a), sn = Math.sin(a), b = s * K.PPK;
    for (var i = 0; i < K.PPK; i++) {
      var j = b + i, off = K.OFF[i], rs = off - 30;
      this.X[j] = x0 + c * off; this.Y[j] = y0 + sn * off;
      this.PX[j] = this.X[j] - (vx - w * rs * sn);
      this.PY[j] = this.Y[j] - (vy + w * rs * c);
    }
    k.dx = c; k.dy = sn;
    this.bake(k);
    this.order.push(s);
    return s;
  }

  removeKey(s) {
    var k = this.keys[s];
    k.alive = false;
    var idx = this.order.indexOf(s);
    if (idx >= 0) this.order.splice(idx, 1);
    this.free.push(s);
    if (this.grab && this.grab.k === s) this.grab = null;
    this.wakeAll();
  }

  spawn(num, you) {
    var K = KR;
    var x = you ? K.W / 2 + (Math.random() - 0.5) * K.W * 0.26 : 70 + Math.random() * (K.W - 140);
    var y = this.reduced ? K.H * 0.37 : -50 - Math.random() * 70;
    var a = Math.random() * Math.PI * 2;
    return this.addKey(x - Math.cos(a) * 33, y - Math.sin(a) * 33, a, (Math.random() - 0.5) * 3, you ? 3 : 2 + Math.random() * 3, (Math.random() - 0.5) * 0.12, num, you);
  }

  wake(s) { var k = this.keys[s]; k.sleep = false; k.still = 0; }
  wakeAll() { for (var o = 0; o < this.order.length; o++) this.wake(this.order[o]); }

  // ---------- sprites ----------
  bake(k) {
    var K = KR, P = K.P(), S = K.SS;
    var cv = k.cv;
    if (!cv) { cv = k.cv = document.createElement('canvas'); cv.width = K.SW * S; cv.height = K.SH * S; }
    var g = cv.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, cv.width, cv.height);
    g.setTransform(S, 0, 0, S, -K.SX0 * S, -K.SY0 * S);
    g.save();
    if (k.flip) g.scale(1, -1);
    var rg = g.createLinearGradient(-13, -13, 13, 13);
    rg.addColorStop(0, '#F3DC9A'); rg.addColorStop(0.5, '#C9A24A'); rg.addColorStop(1, '#7A5A1C');
    var bg = g.createLinearGradient(0, -8, 0, 9);
    bg.addColorStop(0, '#F3DC9A'); bg.addColorStop(0.3, '#DDBD6C'); bg.addColorStop(0.58, '#C9A24A'); bg.addColorStop(1, '#7A5A1C');
    if (k.you) { g.shadowColor = 'rgba(242,92,5,0.9)'; g.shadowBlur = 14 * S; g.shadowOffsetY = 0; }
    else { g.shadowColor = 'rgba(0,0,0,0.75)'; g.shadowBlur = 7 * S; g.shadowOffsetY = 2 * S; }
    g.fillStyle = bg; g.fill(P.body);
    g.fillStyle = rg; g.fill(P.ring, 'evenodd');
    g.shadowColor = 'rgba(0,0,0,0)'; g.shadowBlur = 0; g.shadowOffsetY = 0;
    g.lineWidth = 0.8; g.strokeStyle = 'rgba(92,64,16,0.9)';
    g.stroke(P.body); g.stroke(P.ring);
    g.fillStyle = rg; g.beginPath(); g.arc(0, 0, 12.9, 0, Math.PI * 2); g.arc(0, 0, 5.6, 0, Math.PI * 2, true); g.fill();
    g.lineWidth = 1; g.strokeStyle = 'rgba(255,247,222,0.7)';
    g.beginPath(); g.moveTo(22, -3.5); g.lineTo(67.5, -3.5); g.stroke();
    g.beginPath(); g.arc(0, 0, 11.8, Math.PI * 1.02, Math.PI * 1.62); g.stroke();
    g.strokeStyle = 'rgba(255,240,200,0.45)';
    g.beginPath(); g.arc(0, 0, 5.4, Math.PI * 0.15, Math.PI * 0.85); g.stroke();
    g.strokeStyle = 'rgba(58,40,8,0.85)';
    g.beginPath(); g.arc(0, 0, 5.4, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
    g.lineWidth = 0.7; g.strokeStyle = 'rgba(92,64,16,0.6)';
    g.beginPath(); g.moveTo(15.5, -7); g.lineTo(15.5, 7); g.moveTo(18, -7); g.lineTo(18, 7); g.moveTo(43, -1); g.lineTo(67, -1); g.stroke();
    if (k.you) {
      g.lineWidth = 1.6; g.strokeStyle = '#F25C05';
      g.stroke(P.body); g.stroke(P.rim);
    }
    g.restore();
    var label = String(k.num).padStart(4, '0');
    g.font = '500 6.2px "JetBrains Mono", monospace';
    g.textBaseline = 'middle';
    g.fillStyle = 'rgba(255,240,200,0.5)'; g.fillText(label, 24.3, 0.95);
    g.fillStyle = k.you ? 'rgba(150,40,0,0.95)' : 'rgba(58,40,8,0.92)'; g.fillText(label, 24, 0.5);
  }

  // ---------- physics ----------
  frame() {
    var K = KR;
    this.fc++;
    if (this.queue.length && this.fc % 3 === 0) this.spawn(this.queue.shift(), false);
    var gv = this.opts.gravity || 1;
    var g = 0.3 * gv;
    this.sub(g); this.sub(g);
    var X = this.X, Y = this.Y, PX = this.PX, PY = this.PY, ord = this.order, keys = this.keys;
    var awake = 0, fading = false;
    for (var o = ord.length - 1; o >= 0; o--) {
      var s = ord[o], k = keys[s], b = s * K.PPK;
      if (k.die > 0) { fading = true; k.die--; if (k.die === 0) { this.removeKey(s); continue; } }
      if (k.sleep) continue;
      awake++;
      if (this.grab && this.grab.k === s) { k.still = 0; continue; }
      var mx = 0;
      for (var i = 0; i < K.PPK; i++) { var j = b + i, vx = X[j] - PX[j], vy = Y[j] - PY[j], v = vx * vx + vy * vy; if (v > mx) mx = v; }
      // sleep on low net drift over a window (ignores solver micro-jitter)
      if (mx < 4 && Y[b] > 0) {
        if (k.still === 0) { k.sx = X[b]; k.sy = Y[b]; k.sx4 = X[b + 4]; k.sy4 = Y[b + 4]; }
        if (++k.still > 6) { for (var i4 = 0; i4 < K.PPK; i4++) { PX[b + i4] += (X[b + i4] - PX[b + i4]) * 0.5; PY[b + i4] += (Y[b + i4] - PY[b + i4]) * 0.5; } }
        if (k.still > 18) {
          var ddx = X[b] - k.sx, ddy = Y[b] - k.sy, dex = X[b + 4] - k.sx4, dey = Y[b + 4] - k.sy4;
          if (ddx * ddx + ddy * ddy < 6 && dex * dex + dey * dey < 6) {
            k.sleep = true;
            for (var i2 = 0; i2 < K.PPK; i2++) { PX[b + i2] = X[b + i2]; PY[b + i2] = Y[b + i2]; }
          } else k.still = 0;
        }
      } else k.still = 0;
    }
    this.awake = awake;
    this.fading = fading;
  }

  sub(g) {
    var K = KR, X = this.X, Y = this.Y, PX = this.PX, PY = this.PY, keys = this.keys, ord = this.order, act = this.act;
    var grab = this.grab, m = 0, MAXV = 40;
    for (var o = 0; o < ord.length; o++) {
      var s = ord[o], k = keys[s], b = s * K.PPK;
      for (var i = 0; i < K.PPK; i++) act[m++] = b + i;
      if (k.sleep) continue;
      var damp = (grab && grab.k === s) ? 0.965 : 0.996;
      for (var i2 = 0; i2 < K.PPK; i2++) {
        var j = b + i2, vx = (X[j] - PX[j]) * damp, vy = (Y[j] - PY[j]) * damp, sp = vx * vx + vy * vy;
        if (sp > MAXV * MAXV) { var f = MAXV / Math.sqrt(sp); vx *= f; vy *= f; }
        PX[j] = X[j]; PY[j] = Y[j];
        X[j] += vx; Y[j] += vy + g;
      }
    }
    this.m = m;
    this.CX.fill(0); this.CY.fill(0);
    this.buildGrid();
    for (var it = 0; it < 3; it++) {
      this.collide();
      if (grab) this.pull();
      this.shape();
      this.bounds();
    }
    // cap depenetration velocity so wedged keys ease apart instead of popping
    var CX = this.CX, CY = this.CY, MD = 3;
    for (var o2 = 0; o2 < ord.length; o2++) {
      var s2 = ord[o2];
      if (keys[s2].sleep || (grab && grab.k === s2)) continue;
      var b2 = s2 * K.PPK;
      for (var i3 = 0; i3 < K.PPK; i3++) {
        var j3 = b2 + i3, ex = CX[j3], ey = CY[j3], el = ex * ex + ey * ey;
        if (el < 1e-8) continue;
        el = Math.sqrt(el); ex /= el; ey /= el;
        var vn = (X[j3] - PX[j3]) * ex + (Y[j3] - PY[j3]) * ey;
        if (vn > MD) { PX[j3] += ex * (vn - MD); PY[j3] += ey * (vn - MD); }
      }
    }
  }

  buildGrid() {
    var K = KR, X = this.X, Y = this.Y, act = this.act, m = this.m, cnt = this.cnt, st = this.st, cur = this.cur, pc = this.pc, items = this.items;
    var COLS = K.COLS, ROWS = K.ROWS, NC = this.NC;
    cnt.fill(0);
    for (var t = 0; t < m; t++) {
      var j = act[t];
      var cx = ((X[j] - K.GX0) / K.CS) | 0, cy = ((Y[j] - K.GY0) / K.CS) | 0;
      if (cx < 0) cx = 0; else if (cx >= COLS) cx = COLS - 1;
      if (cy < 0) cy = 0; else if (cy >= ROWS) cy = ROWS - 1;
      var c = cy * COLS + cx; pc[j] = c; cnt[c]++;
    }
    var acc = 0;
    for (var c2 = 0; c2 < NC; c2++) { st[c2] = acc; cur[c2] = acc; acc += cnt[c2]; }
    st[NC] = acc;
    for (var t2 = 0; t2 < m; t2++) { var j2 = act[t2]; items[cur[pc[j2]]++] = j2; }
  }

  collide() {
    var K = KR, X = this.X, Y = this.Y, PX = this.PX, PY = this.PY, RR = this.RR, IM = this.IM, PK = this.PK;
    var keys = this.keys, act = this.act, m = this.m, pc = this.pc, st = this.st, items = this.items, CX = this.CX, CY = this.CY;
    var COLS = K.COLS, ROWS = K.ROWS, MU = 0.3, WAKE2 = 6;
    for (var t = 0; t < m; t++) {
      var a = act[t], ka = PK[a], A = keys[ka];
      var c = pc[a], cx = c % COLS, cy = (c - cx) / COLS;
      for (var yy = cy - 1; yy <= cy + 1; yy++) {
        if (yy < 0 || yy >= ROWS) continue;
        for (var xx = cx - 1; xx <= cx + 1; xx++) {
          if (xx < 0 || xx >= COLS) continue;
          var cell = yy * COLS + xx, qe = st[cell + 1];
          for (var q = st[cell]; q < qe; q++) {
            var b = items[q];
            if (b <= a) continue;
            var kb = PK[b];
            if (kb === ka) continue;
            var B = keys[kb];
            if (A.sleep && B.sleep) continue;
            var dx = X[b] - X[a], dy = Y[b] - Y[a], rr = RR[a] + RR[b], d2 = dx * dx + dy * dy;
            if (d2 >= rr * rr) continue;
            if (d2 < 1e-6) { dx = 0.01; dy = -0.01; d2 = 0.0002; }
            var d = Math.sqrt(d2), ov = Math.min(3, rr - d), nx = dx / d, ny = dy / d;
            if (A.sleep) { var ux = X[b] - PX[b], uy = Y[b] - PY[b]; if (ux * ux + uy * uy > WAKE2 && ov > 0.4) this.wake(ka); }
            else if (B.sleep) { var ux2 = X[a] - PX[a], uy2 = Y[a] - PY[a]; if (ux2 * ux2 + uy2 * uy2 > WAKE2 && ov > 0.4) this.wake(kb); }
            var wa = A.sleep ? 0 : IM[a], wb = B.sleep ? 0 : IM[b];
            var ws = wa + wb;
            if (ws === 0) continue;
            var ca = ov * wa / ws, cb = ov * wb / ws;
            X[a] -= nx * ca; Y[a] -= ny * ca; X[b] += nx * cb; Y[b] += ny * cb;
            CX[a] -= nx * ca; CY[a] -= ny * ca; CX[b] += nx * cb; CY[b] += ny * cb;
            var rvx = (X[a] - PX[a]) - (X[b] - PX[b]), rvy = (Y[a] - PY[a]) - (Y[b] - PY[b]);
            var vn = rvx * nx + rvy * ny, tx = (rvx - vn * nx) * MU, ty = (rvy - vn * ny) * MU;
            PX[a] += tx * wa / ws; PY[a] += ty * wa / ws;
            PX[b] -= tx * wb / ws; PY[b] -= ty * wb / ws;
          }
        }
      }
    }
  }

  pull() {
    var g = this.grab, j = g.p;
    this.X[j] += (g.tx - this.X[j]) * 0.45;
    this.Y[j] += (g.ty - this.Y[j]) * 0.45;
  }

  // rigid shape matching: snap the 5 particles back onto a straight, fixed-length key
  shape() {
    var K = KR, X = this.X, Y = this.Y, keys = this.keys, ord = this.order, OFF = K.OFF, MASS = K.MASS, grab = this.grab;
    for (var o = 0; o < ord.length; o++) {
      var s = ord[o], k = keys[s];
      if (k.sleep) continue;
      var b = s * K.PPK, Wt = 0, cx = 0, cy = 0, sc = 0, gp = (grab && grab.k === s) ? grab.p - b : -1;
      for (var i = 0; i < 5; i++) { var w = MASS[i] * (i === gp ? 14 : 1); Wt += w; cx += w * X[b + i]; cy += w * Y[b + i]; sc += w * OFF[i]; }
      cx /= Wt; cy /= Wt; sc /= Wt;
      var dx = 0, dy = 0;
      for (var i2 = 0; i2 < 5; i2++) { var w2 = MASS[i2] * (i2 === gp ? 14 : 1), sv = OFF[i2] - sc; dx += w2 * sv * (X[b + i2] - cx); dy += w2 * sv * (Y[b + i2] - cy); }
      var L = Math.sqrt(dx * dx + dy * dy);
      if (L < 1e-6) { dx = k.dx; dy = k.dy; } else { dx /= L; dy /= L; k.dx = dx; k.dy = dy; }
      for (var i3 = 0; i3 < 5; i3++) { var s3 = OFF[i3] - sc; X[b + i3] = cx + s3 * dx; Y[b + i3] = cy + s3 * dy; }
    }
  }

  bounds() {
    var K = KR, X = this.X, Y = this.Y, PX = this.PX, PY = this.PY, RR = this.RR, keys = this.keys, ord = this.order, W = K.W, H = K.H;
    for (var o = 0; o < ord.length; o++) {
      var s = ord[o];
      if (keys[s].sleep) continue;
      var b = s * K.PPK;
      for (var i = 0; i < 5; i++) {
        var j = b + i, r = RR[j];
        if (Y[j] > H - r) {
          var vy = Y[j] - PY[j];
          Y[j] = H - r;
          if (vy > 2.5) PY[j] = Y[j] + vy * 0.22;
          PX[j] += (X[j] - PX[j]) * 0.3;
        }
        if (X[j] < r) { var vx = X[j] - PX[j]; X[j] = r; PX[j] = X[j] + vx * 0.3; }
        else if (X[j] > W - r) { var vx2 = X[j] - PX[j]; X[j] = W - r; PX[j] = X[j] + vx2 * 0.3; }
        if (Y[j] < -1300) { Y[j] = -1300; PY[j] = Y[j]; }
      }
    }
  }

  // ---------- drawing ----------
  render() {
    var K = KR, c = this.ctx, d = this.dpr, keys = this.keys, X = this.X, Y = this.Y, ord = this.order;
    if (!c) return;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1;
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    var draw = (s) => {
      var k = keys[s], b = s * K.PPK, x0 = X[b], y0 = Y[b], ax = X[b + 4] - x0, ay = Y[b + 4] - y0;
      var L = Math.sqrt(ax * ax + ay * ay) || 1, cs = ax / L, sn = ay / L;
      c.globalAlpha = k.die > 0 ? k.die / 30 : 1;
      c.setTransform(d * cs, d * sn, -d * sn, d * cs, d * x0, d * y0);
      c.drawImage(k.cv, K.SX0, K.SY0, K.SW, K.SH);
    };
    for (var o = 0; o < ord.length; o++) if (!keys[ord[o]].you) draw(ord[o]);
    c.globalAlpha = 1;
    c.setTransform(d, 0, 0, d, 0, 0);
    c.fillStyle = this.fog; c.fillRect(0, K.H * 0.62, K.W, K.H * 0.38);
    for (var o2 = 0; o2 < ord.length; o2++) if (keys[ord[o2]].you) draw(ord[o2]);
    c.globalAlpha = 1;
    c.setTransform(d, 0, 0, d, 0, 0);
    // YOU tags
    for (var o3 = 0; o3 < ord.length; o3++) {
      var s = ord[o3], k = keys[s];
      if (!k.you) continue;
      var b = s * K.PPK, top = 1e9, mx = (X[b] + X[b + 4]) / 2, my = (Y[b] + Y[b + 4]) / 2;
      for (var i = 0; i < 5; i++) if (Y[b + i] - K.RAD[i] < top) top = Y[b + i] - K.RAD[i];
      var age = this.fc - k.born;
      if (age < 260 && !this.reduced) {
        var ph = (age % 65) / 65, al = (1 - ph) * 0.55 * (1 - age / 260);
        c.strokeStyle = 'rgba(242,92,5,' + al.toFixed(3) + ')'; c.lineWidth = 1.5;
        c.beginPath(); c.arc(mx, my, 34 + ph * 46, 0, Math.PI * 2); c.stroke();
      }
      var label = 'YOU · Nº ' + K.fmt(k.num);
      c.font = '9px Michroma, sans-serif';
      if ('letterSpacing' in c) c.letterSpacing = '1.5px';
      var tw = c.measureText(label).width, bw = tw + 20, bh = 22;
      var ty = Math.max(bh + 4, top - 18), tx = Math.max(8, Math.min(K.W - 8 - bw, mx - bw / 2));
      c.strokeStyle = 'rgba(242,92,5,0.75)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(mx, ty); c.lineTo(mx, Math.max(ty, top + 4)); c.stroke();
      c.beginPath();
      c.moveTo(tx + 6, ty - bh); c.lineTo(tx + bw, ty - bh); c.lineTo(tx + bw, ty - 6); c.lineTo(tx + bw - 6, ty); c.lineTo(tx, ty); c.lineTo(tx, ty - bh + 6); c.closePath();
      c.fillStyle = 'rgba(10,10,10,0.86)'; c.fill();
      c.strokeStyle = '#F25C05'; c.stroke();
      c.fillStyle = '#F25C05'; c.textBaseline = 'middle';
      c.fillText(label, tx + 10, ty - bh / 2 + 0.5);
      if ('letterSpacing' in c) c.letterSpacing = '0px';
    }
    // drag tether
    if (this.grab) {
      var j = this.grab.p;
      c.strokeStyle = 'rgba(244,239,230,0.35)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(X[j], Y[j]); c.lineTo(this.grab.tx, this.grab.ty); c.stroke();
      c.fillStyle = '#F4EFE6';
      c.beginPath(); c.arc(this.grab.tx, this.grab.ty, 3, 0, Math.PI * 2); c.fill();
    }
  }

  // ---------- interaction ----------
  pt(e) {
    var r = this.canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * KR.W / (r.width || KR.W), y: (e.clientY - r.top) * KR.H / (r.height || KR.H) };
  }

  pick(x, y) {
    var K = KR, best = -1, bd = 10;
    for (var o = this.order.length - 1; o >= 0; o--) {
      var s = this.order[o], k = this.keys[s];
      if (k.die > 0) continue;
      var b = s * K.PPK;
      for (var i = 0; i < 5; i++) {
        var j = b + i, dx = this.X[j] - x, dy = this.Y[j] - y, dd = Math.sqrt(dx * dx + dy * dy) - this.RR[j];
        if (dd < bd) { bd = dd; best = j; }
      }
    }
    return best;
  }

  onDown(e) {
    if (!this.ready || this.reduced) return;
    var p = this.pt(e), j = this.pick(p.x, p.y);
    if (j < 0) return;
    var s = this.PK[j];
    e.preventDefault();  // a drag throws the key; it shouldn't select the page's text
    this.wake(s);
    this.grab = { p: j, k: s, tx: p.x, ty: p.y };
    try { this.canvas.setPointerCapture(e.pointerId); } catch (err) {}
    this.canvas.style.cursor = 'grabbing';
  }

  onMove(e) {
    if (!this.ready || this.reduced) return;
    var p = this.pt(e);
    if (this.grab) { this.grab.tx = p.x; this.grab.ty = p.y; return; }
    this.canvas.style.cursor = this.pick(p.x, p.y) >= 0 ? 'grab' : 'default';
  }

  onUp(e) {
    if (!this.grab) return;
    var K = KR, b = this.grab.k * K.PPK, MAXT = 34;
    for (var i = 0; i < 5; i++) {
      var j = b + i, vx = this.X[j] - this.PX[j], vy = this.Y[j] - this.PY[j], sp = Math.sqrt(vx * vx + vy * vy);
      if (sp > MAXT) { this.PX[j] = this.X[j] - vx * MAXT / sp; this.PY[j] = this.Y[j] - vy * MAXT / sp; }
    }
    this.grab = null;
    try { this.canvas.releasePointerCapture(e.pointerId); } catch (err) {}
    this.canvas.style.cursor = 'grab';
  }

  // Drops a highlighted "YOU" key with the next free number. A toy: nothing is bought.
  drop() {
    if (!this.ready) return;
    this._mine++;
    this._pulseUntil = this.fc + 260;  // the YOU ring animates for ~4 s
    this.spawn(this._sold + this._mine, true);
    if (this.reduced) { this.settle(240); this.render(); }
    return this._sold + this._mine;
  }

  shake() {
    if (!this.ready || this.reduced) return;
    var K = KR;
    for (var o = 0; o < this.order.length; o++) {
      var s = this.order[o], k = this.keys[s], b = s * K.PPK;
      this.wake(s);
      var vx = (Math.random() - 0.5) * 5, vy = -(3.5 + Math.random() * 7.5 * (this.Y[b] / K.H)), w = (Math.random() - 0.5) * 0.14;
      for (var i = 0; i < 5; i++) {
        var j = b + i, rs = K.OFF[i] - 30;
        this.PX[j] = this.X[j] - (vx - w * rs * k.dy);
        this.PY[j] = this.Y[j] - (vy + w * rs * k.dx);
      }
    }
  }
}

window.OACKeyRain = { KeyRain: KeyRain };
})();
