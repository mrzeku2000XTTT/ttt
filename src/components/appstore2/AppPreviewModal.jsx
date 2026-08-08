import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Shield } from "lucide-react";

// In-store live preview for community-listed apps. We iframe the app's live
// URL (e.g. a Vercel deployment) so users can try it without leaving TTT.
// A "Open in new tab" button is kept as a fallback for apps that block framing.
export default function AppPreviewModal({ app, onClose }) {
  return (
    <AnimatePresence>
      {app && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            className="bg-[#F5F5F7] rounded-2xl overflow-hidden w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl"
          >
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 px-3 sm:px-4 h-12 bg-white border-b border-zinc-200 flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                {app.logo ? (
                  <img src={app.logo} alt="" className="w-6 h-6 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-6 h-6 rounded-lg bg-zinc-200 flex items-center justify-center text-[11px] font-bold text-zinc-500 flex-shrink-0">
                    {app.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-semibold text-zinc-900 truncate">{app.name}</span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-zinc-400 ml-1">
                  <Shield className="w-3 h-3" /> Kaspa app
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={app.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-700 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Open in new tab</span>
                </a>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full hover:bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* Iframe */}
            <div className="flex-1 relative bg-white">
              <iframe
                src={app.externalUrl}
                title={app.name}
                className="absolute inset-0 w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-storage-access-by-user-activation"
                referrerPolicy="no-referrer"
                allow="clipboard-read; clipboard-write; camera; microphone; web3; ethereum-provider; kaspa-provider"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}