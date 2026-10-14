import { useRef, useState } from 'react'
import { BASES, cleanInBase, formatInBase, parseInBase, rebase } from '../../core/numeral.js'

// One whole number shown in binary, octal, decimal and hexadecimal.
export default function NumeralConverter() {
  const [base, setBase] = useState(10)
  const [text, setText] = useState('255')
  const input = useRef(null) // the text box, so picking a base can put the cursor back in it

  const value = parseInBase(text, base)

  function pickBase(event) {
    const newBase = Number(event.target.value)
    setText(rebase(text, base, newBase))
    setBase(newBase)
    input.current.focus()
  }

  return (
    <div id="numeral-view" className="convert">
      <div className="convert-row">
        <label htmlFor="numeral-base">Type the number in</label>
        <select id="numeral-base" value={base} onChange={pickBase}>
          {BASES.map(({ base, name }) => (
            <option value={base} key={base}>
              {name} (base {base})
            </option>
          ))}
        </select>
      </div>

      <div className="convert-row">
        <label htmlFor="numeral-input">Number</label>
        <input
          id="numeral-input"
          ref={input}
          type="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck="false"
          autoFocus
          value={text}
          onChange={(e) => setText(cleanInBase(e.target.value, base))}
        />
      </div>

      <dl className="results results-single numbers" aria-live="polite">
        {BASES.map(({ base, name }) => (
          <div key={base}>
            <dt>{name}</dt>
            <dd id={`numeral-${base}`}>{value === null ? '–' : formatInBase(value, base)}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
