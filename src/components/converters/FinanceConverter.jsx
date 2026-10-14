import { useState } from 'react'
import { METHODS, loanPlan, money } from '../../core/finance.js'
import { cleanDecimal, toNumber } from '../../core/numbers.js'

// A loan repayment calculator. The boxes are kept as text so "4." can be typed.
export default function FinanceConverter() {
  const [amount, setAmount] = useState('100000')
  const [rate, setRate] = useState('4')
  const [years, setYears] = useState('30')
  const [method, setMethod] = useState('annuity')

  // Worked out fresh on every render from the four boxes: nothing to keep in sync.
  const plan = loanPlan(toNumber(amount), toNumber(rate), toNumber(years), method)
  const decreasing = method === 'principal'

  let note = ''
  if (!plan) note = 'Enter a loan amount and a term.'
  else if (decreasing) note = `Then ${money(plan.drop)} less each month`

  return (
    <div id="finance-view" className="convert">
      <div className="convert-row">
        <label htmlFor="loan-amount">Loan amount</label>
        <input id="loan-amount" type="text" inputMode="decimal" autoComplete="off" autoFocus value={amount} onChange={(e) => setAmount(cleanDecimal(e.target.value))} />
      </div>

      <div className="field-pair">
        <div className="convert-row">
          <label htmlFor="loan-rate">Interest (% per year)</label>
          <input id="loan-rate" className="field-small" type="text" inputMode="decimal" autoComplete="off" value={rate} onChange={(e) => setRate(cleanDecimal(e.target.value))} />
        </div>
        <div className="convert-row">
          <label htmlFor="loan-years">Term (years)</label>
          <input id="loan-years" className="field-small" type="text" inputMode="decimal" autoComplete="off" value={years} onChange={(e) => setYears(cleanDecimal(e.target.value))} />
        </div>
      </div>

      <div className="convert-row">
        <label htmlFor="loan-method">Repayment type</label>
        <select id="loan-method" value={method} onChange={(e) => setMethod(e.target.value)}>
          {METHODS.map(({ value, name }) => (
            <option value={value} key={value}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* A description list: each <dt> is a label and the <dd> after it is its value. */}
      <dl className="results" aria-live="polite">
        <div className="results-main">
          <dt id="loan-monthly-label">{decreasing ? 'First monthly payment' : 'Monthly payment'}</dt>
          <dd id="loan-monthly">{plan ? money(plan.firstPayment) : '–'}</dd>
          <dd id="loan-note" className="results-note">{note}</dd>
        </div>
        <div>
          <dt>Total interest</dt>
          <dd id="loan-interest">{plan ? money(plan.totalInterest) : '–'}</dd>
        </div>
        <div>
          <dt>Total repayment</dt>
          <dd id="loan-total">{plan ? money(plan.total) : '–'}</dd>
        </div>
      </dl>
    </div>
  )
}
