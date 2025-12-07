import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FrivPage() {
  return (
    <div className="fixed left-0 right-0 bottom-0 bg-black flex flex-col" style={{ top: 'calc(var(--sat, 0px) + 7.5rem)' }}>
      {/* Header */}
      <div className="flex-none bg-black/80 backdrop-blur-xl border-b border-white/10 p-4 flex items-center gap-4">
        <Link to={createPageUrl("AppStore")}>
          <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-white">Friv Games</h1>
      </div>

      {/* Iframe */}
      <div className="flex-1 relative bg-black">
        <iframe
          src="https://www.frivclassic.com"
          className="absolute inset-0 w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-pointer-lock"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
}