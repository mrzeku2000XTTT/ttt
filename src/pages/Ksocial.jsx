import React from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function KsocialPage() {
  return (
    <div className="fixed inset-0 bg-black flex flex-col" style={{ zIndex: 9999 }}>
      <div 
        className="flex-shrink-0 bg-black border-b border-white/10 px-3 py-3 md:px-4 md:py-4 flex items-center justify-between"
        style={{ 
          paddingTop: 'max(12px, env(safe-area-inset-top))',
          touchAction: 'manipulation'
        }}
      >
        <Link 
          to={createPageUrl("AppStore")} 
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors touch-manipulation"
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </Link>
        <a
          href="https://k-social.network"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors touch-manipulation"
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          <span className="text-sm font-medium">Open in New Tab</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
      <iframe
        src="https://k-social.network"
        className="flex-1 w-full border-0"
        title="Ksocial Network"
        style={{ pointerEvents: 'auto' }}
      />
    </div>
  );
}