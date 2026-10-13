import './style.css'

// ---------- State: the whole sum is kept as a list of pieces (tokens) ----------
// "12 + 7 × 3" is stored as ['12', '+', '7', '*', '3'].
// Numbers stay as text while you type them, so "0." and "1.50" survive.
const state = {
  tokens: [],
  justEvaluated: false, // true right after =, so the next key knows to start fresh or continue from the answer
  result: '', // the answer shown after =
}

const MAX_DIGITS = 12
const OPERATORS = ['+', '-', '*', '/']
const SYMBOLS = { '+': '+', '-': '−', '*': '×', '/': '÷' } // what humans see vs what the code uses

const display = document.getElementById('display')
const expressionEl = document.getElementById('expression')
const resultEl = document.getElementById('result')
const keys = document.querySelector('.keys')

// ---------- Small helpers ----------
const isOperator = (token) => OPERATORS.includes(token)
const lastToken = () => state.tokens[state.tokens.length - 1]
const setLastToken = (value) => (state.tokens[state.tokens.length - 1] = value)

// ---------- Pure maths: no DOM here, so it is easy to test ----------
// Works out the sum with the normal maths rules: × and ÷ before + and −.
// Returns a number, or null for "can't be done" (dividing by zero).
function evaluate(tokens) {
  if (tokens.length === 0) return 0
  if (isOperator(tokens[tokens.length - 1])) tokens = tokens.slice(0, -1) // ignore a trailing "+"

  // Pass 1: do every × and ÷ from left to right, leaving only + and −.
  const terms = [Number(tokens[0])]
  for (let i = 1; i < tokens.length; i += 2) {
    const operator = tokens[i]
    const number = Number(tokens[i + 1])

    if (operator === '*') terms[terms.length - 1] *= number
    else if (operator === '/') {
      if (number === 0) return null
      terms[terms.length - 1] /= number
    } else {
      terms.push(operator, number)
    }
  }

  // Pass 2: do the + and − from left to right.
  let total = terms[0]
  for (let i = 1; i < terms.length; i += 2) {
    total = terms[i] === '+' ? total + terms[i + 1] : total - terms[i + 1]
  }
  return total
}

// 0.1 + 0.2 is 0.30000000000000004 in JavaScript. Rounding to 12 significant digits hides that.
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
  if (last === undefined || isOperator(last)) {
    state.tokens.push(digit)
  } else if (last.replace(/[-.]/g, '').length < MAX_DIGITS) {
    setLastToken(last === '0' ? digit : last + digit)
  }
}

function inputDecimal() {
  if (state.justEvaluated) startFresh(false)

  const last = lastToken()
  if (last === undefined || isOperator(last)) state.tokens.push('0.')
  else if (!last.includes('.')) setLastToken(last + '.')
}

function chooseOperator(operator) {
  if (state.justEvaluated) {
    if (state.result === 'Error') return
    startFresh(true)
  }

  const last = lastToken()
  if (last === undefined) state.tokens.push('0', operator) // pressing + first means "0 +"
  else if (isOperator(last)) setLastToken(operator) // pressing + then × swaps the operator
  else state.tokens.push(operator)
}

function equals() {
  if (state.tokens.length === 0 || state.justEvaluated) return
  if (isOperator(lastToken())) state.tokens.pop() // "5 +" then = just means "5"

  state.result = format(evaluate(state.tokens))
  state.justEvaluated = true
}

// Backspace: remove one character. After =, it clears everything.
function deleteLast() {
  if (state.justEvaluated) return reset()

  const last = lastToken()
  if (last === undefined) return
  if (isOperator(last) || last.length === 1 || last === '-0' || /^-\d$/.test(last)) {
    state.tokens.pop()
  } else {
    setLastToken(last.slice(0, -1))
  }
}

// Percent acts on the number you are typing, not between two numbers, so it is not an operator.
// After + or −, it means "this percent OF everything before it": 200 + 10 % -> 200 + 20.
// Everywhere else it just divides by 100: 50 % -> 0.5, and 200 × 10 % -> 200 × 0.1.
function percent() {
  if (state.justEvaluated) startFresh(true)

  const last = lastToken()
  if (last === undefined || isOperator(last)) return

  const value = Number(last)
  const before = state.tokens.slice(0, -2) // everything before "+ 10"
  const operator = state.tokens[state.tokens.length - 2]

  if ((operator === '+' || operator === '-') && before.length > 0) {
    const base = evaluate(before)
    setLastToken(format(base === null ? null : (base * value) / 100))
  } else {
    setLastToken(format(value / 100))
  }
  if (lastToken() === 'Error') {
    state.result = 'Error'
    state.justEvaluated = true
  }
}

function reset() {
  state.tokens = []
  state.justEvaluated = false
  state.result = ''
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

  render()
}

// ---------- Mouse: one listener on the container handles every button ----------
keys.addEventListener('click', (event) => {
  const button = event.target.closest('button')
  if (!button) return // clicked the gap between buttons

  handle(button.dataset.action, button.dataset.value)
})

// ---------- Keyboard: translate a key into the same action a button would send ----------
const KEY_MAP = {
  '+': ['operator', '+'],
  '-': ['operator', '-'],
  '*': ['operator', '*'],
  x: ['operator', '*'],
  '/': ['operator', '/'],
  '%': ['percent'],
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
  const button = keys.querySelector(selector)
  if (!button) return

  button.classList.add('pressed')
  setTimeout(() => button.classList.remove('pressed'), 100)
}

// ---------- Drawing the screen from state ----------
// Top line: the sum ("12 + 7"). Bottom line: the answer.
// While typing, the sum is big and a live preview of the answer is small.
// After =, they swap: the answer is big and the sum is small.
function expressionText() {
  if (state.tokens.length === 0) return '0'
  return state.tokens.map((token) => SYMBOLS[token] ?? token).join(' ')
}

function previewText() {
  const hasOperator = state.tokens.some(isOperator)
  if (!hasOperator || isOperator(lastToken())) return ''
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

render()
