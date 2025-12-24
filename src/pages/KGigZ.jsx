import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, ExternalLink } from "lucide-react";

export default function KGigZPage() {
  return (
    <div className="fixed inset-0 bg-black flex flex-col" style={{ 
      top: 'calc(var(--sat, 0px) + 7.5rem)',
    }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/90 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl("AppStore")}>
            <button className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          </Link>
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/6ff6d06b2_image.png"
            alt="K gigZ"
            className="w-8 h-8 object-contain"
          />
          <h1 className="text-lg font-bold text-white">K gigZ</h1>
        </div>
        <a
          href="https://kgigz.base44.app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Open in new tab
        </a>
      </div>

      {/* Iframe */}
      <iframe
        src="https://kgigz.base44.app"
        className="flex-1 w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}