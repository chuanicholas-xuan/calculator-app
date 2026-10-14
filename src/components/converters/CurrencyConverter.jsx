import { useEffect, useState } from 'react'
import { cleanDecimal, toNumber } from '../../core/numbers.js'
import {
  convertMoney,
  currencyName,
  fetchRates,
  formatMoney,
  isFresh,
  loadChoice,
  loadSavedRates,
  saveChoice,
  saveRates,
  sortedCodes,
  statusText,
} from '../../core/rates.js'

export default function CurrencyConverter() {
  const [saved, setSaved] = useState(loadSavedRates) // the last rates we had, or null
  const [problem, setProblem] = useState(null) // null, 'loading' or 'failed'
  const [choice, setChoice] = useState(loadChoice) // { from: 'USD', to: 'EUR' }
  const [amount, setAmount] = useState('1') // kept as text, so "0." can be typed

  // Fetch new rates when this screen opens, unless the saved ones are less than an hour old.
  useEffect(() => {
    if (isFresh(saved)) return
    let cancelled = false // set if the screen closes before the answer arrives
    if (!saved) setProblem('loading')

    fetchRates().then((fresh) => {
      if (cancelled) return
      if (fresh) {
        saveRates(fresh)
        setSaved(fresh)
        setProblem(null)
      } else {
        setProblem('failed')
      }
    })
    return () => {
      cancelled = true
    }
  }, []) // [] = run once, when the screen opens

  useEffect(() => saveChoice(choice), [choice])

  // Status line under the result.
  let status = ''
  if (problem === 'loading') status = 'Getting the latest rates…'
  else if (problem === 'failed' && saved) status = statusText(saved, "Couldn't update. Showing the last saved rates")
  else if (problem === 'failed') status = "Couldn't get exchange rates. Check your internet connection and try again."
  else if (saved) status = statusText(saved)

  // Nothing to convert with yet: just the status line.
  if (!saved) {
    return (
      <div id="currency-view" className="convert">
        <p id="currency-status" className="convert-status">{status}</p>
      </div>
    )
  }

  const codes = sortedCodes(saved.rates)
  // A saved pair might use a code the new rates don't have; fall back to USD and the first other code.
  const from = codes.includes(choice.from) ? choice.from : 'USD'
  const to = codes.includes(choice.to) ? choice.to : codes.find((code) => code !== from)

  // The <option>s are made once and shared by both lists. Names from outside are shown as text, never HTML.
  const options = codes.map((code) => (
    <option value={code} key={code}>
      {code} · {currencyName(code)}
    </option>
  ))

  return (
    <div id="currency-view" className="convert">
      {/* label + input pairs: clicking the label focuses the input, and screen readers read it out. */}
      <div className="convert-row">
        <label htmlFor="currency-from">From</label>
        <select id="currency-from" value={from} onChange={(e) => setChoice({ from: e.target.value, to })}>
          {options}
        </select>
        <input
          id="currency-amount"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          aria-label="Amount"
          autoFocus
          value={amount}
          onChange={(e) => setAmount(cleanDecimal(e.target.value))}
        />
      </div>
      <button type="button" id="currency-swap" className="convert-swap" aria-label="Swap currencies" onClick={() => setChoice({ from: to, to: from })}>
        ⇅
      </button>
      <div className="convert-row">
        <label htmlFor="currency-to">To</label>
        <select id="currency-to" value={to} onChange={(e) => setChoice({ from, to: e.target.value })}>
          {options}
        </select>
        <output id="currency-result" className="convert-result" aria-live="polite">
          {formatMoney(convertMoney(saved.rates, toNumber(amount), from, to))}
        </output>
      </div>
      <p id="currency-rate" className="convert-rate">
        1 {from} = {formatMoney(convertMoney(saved.rates, 1, from, to))} {to}
      </p>
      <p id="currency-status" className="convert-status">{status}</p>
    </div>
  )
}
