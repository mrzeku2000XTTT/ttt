import React from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

export default function KonektPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-md border-b border-white/10 p-4 flex items-center gap-4 z-10">
        <Link to={createPageUrl("Gate")}>
          <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Konekt</h1>
          <p className="text-xs text-white/60">App Gateway</p>
        </div>
      </div>

      {/* Iframe Container */}
      <div className="flex-1 w-full h-full relative">
        <iframe 
          src="https://ytmp3.as/AOPR/" 
          className="absolute inset-0 w-full h-full border-none"
          title="Konekt Gateway"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}