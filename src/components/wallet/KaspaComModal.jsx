import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function KaspaComModal({ isOpen, onClose }) {
  const [isLoading, setIsLoading] = useState(true);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-black border border-cyan-500/30 rounded-xl w-full max-w-3xl shadow-2xl flex flex-col"
        style={{ height: '85vh', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cyan-500/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">Kaspa Wallet</h2>
            <Button
              asChild
              className="bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/40 h-8 px-3 text-sm"
            >
              <a
                href="https://kaspacom.net"
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit Site
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </Button>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 rounded-xl">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        )}

        {/* KaspaCom Iframe */}
        <div className="flex-1 overflow-hidden relative">
          <iframe
            src="https://kaspacom.net/wallet"
            title="KaspaCom Wallet"
            className="w-full h-full border-0"
            onLoad={() => setIsLoading(false)}
            allow="clipboard-read; clipboard-write"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}