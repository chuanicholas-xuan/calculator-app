// ---------- Discount: what you pay after a sale, and how much you save ----------
// Shops often stack discounts: "20% off, plus an extra 10% off". The extra discount comes off the
// already-reduced price, so 20% + 10% is 28% off in total, not 30%.

const view = document.getElementById('discount-view')
const priceInput = document.getElementById('discount-price')
const percentInput = document.getElementById('discount-percent')
const extraInput = document.getElementById('discount-extra')
const finalEl = document.getElementById('discount-final')
const noteEl = document.getElementById('discount-note')
const savedEl = document.getElementById('discount-saved')

// ---------- Pure maths: no DOM here, so it is easy to test ----------
// percent and extra are "% off", e.g. 20 for 20% off.
export function discountPlan(price, percent, extra = 0) {
  if (price <= 0 || percent > 100 || extra > 100) return null
  const final = price * (1 - percent / 100) * (1 - extra / 100)
  return { final, saved: price - final, totalPercent: (1 - final / price) * 100 }
}

const money = (value) => value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Only digits and one decimal point, like the other converter boxes.
function readNumber(input) {
  const cleaned = input.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')
  if (cleaned !== input.value) input.value = cleaned
  return cleaned === '' ? 0 : Number(cleaned)
}

function update() {
  const extra = readNumber(extraInput)
  const plan = discountPlan(readNumber(priceInput), readNumber(percentInput), extra)

  if (!plan) {
    finalEl.textContent = '–'
    savedEl.textContent = '–'
    noteEl.textContent = readNumber(priceInput) > 0 ? 'A discount can be at most 100%.' : 'Enter a price.'
    return
  }

  finalEl.textContent = money(plan.final)
  savedEl.textContent = money(plan.saved)
  // Only worth explaining when two discounts are stacked.
  noteEl.textContent = extra > 0 ? `${plan.totalPercent.toLocaleString(undefined, { maximumFractionDigits: 2 })}% off in total` : ''
}

for (const input of [priceInput, percentInput, extraInput]) input.addEventListener('input', update)

// ---------- Used by converter.js ----------
export const discount = {
  title: 'Discount',
  view,
  open() {
    view.hidden = false
    update()
    priceInput.focus()
  },
}
