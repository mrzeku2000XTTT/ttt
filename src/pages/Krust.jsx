import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function KrustPage() {
  const navigate = useNavigate();

  return (
    <div
      className="fixed inset-0 bg-black"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <button
        onClick={() => navigate(-1)}
        className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-black/70 hover:bg-black/90 backdrop-blur-xl border border-white/15 rounded-full px-4 py-2 text-white text-sm font-semibold shadow-lg transition-all"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <iframe
        src="https://react-weave-web.base44.app"
        title="Krust"
        className="w-full h-full border-0"
        allow="camera; microphone; clipboard-read; clipboard-write; fullscreen; autoplay; payment"
        allowFullScreen
      />
    </div>
  );
}