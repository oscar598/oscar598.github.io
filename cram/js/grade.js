// Lenient typed-answer grading: ignores case, punctuation, articles and small typos,
// and tells the student what matched so the grading feels fair.

const ARTICLES = /\b(the|a|an)\b/g;

export function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[“”"'’`]/g, "")
    .replace(/[^a-z0-9%.\- ]+/g, " ")
    .replace(ARTICLES, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.\-]+$/, "");
}

function lev(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

const isNumeric = s => /^-?[\d,.]+%?$/.test(s);

// Returns { ok, how } where how explains the match ("exact", "close spelling", ...).
export function gradeTyped(input, item) {
  const got = norm(input);
  if (!got) return { ok: false, how: "blank" };
  const targets = [item.answerText, ...(item.accept || [])].map(norm).filter(Boolean);
  for (const t of targets) {
    if (got === t) return { ok: true, how: "exact", matched: t };
  }
  for (const t of targets) {
    if (isNumeric(t)) {
      if (got.replace(/[,%]/g, "") === t.replace(/[,%]/g, "")) return { ok: true, how: "same number", matched: t };
      continue;
    }
    const tol = t.length <= 4 ? 0 : t.length <= 8 ? 1 : t.length <= 16 ? 2 : 3;
    if (lev(got, t) <= tol) return { ok: true, how: "close spelling", matched: t };
    // Plural / singular.
    if (got.replace(/s$/, "") === t.replace(/s$/, "")) return { ok: true, how: "singular/plural", matched: t };
    // Long answers: accept if the key words are all there.
    const words = t.split(" ").filter(w => w.length > 3);
    if (words.length >= 3) {
      const hit = words.filter(w => got.includes(w)).length;
      if (hit / words.length >= 0.8) return { ok: true, how: "key words match", matched: t };
    }
  }
  return { ok: false, how: "no match" };
}
