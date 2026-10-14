// ---------- Reading numbers people type ----------
// Only digits and one decimal point: "1a2.3.4" becomes "12.34".
export const cleanDecimal = (text) => text.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')

// The cleaned text as a number; an empty box counts as 0.
export const toNumber = (text) => (text === '' ? 0 : Number(text))
