import React from "react";
import { motion } from "framer-motion";
import { X, GitBranch, GitCommit, CheckCircle2, Circle, Loader2 } from "lucide-react";

const ROADMAP = [
  {
    status: "done",
    title: "Agent Identity Layer",
    branch: "main",
    desc: "Every agent gets a signed identity card — name, role, protocol and public key.",
    files: ["identity/agent.card.json", "identity/keys.ts"]
  },
  {
    status: "done",
    title: "A2A Handshake",
    branch: "main",
    desc: "Agent-to-agent discovery and capability exchange over an open manifest.",
    files: ["a2a/manifest.json", "a2a/handshake.ts"]
  },
  {
    status: "active",
    title: "x402 Payment Rail",
    branch: "feat/x402-kaspa",
    desc: "Agents quote, invoice and settle in KAS on Kaspa L1 — machine-to-machine money.",
    files: ["x402/invoice.ts", "x402/settle.kaspa.ts"]
  },
  {
    status: "active",
    title: "MCP Tool Mesh",
    branch: "feat/mcp-mesh",
    desc: "Shared tool servers so any agent can borrow another's capabilities.",
    files: ["mcp/server.ts", "mcp/registry.json"]
  },
  {
    status: "planned",
    title: "Proof-of-Work Receipts",
    branch: "next",
    desc: "Every completed agent job leaves a verifiable on-chain receipt.",
    files: ["proofs/receipt.ts"]
  },
  {
    status: "planned",
    title: "Open Agent Directory",
    branch: "next",
    desc: "A public, permissionless index of agents, their skills and their prices.",
    files: ["directory/index.ts"]
  }
];

const STATUS = {
  done: { label: "merged", color: "#3fb950", Icon: CheckCircle2 },
  active: { label: "in progress", color: "#d29922", Icon: Loader2 },
  planned: { label: "planned", color: "#8b949e", Icon: Circle }
};

export default function BuildingFutureModal({ onClose }) {
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
        {/* repo header */}
        <div className="flex items-center gap-3 px-4 sm:px-5 py-3" style={{ borderBottom: "1px solid #30363d", background: "#161b22" }}>
          <GitBranch className="w-4 h-4 flex-shrink-0" style={{ color: "#8b949e" }} />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] sm:text-sm truncate" style={{ color: "#e6edf3" }}>
              <span style={{ color: "#58a6ff" }}>ttt</span> / <span className="font-bold">agent-internet</span>
            </div>
            <div className="text-[10px]" style={{ color: "#8b949e" }}>public · blueprint · building the future</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-white/5" style={{ color: "#8b949e" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* headline */}
        <div className="px-4 sm:px-5 py-5" style={{ borderBottom: "1px solid #21262d" }}>
          <h2 className="text-xl sm:text-2xl font-bold" style={{ color: "#e6edf3" }}>Building the future.</h2>
          <p className="mt-2 text-[12px] sm:text-[13px] leading-relaxed" style={{ color: "#8b949e" }}>
            The Agent Internet isn't live yet — it's being built in the open. Below is the actual blueprint:
            the layers that let AI agents identify each other, share tools, and pay each other in KAS.
          </p>
        </div>

        {/* commit-style roadmap */}
        <div className="px-4 sm:px-5 py-4 space-y-0">
          {ROADMAP.map((item, i) => {
            const s = STATUS[item.status];
            const Icon = s.Icon;
            return (
              <div key={item.title} className="flex gap-3">
                {/* rail */}
                <div className="flex flex-col items-center pt-1">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${item.status === "active" ? "animate-spin" : ""}`} style={{ color: s.color }} />
                  {i < ROADMAP.length - 1 && <div className="flex-1 w-px my-1" style={{ background: "#30363d" }} />}
                </div>

                <div className="flex-1 pb-5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-semibold" style={{ color: "#e6edf3" }}>{item.title}</span>
                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                      style={{ border: `1px solid ${s.color}`, color: s.color }}>
                      {s.label}
                    </span>
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

        <div className="px-4 sm:px-5 py-3 text-[10px] flex items-center justify-between"
          style={{ borderTop: "1px solid #21262d", background: "#161b22", color: "#8b949e" }}>
          <span>2 branches active · 4 layers shipped</span>
          <button onClick={onClose} className="px-3 py-1.5 rounded-md text-[11px] font-semibold"
            style={{ background: "#238636", color: "#fff" }}>
            Got it
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}