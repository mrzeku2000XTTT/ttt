import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { base44 } from '@/api/base44Client'
import { appParams } from '@/lib/app-params'

// Paint Kaspa loader full-screen, replacing all DOM content.
function __paintKaspaLoader() {
  try {
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
}

// Build the direct base44 auth URL, skipping the server-rendered /login flash.
function __buildBase44LoginUrl(nextUrl) {
  const appId = appParams?.appId;
  if (!appId) return null;
  const next = nextUrl || window.location.href;
  return `https://app.base44.com/login?app_id=${encodeURIComponent(appId)}&from_url=${encodeURIComponent(next)}`;
}

// Intercept ANY navigation to a same-origin /login path and reroute it to
// base44's auth URL directly — kills the flash regardless of which code path
// triggered the redirect (SDK, framework, manual <a href>, etc.).
;(function installLoginNavInterceptor() {
  if (typeof window === 'undefined') return;
  if (window.__loginNavInterceptorInstalled) return;
  window.__loginNavInterceptorInstalled = true;

  const isLoginPath = (url) => {
    try {
      const u = new URL(url, window.location.origin);
      return u.origin === window.location.origin && /^\/login\/?$/i.test(u.pathname);
    } catch { return false; }
  };

  // Patch window.location.assign / replace / href setter
  const origAssign = window.location.assign.bind(window.location);
  const origReplace = window.location.replace.bind(window.location);
  try {
    window.location.assign = function (url) {
      if (isLoginPath(url)) {
        const direct = __buildBase44LoginUrl();
        if (direct) { __paintKaspaLoader(); return origReplace(direct); }
      }
      return origAssign(url);
    };
    window.location.replace = function (url) {
      if (isLoginPath(url)) {
        const direct = __buildBase44LoginUrl();
        if (direct) { __paintKaspaLoader(); return origReplace(direct); }
      }
      return origReplace(url);
    };
  } catch {}

  // Patch href setter
  try {
    const proto = Object.getPrototypeOf(window.location);
    const desc = Object.getOwnPropertyDescriptor(proto, 'href') ||
                 Object.getOwnPropertyDescriptor(window.location, 'href');
    if (desc && desc.set) {
      const origSet = desc.set;
      Object.defineProperty(window.location, 'href', {
        configurable: true,
        get: desc.get ? desc.get.bind(window.location) : () => window.location.toString(),
        set(url) {
          if (isLoginPath(url)) {
            const direct = __buildBase44LoginUrl();
            if (direct) { __paintKaspaLoader(); return origSet.call(window.location, direct); }
          }
          return origSet.call(window.location, url);
        }
      });
    }
  } catch {}

  // If the page itself loads at /login (e.g. from React Router navigation that
  // already happened), bounce immediately.
  if (/^\/login\/?$/i.test(window.location.pathname)) {
    const direct = __buildBase44LoginUrl();
    if (direct) { __paintKaspaLoader(); origReplace(direct); }
  }
})();

// Globally wrap redirectToLogin so any code that triggers it paints the
// Kaspa loader full-screen BEFORE navigation.
;(function installLoginOverlay() {
  const auth = base44?.auth;
  if (!auth || typeof auth.redirectToLogin !== 'function') return;
  if (auth.__overlayPatched) return;
  const original = auth.redirectToLogin.bind(auth);
  auth.redirectToLogin = function patchedRedirectToLogin(nextUrl) {
    __paintKaspaLoader();
    const directUrl = __buildBase44LoginUrl(nextUrl);
    if (directUrl) {
      window.location.replace(directUrl);
      return;
    }
    return original(nextUrl);
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