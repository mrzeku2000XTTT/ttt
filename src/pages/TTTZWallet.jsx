import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, Loader2, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function TTTZWalletPage() {
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef(null);
  const navigate = useNavigate();

  const handleRefresh = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = '';
      setTimeout(() => {
        iframeRef.current.src = currentSrc;
        setTimeout(() => setIsLoading(false), 1000);
      }, 100);
    }
  };

  const handleBack = () => {
    navigate(createPageUrl("WalletHub"));
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10" style={{ paddingTop: 'var(--sat, 0px)' }}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                onClick={handleBack}
                size="sm"
                className="bg-emerald-500/20 border border-emerald-500 hover:bg-emerald-500/30 text-emerald-400 h-9 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-lg font-bold text-white">TTTZ Wallet</h1>
              </div>
            </div>

            <Button
              onClick={handleRefresh}
              size="sm"
              className="bg-emerald-500/20 border border-emerald-500 hover:bg-emerald-500/30 text-emerald-400 h-9"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Spacer for header */}
      <div className="h-20" />

      {/* Wallet Iframe */}
      <div className="relative w-full h-[calc(100vh-5rem)] bg-black">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
              <p className="text-white/60 text-sm">Loading Wallet...</p>
            </div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src="https://tttz.xyz/wallet"
          title="TTTZ Wallet"
          className="w-full h-full border-0"
          allow="clipboard-write; encrypted-media"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
}