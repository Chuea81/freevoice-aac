import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n/index'
import './index.css'
import App from './App.tsx'

// Cross-origin isolation: the COI service worker (public/coi.js) header-stamps
// the app shell, but the very first document load (before the SW controls the
// page) isn't isolated. Reload once so we get the SW-served, isolated document
// -> SharedArrayBuffer -> the Kokoro neural voices work on desktop web. The
// sessionStorage guard prevents reload loops on browsers that can't isolate.
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  if (self.crossOriginIsolated) {
    sessionStorage.removeItem('coiReload')
  } else if (navigator.serviceWorker.controller && !sessionStorage.getItem('coiReload')) {
    sessionStorage.setItem('coiReload', '1')
    window.location.reload()
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
