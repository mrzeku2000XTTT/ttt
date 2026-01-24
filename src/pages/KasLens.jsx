import React from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function KasLensPage() {
  return (
    <div className="w-full bg-black flex flex-col" style={{ height: 'calc(100vh - 7.5rem - var(--sat, 0px))' }}>
      {/* Header */}
      <div className="bg-zinc-950 border-b border-zinc-800 p-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/5169e3904_images.png"
            alt="KasLens"
            className="w-10 h-10 rounded-full object-cover"
          />
          <h1 className="text-white font-bold text-xl">KasLens</h1>
        </div>
        <a 
          href="https://kaspa-lens.com/" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in New Tab
          </Button>
        </a>
      </div>

      {/* Iframe */}
      <div className="flex-1 w-full" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 4rem)' }}>
        <iframe
          src="https://kaspa-lens.com/"
          className="w-full h-full border-0"
          title="KasLens"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}