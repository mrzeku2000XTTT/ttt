import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

export default function KaShopPage() {
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
              Back to Apps
            </Button>
          </Link>

          <div className="flex items-center gap-3">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/00f7c1aac_image.png"
              alt="KaShop"
              className="w-8 h-8"
            />
            <span className="text-white font-semibold">KaShop</span>
          </div>

          <div className="w-20" />
        </div>
      </div>

      {/* Iframe Content */}
      <div className="flex-1 pt-16">
        <iframe
          src="https://kashop.base44.app"
          className="w-full h-full border-0"
          title="KaShop"
          allow="geolocation; microphone; camera"
        />
      </div>
    </div>
  );
}