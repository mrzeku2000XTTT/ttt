import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, RotateCw, Loader2, AlertCircle } from "lucide-react";

const LOAD_TIMEOUT = 15000; // 15 seconds

export default function AppFrameViewer({ app, onClose }) {
  const [loading, setLoading] = useState(true);
  const [timedOut, setTimedOut] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const timerRef = useRef(null);

  const externalUrl = app?.externalUrl;

  // Reset state whenever the app or reload changes
  useEffect(() => {
    if (!externalUrl) return;
    setLoading(true);
    setTimedOut(false);

    timerRef.current = setTimeout(() => {
      setTimedOut(true);
      setLoading(false);
    }, LOAD_TIMEOUT);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [externalUrl, reloadKey]);

  const handleLoaded = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLoading(false);
    setTimedOut(false);
  };

  const handleReload = () => {
    setReloadKey(k => k + 1);
  };

  // Don't render if no valid URL
  if (!externalUrl) return null;

  return (
    <AnimatePresence>
      {app?.externalUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-white"
        >
          {/* Top bar */}
          <div
            className="flex items-center justify-between px-3 sm:px-5 bg-white/90 backdrop-blur-2xl border-b border-zinc-200/60"
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
                <p className="text-[10px] text-zinc-400 truncate">{externalUrl}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleReload}
                className="h-10 w-10 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
                title="Reload"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Loading spinner */}
          <AnimatePresence>
            {loading && !timedOut && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-white pt-14"
              >
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-zinc-400 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-zinc-400 font-medium">Loading {app.name}…</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Timeout / error state */}
          <AnimatePresence>
            {timedOut && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-white pt-14 px-6"
              >
                <div className="text-center max-w-sm">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-zinc-100 flex items-center justify-center">
                    <AlertCircle className="w-7 h-7 text-zinc-400" />
                  </div>
                  <p className="font-bold text-zinc-900 mb-1">Taking too long to load</p>
                  <p className="text-sm text-zinc-400 mb-5">
                    This app may be starting up or may not allow embedded viewing.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={handleReload}
                      className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-zinc-100 text-zinc-700 text-sm font-bold hover:bg-zinc-200 transition-colors"
                    >
                      <RotateCw className="w-4 h-4" /> Retry
                    </button>
                    <a
                      href={externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-zinc-900 text-white text-sm font-bold hover:bg-zinc-800 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" /> Open in new tab
                    </a>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Iframe — explicit white bg, keyed on reloadKey to force remount */}
          <iframe
            key={reloadKey}
            id="appframe"
            src={externalUrl}
            title={app.name}
            onLoad={handleLoaded}
            className="absolute inset-0 top-14 w-full bg-white"
            style={{ height: 'calc(100% - 3.5rem - env(safe-area-inset-top, 0px))' }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
            allow="accelerometer; camera; clipboard; encrypted-media; geolocation; gyroscope; microphone; autoplay; fullscreen"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}