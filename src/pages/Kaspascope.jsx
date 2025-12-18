import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft } from "lucide-react";

export default function KaspascopePage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-black" />
      
      <div className="relative z-10 h-screen flex flex-col">
        <div className="p-4 flex items-center gap-4 border-b border-white/10">
          <Link to={createPageUrl("AppStore")}>
            <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          </Link>
          <h1 className="text-2xl font-black text-white">Kaspascope Market</h1>
        </div>

        <div className="flex-1">
          <iframe
            src="https://www.kaspascope.com/market"
            className="w-full h-full border-0"
            title="Kaspascope Market"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}