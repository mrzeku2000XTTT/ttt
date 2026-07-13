import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import KlipzInput from "@/components/klipz/KlipzInput";
import KlipzClipCard from "@/components/klipz/KlipzClipCard";
import KlipzAgent from "@/components/klipz/KlipzAgent";
import KlipzHireModal from "@/components/klipz/KlipzHireModal";
import KlipzLibrary from "@/components/klipz/KlipzLibrary";

export default function Klipz() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState("studio");
  const [hiring, setHiring] = useState(false);
  const [agentHint, setAgentHint] = useState(false);

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
        <div className="ml-auto flex items-center gap-1" style={{ fontFamily: "monospace" }}>
          {["studio", "library"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-[10px] font-bold tracking-[0.2em] uppercase transition-colors ${
                tab === t ? "bg-cyan-500 text-black" : "text-zinc-500 hover:text-white border border-zinc-800"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === "library" && (
        <div className="pt-8">
          <h2 className="text-center text-white font-black text-2xl tracking-tight" style={{ fontFamily: "monospace" }}>
            MY CLIP <span className="text-cyan-400">LIBRARY</span>
          </h2>
          <KlipzLibrary />
        </div>
      )}

      {tab === "studio" && (<>
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

      <KlipzAgent
        hasClips={!!result?.clips?.length}
        onHire={() => {
          if (result?.clips?.length) {
            setAgentHint(false);
            setHiring(true);
          } else {
            setAgentHint(true);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
      />
      {agentHint && !result?.clips?.length && (
        <div className="max-w-4xl mx-auto px-4 mt-3">
          <p className="border border-amber-500/40 text-amber-400 text-[11px] p-3 flex items-center gap-2" style={{ fontFamily: "monospace" }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            AGENT KLIP NEEDS CLIPS TO WORK ON — paste a YouTube/stream link above and run a scan first.
          </p>
        </div>
      )}
      </>)}

      {hiring && result && (
        <KlipzHireModal
          video={result.video}
          clips={result.clips}
          onClose={() => setHiring(false)}
          onDelivered={() => { setHiring(false); setTab("library"); }}
        />
      )}
    </div>
  );
}