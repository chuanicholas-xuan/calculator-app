// ---------- BMI: body mass index = weight (kg) ÷ height (m)² ----------
// Two sets of categories:
//  - International (WHO): healthy is 18.5 to under 25.
//  - Asian: the WHO's lower cut-offs for Asian people, who tend to have health risks at a lower BMI.
//    Malaysia and Singapore use these: healthy is 18.5 to under 23.
import { toNumber } from './numbers.js'

const KG_PER_LB = 0.45359237
const CM_PER_IN = 2.54

// Each category starts at "from" and runs up to the next one.
const SCALES = {
  who: [
    { from: 0, name: 'Underweight' },
    { from: 18.5, name: 'Healthy weight' },
    { from: 25, name: 'Overweight' },
    { from: 30, name: 'Obese' },
  ],
  asian: [
    { from: 0, name: 'Underweight' },
    { from: 18.5, name: 'Healthy weight' },
    { from: 23, name: 'Overweight' },
    { from: 27.5, name: 'Obese' },
  ],
}

export function bmiValue(kg, cm) {
  if (kg <= 0 || cm <= 0) return null
  return kg / (cm / 100) ** 2
}

export function category(value, scale) {
  return SCALES[scale].findLast((step) => value >= step.from).name
}

// The weights that give a healthy BMI at this height, e.g. 56.7 to 76.3 kg at 175 cm.
export function healthyRange(cm, scale) {
  const [, healthy, over] = SCALES[scale]
  const metresSquared = (cm / 100) ** 2
  return { min: healthy.from * metresSquared, max: over.from * metresSquared }
}

const oneDecimal = (value) => value.toLocaleString(undefined, { maximumFractionDigits: 1 })
const round1 = (value) => String(Math.round(value * 10) / 10)

// The boxes are text: { kg, cm, lb, ft, in }. Everything is worked out in kg and cm.
function toMetric(body, units) {
  if (units === 'metric') return { kg: toNumber(body.kg), cm: toNumber(body.cm) }
  return { kg: toNumber(body.lb) * KG_PER_LB, cm: (toNumber(body.ft) * 12 + toNumber(body.in)) * CM_PER_IN }
}

// What the results box shows: { value, category, range }.
export function bmiResult(body, units, scale) {
  const { kg, cm } = toMetric(body, units)
  const value = bmiValue(kg, cm)
  if (value === null) return { value: '–', category: 'Enter your weight and height.', range: '–' }

  const { min, max } = healthyRange(cm, scale)
  return {
    value: oneDecimal(value),
    category: category(value, scale),
    range:
      units === 'imperial'
        ? `${oneDecimal(min / KG_PER_LB)} to ${oneDecimal(max / KG_PER_LB)} lb`
        : `${oneDecimal(min)} to ${oneDecimal(max)} kg`,
  }
}

// Switching units carries the numbers across, so 70 kg becomes 154.3 lb instead of an empty box.
// Returns new boxes; the old ones are left alone.
export function switchUnits(body, toUnits) {
  if (toUnits === 'imperial') {
    const kg = toNumber(body.kg)
    const totalInches = toNumber(body.cm) / CM_PER_IN
    let feet = Math.floor(totalInches / 12)
    let inches = Math.round((totalInches - feet * 12) * 10) / 10
    if (inches >= 12) [feet, inches] = [feet + 1, 0] // 5 ft 11.97 in rounds to 6 ft 0 in, not 5 ft 12 in
    return {
      ...body,
      lb: kg ? round1(kg / KG_PER_LB) : '',
      ft: totalInches ? String(feet) : '',
      in: totalInches ? String(inches) : '',
    }
  }
  const lb = toNumber(body.lb)
  const totalInches = toNumber(body.ft) * 12 + toNumber(body.in)
  return { ...body, kg: lb ? round1(lb * KG_PER_LB) : '', cm: totalInches ? round1(totalInches * CM_PER_IN) : '' }
}
