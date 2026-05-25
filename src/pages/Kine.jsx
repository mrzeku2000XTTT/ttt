import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, Send, Loader2, Film, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import KineAgentMessage from "@/components/kine/KineAgentMessage";
import KineHero from "@/components/kine/KineHero";
import KineSuggestions from "@/components/kine/KineSuggestions";
import { createKineVideoFromImage } from "@/components/kine/createKineVideo";

const generationToMessages = (item) => ([
  { id: `${item.id}_user`, role: "user", content: item.raw_prompt, ts: item.created_date },
  {
    id: `${item.id}_agent`,
    role: "agent",
    status: "done",
    content: item.enhanced_prompt,
    imageUrl: item.image_url,
    videoUrl: item.video_url,
    matchedLabel: "Saved",
    generationId: item.id,
  },
]);

export default function KinePage() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]); // [{ role, content, videoUrl?, status?, error? }]
  const [generating, setGenerating] = useState(false);
  const [user, setUser] = useState(null);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  // Load the current user's saved generations
  useEffect(() => {
    const loadUserGenerations = async () => {
      const authed = await base44.auth.isAuthenticated();
      if (!authed) return;

      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const generations = await base44.entities.KineGeneration.filter(
        { user_email: currentUser.email },
        "-created_date",
        15
      );
      setMessages(generations.reverse().flatMap(generationToMessages));
    };

    loadUserGenerations();
  }, []);

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

    if (!user) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    setGenerating(true);
    setPrompt("");

    const userMsg = { role: "user", content: raw, ts: Date.now() };
    const agentId = `a_${Date.now()}`;
    const agentMsg = { id: agentId, role: "agent", status: "enhancing", content: "Enhancing your prompt…" };
    setMessages((m) => [...m, userMsg, agentMsg]);

    // Step 1 — enhance
    const enhanced = await enhancePrompt(raw);
    setMessages((m) => m.map((x) => x.id === agentId ? { ...x, status: "generating", content: enhanced, hint: "Generating your video — this takes 30-60 seconds…" } : x));

    try {
      const image = await base44.integrations.Core.GenerateImage({
        prompt: `${enhanced}\n\nCreate a cinematic 16:9 video keyframe, high detail, no text, no watermark.`,
      });
      const imageUrl = image?.url;
      if (!imageUrl) throw new Error("Could not generate the video keyframe");
      const { videoUrl, videoBlob } = await createKineVideoFromImage(imageUrl, enhanced);
      let savedVideoUrl = videoUrl;
      let generationId;

      if (user?.email) {
        const file = new File([videoBlob], `kine-${Date.now()}.webm`, { type: "video/webm" });
        const upload = await base44.integrations.Core.UploadFile({ file });
        savedVideoUrl = upload.file_url;
        const saved = await base44.entities.KineGeneration.create({
          user_email: user.email,
          raw_prompt: raw,
          enhanced_prompt: enhanced,
          image_url: imageUrl,
          video_url: savedVideoUrl,
        });
        generationId = saved.id;
      }

      setMessages((m) => m.map((x) => x.id === agentId ? {
        ...x,
        status: "done",
        videoUrl: savedVideoUrl,
        imageUrl,
        matchedLabel: user?.email ? "Saved" : "Fresh",
        generationId,
        content: enhanced,
      } : x));
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

  const clearHistory = async () => {
    const ids = messages.map((message) => message.generationId).filter(Boolean);
    await Promise.all(ids.map((id) => base44.entities.KineGeneration.delete(id)));
    setMessages([]);
  };

  const useSuggestion = (text) => {
    setPrompt(text);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-[#FBFAF7] text-zinc-900 relative overflow-hidden">
      {/* Subtle ambient warmth */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-rose-200/30 blur-[140px] rounded-full" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-amber-100/40 blur-[140px] rounded-full" />
      </div>

      {/* Nav */}
      <nav
        className="sticky top-0 z-50 bg-[#FBFAF7]/80 backdrop-blur-2xl border-b border-zinc-200/60"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="flex items-center justify-between w-full h-14 max-w-5xl mx-auto px-4 sm:px-6">
          <Link
            to="/AppStoreV2"
            className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 h-10 px-3 -ml-1 rounded-lg active:bg-zinc-200/50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[13px] font-medium">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center">
              <Film className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[14px] font-[700] tracking-tight text-zinc-900">Kine</span>
          </div>
          {messages.length > 0 ? (
            <button
              onClick={clearHistory}
              className="flex items-center gap-1.5 text-[12px] font-medium text-zinc-500 hover:text-zinc-900 h-9 px-2.5 rounded-full"
              title="Clear history"
            >
              <RefreshCw className="w-3 h-3" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          ) : (
            <div className="w-16" />
          )}
        </div>
      </nav>

      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-32">
        {messages.length === 0 ? (
          <>
            <KineHero />
            <KineSuggestions onPick={useSuggestion} />
          </>
        ) : (
          <div ref={scrollRef} className="space-y-5 pb-6">
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
            transition={{ delay: 0.15 }}
            className="relative rounded-2xl bg-white border border-zinc-200/80 shadow-xl shadow-zinc-900/5 overflow-hidden"
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
              className="w-full px-4 py-3 bg-transparent text-zinc-900 placeholder:text-zinc-400 outline-none resize-none disabled:opacity-50"
            />
            <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-100">
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                <Sparkles className="w-3 h-3" />
                Powered by Base44 video AI
              </div>
              <button
                onClick={generate}
                disabled={!prompt.trim() || generating}
                className="flex items-center gap-1.5 h-9 px-4 rounded-full bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed text-white font-semibold text-xs transition-colors"
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