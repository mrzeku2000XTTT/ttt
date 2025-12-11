import React from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

export default function KurvePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="bg-black/80 backdrop-blur-xl border-b border-white/10 p-4 flex items-center justify-between">
        <button
          onClick={() => navigate(createPageUrl('AppStore'))}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to App Store</span>
        </button>

        <Button
          onClick={() => window.open('https://kasbridge-evm.kaspafoundation.org', '_blank')}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Open in New Tab
        </Button>
      </div>

      <iframe
        src="https://kasbridge-evm.kaspafoundation.org"
        className="flex-1 w-full border-0"
        title="Kurve Bridge"
        allow="clipboard-read; clipboard-write"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
    </div>
  );
}