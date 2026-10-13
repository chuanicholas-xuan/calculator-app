import './style.css'

// ---------- State: everything the calculator needs to remember ----------
const state = {
  current: '0', // the number on the screen, kept as text so "0." and "007" behave
  previous: null, // the number entered before the operator
  operator: null, // '+', '-', '*' or '/'
  waitingForNext: false, // true right after an operator or =, so the next digit starts a new number
}

const MAX_DIGITS = 12

const display = document.getElementById('display')
const keys = document.querySelector('.keys')

// ---------- Pure maths: no DOM here, so it is easy to test ----------
function calculate(a, b, operator) {
  switch (operator) {
    case '+':
      return a + b
    case '-':
      return a - b
    case '*':
      return a * b
    case '/':
      return b === 0 ? null : a / b // null means "can't divide by zero"
  }
}

// 0.1 + 0.2 is 0.30000000000000004 in JavaScript. Rounding to 12 significant digits hides that.
function format(result) {
  if (result === null || !Number.isFinite(result)) return 'Error'
  return String(Number.parseFloat(result.toPrecision(MAX_DIGITS)))
}

// ---------- Actions: one function per kind of button ----------
function inputDigit(digit) {
  if (state.waitingForNext || state.current === 'Error') {
    state.current = digit
    state.waitingForNext = false
  } else if (state.current.replace(/[-.]/g, '').length < MAX_DIGITS) {
    state.current = state.current === '0' ? digit : state.current + digit
  }
}

function inputDecimal() {
  if (state.waitingForNext || state.current === 'Error') {
    state.current = '0.'
    state.waitingForNext = false
  } else if (!state.current.includes('.')) {
    state.current += '.'
  }
}

function chooseOperator(nextOperator) {
  if (state.current === 'Error') return

  // Pressing 5 + 3 - should first work out 5 + 3 = 8, then continue with "8 -".
  if (state.operator && !state.waitingForNext) {
    state.current = format(calculate(state.previous, Number(state.current), state.operator))
    if (state.current === 'Error') return reset('Error')
  }

  state.previous = Number(state.current)
  state.operator = nextOperator
  state.waitingForNext = true
}

function equals() {
  if (state.operator === null || state.waitingForNext) return

  const result = format(calculate(state.previous, Number(state.current), state.operator))
  reset(result)
  state.waitingForNext = true
}

function reset(screen = '0') {
  state.current = screen
  state.previous = null
  state.operator = null
  state.waitingForNext = false
}

// ---------- Wiring: one listener on the container handles every button ----------
keys.addEventListener('click', (event) => {
  const button = event.target.closest('button')
  if (!button) return // clicked the gap between buttons

  const { action, value } = button.dataset

  if (action === 'digit') inputDigit(value)
  else if (action === 'decimal') inputDecimal()
  else if (action === 'operator') chooseOperator(value)
  else if (action === 'equals') equals()
  else if (action === 'clear') reset()

  render()
})

// textContent (not innerHTML) so the screen can only ever show text, never run HTML.
function render() {
  display.textContent = state.current
}

render()
