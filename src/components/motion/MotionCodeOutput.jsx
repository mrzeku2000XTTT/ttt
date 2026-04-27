import React, { useState } from "react";
import { Copy, Check, Code2, Download, Eye } from "lucide-react";

export default function MotionCodeOutput({ code, onPreview, hasPreview }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    if (!code) return;
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LandingPage-${Date.now()}.jsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f]">
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <Code2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-white text-sm font-bold">Generated Code</h2>
            <p className="text-white/40 text-[10px]">
              {code ? `${code.split("\n").length} lines` : "Awaiting generation"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {hasPreview && (
            <button
              onClick={onPreview}
              className="px-3 h-8 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[11px] font-semibold flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
          )}
          <button
            onClick={handleCopy}
            disabled={!code}
            className="px-3 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-[11px] font-semibold flex items-center gap-1.5 disabled:opacity-40"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={handleDownload}
            disabled={!code}
            className="px-3 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-[11px] font-semibold flex items-center gap-1.5 disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" /> .jsx
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {code ? (
          <pre className="text-[11px] leading-relaxed text-white/80 font-mono p-5 whitespace-pre-wrap">
            {code}
          </pre>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-white/30 text-xs">
              <Code2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
              Click "Generate Landing Page" to vibe-code your template
            </div>
          </div>
        )}
      </div>
    </div>
  );
}