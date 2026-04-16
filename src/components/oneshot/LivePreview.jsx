import React, { useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle, RefreshCw, Monitor, Smartphone } from "lucide-react";

/**
 * Renders AI-generated JSX inside a sandboxed iframe.
 * Uses Babel Standalone (CDN) to transpile the JSX at runtime + Tailwind CDN for styling.
 */
export default function LivePreview({ code }) {
  const iframeRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMsg, setErrorMsg] = useState("");
  const [viewport, setViewport] = useState("desktop"); // desktop | mobile
  const [reloadKey, setReloadKey] = useState(0);

  const cleanCode = (raw) => {
    if (!raw) return "";
    let c = String(raw).trim();
    // Strip ALL markdown code fences (anywhere, not just at start/end)
    c = c.replace(/```(?:jsx?|tsx?|javascript|react|js)?\n?/gi, "");
    c = c.replace(/```/g, "");
    // Remove import statements (single and multi-line)
    c = c.replace(/^\s*import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, "");
    c = c.replace(/^\s*import\s+['"][^'"]+['"];?\s*$/gm, "");
    // Remove export default prefix but keep the declaration
    c = c.replace(/export\s+default\s+/g, "");
    // Remove any other top-level export keywords
    c = c.replace(/^\s*export\s+/gm, "");
    return c.trim();
  };

  const buildSrcDoc = (rawCode) => {
    const cleaned = cleanCode(rawCode);
    // Escape closing </script> so it doesn't break our inline script
    const safeUserCode = cleaned.replace(/<\/script>/gi, "<\\/script>");

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
  .__oneshot-err {
    padding: 2rem; font-family: ui-monospace, SFMono-Regular, monospace;
    color: #991b1b; background: #fef2f2; border: 1px solid #fecaca;
    white-space: pre-wrap; font-size: 12px; line-height: 1.6; border-radius: 8px; margin: 1rem;
  }
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
(function() {
  function run() {
    try {
      if (!window.Babel) throw new Error('Babel CDN failed to load (check network)');
      if (!window.React || !window.ReactDOM) throw new Error('React CDN failed to load (check network)');

      var rawUserCode = document.getElementById('user-code').textContent;

      // Build lucide icons dictionary
      var LucideIcons = {};
      if (window.lucide && window.lucide.icons) {
        var toPascal = function(kebab) {
          return kebab.split('-').map(function(s) { return s.charAt(0).toUpperCase() + s.slice(1); }).join('');
        };
        Object.keys(window.lucide.icons).forEach(function(key) {
          var iconData = window.lucide.icons[key];
          var name = toPascal(key);
          LucideIcons[name] = function LucideIcon(props) {
            props = props || {};
            var size = props.size || 24;
            var strokeWidth = props.strokeWidth || 2;
            var className = props.className || '';
            var rest = {};
            for (var k in props) {
              if (k !== 'size' && k !== 'strokeWidth' && k !== 'className') rest[k] = props[k];
            }
            var children = iconData[2] || [];
            var childElements = children.map(function(child, i) {
              return React.createElement(child[0], Object.assign({ key: i }, child[1]));
            });
            return React.createElement('svg', Object.assign({
              xmlns: 'http://www.w3.org/2000/svg',
              width: size, height: size,
              viewBox: '0 0 24 24',
              fill: 'none', stroke: 'currentColor',
              strokeWidth: strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round',
              className: className
            }, rest), childElements);
          };
        });
      }

      var iconNames = Object.keys(LucideIcons);
      var iconPrelude = iconNames.length ? ('var { ' + iconNames.join(', ') + ' } = __LucideIcons;\\n') : '';

      var wrappedSource = iconPrelude + rawUserCode + '\\n;return (typeof ClonedUI !== "undefined") ? ClonedUI : (typeof App !== "undefined") ? App : null;';

      var transpiled = window.Babel.transform(wrappedSource, { presets: ['react'] }).code;

      var factory = new Function('React', 'useState', 'useEffect', 'useRef', 'useMemo', 'useCallback', 'useReducer', 'useContext', 'Fragment', '__LucideIcons', transpiled);
      var Component = factory(
        React, React.useState, React.useEffect, React.useRef,
        React.useMemo, React.useCallback, React.useReducer, React.useContext,
        React.Fragment, LucideIcons
      );

      if (!Component) throw new Error('No component found. Expected "ClonedUI" or "App" in generated code.');

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
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    setStatus("loading");
    setErrorMsg("");
  }, [reloadKey, code]);

  const srcDoc = buildSrcDoc(code);

  return (
    <div className="rounded-2xl overflow-hidden border border-white/[0.07] shadow-2xl shadow-black/60">
      <div className="bg-zinc-950 border-b border-white/[0.07] px-5 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex gap-1.5 flex-shrink-0">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
          </div>
          <span className="text-[11px] text-white/30 font-mono truncate">
            {status === "loading" && "compiling JSX..."}
            {status === "ready" && "live preview · rendered successfully"}
            {status === "error" && "render error"}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center bg-white/[0.04] rounded-lg p-0.5 border border-white/[0.07]">
            <button
              onClick={() => setViewport("desktop")}
              className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${viewport === "desktop" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}
              title="Desktop view"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport("mobile")}
              className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${viewport === "mobile" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}
              title="Mobile view"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.07] text-white/40 hover:text-white hover:bg-white/10 transition-all"
            title="Reload"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="relative bg-zinc-900 flex justify-center" style={{ height: "640px" }}>
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-zinc-900/80 backdrop-blur-sm">
            <div className="flex items-center gap-3 text-white/50 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Compiling & rendering...
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="absolute inset-x-6 top-6 z-10 bg-red-950/80 backdrop-blur-sm border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-red-300 font-bold text-sm mb-1">Preview couldn't render</p>
              <p className="text-red-300/70 text-[11px] font-mono break-all line-clamp-3">{errorMsg}</p>
              <p className="text-red-300/50 text-[11px] mt-2">The AI-generated code may have syntax issues. Check the React Code tab or clone a different URL.</p>
            </div>
          </div>
        )}

        <iframe
          key={reloadKey}
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