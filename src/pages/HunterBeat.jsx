import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Loader2, Wand2, Brain, Clock, Link2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import MemoryPanel from "@/components/hunterbeat/MemoryPanel";
import { useHunterBeatMemory } from "@/components/hunterbeat/useHunterBeatMemory";
import FramePreview from "@/components/hunterbeat/FramePreview";
import { orchestrate } from "@/components/hunterbeat/hunterBeatOrchestrator";

const NO_TEXT = " ABSOLUTELY NO TEXT: no words, no letters, no numbers, no labels, no logos, no captions, no watermarks, no UI copy anywhere in the frame.";

const SUGGESTIONS = [
  "A macOS dock bouncing animation",
  "An iOS app launch splash with blur",
  "An Apple-style notification slide-in",
  "An Apple Pay button press animation",
  "https://apple.com — make a motion graphic for this site",
  "An iOS control center toggle animation",
];

export default function HunterBeat() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [duration, setDuration] = useState(6);
  const scrollRef = useRef(null);
  const { skills, notes } = useHunterBeatMemory(user);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const getLastSpec = () => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].spec) return messages[i].spec;
    }
    return null;
  };

  const updateMessage = (id, patch) => {
    setMessages((m) => m.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const handleSend = async (rawInput) => {
    if (!rawInput?.trim() || busy) return;
    setBusy(true);

    const userMsg = { id: Date.now(), role: "user", text: rawInput };
    const assistantId = Date.now() + 1;
    const assistantMsg = {
      id: assistantId,
      role: "assistant",
      text: "",
      thoughts: [],
      thinking: true,
      rendering: false,
    };
    setMessages((m) => [...m, userMsg, assistantMsg]);
    setInput("");

    try {
      const result = await orchestrate({
        userInput: rawInput,
        conversation: [...messages, userMsg],
        skills,
        notes,
        durationSeconds: duration,
        lastSpec: getLastSpec(),
        onThought: (agent, text) => {
          setMessages((m) =>
            m.map((x) =>
              x.id === assistantId
                ? { ...x, thoughts: [...(x.thoughts || []), { agent, text, ts: Date.now() }] }
                : x
            )
          );
        },
      });

      // Auto-render images
      updateMessage(assistantId, {
        thinking: false,
        text: result.response,
        title: result.spec.title,
        styleNotes: result.styleNotes,
        spec: result.spec,
        rendering: true,
        renderProgress: `Rendering ${result.imagePrompts.length} background image(s)…`,
      });

      const imagePrompts = result.imagePrompts;
      const results = await Promise.all(
        imagePrompts.map(async (p) => {
          try {
            const r = await base44.integrations.Core.GenerateImage({ prompt: p + NO_TEXT });
            return r?.url || null;
          } catch {
            return null;
          }
        })
      );
      const images = results.filter(Boolean);
      if (images.length < 1) throw new Error("Image generation failed");

      updateMessage(assistantId, {
        rendering: false,
        frames: images,
        images,
        renderProgress: undefined,
      });
    } catch (e) {
      updateMessage(assistantId, {
        thinking: false,
        rendering: false,
        text: "Something went wrong. Try again or rephrase.",
        error: true,
        renderProgress: undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend(input);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-zinc-900 flex flex-col">
      {/* macOS window chrome */}
      <div className="flex items-center gap-2 px-4 h-11 bg-white/70 backdrop-blur-xl border-b border-zinc-200/60 sticky top-0 z-20">
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
        >
          <Brain className="w-3.5 h-3.5" />
          {(skills.length + notes.length) > 0 && (
            <span className="text-[10px] font-bold text-zinc-500">{skills.length + notes.length}</span>
          )}
        </button>
      </div>

      {/* Hero */}
      {messages.length === 0 && (
        <div className="px-6 pt-8 pb-4 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 text-white text-[10px] font-bold tracking-widest uppercase mb-3">
            <Wand2 className="w-3 h-3" /> Motion Prompt Studio
          </div>
          <h1 className="text-3xl sm:text-4xl font-[800] tracking-tight">Apple-style motion graphics, on prompt</h1>
          <p className="text-zinc-500 text-sm mt-2 max-w-md mx-auto">
            Describe a motion graphic, paste a URL, or ask for edits. Parallel agents research, design, and render — you just talk.
          </p>
        </div>
      )}

      {/* Suggestions */}
      {messages.length === 0 && (
        <div className="px-6 pb-4 flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              disabled={busy}
              className="px-3 py-2 rounded-full bg-white text-[12px] font-medium text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50 hover:ring-zinc-300 transition-colors disabled:opacity-40"
            >
              {s.startsWith("http") && <Link2 className="w-3 h-3 inline mr-1" />}
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Chat */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3 max-w-2xl w-full mx-auto">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            {msg.role === "user" ? (
              /* Apple pill user bubble */
              <div className="max-w-[80%] px-4 py-2.5 rounded-[20px] bg-[#007AFF] text-white text-sm rounded-br-[6px] shadow-sm">
                {msg.text}
              </div>
            ) : (
              /* Apple pill assistant bubble */
              <div className="max-w-[90%] w-full rounded-[20px] bg-white/80 backdrop-blur-xl ring-1 ring-zinc-200/60 shadow-sm overflow-hidden rounded-bl-[6px]">
                {/* Thoughts stream */}
                {msg.thinking && msg.thoughts && msg.thoughts.length > 0 && (
                  <div className="px-4 pt-3 pb-2 space-y-1.5">
                    <AnimatePresence>
                      {msg.thoughts.map((th, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-2"
                        >
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 min-w-[70px]">
                            {th.agent}
                          </span>
                          <span className="text-[11px] text-zinc-500 leading-snug">{th.text}</span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {/* Thinking indicator */}
                {msg.thinking && (
                  <div className="px-4 pb-3 flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-[11px] text-zinc-400">
                      {msg.thoughts?.length > 0 ? "Agents working…" : "Thinking…"}
                    </span>
                  </div>
                )}

                {/* Response text */}
                {msg.text && !msg.thinking && (
                  <>
                    {msg.title && (
                      <div className="px-4 pt-3 pb-1 text-[11px] font-bold tracking-widest uppercase text-zinc-400">
                        {msg.title}
                      </div>
                    )}
                    <div className="px-4 pb-2 text-sm text-zinc-700 leading-relaxed">{msg.text}</div>
                    {msg.styleNotes && (
                      <div className="px-4 pb-2 text-[11px] text-zinc-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {msg.styleNotes}
                      </div>
                    )}
                  </>
                )}

                {/* Error */}
                {msg.error && (
                  <div className="px-4 py-3 text-sm text-red-500">{msg.text}</div>
                )}

                {/* Preview */}
                <AnimatePresence>
                  {(msg.rendering || msg.frames || msg.renderError) && (
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
                      {msg.frames && (
                        <FramePreview
                          images={msg.images || msg.frames}
                          spec={msg.spec}
                          title={msg.title}
                          durationSeconds={msg.spec?.durationSeconds || duration}
                        />
                      )}
                      {msg.renderError && (
                        <div className="aspect-video rounded-xl bg-red-50 flex items-center justify-center text-[12px] text-red-500">
                          Render failed. Try again.
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        ))}

        {busy && messages[messages.length - 1]?.thinking && null}
      </div>

      {/* Input bar with duration slider */}
      <form onSubmit={handleSubmit} className="sticky bottom-0 bg-[#f5f5f7]/80 backdrop-blur-xl border-t border-zinc-200/60 px-4 sm:px-6 py-3">
        <div className="max-w-2xl mx-auto">
          {/* Duration slider */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">Duration</span>
            </div>
            <input
              type="range"
              min={3}
              max={30}
              step={1}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="flex-1 h-1 accent-[#007AFF] cursor-pointer"
            />
            <span className="text-[11px] font-bold text-zinc-600 min-w-[35px] text-right">{duration}s</span>
          </div>

          {/* Input + send */}
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe a motion graphic, paste a URL, or ask for edits…"
              disabled={busy}
              className="flex-1 h-11 px-4 rounded-full bg-white ring-1 ring-zinc-200 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || busy}
              className="flex items-center justify-center w-11 h-11 rounded-full bg-[#007AFF] text-white disabled:opacity-30 hover:bg-[#0066D6] transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>

      <MemoryPanel user={user} open={memoryOpen} onClose={() => setMemoryOpen(false)} />
    </div>
  );
}