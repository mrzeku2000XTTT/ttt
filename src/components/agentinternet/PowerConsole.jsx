import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Terminal } from "lucide-react";
import { base44 } from "@/api/base44Client";
import PowerInput from "@/components/agentinternet/PowerInput";
import { SETTINGS } from "@/components/agentinternet/LandingSettings";

/**
 * PowerConsole — the real input. On submit, routes the command through the
 * unified Agent Internet superagent (InvokeLLM as KAI router), shaped by the
 * user's landing settings (which agents/apps/money modes are enabled).
 */
function buildPrompt(command, settings) {
  const enabled = (prefix) => SETTINGS.filter((s) => s.key.startsWith(prefix) && settings[s.key]).map((s) => s.label);
  const agents = enabled("agent_");
  const apps = enabled("app_");
  const maxAgents = settings.max_100 ? 100 : settings.max_50 ? 50 : settings.max_10 ? 10 : 1;
  const moneyMode = settings.money_testnet ? "testnet only" : settings.money_mainnet ? "mainnet" : "disabled";
  const autonomy = settings.auto_execute ? "execute without asking" : "suggest plan only";

  return `You are KAI — the unified superagent at the center of the Agent Internet. You control up to ${maxAgents} sub-agents and ${apps.length} callable apps. You decide how many to call and in what order to fulfill the user's command. Each app is a real backend skill, not a chatbot.

ACTIVE AGENTS: ${agents.join(", ") || "none"}
ENABLED APPS: ${apps.join(", ") || "none"}
MONEY MODE: ${moneyMode}
AUTONOMY: ${autonomy}
${settings.confirm_money ? "CONFIRM before any payment." : ""}
${settings.parallel ? "Run independent calls in parallel." : ""}
${settings.safe_moderate ? "Moderate all output for safety." : ""}

Given the user's command, produce a short execution result. Respond in EXACTLY 3 lines, no markdown, no extra text:
SKILL: <primary app/agent that handles it> — <one phrase>
PLAN: <which sub-agents to call, how many, in what order>
OUTPUT: <concise simulated result — for payments include a kaspa: tx id, for media describe what was produced>

Keep each line under 110 chars. Be concrete and confident.

User command: "${command}"`;
}

function Entry({ label, children, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex gap-2 text-[11px] sm:text-xs font-mono leading-relaxed"
    >
      <span className="text-cyan-400/60 shrink-0">{label}</span>
      <span className="text-white/85 break-words">{children}</span>
    </motion.div>
  );
}

export default function PowerConsole({ settings }) {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleCommand = async (command) => {
    const id = Date.now();
    setRuns((r) => [...r.slice(-3), { id, command, status: "running", lines: [{ label: "›", text: command }] }]);
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildPrompt(command, settings),
        model: "gemini_3_flash",
      });
      const text = typeof res === "string" ? res : (res?.response || res?.text || JSON.stringify(res));
      const lines = text.split("\n").filter((l) => l.trim()).map((l) => {
        const m = l.match(/^(SKILL|PLAN|OUTPUT):\s*(.*)$/i);
        return m ? { label: m[1].toUpperCase() + ":", text: m[2] } : { label: "·", text: l };
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

      <div className="mt-3 max-h-[30vh] overflow-y-auto scrollbar-hide space-y-2.5 text-left">
        <AnimatePresence>
          {runs.map((run) => (
            <motion.div
              key={run.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-3"
            >
              {run.lines.map((line, i) => (
                <Entry key={i} label={line.label} delay={i * 0.06}>{line.text}</Entry>
              ))}
              {run.status === "running" && (
                <div className="flex items-center gap-2 mt-2 text-cyan-400/70 text-[11px] font-mono">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>orchestrating agents…</span>
                </div>
              )}
              {run.status === "error" && (
                <div className="mt-2 text-red-400/70 text-[11px] font-mono">router error</div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {runs.length === 0 && !loading && (
          <div className="flex items-center justify-center gap-2 text-white/25 text-[10px] font-mono tracking-widest uppercase pt-1">
            <Terminal className="w-3 h-3" />
            <span>type a command · hit run · watch the superagent route it</span>
          </div>
        )}
      </div>
    </div>
  );
}