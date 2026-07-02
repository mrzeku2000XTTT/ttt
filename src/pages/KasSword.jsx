import React, { useState, useRef } from "react";
import { ArrowLeft, RotateCw, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const KAS_SWORD_URL = "https://kassword.com";
const KAS_SWORD_LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/32e250713_image.png";

export default function KasSwordPage() {
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
        <div className="flex items-center gap-2">
          <img src={KAS_SWORD_LOGO} alt="KAS SWORD" className="h-6 object-contain" />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Refresh"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <a
            href={KAS_SWORD_URL}
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
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
            <img src={KAS_SWORD_LOGO} alt="KAS SWORD" className="h-10 object-contain mb-4" />
            <div className="w-8 h-8 border-4 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
          </div>
        )}
        <iframe
          key={iframeKey}
          src={KAS_SWORD_URL}
          title="KAS SWORD"
          className="w-full h-[calc(100vh-3.5rem)]"
          style={{ border: "none", minHeight: 'calc(100vh - 3.5rem)' }}
          onLoad={() => setLoading(false)}
          allow="clipboard-read; clipboard-write; encrypted-media"
        />
      </div>
    </div>
  );
}