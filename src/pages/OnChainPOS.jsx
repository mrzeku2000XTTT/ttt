import React from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export default function OnChainPOSPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="mb-8 animate-pulse">
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/cf40407bc_image.png"
          alt="OnChain POS"
          className="w-48 h-48 object-contain"
        />
      </div>

      {/* Title */}
      <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 text-center">
        OnChain POS
      </h1>

      {/* Description */}
      <p className="text-gray-400 text-lg md:text-xl text-center max-w-2xl mb-12">
        Next-generation point of sale system powered by blockchain technology
      </p>

      {/* Launch Button */}
      <a 
        href="https://onchainpos.live" 
        target="_blank" 
        rel="noopener noreferrer"
        className="w-full max-w-md"
      >
        <Button 
          className="w-full h-16 text-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-green-500 hover:from-cyan-600 hover:via-teal-600 hover:to-green-600 text-white font-bold shadow-lg shadow-cyan-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/70"
        >
          <ExternalLink className="w-6 h-6 mr-3" />
          Launch OnChain POS
        </Button>
      </a>

      {/* Subtle background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}