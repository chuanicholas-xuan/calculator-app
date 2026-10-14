// ---------- Themes ----------
// The theme is just an attribute on <html>, like <html data-theme="neon">.
// themes.css has rules that only apply when that attribute matches, so changing
// one attribute restyles the whole app. No colours are set from JavaScript.
export const THEMES = [
  { id: 'classic', name: 'Classic' },
  { id: 'glass', name: 'Aurora glass' },
  { id: 'bold', name: 'Bold & playful' },
  { id: 'neon', name: 'Midnight neon' },
  { id: 'daylight', name: 'Daylight' },
]
const THEME_KEY = 'calculator-theme'

// Storage can be edited by hand, so only accept a name we know. Anything else means Classic.
const known = (id) => (THEMES.some((theme) => theme.id === id) ? id : 'classic')

export function loadTheme() {
  try {
    return known(localStorage.getItem(THEME_KEY))
  } catch {
    return 'classic'
  }
}

export function applyTheme(id) {
  const theme = known(id)
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // Storage blocked: the theme still works until the page is closed.
  }
}
