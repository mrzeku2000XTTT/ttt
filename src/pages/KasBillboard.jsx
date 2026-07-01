import React, { useState } from "react";
import { ArrowLeft, RotateCw, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

export default function KasBillboardPage() {
  const [loading, setLoading] = useState(true);
  const iframeKey = useState(() => Date.now())[0];

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-4 h-14 bg-black/90 backdrop-blur-xl border-b border-white/10"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <Link
          to="/AppStoreV2"
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors h-14 -ml-2 px-2 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </Link>
        <span className="text-sm font-bold text-white tracking-tight">KasBillboard</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Refresh"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <a
            href="https://www.kasbillboard.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </nav>

      <div className="relative flex-1">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="w-8 h-8 border-4 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
          </div>
        )}
        <iframe
          key={iframeKey}
          src="https://www.kasbillboard.com"
          title="KasBillboard"
          className="w-full h-[calc(100vh-3.5rem)]"
          style={{ border: "none", minHeight: 'calc(100vh - 3.5rem)' }}
          onLoad={() => setLoading(false)}
          allow="clipboard-read; clipboard-write; encrypted-media"
        />
      </div>
    </div>
  );
}