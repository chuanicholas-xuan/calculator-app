// ---------- Finance: a loan repayment calculator ----------
// Three common ways to repay a loan:
//  - Equal monthly payment: the same amount every month (home loans, most bank loans).
//  - Equal principal: the same slice of the loan every month, plus that month's interest,
//    so payments start high and get smaller.
//  - Flat rate: interest is worked out once on the whole loan for the whole term
//    (car loans / hire purchase in Malaysia and Singapore). Simple, but costs more.

const view = document.getElementById('finance-view')
const amountInput = document.getElementById('loan-amount')
const rateInput = document.getElementById('loan-rate')
const yearsInput = document.getElementById('loan-years')
const methodSelect = document.getElementById('loan-method')
const monthlyLabel = document.getElementById('loan-monthly-label')
const monthlyEl = document.getElementById('loan-monthly')
const noteEl = document.getElementById('loan-note')
const interestEl = document.getElementById('loan-interest')
const totalEl = document.getElementById('loan-total')

// ---------- Pure maths: no DOM here, so it is easy to test ----------
// principal = amount borrowed, annualRate = yearly interest in % (e.g. 4.5), years = loan length.
export function loanPlan(principal, annualRate, years, method) {
  const months = Math.round(years * 12)
  if (principal <= 0 || months <= 0) return null
  const monthlyRate = annualRate / 100 / 12

  if (method === 'principal') {
    const slice = principal / months
    // Month 1 pays interest on the whole loan; each month after pays interest on a bit less.
    const totalInterest = (principal * monthlyRate * (months + 1)) / 2
    return {
      firstPayment: slice + principal * monthlyRate,
      drop: slice * monthlyRate, // how much smaller each payment is than the one before
      totalInterest,
      total: principal + totalInterest,
    }
  }

  if (method === 'flat') {
    const totalInterest = principal * (annualRate / 100) * years
    return {
      firstPayment: (principal + totalInterest) / months,
      drop: 0,
      totalInterest,
      total: principal + totalInterest,
    }
  }

  // Equal monthly payment (an "annuity"). The standard formula:
  //   payment = P × r × (1 + r)^n ÷ ((1 + r)^n − 1)
  // With 0% interest that would divide by zero, so then it's just P ÷ n.
  const payment =
    monthlyRate === 0
      ? principal / months
      : (principal * monthlyRate * (1 + monthlyRate) ** months) / ((1 + monthlyRate) ** months - 1)
  return { firstPayment: payment, drop: 0, totalInterest: payment * months - principal, total: payment * months }
}

const money = (value) => value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Only digits and one decimal point, like the other converter boxes.
function readNumber(input) {
  const cleaned = input.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')
  if (cleaned !== input.value) input.value = cleaned
  return cleaned === '' ? 0 : Number(cleaned)
}

function update() {
  const plan = loanPlan(readNumber(amountInput), readNumber(rateInput), readNumber(yearsInput), methodSelect.value)

  if (!plan) {
    monthlyEl.textContent = '–'
    interestEl.textContent = '–'
    totalEl.textContent = '–'
    noteEl.textContent = 'Enter a loan amount and a term.'
    return
  }

  const decreasing = methodSelect.value === 'principal'
  monthlyLabel.textContent = decreasing ? 'First monthly payment' : 'Monthly payment'
  monthlyEl.textContent = money(plan.firstPayment)
  noteEl.textContent = decreasing ? `Then ${money(plan.drop)} less each month` : ''
  interestEl.textContent = money(plan.totalInterest)
  totalEl.textContent = money(plan.total)
}

for (const input of [amountInput, rateInput, yearsInput]) input.addEventListener('input', update)
methodSelect.addEventListener('change', update)

// ---------- Used by converter.js ----------
export const finance = {
  title: 'Finance',
  view,
  open() {
    view.hidden = false
    update()
    amountInput.focus()
  },
}
