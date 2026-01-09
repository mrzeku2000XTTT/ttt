import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

export default function OuTKasaTTPage() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      <div className="h-14 bg-black/80 backdrop-blur-xl border-b border-white/10 flex items-center px-4 gap-3 z-10">
        <Button
          onClick={() => navigate(createPageUrl('AppStore'))}
          variant="ghost"
          size="sm"
          className="text-white/60 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/3d7232b1d_image.png"
            alt="OuTKasTT"
            className="w-6 h-6"
          />
          <span className="text-white font-semibold">OuTKasTT</span>
        </div>
      </div>
      
      <iframe
        src="https://outkastt.base44.app"
        className="flex-1 w-full border-none"
        title="OuTKasTT"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
    </div>
  );
}