import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

export default function KaShopPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Minimal Header */}
      <div className="fixed top-0 left-0 right-0 z-50 h-12 bg-black/40 backdrop-blur-xl border-b border-white/10 flex items-center px-4" style={{ paddingTop: 'var(--sat, 0px)' }}>
        <Link to={createPageUrl("AppStore")}>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white h-8"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Iframe Content */}
      <div className="flex-1 pt-12">
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