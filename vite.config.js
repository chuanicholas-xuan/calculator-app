import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The React plugin lets Vite understand JSX (the HTML-looking code in .jsx files).
export default defineConfig({
  plugins: [react()],
})
