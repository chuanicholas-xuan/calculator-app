// ---------- BMI: body mass index = weight (kg) ÷ height (m)² ----------
// Two sets of categories:
//  - International (WHO): healthy is 18.5 to under 25.
//  - Asian: the WHO's lower cut-offs for Asian people, who tend to have health risks at a lower BMI.
//    Malaysia and Singapore use these: healthy is 18.5 to under 23.

const view = document.getElementById('bmi-view')
const unitsSelect = document.getElementById('bmi-units')
const scaleSelect = document.getElementById('bmi-scale')
const metricFields = document.getElementById('bmi-metric-fields')
const imperialFields = document.getElementById('bmi-imperial-fields')
const kgInput = document.getElementById('bmi-kg')
const cmInput = document.getElementById('bmi-cm')
const lbInput = document.getElementById('bmi-lb')
const ftInput = document.getElementById('bmi-ft')
const inInput = document.getElementById('bmi-in')
const valueEl = document.getElementById('bmi-value')
const categoryEl = document.getElementById('bmi-category')
const rangeEl = document.getElementById('bmi-range')

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

// ---------- Pure maths: no DOM here, so it is easy to test ----------
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

// ---------- Drawing ----------
// Only digits and one decimal point, like the other converter boxes.
function readNumber(input) {
  const cleaned = input.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')
  if (cleaned !== input.value) input.value = cleaned
  return cleaned === '' ? 0 : Number(cleaned)
}

const oneDecimal = (value) => value.toLocaleString(undefined, { maximumFractionDigits: 1 })

// Everything is worked out in kg and cm; pounds and feet are converted first.
function readBody() {
  if (unitsSelect.value === 'metric') return { kg: readNumber(kgInput), cm: readNumber(cmInput) }
  return { kg: readNumber(lbInput) * KG_PER_LB, cm: (readNumber(ftInput) * 12 + readNumber(inInput)) * CM_PER_IN }
}

function update() {
  const imperial = unitsSelect.value === 'imperial'
  metricFields.hidden = imperial
  imperialFields.hidden = !imperial

  const { kg, cm } = readBody()
  const value = bmiValue(kg, cm)
  if (value === null) {
    valueEl.textContent = '–'
    categoryEl.textContent = 'Enter your weight and height.'
    rangeEl.textContent = '–'
    return
  }

  const scale = scaleSelect.value
  valueEl.textContent = oneDecimal(value)
  categoryEl.textContent = category(value, scale)
  const { min, max } = healthyRange(cm, scale)
  rangeEl.textContent = imperial
    ? `${oneDecimal(min / KG_PER_LB)} to ${oneDecimal(max / KG_PER_LB)} lb`
    : `${oneDecimal(min)} to ${oneDecimal(max)} kg`
}

// Switching units carries the numbers across, so 70 kg becomes 154.3 lb instead of an empty box.
unitsSelect.addEventListener('change', () => {
  if (unitsSelect.value === 'imperial') {
    const kg = readNumber(kgInput)
    const totalInches = readNumber(cmInput) / CM_PER_IN
    let feet = Math.floor(totalInches / 12)
    let inches = Math.round((totalInches - feet * 12) * 10) / 10
    if (inches >= 12) [feet, inches] = [feet + 1, 0] // 5 ft 11.97 in rounds to 6 ft 0 in, not 5 ft 12 in
    lbInput.value = kg ? String(Math.round((kg / KG_PER_LB) * 10) / 10) : ''
    ftInput.value = totalInches ? String(feet) : ''
    inInput.value = totalInches ? String(inches) : ''
  } else {
    const lb = readNumber(lbInput)
    const totalInches = readNumber(ftInput) * 12 + readNumber(inInput)
    kgInput.value = lb ? String(Math.round(lb * KG_PER_LB * 10) / 10) : ''
    cmInput.value = totalInches ? String(Math.round(totalInches * CM_PER_IN * 10) / 10) : ''
  }
  update()
})

scaleSelect.addEventListener('change', update)
for (const input of [kgInput, cmInput, lbInput, ftInput, inInput]) input.addEventListener('input', update)

// ---------- Used by converter.js ----------
export const bmi = {
  title: 'BMI',
  view,
  open() {
    view.hidden = false
    update()
    ;(unitsSelect.value === 'metric' ? kgInput : lbInput).focus()
  },
}
