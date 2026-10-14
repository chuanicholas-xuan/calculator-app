import { THEMES } from '../core/theme.js'
import { BackIcon } from './icons.jsx'

// The settings screen: one card per theme. aria-pressed marks the one in use.
export default function SettingsPanel({ theme, onPickTheme, onClose }) {
  return (
    <section id="settings" className="panel" aria-labelledby="settings-title">
      <header className="panel-header">
        <button type="button" id="settings-close" className="icon-button" aria-label="Back to calculator" onClick={onClose} autoFocus>
          <BackIcon />
        </button>
        <h2 id="settings-title">Settings</h2>
        <span></span>
      </header>
      <p className="settings-label">Theme</p>
      <div id="theme-list" className="theme-list">
        {THEMES.map(({ id, name }) => (
          <button
            type="button"
            className="theme-card"
            data-theme-option={id}
            aria-pressed={theme === id}
            key={id}
            onClick={() => onPickTheme(id)}
          >
            <span className={`swatch swatch-${id}`}></span>
            {name}
          </button>
        ))}
      </div>
    </section>
  )
}
