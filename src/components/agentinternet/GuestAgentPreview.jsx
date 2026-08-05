import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { APPS } from "@/components/appstore2/appCatalog";
import OrganicOrb from "@/components/agentinternet/OrganicOrb";

/**
 * GuestAgentPreview — for non-admin users.
 * Instead of opening the real admin-only Agent Internet chat, this shows a
 * "building in real time" log, detects the user's intent via LLM, and
 * recommends the correct TTT app to route to — like how KAI opens apps.
 */
const CATALOG_TEXT = APPS.map((a) => `- ${a.name}: ${a.desc}`).join("\n");

export default function GuestAgentPreview({ open, command, onClose }) {
  const navigate = useNavigate();
  const [lines, setLines] = useState([]);
  const [matches, setMatches] = useState([]);
  const [phase, setPhase] = useState("building"); // building | ready

  useEffect(() => {
    if (!open || !command) return;
    setLines([]);
    setMatches([]);
    setPhase("building");

    const buildLog = [
      "> agent internet · guest relay",
      `> parsing intent: "${command.slice(0, 48)}${command.length > 48 ? "…" : ""}"`,
      "> waking intent router…",
      "> scanning 250+ callable apps…",
      "> ranking by relevance…",
    ];
    let i = 0;
    const t = setInterval(() => {
      const idx = i;
      setLines((p) => [...p, buildLog[idx]]);
      i++;
      if (i >= buildLog.length) {
        clearInterval(t);
        runIntent(command);
      }
    }, 420);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, command]);

  const runIntent = async (q) => {
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:
          `A user typed a natural-language command into the TTT Agent Internet. Their input is: "${q}"\n\n` +
          `Below is the catalog of available apps, listed as "name: description".\n\n` +
          `${CATALOG_TEXT}\n\n` +
          `Your job: figure out which app(s) the user actually needs to accomplish their intent. ` +
          `Match semantically — "open kasshi" → a video/browser app, "send kas" → a wallet/bridge/tip app, ` +
          `"edit a video" → a video editor, "make a thumbnail" → Thumbnail Creator, etc. ` +
          `Return up to 3 app NAMES that best fit, ranked best-first. Only return names that EXACTLY appear in the catalog. ` +
          `If nothing fits, return an empty array.`,
        response_json_schema: {
          type: "object",
          properties: { matches: { type: "array", items: { type: "string" } } },
          required: ["matches"],
        },
      });
      const names = Array.isArray(res?.matches) ? res.matches : [];
      const found = names
        .map((n) => APPS.find((a) => a.name.toLowerCase() === n.toLowerCase()))
        .filter(Boolean);
      setLines((p) => [...p, `> ${found.length ? `matched · ${found.length} app${found.length > 1 ? "s" : ""}` : "no direct match · explore the store"}`]);
      setMatches(found);
      setPhase("ready");
    } catch (e) {
      setLines((p) => [...p, "> relay interrupted · try the app store"]);
      setPhase("ready");
    }
  };

  const goToApp = (app) => {
    if (app.externalUrl) window.open(app.externalUrl, "_blank");
    else if (app.path) navigate(`/${app.path}`);
    onClose?.();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-xl flex items-center justify-center px-4"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 h-9 rounded-full border border-white/15 bg-black/50 text-white/60 hover:text-white hover:border-white/40 text-xs font-mono uppercase tracking-widest transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Close
          </button>

          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-6 overflow-hidden">
            {/* header */}
            <div className="flex items-center gap-2 mb-4">
              <OrganicOrb size={22} colors={["#67e8f9", "#22d3ee", "#6366f1"]} />
              <div>
                <div className="text-xs font-mono tracking-widest uppercase text-cyan-300/80">Agent Internet · Guest</div>
                <div className="text-[10px] font-mono text-white/40">admin-only chat · routing you to the right app</div>
              </div>
            </div>

            {/* echoed command */}
            <div className="mb-4 px-3 py-2 rounded-xl border border-white/10 bg-black/40">
              <div className="text-[9px] font-mono uppercase tracking-widest text-white/40 mb-1">you said</div>
              <div className="text-sm text-white/90 font-body">{command}</div>
            </div>

            {/* building log */}
            <div className="w-full font-mono text-[10px] sm:text-xs space-y-0.5 mb-4 text-emerald-400/80 min-h-[110px]">
              <AnimatePresence>
                {lines.map((line, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}>
                    {line}
                  </motion.div>
                ))}
                {phase === "building" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-cyan-300/80"
                  >
                    <Sparkles className="w-3 h-3 inline mr-1" /> building…
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* results */}
            <AnimatePresence>
              {phase === "ready" && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <div className="text-[9px] font-mono uppercase tracking-widest text-white/50">
                    {matches.length ? "tap to open" : "explore"}
                  </div>
                  {matches.map((app) => (
                    <button
                      key={app.name}
                      onClick={() => goToApp(app)}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-cyan-400/40 hover:bg-cyan-500/5 transition-colors text-left"
                    >
                      <img src={app.logo} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-white truncate">{app.name}</div>
                        <div className="text-[11px] text-white/50 truncate">{app.desc}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-cyan-300 flex-shrink-0" />
                    </button>
                  ))}
                  {matches.length === 0 && (
                    <button
                      onClick={() => { navigate("/AppStoreV2"); onClose?.(); }}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-cyan-400/40 transition-colors text-left"
                    >
                      <OrganicOrb size={36} colors={["#67e8f9", "#22d3ee", "#6366f1"]} />
                      <div className="flex-1">
                        <div className="text-sm font-bold text-white">Browse the App Store</div>
                        <div className="text-[11px] text-white/50">250+ Kaspa-native apps</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-cyan-300" />
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}