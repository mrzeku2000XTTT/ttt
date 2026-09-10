import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink } from "lucide-react";
import { useAppStoreAccess } from "@/lib/useAppStoreAccess";
import AppAccessGate from "@/components/appstore2/AppAccessGate";

// In-store live preview for community-listed apps. We iframe the app's live
// URL (e.g. a Vercel deployment) so users can try it without leaving TTT.
// A "Open in new tab" button is kept as a fallback for apps that block framing.
export default function AppPreviewModal({ app, onClose }) {
  const access = useAppStoreAccess();
  const [gateOpen, setGateOpen] = useState(false);
  const guardedOpen = () => {
    if (access.valid && app?.externalUrl) window.open(app.externalUrl, "_blank", "noopener,noreferrer");
    else setGateOpen(true);
  };
  return (
    <>
    <AnimatePresence>
      {app && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            className="relative w-full h-full flex flex-col"
          >
            {/* Floating controls over the full-screen preview */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
              <div className="flex items-center gap-2 h-10 pl-1.5 pr-3.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 flex-shrink-0">
                {app.logo ? (
                  <img src={app.logo} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                    {app.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-semibold text-white truncate max-w-[140px]">{app.name}</span>
              </div>
              <button
                onClick={guardedOpen}
                className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-white text-xs font-semibold hover:bg-black transition-colors flex-shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Open in new tab</span>
              </button>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-black/70 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Iframe — full screen */}
            <div className="flex-1 relative bg-black">
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
    <AppAccessGate
      open={gateOpen}
      onClose={() => setGateOpen(false)}
      onAuthorized={() => { setGateOpen(false); if (app?.externalUrl) window.open(app.externalUrl, "_blank", "noopener,noreferrer"); }}
    />
    </>
  );
}