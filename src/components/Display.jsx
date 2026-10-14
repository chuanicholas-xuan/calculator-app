import { expressionText, previewText } from '../core/calculator.js'

// The screen: the sum on top, the answer below. aria-live makes screen readers announce changes.
// React writes text with {curly braces} as plain text, never as HTML, so a sum can't inject a script.
export default function Display({ state }) {
  const done = state.justEvaluated
  const expression = done ? (state.tokens.length ? `${expressionText(state)} =` : '') : expressionText(state)
  const result = done ? state.result : previewText(state)

  return (
    <div id="display" className={done ? 'display done' : 'display'} aria-live="polite">
      <div id="expression" className="expression">{expression}</div>
      <output id="result" className="result">{result}</output>
    </div>
  )
}
