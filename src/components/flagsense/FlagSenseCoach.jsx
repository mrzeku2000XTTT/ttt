import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, MessageCircleHeart } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STARTERS = [
  "I got angry because they didn't text me back.",
  "How do I bring up something that's bothering me?",
  "Why does silence bother me so much?",
];

const RULES = `You are the FlagSense coach — a warm, non-judgmental relationship reflection coach. STRICT RULES:
- Ask reflective questions; help the user notice their own patterns. Never diagnose people, never declare anyone "toxic", never tell the user what decision to make.
- Encourage empathy and healthier communication, but never help manipulate a partner.
- Never pretend to know the other person's intentions — offer possibilities, not verdicts.
- If the user describes abuse, threats, coercion, stalking, or violence, gently distinguish "safety concern" from ordinary conflict and encourage trusted people or local professional resources. Do not treat it as a quiz topic.
Keep every reply under 120 words, calm and human, ending with either one gentle question or one concrete suggestion.`;

/** Optional AI coach — reflects, never diagnoses. */
export default function FlagSenseCoach({ onClose }) {
  const [messages, setMessages] = useState([{ role: "coach", text: "Hey. I'm here to help you reflect — not to judge you or anyone else. What's on your mind?" }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || busy) return;
    setInput("");
    const next = [...messages, { role: "user", text: msg }];
    setMessages(next);
    setBusy(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `${RULES}\n\nConversation so far:\n${next.map((m) => `${m.role === "user" ? "User" : "Coach"}: ${m.text}`).join("\n")}\n\nCoach:`,
      });
      setMessages([...next, { role: "coach", text: typeof res === "string" ? res : res?.completion || "…" }]);
    } catch {
      setMessages([...next, { role: "coach", text: "I'm having trouble thinking right now — try me again in a moment." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flag-sense fixed inset-0 z-[360] flex flex-col bg-background">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col overflow-hidden px-6 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-secondary text-neutral-700">
              <MessageCircleHeart className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[15px] font-semibold leading-tight">Coach</p>
              <p className="text-[10.5px] text-neutral-500">Reflective, never judging</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close coach"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-neutral-500 hover:text-neutral-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-2.5 overflow-y-auto pb-4">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`max-w-[82%] rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed ${
                m.role === "user"
                  ? "ml-auto bg-neutral-900 text-white"
                  : "bg-card border border-black/[0.06] shadow-sm"
              }`}
            >
              {m.text}
            </motion.div>
          ))}
          {busy && (
            <div className="max-w-[60%] rounded-2xl border border-black/[0.06] bg-card px-4 py-3 shadow-sm">
              <span className="inline-flex gap-1">
                <Dot delay="0s" /><Dot delay="0.2s" /><Dot delay="0.4s" />
              </span>
            </div>
          )}
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-black/10 bg-white px-3.5 py-2 text-left text-[12px] font-medium text-neutral-600 hover:border-black/30"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-black/[0.06] py-4" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="What happened?"
            className="flex-1 rounded-full border border-black/10 bg-white px-5 py-3 text-[13.5px] outline-none placeholder:text-neutral-400 focus:border-neutral-400"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || busy}
            aria-label="Send"
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white transition-colors hover:bg-neutral-800 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Dot({ delay }) {
  return (
    <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: delay }} />
  );
}