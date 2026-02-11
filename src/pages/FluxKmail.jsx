import React from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, ArrowLeft } from "lucide-react";

export default function FluxKmailPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-black pt-16">
      <button
        onClick={() => navigate(-1)}
        className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-lg backdrop-blur-xl transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back</span>
      </button>
      <button
        onClick={() => window.open('https://fluxkmail.base44.app', '_blank')}
        className="fixed top-4 left-24 z-50 flex items-center gap-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 px-4 py-2 rounded-lg backdrop-blur-xl transition-all"
      >
        <ExternalLink className="w-4 h-4" />
        <span className="text-sm font-medium">Open in New Tab</span>
      </button>
      <iframe
        src="https://fluxkmail.base44.app"
        className="w-full h-[calc(100vh-4rem)] border-0"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}