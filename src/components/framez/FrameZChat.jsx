import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Monitor, Paperclip, Square } from "lucide-react";
import { base44 } from "@/api/base44Client";

const AGENT_AVATAR = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/308d0a817_generated_image.png";
const DECK_REF_LABEL = "Quarterly Report - Indigo Dusk";

/**
 * FrameZ chat thread — exact recreation of the faces.app screenshot:
 *  - Right-aligned user bubble ("TTT")
 *  - Tiny deck-reference chip below user bubble
 *  - "Planned for X seconds" expandable agent step
 *  - Agent text bubble ("Before I start, I'd love to know...")
 *  - Q/A card with the agent's clarifying questions
 *  - "Creating pitch deck content" in-progress agent step with spinner
 *
 * On mount, runs an auto-demo: shows the planning step, types the intro,
 * reveals Q&A, then kicks off the "creating content" loader.
 */
export default function FrameZChat({ initialPrompt = "TTT" }) {
  const scrollRef = useRef(null);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState("idle"); // idle → planning → intro → questions → creating
  const [planSeconds, setPlanSeconds] = useState(0);
  const [creating, setCreating] = useState(false);

  // Auto-demo sequence — mirrors the screenshot's exact state.
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("planning"), 600);
    const t2 = setTimeout(() => setPhase("intro"), 1800);
    const t3 = setTimeout(() => setPhase("questions"), 3000);
    const t4 = setTimeout(() => { setPhase("creating"); setCreating(true); }, 4200);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, []);

  // Live "Planned for N seconds" counter
  useEffect(() => {
    if (phase === "idle") return;
    const t = setInterval(() => setPlanSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  // Auto-scroll to bottom when content grows
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [phase]);

  const handleSend = async () => {
    if (!input.trim() || creating) return;
    setCreating(true);
    try {
      // Real Claude call — uses your existing claudeCodeGen function so we don't
      // duplicate connector-backed work. Result is ignored in this demo screen.
      await base44.functions.invoke("claudeCodeGen", { prompt: input, mode: "deck" }).catch(() => {});
    } finally {
      setInput("");
      setCreating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Scrollable thread */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        style={{ scrollBehavior: "smooth" }}
      >
        {/* User bubble — top right */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col items-end gap-1.5"
        >
          <div className="px-4 py-2 bg-white border border-zinc-200 rounded-full shadow-sm">
            <span className="text-sm font-semibold text-zinc-900">{initialPrompt}</span>
          </div>
          <DeckRefChip label={DECK_REF_LABEL} />
        </motion.div>

        {/* Agent: "Planned for N seconds" */}
        <AnimatePresence>
          {phase !== "idle" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5"
            >
              <AgentDot />
              <button className="flex-1 flex items-center justify-between gap-2 px-4 py-2.5 bg-white border border-zinc-200 rounded-full shadow-sm hover:bg-zinc-50 transition-colors">
                <span className="flex items-center gap-2 text-sm">
                  <span className="text-zinc-400 text-xs italic">t<sub>3</sub></span>
                  <span className="font-semibold text-zinc-900">Planned for {planSeconds} seconds</span>
                </span>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Agent intro text */}
        <AnimatePresence>
          {(phase === "intro" || phase === "questions" || phase === "creating") && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-1"
            >
              <p className="text-[15px] leading-relaxed text-zinc-800">
                Before I start, I'd love to know a bit more about what you're going for.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Q&A card — right-aligned bubble like in the screenshot */}
        <AnimatePresence>
          {(phase === "questions" || phase === "creating") && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-end gap-1.5"
            >
              <div className="max-w-[88%] px-4 py-3.5 bg-white border border-zinc-200 rounded-2xl shadow-sm space-y-3">
                <div>
                  <p className="text-[13px] text-zinc-700">
                    <span className="font-bold">Q:</span> What is the main topic or purpose of your presentation?
                  </p>
                  <p className="text-[13px] text-zinc-700 mt-0.5">
                    <span className="font-bold">A:</span> A company pitch deck
                  </p>
                </div>
                <div>
                  <p className="text-[13px] text-zinc-700">
                    <span className="font-bold">Q:</span> What kind of interactive features would make this presentation memorable?
                  </p>
                  <p className="text-[13px] text-zinc-700 mt-0.5">
                    <span className="font-bold">A:</span> Hover-reveal galleries and interactive elements
                  </p>
                </div>
              </div>
              <DeckRefChip label={DECK_REF_LABEL} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Agent: "Creating pitch deck content" with live spinner */}
        <AnimatePresence>
          {phase === "creating" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5"
            >
              <AgentDot />
              <div className="flex-1 flex items-center justify-between gap-2 px-4 py-2.5 bg-white border border-zinc-200 rounded-full shadow-sm">
                <span className="flex items-center gap-2 text-sm">
                  <span className="text-zinc-400 text-xs italic">t<sub>3</sub></span>
                  <span className="font-semibold text-zinc-500">Creating pitch deck content</span>
                </span>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                  className="w-3.5 h-3.5"
                >
                  <img src={AGENT_AVATAR} alt="" className="w-full h-full" />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Composer */}
      <div className="px-3 pb-3 pt-1 bg-white">
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm p-3 space-y-2.5">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your idea here, add files, assets...."
            rows={2}
            className="w-full resize-none text-sm text-zinc-800 placeholder:text-zinc-400 outline-none bg-transparent"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <div className="flex items-center justify-between">
            <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-100 hover:bg-zinc-200 active:scale-95 transition-all">
              <Paperclip className="w-4 h-4 text-zinc-600" strokeWidth={2} />
            </button>
            <button
              onClick={handleSend}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-100 hover:bg-zinc-200 active:scale-95 transition-all"
              aria-label="Stop"
            >
              <Square className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeckRefChip({ label }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 rounded-md">
      <Monitor className="w-3 h-3 text-zinc-500" strokeWidth={2} />
      <span className="text-[11px] font-medium text-zinc-600">{label}</span>
    </div>
  );
}

function AgentDot() {
  return (
    <div className="w-7 h-7 flex-shrink-0 rounded-full bg-white border border-zinc-200 shadow-sm flex items-center justify-center mt-0.5">
      <img src={AGENT_AVATAR} alt="agent" className="w-5 h-5" />
    </div>
  );
}