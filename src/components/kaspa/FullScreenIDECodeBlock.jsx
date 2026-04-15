import React, { useState, useEffect, useRef } from "react";
import { Copy, Check } from "lucide-react";

export default function FullScreenIDECodeBlock({ code, language, filename }) {
  const [copied, setCopied] = useState(false);
  const [visibleCode, setVisibleCode] = useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    if (!code) return;
    indexRef.current = 0;
    setVisibleCode("");
    const speed = Math.max(3, Math.floor(code.length / 150));
    const timer = setInterval(() => {
      indexRef.current += speed;
      if (indexRef.current >= code.length) {
        setVisibleCode(code);
        clearInterval(timer);
      } else {
        setVisibleCode(code.slice(0, indexRef.current));
      }
    }, 10);
    return () => clearInterval(timer);
  }, [code]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center justify-between px-4 py-2" style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="text-xs font-mono text-white/40">{filename || language}</span>
        <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all hover:bg-white/10"
          style={{ color: copied ? "rgba(52,211,153,0.95)" : "rgba(6,182,212,0.8)" }}>
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="px-4 py-3 overflow-x-auto text-sm font-mono leading-relaxed text-emerald-300/90 max-h-[60vh] overflow-y-auto whitespace-pre-wrap break-all">
        {visibleCode}
        {visibleCode.length < (code || "").length && <span className="inline-block w-[2px] h-[14px] bg-cyan-400 ml-0.5 animate-pulse align-middle" />}
      </pre>
    </div>
  );
}