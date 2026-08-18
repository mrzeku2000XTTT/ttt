import React from "react";
import { Gavel, Plus, Users } from "lucide-react";

/**
 * Suggests the missing half of a consensus pair.
 * Consensus needs two agents: one that makes a claim, one that audits it.
 */
const AUDITOR_PRESET = {
  name: "Auditor",
  task: "Audit another agent's claims against live Kaspa chain data",
  system_prompt:
    "You are an auditor agent. You never accept a claim on trust. You compare every statement against verified on-chain facts and reject anything contradicted or invented.",
};

const SUMMARIZER_PRESET = {
  name: "Summarizer",
  task: "Summarize Kaspa transactions in plain English",
  system_prompt:
    "You are a summarizer agent. You read raw Kaspa transaction data and explain it in 2-4 plain sentences, stating only what the data shows.",
};

export default function AgentPairSuggestion({ agents, onCreate }) {
  if (!agents?.length || agents.length > 1) return null;

  const existing = agents[0];
  const looksLikeAuditor = /audit|verif|check/i.test(`${existing.name} ${existing.task || ""}`);
  const preset = looksLikeAuditor ? SUMMARIZER_PRESET : AUDITOR_PRESET;

  return (
    <button
      onClick={() => onCreate(preset)}
      className="w-full text-left bg-white rounded-2xl ring-1 ring-zinc-200 p-5 mb-3 hover:ring-zinc-300 transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
          <Users className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-zinc-900">
            Pair {existing.name} with a{looksLikeAuditor ? "" : "n"} {preset.name}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
            Consensus needs two agents — one makes a claim, the other checks it against the chain and signs off. {preset.task}.
          </p>
          <span className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-bold text-zinc-900">
            <Plus className="w-3 h-3" /> Create {preset.name}
          </span>
        </div>
        <Gavel className="w-4 h-4 text-zinc-300 shrink-0" />
      </div>
    </button>
  );
}