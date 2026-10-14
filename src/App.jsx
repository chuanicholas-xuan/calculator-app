import { useEffect, useReducer, useRef, useState } from 'react'
import { calculatorReducer, initialState } from './core/calculator.js'
import { keyToAction } from './core/keyboard.js'
import { addEntry, loadHistory, saveHistory } from './core/history.js'
import Display from './components/Display.jsx'
import ScienceKeys from './components/ScienceKeys.jsx'
import Keypad from './components/Keypad.jsx'
import HistoryPanel from './components/HistoryPanel.jsx'
import { keyId } from './components/Key.jsx'
import { HistoryIcon } from './components/icons.jsx'

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
  const [history, setHistory] = useState(loadHistory) // newest first
  const [panel, setPanel] = useState(null) // which screen covers the calculator: null or 'history'
  const historyButton = useRef(null) // a "ref" lets us reach the real button, to give it focus back

  const press = (action, value) => dispatch({ action, value })

  function closePanel() {
    setPanel(null)
    historyButton.current?.focus()
  }

  // useEffect runs code AFTER React has drawn the screen: a good place for saving and listening.

  // = leaves a note in state.saved when a sum is worth keeping; this adds it to History.
  useEffect(() => {
    if (state.saved) setHistory((old) => addEntry(old, state.saved.expression, state.saved.result))
  }, [state.saved])

  // Save to storage whenever the list changes (after a new sum, or after clearing).
  useEffect(() => saveHistory(history), [history])

  useEffect(() => {
    try {
      localStorage.setItem(MODE_KEY, scientific ? 'scientific' : 'basic')
    } catch {
      // Storage blocked: the mode just won't be remembered.
    }
  }, [scientific]) // only re-run when scientific changes

  // Keyboard: start listening, and stop listening ("cleanup") before the next run or when removed.
  useEffect(() => {
    function onKeyDown(event) {
      if (event.ctrlKey || event.metaKey || event.altKey) return // leave shortcuts like Ctrl+C alone

      // While History is open, number keys must not type into the hidden calculator.
      if (panel) {
        if (event.key === 'Escape') closePanel()
        return
      }
      const mapped = keyToAction(event.key)
      if (!mapped) return

      // Stops Enter from also "clicking" whichever button has focus, and "/" from opening quick-find.
      event.preventDefault()
      const [action, value] = mapped
      dispatch({ action, value })
      setPressed(keyId(action, value))
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [panel]) // re-run when a panel opens or closes, so the listener always sees the current one

  // Un-light the button 100 ms after a key press.
  useEffect(() => {
    if (!pressed) return
    const timer = setTimeout(() => setPressed(null), 100)
    return () => clearTimeout(timer)
  }, [pressed])

  return (
    <main className={scientific ? 'calculator scientific' : 'calculator'}>
      <div className="toolbar">
        <button
          type="button"
          id="history-open"
          className="icon-button"
          aria-label="Show history"
          ref={historyButton}
          onClick={() => setPanel('history')}
        >
          <HistoryIcon />
        </button>
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

      {/* {condition && <X />} draws X only when the condition is true. */}
      {panel === 'history' && (
        <HistoryPanel
          entries={history}
          onClose={closePanel}
          onClear={() => {
            // Deleting can't be undone, so ask first.
            if (confirm('Clear all history?')) setHistory([])
          }}
          onPick={(answer) => {
            press('use-answer', answer)
            closePanel()
          }}
        />
      )}
    </main>
  )
}
