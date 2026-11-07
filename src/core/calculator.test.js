import { describe, test, expect } from 'vitest'
import { calculatorReducer, initialState, evaluate, format, expressionText, previewText } from './calculator.js'

// Presses buttons one after another, the same way the keypad does, and returns the final state.
// Each button is [action, value], e.g. ['digit', '7'] or ['operator', '+'].
function press(...buttons) {
  return buttons.reduce((state, [action, value]) => calculatorReducer(state, { action, value }), initialState)
}

// Short names so a whole sum fits on one line.
const d = (digit) => ['digit', digit]
const op = (operator) => ['operator', operator]
const equals = ['equals']

describe('the maths rules (evaluate)', () => {
  test('× and ÷ happen before + and −', () => {
    expect(evaluate(['2', '+', '3', '*', '4'])).toBe(14)
    expect(evaluate(['10', '-', '6', '/', '2'])).toBe(7)
  })

  test('brackets happen first', () => {
    expect(evaluate(['(', '2', '+', '3', ')', '*', '4'])).toBe(20)
  })

  test('a power of a power is worked out from the right', () => {
    expect(evaluate(['2', '^', '3', '^', '2'])).toBe(512) // 2^(3^2), not (2^3)^2 = 64
  })

  test('a number next to a bracket or π means multiply', () => {
    expect(evaluate(['2', 'π'])).toBeCloseTo(2 * Math.PI)
    expect(evaluate(['3', '(', '4', '+', '1', ')'])).toBe(15)
  })

  test('a missing ) at the end is closed for you', () => {
    expect(evaluate(['2', '*', '(', '3', '+', '4'])).toBe(14)
  })

  test('trig uses degrees or radians', () => {
    expect(evaluate(['sin', '30', ')'], 'deg')).toBeCloseTo(0.5)
    expect(evaluate(['sin', '180', ')'], 'deg')).toBe(0) // not 0.000000000000000122
    expect(evaluate(['cos', '0', ')'], 'rad')).toBe(1)
  })

  test('factorial, square and 1/x', () => {
    expect(evaluate(['5', '!'])).toBe(120)
    expect(evaluate(['3', '²'])).toBe(9)
    expect(evaluate(['4', '⁻¹'])).toBe(0.25)
  })

  test('percent after + or − is a percent of the left side', () => {
    expect(evaluate(['200', '+', '10%'])).toBeCloseTo(220)
    expect(evaluate(['200', '*', '10%'])).toBeCloseTo(20)
  })

  test('nonsense sums give null instead of crashing', () => {
    expect(evaluate(['(', ')'])).toBe(null)
    expect(evaluate(['2', ')'])).toBe(null)
  })
})

describe('format', () => {
  test('hides the 0.1 + 0.2 rounding error', () => {
    expect(format(0.1 + 0.2)).toBe('0.3')
  })

  test('impossible answers show Error', () => {
    expect(format(1 / 0)).toBe('Error') // ÷ 0
    expect(format(Math.sqrt(-1))).toBe('Error') // √ of a negative
    expect(format(evaluate(['171', '!']))).toBe('Error') // too big
    expect(format(evaluate(['tan', '90', ')']))).toBe('Error')
    expect(format(null)).toBe('Error')
  })
})

describe('pressing buttons (calculatorReducer)', () => {
  test('2 + 3 × 4 = shows 14', () => {
    const state = press(d('2'), op('+'), d('3'), op('*'), d('4'), equals)
    expect(state.result).toBe('14')
    expect(expressionText(state)).toBe('2 + 3 × 4')
  })

  test('5 + = ignores the unfinished + and gives 5', () => {
    expect(press(d('5'), op('+'), equals).result).toBe('5')
  })

  test('pressing + then × swaps the operator', () => {
    const state = press(d('6'), op('+'), op('*'), d('2'), equals)
    expect(state.result).toBe('12')
  })

  test('a digit after = starts a new sum, an operator continues from the answer', () => {
    const answer = press(d('2'), op('+'), d('2'), equals)
    expect(expressionText(calculatorReducer(answer, { action: 'digit', value: '7' }))).toBe('7')
    expect(expressionText(calculatorReducer(answer, { action: 'operator', value: '+' }))).toBe('4 + ')
  })

  test('only one decimal point per number', () => {
    const state = press(d('1'), ['decimal'], ['decimal'], d('5'))
    expect(expressionText(state)).toBe('1.5')
  })

  test('backspace removes one digit; after = it clears everything', () => {
    expect(expressionText(press(d('1'), d('2'), d('3'), ['delete']))).toBe('12')
    expect(expressionText(press(d('9'), op('+'), d('1'), equals, ['delete']))).toBe('0')
  })

  test('real sums are saved for History, a single number is not', () => {
    expect(press(d('2'), op('+'), d('3'), equals).saved).toEqual({ expression: '2 + 3', result: '5' })
    expect(press(d('5'), equals).saved).toBe(null)
  })

  test('the live preview shows the answer while typing', () => {
    expect(previewText(press(d('8'), op('/'), d('2')))).toBe('4')
    expect(previewText(press(d('8'), op('/')))).toBe('') // nothing to show yet
  })

  test('the old state is never changed', () => {
    const before = press(d('1'))
    const tokens = [...before.tokens]
    calculatorReducer(before, { action: 'digit', value: '2' })
    expect(before.tokens).toEqual(tokens)
  })
})
