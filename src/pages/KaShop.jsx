import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Maximize2, Minimize2 } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

export default function KaShopPage() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreen = () => {
    const element = document.getElementById("kashop-iframe");
    if (!isFullscreen) {
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }
      setIsFullscreen(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10" style={{ paddingTop: 'var(--sat, 0px)' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={createPageUrl("AppStore")}>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>

          <div className="flex items-center gap-3">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/2a30d596c_image.png"
              alt="KaShop"
              className="w-8 h-8 rounded-full"
            />
            <span className="text-white font-semibold">KaShop</span>
          </div>

          <button
            onClick={handleFullscreen}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Iframe Container */}
      <div className="flex-1 pt-16 overflow-hidden">
        <iframe
          id="kashop-iframe"
          src="https://kashop.base44.app"
          className="w-full h-full border-0"
          title="KaShop"
          allow="fullscreen"
          style={{ marginBottom: 0, paddingBottom: 0 }}
        />
      </div>
    </div>
  );
}