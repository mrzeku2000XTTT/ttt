import React, { useState } from "react";
import { TrendingUp, TrendingDown, Rocket, Maximize2, X, Check } from "lucide-react";

const BLUE = "#4d6bfe";

export default function AgentAttachment({ a }) {
  const [fullscreen, setFullscreen] = useState(false);
  if (!a) return null;

  if (a.type === "image") return <img src={a.url} alt="Generated" className="mt-3 rounded-xl max-w-full" style={{ maxHeight: 380 }} />;
  if (a.type === "audio") return <audio controls src={a.url} className="mt-3 w-full" />;

  if (a.type === "price") return (
    <div className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: "rgba(77,107,254,0.08)", border: "1px solid rgba(77,107,254,0.2)" }}>
      <span className="text-sm font-bold" style={{ color: BLUE }}>KAS ${a.price < 1 ? a.price.toFixed(4) : a.price.toFixed(2)}</span>
      {a.change != null && (
        <span className="text-xs font-medium flex items-center gap-0.5" style={{ color: a.change >= 0 ? "#16a34a" : "#dc2626" }}>
          {a.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{Math.abs(a.change).toFixed(1)}%
        </span>
      )}
    </div>
  );

  if (a.type === "balance") return (
    <div className="mt-3 px-4 py-2.5 rounded-xl" style={{ background: "rgba(77,107,254,0.08)", border: "1px solid rgba(77,107,254,0.2)" }}>
      <div className="text-sm font-bold" style={{ color: BLUE }}>{Number(a.balance).toLocaleString()} KAS</div>
      <div className="text-[10px] text-gray-400 font-mono truncate max-w-[240px]">{a.address}</div>
    </div>
  );

  if (a.type === "app") return (
    <>
      <div className="mt-3 rounded-2xl overflow-hidden" style={{ border: "1px solid #e5e7eb", boxShadow: "0 8px 28px rgba(0,0,0,0.08)" }}>
        <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
          <Rocket className="w-4 h-4" style={{ color: BLUE }} />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold text-gray-900 truncate">{a.title}</div>
            {a.description && <div className="text-[10px] text-gray-400 truncate">{a.description}</div>}
          </div>
          {a.productId && (
            <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(22,163,74,0.1)", color: "#16a34a" }}>
              <Check className="w-2.5 h-2.5" /> Launched
            </span>
          )}
          <button onClick={() => setFullscreen(true)} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500" title="Open fullscreen">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <iframe srcDoc={a.html} title={a.title} sandbox="allow-scripts allow-modals allow-forms allow-popups"
          className="w-full bg-white" style={{ height: 420, border: "none" }} />
      </div>

      {fullscreen && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-black">
          <div className="flex items-center gap-2 px-4 py-3" style={{ background: "#111", paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}>
            <Rocket className="w-4 h-4" style={{ color: BLUE }} />
            <span className="text-sm font-bold text-white flex-1 truncate">{a.title}</span>
            <button onClick={() => setFullscreen(false)} className="p-2 rounded-lg hover:bg-white/10 text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <iframe srcDoc={a.html} title={a.title} sandbox="allow-scripts allow-modals allow-forms allow-popups"
            className="flex-1 w-full bg-white" style={{ border: "none" }} />
        </div>
      )}
    </>
  );

  return null;
}