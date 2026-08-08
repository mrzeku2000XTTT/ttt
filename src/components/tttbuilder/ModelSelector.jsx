import React from "react";
import { Cpu } from "lucide-react";

export const BUILDER_MODELS = [
  { id: "ttt_agent_1", label: "TTT Agent 1" },
  { id: "automatic", label: "Auto (best available)" },
  { id: "claude_opus_4_8", label: "Claude Opus 4.8" },
  { id: "claude-sonnet-5", label: "Claude Sonnet 5" },
  { id: "claude_sonnet_4_6", label: "Claude Sonnet 4.6" },
  { id: "gpt_5_6_sol", label: "GPT-5.6 Sol" },
  { id: "gpt_5_4", label: "GPT-5.4" },
  { id: "gemini_3_1_pro", label: "Gemini 3.1 Pro" },
  { id: "gemini_3_flash", label: "Gemini 3 Flash (fast)" },
  { id: "gpt_5_mini", label: "GPT-5 Mini (fast)" },
];

export default function ModelSelector({ value, onChange, disabled }) {
  return (
    <label className="flex items-center gap-1.5 h-8 pl-2.5 pr-1 rounded-lg bg-white border border-black/[0.08] text-[#6B7280] hover:border-[#007AFF]/40 transition-colors cursor-pointer">
      <Cpu className="w-3.5 h-3.5 flex-shrink-0 text-[#007AFF]" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="bg-transparent outline-none text-[11px] font-bold text-[#1D1D1F] cursor-pointer disabled:opacity-40 max-w-[140px]"
      >
        {BUILDER_MODELS.map((m) => (
          <option key={m.id} value={m.id} className="bg-white text-[#1D1D1F]">
            {m.label}
          </option>
        ))}
      </select>
    </label>
  );
}