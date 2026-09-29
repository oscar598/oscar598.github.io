// Cram: input → triage → timed run → results → morning recap → actual grade.

import { load, save, uid } from "./store.js";
import { readFile } from "./ingest.js";
import { buildLocal } from "./engine-local.js";
import { buildWithClaude } from "./engine-claude.js";
import { BLOCK_MS, BREAK_MS, RECAP_MS, KINDS, makePlan, planMinutes, keptTopics, buildQueue, record, requeueMiss, projected, itemState } from "./plan.js";
import { gradeTyped } from "./grade.js";
import { sound, sfx, burst, countUp, pop, haptic, unlockAudio } from "./juice.js";

// ---------- state ----------

const saved = load();
const S = {
  settings: { sound: true, engine: "local", apiKey: "", ...(saved.settings || {}) },
  draft: { text: "", hint: "", files: [], ...(saved.draft || {}) },
  view: saved.view || "home",
  deck: saved.deck || null,
  run: saved.run || null,
  history: saved.history || [],
};
const persist = () => save(S);
sound.set(S.settings.sound);

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const app = $("#app");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const mmss = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
const fmtMin = m => (m >= 60 ? `${Math.floor(m / 60)} h ${Math.round(m % 60) ? Math.round(m % 60) + " min" : ""}` : `${Math.round(m)} min`).trim();
// Triage edits S.deck; a started run owns its own copy so a new upload can't break it.
const curDeck = () => (S.view === "run" && S.run?.deck) || S.deck || S.run?.deck;
const itemById = id => curDeck().items.find(i => i.id === id);
const topicById = id => curDeck().topics.find(t => t.id === id);

let onKey = null;
let busy = null; // AbortController while building

function toast(msg, ms = 2600) {
  const t = $("#toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove("show"), ms);
}

function go(view) { S.view = view; persist(); render(); }

function render() {
  onKey = null;
  app.className = "";
  const v = S.view;
  if (v === "run" && S.run) renderRun();
  else if (v === "building") renderBuilding();
  else if (v === "triage" && S.deck) renderTriage();
  else renderHome();
  renderTop();
  window.scrollTo(0, 0);
}

// ---------- header ----------

function renderTop() {
  const mid = $("#top-mid");
  const r = S.run;
  if (S.view !== "run" || !r || !r.plan) { mid.innerHTML = ""; return; }
  const inRecap = r.phase.startsWith("recap") || r.cur?.recap;
  const idx = r.idx;
  const strip = inRecap ? "" : `<div class="strip" aria-label="Block ${idx + 1} of ${r.plan.length}">${r.plan.map((b, i) =>
    `<i class="${i < idx || (i === idx && ["summary", "break"].includes(r.phase)) ? "done" : i === idx ? "now" : ""}" title="${esc(b.label)}"></i>`).join("")}</div>`;
  const cur = r.cur;
  const label = inRecap ? "Morning recap" : `${idx + 1}/${r.plan.length} · ${esc(r.plan[idx]?.label || "")}`;
  const showTimer = r.phase === "block" || r.phase === "break";
  const silent = cur && KINDS[cur.kind]?.silent;
  mid.innerHTML = `<div class="runbar">
    <span class="label">${label}</span>${strip}
    ${r.phase === "block" && !silent ? `<span class="tally" id="tally" title="Correct this block">✓ ${cur.right}</span>` : ""}
    ${showTimer ? `<span class="timer" id="timer" role="timer" aria-live="off">--:--</span>` : ""}
    ${r.phase === "block" && !inRecap ? `<button class="icon-btn" id="pause-btn" type="button" title="Pause">❚❚<span class="sr">Pause</span></button>` : ""}
    ${!inRecap ? `<span class="badge ${r.ranked ? "ranked" : "unranked"}" title="${r.ranked ? "No pauses so far" : "This run was paused, so it's unranked"}">${r.ranked ? "Ranked" : "Unranked"}</span>` : ""}
  </div>`;
  $("#pause-btn")?.addEventListener("click", askPause);
  tick();
}

// ---------- home / input ----------

function renderHome() {
  const r = S.run;
  const d = S.draft;
  let top = "";
  if (r && !r.finished) {
    const label = r.phase.startsWith("recap") ? "Morning recap" : `Block ${r.idx + 1} of ${r.plan.length} · ${r.plan[r.idx].label}`;
    top = `<section class="card resume">
      <div><h3>Run in progress</h3><div class="muted small">${esc(r.deck.title)} · ${esc(label)}</div></div>
      <span class="spacer"></span><button class="btn go" id="resume">Resume run</button></section>`;
  } else if (r && r.finished) {
    const h = S.history.find(x => x.id === r.id);
    top = `<section class="card stack">
      <h3>${esc(r.deck.title)}</h3>
      ${!r.recapDone ? `<div class="row"><div><b>Exam morning:</b> 10-minute recap of what you missed most.</div><span class="spacer"></span>
        <button class="btn go" id="recap">Start recap</button></div>` : `<div class="muted small">✓ Morning recap done.</div>`}
      ${h && h.actual == null ? `<form class="row" id="grade-form">
        <label for="grade" style="font-weight:600">After the exam: what did you get?</label>
        <input id="grade" type="number" min="0" max="100" inputmode="decimal" placeholder="%" style="width:100px" required>
        <button class="btn primary">Save grade</button></form>` : ""}
      ${h && h.actual != null ? `<div class="row small"><span>Predicted <b>${h.prediction ?? "–"}%</b></span><span>Mock <b>${h.mock}%</b></span><span>Actual <b>${h.actual}%</b></span></div>` : ""}
    </section>`;
  }
  const files = d.files.map((f, i) => `<span class="chip ${f.error ? "err" : ""}" title="${esc(f.error || `${f.text.length.toLocaleString()} characters`)}">
      <span>${f.error ? "⚠ " : ""}${esc(f.name)}</span><button type="button" data-rm="${i}" aria-label="Remove ${esc(f.name)}">×</button></span>`).join("");
  const total = d.files.reduce((n, f) => n + (f.text?.length || 0), 0) + d.text.length;
  const engineLabel = S.settings.engine === "claude" && S.settings.apiKey ? "Claude" : "Built-in";

  app.innerHTML = `
    ${top}
    <h1>${r ? "New run" : "Cram for your exam."}</h1>
    <p class="lede">Drop in your notes. Cram builds a timed run, about 3 hours of blocks and breaks, using only your material.</p>
    <label class="drop" id="drop" tabindex="0">
      <input type="file" id="file" multiple accept=".pdf,.docx,.txt,.md,.markdown,.html,.htm,.csv,.rtf,.tex,text/*" hidden>
      <strong>Drop files here or click to upload</strong>
      <span class="muted small">PDF, Word, text or Markdown · drop anywhere on the page</span>
    </label>
    <div class="chips" id="chips">${files}</div>
    <label class="field" for="paste">Or paste text</label>
    <textarea id="paste" placeholder="Lecture notes, study guide, textbook sections…">${esc(d.text)}</textarea>
    <div class="count" id="count">${total ? total.toLocaleString() + " characters" : ""}</div>
    <label class="field" for="hint">What's on the exam? <span class="muted" style="font-weight:400">(optional)</span></label>
    <input type="text" id="hint" value="${esc(d.hint)}" placeholder="e.g. Chapters 3–5, membrane transport, no enzymes" autocomplete="off">
    <div class="start-row">
      <button class="btn go" id="start" ${total < 200 ? "disabled" : ""}>Start run</button>
      <span class="muted small">${total < 200 ? "Add at least a page of notes." : "Next: see what's kept and what's cut."}</span>
      <span class="spacer"></span>
      <button class="btn link" id="engine" type="button">Engine: ${engineLabel}</button>
      ${!total ? `<button class="btn link" id="sample" type="button">Try sample notes</button>` : ""}
    </div>
    ${historyTable()}`;

  $("#resume")?.addEventListener("click", () => { go("run"); });
  $("#recap")?.addEventListener("click", startRecapIntro);
  $("#grade-form")?.addEventListener("submit", e => {
    e.preventDefault();
    const v = Math.max(0, Math.min(100, parseFloat($("#grade").value)));
    const h = S.history.find(x => x.id === r.id);
    if (h && !isNaN(v)) { h.actual = Math.round(v); persist(); render(); toast("Saved. Thanks, this is how Cram gets better."); }
  });
  const fileInput = $("#file");
  fileInput.addEventListener("change", () => { addFiles(fileInput.files); fileInput.value = ""; });
  $("#drop").addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); } });
  $$("[data-rm]").forEach(b => b.addEventListener("click", e => { e.preventDefault(); d.files.splice(+b.dataset.rm, 1); persist(); render(); }));
  const paste = $("#paste");
  paste.addEventListener("input", () => {
    d.text = paste.value; persist();
    const t = d.files.reduce((n, f) => n + (f.text?.length || 0), 0) + d.text.length;
    $("#count").textContent = t ? t.toLocaleString() + " characters" : "";
    $("#start").disabled = t < 200;
    $(".start-row .muted").textContent = t < 200 ? "Add at least a page of notes." : "Next: see what's kept and what's cut.";
  });
  $("#hint").addEventListener("input", e => { d.hint = e.target.value; persist(); });
  $("#hint").addEventListener("keydown", e => { if (e.key === "Enter" && !$("#start").disabled) buildDeck(); });
  $("#start").addEventListener("click", buildDeck);
  $("#engine").addEventListener("click", engineDialog);
  $("#sample")?.addEventListener("click", async () => {
    const text = await fetch("sample.md").then(r => r.text());
    d.files.push({ name: "sample-biology-notes.md", text });
    d.hint ||= "Membrane transport, organelles and cellular respiration";
    persist(); render();
  });
}

function historyTable() {
  const rows = S.history.filter(h => h.mock != null).slice(-8).reverse();
  if (!rows.length) return "";
  return `<h2>Your runs</h2><table class="history"><thead><tr><th>Material</th><th>Predicted</th><th>Mock</th><th>Actual</th></tr></thead><tbody>
    ${rows.map(h => `<tr><td>${esc(h.title)}${h.ranked ? "" : ` <span class="badge unranked">unranked</span>`}</td>
      <td class="num">${h.prediction ?? "–"}${h.prediction != null ? "%" : ""}</td><td class="num">${h.mock}%</td><td class="num">${h.actual != null ? h.actual + "%" : "–"}</td></tr>`).join("")}
    </tbody></table>`;
}

async function addFiles(list) {
  for (const f of list) {
    try {
      const r = await readFile(f);
      if (r.text.trim().length < 20) throw new Error(`${f.name}: no text found.`);
      S.draft.files.push({ name: r.name, text: r.text });
    } catch (e) {
      S.draft.files.push({ name: f.name, text: "", error: e.message });
      toast(e.message, 4000);
    }
  }
  persist();
  if (S.view === "home") render();
}

// Drop anywhere.
let dragDepth = 0;
addEventListener("dragenter", e => { if (S.view !== "home" || !e.dataTransfer?.types?.includes("Files")) return; dragDepth++; $("#drop-veil").classList.add("on"); });
addEventListener("dragleave", () => { if (--dragDepth <= 0) { dragDepth = 0; $("#drop-veil").classList.remove("on"); } });
addEventListener("dragover", e => { if (S.view === "home") e.preventDefault(); });
addEventListener("drop", e => {
  if (S.view !== "home") return;
  e.preventDefault(); dragDepth = 0; $("#drop-veil").classList.remove("on");
  if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
});

// ---------- engine settings ----------

function modal(html, bind) {
  const back = document.createElement("div");
  back.className = "modal-back";
  back.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(back);
  const prevKey = onKey;
  const close = () => { back.remove(); onKey = prevKey; };
  onKey = e => { if (e.key === "Escape") close(); };
  back.addEventListener("click", e => { if (e.target === back) close(); });
  bind(back, close);
  $("input,button", back)?.focus();
  return close;
}

function engineDialog() {
  const st = S.settings;
  modal(`<h2>Question engine</h2>
    <label class="radio"><input type="radio" name="eng" value="local" ${st.engine !== "claude" ? "checked" : ""}>
      <span><b>Built-in</b><br><span class="small muted">Works offline, nothing leaves your device. Pulls questions straight from your text (definitions, fill-in-the-blank).</span></span></label>
    <label class="radio"><input type="radio" name="eng" value="claude" ${st.engine === "claude" ? "checked" : ""}>
      <span><b>Claude</b><br><span class="small muted">Better questions and topic maps. Uses your own Anthropic API key, stored only in this browser and sent only to api.anthropic.com.</span></span></label>
    <label class="field" for="key">Anthropic API key</label>
    <input type="password" id="key" value="${esc(st.apiKey)}" placeholder="sk-ant-…" autocomplete="off" spellcheck="false">
    <div class="row" style="margin-top:18px"><button class="btn link" id="forget" type="button">Forget key</button><span class="spacer"></span>
      <button class="btn" id="cancel" type="button">Cancel</button><button class="btn primary" id="ok" type="button">Save</button></div>`,
  (root, close) => {
    $("#cancel", root).onclick = close;
    $("#forget", root).onclick = () => { $("#key", root).value = ""; };
    $("#ok", root).onclick = () => {
      st.engine = $("input[name=eng]:checked", root).value;
      st.apiKey = $("#key", root).value.trim();
      if (st.engine === "claude" && !st.apiKey) { toast("Add a key to use Claude, or pick Built-in."); return; }
      persist(); close(); render();
    };
  });
}

// ---------- building ----------

let buildState = { stage: "Reading your material…", questions: 0, error: null };

function renderBuilding() {
  const b = buildState;
  if (b.error) {
    app.innerHTML = `<div class="building"><h1>That didn't work</h1><p class="notice err">${esc(b.error)}</p>
      <div class="row" style="justify-content:center;margin-top:18px">
        <button class="btn" id="back">Back</button>
        ${S.settings.engine === "claude" ? `<button class="btn primary" id="local">Use built-in engine</button>` : ""}
        <button class="btn go" id="retry">Try again</button></div></div>`;
    $("#back").onclick = () => go("home");
    $("#retry").onclick = buildDeck;
    $("#local")?.addEventListener("click", () => buildDeck({ forceLocal: true }));
    return;
  }
  app.innerHTML = `<div class="building" aria-live="polite"><div class="spinner" aria-hidden="true"></div>
    <h1 id="b-stage">${esc(b.stage)}</h1>
    <p class="lede" id="b-sub">${b.questions ? `<span class="big-num">${b.questions}</span><br>questions written` : "Building the topic map from your notes only."}</p>
    <button class="btn link" id="cancel">Cancel</button></div>`;
  $("#cancel").onclick = () => { busy?.abort(); busy = null; go("home"); };
}

async function buildDeck({ forceLocal = false } = {}) {
  unlockAudio();
  const d = S.draft;
  const parts = d.files.filter(f => !f.error && f.text).map(f => (d.files.length > 1 ? `# ${f.name.replace(/\.[^.]+$/, "")}\n` : "") + f.text);
  if (d.text.trim()) parts.push(d.text);
  const text = parts.join("\n\n");
  if (text.trim().length < 200) { toast("Add more material first."); return; }
  const useClaude = !forceLocal && S.settings.engine === "claude" && S.settings.apiKey;
  buildState = { stage: useClaude ? "Claude is reading your material…" : "Reading your material…", questions: 0, error: null };
  S.view = "building"; render();
  try {
    let deck;
    if (useClaude) {
      busy = new AbortController();
      deck = await buildWithClaude({ text, hint: d.hint, apiKey: S.settings.apiKey, signal: busy.signal, onProgress: p => {
        if (S.view !== "building") return;
        if (p.questions && p.questions !== buildState.questions) {
          buildState.questions = p.questions; buildState.stage = "Writing questions…";
          const st = $("#b-stage"), sub = $("#b-sub");
          if (st) st.textContent = buildState.stage;
          if (sub) sub.innerHTML = `<span class="big-num">${p.questions}</span><br>questions written`;
        }
      } });
      busy = null;
    } else {
      await new Promise(r => setTimeout(r, 30));
      deck = buildLocal(text, d.hint);
    }
    if (S.view !== "building") return; // cancelled
    S.deck = deck;
    go("triage");
  } catch (e) {
    busy = null;
    if (S.view !== "building") return;
    buildState.error = e.message || String(e);
    render();
  }
}

// ---------- triage ----------

function renderTriage() {
  const deck = S.deck;
  const plan = makePlan(deck);
  const kept = keptTopics(deck);
  const cut = deck.topics.filter(t => !t.kept);
  const prio = p => `<span class="prio" aria-label="Priority ${p} of 5">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= p ? "on" : ""}"></i>`).join("")}</span>`;
  const row = t => `<div class="topic ${t.kept ? "" : "cut"}">${prio(t.priority)}
      <span class="t-title">${esc(t.title)} <span class="muted small">· ${deck.items.filter(i => i.topicId === t.id).length} q</span></span>
      ${t.kept ? `<button class="btn link" data-cut="${esc(t.id)}">Cut</button>` : (deck.items.filter(i => i.topicId === t.id).length >= 2 ? `<button class="btn" data-keep="${esc(t.id)}">Keep</button>` : "<span></span>")}
      <span class="t-why">${esc(t.reason || "")}</span></div>`;
  const mins = plan ? planMinutes(plan) : 0;
  const nQ = deck.items.filter(i => kept.some(t => t.id === i.topicId)).length;

  app.innerHTML = `
    <p class="muted small" style="margin:0">Triage · ${deck.engine === "claude" ? "built by Claude" : "built-in engine"}</p>
    <h1>${esc(deck.title)}</h1>
    <div class="stats">
      <div class="stat"><b>${kept.length}</b><span>topics kept</span></div>
      <div class="stat"><b>${cut.length}</b><span>topics cut</span></div>
      <div class="stat"><b>${nQ}</b><span>questions</span></div>
      <div class="stat"><b>${plan ? fmtMin(mins) : "–"}</b><span>${plan ? plan.length + " blocks" : "no run"}</span></div>
    </div>
    ${!plan ? `<p class="notice err">Not enough material to build a run. Cram only uses what's in your notes, so add more pages or keep more topics.</p>`
      : plan.length < 8 ? `<p class="notice warn">Your material supports ${plan.length} blocks, not 8. Thin material means a shorter run. Cram never pads it with made-up content.</p>` : ""}
    <h2>Kept <span class="muted small">highest priority first</span></h2>
    <div class="card">${kept.map(row).join("") || `<p class="muted">Nothing kept yet.</p>`}</div>
    ${cut.length ? `<h2>Cut</h2><div class="card">${cut.map(row).join("")}</div>` : ""}
    ${plan ? `<h2>The run</h2>
    <ol class="planline">${plan.map((b, i) => `<li class="${KINDS[b.kind].silent ? "silent" : ""}">${i + 1}. ${esc(b.label)}</li>`).join("")}</ol>
    <p class="muted small">20-minute blocks lock when time's up. 5-minute breaks are enforced. Dashed blocks give no feedback until the end. Pausing makes the run unranked.</p>` : ""}
    <div class="start-row"><button class="btn go" id="begin" ${plan ? "" : "disabled"}>Start run</button>
      <button class="btn link" id="back">Back to material</button></div>`;

  $$("[data-keep]").forEach(b => b.onclick = () => { const t = topicById(b.dataset.keep); t.kept = true; t.reason = "You kept this"; persist(); renderTriage(); });
  $$("[data-cut]").forEach(b => b.onclick = () => { const t = topicById(b.dataset.cut); t.kept = false; t.reason = "You cut this"; persist(); renderTriage(); });
  $("#back").onclick = () => go("home");
  $("#begin").onclick = () => startRun(plan);
  onKey = e => { if (e.key === "Enter" && plan) startRun(plan); };
}

function startRun(plan) {
  unlockAudio();
  if (S.run && !S.run.finished && !confirm("You have a run in progress. Start a new one and drop it?")) return;
  S.run = { id: uid(), deck: S.deck, plan, idx: 0, phase: "intro", ranked: true, items: {}, mastery: {}, log: [], results: [],
    prediction: null, startedAt: Date.now(), lastSeen: Date.now(), finished: false, recapDone: false };
  // The deck holds everything the run needs; drop raw file text so saves stay small.
  S.draft = { text: "", hint: S.draft.hint, files: [] };
  S.deck = null;
  go("run");
}

// ---------- run ----------

function renderRun() {
  const r = S.run;
  switch (r.phase) {
    case "intro": return renderIntro();
    case "recap-intro": return renderIntro(true);
    case "block": return renderEntry();
    case "pencils": return renderPencils();
    case "summary": return renderSummary();
    case "break": return renderBreak();
    case "predict": return renderPredict();
    case "results": return renderResults();
    case "recap-summary": return renderRecapSummary();
    default: S.view = "home"; return renderHome();
  }
}

function renderIntro(recap = false) {
  const r = S.run;
  const b = recap ? { kind: "recap", label: "Morning recap" } : r.plan[r.idx];
  const k = KINDS[b.kind];
  app.innerHTML = `<div class="center" style="padding-top:8vh">
    <p class="muted">${recap ? "Exam day" : `Block ${r.idx + 1} of ${r.plan.length}`}</p>
    <h1>${esc(b.label)}</h1>
    <p class="lede">${esc(k.blurb)}</p>
    <p class="timer" style="display:inline-block;font-size:28px">${mmss(recap ? RECAP_MS : BLOCK_MS)}</p>
    ${k.silent ? `<p><span class="badge">No feedback until the end</span></p>` : ""}
    <div style="margin-top:22px"><button class="btn go" id="go">Start <kbd>↵</kbd></button></div>
    ${!recap && r.idx === 0 ? `<p class="muted small" style="margin-top:22px">Keys: <kbd>1</kbd>–<kbd>4</kbd> or <kbd>A</kbd>–<kbd>D</kbd> to pick, <kbd>↵</kbd> to submit and continue, <kbd>M</kbd> for sound.</p>` : ""}
  </div>`;
  $("#go").onclick = startBlock;
  onKey = e => { if (e.key === "Enter") startBlock(); };
}

function startBlock() {
  unlockAudio();
  const r = S.run;
  const recap = r.phase === "recap-intro";
  const block = recap ? { kind: "recap", label: "Morning recap" } : r.plan[r.idx];
  const queue = buildQueue(S.run.deck, r, block, r.idx);
  r.cur = { kind: block.kind, label: block.label, queue, pos: 0, right: 0, total: 0, requeued: {}, perTopic: {}, recovered: 0,
    startProj: projected(S.run.deck, r), recap, endsAt: Date.now() + (recap ? RECAP_MS : BLOCK_MS), remaining: null, fb: null };
  r.phase = "block";
  r.lastSeen = Date.now();
  sfx.start();
  persist(); render();
}

function renderEntry() {
  const r = S.run, cur = r.cur;
  if (r.paused) return renderPaused();
  const entry = cur.queue[cur.pos];
  if (!entry) return finishBlock(true);
  if (entry.type === "card") return renderCard(entry);
  const item = itemById(entry.id);
  if (!item) { cur.pos++; return renderEntry(); }
  const silent = KINDS[cur.kind].silent;
  const fb = cur.fb;
  const topic = topicById(item.topicId);
  const typed = entry.mode === "typed";
  const n = cur.queue.filter(e => e.type === "q").length;
  const done = cur.queue.slice(0, cur.pos).filter(e => e.type === "q").length;

  let body;
  if (typed) {
    body = `<div class="typed ${fb ? (fb.correct ? "right" : "wrong") : ""}">
      <input type="text" id="typed" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type your answer" value="${esc(fb?.input || "")}" ${fb ? "disabled" : ""} aria-label="Your answer">
    </div>`;
  } else {
    body = `<div class="choices" role="radiogroup">${item.choices.map((c, i) => {
      let cls = "", mark = "";
      if (fb && !silent) {
        if (i === item.answer) { cls = "right"; mark = "✓ Correct"; }
        else if (i === fb.sel) { cls = "wrong"; mark = "✗ Your answer"; }
      } else if (cur.sel === i) cls = "sel";
      return `<button class="choice ${cls}" data-i="${i}" role="radio" aria-checked="${cur.sel === i}" ${fb ? "disabled" : ""}>
        <span class="letter">${"ABCD"[i]}</span><span>${esc(c)}</span><span class="mark">${mark}</span></button>`;
    }).join("")}</div>`;
  }

  let feedback = "";
  if (fb && !silent) {
    const sourceLine = item.source ? `<p class="source">From your notes: “${esc(item.source)}”</p>` : "";
    if (fb.correct) {
      feedback = `<div class="feedback good">${fb.recovered ? `<div class="recovered">↺ Recovered. You missed this one earlier.</div>` : `<div class="verdict">✓ Correct</div>`}
        ${typed && fb.how !== "exact" ? `<div class="small muted">Accepted (${esc(fb.how)}): <b>${esc(item.answerText)}</b></div>` : ""}</div>`;
    } else {
      feedback = `<div class="feedback bad"><div class="verdict">✗ Not quite. Answer: ${esc(item.answerText)}</div>
        ${item.why ? `<div style="margin-top:6px">${esc(item.why)}</div>` : ""}${sourceLine}
        ${typed && fb.input ? `<button class="btn link" id="override" type="button">I was right, count it</button>` : ""}
        <div class="small muted" style="margin-top:6px">This one comes back later.</div></div>`;
    }
  }

  app.innerHTML = `
    <div class="q-meta"><span>${esc(topic?.title || "")}</span><span>·</span><span>${Math.min(done + 1, n)} of ${n}</span>
      ${entry.comeback ? `<span class="comeback">↺ Comeback</span>` : ""}${typed ? `<span class="badge">Typed</span>` : ""}</div>
    <p class="stem">${esc(typed && item.typedStem ? item.typedStem : item.stem)}</p>
    ${body}
    ${feedback}
    <div class="actions">
      ${fb ? `<button class="btn primary" id="next">Next <kbd>↵</kbd></button>`
        : typed ? `<button class="btn primary" id="submit">Submit <kbd>↵</kbd></button><button class="btn link" id="idk">I don't know</button>`
        : `<button class="btn primary" id="submit" ${cur.sel == null ? "disabled" : ""}>Submit <kbd>↵</kbd></button>`}
      <span class="hint-keys">${typed ? "" : "1–4 or A–D to pick"}</span>
    </div>`;

  const submit = () => {
    if (cur.fb) return;
    if (typed) {
      const v = $("#typed").value;
      if (!v.trim()) { $("#typed").classList.add("shake"); setTimeout(() => $("#typed")?.classList.remove("shake"), 300); return; }
      answer(entry, item, { input: v });
    } else if (cur.sel != null) answer(entry, item, { sel: cur.sel });
  };
  $$(".choice").forEach(b => b.onclick = () => { if (cur.fb) return; select(+b.dataset.i); });
  $("#submit")?.addEventListener("click", submit);
  $("#idk")?.addEventListener("click", () => answer(entry, item, { input: "" }));
  $("#next")?.addEventListener("click", next);
  $("#override")?.addEventListener("click", () => overrideTyped(entry, item));
  if (typed && !fb) {
    const inp = $("#typed");
    inp.focus();
    inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); submit(); } });
  } else if (fb) $("#next").focus({ preventScroll: true });

  onKey = e => {
    if (cur.fb) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); next(); } return; }
    if (typed) return;
    const k = e.key.toLowerCase();
    const i = "1234".indexOf(k) >= 0 ? "1234".indexOf(k) : "abcd".indexOf(k);
    if (i >= 0 && i < item.choices.length) { select(i); return; }
    if (e.key === "Enter") { e.preventDefault(); submit(); }
  };
}

function select(i) {
  const cur = S.run.cur;
  cur.sel = i;
  sfx.select();
  $$(".choice").forEach((b, j) => { b.classList.toggle("sel", j === i); b.setAttribute("aria-checked", j === i); });
  const s = $("#submit"); if (s) s.disabled = false;
}

function answer(entry, item, { sel = null, input = null }) {
  const r = S.run, cur = r.cur;
  if (cur.fb) return;
  const typed = entry.mode === "typed";
  const g = typed ? gradeTyped(input, item) : { ok: sel === item.answer, how: "choice" };
  const before = { st: { ...itemState(r, item.id) }, mastery: r.mastery[item.topicId], logLen: r.log.length };
  const { recovered } = record(S.run.deck, r, item, entry.mode, g.ok, cur.kind);
  cur.total++; if (g.ok) cur.right++;
  const pt = (cur.perTopic[item.topicId] ||= [0, 0]); pt[1]++; if (g.ok) pt[0]++;
  if (recovered) cur.recovered++;
  const silent = KINDS[cur.kind].silent;
  if (!g.ok && !silent) requeueMiss(cur, entry);
  cur.sel = null;
  if (silent) { cur.pos++; persist(); renderEntry(); return; }

  cur.fb = { sel, input, correct: g.ok, how: g.how, recovered, before };
  persist();
  renderEntry();
  // Juice.
  if (g.ok) {
    const target = typed ? $("#typed") : $(`.choice[data-i="${item.answer}"]`);
    if (recovered) { sfx.recovered(); burst(target, { big: true }); haptic([15, 40, 25]); }
    else { sfx.ding(); burst(target); haptic(12); }
    const tally = $("#tally"); if (tally) { tally.textContent = `✓ ${cur.right}`; pop(tally); }
  } else {
    sfx.miss();
  }
}

function overrideTyped(entry, item) {
  const r = S.run, cur = r.cur, fb = cur.fb;
  if (!fb || fb.correct) return;
  // Undo the miss, then record it as correct.
  r.items[item.id] = { ...fb.before.st };
  if (fb.before.mastery === undefined) delete r.mastery[item.topicId]; else r.mastery[item.topicId] = fb.before.mastery;
  r.log.length = fb.before.logLen;
  cur.total--;
  cur.perTopic[item.topicId][1]--;
  const idx = cur.queue.findIndex((e, i) => i > cur.pos && e.id === entry.id && e.comeback);
  if (idx > 0) { cur.queue.splice(idx, 1); cur.requeued[entry.id]--; }
  const { recovered } = record(S.run.deck, r, item, entry.mode, true, cur.kind);
  cur.total++; cur.right++; cur.perTopic[item.topicId][0]++; cur.perTopic[item.topicId][1]++;
  if (recovered) cur.recovered++;
  cur.fb = { ...fb, correct: true, how: "you marked it right", recovered };
  persist(); renderEntry();
  sfx.ding(); burst($("#typed"));
  const tally = $("#tally"); if (tally) { tally.textContent = `✓ ${cur.right}`; pop(tally); }
}

function next() {
  const cur = S.run.cur;
  cur.fb = null; cur.sel = null; cur.pos++;
  persist(); renderEntry();
}

function renderCard(entry) {
  const t = topicById(entry.topicId);
  const cur = S.run.cur;
  app.innerHTML = `<div class="q-meta"><span>Study card</span></div>
    <article class="card study">
      <h2 style="margin-top:0">${esc(t.title)}</h2>
      <p class="summary">${esc(t.summary || "")}</p>
      ${t.keyTerms?.length ? `<ul class="terms">${t.keyTerms.map(k => `<li><b>${esc(k.term)}</b>: ${esc(k.def)}</li>`).join("")}</ul>` : ""}
      ${t.quote ? `<p class="source">“${esc(t.quote)}”</p>` : ""}
    </article>
    <div class="actions"><button class="btn primary" id="got">Got it <kbd>↵</kbd></button></div>`;
  const got = () => { cur.pos++; persist(); renderEntry(); };
  $("#got").onclick = got;
  $("#got").focus({ preventScroll: true });
  onKey = e => { if (e.key === "Enter") { e.preventDefault(); got(); } };
}

// ---------- pause (makes the run unranked) ----------

function askPause() {
  const r = S.run;
  if (r.phase !== "block" || r.paused) return;
  modal(`<h2>Pause the run?</h2><p>Pausing makes this run <b>unranked</b>. Your practice still counts, but the score won't be a clean exam simulation.</p>
    <div class="row" style="margin-top:16px"><span class="spacer"></span><button class="btn primary" id="keep">Keep going</button><button class="btn" id="p">Pause</button></div>`,
  (root, close) => {
    $("#keep", root).onclick = close;
    $("#p", root).onclick = () => {
      close();
      r.paused = true; r.ranked = false;
      r.cur.remaining = r.cur.endsAt - Date.now(); r.cur.endsAt = null;
      persist(); render();
    };
  });
}

function renderPaused() {
  const r = S.run;
  app.innerHTML = `<div class="center" style="padding-top:12vh"><h1>Paused</h1><p class="lede">${mmss(r.cur.remaining)} left in this block. This run is now unranked.</p>
    <button class="btn go" id="resume">Resume <kbd>↵</kbd></button></div>`;
  const resume = () => { r.paused = false; r.cur.endsAt = Date.now() + r.cur.remaining; r.cur.remaining = null; persist(); render(); };
  $("#resume").onclick = resume;
  onKey = e => { if (e.key === "Enter") resume(); };
}

// ---------- block end ----------

function finishBlock(early = false) {
  const r = S.run, cur = r.cur;
  if (r.phase !== "block") return;
  cur.endedEarly = early;
  cur.endProj = projected(S.run.deck, r);
  if (!cur.recap) r.results[r.idx] = { kind: cur.kind, label: cur.label, right: cur.right, total: cur.total, perTopic: cur.perTopic, proj: cur.endProj, early };
  cur.endsAt = null;
  if (early) {
    r.phase = cur.recap ? "recap-summary" : r.idx === r.plan.length - 1 ? "results" : "summary";
    if (r.phase === "results") writeHistory();
    persist(); render();
  } else {
    r.phase = "pencils";
    persist(); render();
  }
}

const PENCILS_MS = 2400;

function renderPencils() {
  const r = S.run;
  app.innerHTML = `<div class="full" role="alert"><div><h1>Time.<br>Pencils down.</h1></div></div>`;
  sfx.pencils(); haptic([60, 80, 60]);
  onKey = () => {};
  r.pencilsAt ||= Date.now();
  setTimeout(leavePencils, PENCILS_MS);
}

function leavePencils() {
  const r = S.run;
  if (!r || r.phase !== "pencils") return;
  r.pencilsAt = null;
  r.phase = r.cur.recap ? "recap-summary" : r.idx === r.plan.length - 1 ? "results" : "summary";
  if (r.phase === "results") writeHistory();
  persist(); render();
}

function weakest(perTopic, n = 3) {
  return Object.entries(perTopic).map(([id, [a, b]]) => ({ id, p: pct(a, b), b })).filter(x => x.b)
    .sort((x, y) => x.p - y.p).slice(0, n).map(x => ({ ...x, title: topicById(x.id)?.title }));
}

function renderSummary() {
  const r = S.run, cur = r.cur;
  const res = r.results[r.idx];
  const silent = KINDS[cur.kind].silent;
  const nextBlock = r.plan[r.idx + 1];
  const delta = cur.endProj - cur.startProj;
  const weak = weakest(cur.perTopic);
  app.innerHTML = `<div class="center">
    <p class="muted">Block ${r.idx + 1} of ${r.plan.length} · ${esc(res.label)}</p>
    ${res.early ? `<p class="notice">Finished early. That's all your material had for this block.</p>` : ""}
    <p class="score-ring"><span id="sc">0</span><span class="muted" style="font-size:36px"> / ${res.total}</span></p>
    <p class="muted">${res.total ? `${pct(res.right, res.total)}% correct` : "No questions answered"}${cur.recovered ? ` · ${cur.recovered} recovered ↺` : ""}</p>
    <div class="card" style="max-width:420px;margin:20px auto">
      <div class="muted small">Projected exam score</div>
      <div class="score-ring" style="font-size:56px"><span id="proj">${cur.startProj}</span>%</div>
      <div class="delta ${delta > 0 ? "up" : delta < 0 ? "down" : ""}">${delta > 0 ? "▲ +" + delta : delta < 0 ? "▼ " + delta : "±0"}</div>
    </div>
    ${silent && weak.length ? `<div class="card" style="max-width:520px;margin:0 auto 20px;text-align:left"><h3>Where to spend your time</h3>
      <div class="bars">${weak.map(w => bar(w.title, w.p)).join("")}</div></div>` : ""}
    <button class="btn go" id="brk">Start 5-minute break <kbd>↵</kbd></button>
    <p class="muted small" style="margin-top:14px">Up next: ${esc(nextBlock.label)}</p>
  </div>`;
  countUp($("#sc"), 0, res.right, { ms: 700 });
  setTimeout(() => countUp($("#proj"), cur.startProj, cur.endProj, { ms: 1100 }), 500);
  if (!silent && res.right) setTimeout(() => { sfx.ding(); burst($("#proj"), { count: 14 }); }, 1600);
  const startBreak = () => { r.phase = "break"; r.breakEnds = Date.now() + BREAK_MS; persist(); render(); };
  $("#brk").onclick = startBreak;
  onKey = e => { if (e.key === "Enter") startBreak(); };
}

const bar = (title, p) => `<div class="bar"><span>${esc(title)}</span><span class="track"><span class="fill ${p < 60 ? "weak" : ""}" style="width:${p}%;display:block"></span></span><b>${p}%</b></div>`;

function renderBreak() {
  const r = S.run;
  const nb = r.plan[r.idx + 1];
  const tips = ["Stand up and move.", "Drink some water.", "Look at something far away.", "Stay off your phone."];
  app.innerHTML = `<div class="center">
    <p class="muted">Break</p>
    <div class="breakclock" id="bclock">${mmss(r.breakEnds - Date.now())}</div>
    <ul class="tips">${tips.map(t => `<li>${t}</li>`).join("")}</ul>
    <p>Up next: <b>Block ${r.idx + 2} · ${esc(nb.label)}</b><br><span class="muted small">${esc(KINDS[nb.kind].blurb)}</span></p>
    <button class="btn go" id="nextblock" disabled>Break in progress</button>
  </div>`;
  $("#nextblock").onclick = endBreak;
  onKey = e => { if (e.key === "Enter" && !$("#nextblock").disabled) endBreak(); };
  tick();
}

function endBreak() {
  const r = S.run;
  if (Date.now() < r.breakEnds) return;
  r.idx++;
  r.breakEnds = null;
  if (r.plan[r.idx].kind === "final" && r.prediction == null) { r.phase = "predict"; persist(); render(); return; }
  r.phase = "intro";
  startBlock();
}

function renderPredict() {
  const r = S.run;
  const guess = projected(S.run.deck, r);
  app.innerHTML = `<div class="center" style="padding-top:6vh">
    <p class="muted">Before the final mock</p>
    <h1>What will you score on the real exam?</h1>
    <p class="lede">Lock in a guess. After the exam, you'll enter the real grade.</p>
    <p class="score-ring"><span id="pv">${guess}</span>%</p>
    <input type="range" class="slider" id="pred" min="0" max="100" value="${guess}" aria-label="Predicted score" style="max-width:420px">
    <div style="margin-top:22px"><button class="btn go" id="lock">Lock it in and start the final <kbd>↵</kbd></button></div>
  </div>`;
  const s = $("#pred");
  s.oninput = () => { $("#pv").textContent = s.value; };
  s.focus();
  const lock = () => { r.prediction = +s.value; r.phase = "intro"; persist(); startBlock(); };
  $("#lock").onclick = lock;
  onKey = e => { if (e.key === "Enter") lock(); };
}

function writeHistory() {
  const r = S.run;
  const fin = r.results[r.plan.length - 1];
  const mock = fin ? pct(fin.right, fin.total) : null;
  let h = S.history.find(x => x.id === r.id);
  if (!h) { h = { id: r.id, title: S.run.deck.title, at: Date.now() }; S.history.push(h); }
  Object.assign(h, { prediction: r.prediction, mock, ranked: r.ranked, actual: h.actual ?? null });
}

function renderResults() {
  const r = S.run;
  const fin = r.results[r.plan.length - 1] || { right: 0, total: 0, perTopic: {} };
  const mock = pct(fin.right, fin.total);
  const allRecovered = r.log.filter((l, i) => l.c && r.log.slice(0, i).some(p => p.id === l.id && !p.c)).length;
  const kept = keptTopics(S.run.deck);
  const topicRows = kept.map(t => { const [a, b] = fin.perTopic[t.id] || [0, 0]; return b ? bar(t.title, pct(a, b)) : ""; }).join("");
  const defaultExam = r.examAt ? new Date(r.examAt) : (() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d; })();
  const local = new Date(defaultExam.getTime() - defaultExam.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  app.innerHTML = `<div class="center">
    <p class="muted">Final mock exam <span class="badge ${r.ranked ? "ranked" : "unranked"}">${r.ranked ? "Ranked" : "Unranked"}</span></p>
    <p class="score-ring" style="font-size:88px"><span id="mock">0</span>%</p>
    <p class="lede">${fin.right} of ${fin.total} on questions you'd never seen.${r.prediction != null ? ` You predicted <b>${r.prediction}%</b> for the real exam.` : ""}</p>
  </div>
  <div class="card stack"><h3>By topic</h3><div class="bars">${topicRows || `<p class="muted">No final questions answered.</p>`}</div>
    <p class="muted small">${r.log.length} answers this run · ${allRecovered} missed items recovered.</p></div>
  <div class="card stack" style="margin-top:16px">
    <h3>Exam morning: 10-minute recap</h3>
    <p class="muted small" style="margin:0">Cram saves what you missed most. Open Cram on exam morning, or add a reminder.</p>
    <label class="field" for="examAt" style="margin-top:4px">When's the exam?</label>
    <input type="datetime-local" id="examAt" value="${local}">
    <div class="row"><button class="btn" id="ics">Add recap to calendar</button></div>
  </div>
  <div class="start-row" style="justify-content:center"><button class="btn go" id="done">Done <kbd>↵</kbd></button></div>`;
  countUp($("#mock"), 0, mock, { ms: 1200 });
  $("#examAt").onchange = e => { r.examAt = new Date(e.target.value).getTime(); persist(); };
  $("#ics").onclick = () => { r.examAt = new Date($("#examAt").value).getTime(); persist(); downloadIcs(r.examAt); };
  const done = () => { r.finished = true; r.phase = "done"; persist(); go("home"); };
  $("#done").onclick = done;
  onKey = e => { if (e.key === "Enter" && document.activeElement?.id !== "examAt") done(); };
}

function downloadIcs(examAt) {
  if (!examAt || isNaN(examAt)) { toast("Pick the exam date and time first."); return; }
  const exam = new Date(examAt);
  let at = new Date(examAt - 60 * 60000);
  if (at.getHours() >= 10) { at = new Date(exam); at.setHours(8, 0, 0, 0); }
  if (at >= exam) at = new Date(examAt - 20 * 60000);
  const f = d => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const url = location.origin + location.pathname + "?recap";
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Cram//EN", "BEGIN:VEVENT", `UID:${uid()}@cram`, `DTSTAMP:${f(new Date())}`,
    `DTSTART:${f(at)}`, `DTEND:${f(new Date(at.getTime() + 10 * 60000))}`, "SUMMARY:Cram: 10-minute exam recap",
    `DESCRIPTION:Open ${url} and run your recap. Exam at ${exam.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.`, `URL:${url}`,
    "BEGIN:VALARM", "TRIGGER:PT0M", "ACTION:DISPLAY", "DESCRIPTION:Cram recap", "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  a.download = "cram-recap.ics";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast(`Recap reminder set for ${at.toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })}.`);
}

function startRecapIntro() {
  unlockAudio();
  S.run.phase = "recap-intro";
  S.run.finished = false;
  go("run");
}

function renderRecapSummary() {
  const r = S.run, cur = r.cur;
  app.innerHTML = `<div class="center" style="padding-top:8vh">
    <p class="muted">Morning recap</p>
    <p class="score-ring"><span id="sc">0</span><span class="muted" style="font-size:36px"> / ${cur.total}</span></p>
    <h1>You're ready. Go get it.</h1>
    <p class="lede">After the exam, come back and enter your grade.</p>
    <button class="btn go" id="done">Done <kbd>↵</kbd></button></div>`;
  countUp($("#sc"), 0, cur.right, { ms: 700 });
  if (cur.right) setTimeout(() => { sfx.recovered(); burst($("#sc"), { big: true }); }, 700);
  const done = () => { r.recapDone = true; r.finished = true; r.phase = "done"; persist(); go("home"); };
  $("#done").onclick = done;
  onKey = e => { if (e.key === "Enter") done(); };
}

// ---------- clock ----------

function tick() {
  const r = S.run;
  if (!r || S.view !== "run") return;
  const now = Date.now();
  if (r.phase === "block" && r.cur) {
    const t = $("#timer");
    const left = r.paused ? r.cur.remaining : r.cur.endsAt - now;
    if (t) {
      t.textContent = mmss(left);
      t.classList.toggle("low", left <= 2 * 60000);
    }
    if (!r.paused && r.cur.endsAt && left <= 0) finishBlock(false);
  } else if (r.phase === "pencils") {
    // Also leave if the clock went backwards (system time change), so this screen can't stick.
    const since = now - (r.pencilsAt || 0);
    if (since >= PENCILS_MS || since < 0) leavePencils();
  } else if (r.phase === "break" && r.breakEnds) {
    const left = r.breakEnds - now;
    const t = $("#timer"), b = $("#bclock"), btn = $("#nextblock");
    if (t) t.textContent = mmss(left);
    if (b) b.textContent = mmss(left);
    if (left <= 0 && btn && btn.disabled) {
      btn.disabled = false;
      btn.innerHTML = `Begin block ${r.idx + 2} <kbd>↵</kbd>`;
      btn.focus();
      sfx.start();
    }
  }
}
setInterval(tick, 250);
setInterval(() => { if (S.run && S.view === "run") { S.run.lastSeen = Date.now(); persist(); } }, 5000);
addEventListener("pagehide", () => { if (S.run) { S.run.lastSeen = Date.now(); persist(); } });

// A crash, refresh or dead battery shouldn't cost the ranking: the clock keeps running like
// a real exam. Only a long absence (over 10 minutes) counts as a pause.
function recoverOnLoad() {
  const r = S.run;
  if (!r || S.view !== "run") return;
  const gap = Date.now() - (r.lastSeen || Date.now());
  if (r.phase === "block" && r.cur?.endsAt && !r.paused) {
    if (gap > 10 * 60000) {
      r.ranked = false;
      r.cur.endsAt += gap;
      toast("Welcome back. You were gone a while, so this run is now unranked.", 4000);
    } else if (gap > 3000) toast("Resumed. The clock kept running.");
  }
  r.lastSeen = Date.now();
  persist();
}

// ---------- keyboard + sound ----------

function setSound(on) {
  S.settings.sound = on; sound.set(on); persist();
  $("#sound-btn").setAttribute("aria-pressed", on);
}
$("#sound-btn").addEventListener("click", () => { setSound(!S.settings.sound); toast(S.settings.sound ? "Sound on" : "Sound off", 1200); });
$("#sound-btn").setAttribute("aria-pressed", S.settings.sound);

addEventListener("keydown", e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && e.target.type !== "range";
  if (!typing && (e.key === "m" || e.key === "M") && !$(".modal-back")) { setSound(!S.settings.sound); toast(S.settings.sound ? "Sound on" : "Sound off", 1200); return; }
  // Let Enter/Space on a focused button do its own click.
  if (e.target.tagName === "BUTTON" && (e.key === "Enter" || e.key === " ")) return;
  if (typing && e.key !== "Escape" && !(e.key === "Enter" && e.target.type === "range")) return;
  onKey?.(e);
});
addEventListener("pointerdown", unlockAudio, { once: true });

// ---------- boot ----------

if (S.view === "building") S.view = S.run.deck ? "triage" : "home";
if (new URLSearchParams(location.search).has("recap") && S.run?.finished && !S.run.recapDone) { S.run.phase = "recap-intro"; S.run.finished = false; S.view = "run"; }
if (new URLSearchParams(location.search).has("fast")) setTimeout(() => toast("Fast mode: 1-minute blocks, 10-second breaks (for testing).", 3500), 300);
recoverOnLoad();
render();
