// Claude engine: one streamed request turns the material into a topic map, study cards
// and a question bank. Runs in the browser with the student's own API key, which never
// leaves their device except in the request to api.anthropic.com.

import { finishDeck } from "./engine-local.js";
import { uid } from "./store.js";

const SDK = "https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.129.0/+esm";
export const MODEL = "claude-opus-5-5";
const MAX_CHARS = 1_500_000; // ~375k tokens; well inside the 1M context window.

const SYSTEM = `You turn a student's study material into a focused cram session for an exam.

Hard rules:
- Use only facts stated in the material. Never add outside knowledge, examples, numbers, or dates, even if you are sure they are true. If the material is thin, return fewer topics and fewer questions. That is the correct behavior.
- Every question must be answerable from the material, and its "source" must be a short verbatim quote (under 200 characters) from the material that supports the answer.
- Wrong choices must be plausible and drawn from the same material where possible (other terms, names, numbers from the notes), clearly wrong to someone who studied, and similar in length and form to the right answer. Never use "all of the above" or "none of the above".
- Write stems as clear exam questions. Vary the forms: definitions, cause and effect, compare, sequence, apply-the-concept, and numbers or dates when the material has them.

Topic map:
- Group the material into topics (usually 4 to 14). Give each a priority from 1 (skip-able) to 5 (certain to be tested). If the student said what's on the exam, weigh that above everything else and cut topics it clearly excludes.
- Set keep=false for topics that are off-exam, trivial, or too thin to quiz, with a short reason a student would accept (e.g. "Not on the exam per your note"). Kept topics get a short reason too (e.g. "Named in the exam note", "Heavily covered in lecture").
- summary: a 2-4 sentence study card for the topic, written only from the material. key_terms: the terms a student must know, each with a one-line definition from the material.

Questions:
- For each kept topic write 6 to 12 questions when the material supports it (fewer when it doesn't). For cut topics write none.
- Each question has exactly 4 choices, one correct (answer_index is 0-3).
- typed_ok is true when the answer is a short term, name, or number (under 5 words) that a student could type from memory; then "accept" lists other correct spellings or phrasings. Otherwise typed_ok is false and accept is empty.
- typed_stem: when typed_ok is true, the same question rephrased for a typed answer with no choices shown; otherwise an empty string.
- why: one sentence explaining the answer, from the material.`;

const str = { type: "string" };
const SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["title", "topics", "questions"],
  properties: {
    title: str,
    topics: { type: "array", items: { type: "object", additionalProperties: false,
      required: ["id", "title", "priority", "keep", "reason", "summary", "key_terms", "quote"],
      properties: { id: str, title: str, priority: { type: "integer" }, keep: { type: "boolean" }, reason: str, summary: str,
        key_terms: { type: "array", items: { type: "object", additionalProperties: false, required: ["term", "definition"], properties: { term: str, definition: str } } },
        quote: str } } },
    questions: { type: "array", items: { type: "object", additionalProperties: false,
      required: ["topic_id", "stem", "choices", "answer_index", "typed_ok", "typed_stem", "accept", "why", "source"],
      properties: { topic_id: str, stem: str, choices: { type: "array", items: str }, answer_index: { type: "integer" },
        typed_ok: { type: "boolean" }, typed_stem: str, accept: { type: "array", items: str }, why: str, source: str } } },
  },
};

let AnthropicCtor = null;
async function sdk() {
  if (!AnthropicCtor) AnthropicCtor = (await import(SDK)).default;
  return AnthropicCtor;
}

export async function buildWithClaude({ text, hint, apiKey, onProgress = () => {}, signal }) {
  if (text.length > MAX_CHARS) throw new Error(`That's a lot of material (${Math.round(text.length / 1000)}k characters). Cut it to the units on this exam, under ${MAX_CHARS / 1000}k.`);
  const Anthropic = await sdk();
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 2 });

  const user = `<material>\n${text}\n</material>\n\n<exam_note>${hint?.trim() || "(none given)"}</exam_note>\n\nBuild the topic map, study cards and question bank.`;
  const params = {
    model: MODEL,
    max_tokens: 64000,
    system: SYSTEM,
    output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
    messages: [{ role: "user", content: user }],
  };

  const run = async (withFallback) => {
    const body = withFallback ? { ...params, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" } : params;
    const stream = withFallback ? client.beta.messages.stream(body, { signal }) : client.messages.stream(body, { signal });
    let chars = 0;
    stream.on("text", (delta, snapshot) => {
      chars += delta.length;
      const n = (snapshot.match(/"stem"\s*:/g) || []).length;
      onProgress({ chars, questions: n });
    });
    return stream.finalMessage();
  };

  let msg;
  try {
    // Server-side fallback reroutes a rare safety decline to another model instead of failing.
    msg = await run(true);
  } catch (e) {
    // A 400 here usually means the fallback beta isn't enabled for this key; retry plain.
    if (e?.status !== 400) throw friendly(e);
    try { msg = await run(false); } catch (e2) { throw friendly(e2); }
  }

  if (msg.stop_reason === "refusal") throw new Error("Claude declined to process this material. Try the built-in engine.");
  if (msg.stop_reason === "max_tokens") throw new Error("The material produced more questions than fit in one pass. Trim it to the units on this exam.");
  const textOut = msg.content.filter(b => b.type === "text").map(b => b.text).join("");
  let data;
  try { data = JSON.parse(textOut); } catch { throw new Error("Claude's answer came back malformed. Try again."); }
  return toDeck(data, hint);
}

function friendly(e) {
  const s = e?.status;
  if (s === 401) return new Error("That API key was rejected. Check it in Engine settings.");
  if (s === 403) return new Error("This API key doesn't have access to the model.");
  if (s === 429) return new Error("Rate limited by the API. Wait a minute and try again.");
  if (s === 529 || s >= 500) return new Error("The Claude API is busy right now. Try again, or use the built-in engine.");
  if (e?.name === "AbortError" || /abort/i.test(e?.message || "")) return new Error("Cancelled.");
  if (/fetch|network|Failed to load|import/i.test(e?.message || "")) return new Error("Couldn't reach the Claude API. Check your connection.");
  return new Error(e?.message || "Something went wrong talking to Claude.");
}

function shuffleWithAnswer(choices, answer) {
  const tagged = choices.map((c, i) => ({ c, ok: i === answer }));
  for (let i = tagged.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [tagged[i], tagged[j]] = [tagged[j], tagged[i]]; }
  return { choices: tagged.map(t => t.c), answer: tagged.findIndex(t => t.ok) };
}

function toDeck(data, hint) {
  const topics = (data.topics || []).map((t, i) => ({
    id: String(t.id || "t" + i), title: t.title, priority: Math.max(1, Math.min(5, t.priority | 0 || 3)),
    kept: !!t.keep, reason: t.reason, summary: t.summary,
    keyTerms: (t.key_terms || []).slice(0, 8).map(k => ({ term: k.term, def: k.definition })), quote: t.quote,
  }));
  const ids = new Set(topics.map(t => t.id));
  const items = [];
  for (const q of data.questions || []) {
    if (!ids.has(String(q.topic_id))) continue;
    const choices = (q.choices || []).map(c => String(c).trim());
    if (choices.length !== 4 || new Set(choices.map(c => c.toLowerCase())).size !== 4) continue;
    if (!(q.answer_index >= 0 && q.answer_index <= 3)) continue;
    const answerText = choices[q.answer_index];
    const s = shuffleWithAnswer(choices, q.answer_index);
    items.push({ id: "c" + uid(), topicId: String(q.topic_id), stem: q.stem, typedStem: q.typed_ok ? (q.typed_stem || q.stem) : "",
      choices: s.choices, answer: s.answer, answerText, accept: q.typed_ok ? (q.accept || []) : [],
      typedOk: !!q.typed_ok && answerText.split(/\s+/).length <= 5, why: q.why, source: q.source, reserve: false });
  }
  // Topics Claude kept but couldn't write questions for can't be run.
  for (const t of topics) {
    const n = items.filter(i => i.topicId === t.id).length;
    if (t.kept && n < 2) { t.kept = false; t.reason = "Too thin to quiz"; }
  }
  return finishDeck({ title: data.title || "Your material", engine: "claude", hint, topics, items });
}
