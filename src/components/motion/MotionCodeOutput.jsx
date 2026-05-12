import React, { useState } from "react";
import { Copy, Check, Code2, Download, Eye, Users, Github } from "lucide-react";

export default function MotionCodeOutput({ code, onPreview, hasPreview, onSaveCommunity }) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

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

  const handleSaveCommunity = async () => {
    if (!code || !onSaveCommunity) return;
    await onSaveCommunity();
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
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
            onClick={handleSaveCommunity}
            disabled={!code || !onSaveCommunity}
            className="px-3 h-8 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/25 text-purple-200 text-[11px] font-semibold flex items-center gap-1.5 disabled:opacity-40"
            title="Save this generated site to Motion Community"
          >
            {saved ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Users className="w-3.5 h-3.5" />}
            {saved ? "Saved" : "Community"}
          </button>
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
            title="Download this .jsx file, then commit it to the GitHub repo connected through Base44 sync"
          >
            <Github className="w-3.5 h-3.5" /> GitHub JSX
          </button>
        </div>
      </div>

      {code && (
        <div className="px-5 py-2 border-b border-white/10 bg-cyan-500/5 text-[10px] text-cyan-100/70 flex items-center gap-2">
          <Github className="w-3.5 h-3.5" /> Base44 GitHub sync is connected from the Dashboard; use GitHub JSX to download this generated page file for your repo.
        </div>
      )}

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