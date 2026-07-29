import React from "react";
import { motion } from "framer-motion";
import { X, GitBranch, GitCommit, CheckCircle2, Circle, Loader2 } from "lucide-react";

const STATUS = {
  done: { label: "merged", color: "#3fb950", Icon: CheckCircle2 },
  active: { label: "in progress", color: "#d29922", Icon: Loader2 },
  planned: { label: "planned", color: "#8b949e", Icon: Circle }
};

export default function AgentBlueprintModal({ agent, onClose }) {
  const steps = agent.blueprint || [];
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:p-8"
      style={{ background: "rgba(1,4,9,0.92)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-xl overflow-hidden my-auto"
        style={{ background: "#0d1117", border: "1px solid #30363d", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
      >
        <div className="flex items-center gap-3 px-4 sm:px-5 py-3" style={{ borderBottom: "1px solid #30363d", background: "#161b22" }}>
          <GitBranch className="w-4 h-4 flex-shrink-0" style={{ color: "#8b949e" }} />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] sm:text-sm truncate" style={{ color: "#e6edf3" }}>
              <span style={{ color: "#58a6ff" }}>agent-internet</span> / <span className="font-bold">{agent.name.toLowerCase().replace(/\s+/g, "-")}</span>
            </div>
            <div className="text-[10px]" style={{ color: "#8b949e" }}>{agent.role} · {agent.protocol} · key {agent.key}</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-white/5" style={{ color: "#8b949e" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 sm:px-5 py-4" style={{ borderBottom: "1px solid #21262d" }}>
          <h2 className="text-xl font-bold" style={{ color: "#e6edf3" }}>{agent.name} blueprint</h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {agent.skills.map((s) => (
              <span key={s} className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ border: "1px solid #30363d", color: "#8b949e" }}>{s}</span>
            ))}
          </div>
        </div>

        <div className="px-4 sm:px-5 py-4">
          {steps.map((item, i) => {
            const s = STATUS[item.status] || STATUS.planned;
            const Icon = s.Icon;
            return (
              <div key={item.title} className="flex gap-3">
                <div className="flex flex-col items-center pt-1">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${item.status === "active" ? "animate-spin" : ""}`} style={{ color: s.color }} />
                  {i < steps.length - 1 && <div className="flex-1 w-px my-1" style={{ background: "#30363d" }} />}
                </div>
                <div className="flex-1 pb-5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-semibold" style={{ color: "#e6edf3" }}>{item.title}</span>
                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                      style={{ border: `1px solid ${s.color}`, color: s.color }}>{s.label}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px]" style={{ color: "#8b949e" }}>
                    <GitCommit className="w-3 h-3" />
                    <span style={{ color: "#58a6ff" }}>{item.branch}</span>
                  </div>
                  <p className="mt-1.5 text-[12px] leading-relaxed" style={{ color: "#8b949e" }}>{item.desc}</p>
                  <div className="mt-2 rounded-md overflow-hidden" style={{ border: "1px solid #30363d", background: "#161b22" }}>
                    {item.files.map((f) => (
                      <div key={f} className="px-2.5 py-1.5 text-[10.5px] flex items-center gap-2"
                        style={{ color: "#7d8590", borderBottom: "1px solid #21262d" }}>
                        <span style={{ color: "#3fb950" }}>+</span> {f}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}