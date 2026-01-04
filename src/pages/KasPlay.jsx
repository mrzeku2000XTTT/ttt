import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function KasPlayPage() {
  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <Link to={createPageUrl("AppStore")}>
          <Button
            variant="ghost"
            size="sm"
            className="text-white/60 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to App Store
          </Button>
        </Link>
        
        <div className="flex items-center gap-2">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/17dc7c8d0_image.png"
            alt="KasPlay"
            className="w-8 h-8 rounded-lg"
          />
          <h1 className="text-white font-bold text-lg">KasPlay</h1>
        </div>
        
        <div className="w-24" />
      </div>

      {/* Iframe */}
      <div className="flex-1 overflow-hidden">
        <iframe
          src="https://kasplay.fun"
          className="w-full h-full border-0"
          title="KasPlay Game"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    </div>
  );
}