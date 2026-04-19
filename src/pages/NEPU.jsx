import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, RefreshCw, Maximize2, ExternalLink, Loader2 } from "lucide-react";

const NEPU_URL = "https://nepu.to/";

export default function NEPUPage() {
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState(0);
  const iframeRef = useRef(null);

  const reload = () => {
    setLoading(true);
    setKey((k) => k + 1);
  };

  const goFullscreen = () => {
    const el = iframeRef.current;
    if (!el) return;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-black/95 border-b border-white/10 z-10">
        <Link to={createPageUrl("AppStoreV2")} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/80 text-xs font-bold transition-all">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>

        <div className="flex items-center gap-2 flex-1">
          <img
            src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/5f2c1cefa_generated_image.png"
            alt="NEPU"
            className="w-7 h-7 rounded-lg"
          />
          <div>
            <div className="text-white font-black text-sm leading-none">NEPU</div>
            <div className="text-white/40 text-[10px]">Free TV shows & movies</div>
          </div>
        </div>

        <button
          onClick={reload}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/80 text-xs font-bold transition-all"
          title="Reload"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reload
        </button>
        <button
          onClick={goFullscreen}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/80 text-xs font-bold transition-all"
          title="Fullscreen"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <a
          href={NEPU_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all"
          title="Open in new tab"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Open
        </a>
      </div>

      {/* Iframe container */}
      <div className="flex-1 relative bg-black">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 pointer-events-none">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-3" />
            <div className="text-white/60 text-sm">Loading NEPU…</div>
          </div>
        )}
        <iframe
          key={key}
          ref={iframeRef}
          src={NEPU_URL}
          title="NEPU"
          className="w-full h-full border-0"
          onLoad={() => setLoading(false)}
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          referrerPolicy="no-referrer"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
        />
      </div>
    </div>
  );
}