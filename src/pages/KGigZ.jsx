import React from "react";
import { ExternalLink } from "lucide-react";

export default function KGigZPage() {
  return (
    <div className="fixed inset-0 bg-black" style={{ 
      top: 'calc(var(--sat, 0px) + 7.5rem)',
    }}>
      {/* Floating Open in New Tab Button */}
      <a
        href="https://kgigz.base44.app"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-black/80 backdrop-blur-sm border border-white/20 hover:bg-black/90 text-white text-sm transition-all shadow-lg"
      >
        <ExternalLink className="w-4 h-4" />
        Open in new tab
      </a>

      {/* Iframe */}
      <iframe
        src="https://kgigz.base44.app"
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}