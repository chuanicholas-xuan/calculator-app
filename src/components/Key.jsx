// One calculator button. Every key on both keypads is drawn by this one component.
// data-action and data-value are kept because the CSS colours buttons by them (operators are orange).
export default function Key({ action, value, label, ariaLabel, pressed, active, onPress }) {
  const classes = [pressed && 'pressed', active && 'active'].filter(Boolean).join(' ')
  return (
    <button
      type="button"
      data-action={action}
      data-value={value}
      aria-label={ariaLabel}
      className={classes || undefined}
      onClick={() => onPress(action, value)}
    >
      {label}
    </button>
  )
}

// The same "action:value" text the keyboard handler uses, so a key press can light up its button.
export const keyId = (action, value) => `${action}:${value ?? ''}`
