# Cram (V1)

A focused exam-cram tool. Drop in your notes and it builds a timed run of about 3.3 hours, with SAT-style blocks and breaks, using only your material.
Live at `/cram/`. It's static and has no build step or backend. Everything is saved in the browser.

## The flow

| Step | Screen | What happens |
|---|---|---|
| 1 | **Input** | Drop files anywhere on the page (PDF, Word, text, Markdown) or paste text. One optional field: "What's on the exam?" Then **Start run**. |
| 2 | **Triage** | Topic map with a priority from 1 to 5. Shows what's kept and what's cut, with a reason for each. One tap to keep or cut. Shows block count and total time. |
| 3 | **Run** | Up to 8 blocks of 20 minutes, each followed by an enforced 5-minute break. The block locks when time runs out, then a "Time. Pencils down." screen. |
| 4 | **Predict** | Before the final block: "What will you score on the real exam?" |
| 5 | **Results** | Final mock score on unseen questions, broken down by topic. Asks for the exam date and time and downloads a calendar reminder (`.ics`) for the recap. |
| 6 | **Morning recap** | 10 minutes on the most-missed items and the weakest topics' study cards. `?recap` opens it directly. |
| 7 | **Actual grade** | After the exam, enter your real grade. History shows predicted vs. mock vs. actual, which is the success metric. |

### Block order (8-block run)

Diagnostic → Learn I (2 blocks) → Recall sprint → Learn II (2 blocks) → Interleave → Final mock exam

| Block | Contents | Feedback |
|---|---|---|
| Diagnostic | 1–2 questions per kept topic, multiple choice | **Silent** until the block ends, then shows where to spend time |
| Learn | Study card per topic, then its questions (items missed in the diagnostic first) | Full juice |
| Recall sprint | Typed answers from memory, missed items first | Full juice |
| Interleave | All topics mixed, weakest items first | Full juice |
| Final mock | Held-back questions never seen in the run (about 25% of each topic) | **Silent**, like the real exam |

**Thin material means a shorter run, never made-up content** (`plan.js → makePlan`):
8 blocks need 6+ kept topics and 40+ questions. Otherwise it drops to 6, then 4, then 3 blocks.
A block also ends early when its material runs out, and it says so.

### Questions

- Multiple choice first. Once you get an item right, it comes back as a typed answer.
- A missed item returns about 4 questions later in the same block (at most twice). It also leads later Recall, Interleave, and recap blocks.
- Typed grading is lenient: case, punctuation, articles, small typos, and plurals don't count against you. The screen shows why an answer was accepted. After a typed miss, "I was right, count it" lets you override.
- Every miss shows the answer, one line on why, and **the quote from your notes** it came from.

### SAT feel

- A hard timer per block. At 0:00 the question locks and the pencils-down screen plays with a bell.
- Breaks can't be skipped. The button unlocks when the break ends.
- **Pausing makes the run unranked.** A refresh, crash, or dead battery doesn't: the clock keeps running like a real exam. Only an absence over 10 minutes counts as a pause.

### Juice (practice blocks only)

- Correct: a bell, a small particle burst, the tally pops, and a light haptic tap on phones.
- Wrong: a quiet, short low tone. No shake, no red flash beyond marking the answer.
- **Recovered** (a missed item answered right on its comeback): the best sound in the app, a four-note rise with a bigger burst.
- Block end: the correct count and the **projected exam score** count up, with the change since the block started. Points mean something: projected score is priority-weighted mastery across kept topics.
- The Diagnostic and Final mock are silent on purpose. Sounds are synthesized, with no audio files.
- `M` toggles sound. Reduced-motion turns off particles and count-ups.

### Deliberately left out

Leaderboards, avatars, streaks, themes, a settings page, badges. The only setting is sound on/off, plus the engine choice on the input screen.

## Question engines

- **Built-in (default)**: offline and extractive (`engine-local.js`). It finds definitions ("X is…", "X: …", "…is called X"), names, and numbers. From those it writes definition, reverse-definition, and fill-in-the-blank questions, with wrong choices drawn from other terms in your notes. Topic priority comes from how dense a section is and how much it overlaps the exam note.
- **Claude**: one streamed request to `claude-opus-5-5` with a strict JSON schema (`engine-claude.js`). It returns the topic map, study cards, and question bank. The prompt forbids outside facts, and every question carries a verbatim source quote. It uses the person's own API key, stored only in their browser and sent only to `api.anthropic.com`. It opts into server-side refusal fallback (`fallbacks: "default"`) and retries without it if the key doesn't have that beta.

## Keys

`1`–`4` or `A`–`D` pick · `Enter` submits and continues · `M` sound

## Files

| File | Role |
|---|---|
| `index.html`, `cram.css` | Shell and styles (light/dark tokens, phone-width layout) |
| `js/app.js` | Screens, run state machine, timer, keyboard, crash recovery |
| `js/plan.js` | Block plan, queues per block type, missed-item comebacks, mastery, projected score |
| `js/engine-local.js` | Offline extractive builder + shared triage/reserve logic |
| `js/engine-claude.js` | Claude engine |
| `js/grade.js` | Lenient typed-answer grading |
| `js/juice.js` | Sounds, particles, count-up |
| `js/ingest.js` | PDF (pdf.js) / Word (mammoth) / text reading, loaded on demand |
| `sample.md` | "Try sample notes" material |

## Testing

`/cram/?fast` shrinks blocks to 1 minute, breaks to 10 seconds, and the recap to 1 minute, so you can walk the whole run.
