// ---------- History: past sums, saved in the browser so they survive a refresh ----------
// Pure JavaScript (no React), so the phone version can reuse it with phone storage later.
// localStorage is a small notebook the browser keeps for this website. It only stores text,
// so the list is turned into JSON text to save it, and back into a list to read it.
const HISTORY_KEY = 'calculator-history'
const MAX_HISTORY = 100 // keep the newest 100 so the notebook never grows forever

// Anything could be in storage (an older version of the app, or someone editing it by hand
// in DevTools), so check every entry instead of trusting it.
export function loadHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_KEY))
    if (!Array.isArray(saved)) return []
    return saved.filter(
      (entry) =>
        typeof entry?.expression === 'string' &&
        typeof entry?.result === 'string' &&
        Number.isFinite(entry?.time),
    )
  } catch {
    return [] // broken JSON, or storage is blocked (some private windows do this)
  }
}

export function saveHistory(entries) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries))
  } catch {
    // Storage full or blocked: the history still works until the page is closed.
  }
}

// Returns a NEW list (newest first) instead of changing the old one, the way React likes it.
export function addEntry(entries, expression, result) {
  return [{ expression, result, time: Date.now() }, ...entries].slice(0, MAX_HISTORY)
}

// Entries are newest first, so a new group starts whenever the day changes.
// [{ day: '14/10/2026', entries: [...] }, ...]
export function groupByDay(entries) {
  const groups = []
  for (const entry of entries) {
    const day = new Date(entry.time).toLocaleDateString() // 14/10/2026 or 10/14/2026, by your computer's settings
    if (groups.at(-1)?.day !== day) groups.push({ day, entries: [] })
    groups.at(-1).entries.push(entry)
  }
  return groups
}
