import React, { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, AlertCircle, RefreshCw, Monitor, Smartphone, ArrowLeft, ArrowRight, Home } from "lucide-react";

/**
 * Multi-page live preview.
 * Props:
 *   - pages: [{ path, label, url, code }]  (path like "/", "/pricing")
 *   - initialUrl: original site url (for the address bar)
 *   - code (fallback single-page mode)
 */
export default function LivePreview({ pages, initialUrl, code }) {
  // Normalize to always have a pages array
  const pageList = useMemo(() => {
    if (pages && pages.length) return pages;
    if (code) return [{ path: "/", label: "Home", url: initialUrl || "", code }];
    return [];
  }, [pages, code, initialUrl]);

  const iframeRef = useRef(null);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [viewport, setViewport] = useState("desktop");
  const [reloadKey, setReloadKey] = useState(0);

  // History + current path
  const [history, setHistory] = useState([pageList[0]?.path || "/"]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const currentPath = history[historyIdx];
  const currentPage = pageList.find(p => p.path === currentPath) || pageList[0];

  // Build path → code map, plus a list of known paths to expose to the iframe
  const pathMap = useMemo(() => {
    const map = {};
    pageList.forEach(p => { map[p.path] = p; });
    return map;
  }, [pageList]);
  const knownPaths = useMemo(() => pageList.map(p => p.path), [pageList]);

  const navigate = (path) => {
    if (!pathMap[path]) return;
    if (path === currentPath) return;
    const newHistory = history.slice(0, historyIdx + 1);
    newHistory.push(path);
    setHistory(newHistory);
    setHistoryIdx(newHistory.length - 1);
  };

  const goBack = () => { if (historyIdx > 0) setHistoryIdx(historyIdx - 1); };
  const goForward = () => { if (historyIdx < history.length - 1) setHistoryIdx(historyIdx + 1); };
  const goHome = () => navigate(pageList[0]?.path || "/");

  const cleanCode = (raw) => {
    if (!raw) return "";
    let c = String(raw).trim();
    c = c.replace(/```(?:jsx?|tsx?|javascript|react|js)?\n?/gi, "");
    c = c.replace(/```/g, "");
    c = c.replace(/^\s*import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, "");
    c = c.replace(/^\s*import\s+['"][^'"]+['"];?\s*$/gm, "");
    c = c.replace(/export\s+default\s+/g, "");
    c = c.replace(/^\s*export\s+/gm, "");
    return c.trim();
  };

  const buildSrcDoc = (rawCode) => {
    const cleaned = cleanCode(rawCode);
    const safeUserCode = cleaned.replace(/<\/script>/gi, "<\\/script>");
    const knownPathsJson = JSON.stringify(knownPaths);

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Live Preview</title>
<script src="https://cdn.tailwindcss.com"></script>
<script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
<style>
  body { margin: 0; background: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  #root { min-height: 100vh; }
  .__oneshot-err { padding: 2rem; font-family: ui-monospace, monospace; color: #991b1b; background: #fef2f2; border: 1px solid #fecaca; white-space: pre-wrap; font-size: 12px; line-height: 1.6; border-radius: 8px; margin: 1rem; }
</style>
</head>
<body>
<div id="root"></div>
<script id="user-code" type="text/plain">
${safeUserCode}
</script>
<script>
window.addEventListener('error', function(e) {
  window.parent.postMessage({ __oneshot: 'error', message: (e.message || 'Unknown error') + ' @ line ' + (e.lineno || '?') }, '*');
});

// Intercept link clicks & forward to parent for routing
(function() {
  var KNOWN_PATHS = ${knownPathsJson};
  document.addEventListener('click', function(ev) {
    var el = ev.target;
    while (el && el.tagName !== 'A') el = el.parentElement;
    if (!el) return;
    var href = el.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
    ev.preventDefault();
    // Resolve to pathname
    var path = href;
    try {
      var u = new URL(href, 'https://preview.local');
      path = u.pathname;
    } catch {}
    // Match against known paths (exact or by pathname only)
    var match = KNOWN_PATHS.indexOf(path) !== -1 ? path : null;
    if (!match) {
      // Try matching any known path whose pathname equals ours
      for (var i = 0; i < KNOWN_PATHS.length; i++) {
        if (KNOWN_PATHS[i] === path) { match = KNOWN_PATHS[i]; break; }
      }
    }
    if (match) {
      window.parent.postMessage({ __oneshot: 'navigate', path: match }, '*');
    } else {
      window.parent.postMessage({ __oneshot: 'navigate_unknown', path: path, href: href }, '*');
    }
  }, true);
})();

(function() {
  function run() {
    try {
      if (!window.Babel) throw new Error('Babel CDN failed to load');
      if (!window.React || !window.ReactDOM) throw new Error('React CDN failed to load');
      var rawUserCode = document.getElementById('user-code').textContent;

      var LucideIcons = {};
      if (window.lucide && window.lucide.icons) {
        var toPascal = function(kebab) { return kebab.split('-').map(function(s) { return s.charAt(0).toUpperCase() + s.slice(1); }).join(''); };
        var makeIcon = function(iconData) {
          return function LucideIcon(props) {
            props = props || {};
            var size = props.size || 24;
            var strokeWidth = props.strokeWidth || 2;
            var className = props.className || '';
            var rest = {};
            for (var k in props) { if (k !== 'size' && k !== 'strokeWidth' && k !== 'className' && k !== 'children') rest[k] = props[k]; }
            var children = (iconData && iconData[2]) || [];
            var childElements = [];
            for (var i = 0; i < children.length; i++) {
              var child = children[i];
              if (!child || !child[0] || typeof child[0] !== 'string') continue;
              childElements.push(React.createElement(child[0], Object.assign({ key: i }, child[1] || {})));
            }
            return React.createElement('svg', Object.assign({ xmlns: 'http://www.w3.org/2000/svg', width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round', className: className }, rest), childElements);
          };
        };
        Object.keys(window.lucide.icons).forEach(function(key) {
          LucideIcons[toPascal(key)] = makeIcon(window.lucide.icons[key]);
        });
      }
      var FallbackIcon = function(props) {
        props = props || {};
        var size = props.size || 24;
        return React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', className: props.className || '' }, [React.createElement('rect', { key: 0, x: 3, y: 3, width: 18, height: 18, rx: 2 })]);
      };
      var IconProxy = (typeof Proxy !== 'undefined') ? new Proxy(LucideIcons, {
        get: function(target, prop) {
          if (prop in target) return target[prop];
          if (typeof prop === 'string' && /^[A-Z]/.test(prop)) return FallbackIcon;
          return target[prop];
        }
      }) : LucideIcons;

      var RESERVED = { React:1, ReactDOM:1, Fragment:1, useState:1, useEffect:1, useRef:1, useMemo:1, useCallback:1, useReducer:1, useContext:1, Math:1, Date:1, Object:1, Array:1, String:1, Number:1, Boolean:1, JSON:1, Promise:1, Map:1, Set:1, Error:1, RegExp:1, Symbol:1, Proxy:1, Reflect:1, ClonedUI:1, App:1, Component:1 };
      var iconRefs = (rawUserCode.match(/\\b[A-Z][a-zA-Z0-9]*\\b/g) || []);
      var uniqueRefs = {};
      iconRefs.forEach(function(n) { if (!RESERVED[n] && n.length > 1) uniqueRefs[n] = true; });
      var iconAssigns = Object.keys(uniqueRefs).map(function(n) { return 'var ' + n + ' = (__LucideIcons[\\'' + n + '\\'] || __FallbackIcon);'; }).join('\\n');

      var wrappedSource = '(function(__FallbackIcon, __LucideIcons){\\n' + iconAssigns + '\\n' + rawUserCode + '\\nreturn (typeof ClonedUI !== "undefined") ? ClonedUI : (typeof App !== "undefined") ? App : null;\\n})(arguments[arguments.length-2], arguments[arguments.length-1])';
      var transpiled = window.Babel.transform(wrappedSource, { presets: ['react'] }).code;
      var factory = new Function('React', 'useState', 'useEffect', 'useRef', 'useMemo', 'useCallback', 'useReducer', 'useContext', 'Fragment', '__FallbackIcon', '__LucideIcons', 'return ' + transpiled);
      var Component = factory(React, React.useState, React.useEffect, React.useRef, React.useMemo, React.useCallback, React.useReducer, React.useContext, React.Fragment, FallbackIcon, IconProxy);
      if (!Component) throw new Error('No component found. Expected "ClonedUI" in generated code.');
      var root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(Component));
      window.parent.postMessage({ __oneshot: 'ready' }, '*');
    } catch (err) {
      var rootEl = document.getElementById('root');
      if (rootEl) {
        rootEl.innerHTML = '';
        var div = document.createElement('div');
        div.className = '__oneshot-err';
        div.textContent = 'Preview error: ' + (err.message || String(err));
        rootEl.appendChild(div);
      }
      window.parent.postMessage({ __oneshot: 'error', message: err.message || String(err) }, '*');
    }
  }
  if (document.readyState === 'complete') run();
  else window.addEventListener('load', run);
})();
</script>
</body>
</html>`;
  };

  useEffect(() => {
    const onMessage = (ev) => {
      if (!ev.data || typeof ev.data !== "object") return;
      if (ev.data.__oneshot === "ready") setStatus("ready");
      else if (ev.data.__oneshot === "error") {
        setErrorMsg(ev.data.message || "Unknown error");
        setStatus("error");
      } else if (ev.data.__oneshot === "navigate") {
        navigate(ev.data.path);
      } else if (ev.data.__oneshot === "navigate_unknown") {
        // Flash a toast-style message; for now just console
        console.log("Preview: unknown route clicked:", ev.data.path);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, historyIdx, pathMap]);

  useEffect(() => {
    setStatus("loading");
    setErrorMsg("");
  }, [reloadKey, currentPath]);

  if (!currentPage) {
    return <div className="p-8 text-center text-white/50">No pages to preview</div>;
  }

  const srcDoc = buildSrcDoc(currentPage.code);
  const displayUrl = currentPage.url || `${initialUrl || ""}${currentPath}`;

  return (
    <div className="rounded-2xl overflow-hidden border border-white/[0.07] shadow-2xl shadow-black/60">
      {/* Browser chrome */}
      <div className="bg-zinc-950 border-b border-white/[0.07]">
        <div className="px-5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex gap-1.5 flex-shrink-0">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
            </div>

            {/* Back / Forward / Home */}
            <div className="flex items-center gap-0.5 ml-2">
              <button
                onClick={goBack}
                disabled={historyIdx === 0}
                className="w-7 h-7 flex items-center justify-center rounded-md text-white/50 hover:text-white hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed"
                title="Back"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={goForward}
                disabled={historyIdx >= history.length - 1}
                className="w-7 h-7 flex items-center justify-center rounded-md text-white/50 hover:text-white hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed"
                title="Forward"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={goHome}
                className="w-7 h-7 flex items-center justify-center rounded-md text-white/50 hover:text-white hover:bg-white/5"
                title="Home"
              >
                <Home className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Address bar */}
            <div className="flex-1 min-w-0 bg-white/[0.04] rounded-md px-3 py-1 text-[11px] text-white/50 font-mono truncate border border-white/[0.05]">
              {displayUrl}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center bg-white/[0.04] rounded-lg p-0.5 border border-white/[0.07]">
              <button onClick={() => setViewport("desktop")} className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${viewport === "desktop" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`} title="Desktop">
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setViewport("mobile")} className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${viewport === "mobile" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`} title="Mobile">
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
            <button onClick={() => setReloadKey(k => k + 1)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.07] text-white/40 hover:text-white hover:bg-white/10" title="Reload">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Page tabs (only if multi-page) */}
        {pageList.length > 1 && (
          <div className="flex items-center gap-1 px-5 pb-2 overflow-x-auto scrollbar-hide">
            {pageList.map((p) => (
              <button
                key={p.path}
                onClick={() => navigate(p.path)}
                className={`flex-shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                  p.path === currentPath
                    ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-white border border-white/10"
                    : "text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent"
                }`}
              >
                {p.label}
                <span className="ml-2 text-white/25 font-mono text-[10px]">{p.path}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative bg-zinc-900 flex justify-center" style={{ height: "640px" }}>
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-zinc-900/80 backdrop-blur-sm">
            <div className="flex items-center gap-3 text-white/50 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading {currentPage.label}...
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="absolute inset-x-6 top-6 z-10 bg-red-950/80 backdrop-blur-sm border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-red-300 font-bold text-sm mb-1">Preview couldn't render</p>
              <p className="text-red-300/70 text-[11px] font-mono break-all line-clamp-3">{errorMsg}</p>
            </div>
          </div>
        )}

        <iframe
          key={`${currentPath}-${reloadKey}`}
          ref={iframeRef}
          srcDoc={srcDoc}
          title="Live preview"
          sandbox="allow-scripts"
          className="bg-white transition-all duration-300"
          style={{
            width: viewport === "mobile" ? "390px" : "100%",
            height: "100%",
            border: "none",
            boxShadow: viewport === "mobile" ? "0 0 0 1px rgba(255,255,255,0.06)" : "none",
          }}
        />
      </div>
    </div>
  );
}