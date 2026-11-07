// Tests for the "everyday tools": finance, date, discount, numeral system and BMI.
import { describe, test, expect } from 'vitest'
import { loanPlan } from './finance.js'
import { parseDate, daysBetween, yearsMonthsDays } from './date.js'
import { discountPlan } from './discount.js'
import { parseInBase, rebase, cleanInBase } from './numeral.js'
import { bmiValue, category } from './bmi.js'

describe('finance: loanPlan', () => {
  test('equal monthly payment on 100,000 at 4% over 30 years', () => {
    const plan = loanPlan(100000, 4, 30, 'annuity')
    expect(plan.firstPayment).toBeCloseTo(477.42, 2) // the figure any bank calculator gives
  })

  test('0% interest just splits the loan (no divide by zero)', () => {
    expect(loanPlan(1200, 0, 1, 'annuity').firstPayment).toBe(100)
  })

  test('flat rate charges interest on the whole loan for the whole term', () => {
    const plan = loanPlan(10000, 3, 5, 'flat')
    expect(plan.totalInterest).toBeCloseTo(1500)
    expect(plan.firstPayment).toBeCloseTo(191.67, 2)
  })

  test('equal principal payments start high and get smaller', () => {
    const plan = loanPlan(12000, 12, 1, 'principal')
    expect(plan.firstPayment).toBeCloseTo(1120) // 1000 of the loan + 1% interest on 12,000
    expect(plan.drop).toBeCloseTo(10)
  })

  test('an empty loan gives no plan', () => {
    expect(loanPlan(0, 4, 30, 'annuity')).toBe(null)
  })
})

describe('date', () => {
  test('rejects impossible dates', () => {
    expect(parseDate('2026-02-31')).toBe(null)
    expect(parseDate('2028-02-29')).not.toBe(null) // 2028 is a leap year
  })

  test('days between two dates', () => {
    expect(daysBetween(parseDate('2026-01-01'), parseDate('2026-12-31'))).toBe(364)
  })

  test('one month after 31 January is the end of February', () => {
    const result = yearsMonthsDays(parseDate('2026-01-31'), parseDate('2026-02-28'))
    expect(result).toEqual({ years: 0, months: 0, days: 28 })
  })
})

describe('discount: discountPlan', () => {
  test('20% off plus an extra 10% off is 28% off, not 30%', () => {
    const plan = discountPlan(100, 20, 10)
    expect(plan.final).toBeCloseTo(72)
    expect(plan.totalPercent).toBeCloseTo(28)
  })

  test('a discount over 100% is rejected', () => {
    expect(discountPlan(100, 150)).toBe(null)
  })
})

describe('numeral system', () => {
  test('FF in hexadecimal is 255', () => {
    expect(parseInBase('FF', 16)).toBe(255n)
    expect(rebase('255', 10, 2)).toBe('11111111')
  })

  test('a digit that does not exist in the base is rejected', () => {
    expect(parseInBase('2', 2)).toBe(null)
    expect(cleanInBase('dead beef', 16)).toBe('DEADBEEF')
  })

  test('very big numbers stay exact', () => {
    const big = '1'.repeat(64) // 64 ones in binary is bigger than a normal JS number can hold exactly
    expect(rebase(rebase(big, 2, 10), 10, 2)).toBe(big)
  })
})

describe('BMI', () => {
  test('70 kg at 175 cm', () => {
    expect(bmiValue(70, 175)).toBeCloseTo(22.86, 2)
  })

  test('the same BMI can be a different category on the Asian scale', () => {
    expect(category(24, 'who')).toBe('Healthy weight')
    expect(category(24, 'asian')).toBe('Overweight')
  })

  test('a weight or height of 0 gives no BMI', () => {
    expect(bmiValue(70, 0)).toBe(null)
  })
})
