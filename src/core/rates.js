// ---------- Exchange rates: fetching, checking and saving. Pure JavaScript, no React. ----------

// Where the rates come from. Both are free and need no API key.
// The first is tried first; the second is a backup in case the first is down.
const SOURCES = [
  {
    name: 'ExchangeRate-API',
    url: 'https://open.er-api.com/v6/latest/USD',
    // Turns this source's reply into { rates, updatedAt } with rates per 1 USD.
    read: (data) => ({ rates: data.rates, updatedAt: data.time_last_update_unix * 1000 }),
  },
  {
    name: 'fawazahmed0 currency-api',
    url: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
    read: (data) => ({
      rates: Object.fromEntries(Object.entries(data.usd).map(([code, rate]) => [code.toUpperCase(), rate])),
      updatedAt: Date.parse(data.date),
    }),
  },
]

const RATES_KEY = 'calculator-rates'
export const MAX_AGE = 60 * 60 * 1000 // ask for new rates at most once an hour (they only change about once a day)

// Anything from the internet, or from storage, is untrusted: keep only proper 3-letter codes
// with sensible positive numbers. A bad or hacked reply can then never break the page.
function cleanRates(raw) {
  const clean = {}
  for (const [code, rate] of Object.entries(raw ?? {})) {
    if (/^[A-Z]{3}$/.test(code) && Number.isFinite(rate) && rate > 0) clean[code] = rate
  }
  return Object.keys(clean).length > 1 && clean.USD === 1 ? clean : null
}

// Saved rates look like { rates: { USD: 1, EUR: 0.92, ... }, updatedAt, fetchedAt, source }.
export function loadSavedRates() {
  try {
    const saved = JSON.parse(localStorage.getItem(RATES_KEY))
    const clean = cleanRates(saved?.rates)
    if (!clean || !Number.isFinite(saved.fetchedAt)) return null
    return { rates: clean, updatedAt: saved.updatedAt, fetchedAt: saved.fetchedAt, source: saved.source }
  } catch {
    return null
  }
}

export function saveRates(value) {
  try {
    localStorage.setItem(RATES_KEY, JSON.stringify(value))
  } catch {
    // Storage full or blocked: we just fetch again next time.
  }
}

export const isFresh = (value) => value !== null && Date.now() - value.fetchedAt < MAX_AGE

// fetch() asks another website for data. It is "async": the answer arrives later,
// so the code "awaits" it instead of freezing the page while it waits.
export async function fetchRates() {
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

// "Rates updated 14 Oct 2026, 08:00 · Source: ExchangeRate-API"
export function statusText(value, prefix = 'Rates updated') {
  const when = new Date(value.updatedAt)
  const whenText = Number.isFinite(when.getTime())
    ? when.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : 'unknown time'
  return `${prefix} ${whenText} · Source: ${value.source}`
}

// ---------- Currency names and the remembered pair ----------
// Intl.DisplayNames is built into the browser and knows the name of every currency code,
// so "MYR" can be shown as "Malaysian Ringgit" without us keeping a list of names.
const currencyNames = new Intl.DisplayNames(['en'], { type: 'currency' })

export function currencyName(code) {
  try {
    return currencyNames.of(code)
  } catch {
    return code
  }
}

// Every code we have a rate for, sorted by name (so "Euro" sits near "Ethiopian Birr").
export const sortedCodes = (rates) =>
  Object.keys(rates).sort((a, b) => currencyName(a).localeCompare(currencyName(b)))

const CHOICE_KEY = 'calculator-currency-pair'

export function loadChoice() {
  try {
    const saved = JSON.parse(localStorage.getItem(CHOICE_KEY))
    if (typeof saved?.from === 'string' && typeof saved?.to === 'string') return saved
  } catch {
    // Ignore broken storage and use the defaults.
  }
  return { from: 'USD', to: 'EUR' }
}

export function saveChoice(pair) {
  try {
    localStorage.setItem(CHOICE_KEY, JSON.stringify(pair))
  } catch {
    // Not important if this fails.
  }
}

// ---------- The conversion itself ----------
// Every rate is "per 1 USD", so go through USD: amount ÷ from-rate = USD, then × to-rate.
export const convertMoney = (rates, amount, from, to) => (amount / rates[from]) * rates[to]

// Money is shown with 2 decimals, but tiny amounts (1 IDR in USD) need more digits to not show 0.00.
export function formatMoney(value) {
  if (value !== 0 && Math.abs(value) < 0.01) {
    return value.toLocaleString(undefined, { maximumSignificantDigits: 4 })
  }
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
