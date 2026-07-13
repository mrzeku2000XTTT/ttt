import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import KlipzInput from "@/components/klipz/KlipzInput";
import KlipzClipCard from "@/components/klipz/KlipzClipCard";

export default function Klipz() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const analyze = async (url) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke("klipzAnalyze", { url });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Analysis failed — try another link.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 flex items-center gap-3 px-4 py-2.5 border-b border-white/10 bg-black/90 backdrop-blur">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          title="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-white font-black text-sm tracking-[0.3em]" style={{ fontFamily: "monospace" }}>
          KLIP<span className="text-cyan-400">Z</span>
        </span>
        <span className="ml-auto text-[9px] text-zinc-600 tracking-[0.25em] uppercase" style={{ fontFamily: "monospace" }}>
          TTT Native Clip Engine
        </span>
      </div>

      {/* Hero */}
      <div className="pt-14 pb-8 text-center px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 border border-cyan-500/40 text-[10px] tracking-[0.3em] text-cyan-400 mb-6" style={{ fontFamily: "monospace" }}>
          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
          AI CLIP ENGINE · LIVE & VOD
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-white leading-[0.95] tracking-tight">
          THE FIRST CLIP<br />
          <span className="italic text-cyan-400">WINS THE MOMENT.</span>
        </h1>
        <p className="max-w-lg mx-auto mt-5 mb-8 text-sm text-zinc-400 leading-relaxed">
          Paste any YouTube video or live stream. KLIPZ scans it, finds the moments
          worth posting, and hands you editable clip drafts — right here, no install.
        </p>
        <KlipzInput onAnalyze={analyze} loading={loading} />
      </div>

      {error && (
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center gap-2 border border-red-500/40 text-red-400 text-xs p-4" style={{ fontFamily: "monospace" }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        </div>
      )}

      {loading && (
        <div className="max-w-2xl mx-auto px-4 text-center py-10" style={{ fontFamily: "monospace" }}>
          <p className="text-cyan-400 text-[10px] tracking-[0.3em] animate-pulse">SCANNING CONTENT · DETECTING BREAKOUT MOMENTS · DRAFTING CLIPS…</p>
        </div>
      )}

      {result && (
        <div className="max-w-4xl mx-auto px-4 mt-6">
          {/* Video info */}
          <div className="flex items-center gap-4 border border-zinc-800 bg-zinc-950 p-4 mb-6" style={{ fontFamily: "monospace" }}>
            <img src={result.video.thumbnail} alt="" className="w-24 aspect-video object-cover border border-zinc-800" />
            <div className="min-w-0">
              <p className="text-white font-bold text-sm truncate">{result.video.title}</p>
              <p className="text-zinc-500 text-[11px] mt-1">
                {result.video.channel}
                {result.video.is_live && <span className="ml-2 text-red-400">● LIVE NOW</span>}
              </p>
              <p className="text-cyan-400 text-[10px] tracking-widest mt-1">{result.clips.length} CLIP DRAFTS FOUND</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.clips.map((clip, i) => (
              <KlipzClipCard key={i} clip={clip} videoId={result.video.id} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}