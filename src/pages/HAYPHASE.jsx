import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft } from "lucide-react";

export default function HAYPHASEPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to={createPageUrl("AppStore")}>
            <button className="text-white/60 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-xl font-bold text-white">HAYPHASE</h1>
        </div>
      </div>
      
      <div className="w-full h-[calc(100vh-73px)]">
        <iframe
          src="https://kas-shoe-42fadac5.base44.app"
          className="w-full h-full border-0"
          title="HAYPHASE"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}