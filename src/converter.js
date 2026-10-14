// ---------- Converter: its own file, because main.js was getting too long ----------
// main.js imports the two functions at the bottom (isConverterOpen, handleConverterKey).
// Everything else in here is private to this file.
// Unit converters (length, ...) live in units.js; this file opens and closes them.
import { UNIT_CONVERTERS, showUnitView, hideUnitView, isUnitViewOpen } from './units.js'
import { finance } from './finance.js'
import { date } from './date.js'
import { discount } from './discount.js'

// Converters with their own screen (not just "pick two units"). Each one gives
// { title, view, open() }, so this file can show and hide them all the same way.
const TOOLS = { finance, date, discount }

const panel = document.getElementById('converter')
const openButton = document.getElementById('converter-open')
const closeButton = document.getElementById('converter-close')
const title = document.getElementById('converter-title')
const home = document.getElementById('converter-home')
const currencyView = document.getElementById('currency-view')

const amountInput = document.getElementById('currency-amount')
const fromSelect = document.getElementById('currency-from')
const toSelect = document.getElementById('currency-to')
const swapButton = document.getElementById('currency-swap')
const resultEl = document.getElementById('currency-result')
const rateLine = document.getElementById('currency-rate')
const statusLine = document.getElementById('currency-status')

// ---------- Opening, closing and moving between screens ----------
function openConverter() {
  showHome()
  panel.hidden = false
  closeButton.focus()
}

function closeConverter() {
  panel.hidden = true
  openButton.focus()
}

function showHome() {
  title.textContent = 'Converter'
  home.hidden = false
  currencyView.hidden = true
  hideUnitView()
  for (const tool of Object.values(TOOLS)) tool.view.hidden = true
}

// True when one converter (Currency, Length, ...) is showing instead of the grid.
const isInsideConverter = () =>
  !currencyView.hidden || isUnitViewOpen() || Object.values(TOOLS).some((tool) => !tool.view.hidden)

function showCurrency() {
  title.textContent = 'Currency'
  home.hidden = true
  currencyView.hidden = false
  amountInput.focus()
  loadRates()
}

openButton.addEventListener('click', openConverter)

// The back arrow goes up one level: from Currency to the grid, from the grid to the calculator.
closeButton.addEventListener('click', () => {
  if (isInsideConverter()) showHome()
  else closeConverter()
})

home.addEventListener('click', (event) => {
  const key = event.target.closest('[data-converter]')?.dataset.converter
  if (key === 'currency') showCurrency()
  else if (Object.hasOwn(UNIT_CONVERTERS, key)) {
    home.hidden = true
    title.textContent = showUnitView(key)
  } else if (Object.hasOwn(TOOLS, key)) {
    home.hidden = true
    title.textContent = TOOLS[key].title
    TOOLS[key].open()
  }
})

// ---------- Exchange rates ----------
// Where the rates come from. Both are free and need no API key.
// The first is tried first; the second is a backup in case the first is down.
const SOURCES = [
  {
    name: 'ExchangeRate-API',
    link: 'https://www.exchangerate-api.com',
    url: 'https://open.er-api.com/v6/latest/USD',
    // Turns this source's reply into { rates, updatedAt } with rates per 1 USD.
    read: (data) => ({ rates: data.rates, updatedAt: data.time_last_update_unix * 1000 }),
  },
  {
    name: 'fawazahmed0 currency-api',
    link: 'https://github.com/fawazahmed0/exchange-api',
    url: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
    read: (data) => ({
      rates: Object.fromEntries(Object.entries(data.usd).map(([code, rate]) => [code.toUpperCase(), rate])),
      updatedAt: Date.parse(data.date),
    }),
  },
]

const RATES_KEY = 'calculator-rates'
const MAX_AGE = 60 * 60 * 1000 // ask for new rates at most once an hour (they only change about once a day)

let rates = null // { rates: { USD: 1, EUR: 0.92, ... }, updatedAt, source }

// Anything from the internet, or from storage, is untrusted: keep only proper 3-letter codes
// with sensible positive numbers. A bad or hacked reply can then never break the page.
function cleanRates(raw) {
  const clean = {}
  for (const [code, rate] of Object.entries(raw ?? {})) {
    if (/^[A-Z]{3}$/.test(code) && Number.isFinite(rate) && rate > 0) clean[code] = rate
  }
  return Object.keys(clean).length > 1 && clean.USD === 1 ? clean : null
}

function loadSavedRates() {
  try {
    const saved = JSON.parse(localStorage.getItem(RATES_KEY))
    const clean = cleanRates(saved?.rates)
    if (!clean || !Number.isFinite(saved.fetchedAt)) return null
    return { rates: clean, updatedAt: saved.updatedAt, fetchedAt: saved.fetchedAt, source: saved.source }
  } catch {
    return null
  }
}

function saveRates(value) {
  try {
    localStorage.setItem(RATES_KEY, JSON.stringify(value))
  } catch {
    // Storage full or blocked: we just fetch again next time.
  }
}

// fetch() asks another website for data. It is "async": the answer arrives later,
// so the code "awaits" it instead of freezing the page while it waits.
async function fetchRates() {
  for (const source of SOURCES) {
    try {
      // Give up on a source after 8 seconds, so a slow server can't hang the app.
      const response = await fetch(source.url, { signal: AbortSignal.timeout(8000) })
      if (!response.ok) continue
      const { rates: raw, updatedAt } = source.read(await response.json())
      const clean = cleanRates(raw)
      if (!clean) continue
      return { rates: clean, updatedAt, fetchedAt: Date.now(), source: source.name }
    } catch {
      // Network down, timeout, or a reply we couldn't read: try the next source.
    }
  }
  return null
}

let loading = false

async function loadRates() {
  if (loading) return
  const saved = rates ?? loadSavedRates()
  if (saved) useRates(saved)

  const isFresh = saved && Date.now() - saved.fetchedAt < MAX_AGE
  if (isFresh) return

  loading = true
  if (!saved) statusLine.textContent = 'Getting the latest rates…'
  const fresh = await fetchRates()
  loading = false

  if (fresh) {
    saveRates(fresh)
    useRates(fresh)
  } else if (saved) {
    showStatus(saved, "Couldn't update. Showing the last saved rates")
  } else {
    statusLine.textContent = "Couldn't get exchange rates. Check your internet connection and try again."
  }
}

function useRates(value) {
  rates = value
  fillCurrencyLists()
  convert()
  showStatus(value)
}

function showStatus(value, prefix = 'Rates updated') {
  const when = new Date(value.updatedAt)
  const whenText = Number.isFinite(when.getTime())
    ? when.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : 'unknown time'
  statusLine.textContent = `${prefix} ${whenText} · Source: ${value.source}`
}

// ---------- The two currency lists ----------
// Intl.DisplayNames is built into the browser and knows the name of every currency code,
// so "MYR" can be shown as "Malaysian Ringgit" without us keeping a list of names.
const currencyNames = new Intl.DisplayNames(['en'], { type: 'currency' })

function currencyName(code) {
  try {
    return currencyNames.of(code)
  } catch {
    return code
  }
}

const CHOICE_KEY = 'calculator-currency-pair'

function loadChoice() {
  try {
    const saved = JSON.parse(localStorage.getItem(CHOICE_KEY))
    if (typeof saved?.from === 'string' && typeof saved?.to === 'string') return saved
  } catch {
    // Ignore broken storage and use the defaults.
  }
  return { from: 'USD', to: 'EUR' }
}

function saveChoice() {
  try {
    localStorage.setItem(CHOICE_KEY, JSON.stringify({ from: fromSelect.value, to: toSelect.value }))
  } catch {
    // Not important if this fails.
  }
}

function fillCurrencyLists() {
  const choice = fromSelect.value ? { from: fromSelect.value, to: toSelect.value } : loadChoice()
  const codes = Object.keys(rates.rates).sort((a, b) => currencyName(a).localeCompare(currencyName(b)))

  for (const select of [fromSelect, toSelect]) {
    select.replaceChildren()
    for (const code of codes) {
      const option = document.createElement('option')
      option.value = code
      option.textContent = `${code} · ${currencyName(code)}` // textContent: names from outside are never HTML
      select.append(option)
    }
  }

  fromSelect.value = codes.includes(choice.from) ? choice.from : 'USD'
  toSelect.value = codes.includes(choice.to) ? choice.to : codes.find((code) => code !== fromSelect.value)
}

// ---------- The conversion itself ----------
// Every rate is "per 1 USD", so go through USD: amount ÷ from-rate = USD, then × to-rate.
function convertAmount(amount, from, to) {
  return (amount / rates.rates[from]) * rates.rates[to]
}

// Money is shown with 2 decimals, but tiny amounts (1 IDR in USD) need more digits to not show 0.00.
function formatMoney(value) {
  if (value !== 0 && Math.abs(value) < 0.01) {
    return value.toLocaleString(undefined, { maximumSignificantDigits: 4 })
  }
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Only allow what a money amount can contain: digits and one decimal point.
function readAmount() {
  const cleaned = amountInput.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')
  if (cleaned !== amountInput.value) amountInput.value = cleaned
  return cleaned === '' ? 0 : Number(cleaned)
}

function convert() {
  if (!rates) return
  const amount = readAmount()
  const from = fromSelect.value
  const to = toSelect.value

  resultEl.textContent = formatMoney(convertAmount(amount, from, to))
  rateLine.textContent = `1 ${from} = ${formatMoney(convertAmount(1, from, to))} ${to}`
}

amountInput.addEventListener('input', convert)
fromSelect.addEventListener('change', () => {
  saveChoice()
  convert()
})
toSelect.addEventListener('change', () => {
  saveChoice()
  convert()
})

swapButton.addEventListener('click', () => {
  ;[fromSelect.value, toSelect.value] = [toSelect.value, fromSelect.value] // swap the two values in one line
  saveChoice()
  convert()
})

// ---------- Used by main.js ----------
export function isConverterOpen() {
  return !panel.hidden
}

// While the converter is open, main.js passes keys here instead of to the calculator.
export function handleConverterKey(event) {
  if (event.key !== 'Escape') return
  if (isInsideConverter()) showHome()
  else closeConverter()
}
