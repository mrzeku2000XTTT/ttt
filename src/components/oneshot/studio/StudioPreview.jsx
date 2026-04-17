import React, { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, AlertCircle, RefreshCw, Monitor, Smartphone } from "lucide-react";

/**
 * Studio multi-file preview.
 * Supports a virtual filesystem where the entry file can import from other files
 * using relative imports like: import X from './Component.jsx'
 */
export default function StudioPreview({ files, entryPath }) {
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [viewport, setViewport] = useState("desktop");
  const [reloadKey, setReloadKey] = useState(0);

  const entry = useMemo(() => files.find((f) => f.path === entryPath) || files[0], [files, entryPath]);

  const cleanCode = (raw) => {
    if (!raw) return "";
    let c = String(raw).trim();
    c = c.replace(/```(?:jsx?|tsx?|javascript|react|js)?\n?/gi, "");
    c = c.replace(/```/g, "");
    return c.trim();
  };

  const buildSrcDoc = () => {
    if (!entry) return "";

    // Build a virtual module map: { "/Home.jsx": "code...", ... }
    const moduleMap = {};
    for (const f of files) {
      moduleMap[f.path] = cleanCode(f.content);
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Studio Preview</title>
<script src="https://cdn.tailwindcss.com"></script>
<script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
<style>
  body { margin: 0; background: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  #root { min-height: 100vh; }
  .__studio-err { padding: 1.5rem; font-family: ui-monospace, monospace; color: #991b1b; background: #fef2f2; border: 1px solid #fecaca; white-space: pre-wrap; font-size: 12px; line-height: 1.6; border-radius: 8px; margin: 1rem; }
</style>
</head>
<body>
<div id="root"></div>
<script id="module-map" type="application/json">${JSON.stringify(moduleMap).replace(/</g, "\\u003c")}</script>
<script id="entry-path" type="text/plain">${entry.path}</script>
<script>
window.addEventListener('error', function(e) {
  window.parent.postMessage({ __studio: 'error', message: (e.message || 'Unknown error') }, '*');
});

(function() {
  function run() {
    try {
      if (!window.Babel) throw new Error('Babel failed to load');
      if (!window.React || !window.ReactDOM) throw new Error('React failed to load');

      var moduleMap = JSON.parse(document.getElementById('module-map').textContent);
      var entryPath = document.getElementById('entry-path').textContent;

      // Set up Lucide icons proxy
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
        return React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', width: props.size||24, height: props.size||24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, className: props.className || '' }, [React.createElement('rect', { key: 0, x: 3, y: 3, width: 18, height: 18, rx: 2 })]);
      };
      var IconProxy = new Proxy(LucideIcons, {
        get: function(target, prop) {
          if (prop in target) return target[prop];
          if (typeof prop === 'string' && /^[A-Z]/.test(prop)) return FallbackIcon;
          return target[prop];
        }
      });

      // Resolve path relative to current file
      function resolvePath(fromPath, importPath) {
        // Absolute-ish: starts with /
        if (importPath.startsWith('/')) {
          return importPath;
        }
        // Relative: ./ or ../
        if (importPath.startsWith('./') || importPath.startsWith('../')) {
          var dir = fromPath.split('/').slice(0, -1).join('/') || '';
          var parts = (dir + '/' + importPath).split('/');
          var out = [];
          for (var i = 0; i < parts.length; i++) {
            var p = parts[i];
            if (p === '' || p === '.') continue;
            if (p === '..') { out.pop(); continue; }
            out.push(p);
          }
          return '/' + out.join('/');
        }
        return null; // bare specifier — treat as external
      }

      // Normalize path to include .jsx if missing
      function normalize(path) {
        if (moduleMap[path]) return path;
        if (moduleMap[path + '.jsx']) return path + '.jsx';
        if (moduleMap[path + '.js']) return path + '.js';
        if (moduleMap[path + '/index.jsx']) return path + '/index.jsx';
        return path;
      }

      // Module cache
      var cache = {};

      function compileAndLoad(path) {
        path = normalize(path);
        if (cache[path]) return cache[path].exports;
        if (!moduleMap[path]) {
          throw new Error('Module not found: ' + path);
        }

        var module = { exports: {} };
        cache[path] = module;

        var src = moduleMap[path];

        // Strip imports but capture them for local require
        var imports = [];
        // Match: import X from 'path'  |  import {A,B} from 'path'  |  import X, {A} from 'path'  |  import 'path'
        src = src.replace(/^\\s*import\\s+(?:([\\w$]+)(?:\\s*,\\s*\\{([^}]+)\\})?|\\{([^}]+)\\})\\s+from\\s+['"]([^'"]+)['"];?/gm, function(_, defName, defAndNamed, namedOnly, mod) {
          imports.push({ defName: defName, named: defAndNamed || namedOnly || '', mod: mod });
          return '';
        });
        src = src.replace(/^\\s*import\\s+['"][^'"]+['"];?/gm, '');

        // Build import shim prelude: var X = __require('path').default; var A = __require('path').A;
        var prelude = '';
        for (var i = 0; i < imports.length; i++) {
          var imp = imports[i];
          var resolved = resolvePath(path, imp.mod);
          if (resolved === null) {
            // External bare specifier — ignore (React/lucide already globals)
            continue;
          }
          var varName = '__mod_' + i;
          prelude += 'var ' + varName + ' = __require(' + JSON.stringify(resolved) + ');\\n';
          if (imp.defName) {
            prelude += 'var ' + imp.defName + ' = ' + varName + '.default || ' + varName + ';\\n';
          }
          if (imp.named) {
            var names = imp.named.split(',').map(function(s){return s.trim();}).filter(Boolean);
            for (var j = 0; j < names.length; j++) {
              var nm = names[j];
              // Handle "X as Y"
              var asMatch = nm.match(/^(\\w+)\\s+as\\s+(\\w+)$/);
              if (asMatch) {
                prelude += 'var ' + asMatch[2] + ' = ' + varName + '.' + asMatch[1] + ';\\n';
              } else {
                prelude += 'var ' + nm + ' = ' + varName + '.' + nm + ';\\n';
              }
            }
          }
        }

        // Transform "export default X" -> "module.exports.default = X"
        // Transform "export function X" / "export const X" -> also add to module.exports
        src = src.replace(/export\\s+default\\s+/g, 'module.exports.default = ');
        src = src.replace(/export\\s+(?:const|let|var)\\s+(\\w+)\\s*=/g, 'module.exports.$1 =');
        src = src.replace(/export\\s+function\\s+(\\w+)/g, 'module.exports.$1 = function $1');
        src = src.replace(/export\\s+\\{([^}]+)\\};?/g, function(_, inside) {
          return inside.split(',').map(function(n) { n = n.trim(); if (!n) return ''; return 'module.exports.' + n + ' = ' + n + ';'; }).join('\\n');
        });

        // Reserve: if no default export was set but the file defines a top-level function/const named like the path, expose it
        var fullSrc = 'with (__scope) { ' + prelude + src + '\\n; if (!module.exports.default && typeof ClonedUI !== "undefined") module.exports.default = ClonedUI; if (!module.exports.default && typeof App !== "undefined") module.exports.default = App; }';

        var transpiled = window.Babel.transform(fullSrc, { presets: ['react'] }).code;

        var scope = {
          React: React,
          useState: React.useState,
          useEffect: React.useEffect,
          useRef: React.useRef,
          useMemo: React.useMemo,
          useCallback: React.useCallback,
          useReducer: React.useReducer,
          useContext: React.useContext,
          Fragment: React.Fragment,
        };
        // Add all lucide icons to scope
        Object.keys(LucideIcons).forEach(function(k) { scope[k] = LucideIcons[k]; });
        // Proxy fallback for any capitalized name (unknown icons)
        var scopeProxy = new Proxy(scope, {
          has: function(target, prop) {
            // Only claim ownership of capitalized names (components/icons) we can provide.
            // This prevents "with" from swallowing every identifier and returning undefined for things like window globals.
            if (prop in target) return true;
            if (typeof prop === 'string' && /^[A-Z]/.test(prop)) return true;
            return false;
          },
          get: function(target, prop) {
            if (prop in target) return target[prop];
            if (typeof prop === 'string' && /^[A-Z]/.test(prop)) return FallbackIcon;
            return undefined;
          }
        });

        var fn = new Function('module', '__require', '__scope', transpiled);
        fn(module, compileAndLoad, scopeProxy);
        return module.exports;
      }

      var entryModule = compileAndLoad(entryPath);
      var EntryComponent = entryModule.default || entryModule.ClonedUI || entryModule.App;
      if (!EntryComponent) throw new Error('Entry file must export a default component');

      var root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(EntryComponent));
      window.parent.postMessage({ __studio: 'ready' }, '*');
    } catch (err) {
      var rootEl = document.getElementById('root');
      if (rootEl) {
        rootEl.innerHTML = '';
        var div = document.createElement('div');
        div.className = '__studio-err';
        div.textContent = 'Preview error: ' + (err.message || String(err));
        rootEl.appendChild(div);
      }
      window.parent.postMessage({ __studio: 'error', message: err.message || String(err) }, '*');
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
      if (ev.data.__studio === "ready") setStatus("ready");
      else if (ev.data.__studio === "error") {
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
  }, [reloadKey, entryPath, files]);

  if (!entry) {
    return <div className="h-full flex items-center justify-center text-white/30 text-sm">No entry file</div>;
  }

  const srcDoc = buildSrcDoc();

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
          </div>
          <span className="text-[11px] text-white/40 font-mono ml-2">{entry.path}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white/[0.04] rounded-md p-0.5 border border-white/[0.07]">
            <button onClick={() => setViewport("desktop")} className={`w-6 h-6 flex items-center justify-center rounded ${viewport === "desktop" ? "bg-white/10 text-white" : "text-white/40"}`}>
              <Monitor className="w-3 h-3" />
            </button>
            <button onClick={() => setViewport("mobile")} className={`w-6 h-6 flex items-center justify-center rounded ${viewport === "mobile" ? "bg-white/10 text-white" : "text-white/40"}`}>
              <Smartphone className="w-3 h-3" />
            </button>
          </div>
          <button onClick={() => setReloadKey((k) => k + 1)} className="w-6 h-6 flex items-center justify-center rounded bg-white/[0.04] border border-white/[0.07] text-white/40 hover:text-white">
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="relative flex-1 bg-zinc-900 flex justify-center overflow-hidden">
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-zinc-900/80">
            <Loader2 className="w-4 h-4 text-white/50 animate-spin" />
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-x-4 top-4 z-10 bg-red-950/90 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-[11px] font-mono break-all">{errorMsg}</p>
          </div>
        )}
        <iframe
          key={reloadKey + entryPath}
          srcDoc={srcDoc}
          title="Studio preview"
          sandbox="allow-scripts"
          className="bg-white"
          style={{
            width: viewport === "mobile" ? "390px" : "100%",
            height: "100%",
            border: "none",
          }}
        />
      </div>
    </div>
  );
}