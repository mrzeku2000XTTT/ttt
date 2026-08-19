import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Sparkles, Copy, Check, Rocket } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { LIVE_PAGES } from "@/components/agentinternet/livePages";
import OrganicOrb from "@/components/agentinternet/OrganicOrb";

/**
 * GuestAgentPreview — for non-admin users.
 * Instead of opening the real admin-only Agent Internet chat, this shows a
 * "building in real time" log, detects the user's intent via LLM, and
 * recommends the correct TTT app to route to — like how KAI opens apps.
 */
const CATALOG_TEXT = LIVE_PAGES.map((a) => `- ${a.name}: ${a.desc}`).join("\n");

export default function GuestAgentPreview({ open, command, onClose }) {
  const navigate = useNavigate();
  const [lines, setLines] = useState([]);
  const [matches, setMatches] = useState([]);
  const [related, setRelated] = useState([]);
  const [isNovel, setIsNovel] = useState(false);
  const [buildPrompt, setBuildPrompt] = useState("");
  const [copied, setCopied] = useState(false);
  const [phase, setPhase] = useState("building"); // building | ready

  useEffect(() => {
    if (!open || !command) return;
    setLines([]);
    setMatches([]);
    setRelated([]);
    setIsNovel(false);
    setBuildPrompt("");
    setCopied(false);
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
          `A user typed a natural-language command into the TTT Agent Internet. Their input (may be long-form) is:\n"""${q}"""\n\n` +
          `Below is the catalog of available apps, listed as "name: description".\n\n` +
          `${CATALOG_TEXT}\n\n` +
          `Your job:\n` +
          `1. "matches" — up to 3 app NAMES that EXACTLY appear in the catalog and best fit the user's intent, best-first. If none fit, return [].\n` +
          `2. "related" — up to 3 app NAMES that EXACTLY appear in the catalog and are the closest semantic neighbors to the intent even if not a direct fit (for inspiration).\n` +
          `3. "is_novel" — true if the input describes a SPECIFIC, concrete app idea or product that does NOT already exist in the catalog (i.e. the user is describing an app they wish existed and could build). false if it is a generic command, greeting, or maps to an existing app.\n` +
          `4. "build_prompt" — if is_novel is true, write a complete, detailed app-building prompt (200-400 words) that the user could paste into base44.com to build this app. Start with "Build an app that..." and include: the core purpose, main features as a bulleted list, target users, key screens/pages, and any Kaspa/crypto integration if relevant. Write it ready-to-paste. If is_novel is false, return an empty string.`,
        response_json_schema: {
          type: "object",
          properties: {
            matches: { type: "array", items: { type: "string" } },
            related: { type: "array", items: { type: "string" } },
            is_novel: { type: "boolean" },
            build_prompt: { type: "string" },
          },
          required: ["matches", "related", "is_novel", "build_prompt"],
        },
      });
      const names = Array.isArray(res?.matches) ? res.matches : [];
      const relNames = Array.isArray(res?.related) ? res.related : [];
      const found = names
        .map((n) => LIVE_PAGES.find((a) => a.name.toLowerCase() === n.toLowerCase()))
        .filter(Boolean);
      const rel = relNames
        .map((n) => LIVE_PAGES.find((a) => a.name.toLowerCase() === n.toLowerCase()))
        .filter(Boolean)
        .filter((a) => !found.some((m) => m.name === a.name));
      const novel = !!res?.is_novel;
      const prompt = typeof res?.build_prompt === "string" ? res.build_prompt : "";
      setLines((p) => [...p, novel
        ? "> terrific idea · not yet built — you should build it"
        : (found.length ? `> matched · ${found.length} app${found.length > 1 ? "s" : ""}` : "no direct match · explore the store")]);
      setMatches(found);
      setRelated(rel);
      setIsNovel(novel);
      setBuildPrompt(prompt);
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-xl flex items-start sm:items-center justify-center px-4 py-6 overflow-y-auto"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 h-9 rounded-full border border-white/15 bg-black/50 text-white/60 hover:text-white hover:border-white/40 text-xs font-mono uppercase tracking-widest transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Close
          </button>

          <div className="relative w-full max-w-md max-h-[88vh] overflow-y-auto rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-6">
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
              <div className="text-sm text-white/90 font-body max-h-32 overflow-y-auto whitespace-pre-wrap break-words">{command}</div>
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
                  className="space-y-3"
                >
                  {matches.length > 0 && (
                    <>
                      <div className="text-[9px] font-mono uppercase tracking-widest text-white/50">tap to open</div>
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
                    </>
                  )}

                  {isNovel && (
                    <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/[0.06] p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-cyan-300" />
                        <div className="text-sm font-bold text-white">This is a terrific idea</div>
                      </div>
                      <div className="text-[11px] text-white/60 leading-relaxed">
                        One you can build and list inside TTT. This idea is not yet built — you should build it.
                      </div>

                      {related.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-[9px] font-mono uppercase tracking-widest text-white/40">related apps</div>
                          {related.map((app) => (
                            <button
                              key={app.name}
                              onClick={() => goToApp(app)}
                              className="w-full flex items-center gap-2 p-2 rounded-xl border border-white/10 bg-white/[0.03] hover:border-cyan-400/40 transition-colors text-left"
                            >
                              <img src={app.logo} alt="" className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold text-white truncate">{app.name}</div>
                                <div className="text-[10px] text-white/45 truncate">{app.desc}</div>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 text-cyan-300 flex-shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}

                      <button
                        onClick={() => { navigate(`/Explore?idea=${encodeURIComponent(command)}`); onClose?.(); }}
                        className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 transition-colors text-xs font-mono tracking-widest uppercase text-white"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Explore — make this idea real
                      </button>

                      {buildPrompt && (
                        <div className="space-y-1.5">
                          <div className="text-[9px] font-mono uppercase tracking-widest text-white/40">build on base44 · full app prompt</div>
                          <div className="rounded-xl border border-white/10 bg-black/50 p-3 max-h-40 overflow-y-auto">
                            <pre className="whitespace-pre-wrap text-[10px] leading-relaxed text-white/75 font-mono">{buildPrompt}</pre>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={handleCopy}
                              className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 transition-colors text-[10px] font-mono uppercase tracking-widest text-white/80"
                            >
                              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              {copied ? "Copied" : "Copy prompt"}
                            </button>
                            <button
                              onClick={() => window.open("https://www.base44.com", "_blank")}
                              className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg border border-cyan-400/30 bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors text-[10px] font-mono uppercase tracking-widest text-cyan-200"
                            >
                              <Rocket className="w-3.5 h-3.5" /> Build on Base44
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {matches.length === 0 && !isNovel && (
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