import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, Send, Loader2, Download, Film, Wand2, RefreshCw, Play } from "lucide-react";
import { base44 } from "@/api/base44Client";
import KineAgentMessage from "@/components/kine/KineAgentMessage";
import KineHero from "@/components/kine/KineHero";
import KineSuggestions from "@/components/kine/KineSuggestions";

// Local storage key for persisting the user's recent generations
const HISTORY_KEY = "kine_history_v1";

export default function KinePage() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]); // [{ role, content, videoUrl?, status?, error? }]
  const [generating, setGenerating] = useState(false);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  // Load history once
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) setMessages(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  // Persist on change
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-30)));
    } catch { /* ignore */ }
  }, [messages]);

  // Auto-scroll on new message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const enhancePrompt = async (raw) => {
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Rewrite this short user request into a vivid, cinematic video generation prompt (max 2 sentences). Add subject, action, style, mood, lighting. Do NOT explain — output only the rewritten prompt.\n\nUSER: ${raw}`,
      });
      const text = typeof res === "string" ? res : res?.text || raw;
      return text.replace(/^["']|["']$/g, "").trim();
    } catch {
      return raw;
    }
  };

  const generate = async () => {
    const raw = prompt.trim();
    if (!raw || generating) return;
    setGenerating(true);
    setPrompt("");

    const userMsg = { role: "user", content: raw, ts: Date.now() };
    const agentId = `a_${Date.now()}`;
    const agentMsg = { id: agentId, role: "agent", status: "enhancing", content: "Enhancing your prompt…" };
    setMessages((m) => [...m, userMsg, agentMsg]);

    // Step 1 — enhance
    const enhanced = await enhancePrompt(raw);
    setMessages((m) => m.map((x) => x.id === agentId ? { ...x, status: "generating", content: enhanced, hint: "Generating your video — this takes 30-60 seconds…" } : x));

    // Step 2 — generate
    try {
      const res = await base44.integrations.Core.GenerateVideo({ prompt: enhanced });
      const videoUrl = res?.url || res?.video_url || res?.file_url;
      if (!videoUrl) throw new Error("No video URL returned");
      setMessages((m) => m.map((x) => x.id === agentId ? { ...x, status: "done", videoUrl, content: enhanced } : x));
    } catch (e) {
      setMessages((m) => m.map((x) => x.id === agentId ? { ...x, status: "error", error: e.message || "Generation failed" } : x));
    } finally {
      setGenerating(false);
      inputRef.current?.focus();
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      generate();
    }
  };

  const clearHistory = () => {
    setMessages([]);
    try { localStorage.removeItem(HISTORY_KEY); } catch { /* ignore */ }
  };

  const useSuggestion = (text) => {
    setPrompt(text);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#05030A] via-[#0a0418] to-[#05030A] text-white relative overflow-hidden">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-fuchsia-500/20 blur-[140px] rounded-full" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-cyan-500/15 blur-[140px] rounded-full" />
        <div className="absolute bottom-0 left-1/2 w-[500px] h-[500px] bg-violet-500/15 blur-[140px] rounded-full" />
      </div>

      {/* Nav */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-3 sm:px-5 bg-black/40 backdrop-blur-2xl border-b border-white/10"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="flex items-center justify-between w-full h-14 max-w-6xl mx-auto">
          <Link
            to="/AppStoreV2"
            className="flex items-center gap-1.5 text-white/70 hover:text-white h-11 px-3 rounded-lg active:bg-white/5"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-[14px] font-medium">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-fuchsia-500 via-violet-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-fuchsia-500/40">
              <Film className="w-4 h-4 text-white" />
            </div>
            <span className="text-[15px] font-[900] tracking-tight">KINE</span>
          </div>
          {messages.length > 0 ? (
            <button
              onClick={clearHistory}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-white/60 hover:text-white h-10 px-3 rounded-full"
              title="Clear history"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          ) : (
            <div className="w-20" />
          )}
        </div>
      </nav>

      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-32">
        {messages.length === 0 ? (
          <>
            <KineHero />
            <KineSuggestions onPick={useSuggestion} />
          </>
        ) : (
          <div ref={scrollRef} className="space-y-6 pb-6">
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <KineAgentMessage key={m.id || i} message={m} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Sticky composer */}
      <div className="fixed bottom-0 left-0 right-0 z-40 pb-4 px-4" style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 1rem)" }}>
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative rounded-2xl bg-white/5 border border-white/15 backdrop-blur-2xl shadow-2xl shadow-fuchsia-500/10 overflow-hidden"
          >
            <textarea
              ref={inputRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Describe your video — e.g. 'A neon cyberpunk fox running through Tokyo at night'"
              rows={2}
              disabled={generating}
              style={{ fontSize: "16px" }}
              className="w-full px-4 py-3 bg-transparent text-white placeholder:text-white/30 outline-none resize-none disabled:opacity-50"
            />
            <div className="flex items-center justify-between px-3 py-2 border-t border-white/10 bg-black/30">
              <div className="flex items-center gap-1.5 text-[10px] text-white/40">
                <Sparkles className="w-3 h-3 text-fuchsia-300" />
                Powered by Base44 video AI
              </div>
              <button
                onClick={generate}
                disabled={!prompt.trim() || generating}
                className="flex items-center gap-1.5 h-9 px-4 rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg shadow-fuchsia-500/30"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Working…
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Generate
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}