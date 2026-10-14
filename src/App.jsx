import { useEffect, useReducer, useState } from 'react'
import { calculatorReducer, initialState } from './core/calculator.js'
import { keyToAction } from './core/keyboard.js'
import Display from './components/Display.jsx'
import ScienceKeys from './components/ScienceKeys.jsx'
import Keypad from './components/Keypad.jsx'
import { keyId } from './components/Key.jsx'

// Remember whether scientific mode was on, so a refresh doesn't switch it off.
const MODE_KEY = 'calculator-mode'

function loadScientific() {
  try {
    return localStorage.getItem(MODE_KEY) === 'scientific'
  } catch {
    return false // storage blocked: start in basic mode
  }
}

export default function App() {
  // useReducer: React keeps the state and hands every button press to calculatorReducer.
  const [state, dispatch] = useReducer(calculatorReducer, initialState)
  const [scientific, setScientific] = useState(loadScientific)
  const [pressed, setPressed] = useState(null) // which button to light up after a key press

  const press = (action, value) => dispatch({ action, value })

  // useEffect runs code AFTER React has drawn the screen: a good place for saving and listening.
  useEffect(() => {
    try {
      localStorage.setItem(MODE_KEY, scientific ? 'scientific' : 'basic')
    } catch {
      // Storage blocked: the mode just won't be remembered.
    }
  }, [scientific]) // only re-run when scientific changes

  // Keyboard: listen once when the app starts, and stop listening if it is ever removed.
  useEffect(() => {
    function onKeyDown(event) {
      if (event.ctrlKey || event.metaKey || event.altKey) return // leave shortcuts like Ctrl+C alone
      const mapped = keyToAction(event.key)
      if (!mapped) return

      // Stops Enter from also "clicking" whichever button has focus, and "/" from opening quick-find.
      event.preventDefault()
      const [action, value] = mapped
      dispatch({ action, value })
      setPressed(keyId(action, value))
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown) // the "cleanup"
  }, [])

  // Un-light the button 100 ms after a key press.
  useEffect(() => {
    if (!pressed) return
    const timer = setTimeout(() => setPressed(null), 100)
    return () => clearTimeout(timer)
  }, [pressed])

  return (
    <main className={scientific ? 'calculator scientific' : 'calculator'}>
      <div className="toolbar">
        {/* aria-pressed tells screen readers whether scientific mode is on. */}
        <button
          type="button"
          id="mode-toggle"
          className="mode-button"
          aria-pressed={scientific}
          onClick={() => setScientific(!scientific)}
        >
          sci
        </button>
      </div>

      <Display state={state} />
      <ScienceKeys second={state.second} angleUnit={state.angleUnit} pressed={pressed} onPress={press} />
      <Keypad pressed={pressed} onPress={press} />
    </main>
  )
}
