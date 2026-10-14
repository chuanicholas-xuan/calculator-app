import { groupByDay } from '../core/history.js'
import { BackIcon, BinIcon } from './icons.jsx'

// The history screen: past sums grouped by day. Tapping one sends its answer back to the calculator.
// React shows {entry.expression} as plain text, so a booby-trapped entry like "<img onerror=...>"
// can't run: it just appears as those characters.
export default function HistoryPanel({ entries, onClose, onClear, onPick }) {
  return (
    <section id="history" className="panel" aria-labelledby="history-title">
      <header className="panel-header">
        {/* autoFocus: keyboard users land inside the panel when it opens. */}
        <button type="button" id="history-close" className="icon-button" aria-label="Back to calculator" onClick={onClose} autoFocus>
          <BackIcon />
        </button>
        <h2 id="history-title">History</h2>
        <button
          type="button"
          id="history-clear"
          className="icon-button"
          aria-label="Clear history"
          disabled={entries.length === 0}
          onClick={onClear}
        >
          <BinIcon />
        </button>
      </header>

      <div id="history-list" className="history-list">
        {entries.length === 0 && <p className="history-empty">No history yet</p>}

        {groupByDay(entries).map((group) => (
          <section className="history-day" key={group.day}>
            <h3>{group.day}</h3>
            {group.entries.map((entry) => (
              <button
                type="button"
                className="history-item"
                key={entry.time + entry.expression}
                onClick={() => onPick(entry.result)}
              >
                {entry.expression} = {entry.result}
              </button>
            ))}
          </section>
        ))}
      </div>
    </section>
  )
}
