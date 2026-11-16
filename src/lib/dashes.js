// Replaces em dashes, and en dashes used as pauses, with ordinary punctuation.
// Number ranges such as "2–5" are left alone. Safe to run on raw JSON text from
// the model: dashes never appear in JSON syntax, and escaped newlines inside
// strings are not touched.

export function removeEmDashes(text) {
  if (typeof text !== 'string' || !text) return text
  if (!text.includes('—') && !/\s–\s/.test(text)) return text
  return text
    // a dash used as a bullet at the start of a line
    .replace(/(^|\n)[ \t]*[—–][ \t]+/g, '$1')
    // a spaced dash used as a pause: "sheltering — and" becomes "sheltering, and"
    .replace(/[ \t]+[—–][ \t]+/g, ', ')
    // an unspaced em dash: "sheltering—and" becomes "sheltering, and"
    .replace(/(\S)—(\S)/g, '$1, $2')
    // any dash left at the edge of a line or string
    .replace(/[ \t]*—[ \t]*/g, ' ')
    // tidy doubled punctuation the substitutions can create
    .replace(/,\s*([,.;:!?])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
}

// For app labels built from data that contains " — " (role names such as
// "ESF-9 — Search & Rescue"). Reads better as a colon than a comma.
export function labelWithoutDash(text) {
  if (typeof text !== 'string') return text
  return text.replace(/\s*[—–]\s*/g, ': ')
}
