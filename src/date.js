// ---------- Date: days between two dates, or a date plus/minus some days ----------

const view = document.getElementById('date-view')
const modeSelect = document.getElementById('date-mode')
const startInput = document.getElementById('date-start')
const endInput = document.getElementById('date-end')
const daysInput = document.getElementById('date-days')
const directionSelect = document.getElementById('date-direction')
const betweenFields = document.getElementById('date-between-fields')
const addFields = document.getElementById('date-add-fields')
const mainLabel = document.getElementById('date-main-label')
const mainEl = document.getElementById('date-main')
const detailEl = document.getElementById('date-detail')

const DAY = 24 * 60 * 60 * 1000

// ---------- Pure maths: no DOM here, so it is easy to test ----------
// Dates from <input type="date"> look like "2026-10-14". Reading them as UTC (no time zone)
// makes every day exactly 24 hours, so daylight-saving changes can't make a day go missing.
export function parseDate(text) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text)
  if (!match) return null
  const [, year, month, day] = match.map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCDate() === day ? date : null // rejects impossible dates like 31 February
}

const toInputText = (date) => date.toISOString().slice(0, 10)

export function daysBetween(start, end) {
  return Math.round((end - start) / DAY)
}

// "1 year, 2 months, 3 days", counted the way people do: same day next month = 1 month.
export function yearsMonthsDays(start, end) {
  let [from, to] = start <= end ? [start, end] : [end, start]
  let months = (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth())
  if (to.getUTCDate() < from.getUTCDate()) months -= 1
  const afterMonths = addMonths(from, months)
  return { years: Math.floor(months / 12), months: months % 12, days: daysBetween(afterMonths, to) }
}

// Adding a month to 31 January lands on 28/29 February, not 3 March.
function addMonths(date, count) {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() + count
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  return new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), lastDay)))
}

export function addDays(date, days) {
  return new Date(date.getTime() + days * DAY)
}

// ---------- Drawing ----------
const plural = (count, word) => `${count.toLocaleString()} ${word}${count === 1 ? '' : 's'}`

const longDate = (date) =>
  date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

// Only whole numbers of days.
function readDays() {
  const cleaned = daysInput.value.replace(/\D/g, '')
  if (cleaned !== daysInput.value) daysInput.value = cleaned
  return cleaned === '' ? 0 : Number(cleaned)
}

function update() {
  const adding = modeSelect.value === 'add'
  betweenFields.hidden = adding
  addFields.hidden = !adding

  const start = parseDate(startInput.value)
  if (!start) {
    mainEl.textContent = '–'
    detailEl.textContent = 'Pick a start date.'
    return
  }

  if (adding) {
    const sign = directionSelect.value === 'subtract' ? -1 : 1
    const result = addDays(start, sign * readDays())
    mainLabel.textContent = 'Result'
    mainEl.textContent = longDate(result)
    detailEl.textContent = ''
    return
  }

  const end = parseDate(endInput.value)
  if (!end) {
    mainEl.textContent = '–'
    detailEl.textContent = 'Pick an end date.'
    return
  }
  const days = daysBetween(start, end)
  const { years, months, days: restDays } = yearsMonthsDays(start, end)
  const weeks = Math.floor(Math.abs(days) / 7)

  mainLabel.textContent = days < 0 ? 'Days between (end is before start)' : 'Days between'
  mainEl.textContent = plural(Math.abs(days), 'day')
  detailEl.textContent = `${plural(years, 'year')}, ${plural(months, 'month')}, ${plural(restDays, 'day')} · ${plural(weeks, 'week')} ${plural(Math.abs(days) % 7, 'day')}`
}

for (const input of [modeSelect, startInput, endInput, daysInput, directionSelect]) {
  input.addEventListener('input', update)
  input.addEventListener('change', update)
}

// ---------- Used by converter.js ----------
export const date = {
  title: 'Date',
  view,
  open() {
    // Start from today, if the boxes are still empty.
    const now = new Date()
    const today = toInputText(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())))
    if (!startInput.value) startInput.value = today
    if (!endInput.value) endInput.value = today
    view.hidden = false
    update()
    startInput.focus()
  },
}
