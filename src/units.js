// ---------- Unit converters: length now, more later ----------
// Every converter here works the same way, so the code is written ONCE and each converter
// is just data: a list of units and how big each one is compared to one "base" unit.
// Adding Mass later means adding a "mass" entry below, not writing new code.
// This idea is called "data-driven" design.

// factor = how many base units fit in one of this unit. For length the base is the metre:
// 1 km = 1000 m, so km has factor 1000.
export const UNIT_CONVERTERS = {
  length: {
    title: 'Length',
    defaults: ['km', 'mi'],
    units: [
      { code: 'km', name: 'Kilometre', factor: 1000 },
      { code: 'm', name: 'Metre', factor: 1 },
      { code: 'dm', name: 'Decimetre', factor: 0.1 },
      { code: 'cm', name: 'Centimetre', factor: 0.01 },
      { code: 'mm', name: 'Millimetre', factor: 0.001 },
      { code: 'µm', name: 'Micrometre', factor: 1e-6 },
      { code: 'nm', name: 'Nanometre', factor: 1e-9 },
      { code: 'mi', name: 'Mile', factor: 1609.344 },
      { code: 'yd', name: 'Yard', factor: 0.9144 },
      { code: 'ft', name: 'Foot', factor: 0.3048 },
      { code: 'in', name: 'Inch', factor: 0.0254 },
      { code: 'nmi', name: 'Nautical mile', factor: 1852 },
      { code: 'au', name: 'Astronomical unit', factor: 149597870700 },
      { code: 'ly', name: 'Light-year', factor: 9460730472580800 },
    ],
  },
}

const view = document.getElementById('unit-view')
const amountInput = document.getElementById('unit-amount')
const fromSelect = document.getElementById('unit-from')
const toSelect = document.getElementById('unit-to')
const swapButton = document.getElementById('unit-swap')
const resultEl = document.getElementById('unit-result')
const rateLine = document.getElementById('unit-rate')

let current = null // the converter that is open, e.g. UNIT_CONVERTERS.length
let currentKey = ''

// ---------- Pure maths: no DOM here, so it is easy to test ----------
// Go through the base unit: km -> metres -> miles.
export function convertUnits(amount, fromUnit, toUnit) {
  return (amount * fromUnit.factor) / toUnit.factor
}

// Normal numbers get up to 10 significant digits. Huge or tiny ones (light-years in nanometres)
// switch to science notation, like 9.46e+24, instead of a 25-digit monster.
export function formatNumber(value) {
  if (!Number.isFinite(value)) return 'Error'
  if (value !== 0 && (Math.abs(value) >= 1e15 || Math.abs(value) < 1e-6)) {
    return value.toExponential(6).replace(/\.?0+e/, 'e')
  }
  return value.toLocaleString(undefined, { maximumSignificantDigits: 10 })
}

// ---------- Remembering the last pair of units, one pair per converter ----------
const storageKey = () => `calculator-units-${currentKey}`

function loadPair() {
  const codes = current.units.map((unit) => unit.code)
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey()))
    if (codes.includes(saved?.from) && codes.includes(saved?.to)) return saved
  } catch {
    // Broken storage: use the defaults.
  }
  return { from: current.defaults[0], to: current.defaults[1] }
}

function savePair() {
  try {
    localStorage.setItem(storageKey(), JSON.stringify({ from: fromSelect.value, to: toSelect.value }))
  } catch {
    // Not important if this fails.
  }
}

// ---------- Drawing ----------
function fillLists() {
  for (const select of [fromSelect, toSelect]) {
    select.replaceChildren()
    for (const unit of current.units) {
      const option = document.createElement('option')
      option.value = unit.code
      option.textContent = `${unit.code} · ${unit.name}`
      select.append(option)
    }
  }
  const pair = loadPair()
  fromSelect.value = pair.from
  toSelect.value = pair.to
}

const findUnit = (code) => current.units.find((unit) => unit.code === code)

// Same rule as the currency box: only digits and one decimal point.
function readAmount() {
  const cleaned = amountInput.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')
  if (cleaned !== amountInput.value) amountInput.value = cleaned
  return cleaned === '' ? 0 : Number(cleaned)
}

function convert() {
  const from = findUnit(fromSelect.value)
  const to = findUnit(toSelect.value)
  resultEl.textContent = formatNumber(convertUnits(readAmount(), from, to))
  rateLine.textContent = `1 ${from.code} = ${formatNumber(convertUnits(1, from, to))} ${to.code}`
}

amountInput.addEventListener('input', convert)

for (const select of [fromSelect, toSelect]) {
  select.addEventListener('change', () => {
    savePair()
    convert()
  })
}

swapButton.addEventListener('click', () => {
  ;[fromSelect.value, toSelect.value] = [toSelect.value, fromSelect.value]
  savePair()
  convert()
})

// ---------- Used by converter.js ----------
export function showUnitView(key) {
  current = UNIT_CONVERTERS[key]
  currentKey = key
  fillLists()
  convert()
  view.hidden = false
  amountInput.focus()
  return current.title
}

export function hideUnitView() {
  view.hidden = true
}

export function isUnitViewOpen() {
  return !view.hidden
}
