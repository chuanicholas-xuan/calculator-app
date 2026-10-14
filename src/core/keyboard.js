// ---------- Keyboard: translate a key into the same action a button would send ----------
// Pure JavaScript, so it is easy to test and has nothing to do with React.
const KEY_MAP = {
  '+': ['operator', '+'],
  '-': ['operator', '-'],
  '*': ['operator', '*'],
  x: ['operator', '*'],
  '/': ['operator', '/'],
  '^': ['operator', '^'],
  '%': ['percent'],
  '!': ['postfix', '!'],
  '(': ['open', '('],
  ')': ['close'],
  '.': ['decimal'],
  ',': ['decimal'],
  Enter: ['equals'],
  '=': ['equals'],
  Escape: ['clear'],
  c: ['clear'],
  Backspace: ['delete'],
  Delete: ['delete'],
}

export function keyToAction(key) {
  if (key >= '0' && key <= '9' && key.length === 1) return ['digit', key]
  return KEY_MAP[key] ?? KEY_MAP[key.toLowerCase()] ?? null
}
