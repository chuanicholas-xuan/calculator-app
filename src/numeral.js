// ---------- Numeral system: the same whole number in base 2, 8, 10 and 16 ----------
// Uses BigInt (whole numbers with no size limit), so a 64-digit binary number stays exact.
// A normal JS number would start rounding after about 16 decimal digits.

const view = document.getElementById('numeral-view')
const baseSelect = document.getElementById('numeral-base')
const input = document.getElementById('numeral-input')
const BASES = [2, 8, 10, 16]
const outputs = Object.fromEntries(BASES.map((base) => [base, document.getElementById(`numeral-${base}`)]))

const DIGITS = '0123456789ABCDEF'

// ---------- Pure maths: no DOM here, so it is easy to test ----------
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

// ---------- Drawing ----------
// Keep only characters that are allowed in this base, plus one leading minus sign.
function readInput() {
  const base = Number(baseSelect.value)
  const allowed = DIGITS.slice(0, base)
  const upper = input.value.toUpperCase()
  const cleaned = (upper.startsWith('-') ? '-' : '') + [...upper].filter((char) => allowed.includes(char)).join('')
  if (cleaned !== input.value) input.value = cleaned
  return parseInBase(cleaned, base)
}

function update() {
  const value = readInput()
  for (const base of BASES) outputs[base].textContent = value === null ? '–' : formatInBase(value, base)
}

let lastBase = Number(baseSelect.value)

// Switching the base keeps the same number: 255 in decimal becomes FF when you pick hexadecimal.
baseSelect.addEventListener('change', () => {
  const value = parseInBase(input.value, lastBase)
  lastBase = Number(baseSelect.value)
  if (value !== null) input.value = formatInBase(value, lastBase)
  update()
  input.focus()
})
input.addEventListener('input', update)

// ---------- Used by converter.js ----------
export const numeral = {
  title: 'Numeral system',
  view,
  open() {
    view.hidden = false
    update()
    input.focus()
  },
}
