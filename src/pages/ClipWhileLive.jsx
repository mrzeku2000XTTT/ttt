import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import CWLHero from "@/components/clipwhilelive/CWLHero";
import CWLDemo from "@/components/clipwhilelive/CWLDemo";
import CWLFeatures from "@/components/clipwhilelive/CWLFeatures";
import CWLWaitlist from "@/components/clipwhilelive/CWLWaitlist";

export default function ClipWhileLive() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-black/90 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-white font-black text-sm tracking-[0.2em]" style={{ fontFamily: "monospace" }}>
            CLIP<span className="text-red-500">WHILE</span>LIVE
          </span>
        </div>
        <a
          href="https://clipwhilelive.com"
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          clipwhilelive.com
        </a>
      </div>

      <CWLHero />
      <CWLDemo />
      <CWLFeatures />
      <CWLWaitlist />

      <div className="text-center pb-10 text-[9px] text-zinc-700 tracking-widest uppercase" style={{ fontFamily: "monospace" }}>
        Public stream imagery for product demo · No creator affiliation or endorsement
      </div>
    </div>
  );
}