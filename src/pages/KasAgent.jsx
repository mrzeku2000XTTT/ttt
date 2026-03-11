import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import KasAgentChat from "@/components/silverscript/KasAgentChat";
import { ArrowLeft } from "lucide-react";

export default function KasAgentPage() {
  const navigate = useNavigate();

  const handleLoadToEditor = (fileName, code) => {
    // Save generated contract to localStorage so KasCode can pick it up
    localStorage.setItem('kasagent_pending_contract', JSON.stringify({ fileName, code }));
    navigate(createPageUrl('KasCode'));
  };

  const handleClose = () => {
    navigate(createPageUrl('KasCode'));
  };

  return (
    <div className="bg-zinc-950 text-white flex flex-col overflow-hidden" style={{ height: '100dvh' }}>
      {/* Top bar */}
      <div className="flex items-center h-9 bg-zinc-900 border-b border-zinc-800 px-3 gap-2 flex-shrink-0">
        <button
          onClick={() => navigate(createPageUrl('KasCode'))}
          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-200 text-[10px] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          KasCode
        </button>
      </div>

      {/* Full screen chat */}
      <div className="flex-1 min-h-0">
        <KasAgentChat
          onLoadToEditor={handleLoadToEditor}
          onClose={handleClose}
        />
      </div>
    </div>
  );
}