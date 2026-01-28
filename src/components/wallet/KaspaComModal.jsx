import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function KaspaComModal({ isOpen, onClose }) {
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
        className="bg-black border border-cyan-500/30 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col"
        style={{ height: '80vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cyan-500/20">
          <h2 className="text-xl font-bold text-white">KaspaCom Wallet</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* KaspaCom Iframe */}
        <div className="flex-1 overflow-hidden">
          <iframe
            src="https://kaspa.kaspacom.net"
            title="KaspaCom Wallet"
            className="w-full h-full border-0"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}