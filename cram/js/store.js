// Everything lives in this browser. Nothing is uploaded except, when the Claude engine
// is on, the material itself (sent straight to api.anthropic.com with your own key).

const KEY = "cram.v1";

export function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}

let quotaWarned = false;
export function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch (e) {
    if (!quotaWarned) { quotaWarned = true; console.warn("Cram: could not save progress", e); }
  }
}

export function uid() { return Math.random().toString(36).slice(2, 10); }
