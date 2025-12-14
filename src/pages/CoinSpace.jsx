import React from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

export default function CoinSpacePage() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] bg-zinc-950">
      <div className="p-4 flex items-center justify-between bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl("AppStore")}>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <img 
              src="https://www.google.com/s2/favicons?domain=coin.space&sz=128" 
              alt="CoinSpace" 
              className="w-8 h-8 rounded-full"
            />
            <h1 className="text-xl font-bold text-white">CoinSpace</h1>
          </div>
        </div>
        <a 
          href="https://coin.space/wallet/" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          <Button variant="outline" size="sm" className="gap-2 bg-transparent text-white border-white/20 hover:bg-white/10">
            <ExternalLink className="w-4 h-4" />
            Open in New Tab
          </Button>
        </a>
      </div>
      <div className="flex-1 w-full bg-white relative">
        <iframe 
          src="https://coin.space/wallet/" 
          className="w-full h-full border-0 absolute inset-0"
          title="CoinSpace Wallet"
          allow="camera; microphone; geolocation"
        />
      </div>
    </div>
  );
}