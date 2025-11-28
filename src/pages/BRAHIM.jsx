import React from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function BRAHIMPage() {
  const navigate = useNavigate();

  return (
    <div className="fixed bg-black flex flex-col z-50" style={{ 
      top: 'calc(var(--sat, 0px) + 7.5rem)',
      left: '0',
      right: '0', 
      bottom: '0',
      paddingLeft: 'max(env(safe-area-inset-left, 0px), 3rem)',
    }}>
      <style jsx>{`
        @media (max-width: 1024px) {
          .fixed { padding-left: env(safe-area-inset-left, 0px) !important; }
        }
        
        iframe {
          background-color: black;
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-black z-10 flex-shrink-0">
        <Button
          onClick={() => navigate(createPageUrl('AppStore'))}
          variant="ghost"
          size="sm"
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-white font-bold text-lg">BRAHIM</h1>
      </div>

      {/* Fullscreen Iframe */}
      <iframe
        src="https://kasware-connect-56d5622d.base44.app"
        className="flex-1 w-full border-0 bg-black"
        title="BRAHIM"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
        allowFullScreen
      />
    </div>
  );
}