// ---------- The calculator's brain: pure JavaScript, no React and no DOM ----------
// This is the maths from the old main.js, reshaped as a "reducer":
//   calculatorReducer(oldState, action) -> newState
// It never changes the old state; it returns a new one. React compares old and new to know
// what to redraw. Because nothing in here touches the screen, the same file will also work
// in the React Native (phone) version later.

export const MAX_DIGITS = 12

// The whole sum is kept as a list of pieces (tokens).
// "12 + sin(30) × 2" is stored as ['12', '+', 'sin', '30', ')', '*', '2'].
// Numbers stay as text while you type them, so "0." and "1.50" survive.
// A percent stays on its number, like '10%', so the screen and the history can show it.
export const initialState = {
  tokens: [],
  justEvaluated: false, // true right after =, so the next key knows to start fresh or continue from the answer
  result: '', // the answer shown after =
  angleUnit: 'deg', // sin, cos and tan read their number as degrees or radians
  second: false, // the "2nd" key swaps some buttons to their opposite (sin -> sin⁻¹)
}

// Every kind of token the sum can contain.
const OPERATORS = ['+', '-', '*', '/', '^'] // go BETWEEN two numbers
const POSTFIX = ['!', '²', '⁻¹'] // go AFTER a number: 5!, 3², 4⁻¹
const CONSTANTS = { π: Math.PI, e: Math.E }
const NEGATIVE = 'neg' // a minus sign in front of a number, as in "(−5"

// A function token also opens a bracket, so 'sin' is shown as "sin(" and needs a ")" later.
const FUNCTIONS = {
  sin: { label: 'sin(', run: (x) => trig(Math.sin, x) },
  cos: { label: 'cos(', run: (x) => trig(Math.cos, x) },
  tan: { label: 'tan(', run: (x) => tan(x) },
  asin: { label: 'sin⁻¹(', run: (x) => fromRadians(Math.asin(x)) },
  acos: { label: 'cos⁻¹(', run: (x) => fromRadians(Math.acos(x)) },
  atan: { label: 'tan⁻¹(', run: (x) => fromRadians(Math.atan(x)) },
  lg: { label: 'lg(', run: Math.log10 },
  ln: { label: 'ln(', run: Math.log },
  sqrt: { label: '√(', run: Math.sqrt },
  pow10: { label: '10^(', run: (x) => 10 ** x },
  exp: { label: 'e^(', run: Math.exp },
}

// What humans see vs what the code uses.
const SYMBOLS = { '+': ' + ', '-': ' − ', '*': ' × ', '/': ' ÷ ', '^': '^', [NEGATIVE]: '−' }

// ---------- Small helpers: what kind of token is this? ----------
const isOperator = (token) => OPERATORS.includes(token)
const isPostfix = (token) => POSTFIX.includes(token)
const isFunction = (token) => Object.hasOwn(FUNCTIONS, token)
const isConstant = (token) => Object.hasOwn(CONSTANTS, token)
const isPercent = (token) => typeof token === 'string' && /^-?\d.*%$/.test(token)
const isNumber = (token) => typeof token === 'string' && /^-?\d/.test(token) && !isPercent(token)
const opensBracket = (token) => token === '(' || isFunction(token)

// Something you could put a + after: a number, π, a closing bracket, or 5!
const endsValue = (token) =>
  isNumber(token) || isPercent(token) || isConstant(token) || token === ')' || isPostfix(token)

// Something a value can start with. Used for "2π" meaning 2 × π.
const startsValue = (token) =>
  isNumber(token) || isPercent(token) || isConstant(token) || opensBracket(token)

const lastToken = (s) => s.tokens[s.tokens.length - 1]
const setLastToken = (s, value) => (s.tokens[s.tokens.length - 1] = value)

// How many brackets are still open, so ")" is only allowed when there is one to close.
function openBrackets(tokens) {
  let count = 0
  for (const token of tokens) {
    if (opensBracket(token)) count++
    else if (token === ')') count--
  }
  return count
}

// ---------- Maths ----------
// Set by evaluate() before each run, so sin/cos/tan know whether to read degrees or radians.
let angleUnit = 'deg'

const toRadians = (x) => (angleUnit === 'deg' ? (x * Math.PI) / 180 : x)
const fromRadians = (x) => (angleUnit === 'deg' ? (x * 180) / Math.PI : x)

// sin(180°) comes out as 0.000000000000000122 because π can't be stored exactly. Snap it to 0.
function trig(fn, x) {
  const result = fn(toRadians(x))
  return Math.abs(result) < 1e-12 ? 0 : result
}

// tan(90°) has no answer (it shoots off to infinity), so it must be an Error, not a huge number.
function tan(x) {
  if (angleUnit === 'deg' && (((x - 90) % 180) + 180) % 180 === 0) return NaN
  return trig(Math.tan, x)
}

// 5! = 5 × 4 × 3 × 2 × 1. Only whole numbers from 0 to 170 (171! is too big for JavaScript).
function factorial(n) {
  if (!Number.isInteger(n) || n < 0 || n > 170) return NaN
  let result = 1
  for (let i = 2; i <= n; i++) result *= i
  return result
}

// ---------- The parser: reads the token list using the maths rules ----------
// Each function below handles one level of "stickiness", from loosest to tightest:
//   + and −   are loosest       (parseSum)
//   × and ÷   stick tighter     (parseProduct)
//   −5        a minus in front  (parseSigned)
//   ^         tighter still     (parsePower)
//   5! 3²     tightest          (parseAfter)
//   numbers, π, (brackets), sin(...)  are the building blocks (parseValue)
// Each level asks the next tighter level for its pieces. That is why 1 + 2 × 3 is 7.
// This style is called a "recursive descent parser".

export function evaluate(tokens, unit = 'deg') {
  angleUnit = unit
  const reader = { tokens, position: 0 }
  try {
    const value = parseSum(reader)
    if (reader.position < tokens.length) return null // something left over, like a stray ")"
    return value
  } catch {
    return null // the sum doesn't make sense, like "( )"
  }
}

const peek = (reader) => reader.tokens[reader.position]
const take = (reader) => reader.tokens[reader.position++]

function parseSum(reader) {
  let { value } = parseProduct(reader)
  while (peek(reader) === '+' || peek(reader) === '-') {
    const operator = take(reader)
    const right = parseProduct(reader)
    // "200 + 10%" means 200 + (10% of 200), so a lone percent here is a percent OF the left side.
    const amount = right.lonePercent ? value * right.value : right.value
    value = operator === '+' ? value + amount : value - amount
  }
  return value
}

function parseProduct(reader) {
  const start = reader.position
  let value = parseSigned(reader)
  while (true) {
    const next = peek(reader)
    if (next === '*' || next === '/') {
      take(reader)
      const right = parseSigned(reader)
      value = next === '*' ? value * right : value / right
    } else if (startsValue(next)) {
      value *= parseSigned(reader) // nothing between them means ×: 2π, 3(4 + 1), 2sin(30)
    } else {
      break
    }
  }
  const lonePercent = reader.position === start + 1 && isPercent(reader.tokens[start])
  return { value, lonePercent }
}

function parseSigned(reader) {
  if (peek(reader) === NEGATIVE) {
    take(reader)
    return -parseSigned(reader)
  }
  return parsePower(reader)
}

function parsePower(reader) {
  const base = parseAfter(reader)
  if (peek(reader) !== '^') return base
  take(reader)
  return base ** parseSigned(reader) // 2^3^2 is 2^(3^2), the way maths books do it
}

function parseAfter(reader) {
  let value = parseValue(reader)
  while (isPostfix(peek(reader))) {
    const postfix = take(reader)
    if (postfix === '!') value = factorial(value)
    else if (postfix === '²') value = value ** 2
    else value = 1 / value
  }
  return value
}

function parseValue(reader) {
  const token = take(reader)
  if (isNumber(token)) return Number(token)
  if (isPercent(token)) return Number(token.slice(0, -1)) / 100
  if (isConstant(token)) return CONSTANTS[token]

  if (opensBracket(token)) {
    const inside = parseSum(reader)
    // A missing ")" at the very end is fine: "2 × (3 + 4" is closed for you, like on a phone.
    if (peek(reader) === ')') take(reader)
    else if (peek(reader) !== undefined) throw new Error('Expected )')
    return token === '(' ? inside : FUNCTIONS[token].run(inside)
  }
  throw new Error(`Unexpected ${token}`)
}

// 0.1 + 0.2 is 0.30000000000000004 in JavaScript. Rounding to 12 significant digits hides that.
// Anything that isn't a normal number (÷ 0, √ of a negative, 171!) becomes Error.
export function format(result) {
  if (result === null || !Number.isFinite(result)) return 'Error'
  return String(Number.parseFloat(result.toPrecision(MAX_DIGITS)))
}

// ---------- Actions: one function per kind of button ----------
// Each one changes "s", a fresh copy of the state made by calculatorReducer below.

// After =, the next key either starts a new sum (a digit) or continues from the answer (an operator).
function startFresh(s, keepAnswer) {
  s.tokens = keepAnswer && s.result !== 'Error' ? [s.result] : []
  s.justEvaluated = false
  s.result = ''
}

function inputDigit(s, digit) {
  if (s.justEvaluated) startFresh(s, false)

  const last = lastToken(s)
  if (isPercent(last)) return // "10%5" makes no sense, so ignore the digit
  if (isNumber(last)) {
    if (last.replace(/[-.]/g, '').length < MAX_DIGITS) setLastToken(s, last === '0' ? digit : last + digit)
  } else {
    if (endsValue(last)) s.tokens.push('*') // "π5" or ")5" means × 5
    s.tokens.push(digit)
  }
}

function inputDecimal(s) {
  if (s.justEvaluated) startFresh(s, false)

  const last = lastToken(s)
  if (isPercent(last)) return
  if (isNumber(last)) {
    if (!last.includes('.') && !last.includes('e')) setLastToken(s, last + '.')
  } else {
    if (endsValue(last)) s.tokens.push('*')
    s.tokens.push('0.')
  }
}

function chooseOperator(s, operator) {
  if (s.justEvaluated) {
    if (s.result === 'Error') return
    startFresh(s, true)
  }

  const last = lastToken(s)
  if (last === undefined) s.tokens.push('0', operator) // pressing + first means "0 +"
  else if (opensBracket(last)) {
    if (operator === '-') s.tokens.push(NEGATIVE) // "(−5" is allowed, "(×5" is not
  } else if (last === NEGATIVE) return
  else if (isOperator(last)) setLastToken(s, operator) // pressing + then × swaps the operator
  else s.tokens.push(operator)
}

// sin, cos, √ and friends, plus a plain "(".
function openBracket(s, token) {
  if (s.justEvaluated) startFresh(s, false)
  s.tokens.push(token) // "2(" and "2sin(" are fine: the parser reads them as 2 × ...
}

function closeBracket(s) {
  if (s.justEvaluated) return
  if (openBrackets(s.tokens) > 0 && endsValue(lastToken(s))) s.tokens.push(')')
}

function inputConstant(s, name) {
  if (s.justEvaluated) startFresh(s, false)
  const last = lastToken(s)
  if (isPercent(last)) return
  if (endsValue(last)) s.tokens.push('*') // "2π" is shown as "2 × π" so it is obvious
  s.tokens.push(name)
}

// 5!, 3², 4⁻¹ act on whatever is just before them.
function inputPostfix(s, postfix) {
  if (s.justEvaluated) {
    if (s.result === 'Error') return
    startFresh(s, true)
  }
  const last = lastToken(s)
  if (endsValue(last) && !isPercent(last)) s.tokens.push(postfix)
}

function equals(s) {
  if (s.justEvaluated) return

  // Drop anything unfinished at the end: "5 +" or "2 × sin(" just mean "5" and "2".
  while (s.tokens.length && !endsValue(lastToken(s))) s.tokens.pop()
  if (s.tokens.length === 0) return

  // Close any brackets left open, so the history shows the full sum.
  for (let i = openBrackets(s.tokens); i > 0; i--) s.tokens.push(')')

  s.result = format(evaluate(s.tokens, s.angleUnit))
  s.justEvaluated = true
}

// Backspace: remove one character of a number, or one whole token (like "sin(").
// After =, it clears everything.
function deleteLast(s) {
  if (s.justEvaluated) return reset(s)

  const last = lastToken(s)
  if (last === undefined) return
  const isLongNumber = (isNumber(last) || isPercent(last)) && !/^-?\d$/.test(last) && !last.includes('e')
  if (isLongNumber) setLastToken(s, last.slice(0, -1))
  else s.tokens.pop()
}

// Percent acts on the number you are typing, not between two numbers, so it is not an operator.
// It just sticks a % on the number; the parser works out what it means when the maths runs.
function percent(s) {
  if (s.justEvaluated) {
    if (s.result === 'Error') return
    startFresh(s, true) // "90 %" after = means 90% of nothing before it, so 0.9
  }

  const last = lastToken(s)
  if (isNumber(last)) setLastToken(s, last + '%')
}

function reset(s) {
  s.tokens = []
  s.justEvaluated = false
  s.result = ''
}

// ---------- The reducer: one entry point for every button and key ----------
// React calls this with the current state and what was pressed, and uses whatever comes back.
export function calculatorReducer(state, { action, value }) {
  // A copy, so the old state is never changed. React only redraws when it gets a NEW object.
  const s = { ...state, tokens: [...state.tokens] }

  if (action === 'digit') inputDigit(s, value)
  else if (action === 'decimal') inputDecimal(s)
  else if (action === 'operator') chooseOperator(s, value)
  else if (action === 'equals') equals(s)
  else if (action === 'clear') reset(s)
  else if (action === 'delete') deleteLast(s)
  else if (action === 'percent') percent(s)
  else if (action === 'open') openBracket(s, value)
  else if (action === 'close') closeBracket(s)
  else if (action === 'constant') inputConstant(s, value)
  else if (action === 'postfix') inputPostfix(s, value)
  else if (action === 'second') s.second = !s.second
  else if (action === 'angle') s.angleUnit = s.angleUnit === 'deg' ? 'rad' : 'deg'
  else return state // unknown action: nothing changes

  return s
}

// ---------- Text for the screen ----------
// Top line: the sum ("12 + 7"). Bottom line: the answer.
// While typing, the sum is big and a live preview of the answer is small.
// After =, they swap: the answer is big and the sum is small.
const showToken = (token) => (isFunction(token) ? FUNCTIONS[token].label : (SYMBOLS[token] ?? token))

export function expressionText(state) {
  if (state.tokens.length === 0) return '0'
  return state.tokens.map(showToken).join('')
}

export function previewText(state) {
  const onlyOneNumber = state.tokens.length === 1 && !isPercent(state.tokens[0])
  if (state.tokens.length === 0 || onlyOneNumber || !endsValue(lastToken(state))) return ''
  const preview = format(evaluate(state.tokens, state.angleUnit))
  return preview === 'Error' ? '' : preview
}
