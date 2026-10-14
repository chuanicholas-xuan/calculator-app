import { useState } from 'react'
import { discountNote, discountPlan } from '../../core/discount.js'
import { money } from '../../core/finance.js'
import { cleanDecimal, toNumber } from '../../core/numbers.js'

// Sale price and savings, including a stacked "extra % off".
export default function DiscountConverter() {
  const [price, setPrice] = useState('100')
  const [percent, setPercent] = useState('20')
  const [extra, setExtra] = useState('')

  const plan = discountPlan(toNumber(price), toNumber(percent), toNumber(extra))
  const note = discountNote(plan, toNumber(price), toNumber(extra))

  return (
    <div id="discount-view" className="convert">
      <div className="convert-row">
        <label htmlFor="discount-price">Original price</label>
        <input id="discount-price" type="text" inputMode="decimal" autoComplete="off" autoFocus value={price} onChange={(e) => setPrice(cleanDecimal(e.target.value))} />
      </div>

      <div className="field-pair">
        <div className="convert-row">
          <label htmlFor="discount-percent">Discount (% off)</label>
          <input id="discount-percent" className="field-small" type="text" inputMode="decimal" autoComplete="off" value={percent} onChange={(e) => setPercent(cleanDecimal(e.target.value))} />
        </div>
        <div className="convert-row">
          <label htmlFor="discount-extra">Extra % off</label>
          <input id="discount-extra" className="field-small" type="text" inputMode="decimal" autoComplete="off" placeholder="0" value={extra} onChange={(e) => setExtra(cleanDecimal(e.target.value))} />
        </div>
      </div>

      <dl className="results" aria-live="polite">
        <div className="results-main">
          <dt>Final price</dt>
          <dd id="discount-final">{plan ? money(plan.final) : '–'}</dd>
          <dd id="discount-note" className="results-note">{note}</dd>
        </div>
        <div>
          <dt>You save</dt>
          <dd id="discount-saved">{plan ? money(plan.saved) : '–'}</dd>
        </div>
      </dl>
    </div>
  )
}
