import { useEffect, useState } from 'react'
import { BackIcon } from './icons.jsx'
import CurrencyConverter from './converters/CurrencyConverter.jsx'
import UnitConverter from './converters/UnitConverter.jsx'
import FinanceConverter from './converters/FinanceConverter.jsx'
import DateConverter from './converters/DateConverter.jsx'
import DiscountConverter from './converters/DiscountConverter.jsx'
import { UNIT_CONVERTERS } from '../core/units.js'

// The tiles on the converter's home grid, in the same order as the phone's screen.
const TILES = [
  { key: 'currency', icon: '💱', name: 'Currency' },
  { key: 'length', icon: '📏', name: 'Length' },
  { key: 'mass', icon: '⚖️', name: 'Mass' },
  { key: 'area', icon: '⬛', name: 'Area' },
  { key: 'time', icon: '⏱️', name: 'Time' },
  { key: 'finance', icon: '💰', name: 'Finance' },
  { key: 'data', icon: '💾', name: 'Data' },
  { key: 'date', icon: '📅', name: 'Date' },
  { key: 'discount', icon: '🏷️', name: 'Discount' },
  { key: 'volume', icon: '🧊', name: 'Volume' },
  { key: 'numeral', icon: '🔢', name: 'Numeral system' },
  { key: 'speed', icon: '🚀', name: 'Speed' },
  { key: 'temperature', icon: '🌡️', name: 'Temperature' },
  { key: 'bmi', icon: '🩺', name: 'BMI' },
]

// Which component draws each converter. Tiles not listed here aren't rebuilt in React yet.
// Every unit converter (length, mass, ...) uses the same UnitConverter screen.
const SCREENS = {
  currency: CurrencyConverter,
  finance: FinanceConverter,
  date: DateConverter,
  discount: DiscountConverter,
  ...Object.fromEntries(Object.keys(UNIT_CONVERTERS).map((kind) => [kind, UnitConverter])),
}

export default function ConverterPanel({ onClose }) {
  const [open, setOpen] = useState(null) // the key of the converter showing, or null for the grid

  // The back arrow (and Escape) go up one level: from Currency to the grid, from the grid to the calculator.
  const back = () => (open ? setOpen(null) : onClose())

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') back()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  })

  const tile = TILES.find((t) => t.key === open)
  const Screen = SCREENS[open] // a component stored in a variable must start with a capital letter

  return (
    <section id="converter" className="panel" aria-labelledby="converter-title">
      <header className="panel-header">
        <button type="button" id="converter-close" className="icon-button" aria-label="Back" onClick={back} autoFocus>
          <BackIcon />
        </button>
        <h2 id="converter-title">{tile ? tile.name : 'Converter'}</h2>
        <span></span>
      </header>

      {Screen ? (
        // key={open}: a new converter gets a fresh screen, instead of Length's numbers leaking into Mass.
        <Screen key={open} kind={open} />
      ) : (
        <div id="converter-home" className="converter-grid">
          {TILES.map(({ key, icon, name }) => (
            <button type="button" className="converter-tile" data-converter={key} key={key} disabled={!SCREENS[key]} onClick={() => setOpen(key)}>
              <span className="tile-icon" aria-hidden="true">{icon}</span>
              {name}
              {!SCREENS[key] && <small>Soon</small>}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
