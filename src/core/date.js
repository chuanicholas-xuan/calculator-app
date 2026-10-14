// ---------- Date: days between two dates, or a date plus/minus some days ----------
const DAY = 24 * 60 * 60 * 1000

// Dates from <input type="date"> look like "2026-10-14". Reading them as UTC (no time zone)
// makes every day exactly 24 hours, so daylight-saving changes can't make a day go missing.
export function parseDate(text) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text)
  if (!match) return null
  const [, year, month, day] = match.map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCDate() === day ? date : null // rejects impossible dates like 31 February
}

// Today's date as "2026-10-14", using the phone's own calendar day.
export function todayText() {
  const now = new Date()
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())).toISOString().slice(0, 10)
}

export function daysBetween(start, end) {
  return Math.round((end - start) / DAY)
}

// "1 year, 2 months, 3 days", counted the way people do: same day next month = 1 month.
export function yearsMonthsDays(start, end) {
  const [from, to] = start <= end ? [start, end] : [end, start]
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

export const plural = (count, word) => `${count.toLocaleString()} ${word}${count === 1 ? '' : 's'}`

export const longDate = (date) =>
  date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

// What the results box shows: { label, main, detail }.
export function dateResult({ mode, start: startText, end: endText, direction, days: dayCount }) {
  const label = 'Days between'
  const start = parseDate(startText)
  if (!start) return { label: mode === 'add' ? 'Result' : label, main: '–', detail: 'Pick a start date.' }

  if (mode === 'add') {
    const sign = direction === 'subtract' ? -1 : 1
    return { label: 'Result', main: longDate(addDays(start, sign * dayCount)), detail: '' }
  }

  const end = parseDate(endText)
  if (!end) return { label, main: '–', detail: 'Pick an end date.' }

  const days = daysBetween(start, end)
  const { years, months, days: restDays } = yearsMonthsDays(start, end)
  const weeks = Math.floor(Math.abs(days) / 7)
  return {
    label: days < 0 ? 'Days between (end is before start)' : label,
    main: plural(Math.abs(days), 'day'),
    detail: `${plural(years, 'year')}, ${plural(months, 'month')}, ${plural(restDays, 'day')} · ${plural(weeks, 'week')} ${plural(Math.abs(days) % 7, 'day')}`,
  }
}
