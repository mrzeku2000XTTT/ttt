import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

export default function StoryboardCrabBot({ active = false, sceneCount = 0, storyboard, scene, scenes = [] }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("storyboard_crab_ai_memory") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("storyboard_crab_ai_memory", JSON.stringify(messages.slice(-16)));
  }, [messages]);

  const askCrab = async () => {
    if (!input.trim() || thinking) return;
    const userMessage = { role: "user", content: input.trim() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setThinking(true);

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are Crab Architect, a senior storyboard/script architect bot visible as a 2D crab in the Mood Board. Analyze continuity, repeated visual patterns, scene stitching, camera logic, character consistency, and next-scene structure. Learn from this conversation memory and respond like a practical creative director.

Original storyboard: ${storyboard?.idea || "No storyboard loaded"}
Style: ${storyboard?.style || "Unknown"}
Current scene idea: ${scene?.scene_idea || "No active scene"}
Current scene prompt: ${scene?.scene_prompt || "No active prompt"}
Total generated scenes: ${scenes.length}
Recent memory: ${nextMessages.slice(-8).map((m) => `${m.role}: ${m.content}`).join("\n")}

User asks: ${userMessage.content}

Give a concise but useful answer. If helpful, suggest exact wording for the next extension prompt.`
    });

    setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    setThinking(false);
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-32 right-4 z-[130] w-[min(22rem,calc(100vw-2rem))] rounded-3xl border border-cyan-200/20 bg-black/85 p-3 text-white shadow-2xl shadow-cyan-500/20 backdrop-blur-2xl">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">Crab Architect</p>
              <p className="text-xs text-white/50">Realtime scene stitching AI</p>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold hover:bg-white/20">Close</button>
          </div>

          <div className="max-h-64 space-y-2 overflow-auto rounded-2xl bg-white/5 p-2">
            {messages.length === 0 && <p className="text-sm text-white/55">Click me anytime. I’ll analyze patterns, continuity, and how to stitch the next scene.</p>}
            {messages.slice(-8).map((message, index) => (
              <div key={index} className={`rounded-2xl px-3 py-2 text-sm leading-5 ${message.role === "user" ? "ml-8 bg-cyan-400/20 text-cyan-50" : "mr-8 bg-white/10 text-white/75"}`}>
                {message.content}
              </div>
            ))}
            {thinking && <div className="mr-8 rounded-2xl bg-white/10 px-3 py-2 text-sm text-white/60">Crab is reading the scene patterns...</div>}
          </div>

          <div className="mt-2 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && askCrab()}
              placeholder="Ask about scene continuity..."
              className="min-w-0 flex-1 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm text-white outline-none focus:border-cyan-200/50"
            />
            <button onClick={askCrab} disabled={thinking || !input.trim()} className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-black text-black disabled:opacity-50">Ask</button>
          </div>
        </div>
      )}

      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[120] h-44 overflow-hidden">
        <motion.div
          className="pointer-events-auto absolute bottom-4 flex cursor-pointer flex-col items-center"
          initial={{ x: "-15vw", y: 0 }}
          animate={{ x: ["-15vw", "25vw", "55vw", "105vw", "55vw", "20vw", "-15vw"], y: [0, -52, 16, -70, -20, -58, 0] }}
          transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
          onClick={() => setOpen(true)}
        >
          <motion.div
            className="mb-2 rounded-full border border-cyan-200/30 bg-black/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100 shadow-2xl shadow-cyan-500/20 backdrop-blur-xl"
            animate={{ opacity: active ? [0.65, 1, 0.65] : 0.9, y: [0, -5, 0] }}
            transition={{ duration: 1.1, repeat: Infinity }}
          >
            Click Crab AI · {active ? "stitching" : sceneCount ? `scene ${sceneCount}` : "ready"}
          </motion.div>

          <motion.div className="relative h-14 w-24" animate={{ y: [0, -6, 0], rotate: [-2, 2, -2] }} transition={{ duration: 0.5, repeat: Infinity }}>
            <div className="absolute left-6 top-5 h-7 w-12 rounded-full bg-gradient-to-b from-orange-400 to-red-600 shadow-[0_0_22px_rgba(248,113,113,0.55)]" />
            <div className="absolute left-8 top-2 h-6 w-3 rounded-full bg-orange-300" />
            <div className="absolute left-13 top-2 h-6 w-3 rounded-full bg-orange-300" />
            <div className="absolute left-8 top-1 h-2 w-2 rounded-full bg-black" />
            <div className="absolute left-13 top-1 h-2 w-2 rounded-full bg-black" />
            <motion.div className="absolute left-1 top-7 h-2 w-8 origin-right rounded-full bg-red-500" animate={{ rotate: [-28, 18, -28] }} transition={{ duration: 0.45, repeat: Infinity }} />
            <motion.div className="absolute right-1 top-7 h-2 w-8 origin-left rounded-full bg-red-500" animate={{ rotate: [28, -18, 28] }} transition={{ duration: 0.45, repeat: Infinity }} />
            <div className="absolute -left-1 top-3 h-5 w-5 rounded-full border-4 border-red-500" />
            <div className="absolute -right-1 top-3 h-5 w-5 rounded-full border-4 border-red-500" />
            {[0, 1, 2].map((leg) => (
              <React.Fragment key={leg}>
                <motion.div className="absolute h-2 w-8 origin-right rounded-full bg-red-700" style={{ left: 8, top: 29 + leg * 5 }} animate={{ rotate: leg % 2 ? [18, -20, 18] : [-20, 18, -20] }} transition={{ duration: 0.38, repeat: Infinity }} />
                <motion.div className="absolute h-2 w-8 origin-left rounded-full bg-red-700" style={{ right: 8, top: 29 + leg * 5 }} animate={{ rotate: leg % 2 ? [-18, 20, -18] : [20, -18, 20] }} transition={{ duration: 0.38, repeat: Infinity }} />
              </React.Fragment>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}