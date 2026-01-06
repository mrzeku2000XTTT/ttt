import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft } from "lucide-react";

export default function ALPHAPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <Link to={createPageUrl("AppStore")}>
          <button className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to App Store</span>
          </button>
        </Link>
        <div className="flex items-center gap-3">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/a37146946_image.png"
            alt="ALPHA"
            className="w-8 h-8 object-contain"
          />
          <span className="text-white font-bold text-lg">ALPHA</span>
        </div>
      </div>

      {/* Iframe */}
      <iframe
        src="https://nexus-flow-030e2c5d.base44.app"
        className="flex-1 w-full border-0"
        title="ALPHA"
        allow="fullscreen"
      />
    </div>
  );
}