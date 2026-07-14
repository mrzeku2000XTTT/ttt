import React, { useState } from "react";
import { TREE_TEMPLATES } from "@/components/tree/treeTemplates";
import { Sparkles } from "lucide-react";

export default function TreeCampaignForm({ onLaunch, running }) {
  const [product, setProduct] = useState("");
  const [goal, setGoal] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("bold & energetic");
  const [selected, setSelected] = useState(["ugc_testimonial", "hook_short"]);

  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const inputCls =
    "w-full bg-black/50 border border-emerald-500/20 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-emerald-400/60";

  return (
    <div className="bg-gradient-to-b from-emerald-950/40 to-black/60 border border-emerald-500/20 rounded-2xl p-5 space-y-4">
      <textarea
        rows={3}
        value={product}
        onChange={(e) => setProduct(e.target.value)}
        placeholder="What are we advertising? Describe your product, app or brand…"
        className={inputCls}
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Goal (e.g. launch buzz)" className={inputCls} />
        <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Audience (e.g. crypto users)" className={inputCls} />
        <input value={tone} onChange={(e) => setTone(e.target.value)} placeholder="Tone" className={inputCls} />
      </div>

      <div>
        <p className="text-emerald-300/70 text-xs uppercase tracking-widest mb-2">Ad Templates</p>
        <div className="flex flex-wrap gap-2">
          {TREE_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => toggle(t.id)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                selected.includes(t.id)
                  ? "bg-emerald-500/20 border-emerald-400/60 text-emerald-200"
                  : "bg-white/5 border-white/10 text-white/50 hover:border-white/30"
              }`}
            >
              {t.emoji} {t.name}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => onLaunch({ product, goal, audience, tone, templates: selected })}
        disabled={running || !product.trim() || selected.length === 0}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-bold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
      >
        <Sparkles className="w-4 h-4" />
        {running ? "Tree is building your campaign…" : "Launch Campaign Agent"}
      </button>
    </div>
  );
}