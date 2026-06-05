import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Sparkles } from "lucide-react";
import { STORYBOARD_PRESETS } from "@/components/storyboard/storyboardPresets";

export default function StoryboardPresetsPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const list = STORYBOARD_PRESETS.slice(0, 200).filter((p) =>
    !query.trim() || p.title.toLowerCase().includes(query.toLowerCase())
  );

  const pick = (preset) => {
    sessionStorage.setItem("storyboard_seed", JSON.stringify({ idea: preset.idea, style: "" }));
    navigate("/QuickStoryboard");
  };

  return (
    <div className="min-h-screen bg-[#0b0d12] text-white">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        <button onClick={() => navigate("/QuickStoryboard")} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-white/60 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to Studio
        </button>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500"><Sparkles className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">200 Presets</h1>
            <p className="text-sm text-white/50">Ready-made Kaspa storyboard prompts.</p>
          </div>
        </div>

        <div className="mb-5 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5">
          <Search className="h-4 w-4 text-white/40" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search presets…" className="w-full bg-transparent text-sm text-white placeholder-white/40 outline-none" />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {list.map((p) => (
            <button key={p.id} onClick={() => pick(p)} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-violet-400/40 hover:bg-violet-500/[0.06]">
              <span className="mt-0.5 text-xs font-black text-violet-400">{p.id.replace("preset-", "#")}</span>
              <div>
                <p className="text-sm font-bold text-white/90">{p.title}</p>
                <p className="line-clamp-2 text-xs text-white/45">{p.idea}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}