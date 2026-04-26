import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { base44 } from '@/api/base44Client'

// Globally wrap redirectToLogin so any code that triggers it paints the
// Kaspa loader full-screen BEFORE navigation. This hides the brief flash of
// base44's server-rendered /login page list on custom domains.
;(function installLoginOverlay() {
  const auth = base44?.auth;
  if (!auth || typeof auth.redirectToLogin !== 'function') return;
  if (auth.__overlayPatched) return;
  const original = auth.redirectToLogin.bind(auth);
  auth.redirectToLogin = function patchedRedirectToLogin(...args) {
    try {
      // Replace document body with a fixed Kaspa-logo overlay so nothing else
      // can paint on top while the browser navigates to base44's login UI.
      document.documentElement.style.cssText = 'background:#000;';
      document.body.style.cssText = 'background:#000;margin:0;padding:0;overflow:hidden;color:#fff;';
      document.body.innerHTML = `
        <div style="position:fixed;inset:0;background:#000;z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;">
          <div style="width:88px;height:88px;position:relative;animation:__kf 2.4s ease-in-out infinite;">
            <div style="position:absolute;inset:-20%;border-radius:50%;background:radial-gradient(circle,rgba(73,234,200,0.35) 0%,rgba(73,234,200,0) 65%);animation:__kp 2.4s ease-in-out infinite;"></div>
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;animation:__ks 3.2s cubic-bezier(.6,.05,.4,.95) infinite;filter:drop-shadow(0 0 18px rgba(73,234,200,0.55));">
              <defs>
                <linearGradient id="__kg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#70F0CC"/>
                  <stop offset="100%" stop-color="#26B198"/>
                </linearGradient>
              </defs>
              <circle cx="100" cy="100" r="92" fill="url(#__kg)"/>
              <path d="M70 50 L70 150 M70 100 L130 50 M70 100 L130 150" stroke="#0b1b18" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>
          </div>
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;letter-spacing:0.2em;color:rgba(255,255,255,0.5);text-transform:uppercase;">Connecting</div>
        </div>
        <style>
          @keyframes __ks { 0%{transform:rotate(0deg)} 50%{transform:rotate(180deg)} 100%{transform:rotate(360deg)} }
          @keyframes __kf { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
          @keyframes __kp { 0%,100%{opacity:.4;transform:scale(.9)} 50%{opacity:.9;transform:scale(1.15)} }
        </style>
      `;
    } catch {}
    return original(...args);
  };
  auth.__overlayPatched = true;
})();

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