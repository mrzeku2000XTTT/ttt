import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Terminal, Cpu } from "lucide-react";
import { base44 } from "@/api/base44Client";
import PowerInput from "@/components/agentinternet/PowerInput";

const SYSTEM_PROMPT = `You are KAI, the router of the Agent Internet — a network of autonomous agents that use TTT's apps as their internet. A user typed a command into the landing power input.

Decide which ONE TTT app/skill should handle it and produce a short execution result. The callable apps are:
- Xùnhuà (sketch→AI image)
- Bridge (send real KAS payment on Kaspa)
- Klipz (clip best moment from a live stream)
- Ying (grounded web research / price / news)
- Agent ZK (mint signed on-chain identity)
- TTT Builder (generate a live website)
- KUTT (turn a URL into a rendered viral video)
- Slobz (lock KAS in covenant escrow for a gig)
- TELE (post to all encrypted channels)

Respond in EXACTLY 3 lines, no markdown, no extra text:
SKILL: <app name> — <one phrase what it does>
PLAN: <2-3 bullet-ish steps, comma separated>
OUTPUT: <a concise simulated result the user would see — for payments include a fake kaspa: tx id, for media include what was produced>

Keep each line under 90 chars. Be concrete and confident.`;

function Entry({ label, children, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex gap-2 text-[11px] sm:text-xs font-mono leading-relaxed"
    >
      <span className="text-cyan-400/60 shrink-0">{label}</span>
      <span className="text-white/80">{children}</span>
    </motion.div>
  );
}

export default function PowerConsole() {
  const [runs, setRuns] = useState([]); // { id, command, status, lines }
  const [loading, setLoading] = useState(false);

  const handleCommand = async (command) => {
    const id = Date.now();
    setRuns((r) => [...r, { id, command, status: "running", lines: [{ label: "›", text: command }] }]);
    setLoading(true);

    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM_PROMPT}\n\nUser command: "${command}"`,
        model: "gemini_3_flash",
      });
      const text = typeof res === "string" ? res : res?.response || res?.text || JSON.stringify(res);
      const lines = text.split("\n").filter((l) => l.trim()).map((l) => {
        const m = l.match(/^(SKILL|PLAN|OUTPUT):\s*(.*)$/i);
        return m
          ? { label: m[1].toUpperCase() + ":", text: m[2] }
          : { label: "·", text: l };
      });
      setRuns((r) => r.map((run) => run.id === id ? { ...run, status: "done", lines: [...run.lines, ...lines] } : run));
    } catch (err) {
      setRuns((r) => r.map((run) => run.id === id ? { ...run, status: "error", lines: [...run.lines, { label: "err", text: "router unreachable — try again" }] } : run));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <PowerInput onSubmit={handleCommand} />

      {/* Output console */}
      <div className="mt-4 max-h-[34vh] overflow-y-auto scrollbar-hide space-y-3 text-left">
        <AnimatePresence>
          {runs.map((run) => (
            <motion.div
              key={run.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-3.5"
            >
              {run.lines.map((line, i) => (
                <Entry key={i} label={line.label} delay={i * 0.06}>
                  {line.text}
                </Entry>
              ))}
              {run.status === "running" && (
                <div className="flex items-center gap-2 mt-2 text-cyan-400/70 text-[11px] font-mono">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>routing through agent internet…</span>
                </div>
              )}
              {run.status === "error" && (
                <div className="mt-2 text-red-400/70 text-[11px] font-mono">router error</div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {runs.length === 0 && !loading && (
          <div className="flex items-center justify-center gap-2 text-white/25 text-[10px] font-mono tracking-widest uppercase pt-2">
            <Terminal className="w-3 h-3" />
            <span>type a command · hit run · watch the agent route it</span>
          </div>
        )}
      </div>
    </div>
  );
}