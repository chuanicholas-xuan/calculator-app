import Key, { keyId } from './Key.jsx'

// The main buttons, as data. The screen is drawn from this list instead of 19 hand-written buttons.
const KEYS = [
  { action: 'clear', label: 'C' },
  { action: 'percent', label: '%', ariaLabel: 'percent' },
  { action: 'operator', value: '/', label: '÷', ariaLabel: 'divide' },
  { action: 'operator', value: '*', label: '×', ariaLabel: 'multiply' },
  { action: 'digit', value: '7', label: '7' },
  { action: 'digit', value: '8', label: '8' },
  { action: 'digit', value: '9', label: '9' },
  { action: 'operator', value: '-', label: '−', ariaLabel: 'subtract' },
  { action: 'digit', value: '4', label: '4' },
  { action: 'digit', value: '5', label: '5' },
  { action: 'digit', value: '6', label: '6' },
  { action: 'operator', value: '+', label: '+', ariaLabel: 'add' },
  { action: 'digit', value: '1', label: '1' },
  { action: 'digit', value: '2', label: '2' },
  { action: 'digit', value: '3', label: '3' },
  { action: 'equals', label: '=' },
  { action: 'digit', value: '0', label: '0' },
  { action: 'decimal', label: '.' },
  { action: 'delete', label: '⌫', ariaLabel: 'delete' },
]

export default function Keypad({ pressed, onPress }) {
  return (
    <div className="keys">
      {KEYS.map((key) => {
        const id = keyId(key.action, key.value)
        // "key" (lowercase) is React's own prop: a stable name so React can tell the buttons apart.
        return <Key key={id} {...key} pressed={pressed === id} onPress={onPress} />
      })}
    </div>
  )
}
