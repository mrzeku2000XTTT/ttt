import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function KASBridgePage() {
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

      <iframe
        src="https://kasbridge-evm.kaspafoundation.org"
        className="flex-1 w-full border-0"
        title="KAS Bridge EVM"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}