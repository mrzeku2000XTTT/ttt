import React from "react";
import { Sparkles, Loader2 } from "lucide-react";

export default function SlidefarmForm({ niche, setNiche, voice, setVoice, offer, setOffer, slideCount, setSlideCount, onGenerate, loading }) {
  return (
    <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
      <div>
        <label className="text-[10px] font-bold tracking-wider text-white/50 uppercase mb-2 block">Niche *</label>
        <input
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          placeholder="e.g. 'men's skincare', 'personal finance for Gen Z', 'sleep supplements'"
          className="w-full h-11 px-4 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/30 text-sm outline-none focus:border-cyan-400"
        />
      </div>

      <div>
        <label className="text-[10px] font-bold tracking-wider text-white/50 uppercase mb-2 block">Voice / Tone</label>
        <input
          value={voice}
          onChange={(e) => setVoice(e.target.value)}
          placeholder="e.g. 'bold, witty, Gen-Z, slightly edgy'"
          className="w-full h-11 px-4 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/30 text-sm outline-none focus:border-cyan-400"
        />
      </div>

      <div>
        <label className="text-[10px] font-bold tracking-wider text-white/50 uppercase mb-2 block">Product / Offer (optional)</label>
        <input
          value={offer}
          onChange={(e) => setOffer(e.target.value)}
          placeholder="e.g. 'our $29 retinol serum'"
          className="w-full h-11 px-4 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/30 text-sm outline-none focus:border-cyan-400"
        />
      </div>

      <div>
        <label className="text-[10px] font-bold tracking-wider text-white/50 uppercase mb-2 flex justify-between">
          Slide Count <span className="text-white/40">{slideCount}</span>
        </label>
        <input
          type="range"
          min="4"
          max="8"
          value={slideCount}
          onChange={(e) => setSlideCount(+e.target.value)}
          className="w-full accent-cyan-500"
        />
      </div>

      <button
        onClick={onGenerate}
        disabled={loading || !niche.trim()}
        className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-[900] text-sm flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {loading ? "Generating slideshow…" : "Generate Slideshow"}
      </button>
    </div>
  );
}