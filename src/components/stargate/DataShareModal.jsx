import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share2, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStarGate } from "./StarGateContext";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function DataShareModal({ isOpen, onClose, sourceApp, dataToShare, dataType = "text" }) {
  const { shareData, getAllSharedData } = useStarGate();
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const availableApps = [
    { name: "AK", path: "AK", accepts: ["text", "data", "image"] },
    // Add more apps as they're created
  ];

  const handleShare = (targetApp) => {
    shareData(sourceApp, {
      content: dataToShare,
      type: dataType,
      targetApp,
    });
    setCopied(true);
    setTimeout(() => {
      navigate(createPageUrl(targetApp));
      onClose();
    }, 500);
  };

  const handleCopyData = () => {
    if (typeof dataToShare === "string") {
      navigator.clipboard.writeText(dataToShare);
    } else {
      navigator.clipboard.writeText(JSON.stringify(dataToShare, null, 2));
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-purple-950/90 to-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-lg w-full"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-bold text-white">Share Data</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-xs text-white/60 mb-2">From: {sourceApp}</p>
            <p className="text-sm text-white/80 line-clamp-3">
              {typeof dataToShare === "string" 
                ? dataToShare 
                : JSON.stringify(dataToShare).substring(0, 200) + "..."}
            </p>
          </div>

          <div className="mb-4">
            <p className="text-sm text-white/60 mb-3">Share to:</p>
            <div className="space-y-2">
              {availableApps
                .filter(app => app.name !== sourceApp && app.accepts.includes(dataType))
                .map((app) => (
                  <button
                    key={app.name}
                    onClick={() => handleShare(app.path)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all group"
                  >
                    <span className="text-white font-medium">{app.name}</span>
                    <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-purple-400 transition-colors" />
                  </button>
                ))}
            </div>
          </div>

          <Button
            onClick={handleCopyData}
            className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              "Copy to Clipboard"
            )}
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}