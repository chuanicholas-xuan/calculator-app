import { useEffect, useState } from 'react'
import {
  UNIT_CONVERTERS,
  amountValue,
  cleanAmount,
  convertUnits,
  formatNumber,
  hasOffset,
  loadPair,
  savePair,
} from '../../core/units.js'

// One screen for every "pick two units" converter: Length, Mass, Area, Time, Data, Volume,
// Speed and Temperature. "kind" says which one, e.g. "length"; the units come from core/units.js.
export default function UnitConverter({ kind }) {
  const converter = UNIT_CONVERTERS[kind]
  const [pair, setPair] = useState(() => loadPair(kind)) // { from: 'km', to: 'mi' }
  const [amount, setAmount] = useState('1') // kept as text, so "0." and "-" can be typed

  useEffect(() => savePair(kind, pair), [kind, pair])

  const findUnit = (code) => converter.units.find((unit) => unit.code === code)
  const from = findUnit(pair.from)
  const to = findUnit(pair.to)
  const result = formatNumber(convertUnits(amountValue(amount), from, to))

  // "1 °C = 33.8 °F" is true but reads like "each degree is 33.8", so skip it for offset units.
  const rate = hasOffset(from, to) ? '' : `1 ${from.code} = ${formatNumber(convertUnits(1, from, to))} ${to.code}`

  const options = converter.units.map((unit) => (
    <option value={unit.code} key={unit.code}>
      {unit.code} · {unit.name}
    </option>
  ))

  return (
    <div id="unit-view" className="convert">
      <div className="convert-row">
        <label htmlFor="unit-from">From</label>
        <select id="unit-from" value={pair.from} onChange={(e) => setPair({ ...pair, from: e.target.value })}>
          {options}
        </select>
        <div className="amount-line">
          {/* Phone number keyboards often have no minus key, so temperature gets a ± button. */}
          {converter.allowNegative && (
            <button
              type="button"
              id="unit-sign"
              className="sign-button"
              aria-label="Make negative or positive"
              onClick={() => setAmount(amount.startsWith('-') ? amount.slice(1) : `-${amount}`)}
            >
              ±
            </button>
          )}
          <input
            id="unit-amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            aria-label="Amount"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(cleanAmount(e.target.value, converter.allowNegative))}
          />
        </div>
      </div>
      <button type="button" id="unit-swap" className="convert-swap" aria-label="Swap units" onClick={() => setPair({ from: pair.to, to: pair.from })}>
        ⇅
      </button>
      <div className="convert-row">
        <label htmlFor="unit-to">To</label>
        <select id="unit-to" value={pair.to} onChange={(e) => setPair({ ...pair, to: e.target.value })}>
          {options}
        </select>
        <output id="unit-result" className="convert-result" aria-live="polite">
          {result}
        </output>
      </div>
      <p id="unit-rate" className="convert-rate">{rate}</p>
    </div>
  )
}
