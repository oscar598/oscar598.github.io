// OWN A CAR · "The Shatter": the car broken into one shard per key holder.
// Ported from the design canvas artboard Physics-Shatter. Plain script, no dependencies.
// Usage: var s = new OACShatter.Shatter(canvasEl, { owners: 6000 }); s.setValue(sliderValue);
// The canvas has a fixed 1440×900 drawing space; size it with CSS (pointer math scales).
(function () {
"use strict";
var SH_W = 1440, SH_H = 900;
var SH_OX = 180, SH_OY = 290, SH_SC = 1.08;
var SH_TX = 172, SH_TY = 318, SH_TW = 1096, SH_TH = 278;
var SH_GY = SH_OY + 278 * SH_SC;
var SH_CX = SH_OX + 500 * SH_SC, SH_CY = SH_OY + 150 * SH_SC;
var SH_TOTAL_G = 1430000;
var SH_LADDER = [[1,'THE WHOLE CAR'],[3,'A GRAND PIANO'],[10,'A FRIDGE'],[34,'A BAG OF CEMENT'],[100,'A CAR TIRE'],[197,'A BOWLING BALL'],[350,'A HOUSE CAT'],[1000,'A LITER OF WATER'],[2860,'A LOAF OF BREAD'],[6000,'A PHONE'],[31000,'A GOLF BALL'],[100000,'A LUG NUT']];
var SH_ANCHORS = [1, 10, 100, 1000, 6000, 10000, 100000];

function shX(x) { return SH_OX + x * SH_SC; }
function shY(y) { return SH_OY + y * SH_SC; }
function shFmt(n) { return Math.round(n).toLocaleString('en-US'); }
function shPad(n) { var s = String(n); while (s.length < 4) s = '0' + s; return s; }
function shShare(n) {
  var g = SH_TOTAL_G / n;
  if (g >= 10000) return shFmt(g / 1000) + ' KG';
  if (g >= 1000) return (Math.round(g / 100) / 10).toFixed(1) + ' KG';
  if (g >= 10) return shFmt(g) + ' G';
  return (Math.round(g * 10) / 10).toFixed(1) + ' G';
}
function shThing(n) {
  if (n <= 1) return 'THE WHOLE CAR';
  var best = SH_LADDER[0], bd = 1e9, ln = Math.log10(n);
  for (var i = 0; i < SH_LADDER.length; i++) {
    var d = Math.abs(Math.log10(SH_LADDER[i][0]) - ln);
    if (d < bd) { bd = d; best = SH_LADDER[i]; }
  }
  return 'ABOUT ' + best[1];
}
function shOwners(v) {
  for (var i = 0; i < SH_ANCHORS.length; i++) {
    var av = Math.log10(SH_ANCHORS[i]) * 200;
    if (Math.abs(v - av) <= 5) return SH_ANCHORS[i];
  }
  var n = Math.pow(10, v / 200);
  if (n < 1000) return Math.max(1, Math.round(n));
  if (n < 10000) return Math.round(n / 10) * 10;
  return Math.round(n / 100) * 100;
}
function shRng(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shClip(v, lx, ly, nx, ny, sg) {
  var out = [], n = v.length;
  for (var i = 0; i < n; i++) {
    var a = v[i], b = v[(i + 1) % n];
    var sa = sg * ((a[0] - lx) * nx + (a[1] - ly) * ny);
    var sb = sg * ((b[0] - lx) * nx + (b[1] - ly) * ny);
    if (sa >= 0) out.push(a);
    if ((sa >= 0) !== (sb >= 0)) {
      var t = sa / (sa - sb);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out;
}
function shPoly(pts) {
  var p = new Path2D();
  for (var i = 0; i < pts.length; i++) {
    var x = shX(pts[i][0]), y = shY(pts[i][1]);
    if (i === 0) p.moveTo(x, y); else p.lineTo(x, y);
  }
  p.closePath();
  return p;
}
function shLine(pts) {
  var p = new Path2D();
  for (var i = 0; i < pts.length; i++) {
    var x = shX(pts[i][0]), y = shY(pts[i][1]);
    if (i === 0) p.moveTo(x, y); else p.lineTo(x, y);
  }
  return p;
}

var SH_FW = [190, 212], SH_RW = [790, 212], SH_WR = 66, SH_AR = 76, SH_AA = 0.12;

function shTraceBody(p) {
  var top = [[8,198],[0,184],[6,170],[62,150],[190,126],[300,118],[346,113],[456,46],[482,38],[596,34],[648,42],[770,70],[905,86],[962,92],[988,88],[994,98],[999,148],[995,196],[980,214]];
  for (var i = 0; i < top.length; i++) {
    var x = shX(top[i][0]), y = shY(top[i][1]);
    if (i === 0) p.moveTo(x, y); else p.lineTo(x, y);
  }
  var ca = Math.cos(SH_AA) * SH_AR, sa = Math.sin(SH_AA) * SH_AR;
  p.lineTo(shX(SH_RW[0] + ca), shY(SH_RW[1] + sa));
  p.arc(shX(SH_RW[0]), shY(SH_RW[1]), SH_AR * SH_SC, SH_AA, -Math.PI - SH_AA, true);
  p.lineTo(shX(SH_FW[0] + ca), shY(SH_FW[1] + sa));
  p.arc(shX(SH_FW[0]), shY(SH_FW[1]), SH_AR * SH_SC, SH_AA, -Math.PI - SH_AA, true);
  p.lineTo(shX(58), shY(216));
  p.lineTo(shX(22), shY(210));
  p.closePath();
}
function shTraceWheels(p) {
  var ws = [SH_FW, SH_RW];
  for (var i = 0; i < 2; i++) {
    p.moveTo(shX(ws[i][0] + SH_WR), shY(ws[i][1]));
    p.arc(shX(ws[i][0]), shY(ws[i][1]), SH_WR * SH_SC, 0, Math.PI * 2);
    p.closePath();
  }
}

class Shatter {
  constructor(canvas, opts) {
    this.canvas = canvas;
    this.props = { maxShards: opts && opts.maxShards, repelRadius: opts && opts.repelRadius };
    var n = (opts && opts.owners) || 6000;
    // Exact owner count until the slider moves (the slider snaps to round numbers).
    this.state = { v: Math.round(Math.log10(n) * 200), n: n };
    this._init();
    this._mount();
  }

  // The value is the slider position, 0–1000 on a log scale: owners = 10^(v/200), 1 → 100,000.
  setValue(v) { this.state = { v: Math.max(0, Math.min(1000, Math.round(v))) }; }
  setOwners(n) { this.state = { v: Math.round(Math.log10(Math.max(1, n)) * 200), n: Math.max(1, Math.round(n)) }; }

  _init() {
    if (this._h) return;
    var self = this;
    this._frame = function (now) { self._tick(now); };
    this._ptr = { x: -999, y: -999, lx: -999, ly: -999, on: false, sp: 0 };
    this._hover = -1;
    this._flash = 0;
    this._built = -1;
    this._introDone = false;
    this._h = {
      setCanvas: function (c) { self.canvas = c; },
      move: function (e) {
        if (!self.canvas) return;
        var r = self.canvas.getBoundingClientRect();
        var x = (e.clientX - r.left) * SH_W / (r.width || SH_W);
        var y = (e.clientY - r.top) * SH_H / (r.height || SH_H);
        var p = self._ptr;
        if (!p.on) { p.lx = x; p.ly = y; }
        p.x = x; p.y = y; p.on = true;
      },
      leave: function () { self._ptr.on = false; self._hover = -1; }
    };
  }

  _v() {
    var s = this.state;
    if (s && typeof s.v === 'number') return s.v;
    return Math.round(Math.log10(6000) * 200);
  }
  _N() { return this.state.n || shOwners(this._v()); }
  _cap() {
    var c = this.props ? this.props.maxShards : undefined;
    c = (c ?? 1200) | 0;
    return Math.max(1, Math.min(3000, c));
  }

  _mount() {
    var self = this;
    this.canvas.addEventListener('pointermove', this._h.move);
    this.canvas.addEventListener('pointerleave', this._h.leave);
    // Only animate while the section is on screen.
    this._visible = true;
    if ('IntersectionObserver' in window) {
      this._io = new IntersectionObserver(function (es) {
        self._visible = es[0].isIntersecting;
        if (self._visible && self._alive && !self._raf) { self._last = performance.now(); self._raf = requestAnimationFrame(self._frame); }
      }, { rootMargin: '100px' });
      this._io.observe(this.canvas);
    }
    this._alive = true;
    this._reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    this._t0 = performance.now();
    this._last = this._t0;
    this._lastBuild = 0;
    this._raf = requestAnimationFrame(this._frame);
  }

  destroy() {
    this._alive = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0;
    if (this._io) this._io.disconnect();
    this.canvas.removeEventListener('pointermove', this._h.move);
    this.canvas.removeEventListener('pointerleave', this._h.leave);
  }

  _tick(now) {
    if (!this._alive) return;
    if (!this._visible) { this._raf = 0; return; }
    this._raf = requestAnimationFrame(this._frame);
    var cv = this.canvas;
    if (!cv) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    if (dpr !== this._dpr || !this._ctx) {
      this._dpr = dpr;
      cv.width = Math.round(SH_W * dpr);
      cv.height = Math.round(SH_H * dpr);
      this._ctx = cv.getContext('2d');
      this._base = null;
      this._built = -1;
    }
    if (!this._geo) this._makeGeo();
    if (!this._base) this._makeBase();
    var N = this._N();
    var target = Math.max(1, Math.min(N, this._cap()));
    if (target !== this._built && (this._built < 0 || now - this._lastBuild > 70)) {
      this._build(target);
      this._lastBuild = now;
    }
    var f = Math.min(3, Math.max(0.2, (now - this._last) / 16.667));
    this._last = now;
    this._step(now, f);
    this._draw(now, N);
  }

  _makeGeo() {
    var body = new Path2D(); shTraceBody(body);
    var sil = new Path2D(); shTraceBody(sil); shTraceWheels(sil);
    var hc = document.createElement('canvas'); hc.width = 4; hc.height = 4;
    var hx = hc.getContext('2d');
    var xs = [], ys = [], step = 3;
    for (var y = SH_TY + 1.5; y < SH_TY + SH_TH; y += step) {
      for (var x = SH_TX + 1.5; x < SH_TX + SH_TW; x += step) {
        if (hx.isPointInPath(sil, x, y)) { xs.push(x); ys.push(y); }
      }
    }
    var all = new Array(xs.length);
    for (var i = 0; i < xs.length; i++) all[i] = i;
    this._geo = { body: body, sil: sil, hx: hx, xs: xs, ys: ys, all: all };
  }

  _makeBase() {
    var dpr = this._dpr;
    var c = document.createElement('canvas');
    c.width = Math.ceil(SH_TW * dpr); c.height = Math.ceil(SH_TH * dpr);
    var g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, -SH_TX * dpr, -SH_TY * dpr);
    this._paintCar(g);
    this._base = c;
    var t = document.createElement('canvas');
    t.width = c.width; t.height = c.height;
    this._tex = t;
    this._texCtx = t.getContext('2d');
  }

  _paintCar(g) {
    var G = this._geo, body = G.body;
    var bone = function (a) { return 'rgba(244,239,230,' + a + ')'; };
    g.save();
    g.clip(body);
    var lg = g.createLinearGradient(0, shY(34), 0, shY(222));
    lg.addColorStop(0, '#F6E3A8');
    lg.addColorStop(0.28, '#E2C274');
    lg.addColorStop(0.55, '#C9A24A');
    lg.addColorStop(0.82, '#8E6A26');
    lg.addColorStop(1, '#5A3F12');
    g.fillStyle = lg; g.fill(body);
    var hg = g.createLinearGradient(shX(0), 0, shX(1000), 0);
    hg.addColorStop(0, 'rgba(0,0,0,0.18)');
    hg.addColorStop(0.18, 'rgba(255,246,214,0.16)');
    hg.addColorStop(0.46, 'rgba(0,0,0,0.12)');
    hg.addColorStop(0.72, 'rgba(255,240,200,0.12)');
    hg.addColorStop(1, 'rgba(0,0,0,0.28)');
    g.fillStyle = hg; g.fillRect(SH_TX, SH_TY, SH_TW, SH_TH);
    var r = shRng(77);
    for (var y = SH_TY; y < SH_TY + SH_TH; y += 1.5) {
      g.fillStyle = r() < 0.5 ? 'rgba(255,248,225,' + (0.015 + r() * 0.04) + ')' : 'rgba(40,26,4,' + (0.02 + r() * 0.05) + ')';
      g.fillRect(SH_TX, y, SH_TW, 0.6);
    }
    g.fillStyle = 'rgba(255,248,222,0.20)';
    g.fill(shPoly([[6,170],[62,150],[190,126],[300,118],[346,113],[346,121],[300,126],[190,134],[64,158],[10,176]]));
    g.fillStyle = 'rgba(30,18,2,0.30)';
    g.fill(shPoly([[272,222],[268,200],[500,196],[716,192],[714,222]]));
    g.fillStyle = 'rgba(30,18,2,0.22)';
    g.fill(shPoly([[870,150],[999,150],[995,196],[980,214],[870,222]]));
    var win = shPoly([[364,111],[458,52],[482,45],[588,42],[622,50],[602,104]]);
    var wg = g.createLinearGradient(shX(380), shY(44), shX(560), shY(112));
    wg.addColorStop(0, '#2A251C'); wg.addColorStop(0.45, '#12100C'); wg.addColorStop(1, '#1C1812');
    g.fillStyle = wg; g.fill(win);
    g.fillStyle = 'rgba(244,239,230,0.07)';
    g.fill(shPoly([[410,84],[468,50],[500,48],[430,96]]));
    g.strokeStyle = bone(0.55); g.lineWidth = 0.9; g.stroke(win);
    g.fillStyle = 'rgba(20,14,4,0.55)';
    g.fill(shPoly([[634,56],[676,66],[626,100]]));
    var intake = shPoly([[648,114],[708,104],[716,176],[694,200],[658,196]]);
    g.fillStyle = '#16120C'; g.fill(intake);
    g.strokeStyle = bone(0.4); g.lineWidth = 0.8; g.stroke(intake);
    g.strokeStyle = 'rgba(244,239,230,0.12)';
    for (var k = 0; k < 5; k++) g.stroke(shLine([[660 + k * 2, 126 + k * 14], [708, 118 + k * 14]]));
    g.strokeStyle = 'rgba(40,26,4,0.75)'; g.lineWidth = 0.9;
    g.stroke(shLine([[364,113],[356,152],[364,214]]));
    g.stroke(shLine([[626,106],[642,210]]));
    g.stroke(shLine([[364,214],[642,210]]));
    g.strokeStyle = bone(0.35); g.lineWidth = 0.7;
    g.stroke(shLine([[266,150],[450,132],[646,112]]));
    g.stroke(shLine([[560,122],[586,120]]));
    g.strokeStyle = 'rgba(40,26,4,0.55)'; g.lineWidth = 0.8;
    for (var j = 0; j < 6; j++) {
      var bx = 690 + j * 34, by = 56 + j * 7.2;
      g.stroke(shLine([[bx, by + 8], [bx + 22, by + 12]]));
    }
    g.fillStyle = 'rgba(248,244,236,0.92)';
    g.fill(shPoly([[14,170],[112,150],[126,156],[30,178]]));
    g.fillStyle = 'rgba(30,20,6,0.8)';
    g.fill(shPoly([[40,170],[108,156],[112,159],[46,172]]));
    g.fillStyle = '#16120C';
    g.fill(shPoly([[16,200],[94,194],[102,212],[40,214]]));
    g.fill(shPoly([[900,206],[992,198],[980,214],[896,220]]));
    g.fillStyle = 'rgba(248,244,236,0.55)';
    g.fill(shPoly([[962,100],[994,103],[996,113],[960,109]]));
    g.fillStyle = 'rgba(20,14,4,0.6)';
    g.fill(shPoly([[436,106],[466,99],[470,109],[442,114]]));
    g.restore();

    g.strokeStyle = bone(0.9); g.lineWidth = 1.2; g.lineJoin = 'round';
    g.stroke(body);

    var ws = [SH_FW, SH_RW];
    for (var w = 0; w < 2; w++) {
      var cx = shX(ws[w][0]), cy = shY(ws[w][1]), R = SH_WR * SH_SC;
      g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2);
      g.fillStyle = '#12100D'; g.fill();
      g.strokeStyle = bone(0.5); g.lineWidth = 1; g.stroke();
      g.beginPath(); g.arc(cx, cy, R * 0.9, 0, Math.PI * 2);
      g.strokeStyle = bone(0.1); g.lineWidth = 1; g.stroke();
      var rg = g.createRadialGradient(cx - R * 0.2, cy - R * 0.25, R * 0.05, cx, cy, R * 0.72);
      rg.addColorStop(0, '#F3DC9A'); rg.addColorStop(0.5, '#C9A24A'); rg.addColorStop(1, '#6E5018');
      g.beginPath(); g.arc(cx, cy, R * 0.72, 0, Math.PI * 2);
      g.fillStyle = rg; g.fill();
      g.fillStyle = '#15110B';
      for (var s = 0; s < 5; s++) {
        var a0 = s * Math.PI * 2 / 5 + 0.3 + w * 0.5, a1 = a0 + 0.78;
        g.beginPath();
        g.arc(cx, cy, R * 0.64, a0, a1);
        g.arc(cx, cy, R * 0.2, a1 - 0.18, a0 + 0.18, true);
        g.closePath(); g.fill();
      }
      g.beginPath(); g.arc(cx, cy, R * 0.64, -2.3, -1.2);
      g.strokeStyle = 'rgba(122,90,28,0.9)'; g.lineWidth = 5; g.stroke();
      g.beginPath(); g.arc(cx, cy, R * 0.72, 0, Math.PI * 2);
      g.strokeStyle = bone(0.7); g.lineWidth = 0.9; g.stroke();
      g.beginPath(); g.arc(cx, cy, R * 0.11, 0, Math.PI * 2);
      g.fillStyle = '#7A5A1C'; g.fill();
      g.strokeStyle = bone(0.6); g.lineWidth = 0.7; g.stroke();
    }
  }

  _build(target) {
    var G = this._geo, xs = G.xs, ys = G.ys;
    var rnd = shRng(7919 + target * 31);
    var polys = [{ v: [[SH_TX, SH_TY], [SH_TX + SH_TW, SH_TY], [SH_TX + SH_TW, SH_TY + SH_TH], [SH_TX, SH_TY + SH_TH]], idx: G.all, w: 1, dead: false }];
    var count = 1, guard = 0;
    while (count < target && guard++ < target * 4) {
      var best = -1, bs = -1;
      for (var i = 0; i < polys.length; i++) {
        var q = polys[i];
        if (q.dead) continue;
        var sc = q.idx.length * q.w;
        if (sc > bs) { bs = sc; best = i; }
      }
      if (best < 0) break;
      var p = polys[best], idx = p.idx, n = idx.length;
      if (n < 2) { p.dead = true; continue; }
      var mx = 0, my = 0, k;
      for (k = 0; k < n; k++) { mx += xs[idx[k]]; my += ys[idx[k]]; }
      mx /= n; my /= n;
      var sxx = 0, syy = 0, sxy = 0;
      for (k = 0; k < n; k++) {
        var ddx = xs[idx[k]] - mx, ddy = ys[idx[k]] - my;
        sxx += ddx * ddx; syy += ddy * ddy; sxy += ddx * ddy;
      }
      sxx /= n; syy /= n; sxy /= n;
      var pa = 0.5 * Math.atan2(2 * sxy, sxx - syy);
      var ok = false;
      for (var tr = 0; tr < 6 && !ok; tr++) {
        var ang = pa + (rnd() - 0.5) * 1.25;
        var nx = Math.cos(ang), ny = Math.sin(ang);
        var sd = Math.sqrt(Math.max(1e-6, sxx * nx * nx + 2 * sxy * nx * ny + syy * ny * ny));
        var off = (rnd() - 0.5) * 0.9 * sd;
        var lx = mx + nx * off, ly = my + ny * off;
        var A = [], B = [];
        for (k = 0; k < n; k++) {
          var id = idx[k];
          if ((xs[id] - lx) * nx + (ys[id] - ly) * ny >= 0) A.push(id); else B.push(id);
        }
        if (!A.length || !B.length) continue;
        var va = shClip(p.v, lx, ly, nx, ny, 1), vb = shClip(p.v, lx, ly, nx, ny, -1);
        if (va.length < 3 || vb.length < 3) continue;
        polys[best] = { v: va, idx: A, w: 0.55 + rnd() * 0.9, dead: false };
        polys.push({ v: vb, idx: B, w: 0.55 + rnd() * 0.9, dead: false });
        count++; ok = true;
      }
      if (!ok) p.dead = true;
    }

    var list = [];
    for (var i2 = 0; i2 < polys.length; i2++) {
      var P = polys[i2];
      if (!P.idx.length) continue;
      var cx = 0, cy = 0, m = P.idx.length;
      for (var j = 0; j < m; j++) { cx += xs[P.idx[j]]; cy += ys[P.idx[j]]; }
      cx /= m; cy /= m;
      var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, fl = [];
      var path = new Path2D();
      for (var q2 = 0; q2 < P.v.length; q2++) {
        var vx = P.v[q2][0], vy = P.v[q2][1];
        fl.push(vx, vy);
        if (vx < x0) x0 = vx; if (vx > x1) x1 = vx; if (vy < y0) y0 = vy; if (vy > y1) y1 = vy;
        if (q2 === 0) path.moveTo(vx, vy); else path.lineTo(vx, vy);
      }
      path.closePath();
      var bx0 = Math.max(SH_TX, Math.floor(x0) - 1), by0 = Math.max(SH_TY, Math.floor(y0) - 1);
      var bx1 = Math.min(SH_TX + SH_TW, Math.ceil(x1) + 1), by1 = Math.min(SH_TY + SH_TH, Math.ceil(y1) + 1);
      list.push({ cx: cx, cy: cy, v: fl, path: path, bx: bx0, by: by0, bw: Math.max(1, bx1 - bx0), bh: Math.max(1, by1 - by0), hx0: x0, hy0: y0, hx1: x1, hy1: y1 });
    }
    list.sort(function (a, b) { return a.cx - b.cx; });
    var M = list.length;

    var dpr = this._dpr, tc = this._texCtx;
    tc.setTransform(1, 0, 0, 1, 0, 0);
    tc.globalCompositeOperation = 'source-over';
    tc.clearRect(0, 0, this._tex.width, this._tex.height);
    tc.drawImage(this._base, 0, 0);
    tc.setTransform(dpr, 0, 0, dpr, -SH_TX * dpr, -SH_TY * dpr);
    tc.save();
    tc.clip(G.sil);
    var fr = shRng(4242 + target);
    var avg = Math.sqrt((xs.length * 9) / Math.max(1, M));
    var cw = Math.max(0.55, Math.min(1.6, avg / 14));
    tc.lineJoin = 'round';
    for (var s = 0; s < M; s++) {
      var sh = list[s];
      var la = fr();
      tc.fillStyle = la < 0.5 ? 'rgba(255,246,220,' + (0.02 + fr() * 0.13).toFixed(3) + ')' : 'rgba(24,14,0,' + (0.03 + fr() * 0.16).toFixed(3) + ')';
      tc.fill(sh.path);
    }
    if (M > 1) {
      for (var s2 = 0; s2 < M; s2++) {
        tc.strokeStyle = 'rgba(10,8,4,0.6)'; tc.lineWidth = cw * 1.3; tc.stroke(list[s2].path);
      }
      tc.strokeStyle = 'rgba(244,239,230,0.26)'; tc.lineWidth = Math.max(0.4, cw * 0.45);
      for (var s3 = 0; s3 < M; s3++) tc.stroke(list[s3].path);
    }
    tc.restore();

    var S = {
      list: list, n: M,
      ox: new Float32Array(M), oy: new Float32Array(M), vx: new Float32Array(M), vy: new Float32Array(M),
      a: new Float32Array(M), va: new Float32Array(M),
      dx: new Float32Array(M), dy: new Float32Array(M), far: new Float32Array(M),
      ph: new Float32Array(M), rs: new Float32Array(M)
    };
    var pr = shRng(99 + target);
    for (var z = 0; z < M; z++) {
      var L = list[z];
      var ex = L.cx - SH_CX, ey = (L.cy - SH_CY) * 1.8;
      var d = Math.sqrt(ex * ex + ey * ey) + 0.001;
      S.dx[z] = ex / d; S.dy[z] = ey / d; S.far[z] = Math.min(1.3, d / 560);
      S.ph[z] = pr() * Math.PI * 2;
      S.rs[z] = (pr() - 0.5) * 2;
    }
    var prev = this._built;
    if (!this._reduced) {
      if (!this._introDone) {
        for (var u = 0; u < M; u++) {
          var mag = (140 + pr() * 360) * (0.5 + S.far[u]);
          S.ox[u] = S.dx[u] * mag + (pr() - 0.5) * 60;
          S.oy[u] = S.dy[u] * mag * 0.7 + (pr() - 0.5) * 160;
          S.a[u] = (pr() - 0.5) * 2.6;
        }
      } else if (prev > 0) {
        var shock = Math.min(9, 2 + 5 * Math.abs(Math.log10(M / prev)));
        var ix = SH_CX + (pr() - 0.5) * 520, iy = SH_CY + (pr() - 0.5) * 80;
        for (var u2 = 0; u2 < M; u2++) {
          var qx = list[u2].cx - ix, qy = list[u2].cy - iy;
          var dd = Math.sqrt(qx * qx + qy * qy) + 30;
          var mg = shock * (0.4 + 0.6 * pr()) * (0.5 + 160 / (dd + 160));
          S.vx[u2] = qx / dd * mg; S.vy[u2] = qy / dd * mg;
          S.va[u2] = (pr() - 0.5) * 0.02 * shock;
        }
        this._flash = 1;
      }
    }
    this._introDone = true;
    this._S = S;
    this._built = target;
    this._hover = -1;
  }

  _hit(i, px, py) {
    var S = this._S, L = S.list[i];
    var a = S.a[i], c = Math.cos(-a), s = Math.sin(-a);
    var x0 = px - (L.cx + S.ox[i]), y0 = py - (L.cy + S.oy[i]);
    var lx = c * x0 - s * y0 + L.cx, ly = s * x0 + c * y0 + L.cy;
    if (lx < L.hx0 || lx > L.hx1 || ly < L.hy0 || ly > L.hy1) return false;
    var v = L.v, n = v.length / 2, pos = false, neg = false;
    for (var k = 0; k < n; k++) {
      var ax = v[k * 2], ay = v[k * 2 + 1], bx = v[((k + 1) % n) * 2], by = v[((k + 1) % n) * 2 + 1];
      var cr = (bx - ax) * (ly - ay) - (by - ay) * (lx - ax);
      if (cr > 0) pos = true; else if (cr < 0) neg = true;
      if (pos && neg) return false;
    }
    return this._geo.hx.isPointInPath(this._geo.sil, lx, ly);
  }

  _step(now, f) {
    var S = this._S;
    if (!S) return;
    var M = S.n, p = this._ptr;
    var sp = 0, pvx = 0, pvy = 0;
    if (p.on) {
      pvx = p.x - p.lx; pvy = p.y - p.ly;
      sp = Math.min(60, Math.sqrt(pvx * pvx + pvy * pvy));
      p.lx = p.x; p.ly = p.y;
    }
    p.sp = p.sp * 0.6 + sp * 0.4;
    if (this._reduced) {
      for (var r = 0; r < M; r++) { S.ox[r] = 0; S.oy[r] = 0; S.a[r] = 0; }
      this._flash = 0;
    } else {
      var t = (now - this._t0) / 1000;
      var br = 0.5 - 0.5 * Math.cos(t * Math.PI * 2 / 11);
      var g = br * br * br * br * br;
      var K = 0.05, damp = Math.pow(0.86, f), dampA = Math.pow(0.84, f);
      var R = this.props ? this.props.repelRadius : undefined;
      R = Math.max(20, (R ?? 120));
      var R2 = R * R;
      var push0 = p.on ? p.sp * 0.16 * f : 0;
      var inv = sp > 0.001 ? 1 / sp : 0;
      for (var i = 0; i < M; i++) {
        var L = S.list[i];
        var wob = Math.sin(t * 0.9 + S.ph[i]) * 0.7;
        var amp = g * 24 * S.far[i] + wob + 0.5;
        var tx = S.dx[i] * amp, ty = S.dy[i] * amp, ta = S.rs[i] * g * 0.1;
        var vx = (S.vx[i] + (tx - S.ox[i]) * K * f) * damp;
        var vy = (S.vy[i] + (ty - S.oy[i]) * K * f) * damp;
        var va = (S.va[i] + (ta - S.a[i]) * K * f) * dampA;
        if (push0 > 0.01) {
          var qx = L.cx + S.ox[i] - p.x, qy = L.cy + S.oy[i] - p.y;
          var d2 = qx * qx + qy * qy;
          if (d2 < R2) {
            var d = Math.sqrt(d2) + 0.001, s = 1 - d / R, pw = s * s * push0;
            vx += (qx / d * 0.75 + pvx * inv * 0.45) * pw;
            vy += (qy / d * 0.75 + pvy * inv * 0.45) * pw;
            va += S.rs[i] * s * 0.012 * push0;
          }
        }
        S.vx[i] = vx; S.vy[i] = vy; S.va[i] = va;
        S.ox[i] += vx * f; S.oy[i] += vy * f; S.a[i] += va * f;
      }
      this._flash *= Math.pow(0.93, f);
    }
    this._hover = -1;
    if (p.on && p.sp < 6) {
      for (var h = M - 1; h >= 0; h--) {
        if (this._hit(h, p.x, p.y)) { this._hover = h; break; }
      }
    }
  }

  _xf(ctx, i, sc) {
    var S = this._S, L = S.list[i], dpr = this._dpr;
    var a = S.a[i], c = Math.cos(a) * sc, s = Math.sin(a) * sc;
    var e = L.cx + S.ox[i] - (c * L.cx - s * L.cy);
    var f = L.cy + S.oy[i] - (s * L.cx + c * L.cy);
    ctx.setTransform(c * dpr, s * dpr, -s * dpr, c * dpr, e * dpr, f * dpr);
  }

  _label(i, N) {
    var M = this._S.n, g = shShare(N);
    if (N <= M) return 'KEY Nº ' + shPad(i + 1) + ' · ' + g;
    var lo = Math.floor(i * N / M) + 1, hi = Math.floor((i + 1) * N / M);
    if (hi <= lo) return 'KEY Nº ' + shPad(lo) + ' · ' + g;
    return 'KEYS Nº ' + shPad(lo) + '–' + shPad(hi) + ' · ' + g + ' EACH';
  }

  _draw(now, N) {
    var ctx = this._ctx, cv = this.canvas, dpr = this._dpr, S = this._S;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (!S) return;
    var tex = this._tex, M = S.n, hv = this._hover, i, L;
    for (i = 0; i < M; i++) {
      if (i === hv) continue;
      L = S.list[i];
      this._xf(ctx, i, 1);
      ctx.save();
      ctx.clip(L.path);
      ctx.drawImage(tex, (L.bx - SH_TX) * dpr, (L.by - SH_TY) * dpr, L.bw * dpr, L.bh * dpr, L.bx, L.by, L.bw, L.bh);
      ctx.restore();
    }
    if (hv >= 0) {
      L = S.list[hv];
      this._xf(ctx, hv, 1.08);
      ctx.save();
      ctx.clip(L.path);
      ctx.drawImage(tex, (L.bx - SH_TX) * dpr, (L.by - SH_TY) * dpr, L.bw * dpr, L.bh * dpr, L.bx, L.by, L.bw, L.bh);
      ctx.restore();
    }

    ctx.globalCompositeOperation = 'source-atop';
    if (this._flash > 0.02) {
      ctx.strokeStyle = 'rgba(244,239,230,' + (this._flash * 0.8).toFixed(3) + ')';
      ctx.lineWidth = 1.1;
      for (i = 0; i < M; i++) { this._xf(ctx, i, 1); ctx.stroke(S.list[i].path); }
    }
    if (!this._reduced) {
      var t = (now - this._t0) / 1000;
      var ph = ((t * 0.075) % 1.9) - 0.45;
      var sx = SH_TX + ph * SH_TW;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var sg = ctx.createLinearGradient(sx - 150, SH_TY, sx + 110, SH_TY + SH_TH);
      sg.addColorStop(0, 'rgba(255,246,220,0)');
      sg.addColorStop(0.5, 'rgba(255,246,220,0.26)');
      sg.addColorStop(1, 'rgba(255,246,220,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(SH_TX - 200, SH_TY - 200, SH_TW + 400, SH_TH + 400);
    }
    if (hv >= 0) {
      L = S.list[hv];
      this._xf(ctx, hv, 1.08);
      ctx.save();
      ctx.clip(L.path);
      ctx.fillStyle = 'rgba(242,92,5,0.9)';
      ctx.fill(L.path);
      ctx.strokeStyle = 'rgba(244,239,230,0.95)';
      ctx.lineWidth = 2;
      ctx.stroke(L.path);
      ctx.restore();
    }

    ctx.globalCompositeOperation = 'destination-over';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var gl = ctx.createLinearGradient(110, 0, 1330, 0);
    gl.addColorStop(0, 'rgba(201,162,74,0)');
    gl.addColorStop(0.5, 'rgba(201,162,74,0.55)');
    gl.addColorStop(1, 'rgba(201,162,74,0)');
    ctx.fillStyle = gl;
    ctx.fillRect(110, SH_GY - 0.5, 1220, 1);

    var RH = 110;
    ctx.globalCompositeOperation = 'source-over';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 0.16;
    ctx.save();
    ctx.translate(0, 2 * SH_GY * dpr);
    ctx.scale(1, -1);
    ctx.drawImage(cv, 0, (SH_GY - RH) * dpr, cv.width, RH * dpr, 0, (SH_GY - RH) * dpr, cv.width, RH * dpr);
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var fg = ctx.createLinearGradient(0, SH_GY, 0, SH_GY + RH);
    fg.addColorStop(0, 'rgba(0,0,0,0.2)');
    fg.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = fg;
    ctx.fillRect(0, SH_GY + 0.5, SH_W, RH + 2);
    ctx.globalCompositeOperation = 'source-over';

    this._drawUI(ctx, N);
  }

  _drawUI(ctx, N) {
    var dpr = this._dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var hasLS = 'letterSpacing' in ctx;

    var ly = SH_GY + 28, lx0 = shX(0), lx1 = shX(1000);
    ctx.fillStyle = 'rgba(244,239,230,0.14)';
    ctx.fillRect(lx0, ly - 0.5, lx1 - lx0, 1);
    ctx.fillRect(lx0, ly - 4, 1, 8);
    ctx.fillRect(lx1 - 1, ly - 4, 1, 8);
    ctx.font = '400 10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#8D877C';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText('KEY Nº 0001', lx0, ly + 8);
    ctx.textAlign = 'right';
    ctx.fillText('KEY Nº ' + shPad(N), lx1, ly + 8);
    ctx.textAlign = 'center';
    ctx.fillText('NUMBERED NOSE TO TAIL', (lx0 + lx1) / 2, ly + 8);

    var hv = this._hover, p = this._ptr;
    if (hv >= 0 && p.on && this._S) {
      var label = this._label(hv, N);
      ctx.font = '500 12px "JetBrains Mono", monospace';
      if (hasLS) ctx.letterSpacing = '1.5px';
      var tw = ctx.measureText(label).width;
      var bw = tw + 38, bh = 30;
      var bx = p.x + 18, by = p.y - 46;
      if (bx + bw > SH_W - 16) bx = p.x - 18 - bw;
      if (by < 16) by = p.y + 22;
      var c = 7;
      ctx.beginPath();
      ctx.moveTo(bx + c, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + bh - c);
      ctx.lineTo(bx + bw - c, by + bh); ctx.lineTo(bx, by + bh); ctx.lineTo(bx, by + c); ctx.closePath();
      ctx.fillStyle = 'rgba(10,10,10,0.94)'; ctx.fill();
      ctx.strokeStyle = '#F25C05'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#F25C05';
      ctx.fillRect(bx + 12, by + bh / 2 - 3, 6, 6);
      ctx.fillStyle = '#F4EFE6';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(label, bx + 26, by + bh / 2 + 0.5);
    }
    if (hasLS) ctx.letterSpacing = '0px';
  }
}

window.OACShatter = { Shatter: Shatter, owners: shOwners, share: shShare, thing: shThing, pad: shPad };
})();
