import { describe, test, expect } from 'vitest'
import { UNIT_CONVERTERS, convertUnits, cleanAmount, formatNumber } from './units.js'

// Finds a unit by its code, e.g. unit('length', 'km').
const unit = (converter, code) => UNIT_CONVERTERS[converter].units.find((u) => u.code === code)
const convert = (converter, amount, from, to) =>
  convertUnits(amount, unit(converter, from), unit(converter, to))

describe('convertUnits', () => {
  test('length', () => {
    expect(convert('length', 1, 'mi', 'km')).toBeCloseTo(1.609344)
    expect(convert('length', 1, 'ft', 'in')).toBeCloseTo(12)
  })

  test('mass', () => {
    expect(convert('mass', 1, 'kg', 'lb')).toBeCloseTo(2.20462, 5)
    expect(convert('mass', 1, 'jin', 'g')).toBeCloseTo(500)
  })

  test('temperature needs more than a multiply', () => {
    expect(convert('temperature', 0, '°C', '°F')).toBe(32)
    expect(convert('temperature', 100, '°C', '°F')).toBe(212)
    expect(convert('temperature', -40, '°C', '°F')).toBe(-40) // the one point where both scales agree
    expect(convert('temperature', 0, '°C', 'K')).toBe(273.15)
  })

  test('converting there and back gives the number you started with', () => {
    for (const [key, converter] of Object.entries(UNIT_CONVERTERS)) {
      const [from, to] = converter.defaults
      const there = convert(key, 42, from, to)
      expect(convert(key, there, to, from)).toBeCloseTo(42)
    }
  })
})

describe('cleanAmount', () => {
  test('keeps digits and one decimal point', () => {
    expect(cleanAmount('1a2.3.4', false)).toBe('12.34')
  })

  test('keeps a minus sign only where negatives are allowed', () => {
    expect(cleanAmount('-5', true)).toBe('-5')
    expect(cleanAmount('-5', false)).toBe('5')
  })
})

describe('formatNumber', () => {
  test('huge and tiny numbers switch to science notation', () => {
    expect(formatNumber(9.4607e24)).toBe('9.4607e+24')
    expect(formatNumber(1e-9)).toBe('1e-9')
  })

  test('impossible answers show Error', () => {
    expect(formatNumber(Infinity)).toBe('Error')
  })
})
