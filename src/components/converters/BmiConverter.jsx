import { useState } from 'react'
import { bmiResult, switchUnits } from '../../core/bmi.js'
import { cleanDecimal } from '../../core/numbers.js'

// Body mass index from weight and height, in kg/cm or lb/ft/in.
export default function BmiConverter() {
  const [units, setUnits] = useState('metric')
  const [scale, setScale] = useState('who')
  const [body, setBody] = useState({ kg: '70', cm: '175', lb: '', ft: '', in: '' }) // the five boxes, as text

  const imperial = units === 'imperial'
  const result = bmiResult(body, units, scale)

  function pickUnits(event) {
    setBody(switchUnits(body, event.target.value))
    setUnits(event.target.value)
  }

  // One small box. "name" is the key in body, e.g. "kg"; the id becomes "bmi-kg".
  const field = (name, label, autoFocus = false) => (
    <div className="convert-row">
      <label htmlFor={`bmi-${name}`}>{label}</label>
      <input
        id={`bmi-${name}`}
        className="field-small"
        type="text"
        inputMode="decimal"
        autoComplete="off"
        autoFocus={autoFocus}
        value={body[name]}
        onChange={(e) => setBody({ ...body, [name]: cleanDecimal(e.target.value) })}
      />
    </div>
  )

  return (
    <div id="bmi-view" className="convert">
      <div className="field-pair">
        <div className="convert-row">
          <label htmlFor="bmi-units">Units</label>
          <select id="bmi-units" value={units} onChange={pickUnits}>
            <option value="metric">kg, cm</option>
            <option value="imperial">lb, ft/in</option>
          </select>
        </div>
        <div className="convert-row">
          <label htmlFor="bmi-scale">Categories</label>
          <select id="bmi-scale" value={scale} onChange={(e) => setScale(e.target.value)}>
            <option value="who">International (WHO)</option>
            <option value="asian">Asian</option>
          </select>
        </div>
      </div>

      <div id="bmi-metric-fields" className="field-group" hidden={imperial}>
        <div className="field-pair">
          {field('kg', 'Weight (kg)', true)}
          {field('cm', 'Height (cm)')}
        </div>
      </div>

      <div id="bmi-imperial-fields" className="field-group" hidden={!imperial}>
        {field('lb', 'Weight (lb)')}
        <div className="field-pair">
          {field('ft', 'Height (ft)')}
          {field('in', '(in)')}
        </div>
      </div>

      <dl className="results" aria-live="polite">
        <div className="results-main">
          <dt>BMI</dt>
          <dd id="bmi-value">{result.value}</dd>
          <dd id="bmi-category" className="results-note">{result.category}</dd>
        </div>
        <div className="results-wide">
          <dt>Healthy weight for this height</dt>
          <dd id="bmi-range">{result.range}</dd>
        </div>
      </dl>
      <p className="convert-status">BMI is a rough guide for adults. It doesn't tell muscle from fat, so check with a doctor before acting on it.</p>
    </div>
  )
}
