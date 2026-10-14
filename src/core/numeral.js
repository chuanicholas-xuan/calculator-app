// ---------- Numeral system: the same whole number in base 2, 8, 10 and 16 ----------
// Uses BigInt (whole numbers with no size limit), so a 64-digit binary number stays exact.
// A normal JS number would start rounding after about 16 decimal digits.

export const BASES = [
  { base: 2, name: 'Binary' },
  { base: 8, name: 'Octal' },
  { base: 10, name: 'Decimal' },
  { base: 16, name: 'Hexadecimal' },
]

const DIGITS = '0123456789ABCDEF'

// "FF" in base 16 -> 255n. Returns null if the text isn't a whole number in that base.
export function parseInBase(text, base) {
  const match = /^(-?)([0-9A-F]+)$/.exec(text.toUpperCase())
  if (!match) return null
  let value = 0n
  for (const char of match[2]) {
    const digit = DIGITS.indexOf(char)
    if (digit >= base) return null
    value = value * BigInt(base) + BigInt(digit)
  }
  return match[1] && value !== 0n ? -value : value
}

export const formatInBase = (value, base) => value.toString(base).toUpperCase()

// Keep only characters that are allowed in this base, plus one leading minus sign: "dead beef" -> "DEADBEEF".
export function cleanInBase(text, base) {
  const allowed = DIGITS.slice(0, base)
  const upper = text.toUpperCase()
  return (upper.startsWith('-') ? '-' : '') + [...upper].filter((char) => allowed.includes(char)).join('')
}

// Switching the base keeps the same number: 255 in decimal becomes FF in hexadecimal.
export function rebase(text, fromBase, toBase) {
  const value = parseInBase(text, fromBase)
  return value === null ? text : formatInBase(value, toBase)
}
