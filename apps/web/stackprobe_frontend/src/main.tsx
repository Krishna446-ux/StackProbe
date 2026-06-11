import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// ── Apply saved settings before first render to prevent flash ──────────────
(function applyBootstrapSettings() {
  try {
    const raw = localStorage.getItem('sp-settings');
    const saved = raw ? JSON.parse(raw) : {};
    const html = document.documentElement;

    // Theme
    if (saved.theme === 'light') {
      html.classList.add('sp-light');
    }

    // Font size
    const fontClassMap: Record<string, string> = {
      small: 'sp-font-sm',
      medium: 'sp-font-md',
      large: 'sp-font-lg',
    };
    html.classList.add(fontClassMap[saved.fontSize] ?? 'sp-font-sm');
  } catch {
    document.documentElement.classList.add('sp-font-sm');
  }
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
