import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function KrustPage() {
  return (
    <div
      className="fixed inset-0 bg-black"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <Link
        to="/AppStoreV2"
        className="fixed left-4 z-[9999] flex items-center gap-2 bg-black/80 hover:bg-black backdrop-blur-xl border border-white/20 rounded-full px-4 py-2 text-white text-sm font-semibold shadow-2xl transition-all"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

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