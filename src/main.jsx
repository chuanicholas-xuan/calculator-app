import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'
import './themes.css'
import { applyTheme, loadTheme } from './core/theme.js'
import App from './App.jsx'

// Put the saved theme on <html> before React draws anything, so the page never flashes Classic first.
applyTheme(loadTheme())

// React takes over the empty <div id="app"> in index.html and draws <App /> inside it.
createRoot(document.getElementById('app')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
