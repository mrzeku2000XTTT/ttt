import React, { useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle, RefreshCw, Monitor, Smartphone } from "lucide-react";

/**
 * Renders AI-generated JSX inside a sandboxed iframe.
 * Uses Babel Standalone (CDN) to transpile the JSX at runtime + Tailwind CDN for styling.
 * Lucide icons are exposed globally via window.Lucide (from CDN).
 */
export default function LivePreview({ code }) {
  const iframeRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMsg, setErrorMsg] = useState("");
  const [viewport, setViewport] = useState("desktop"); // desktop | mobile
  const [reloadKey, setReloadKey] = useState(0);

  // Clean code: strip markdown fences, import/export statements that don't work inline
  const cleanCode = (raw) => {
    if (!raw) return "";
    let c = raw.trim();
    // Strip markdown code fences
    c = c.replace(/^```(?:jsx?|tsx?|javascript|react)?\n?/i, "").replace(/```\s*$/, "");
    // Strip import statements (we provide React + lucide globally)
    c = c.replace(/^\s*import\s+[^;]+;?\s*$/gm, "");
    // Strip `export default` keyword but keep the function/component
    c = c.replace(/export\s+default\s+/g, "");
    return c.trim();
  };

  const buildSrcDoc = (code) => {
    const cleaned = cleanCode(code);

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
<script type="text/babel" data-presets="react">
try {
  // Expose every lucide icon as a PascalCase React component.
  // lucide CDN exposes window.lucide with { icons: {...}, createIcons, ... }
  // We generate React wrappers for each icon so <ArrowRight /> etc. work.
  const LucideIcons = {};
  if (window.lucide && window.lucide.icons) {
    const toPascal = (kebab) => kebab.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
    Object.keys(window.lucide.icons).forEach(key => {
      const iconData = window.lucide.icons[key];
      const name = toPascal(key);
      LucideIcons[name] = function LucideIcon(props) {
        const { size = 24, strokeWidth = 2, className = '', ...rest } = props || {};
        const [tag, attrs, children] = iconData;
        return React.createElement('svg', {
          xmlns: 'http://www.w3.org/2000/svg',
          width: size, height: size,
          viewBox: '0 0 24 24',
          fill: 'none', stroke: 'currentColor',
          strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round',
          className, ...rest
        }, (children || []).map((child, i) => React.createElement(child[0], { key: i, ...child[1] })));
      };
    });
  }

  // Destructure every lucide icon into local scope so JSX can reference them directly
  const { ${[
    "ArrowRight","ArrowLeft","ArrowUp","ArrowDown","Check","CheckCircle","CheckCircle2","X","XCircle","Menu","Search","Heart","Star","User","Users","Home","Settings","Bell","Mail","Phone","Calendar","Clock","Map","MapPin","Globe","Lock","Unlock","Eye","EyeOff","Plus","Minus","Edit","Trash","Trash2","Download","Upload","Send","MessageCircle","MessageSquare","Share","Share2","Link","ExternalLink","Copy","ChevronDown","ChevronUp","ChevronLeft","ChevronRight","MoreHorizontal","MoreVertical","Filter","Grid","List","Play","Pause","SkipForward","SkipBack","Volume","VolumeX","Image","Camera","Video","File","FileText","Folder","FolderOpen","Bookmark","Tag","Flag","Award","Gift","ShoppingCart","ShoppingBag","CreditCard","DollarSign","TrendingUp","TrendingDown","BarChart","PieChart","Activity","Zap","Sparkles","Sun","Moon","Cloud","Github","Twitter","Facebook","Instagram","Linkedin","Youtube","Code","Code2","Terminal","Cpu","Database","Server","Wifi","Layers","Layout","Package","Briefcase","Building","Car","Truck","Plane","Coffee","Music","Headphones","Mic","Smile","ThumbsUp","ThumbsDown","Info","AlertCircle","AlertTriangle","HelpCircle","Shield","ShieldCheck","Key","Loader","Loader2","RefreshCw","RotateCw","Save","Printer","Maximize","Minimize","Target","Compass","Navigation","Rocket","Crown","Trophy","Gauge","Battery","Bluetooth","LogIn","LogOut","UserPlus","UserMinus","UserCheck","Wallet","ChevronsRight","ChevronsLeft","ChevronsUp","ChevronsDown","Monitor","Smartphone","Tablet","Laptop","Bot","Wand2","Command","Hash","AtSign"
  ].join(",")} } = LucideIcons;

  ${cleaned}

  // Find the exported component — it's either named ClonedUI or is the last declared function
  const Component = (typeof ClonedUI !== 'undefined') ? ClonedUI
    : (typeof App !== 'undefined') ? App
    : null;

  if (!Component) {
    throw new Error('Could not find a React component. Expected "ClonedUI" or "App" in the code.');
  }

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(React.createElement(Component));

  // Notify parent the preview mounted successfully
  window.parent.postMessage({ __oneshot: 'ready' }, '*');
} catch (err) {
  const root = document.getElementById('root');
  root.innerHTML = '';
  const div = document.createElement('div');
  div.className = '__oneshot-err';
  div.textContent = 'Preview error: ' + (err.message || String(err)) + (err.stack ? '\\n\\n' + err.stack.split('\\n').slice(0,4).join('\\n') : '');
  root.appendChild(div);
  window.parent.postMessage({ __oneshot: 'error', message: err.message || String(err) }, '*');
}
</script>
</body>
</html>`;
  };

  // Listen for messages from iframe
  useEffect(() => {
    const onMessage = (ev) => {
      if (!ev.data || typeof ev.data !== 'object') return;
      if (ev.data.__oneshot === 'ready') {
        setStatus('ready');
      } else if (ev.data.__oneshot === 'error') {
        setErrorMsg(ev.data.message || 'Unknown error');
        setStatus('error');
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // Reset status when reload/code changes
  useEffect(() => {
    setStatus('loading');
    setErrorMsg('');
  }, [reloadKey, code]);

  const srcDoc = buildSrcDoc(code);

  return (
    <div className="rounded-2xl overflow-hidden border border-white/[0.07] shadow-2xl shadow-black/60">
      {/* Preview toolbar */}
      <div className="bg-zinc-950 border-b border-white/[0.07] px-5 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex gap-1.5 flex-shrink-0">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
          </div>
          <span className="text-[11px] text-white/30 font-mono truncate">
            {status === 'loading' && 'compiling JSX...'}
            {status === 'ready' && 'live preview · rendered successfully'}
            {status === 'error' && 'render error'}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Viewport toggle */}
          <div className="flex items-center bg-white/[0.04] rounded-lg p-0.5 border border-white/[0.07]">
            <button
              onClick={() => setViewport('desktop')}
              className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${viewport === 'desktop' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
              title="Desktop view"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport('mobile')}
              className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${viewport === 'mobile' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
              title="Mobile view"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setReloadKey(k => k + 1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.07] text-white/40 hover:text-white hover:bg-white/10 transition-all"
            title="Reload"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Iframe stage */}
      <div className="relative bg-zinc-900 flex justify-center" style={{ height: '640px' }}>
        {status === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-zinc-900/80 backdrop-blur-sm">
            <div className="flex items-center gap-3 text-white/50 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Compiling & rendering...
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-x-6 top-6 z-10 bg-red-950/80 backdrop-blur-sm border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-red-300 font-bold text-sm mb-1">Preview couldn't render</p>
              <p className="text-red-300/70 text-[11px] font-mono break-all line-clamp-3">{errorMsg}</p>
              <p className="text-red-300/50 text-[11px] mt-2">The AI-generated code may have syntax issues. Check the React Code tab and fix manually — or clone a different URL.</p>
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
            width: viewport === 'mobile' ? '390px' : '100%',
            height: '100%',
            border: 'none',
            boxShadow: viewport === 'mobile' ? '0 0 0 1px rgba(255,255,255,0.06)' : 'none',
          }}
        />
      </div>
    </div>
  );
}