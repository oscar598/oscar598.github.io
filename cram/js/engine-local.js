// Offline question builder. Purely extractive: every question, answer and card is lifted
// from the student's own text. When the material is thin, it returns fewer topics and
// fewer questions; it never makes content up.

import { uid } from "./store.js";

const STOP = new Set(("a about above after again against all also am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers him his how i if in into is it its itself just me more most my no nor not now of off on once only or other our out over own same she should so some such than that the their them then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours "+
  "also however therefore thus often usually many much may might must shall one two three first second new used using use based called known example e.g i.e etc figure fig table chapter section page pp vs within without among per each every either neither").split(" "));

const PRONOUN_START = /^(it|this|that|these|those|they|there|he|she|we|you|i|which|what|who|here|such|each|one|some|many|most|all|both|another|other|our|their|his|her|its|if|when|while|because|although|as|so|but|and|or|then|also|however|for example|in|on|at|by|to)\b/i;

// ---------- text prep ----------

function cleanLines(text) {
  return text.replace(/\r/g, "").replace(/­/g, "").replace(/[ \t]+/g, " ")
    .replace(/(\w)-\n(\w)/g, "$1$2") // hyphenated line breaks from PDFs
    .split("\n").map(l => l.trim());
}

function isHeading(line, next) {
  if (!line || line.length > 70) return null;
  let m = line.match(/^#{1,6}\s+(.+)$/);
  if (m) return m[1].replace(/[#*_`]/g, "").trim();
  if (/^(chapter|section|unit|lecture|part|module|week|topic|lesson)\b[\s\d.:IVX-]*.{0,60}$/i.test(line)) return line.replace(/[:.]$/, "");
  m = line.match(/^(\d+(?:\.\d+){0,3})[.)]?\s+([A-Z][^.!?]{2,60})$/);
  if (m) return m[2].trim();
  const nextLong = next && next.length > 60;
  if (!nextLong) return null;
  if (/[.!?,;]$/.test(line) || /^[-*•]/.test(line)) return null;
  const words = line.split(" ");
  if (words.length > 9) return null;
  const caps = words.filter(w => /^[A-Z0-9]/.test(w)).length;
  if (line === line.toUpperCase() && /[A-Z]/.test(line)) return titleCase(line);
  if (caps / words.length >= 0.6) return line;
  return null;
}

function titleCase(s) { return s.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase()); }

function splitSections(text) {
  const lines = cleanLines(text);
  const secs = [];
  let cur = { title: null, lines: [] };
  for (let i = 0; i < lines.length; i++) {
    const h = isHeading(lines[i], lines.slice(i + 1).find(Boolean));
    if (h) {
      if (cur.lines.join(" ").length > 0 || cur.title) secs.push(cur);
      cur = { title: h, lines: [] };
    } else cur.lines.push(lines[i]);
  }
  secs.push(cur);
  let out = secs.map(s => ({ title: s.title, lines: s.lines, body: s.lines.join("\n").trim() })).filter(s => s.body.length > 0);

  // Too few headings: chunk by paragraphs instead.
  if (out.filter(s => s.title).length < 2) {
    const paras = text.replace(/\r/g, "").split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    out = [];
    let buf = [];
    const flush = () => { if (buf.length) { const b = buf.join("\n\n"); out.push({ title: null, body: b, lines: b.split("\n") }); buf = []; } };
    for (const p of paras) {
      buf.push(p);
      if (buf.join(" ").length > 1400) flush();
    }
    flush();
  }
  // Merge tiny sections into their neighbour.
  const merged = [];
  for (const s of out) {
    if (merged.length && s.body.length < 180) {
      const prev = merged[merged.length - 1];
      prev.body += "\n" + (s.title ? s.title + ". " : "") + s.body;
      prev.lines.push(...(s.title ? [s.title] : []), ...s.lines);
    } else merged.push({ ...s });
  }
  return merged;
}

function sentences(body) {
  return body.replace(/\n(?=[-*•]|\d+[.)])/g, "\n\n").split(/\n\s*\n/)
    .flatMap(p => p.replace(/\s*\n\s*/g, " ").split(/(?<=[.!?])\s+(?=[A-Z0-9"“(])/))
    .map(s => s.replace(/^[-*•]\s*/, "").trim())
    .filter(s => s.length >= 30 && s.length <= 320);
}

const words = s => (s.toLowerCase().match(/[a-z][a-z'-]{2,}/g) || []).filter(w => !STOP.has(w));

// ---------- fact extraction ----------

const cleanTerm = t => t.replace(/^(the|a|an)\s+/i, "").replace(/[“”"*_`]/g, "").replace(/\s+/g, " ").trim();
const cleanDef = d => d.replace(/\s+/g, " ").replace(/[.;:,\s]+$/, "").trim();
const okTerm = t => {
  const w = t.split(" ");
  return t.length >= 2 && t.length <= 48 && w.length <= 5 && !PRONOUN_START.test(t) && !/\d{3,}/.test(t) && /[a-z]/i.test(t) && !STOP.has(t.toLowerCase());
};

function definitionsIn(sec) {
  const defs = [];
  // Glossary lines: "Term: definition" / "Term - definition".
  for (const line of sec.lines) {
    const m = line.match(/^[-*•]?\s*\**([A-Za-z][\w'()/ -]{1,46}?)\**\s*(?::|\s[–—-]\s)\s*(.{12,260})$/);
    if (m && okTerm(cleanTerm(m[1])) && !/^(note|example|see|source|figure|table|q|a)$/i.test(m[1].trim()))
      defs.push({ term: cleanTerm(m[1]), def: cleanDef(m[2]), src: line.replace(/^[-*•]\s*/, "") });
  }
  for (const s of sentences(sec.body)) {
    let m = s.match(/^(?:(?:An?|The)\s+)?([A-Za-z][\w'/-]*(?:\s+[\w'/-]+){0,4}?)\s+(?:is|are)\s+(?:(?:a|an|the)\s+)?((?:type|kind|form|process|method|measure|set|state|ability|study|principle|theory|law|condition|unit|structure|term|group|period|organ|molecule|protein|stage|system|practice|tendency|belief|policy|movement|event|document|rate|value|number|amount|mechanism|function|property|region|area|technique|model|approach|concept)\b.{8,220}|.{20,220})$/);
    if (m) {
      const term = cleanTerm(m[1]);
      if (okTerm(term) && !/\b(not|also|often|usually|very|more|less|important|likely|able)\b/i.test(m[2].slice(0, 14)))
        defs.push({ term, def: cleanDef(m[2]), src: s });
      continue;
    }
    m = s.match(/^(?:(?:An?|The)\s+)?([A-Za-z][\w'/-]*(?:\s+[\w'/-]+){0,4}?)\s+(?:refers to|means|is defined as|describes|denotes)\s+(.{12,220})$/i);
    if (m && okTerm(cleanTerm(m[1]))) { defs.push({ term: cleanTerm(m[1]), def: cleanDef(m[2]), src: s }); continue; }
    m = s.match(/^(.{15,200}?),?\s+(?:is|are)\s+(?:called|known as|termed|referred to as)\s+(?:the\s+|an?\s+)?["“]?([A-Za-z][\w'/ -]{1,46}?)["”]?[.!]?$/i);
    if (m && okTerm(cleanTerm(m[2]))) defs.push({ term: cleanTerm(m[2]), def: cleanDef(m[1]), src: s });
  }
  // One definition per term.
  const seen = new Set();
  return defs.filter(d => { const k = d.term.toLowerCase(); if (seen.has(k) || d.def.toLowerCase().includes(k)) return false; seen.add(k); return true; });
}

function capPhrases(body) {
  const found = new Map();
  for (const s of sentences(body)) {
    const re = /(?<!^)(?<![.!?] )\b([A-Z][a-z]+(?:(?: (?:of|the|and|de|la|von))? [A-Z][a-z]+){0,3})\b/g;
    let m;
    while ((m = re.exec(s))) {
      const p = m[1].trim();
      if (p.length < 4 || STOP.has(p.toLowerCase()) || PRONOUN_START.test(p)) continue;
      found.set(p, (found.get(p) || 0) + 1);
    }
  }
  return found;
}

// ---------- helpers ----------

function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let x = seed || 1; return () => ((x = Math.imul(x ^ (x >>> 15), 2246822507) ^ Math.imul(x ^ (x >>> 13), 3266489909)) >>> 0) / 4294967296; }
function shuffle(a, r) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function pickDistractors(correct, pool, n, r, near = []) {
  const low = correct.toLowerCase();
  const cand = [...new Set([...shuffle([...near], r), ...shuffle([...pool], r)])]
    .filter(x => x && x.toLowerCase() !== low && !x.toLowerCase().includes(low) && !low.includes(x.toLowerCase()));
  return cand.slice(0, n);
}

function numberDistractors(numStr, pool, r) {
  const clean = numStr.replace(/,/g, "");
  const n = parseFloat(clean);
  const suffix = numStr.endsWith("%") ? "%" : "";
  const fromDoc = pool.filter(p => p !== numStr && (p.endsWith("%") === !!suffix)).filter(p => {
    const v = parseFloat(p.replace(/,/g, ""));
    return v > 0 && n > 0 ? Math.max(v, n) / Math.min(v, n) < 20 : true;
  });
  const out = shuffle([...new Set(fromDoc)], r).slice(0, 3);
  const isYear = /^(1[5-9]|20)\d\d$/.test(clean);
  const deltas = isYear ? [-10, 5, 25, -3, 12] : [0.5, 2, 1.5, 0.75, 3, 10];
  let i = 0;
  while (out.length < 3 && i < deltas.length) {
    let v = isYear ? n + deltas[i] : n * deltas[i];
    if (!isYear && Number.isInteger(n)) v = Math.round(v);
    else if (!isYear) v = +v.toPrecision(3);
    const s = (isYear ? String(v) : v.toLocaleString("en-US")) + suffix;
    if (s !== numStr && !out.includes(s)) out.push(s);
    i++;
  }
  return out;
}

const trunc = (s, n) => (s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s);

// ---------- main ----------

export function buildLocal(text, hint = "") {
  const secs = splitSections(text);
  const allWords = words(text);
  const df = new Map();
  const secWords = secs.map(s => { const w = words(s.body); new Set(w).forEach(x => df.set(x, (df.get(x) || 0) + 1)); return w; });

  // Keywords per section (tf-idf).
  const secKeywords = secWords.map(ws => {
    const tf = new Map(); ws.forEach(w => tf.set(w, (tf.get(w) || 0) + 1));
    return [...tf].map(([w, c]) => [w, c * Math.log(1 + secs.length / (df.get(w) || 1))]).sort((a, b) => b[1] - a[1]).slice(0, 8).map(x => x[0]);
  });

  const defsBySec = secs.map(definitionsIn);
  const allTerms = [...new Set(defsBySec.flat().map(d => d.term))];
  const allDefs = defsBySec.flat().map(d => d.def);
  const caps = capPhrases(secs.map(s => s.body).join("\n\n"));
  const capList = [...caps].filter(([, c]) => c >= 1).map(([p]) => p);
  const numPool = [...new Set((text.match(/\b\d{1,3}(?:,\d{3})+(?:\.\d+)?%?|\b\d+(?:\.\d+)?%?/g) || []).filter(n => n.length >= 2))];

  const hintWords = new Set(words(hint));
  const topics = [];
  const items = [];

  secs.forEach((sec, si) => {
    const r = rng(hash(sec.body));
    const id = "t" + si;
    const title = sec.title || titleCase(secKeywords[si].slice(0, 2).join(" · ") || `Part ${si + 1}`);
    const sents = sentences(sec.body);
    const defs = defsBySec[si];
    const qs = [];
    const usedSrc = new Set();

    // 1. Definition → term (MC + typed).
    for (const d of defs) {
      const near = defsBySec[si].map(x => x.term);
      const dis = pickDistractors(d.term, allTerms.length >= 4 ? allTerms : [...allTerms, ...capList], 3, r, near);
      if (dis.length < 3) continue;
      qs.push({ kind: "def", stem: `Which term is described here?\n“${trunc(d.def, 220)}”`, typedStem: `Name the term:\n“${trunc(d.def, 220)}”`,
        correct: d.term, dis, typedOk: true, why: `${d.term}: ${trunc(d.def, 200)}.`, source: d.src });
      usedSrc.add(d.src);
    }
    // 2. Term → definition (MC only).
    for (const d of defs) {
      if (allDefs.length < 4) break;
      const dis = pickDistractors(d.def, allDefs.filter(x => x !== d.def), 3, r).map(x => trunc(x, 140));
      if (dis.length < 3) continue;
      qs.push({ kind: "rev", stem: `What is ${/^[A-Z]{2,}/.test(d.term) ? d.term : "“" + d.term + "”"}?`, correct: trunc(d.def, 140), dis,
        typedOk: false, why: `${d.term}: ${trunc(d.def, 200)}.`, source: d.src });
    }
    // 3. Cloze on key terms, names and numbers.
    const termsHere = [...new Set([...defs.map(d => d.term), ...allTerms])].sort((a, b) => b.length - a.length);
    for (const s of sents) {
      if (qs.length >= 16) break;
      if (usedSrc.has(s)) continue;
      let target = termsHere.find(t => new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(s) && s.toLowerCase().indexOf(t.toLowerCase()) > 0);
      let kindPool = allTerms.length >= 4 ? allTerms : [...allTerms, ...capList];
      let isNum = false;
      if (!target) {
        const cp = capList.find(p => s.includes(p) && s.indexOf(p) > 0 && caps.get(p) >= 1);
        if (cp) { target = cp; kindPool = capList; }
      }
      if (!target) {
        const nm = [...s.matchAll(/\b\d{1,3}(?:,\d{3})+(?:\.\d+)?%?|\b\d+(?:\.\d+)?%?/g)].find(x => x[0].length >= 2 && x.index > 0);
        if (nm) { target = nm[0]; isNum = true; }
      }
      if (!target) {
        // Fall back to the section's strongest keyword.
        const kw = secKeywords[si].find(k => k.length > 5 && new RegExp(`\\b${k}\\b`, "i").test(s));
        if (kw) { target = s.match(new RegExp(`\\b${kw}\\b`, "i"))[0]; kindPool = secKeywords.flat().filter(k => k.length > 4); }
      }
      if (!target) continue;
      const idx = s.toLowerCase().indexOf(target.toLowerCase());
      const actual = s.slice(idx, idx + target.length);
      const blanked = s.slice(0, idx) + "_____" + s.slice(idx + target.length);
      if (blanked.replace(/_+/g, "").trim().length < 20) continue;
      const dis = isNum ? numberDistractors(actual, numPool, r) : pickDistractors(actual, kindPool, 3, r);
      if (dis.length < 3) continue;
      qs.push({ kind: "cloze", stem: `Fill in the blank:\n${blanked}`, correct: actual, dis, typedOk: true,
        why: s, source: s });
      usedSrc.add(s);
    }

    // Dedup and cap.
    const seenStem = new Set();
    const final = shuffle(qs, r).filter(q => !seenStem.has(q.stem) && seenStem.add(q.stem))
      .sort((a, b) => ({ def: 0, cloze: 1, rev: 2 }[a.kind] - { def: 0, cloze: 1, rev: 2 }[b.kind])).slice(0, 14);

    final.forEach(q => {
      const choices = shuffle([q.correct, ...q.dis.slice(0, 3)], r);
      items.push({ id: id + "q" + uid(), topicId: id, stem: q.stem, typedStem: q.typedStem, choices, answer: choices.indexOf(q.correct),
        answerText: q.correct, accept: [], typedOk: q.typedOk && q.correct.length <= 40, why: q.why, source: q.source, reserve: false });
    });

    // Priority: fact density, size, exam hint overlap.
    const overlap = hintWords.size ? [...hintWords].filter(w => secWords[si].includes(w) || title.toLowerCase().includes(w)).length : 0;
    const density = final.length;
    let score = Math.min(3, density / 4) + Math.min(1, sec.body.length / 3000);
    if (hintWords.size) score += overlap ? 1.5 + Math.min(1, overlap / 2) : -1;
    const lead = sents.slice(0, 2).join(" ");
    topics.push({ id, title: trunc(title, 60), score, overlap, n: final.length,
      summary: trunc(lead || sec.body.slice(0, 300), 360),
      keyTerms: defs.slice(0, 6).map(d => ({ term: d.term, def: trunc(d.def, 160) })),
      quote: trunc(defs[0]?.src || sents[0] || "", 220) });
  });

  return finishDeck({ title: guessTitle(text, secs), engine: "local", hint, topics, items, words: allWords.length });
}

function guessTitle(text, secs) {
  const first = text.split("\n").map(l => l.replace(/^#+\s*/, "").trim()).find(l => l.length > 3 && l.length < 70);
  return first || secs[0]?.title || "Your material";
}

// Shared by both engines: convert raw scores to 1–5 priority, decide kept/cut with reasons,
// and hold back a reserve for the final mock.
export function finishDeck(deck) {
  const { topics, items } = deck;
  const byTopic = new Map(topics.map(t => [t.id, []]));
  items.forEach(i => byTopic.get(i.topicId)?.push(i));

  if (deck.engine === "local") {
    const scores = topics.map(t => t.score);
    const max = Math.max(...scores, 0.01), min = Math.min(...scores, 0);
    topics.forEach(t => { t.priority = Math.max(1, Math.min(5, Math.round(1 + 4 * (t.score - min) / (max - min || 1)))); });
    const hinted = !!deck.hint?.trim();
    const sorted = [...topics].sort((a, b) => b.priority - a.priority || b.n - a.n);
    const MAX_KEPT = 14;
    let keptCount = 0;
    for (const t of sorted) {
      const n = byTopic.get(t.id).length;
      if (n < 2) { t.kept = false; t.reason = n ? "Too thin to quiz: only 1 fact found" : "No quizzable facts found"; continue; }
      if (hinted && !t.overlap && t.priority <= 2 && sorted.filter(x => x.overlap).length >= 2) { t.kept = false; t.reason = "Doesn't match what's on the exam"; continue; }
      if (keptCount >= MAX_KEPT) { t.kept = false; t.reason = "Lower priority; no time left in the run"; continue; }
      t.kept = true; keptCount++;
      t.reason = hinted && t.overlap ? "Matches what's on the exam" : t.priority >= 4 ? "Dense in definitions and facts" : "Covered in your material";
    }
  }
  // Hold back ~25% of each kept topic's questions for the final mock (never seen before it).
  for (const t of topics) {
    const list = byTopic.get(t.id);
    t.count = list.length;
    const k = list.length >= 4 ? Math.max(1, Math.floor(list.length * 0.25)) : 0;
    if (k) list.slice(-k).forEach(it => { it.reserve = true; });
  }
  deck.createdAt = Date.now();
  return deck;
}
