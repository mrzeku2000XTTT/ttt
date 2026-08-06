import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Download, Loader2, Wand2, Brain, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import MemoryPanel from "@/components/hunterbeat/MemoryPanel";
import { useHunterBeatMemory } from "@/components/hunterbeat/useHunterBeatMemory";

const SUGGESTIONS = [
  "A macOS dock bouncing animation",
  "An iOS app launch splash with blur",
  "An Apple-style notification slide-in",
  "A macOS window minimize genie effect",
  "An iOS control center toggle animation",
  "An Apple Pay button press animation",
];

const PROMPT_SCHEMA = {
  type: "object",
  properties: {
    prompt: { type: "string" },
    title: { type: "string" },
    style_notes: { type: "string" },
  },
  required: ["prompt", "title"],
};

export default function HunterBeat() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const scrollRef = useRef(null);
  const { skills, notes } = useHunterBeatMemory(user);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const generatePrompt = async (userIdea) => {
    setBusy(true);
    const userMsg = { id: Date.now(), role: "user", text: userIdea };
    setMessages((m) => [...m, userMsg]);
    setInput("");

    const learnedSkills = skills.map((s) => `### ${s.title}\n${s.content.slice(0, 4000)}`).join("\n\n");
    const userNotes = notes.map((n) => n.text).join("\n- ");

    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:
          `You are HunterBeat, an AI that crafts premium motion-graphics prompts in the Apple / macOS aesthetic.\n` +
          `The user wants: "${userIdea}"\n\n` +
          (learnedSkills ? `The user has ingested these skill references — follow their principles:\n\n${learnedSkills}\n\n` : "") +
          (userNotes ? `User preferences / notes:\n- ${userNotes}\n\n` : "") +
          `Write ONE detailed, production-ready image prompt that captures this as a motion-graphic still frame.\n` +
          `Style rules: Apple Human Interface Guidelines, SF typography, frosted glass, soft depth, neutral palette with one accent, generous whitespace, subtle shadows, rounded corners, NO text in the image.\n` +
          `Return a title (short, 2-4 words) and the full prompt (detailed, visual, 2-4 sentences).`,
        response_json_schema: PROMPT_SCHEMA,
      });
      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: res.prompt,
          title: res.title,
          styleNotes: res.style_notes,
          imageUrl: null,
          rendering: false,
        },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { id: Date.now() + 1, role: "assistant", text: "Couldn't craft that prompt. Try rephrasing.", error: true },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const renderPreview = async (msgId) => {
    const msg = messages.find((m) => m.id === msgId);
    if (!msg || msg.rendering || msg.videoUrl) return;

    setMessages((m) => m.map((x) => (x.id === msgId ? { ...x, rendering: true, renderProgress: "Directing keyframes…" } : x)));
    try {
      const videoPrompt =
        `${msg.text}. ` +
        `Smooth, fluid Apple-style motion graphic animation. ` +
        `Animate with natural easing: elements slide, scale, and fade with spring physics. ` +
        `Frosted glass, soft depth, neutral palette with one accent. ` +
        `NO TEXT, no words, no letters, no UI labels. ` +
        `Clean macOS aesthetic, 6 seconds, loopable.`;
      setMessages((m) => m.map((x) => (x.id === msgId ? { ...x, renderProgress: "Rendering frames…" } : x)));
      const res = await base44.integrations.Core.GenerateVideo({
        prompt: videoPrompt,
        duration: 6,
        aspect_ratio: "16:9",
        generate_audio: false,
      });
      setMessages((m) => m.map((x) => (x.id === msgId ? { ...x, rendering: false, videoUrl: res?.url, renderProgress: undefined } : x)));
    } catch (e) {
      setMessages((m) => m.map((x) => (x.id === msgId ? { ...x, rendering: false, renderError: true, renderProgress: undefined } : x)));
    }
  };

  const downloadVideo = (url, title) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || "hunterbeat").replace(/\s+/g, "-").toLowerCase()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || busy) return;
    generatePrompt(input.trim());
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-zinc-900 flex flex-col">
      {/* macOS window chrome */}
      <div className="flex items-center gap-2 px-4 h-11 bg-white/70 backdrop-blur-xl border-b border-zinc-200/60">
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/AppStoreV2")}
            className="w-3 h-3 rounded-full bg-[#ff5f57] hover:opacity-80 transition-opacity"
            title="Close & back to App Store"
          />
          <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <span className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 text-center text-[13px] font-semibold text-zinc-500">HunterBeat</div>
        <button
          onClick={() => setMemoryOpen(true)}
          className="flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-[11px] font-semibold transition-colors"
          title="Memory & Skills"
        >
          <Brain className="w-3.5 h-3.5" />
          {(skills.length + notes.length) > 0 && (
            <span className="text-[10px] font-bold text-zinc-500">{skills.length + notes.length}</span>
          )}
        </button>
      </div>

      {/* Hero */}
      <div className="px-6 pt-8 pb-4 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 text-white text-[10px] font-bold tracking-widest uppercase mb-3">
          <Wand2 className="w-3 h-3" /> Motion Prompt Studio
        </div>
        <h1 className="text-3xl sm:text-4xl font-[800] tracking-tight">Apple-style motion graphics, on prompt</h1>
        <p className="text-zinc-500 text-sm mt-2 max-w-md mx-auto">
          Describe a motion graphic. HunterBeat crafts a refined Apple / macOS aesthetic prompt and renders a preview you can save.
        </p>
        <button
          onClick={() => setMemoryOpen(true)}
          className="mt-4 inline-flex items-center gap-2 px-5 h-10 rounded-full bg-zinc-900 text-white text-[13px] font-semibold hover:bg-zinc-800 transition-colors"
        >
          <Brain className="w-4 h-4" />
          Skills & Memory
          {(skills.length + notes.length) > 0 && (
            <span className="ml-1 min-w-5 h-5 px-1.5 rounded-full bg-white/20 text-[11px] font-bold flex items-center justify-center">
              {skills.length + notes.length}
            </span>
          )}
        </button>
      </div>

      {/* Suggestions */}
      {messages.length === 0 && (
        <div className="px-6 pb-4 flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => generatePrompt(s)}
              disabled={busy}
              className="px-3 py-2 rounded-full bg-white text-[12px] font-medium text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50 hover:ring-zinc-300 transition-colors disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Chat */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 max-w-2xl w-full mx-auto">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            {msg.role === "user" ? (
              <div className="max-w-[80%] px-4 py-2.5 rounded-2xl bg-blue-500 text-white text-sm">{msg.text}</div>
            ) : (
              <div className="max-w-[88%] w-full rounded-2xl bg-white ring-1 ring-zinc-200/70 shadow-sm overflow-hidden">
                {msg.title && (
                  <div className="px-4 pt-3 pb-1 text-[11px] font-bold tracking-widest uppercase text-zinc-400">
                    {msg.title}
                  </div>
                )}
                <div className="px-4 pb-3 text-sm text-zinc-700 leading-relaxed">{msg.text}</div>

                {msg.styleNotes && (
                  <div className="px-4 pb-3 text-[11px] text-zinc-400">
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    {msg.styleNotes}
                  </div>
                )}

                {/* Preview */}
                <AnimatePresence>
                  {(msg.rendering || msg.videoUrl || msg.renderError) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="px-4 pb-4"
                    >
                      {msg.rendering && (
                        <div className="aspect-video rounded-xl bg-zinc-100 flex flex-col items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                          {msg.renderProgress && (
                            <span className="text-[11px] text-zinc-400">{msg.renderProgress}</span>
                          )}
                        </div>
                      )}
                      {msg.videoUrl && (
                        <div className="relative group">
                          <video
                            src={msg.videoUrl}
                            controls
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full rounded-xl bg-black"
                          />
                          <button
                            onClick={() => downloadVideo(msg.videoUrl, msg.title)}
                            className="absolute bottom-2 right-2 flex items-center gap-1.5 px-3 h-8 rounded-full bg-black/70 backdrop-blur text-white text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Download className="w-3.5 h-3.5" /> Save
                          </button>
                        </div>
                      )}
                      {msg.renderError && (
                        <div className="aspect-video rounded-xl bg-red-50 flex items-center justify-center text-[12px] text-red-500">
                          Render failed. Try again.
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actions */}
                {!msg.error && !msg.videoUrl && !msg.rendering && (
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => renderPreview(msg.id)}
                      className="flex items-center gap-1.5 px-4 h-9 rounded-full bg-zinc-900 text-white text-[12px] font-semibold hover:bg-zinc-800 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Generate 6s video
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))}

        {busy && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-white ring-1 ring-zinc-200/70 px-4 py-3 flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Crafting prompt…
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="sticky bottom-0 bg-[#f5f5f7]/80 backdrop-blur-xl border-t border-zinc-200/60 px-4 sm:px-6 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe a motion graphic…"
            disabled={busy}
            className="flex-1 h-11 px-4 rounded-full bg-white ring-1 ring-zinc-200 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || busy}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-zinc-900 text-white disabled:opacity-30 hover:bg-zinc-800 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      <MemoryPanel user={user} open={memoryOpen} onClose={() => setMemoryOpen(false)} />
    </div>
  );
}