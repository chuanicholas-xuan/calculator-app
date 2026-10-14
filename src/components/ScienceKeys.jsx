import Key, { keyId } from './Key.jsx'

// Scientific buttons. A key with a "second" version shows that version while 2nd is on.
const KEYS = [
  { action: 'second', label: '2nd' },
  { action: 'angle', ariaLabel: 'angle unit' }, // its label is the current unit, filled in below
  { action: 'open', value: 'sin', label: 'sin', second: { action: 'open', value: 'asin', label: 'sin⁻¹' } },
  { action: 'open', value: 'cos', label: 'cos', second: { action: 'open', value: 'acos', label: 'cos⁻¹' } },
  { action: 'open', value: 'tan', label: 'tan', second: { action: 'open', value: 'atan', label: 'tan⁻¹' } },

  { action: 'operator', value: '^', label: 'xʸ', ariaLabel: 'power' },
  { action: 'open', value: 'lg', label: 'lg', second: { action: 'open', value: 'pow10', label: '10ˣ' } },
  { action: 'open', value: 'ln', label: 'ln', second: { action: 'open', value: 'exp', label: 'eˣ' } },
  { action: 'open', value: '(', label: '(' },
  { action: 'close', label: ')' },

  { action: 'open', value: 'sqrt', label: '√x', second: { action: 'postfix', value: '²', label: 'x²' } },
  { action: 'postfix', value: '!', label: 'x!', ariaLabel: 'factorial' },
  { action: 'postfix', value: '⁻¹', label: '1/x', ariaLabel: 'one over x' },
  { action: 'constant', value: 'π', label: 'π' },
  { action: 'constant', value: 'e', label: 'e' },
]

export default function ScienceKeys({ second, angleUnit, pressed, onPress }) {
  return (
    <div className="science-keys">
      {KEYS.map((key, index) => {
        const shown = second && key.second ? { ...key, ...key.second } : key
        const label = key.action === 'angle' ? angleUnit : shown.label
        const id = keyId(shown.action, shown.value)
        return (
          <Key
            key={index} // the list never changes order, so its position is a safe name
            {...shown}
            label={label}
            active={key.action === 'second' && second}
            pressed={pressed === id}
            onPress={onPress}
          />
        )
      })}
    </div>
  )
}
