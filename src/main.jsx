import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'
import './themes.css'
import App from './App.jsx'

// Keep the theme chosen in the old version until Settings is rebuilt in React.
// The theme is just an attribute on <html>; only names we know are accepted.
const THEMES = ['classic', 'glass', 'bold', 'neon', 'daylight']
try {
  const saved = localStorage.getItem('calculator-theme')
  document.documentElement.dataset.theme = THEMES.includes(saved) ? saved : 'classic'
} catch {
  document.documentElement.dataset.theme = 'classic'
}

// React takes over the empty <div id="app"> in index.html and draws <App /> inside it.
createRoot(document.getElementById('app')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
