import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted fonts (privacy: no Google Fonts CDN, works offline on first load).
// Weights mirror what the app uses — Baloo 2 700/800, Nunito 400/700/800/900.
import '@fontsource/baloo-2/700.css'
import '@fontsource/baloo-2/800.css'
import '@fontsource/nunito/400.css'
import '@fontsource/nunito/700.css'
import '@fontsource/nunito/800.css'
import '@fontsource/nunito/900.css'
import './i18n/index'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
