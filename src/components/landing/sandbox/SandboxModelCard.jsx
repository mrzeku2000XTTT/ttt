import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2, Crown, ChevronDown, ChevronUp, Zap } from "lucide-react";
import ModelLogo from "../agentModelLogos";

const BORDER = "rgba(255,255,255,0.08)";

const ScoreBar = ({ label, value, color = "#4d6bfe" }) => (
  <div className="flex items-center gap-2">
    <span className="text-[10px] text-white/40 w-[72px] flex-shrink-0">{label}</span>
    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
    </div>
    <span className="text-[10px] font-bold text-white/70 tabular-nums w-7 text-right">{Math.round(value)}</span>
  </div>
);

export default function SandboxModelCard({ run, elapsed, isWinner }) {
  const [expanded, setExpanded] = useState(false);
  const { model, status, reply, ms, scores, speed, overall } = run;

  return (
    <div className="rounded-2xl p-4 flex flex-col gap-3 relative"
      style={{ background: "#121214", border: isWinner ? "1.5px solid #facc15" : `1px solid ${BORDER}`, boxShadow: isWinner ? "0 0 24px rgba(250,204,21,0.15)" : "none" }}>
      {isWinner && (
        <div className="absolute -top-2.5 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
          style={{ background: "#facc15", color: "#000" }}>
          <Crown className="w-3 h-3" /> WINNER
        </div>
      )}

      <div className="flex items-center gap-2">
        <ModelLogo logo={model.logo} size={18} />
        <span className="text-sm font-bold text-white flex-1 truncate">{model.label}</span>
        {status === "running" && (
          <span className="flex items-center gap-1.5 text-[11px] tabular-nums" style={{ color: "#8fa3ff" }}>
            <Loader2 className="w-3 h-3 animate-spin" /> {(elapsed / 1000).toFixed(1)}s
          </span>
        )}
        {status === "done" && ms != null && (
          <span className="flex items-center gap-1 text-[11px] text-white/40 tabular-nums">
            <Zap className="w-3 h-3" /> {(ms / 1000).toFixed(1)}s
          </span>
        )}
        {status === "error" && <span className="text-[11px] text-red-400">failed</span>}
      </div>

      {overall != null && (
        <div className="flex items-center gap-3">
          <div className="text-2xl font-extrabold tabular-nums" style={{ color: isWinner ? "#facc15" : "#fff" }}>{overall}</div>
          <span className="text-[10px] text-white/35 uppercase tracking-wide">Benchmark score</span>
        </div>
      )}

      {scores && (
        <div className="space-y-1.5">
          <ScoreBar label="Accuracy" value={scores.accuracy} />
          <ScoreBar label="Completeness" value={scores.completeness} />
          <ScoreBar label="Clarity" value={scores.clarity} />
          <ScoreBar label="Reasoning" value={scores.reasoning} />
          <ScoreBar label="Speed (real)" value={speed} color="#34d399" />
        </div>
      )}

      {scores?.verdict && <p className="text-[11px] text-white/45 italic leading-snug">"{scores.verdict}"</p>}

      {reply && (
        <div>
          <div className="ttt-md text-[12.5px] overflow-hidden" style={{ maxHeight: expanded ? "none" : 140 }}>
            <ReactMarkdown>{reply}</ReactMarkdown>
          </div>
          <button onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 text-[11px] mt-1.5 font-medium" style={{ color: "#8fa3ff" }}>
            {expanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show full response</>}
          </button>
        </div>
      )}

      {status === "running" && !reply && (
        <div className="space-y-2 py-1">
          {[80, 95, 60].map((w, i) => (
            <div key={i} className="h-2.5 rounded animate-pulse" style={{ width: `${w}%`, background: "rgba(255,255,255,0.06)" }} />
          ))}
        </div>
      )}
    </div>
  );
}