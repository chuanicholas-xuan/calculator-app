import './style.css'
import './themes.css'
import { isConverterOpen, handleConverterKey } from './converter.js'

// ---------- State: the whole sum is kept as a list of pieces (tokens) ----------
// "12 + sin(30) × 2" is stored as ['12', '+', 'sin', '30', ')', '*', '2'].
// Numbers stay as text while you type them, so "0." and "1.50" survive.
// A percent stays on its number, like '10%', so the screen and the history can show it.
const state = {
  tokens: [],
  justEvaluated: false, // true right after =, so the next key knows to start fresh or continue from the answer
  result: '', // the answer shown after =
  angleUnit: 'deg', // sin, cos and tan read their number as degrees or radians
  second: false, // the "2nd" key swaps some buttons to their opposite (sin -> sin⁻¹)
}

const MAX_DIGITS = 12

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

const calculator = document.querySelector('.calculator')
const display = document.getElementById('display')
const expressionEl = document.getElementById('expression')
const resultEl = document.getElementById('result')
const keys = document.querySelector('.keys')
const scienceKeys = document.querySelector('.science-keys')
const modeButton = document.getElementById('mode-toggle')

const historyPanel = document.getElementById('history')
const historyList = document.getElementById('history-list')
const historyOpenButton = document.getElementById('history-open')
const historyCloseButton = document.getElementById('history-close')
const historyClearButton = document.getElementById('history-clear')

const settingsPanel = document.getElementById('settings')
const settingsOpenButton = document.getElementById('settings-open')
const settingsCloseButton = document.getElementById('settings-close')
const themeList = document.getElementById('theme-list')

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

const lastToken = () => state.tokens[state.tokens.length - 1]
const setLastToken = (value) => (state.tokens[state.tokens.length - 1] = value)

// How many brackets are still open, so ")" is only allowed when there is one to close.
function openBrackets() {
  let count = 0
  for (const token of state.tokens) {
    if (opensBracket(token)) count++
    else if (token === ')') count--
  }
  return count
}

// ---------- Pure maths: no DOM here, so it is easy to test ----------
const toRadians = (x) => (state.angleUnit === 'deg' ? (x * Math.PI) / 180 : x)
const fromRadians = (x) => (state.angleUnit === 'deg' ? (x * 180) / Math.PI : x)

// sin(180°) comes out as 0.000000000000000122 because π can't be stored exactly. Snap it to 0.
function trig(fn, x) {
  const result = fn(toRadians(x))
  return Math.abs(result) < 1e-12 ? 0 : result
}

// tan(90°) has no answer (it shoots off to infinity), so it must be an Error, not a huge number.
function tan(x) {
  if (state.angleUnit === 'deg' && (((x - 90) % 180) + 180) % 180 === 0) return NaN
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
// Each level asks the next tighter level for its pieces. That is why 1 + 2 × 3 is 7:
// parseSum asks parseProduct for "2 × 3" as one piece before it does the +.
// This style is called a "recursive descent parser".

function evaluate(tokens) {
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
function format(result) {
  if (result === null || !Number.isFinite(result)) return 'Error'
  return String(Number.parseFloat(result.toPrecision(MAX_DIGITS)))
}

// After =, the next key either starts a new sum (a digit) or continues from the answer (an operator).
function startFresh(keepAnswer) {
  const answer = state.result
  state.tokens = keepAnswer && answer !== 'Error' ? [answer] : []
  state.justEvaluated = false
  state.result = ''
}

// ---------- Actions: one function per kind of button ----------
function inputDigit(digit) {
  if (state.justEvaluated) startFresh(false)

  const last = lastToken()
  if (isPercent(last)) return // "10%5" makes no sense, so ignore the digit
  if (isNumber(last)) {
    if (last.replace(/[-.]/g, '').length < MAX_DIGITS) setLastToken(last === '0' ? digit : last + digit)
  } else {
    if (endsValue(last)) state.tokens.push('*') // "π5" or ")5" means × 5
    state.tokens.push(digit)
  }
}

function inputDecimal() {
  if (state.justEvaluated) startFresh(false)

  const last = lastToken()
  if (isPercent(last)) return
  if (isNumber(last)) {
    if (!last.includes('.') && !last.includes('e')) setLastToken(last + '.')
  } else {
    if (endsValue(last)) state.tokens.push('*')
    state.tokens.push('0.')
  }
}

function chooseOperator(operator) {
  if (state.justEvaluated) {
    if (state.result === 'Error') return
    startFresh(true)
  }

  const last = lastToken()
  if (last === undefined) state.tokens.push('0', operator) // pressing + first means "0 +"
  else if (opensBracket(last)) {
    if (operator === '-') state.tokens.push(NEGATIVE) // "(−5" is allowed, "(×5" is not
  } else if (last === NEGATIVE) return
  else if (isOperator(last)) setLastToken(operator) // pressing + then × swaps the operator
  else state.tokens.push(operator)
}

// sin, cos, √ and friends, plus a plain "(".
function openBracket(token) {
  if (state.justEvaluated) startFresh(false)
  state.tokens.push(token) // "2(" and "2sin(" are fine: the parser reads them as 2 × ...
}

function closeBracket() {
  if (state.justEvaluated) return
  if (openBrackets() > 0 && endsValue(lastToken())) state.tokens.push(')')
}

function inputConstant(name) {
  if (state.justEvaluated) startFresh(false)
  const last = lastToken()
  if (isPercent(last)) return
  if (endsValue(last)) state.tokens.push('*') // "2π" is shown as "2 × π" so it is obvious
  state.tokens.push(name)
}

// 5!, 3², 4⁻¹ act on whatever is just before them.
function inputPostfix(postfix) {
  if (state.justEvaluated) {
    if (state.result === 'Error') return
    startFresh(true)
  }
  const last = lastToken()
  if (endsValue(last) && !isPercent(last)) state.tokens.push(postfix)
}

function equals() {
  if (state.justEvaluated) return

  // Drop anything unfinished at the end: "5 +" or "2 × sin(" just mean "5" and "2".
  while (state.tokens.length && !endsValue(lastToken())) state.tokens.pop()
  if (state.tokens.length === 0) return

  // Close any brackets left open, so the history shows the full sum.
  for (let i = openBrackets(); i > 0; i--) state.tokens.push(')')

  state.result = format(evaluate(state.tokens))
  state.justEvaluated = true

  // Only real sums go in the history: "5 =" or a sum that ended in Error is not worth keeping.
  if (state.tokens.length > 1 || isPercent(state.tokens[0])) {
    if (state.result !== 'Error') addToHistory(expressionText(), state.result)
  }
}

// Backspace: remove one character of a number, or one whole token (like "sin(").
// After =, it clears everything.
function deleteLast() {
  if (state.justEvaluated) return reset()

  const last = lastToken()
  if (last === undefined) return
  const isLongNumber = (isNumber(last) || isPercent(last)) && !/^-?\d$/.test(last) && !last.includes('e')
  if (isLongNumber) setLastToken(last.slice(0, -1))
  else state.tokens.pop()
}

// Percent acts on the number you are typing, not between two numbers, so it is not an operator.
// It just sticks a % on the number; the parser works out what it means when the maths runs.
function percent() {
  if (state.justEvaluated) {
    if (state.result === 'Error') return
    startFresh(true) // "90 %" after = means 90% of nothing before it, so 0.9
  }

  const last = lastToken()
  if (isNumber(last)) setLastToken(last + '%')
}

function reset() {
  state.tokens = []
  state.justEvaluated = false
  state.result = ''
}

// ---------- Scientific mode switches ----------
function toggleSecond() {
  state.second = !state.second
  // Buttons with a "2nd" version keep both in data-* attributes; swap which one is showing.
  for (const button of scienceKeys.querySelectorAll('[data-second-value]')) {
    const useSecond = state.second
    button.dataset.value = useSecond ? button.dataset.secondValue : button.dataset.firstValue
    button.textContent = useSecond ? button.dataset.secondLabel : button.dataset.firstLabel
    button.dataset.action = useSecond ? button.dataset.secondAction : button.dataset.firstAction
  }
  scienceKeys.querySelector('[data-action="second"]').classList.toggle('active', state.second)
}

function toggleAngleUnit() {
  state.angleUnit = state.angleUnit === 'deg' ? 'rad' : 'deg'
  scienceKeys.querySelector('[data-action="angle"]').textContent = state.angleUnit
}

// Remember whether scientific mode was on, so a refresh doesn't switch it off.
const MODE_KEY = 'calculator-mode'

function setScientific(on) {
  calculator.classList.toggle('scientific', on)
  modeButton.setAttribute('aria-pressed', String(on))
  try {
    localStorage.setItem(MODE_KEY, on ? 'scientific' : 'basic')
  } catch {
    // Storage blocked: the mode just won't be remembered.
  }
}

modeButton.addEventListener('click', () => setScientific(!calculator.classList.contains('scientific')))

try {
  setScientific(localStorage.getItem(MODE_KEY) === 'scientific')
} catch {
  setScientific(false)
}

// ---------- One entry point for every input, whether it came from a click or a key ----------
function handle(action, value) {
  if (action === 'digit') inputDigit(value)
  else if (action === 'decimal') inputDecimal()
  else if (action === 'operator') chooseOperator(value)
  else if (action === 'equals') equals()
  else if (action === 'clear') reset()
  else if (action === 'delete') deleteLast()
  else if (action === 'percent') percent()
  else if (action === 'open') openBracket(value)
  else if (action === 'close') closeBracket()
  else if (action === 'constant') inputConstant(value)
  else if (action === 'postfix') inputPostfix(value)
  else if (action === 'second') toggleSecond()
  else if (action === 'angle') toggleAngleUnit()

  render()
}

// ---------- Mouse: one listener per button container handles every button inside it ----------
function onKeyClick(event) {
  const button = event.target.closest('button')
  if (!button) return // clicked the gap between buttons

  handle(button.dataset.action, button.dataset.value)
}

keys.addEventListener('click', onKeyClick)
scienceKeys.addEventListener('click', onKeyClick)

// ---------- Keyboard: translate a key into the same action a button would send ----------
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

function keyToAction(key) {
  if (key >= '0' && key <= '9' && key.length === 1) return ['digit', key]
  return KEY_MAP[key] ?? KEY_MAP[key.toLowerCase()] ?? null
}

document.addEventListener('keydown', (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return // leave shortcuts like Ctrl+C alone

  // While History or Settings is open, the number keys should not type into the hidden calculator.
  if (!historyPanel.hidden) {
    if (event.key === 'Escape') closeHistory()
    return
  }
  if (!settingsPanel.hidden) {
    if (event.key === 'Escape') closeSettings()
    return
  }
  if (isConverterOpen()) return handleConverterKey(event) // lets you type into the amount box

  const mapped = keyToAction(event.key)
  if (!mapped) return

  // Stops Enter from also "clicking" whichever button has focus, and "/" from opening quick-find.
  event.preventDefault()

  const [action, value] = mapped
  handle(action, value)
  flash(action, value)
})

// Briefly highlight the on-screen button that matches the key, so it feels like it was pressed.
function flash(action, value) {
  const selector = value
    ? `[data-action="${action}"][data-value="${value}"]`
    : `[data-action="${action}"]`
  const button = calculator.querySelector(selector)
  if (!button) return

  button.classList.add('pressed')
  setTimeout(() => button.classList.remove('pressed'), 100)
}

// ---------- Drawing the screen from state ----------
// Top line: the sum ("12 + 7"). Bottom line: the answer.
// While typing, the sum is big and a live preview of the answer is small.
// After =, they swap: the answer is big and the sum is small.
function showToken(token) {
  if (isFunction(token)) return FUNCTIONS[token].label
  return SYMBOLS[token] ?? token
}

function expressionText() {
  if (state.tokens.length === 0) return '0'
  return state.tokens.map(showToken).join('')
}

function previewText() {
  const onlyOneNumber = state.tokens.length === 1 && !isPercent(state.tokens[0])
  if (state.tokens.length === 0 || onlyOneNumber || !endsValue(lastToken())) return ''
  const preview = format(evaluate(state.tokens))
  return preview === 'Error' ? '' : preview
}

// textContent (not innerHTML) so the screen can only ever show text, never run HTML.
function render() {
  if (state.justEvaluated) {
    expressionEl.textContent = state.tokens.length ? `${expressionText()} =` : ''
    resultEl.textContent = state.result
  } else {
    expressionEl.textContent = expressionText()
    resultEl.textContent = previewText()
  }
  display.classList.toggle('done', state.justEvaluated)
}

// ---------- History: past sums, saved in the browser so they survive a refresh ----------
// localStorage is a small notebook the browser keeps for this website. It only stores text,
// so the list is turned into JSON text to save it, and back into a list to read it.
const HISTORY_KEY = 'calculator-history'
const MAX_HISTORY = 100 // keep the newest 100 so the notebook never grows forever

// Anything could be in storage (an older version of the app, or someone editing it by hand
// in DevTools), so check every entry instead of trusting it.
function loadHistory() {
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

function saveHistory() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(historyEntries))
  } catch {
    // Storage full or blocked: the history still works until the page is closed.
  }
}

let historyEntries = loadHistory() // newest first

function addToHistory(expression, result) {
  historyEntries.unshift({ expression, result, time: Date.now() })
  historyEntries = historyEntries.slice(0, MAX_HISTORY)
  saveHistory()
}

// Builds the list with createElement + textContent. Saved text is never treated as HTML,
// so a booby-trapped entry like "<img onerror=...>" just shows up as harmless text.
function renderHistory() {
  historyList.replaceChildren() // empty the list before drawing it again
  historyClearButton.disabled = historyEntries.length === 0

  if (historyEntries.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'history-empty'
    empty.textContent = 'No history yet'
    historyList.append(empty)
    return
  }

  // Entries are newest first, so a new date heading starts whenever the day changes.
  let currentDay = ''
  let group
  for (const entry of historyEntries) {
    const day = new Date(entry.time).toLocaleDateString() // 14/10/2026 or 10/14/2026, by your computer's settings
    if (day !== currentDay) {
      currentDay = day
      group = document.createElement('section')
      group.className = 'history-day'
      const heading = document.createElement('h3')
      heading.textContent = day
      group.append(heading)
      historyList.append(group)
    }

    const item = document.createElement('button')
    item.type = 'button'
    item.className = 'history-item'
    item.dataset.result = entry.result
    item.textContent = `${entry.expression} = ${entry.result}`
    group.append(item)
  }
}

function openHistory() {
  renderHistory()
  historyPanel.hidden = false
  historyCloseButton.focus() // keyboard users land inside the panel
}

function closeHistory() {
  historyPanel.hidden = true
  historyOpenButton.focus()
}

historyOpenButton.addEventListener('click', openHistory)
historyCloseButton.addEventListener('click', closeHistory)

historyClearButton.addEventListener('click', () => {
  // Deleting can't be undone, so ask first.
  if (!confirm('Clear all history?')) return
  historyEntries = []
  saveHistory()
  renderHistory()
})

// Tapping an old sum brings its answer back so you can keep calculating with it.
historyList.addEventListener('click', (event) => {
  const item = event.target.closest('.history-item')
  if (!item || !Number.isFinite(Number(item.dataset.result))) return

  state.tokens = [item.dataset.result]
  state.justEvaluated = false
  state.result = ''
  render()
  closeHistory()
})

// ---------- Settings: themes ----------
// The theme is just an attribute on <html>, like <html data-theme="neon">.
// themes.css has rules that only apply when that attribute matches, so changing
// one attribute restyles the whole app. No colours are set from JavaScript.
const THEMES = ['classic', 'glass', 'bold', 'neon', 'daylight']
const THEME_KEY = 'calculator-theme'

function applyTheme(name) {
  // Storage can be edited by hand, so only accept a name we know. Anything else means Classic.
  const theme = THEMES.includes(name) ? name : 'classic'
  document.documentElement.dataset.theme = theme

  for (const card of themeList.querySelectorAll('[data-theme-option]')) {
    card.setAttribute('aria-pressed', String(card.dataset.themeOption === theme))
  }

  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // Storage blocked: the theme still works until the page is closed.
  }
}

themeList.addEventListener('click', (event) => {
  const card = event.target.closest('[data-theme-option]')
  if (card) applyTheme(card.dataset.themeOption)
})

function openSettings() {
  settingsPanel.hidden = false
  settingsCloseButton.focus()
}

function closeSettings() {
  settingsPanel.hidden = true
  settingsOpenButton.focus()
}

settingsOpenButton.addEventListener('click', openSettings)
settingsCloseButton.addEventListener('click', closeSettings)

try {
  applyTheme(localStorage.getItem(THEME_KEY))
} catch {
  applyTheme('classic')
}

render()
