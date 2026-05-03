import React, { useEffect, useRef, useState } from "react";
import { Send, Loader2, Volume2, MessageCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { LEARN_LANGUAGES, MULTILANG_FONT, speakText } from "./voxaLanguages";

const SCENARIOS = [
  { id: "intro", label: "Introducing Yourself", icon: "👋" },
  { id: "coffee", label: "Ordering Coffee", icon: "☕" },
  { id: "directions", label: "Asking Directions", icon: "🗺️" },
  { id: "shopping", label: "Shopping at a Market", icon: "🛍️" },
  { id: "hotel", label: "Checking Into a Hotel", icon: "🏨" },
  { id: "restaurant", label: "At a Restaurant", icon: "🍝" },
];

export default function ConversationMode({ language }) {
  const [scenario, setScenario] = useState(null);
  const [messages, setMessages] = useState([]); // { role, native, translation, pronunciation }
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const langName = LEARN_LANGUAGES.find((l) => l.code === language)?.name || language;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Open the scenario with an AI tutor greeting
  const startScenario = async (scn) => {
    setScenario(scn);
    setMessages([]);
    setSending(true);
    try {
      const r = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a friendly ${langName} tutor. The student wants to practice the scenario: "${scn.label}". Start the conversation in ${langName} with a natural opening line appropriate to that scenario. Keep it short (one sentence). Return:
- native: your line in ${langName}
- translation: English translation
- pronunciation: romanized pronunciation guide`,
        response_json_schema: {
          type: "object",
          properties: {
            native: { type: "string" },
            translation: { type: "string" },
            pronunciation: { type: "string" },
          },
        },
      });
      setMessages([{ role: "tutor", ...r }]);
    } catch {}
    setSending(false);
  };

  const send = async () => {
    if (!input.trim() || sending) return;
    const userMsg = { role: "user", native: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const history = next
        .map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.native}`)
        .join("\n");
      const r = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a friendly ${langName} tutor practicing the scenario "${scenario.label}" with a student. Conversation so far:

${history}

Reply ONLY in ${langName} with a natural, helpful next line (1-2 sentences). Stay in scenario. Return:
- native: your reply in ${langName}
- translation: English translation
- pronunciation: romanized pronunciation guide
- correction: if the student made a language mistake, gently correct them in English (else empty string)`,
        response_json_schema: {
          type: "object",
          properties: {
            native: { type: "string" },
            translation: { type: "string" },
            pronunciation: { type: "string" },
            correction: { type: "string" },
          },
        },
      });
      setMessages((p) => [...p, { role: "tutor", ...r }]);
    } catch {}
    setSending(false);
  };

  if (!scenario) {
    return (
      <div>
        <p className="text-white/50 text-sm mb-4">Pick a scenario to chat in {langName} with an AI tutor.</p>
        <div className="grid grid-cols-2 gap-3">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => startScenario(s)}
              className="p-4 rounded-2xl bg-white/8 backdrop-blur-2xl border border-white/15 text-left hover:bg-white/12 hover:scale-[1.02] transition-all"
            >
              <div className="text-2xl mb-2">{s.icon}</div>
              <p className="text-white font-semibold text-sm">{s.label}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => { setScenario(null); setMessages([]); }}
        className="text-white/60 hover:text-white text-xs"
      >
        ← Change scenario
      </button>

      <div className="flex items-center gap-2">
        <span className="text-2xl">{scenario.icon}</span>
        <div>
          <p className="text-white font-bold text-sm">{scenario.label}</p>
          <p className="text-white/40 text-[10px]">Practicing in {langName}</p>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 p-4 h-[420px] overflow-y-auto space-y-3"
      >
        {messages.length === 0 && !sending && (
          <div className="h-full flex items-center justify-center text-white/30 text-sm">
            <MessageCircle className="w-4 h-4 mr-2" /> Starting…
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                m.role === "user"
                  ? "bg-blue-500/30 border border-blue-400/40 text-white"
                  : "bg-white/10 border border-white/15 text-white"
              }`}
            >
              <p className="text-base leading-snug" style={{ fontFamily: MULTILANG_FONT }}>{m.native}</p>
              {m.role === "tutor" && (
                <>
                  {m.pronunciation && <p className="text-cyan-300/80 text-xs italic mt-1">{m.pronunciation}</p>}
                  {m.translation && <p className="text-white/50 text-xs mt-1">{m.translation}</p>}
                  {m.correction && (
                    <p className="text-amber-300/90 text-xs mt-2 pt-2 border-t border-white/10">
                      💡 {m.correction}
                    </p>
                  )}
                  <button
                    onClick={() => speakText(m.native, language)}
                    className="mt-2 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                  >
                    <Volume2 className="w-3 h-3 text-white" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-white/10 border border-white/15 rounded-2xl px-4 py-2.5 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 text-white/60 animate-spin" />
              <span className="text-white/60 text-xs">Tutor is typing…</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={`Reply in ${langName} (or English)…`}
          disabled={sending}
          className="flex-1 px-4 py-3 rounded-2xl bg-white/8 backdrop-blur-md border border-white/15 text-white text-sm outline-none focus:border-blue-400/50 placeholder:text-white/30"
          style={{ fontFamily: MULTILANG_FONT }}
        />
        <button
          onClick={send}
          disabled={sending || !input.trim()}
          className="w-11 h-11 rounded-2xl bg-blue-500 hover:bg-blue-600 disabled:opacity-30 flex items-center justify-center transition-colors"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}