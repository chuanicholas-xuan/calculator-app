// ---------- Discount: what you pay after a sale, and how much you save ----------
// Shops often stack discounts: "20% off, plus an extra 10% off". The extra discount comes off the
// already-reduced price, so 20% + 10% is 28% off in total, not 30%.

// percent and extra are "% off", e.g. 20 for 20% off.
export function discountPlan(price, percent, extra = 0) {
  if (price <= 0 || percent > 100 || extra > 100) return null
  const final = price * (1 - percent / 100) * (1 - extra / 100)
  return { final, saved: price - final, totalPercent: (1 - final / price) * 100 }
}

// What the note under the final price says.
export function discountNote(plan, price, extra) {
  if (!plan) return price > 0 ? 'A discount can be at most 100%.' : 'Enter a price.'
  // Only worth explaining when two discounts are stacked.
  return extra > 0 ? `${plan.totalPercent.toLocaleString(undefined, { maximumFractionDigits: 2 })}% off in total` : ''
}
