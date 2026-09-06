import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { loadKcc20Sdk } from '@/lib/kcc20Pwa'

loadKcc20Sdk().catch(() => {})

// If the Scorpion wallet handoff reloaded the app to the root, jump back to the
// route the user was on (e.g. the App Store) before the landing even renders.
try {
  const raw = sessionStorage.getItem("ttt_wallet_return");
  if (raw && location.pathname === "/") {
    const r = JSON.parse(raw);
    if (r && r.path && r.path !== "/" && Date.now() - (r.at || 0) < 5 * 60 * 1000) {
      sessionStorage.removeItem("ttt_wallet_return");
      location.replace(r.path);
    } else if (r) {
      sessionStorage.removeItem("ttt_wallet_return");
    }
  }
} catch {}

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  <App />
  // </React.StrictMode>,
)

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:beforeUpdate' }, '*');
  });
  import.meta.hot.on('vite:afterUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:afterUpdate' }, '*');
  });
}