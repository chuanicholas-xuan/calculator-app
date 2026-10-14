import { useState } from 'react'
import { dateResult, todayText } from '../../core/date.js'
import { toNumber } from '../../core/numbers.js'

// Days between two dates, or a date plus/minus some days. Both dates start as today.
export default function DateConverter() {
  const [mode, setMode] = useState('between')
  const [start, setStart] = useState(todayText)
  const [end, setEnd] = useState(todayText)
  const [direction, setDirection] = useState('add')
  const [days, setDays] = useState('100') // only whole numbers, kept as text

  const adding = mode === 'add'
  const { label, main, detail } = dateResult({ mode, start, end, direction, days: toNumber(days) })

  return (
    <div id="date-view" className="convert">
      <div className="convert-row">
        <label htmlFor="date-mode">What to work out</label>
        <select id="date-mode" value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="between">Days between two dates</option>
          <option value="add">Add or subtract days</option>
        </select>
      </div>

      <div className="convert-row">
        <label htmlFor="date-start">Start date</label>
        <input id="date-start" className="field-small" type="date" autoFocus value={start} onChange={(e) => setStart(e.target.value)} />
      </div>

      {/* hidden rather than removed, so the end date is still there when you switch back. */}
      <div id="date-between-fields" className="field-group" hidden={adding}>
        <div className="convert-row">
          <label htmlFor="date-end">End date</label>
          <input id="date-end" className="field-small" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>

      <div id="date-add-fields" className="field-group" hidden={!adding}>
        <div className="field-pair">
          <div className="convert-row">
            <label htmlFor="date-direction">Add or subtract</label>
            <select id="date-direction" value={direction} onChange={(e) => setDirection(e.target.value)}>
              <option value="add">Add</option>
              <option value="subtract">Subtract</option>
            </select>
          </div>
          <div className="convert-row">
            <label htmlFor="date-days">Days</label>
            <input id="date-days" className="field-small" type="text" inputMode="numeric" autoComplete="off" value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, ''))} />
          </div>
        </div>
      </div>

      <dl className="results" aria-live="polite">
        <div className="results-main">
          <dt id="date-main-label">{label}</dt>
          <dd id="date-main">{main}</dd>
          <dd id="date-detail" className="results-note">{detail}</dd>
        </div>
      </dl>
    </div>
  )
}
