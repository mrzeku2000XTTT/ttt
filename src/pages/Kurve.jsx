import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function KurvePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="bg-black/80 backdrop-blur-xl border-b border-white/10 p-4">
        <button
          onClick={() => navigate(createPageUrl('AppStore'))}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to App Store</span>
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/7be912bf3_image.png" 
            alt="Kurve" 
            className="w-32 h-32 mx-auto mb-6 rounded-2xl"
          />
          <h1 className="text-4xl font-black text-white mb-4">Kurve</h1>
          <p className="text-white/60">Coming Soon</p>
        </div>
      </div>
    </div>
  );
}