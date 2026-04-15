import React, { useState, useEffect, useRef } from "react";
import { Copy, Check } from "lucide-react";

function CodeBlock({ code, language, filename }) {
  const [copied, setCopied] = useState(false);
  const [visibleCode, setVisibleCode] = useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    if (!code) return;
    indexRef.current = 0;
    setVisibleCode("");
    const speed = Math.max(2, Math.floor(code.length / 200)); // adaptive speed
    const timer = setInterval(() => {
      indexRef.current += speed;
      if (indexRef.current >= code.length) {
        setVisibleCode(code);
        clearInterval(timer);
      } else {
        setVisibleCode(code.slice(0, indexRef.current));
      }
    }, 12);
    return () => clearInterval(timer);
  }, [code]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center justify-between px-3 py-1.5" style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="text-[10px] font-mono text-white/40">{filename || language}</span>
        <button onClick={handleCopy} className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-all hover:bg-white/10"
          style={{ color: copied ? "rgba(52,211,153,0.95)" : "rgba(6,182,212,0.8)" }}>
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="px-3 py-2 overflow-x-auto text-[11px] font-mono leading-relaxed text-emerald-300/90 max-h-[300px] overflow-y-auto scrollbar-hide whitespace-pre-wrap break-all">
        {visibleCode}
        {visibleCode.length < (code || "").length && <span className="inline-block w-[2px] h-[13px] bg-cyan-400 ml-0.5 animate-pulse align-middle" />}
      </pre>
    </div>
  );
}

export default function KaiIDETab({ tab, data }) {
  if (!data) return null;

  if (tab === "plan") {
    return (
      <div className="space-y-3 p-3">
        <div>
          <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">App Name</div>
          <div className="text-[14px] font-bold text-white">{data.app_name || "Untitled App"}</div>
        </div>
        <div>
          <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Description</div>
          <div className="text-[12px] text-white/70 leading-relaxed">{data.description || ""}</div>
        </div>
        {data.kaspa_apis && data.kaspa_apis.length > 0 && (
          <div>
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Kaspa APIs</div>
            <div className="space-y-1">
              {data.kaspa_apis.map((api, i) => (
                <div key={i} className="text-[11px] font-mono px-2 py-1 rounded" style={{ background: "rgba(6,182,212,0.1)", color: "rgba(6,182,212,0.9)" }}>
                  {api}
                </div>
              ))}
            </div>
          </div>
        )}
        {data.estimated_time && (
          <div>
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Est. Build Time</div>
            <div className="text-[12px] text-cyan-400 font-semibold">{data.estimated_time}</div>
          </div>
        )}
      </div>
    );
  }

  if (tab === "entities") {
    const entities = data.entities || [];
    return (
      <div className="space-y-3 p-3">
        {entities.length === 0 && <div className="text-[11px] text-white/30 text-center py-4">No entities</div>}
        {entities.map((entity, i) => (
          <div key={i}>
            <div className="text-[11px] font-bold text-white/60 mb-1">🗄️ {entity.name}.json</div>
            <CodeBlock code={JSON.stringify(entity.schema, null, 2)} language="json" filename={`${entity.name}.json`} />
          </div>
        ))}
      </div>
    );
  }

  if (tab === "pages") {
    const pages = data.pages || [];
    return (
      <div className="space-y-3 p-3">
        {pages.length === 0 && <div className="text-[11px] text-white/30 text-center py-4">No pages</div>}
        {pages.map((page, i) => (
          <div key={i}>
            <div className="text-[11px] font-bold text-white/60 mb-1">📄 {page.name}.jsx</div>
            <CodeBlock code={page.code} language="jsx" filename={`${page.name}.jsx`} />
          </div>
        ))}
      </div>
    );
  }

  if (tab === "functions") {
    const functions = data.functions || [];
    return (
      <div className="space-y-3 p-3">
        {functions.length === 0 && <div className="text-[11px] text-white/30 text-center py-4">No functions</div>}
        {functions.map((fn, i) => (
          <div key={i}>
            <div className="text-[11px] font-bold text-white/60 mb-1">⚙️ {fn.name}.js</div>
            <CodeBlock code={fn.code} language="typescript" filename={`${fn.name}.js`} />
          </div>
        ))}
      </div>
    );
  }

  if (tab === "deploy") {
    const steps = data.deploy_steps || [];
    return (
      <div className="space-y-2 p-3">
        <div className="text-[11px] font-bold text-white/60 mb-2">🚀 Deploy Instructions</div>
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
              style={{ background: "rgba(6,182,212,0.2)", color: "rgba(6,182,212,1)" }}>
              {i + 1}
            </div>
            <div className="text-[12px] text-white/70 leading-relaxed pt-0.5">{step}</div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}