import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";

const EVE_LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/220ffa959_generated_image.png";

const SYSTEM = `You are Eve, a warm and concise AI agent living inside the TTT decentralized app store.
You were inspired by Vercel's "eve" agent framework — durable, tool-using agents authored as a directory of instructions, tools, skills and channels — but you are our own original version, not Vercel's product.
You help users brainstorm agent ideas, explain Kaspa and the apps in this store, and you keep replies short, friendly and plain-spoken.
Never claim to be Vercel or to be hosted on Vercel. If asked to build or deploy an agent, describe the directory concept (instructions.md, tools/, skills/, channels/) in simple terms.`;

const SUGGESTIONS = [
  "What can you do, Eve?",
  "Explain the eve agent directory idea",
  "Brainstorm a Kaspa agent with me",
  "What apps are in this store?",
];

export default function EveChat() {
  const [messages, setMessages] = useState([
    { role: "eve", content: "Hi, I'm Eve. Ask me anything — or pick a prompt below to start." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  const send = async (text) => {
    const prompt = (text || input).trim();
    if (!prompt || loading) return;
    setInput("");
    const next = [...messages, { role: "user", content: prompt }];
    setMessages(next);
    setLoading(true);
    try {
      const history = next
        .map((m) => (m.role === "user" ? `User: ${m.content}` : `Eve: ${m.content}`))
        .join("\n");
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM}\n\nConversation so far:\n${history}\n\nEve:`,
      });
      const reply = typeof res === "string" ? res : res?.response || res?.text || JSON.stringify(res);
      setMessages((m) => [...m, { role: "eve", content: reply.trim() }]);
    } catch {
      setMessages((m) => [...m, { role: "eve", content: "I lost my train of thought — try that again?" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Thread */}
      <div
        ref={scrollRef}
        className="bg-white/80 backdrop-blur-xl rounded-[28px] ring-1 ring-zinc-200/70 shadow-[0_18px_50px_rgba(0,0,0,0.06)] h-[52vh] min-h-[320px] overflow-y-auto p-4 sm:p-5 space-y-3"
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2.5`}>
            {m.role === "eve" && (
              <img src={EVE_LOGO} alt="Eve" className="w-8 h-8 rounded-xl object-cover flex-shrink-0 mt-0.5" />
            )}
            <div
              className={`max-w-[80%] px-4 py-2.5 text-[14px] leading-relaxed rounded-2xl ${
                m.role === "user"
                  ? "bg-zinc-900 text-white rounded-br-md"
                  : "bg-[#F4F2F8] text-zinc-800 rounded-bl-md"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start gap-2.5">
            <img src={EVE_LOGO} alt="Eve" className="w-8 h-8 rounded-xl object-cover" />
            <div className="bg-[#F4F2F8] rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mt-3 justify-center">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-[12px] font-medium text-zinc-600 bg-white ring-1 ring-zinc-200/80 hover:ring-zinc-300 hover:text-zinc-900 rounded-full px-3.5 py-2 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="mt-3 flex items-center gap-2 bg-white ring-1 ring-zinc-200/80 rounded-full pl-4 pr-1.5 py-1.5 shadow-sm">
        <Sparkles className="w-4 h-4 text-[#7C5CFC] flex-shrink-0" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Talk to Eve…"
          className="flex-1 bg-transparent outline-none text-[14px] text-zinc-800 placeholder:text-zinc-400"
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF5A4E] to-[#E60023] text-white flex items-center justify-center disabled:opacity-40 shadow-md shadow-red-500/30 transition-transform active:scale-95"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}