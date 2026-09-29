// The run: which blocks, what goes in each, and how missed items come back.

const fast = new URLSearchParams(location.search).has("fast");
export const BLOCK_MS = fast ? 60_000 : 20 * 60_000;
export const BREAK_MS = fast ? 10_000 : 5 * 60_000;
export const RECAP_MS = fast ? 60_000 : 10 * 60_000;

export const KINDS = {
  diagnostic: { label: "Diagnostic", silent: true, blurb: "Answer what you can. No feedback until the end. This shows where to spend your time." },
  learn: { label: "Learn", silent: false, blurb: "Read the card, then answer. Misses come back a few questions later." },
  recall: { label: "Recall sprint", silent: false, blurb: "Typed answers from memory. No choices to lean on." },
  interleave: { label: "Interleave", silent: false, blurb: "All topics mixed. Your weakest items come first." },
  final: { label: "Final mock exam", silent: true, blurb: "Questions you haven't seen. No feedback until the end, like the real thing." },
  recap: { label: "Morning recap", silent: false, blurb: "Ten minutes on what you missed most. Then go take the exam." },
};

export const keptTopics = deck => deck.topics.filter(t => t.kept).sort((a, b) => b.priority - a.priority);
const poolFor = (deck, topicIds) => deck.items.filter(i => !i.reserve && topicIds.includes(i.topicId));

// Thin material means fewer blocks, never padded content.
export function makePlan(deck) {
  const kept = keptTopics(deck);
  const ids = kept.map(t => t.id);
  const pool = poolFor(deck, ids).length;
  if (kept.length === 0 || pool < 6) return null;
  const half = Math.ceil(ids.length / 2);
  const A = ids.slice(0, half), B = ids.slice(half);
  const splitIn2 = a => [a.slice(0, Math.ceil(a.length / 2)), a.slice(Math.ceil(a.length / 2))];
  const L = (topics, label) => ({ kind: "learn", label, topics });
  let blocks;
  if (kept.length >= 6 && pool >= 40) {
    const [A1, A2] = splitIn2(A), [B1, B2] = splitIn2(B);
    blocks = [{ kind: "diagnostic" }, L(A1, "Learn I · part 1"), L(A2, "Learn I · part 2"), { kind: "recall" },
      L(B1, "Learn II · part 1"), L(B2, "Learn II · part 2"), { kind: "interleave" }, { kind: "final" }];
  } else if (kept.length >= 4 && pool >= 24) {
    blocks = [{ kind: "diagnostic" }, L(A, "Learn I"), { kind: "recall" }, L(B, "Learn II"), { kind: "interleave" }, { kind: "final" }];
  } else if (pool >= 12) {
    blocks = [{ kind: "diagnostic" }, L(ids, "Learn"), { kind: "recall" }, { kind: "final" }];
  } else {
    blocks = [{ kind: "diagnostic" }, L(ids, "Learn"), { kind: "final" }];
  }
  return blocks.map(b => ({ ...b, label: b.label || KINDS[b.kind].label }));
}

export function planMinutes(blocks) {
  return blocks.length * BLOCK_MS / 60000 + (blocks.length - 1) * BREAK_MS / 60000;
}

// ---------- per-item memory ----------

export function itemState(run, id) {
  return (run.items[id] ||= { seen: 0, right: 0, wrong: 0, last: null, stage: "mc" });
}

export function topicMastery(run, topicId) {
  return run.mastery[topicId] ?? 0.3;
}

// Projected score: priority-weighted mastery over kept topics.
export function projected(deck, run) {
  const kept = keptTopics(deck);
  if (!kept.length) return 0;
  let w = 0, s = 0;
  for (const t of kept) { w += t.priority; s += t.priority * topicMastery(run, t.id); }
  return Math.round(100 * s / w);
}

export function record(deck, run, item, mode, correct, blockKind) {
  const st = itemState(run, item.id);
  const recovered = correct && st.last === false;
  st.seen++;
  if (correct) { st.right++; if (mode === "mc" && item.typedOk) st.stage = "typed"; }
  else { st.wrong++; if (mode === "typed") st.stage = "mc"; }
  st.last = correct;
  const m = topicMastery(run, item.topicId);
  // Typed recall counts for more than recognition.
  const weight = mode === "typed" ? 0.4 : 0.3;
  run.mastery[item.topicId] = m + weight * ((correct ? 1 : 0) - m);
  run.log.push({ id: item.id, t: item.topicId, k: blockKind, m: mode, c: correct ? 1 : 0, at: Date.now() });
  return { recovered };
}

// ---------- block queues ----------

function rr(groups, cap) {
  // Round-robin across topic groups so topics interleave.
  const out = [];
  const lists = groups.map(g => [...g]);
  while (out.length < cap && lists.some(l => l.length)) for (const l of lists) if (l.length && out.length < cap) out.push(l.shift());
  return out;
}
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const modeFor = (run, item, force) => force === "typed" ? (item.typedOk ? "typed" : "mc") : force === "mc" ? "mc" : (item.typedOk && itemState(run, item.id).stage === "typed" ? "typed" : "mc");
const q = (run, item, force) => ({ type: "q", id: item.id, mode: modeFor(run, item, force) });

export function buildQueue(deck, run, block, blockIndex) {
  const kept = keptTopics(deck);
  const keptIds = kept.map(t => t.id);
  const byTopic = id => deck.items.filter(i => i.topicId === id && !i.reserve);
  const learnedSoFar = () => run.plan.slice(0, blockIndex).filter(b => b.kind === "learn").flatMap(b => b.topics);
  const isDue = i => itemState(run, i.id).last === false;

  switch (block.kind) {
    case "diagnostic": {
      const per = kept.length >= 12 ? 1 : 2;
      return rr(kept.map(t => byTopic(t.id).slice(0, per)), 24).map(i => q(run, i, "mc"));
    }
    case "learn": {
      const out = [];
      for (const tid of block.topics) {
        out.push({ type: "card", topicId: tid });
        // Items missed in the diagnostic go first.
        const list = byTopic(tid).sort((a, b) => isDue(b) - isDue(a)).slice(0, 10);
        list.forEach(i => out.push(q(run, i)));
      }
      return out;
    }
    case "recall": {
      const topics = learnedSoFar().length ? learnedSoFar() : keptIds;
      const pool = deck.items.filter(i => !i.reserve && topics.includes(i.topicId));
      const due = shuffle(pool.filter(isDue));
      const rest = shuffle(pool.filter(i => !isDue(i) && itemState(run, i.id).seen > 0));
      const unseen = shuffle(pool.filter(i => itemState(run, i.id).seen === 0));
      const ordered = [...new Set([...due, ...rest, ...unseen])].slice(0, 30);
      // Typed wherever possible; MC for items that can't be typed.
      return ordered.map(i => q(run, i, "typed"));
    }
    case "interleave": {
      const pool = deck.items.filter(i => !i.reserve && keptIds.includes(i.topicId));
      const score = i => {
        const st = itemState(run, i.id);
        return (isDue(i) ? 10 : 0) + st.wrong * 2 - st.right + (1 - topicMastery(run, i.topicId)) * 3;
      };
      const groups = kept.map(t => pool.filter(i => i.topicId === t.id).sort((a, b) => score(b) - score(a)));
      return rr(groups, 40).map(i => q(run, i));
    }
    case "final": {
      let pool = deck.items.filter(i => i.reserve && keptIds.includes(i.topicId));
      if (pool.length < 10) {
        const extra = deck.items.filter(i => !i.reserve && keptIds.includes(i.topicId))
          .sort((a, b) => itemState(run, a.id).seen - itemState(run, b.id).seen);
        pool = [...pool, ...extra.slice(0, 10 - pool.length)];
      }
      const groups = kept.map(t => shuffle(pool.filter(i => i.topicId === t.id)));
      // Mostly multiple choice, every third typeable item typed.
      return rr(groups, 40).map((i, n) => q(run, i, n % 3 === 2 ? "typed" : "mc"));
    }
    case "recap": {
      const pool = deck.items.filter(i => keptIds.includes(i.topicId));
      const missed = pool.filter(i => itemState(run, i.id).wrong > 0)
        .sort((a, b) => (itemState(run, b.id).wrong - itemState(run, b.id).right) - (itemState(run, a.id).wrong - itemState(run, a.id).right));
      const weakTopics = [...kept].sort((a, b) => topicMastery(run, a.id) - topicMastery(run, b.id)).slice(0, 3);
      const out = [];
      weakTopics.forEach(t => out.push({ type: "card", topicId: t.id }));
      const fill = missed.length >= 12 ? missed : [...missed, ...pool.filter(i => !missed.includes(i) && weakTopics.some(t => t.id === i.topicId))];
      fill.slice(0, 20).forEach(i => out.push(q(run, i)));
      return out;
    }
  }
  return [];
}

// A missed item comes back later in the same block (at most twice).
export function requeueMiss(block, entry) {
  const again = block.queue.filter((e, i) => i > block.pos && e.id === entry.id).length;
  const already = block.requeued[entry.id] || 0;
  if (again || already >= 2) return;
  block.requeued[entry.id] = already + 1;
  const at = Math.min(block.queue.length, block.pos + 4);
  block.queue.splice(at, 0, { type: "q", id: entry.id, mode: "mc", comeback: true });
}
