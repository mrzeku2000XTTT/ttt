import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, RotateCw, Loader2 } from "lucide-react";

export default function AppFrameViewer({ app, onClose }) {
  const [loading, setLoading] = useState(true);

  return (
    <AnimatePresence>
      {app?.externalUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-[#F5F5F7]"
        >
          {/* Top bar */}
          <div
            className="flex items-center justify-between px-3 sm:px-5 bg-white/80 backdrop-blur-2xl border-b border-zinc-200/60"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
          >
            <div className="flex items-center gap-3 h-14 min-w-0">
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 text-zinc-700 hover:text-zinc-900 h-10 px-3 -ml-3 rounded-lg active:bg-zinc-200/60"
              >
                <X className="w-5 h-5" />
                <span className="text-sm font-medium hidden sm:inline">Close</span>
              </button>
              <div className="min-w-0">
                <p className="text-sm font-bold text-zinc-900 truncate leading-tight">{app.name}</p>
                <p className="text-[10px] text-zinc-400 truncate">{app.externalUrl}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setLoading(true);
                  const f = document.getElementById("appframe");
                  if (f) f.src = app.externalUrl;
                }}
                className="h-10 w-10 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
                title="Reload"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <a
                href={app.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Loading */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-[#F5F5F7] pt-14"
              >
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-zinc-400 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-zinc-400 font-medium">Loading {app.name}…</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Iframe */}
          <iframe
            id="appframe"
            src={app.externalUrl}
            title={app.name}
            onLoad={() => setLoading(false)}
            className="absolute inset-0 top-14 w-full"
            style={{ height: 'calc(100% - 3.5rem - env(safe-area-inset-top, 0px))' }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            allow="accelerometer; camera; clipboard; encrypted-media; geolocation; gyroscope; microphone; autoplay; fullscreen"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}