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
  // Base unit: the kilogram.
  mass: {
    title: 'Mass',
    defaults: ['kg', 'lb'],
    units: [
      { code: 't', name: 'Tonne', factor: 1000 },
      { code: 'kg', name: 'Kilogram', factor: 1 },
      { code: 'g', name: 'Gram', factor: 0.001 },
      { code: 'mg', name: 'Milligram', factor: 1e-6 },
      { code: 'µg', name: 'Microgram', factor: 1e-9 },
      { code: 'ct', name: 'Carat', factor: 0.0002 },
      { code: 'lb', name: 'Pound', factor: 0.45359237 },
      { code: 'oz', name: 'Ounce', factor: 0.028349523125 },
      { code: 'st', name: 'Stone', factor: 6.35029318 },
      { code: 'ton (US)', name: 'Short ton', factor: 907.18474 },
      { code: 'ton (UK)', name: 'Long ton', factor: 1016.0469088 },
      { code: 'kati', name: 'Kati (Malaysia, Singapore)', factor: (0.45359237 * 4) / 3 }, // 1⅓ pounds
      { code: 'jin', name: 'Jin (China)', factor: 0.5 },
    ],
  },
  // Base unit: the square metre.
  area: {
    title: 'Area',
    defaults: ['m²', 'ft²'],
    units: [
      { code: 'km²', name: 'Square kilometre', factor: 1e6 },
      { code: 'ha', name: 'Hectare', factor: 10000 },
      { code: 'a', name: 'Are', factor: 100 },
      { code: 'm²', name: 'Square metre', factor: 1 },
      { code: 'dm²', name: 'Square decimetre', factor: 0.01 },
      { code: 'cm²', name: 'Square centimetre', factor: 1e-4 },
      { code: 'mm²', name: 'Square millimetre', factor: 1e-6 },
      { code: 'mi²', name: 'Square mile', factor: 2589988.110336 },
      { code: 'ac', name: 'Acre', factor: 4046.8564224 },
      { code: 'yd²', name: 'Square yard', factor: 0.83612736 },
      { code: 'ft²', name: 'Square foot', factor: 0.09290304 },
      { code: 'in²', name: 'Square inch', factor: 0.00064516 },
    ],
  },
  // Base unit: the second. A year is 365.25 days (the average, counting leap years).
  time: {
    title: 'Time',
    defaults: ['h', 'min'],
    units: [
      { code: 'century', name: 'Century', factor: 3155760000 },
      { code: 'yr', name: 'Year', factor: 31557600 },
      { code: 'mo', name: 'Month (average)', factor: 2629800 },
      { code: 'wk', name: 'Week', factor: 604800 },
      { code: 'd', name: 'Day', factor: 86400 },
      { code: 'h', name: 'Hour', factor: 3600 },
      { code: 'min', name: 'Minute', factor: 60 },
      { code: 's', name: 'Second', factor: 1 },
      { code: 'ms', name: 'Millisecond', factor: 0.001 },
      { code: 'µs', name: 'Microsecond', factor: 1e-6 },
      { code: 'ns', name: 'Nanosecond', factor: 1e-9 },
    ],
  },
  // Base unit: the byte. KB/MB/GB use 1000 (what drive makers and phones show);
  // KiB/MiB/GiB use 1024 (what Windows shows, even though it labels them KB/MB/GB).
  data: {
    title: 'Data',
    defaults: ['GB', 'MB'],
    units: [
      { code: 'bit', name: 'Bit', factor: 0.125 },
      { code: 'B', name: 'Byte', factor: 1 },
      { code: 'KB', name: 'Kilobyte (1000 B)', factor: 1e3 },
      { code: 'MB', name: 'Megabyte', factor: 1e6 },
      { code: 'GB', name: 'Gigabyte', factor: 1e9 },
      { code: 'TB', name: 'Terabyte', factor: 1e12 },
      { code: 'PB', name: 'Petabyte', factor: 1e15 },
      { code: 'KiB', name: 'Kibibyte (1024 B)', factor: 1024 },
      { code: 'MiB', name: 'Mebibyte', factor: 1024 ** 2 },
      { code: 'GiB', name: 'Gibibyte', factor: 1024 ** 3 },
      { code: 'TiB', name: 'Tebibyte', factor: 1024 ** 4 },
      { code: 'Kb', name: 'Kilobit', factor: 125 },
      { code: 'Mb', name: 'Megabit', factor: 125000 },
      { code: 'Gb', name: 'Gigabit', factor: 125000000 },
    ],
  },
  // Base unit: the litre. US and UK gallons, pints and fluid ounces are different sizes.
  volume: {
    title: 'Volume',
    defaults: ['L', 'gal (US)'],
    units: [
      { code: 'm³', name: 'Cubic metre', factor: 1000 },
      { code: 'L', name: 'Litre', factor: 1 },
      { code: 'dL', name: 'Decilitre', factor: 0.1 },
      { code: 'cL', name: 'Centilitre', factor: 0.01 },
      { code: 'mL', name: 'Millilitre', factor: 0.001 },
      { code: 'cm³', name: 'Cubic centimetre', factor: 0.001 },
      { code: 'ft³', name: 'Cubic foot', factor: 28.316846592 },
      { code: 'in³', name: 'Cubic inch', factor: 0.016387064 },
      { code: 'gal (US)', name: 'US gallon', factor: 3.785411784 },
      { code: 'qt (US)', name: 'US quart', factor: 0.946352946 },
      { code: 'pt (US)', name: 'US pint', factor: 0.473176473 },
      { code: 'cup (US)', name: 'US cup', factor: 0.2365882365 },
      { code: 'fl oz (US)', name: 'US fluid ounce', factor: 0.0295735295625 },
      { code: 'tbsp', name: 'Tablespoon (US)', factor: 0.01478676478125 },
      { code: 'tsp', name: 'Teaspoon (US)', factor: 0.00492892159375 },
      { code: 'gal (UK)', name: 'UK gallon', factor: 4.54609 },
      { code: 'pt (UK)', name: 'UK pint', factor: 0.56826125 },
      { code: 'fl oz (UK)', name: 'UK fluid ounce', factor: 0.0284130625 },
    ],
  },
  // Base unit: metres per second.
  speed: {
    title: 'Speed',
    defaults: ['km/h', 'mph'],
    units: [
      { code: 'm/s', name: 'Metres per second', factor: 1 },
      { code: 'km/h', name: 'Kilometres per hour', factor: 1000 / 3600 },
      { code: 'mph', name: 'Miles per hour', factor: 0.44704 },
      { code: 'kn', name: 'Knot', factor: 1852 / 3600 },
      { code: 'ft/s', name: 'Feet per second', factor: 0.3048 },
      { code: 'Mach', name: 'Speed of sound (sea level)', factor: 340.3 },
      { code: 'c', name: 'Speed of light', factor: 299792458 },
    ],
  },
  // Temperature can't use a single factor: 0 °C is not 0 °F. So these units say how to get
  // to the base unit (kelvin) and back, with toBase and fromBase functions instead.
  temperature: {
    title: 'Temperature',
    defaults: ['°C', '°F'],
    allowNegative: true, // -40 °C is a real temperature; -40 km isn't a real length
    units: [
      { code: '°C', name: 'Celsius', toBase: (c) => c + 273.15, fromBase: (k) => k - 273.15 },
      {
        code: '°F',
        name: 'Fahrenheit',
        toBase: (f) => ((f - 32) * 5) / 9 + 273.15,
        fromBase: (k) => ((k - 273.15) * 9) / 5 + 32,
      },
      { code: 'K', name: 'Kelvin', factor: 1 },
      { code: '°R', name: 'Rankine', factor: 5 / 9 },
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
const signButton = document.getElementById('unit-sign')

let current = null // the converter that is open, e.g. UNIT_CONVERTERS.length
let currentKey = ''

// ---------- Pure maths: no DOM here, so it is easy to test ----------
// Go through the base unit: km -> metres -> miles.
// Most units just multiply by a factor; temperature units bring their own functions.
const toBase = (unit, value) => (unit.toBase ? unit.toBase(value) : value * unit.factor)
const fromBase = (unit, value) => (unit.fromBase ? unit.fromBase(value) : value / unit.factor)

export function convertUnits(amount, fromUnit, toUnit) {
  const result = fromBase(toUnit, toBase(fromUnit, amount))
  // Adding and subtracting 273.15 leaves tiny leftovers (0 °C can come out as 0.0000000000000568).
  // Temperatures never need more than 10 decimal places, so round those off.
  const hasOffset = fromUnit.toBase || toUnit.fromBase
  return hasOffset ? Math.round(result * 1e10) / 1e10 : result
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

// Same rule as the currency box: only digits and one decimal point,
// plus a minus sign at the very start for converters that allow negatives (temperature).
function readAmount() {
  const negative = current.allowNegative && amountInput.value.trim().startsWith('-')
  const digits = amountInput.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')
  const cleaned = (negative ? '-' : '') + digits
  if (cleaned !== amountInput.value) amountInput.value = cleaned
  return digits === '' ? 0 : Number(cleaned)
}

function convert() {
  const from = findUnit(fromSelect.value)
  const to = findUnit(toSelect.value)
  resultEl.textContent = formatNumber(convertUnits(readAmount(), from, to))
  // "1 °C = 33.8 °F" is true but reads like "each degree is 33.8", so skip it for offset units.
  const hasOffset = from.toBase || to.fromBase
  rateLine.textContent = hasOffset ? '' : `1 ${from.code} = ${formatNumber(convertUnits(1, from, to))} ${to.code}`
}

amountInput.addEventListener('input', convert)

// Phone number keyboards often have no minus key, so temperature gets a ± button.
signButton.addEventListener('click', () => {
  amountInput.value = amountInput.value.startsWith('-') ? amountInput.value.slice(1) : `-${amountInput.value}`
  convert()
})

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
  signButton.hidden = !current.allowNegative
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
