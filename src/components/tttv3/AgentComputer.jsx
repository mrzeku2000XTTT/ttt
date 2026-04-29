import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, RotateCw, ArrowLeft, ArrowRight, Lock, Loader2 } from "lucide-react";
import AgentCursor from "./AgentCursor";
import NodaLoadingOverlay from "./NodaLoadingOverlay";

/**
 * AgentComputer — a fake desktop browser the agent operates inside the chat.
 * Exposes an imperative ref so the parent can grab the iframe element for postMessage.
 */
const AgentComputer = forwardRef(function AgentComputer({ url, status, narrations, cursor, isActive }, ref) {
  const iframeRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [showNodaBoot, setShowNodaBoot] = useState(false);

  useImperativeHandle(ref, () => ({
    getIframe: () => iframeRef.current,
  }));
  const fullUrl = url ? `${window.location.origin}${url}` : null;
  const isNodaRoute = url && /noda/i.test(url);

  useEffect(() => {
    if (url) setLoading(true);
    if (isNodaRoute) {
      setShowNodaBoot(true);
      const t = setTimeout(() => setShowNodaBoot(false), 2200);
      return () => clearTimeout(t);
    }
  }, [url, isNodaRoute]);

  return (
    <div className="relative w-full h-full bg-zinc-900 rounded-2xl overflow-hidden ring-1 ring-white/10 flex flex-col">
      {/* Chrome bar */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-zinc-950/80 border-b border-white/5">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
        </div>
        <div className="flex items-center gap-0.5 ml-2">
          <button className="w-6 h-6 rounded text-white/30 hover:text-white/60 flex items-center justify-center" disabled>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button className="w-6 h-6 rounded text-white/30 hover:text-white/60 flex items-center justify-center" disabled>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button className="w-6 h-6 rounded text-white/30 hover:text-white/60 flex items-center justify-center" disabled>
            <RotateCw className="w-3 h-3" />
          </button>
        </div>
        <div className="flex-1 flex items-center gap-1.5 bg-white/5 rounded-md px-2.5 py-1 ml-1 ring-1 ring-white/5">
          <Lock className="w-3 h-3 text-emerald-400/70" />
          <span className="text-[11px] font-mono text-white/60 truncate">
            ttt.app{url || "/"}
          </span>
          {loading && <Loader2 className="w-3 h-3 text-cyan-400 animate-spin ml-auto" />}
        </div>
        <div className="flex items-center gap-1.5 ml-1">
          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-400 animate-pulse" : "bg-white/20"}`} />
          <span className="text-[10px] font-bold tracking-widest uppercase text-white/40">
            {isActive ? "Agent Active" : "Idle"}
          </span>
        </div>
      </div>

      {/* Viewport */}
      <div className="relative flex-1 bg-black overflow-hidden">
        {fullUrl ? (
          <iframe
            ref={iframeRef}
            src={fullUrl}
            onLoad={() => setLoading(false)}
            className="w-full h-full border-0 bg-white"
            title="Agent Computer"
            sandbox="allow-same-origin allow-scripts allow-forms"
          />
        ) : (
          <EmptyDesktop />
        )}

        {/* Animated cursor overlay */}
        <AgentCursor x={cursor.x} y={cursor.y} clicking={cursor.clicking} visible={isActive && !!fullUrl} />

        {/* NODA boot overlay — branded loading animation when entering NODA */}
        <NodaLoadingOverlay visible={showNodaBoot} />

        {/* Loading veil on first navigation */}
        <AnimatePresence>
          {loading && fullUrl && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center pointer-events-none"
            >
              <div className="flex items-center gap-2 text-white/70">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span className="text-sm font-medium">Agent loading {url}…</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status strip */}
      <div className="flex-shrink-0 px-3 py-2 bg-zinc-950/80 border-t border-white/5 flex items-center gap-2 min-h-[36px]">
        {isActive ? (
          <>
            <Loader2 className="w-3 h-3 text-cyan-400 animate-spin flex-shrink-0" />
            <span className="text-[11px] text-white/60 truncate">{status}</span>
          </>
        ) : (
          <>
            <Monitor className="w-3 h-3 text-white/30 flex-shrink-0" />
            <span className="text-[11px] text-white/40">Agent computer ready · ask me to use an app</span>
          </>
        )}
      </div>

      {/* Narration toast (latest only) */}
      <AnimatePresence>
        {narrations.length > 0 && (
          <motion.div
            key={narrations[narrations.length - 1]}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-12 left-3 right-3 px-3 py-2 bg-black/80 backdrop-blur-md rounded-xl ring-1 ring-cyan-400/30 text-[12px] text-cyan-100 leading-snug shadow-xl"
          >
            <span className="text-cyan-400 font-bold mr-1.5">🤖</span>
            {narrations[narrations.length - 1]}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default AgentComputer;

function EmptyDesktop() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-950 to-black text-center px-6">
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 via-violet-400 to-pink-400 flex items-center justify-center mb-5 shadow-[0_0_40px_rgba(167,139,250,0.4)]"
      >
        <Monitor className="w-7 h-7 text-black" />
      </motion.div>
      <h4 className="text-white font-bold text-base mb-1">Agent Computer</h4>
      <p className="text-white/40 text-xs max-w-xs">
        Ask the agent to open Feed, Bridge, or TTTV — watch it use the apps for you in real time.
      </p>
    </div>
  );
}