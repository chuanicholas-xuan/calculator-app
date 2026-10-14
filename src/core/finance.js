// ---------- Finance: a loan repayment calculator ----------
// Three common ways to repay a loan:
//  - Equal monthly payment: the same amount every month (home loans, most bank loans).
//  - Equal principal: the same slice of the loan every month, plus that month's interest,
//    so payments start high and get smaller.
//  - Flat rate: interest is worked out once on the whole loan for the whole term
//    (car loans / hire purchase in Malaysia and Singapore). Simple, but costs more.

export const METHODS = [
  { value: 'annuity', name: 'Equal monthly payment' },
  { value: 'principal', name: 'Equal principal (gets smaller)' },
  { value: 'flat', name: 'Flat rate (car loan)' },
]

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

export const money = (value) => value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
