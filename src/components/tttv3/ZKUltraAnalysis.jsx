import React, { useState } from "react";
import { motion } from "framer-motion";
import { Eye, Cpu, ChevronDown, ChevronUp } from "lucide-react";

const VIOLET = "#8b5cf6";
const VIOLET_BRIGHT = "#a78bfa";

const MODE_LABELS = {
  reply: "REPLY — KNOWLEDGE",
  direct: "DIRECT EXECUTION — NODA BYPASSED",
  noda: "NODA FLOW — TRANSLATED",
  ask: "AWAITING INPUT",
};

export default function ZKUltraAnalysis({ analysis }) {
  const [open, setOpen] = useState(true);
  if (!analysis) return null;
  const conf = Math.max(0, Math.min(100, Number(analysis.intent_confidence) || 0));

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="max-w-[92%]"
      style={{ background: "rgba(139,92,246,0.06)", border: `2px solid rgba(139,92,246,0.45)`, boxShadow: "3px 3px 0px rgba(76,29,149,0.6)" }}>
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-2 px-3 py-2 text-left">
        <Cpu className="w-3.5 h-3.5 flex-shrink-0" style={{ color: VIOLET_BRIGHT }} />
        <span className="text-[10px] font-black uppercase tracking-[0.25em]" style={{ color: VIOLET_BRIGHT }}>ZK ULTRA · INTENT ANALYSIS</span>
        <span className="ml-auto text-[9px] font-black uppercase tracking-widest px-2 py-0.5" style={{ background: "rgba(139,92,246,0.15)", color: VIOLET_BRIGHT, border: "1px solid rgba(139,92,246,0.4)" }}>
          {MODE_LABELS[analysis.execution_mode] || "ANALYZED"}
        </span>
        {open ? <ChevronUp className="w-3 h-3" style={{ color: VIOLET }} /> : <ChevronDown className="w-3 h-3" style={{ color: VIOLET }} />}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2.5">
          {/* Intent + confidence */}
          {analysis.intent && (
            <div>
              <div className="text-[12px] leading-snug" style={{ color: "rgba(255,255,255,0.85)" }}>{analysis.intent}</div>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex-1 h-1.5" style={{ background: "rgba(139,92,246,0.15)" }}>
                  <div className="h-full" style={{ width: `${conf}%`, background: `linear-gradient(90deg, ${VIOLET}, ${VIOLET_BRIGHT})` }} />
                </div>
                <span className="text-[9px] font-black" style={{ color: VIOLET_BRIGHT }}>{conf}%</span>
              </div>
            </div>
          )}

          {/* Keywords */}
          {analysis.keywords?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {analysis.keywords.slice(0, 14).map((k, i) => (
                <span key={i} className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                  style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)", color: "rgba(196,181,253,0.85)" }}>
                  {k}
                </span>
              ))}
            </div>
          )}

          {/* Live view of tttz.xyz */}
          {analysis.live_context && (
            <div className="flex gap-2 px-2 py-1.5" style={{ background: "rgba(139,92,246,0.05)", borderLeft: `2px solid ${VIOLET}` }}>
              <Eye className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: VIOLET_BRIGHT }} />
              <div>
                <div className="text-[8px] font-black uppercase tracking-[0.3em] mb-0.5" style={{ color: "rgba(167,139,250,0.6)" }}>LIVE VIEW · TTTZ.XYZ</div>
                <div className="text-[11px] leading-snug" style={{ color: "rgba(255,255,255,0.7)" }}>{analysis.live_context}</div>
              </div>
            </div>
          )}

          {/* Translated NODA flow */}
          {analysis.noda_flow && (
            <div className="px-2 py-1.5" style={{ background: "rgba(0,0,0,0.3)", border: "1px dashed rgba(139,92,246,0.4)" }}>
              <div className="text-[8px] font-black uppercase tracking-[0.3em] mb-0.5" style={{ color: "rgba(167,139,250,0.6)" }}>TRANSLATED NODA FLOW</div>
              <div className="text-[11px] font-mono leading-snug" style={{ color: "rgba(196,181,253,0.85)" }}>{analysis.noda_flow}</div>
            </div>
          )}

          {/* Targets + complexity footer */}
          <div className="flex flex-wrap items-center gap-2 text-[9px] font-black uppercase tracking-widest" style={{ color: "rgba(167,139,250,0.5)" }}>
            {analysis.complexity && <span>◆ {analysis.complexity.replace(/_/g, " ")}</span>}
            {analysis.target_apps?.length > 0 && <span>◆ {analysis.target_apps.join(" · ")}</span>}
          </div>
        </div>
      )}
    </motion.div>
  );
}