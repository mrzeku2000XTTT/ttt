import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * FrameZ chat — staged workflow:
 *  1. user sends prompt → agent plans the deck
 *  2. agent asks 1 clarifying question
 *  3. agent generates slides → calls onDeckGenerated(deck)
 */
export default function FrameZChat({ onDeckGenerated }) {
  const [messages, setMessages] = useState([
    {
      role: "agent",
      content: "Hey 👋 I'm FrameZ. Tell me what kind of deck you want to build — topic, audience, vibe.",
    },
  ]);
  const [input, setInput] = useState("");
  const [working, setWorking] = useState(false);
  const [stage, setStage] = useState("intake"); // intake → clarifying → generating → done
  const [planContext, setPlanContext] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, working]);

  const send = async () => {
    const text = input.trim();
    if (!text || working) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setWorking(true);

    try {
      if (stage === "intake") {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `You are FrameZ — a friendly AI deck builder. The user wants a deck about: "${text}".
Reply with ONE short clarifying question (under 20 words) to nail the vibe. No preamble.`,
        });
        const q = typeof res === "string" ? res : res?.text || "What's the main goal of this deck?";
        setPlanContext({ topic: text });
        setMessages((m) => [...m, { role: "agent", content: q.trim() }]);
        setStage("clarifying");
      } else if (stage === "clarifying") {
        setStage("generating");
        setMessages((m) => [...m, { role: "agent", content: "Got it — generating your deck now ✨", status: "generating" }]);
        const deck = await base44.integrations.Core.InvokeLLM({
          prompt: `Build a 6-slide deck. Topic: "${planContext?.topic}". Vibe/details: "${text}".
Return JSON only.`,
          response_json_schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              slides: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    heading: { type: "string" },
                    body: { type: "string" },
                  },
                  required: ["heading", "body"],
                },
              },
            },
            required: ["title", "slides"],
          },
        });
        setMessages((m) => [...m, { role: "agent", content: `✅ Done! "${deck.title}" — ${deck.slides?.length || 0} slides ready.` }]);
        setStage("done");
        onDeckGenerated?.(deck);
      } else {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `Continue helping the user refine their FrameZ deck. They said: "${text}". Reply briefly.`,
        });
        const reply = typeof res === "string" ? res : res?.text || "Tell me more.";
        setMessages((m) => [...m, { role: "agent", content: reply.trim() }]);
      }
    } catch (e) {
      setMessages((m) => [...m, { role: "agent", content: `⚠️ ${e.message || "Something went wrong"}` }]);
    } finally {
      setWorking(false);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-zinc-50">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} content={m.content} status={m.status} />
        ))}
        {working && (
          <div className="flex items-center gap-2 text-zinc-400 text-xs px-2">
            <Loader2 className="w-3 h-3 animate-spin" /> thinking…
          </div>
        )}
      </div>

      <div className="px-3 pb-3 pt-2 border-t border-zinc-200 bg-white">
        <div className="flex items-end gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2">
          <Sparkles className="w-4 h-4 text-zinc-400 mt-1.5" />
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Describe your deck…"
            rows={1}
            disabled={working}
            style={{ fontSize: "16px" }}
            className="flex-1 bg-transparent outline-none resize-none text-zinc-900 placeholder:text-zinc-400 max-h-24 py-1"
          />
          <button
            onClick={send}
            disabled={!input.trim() || working}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white transition-colors flex-shrink-0"
          >
            {working ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function Bubble({ role, content, status }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? "bg-zinc-900 text-white rounded-br-md"
            : "bg-white border border-zinc-200 text-zinc-800 rounded-bl-md"
        } ${status === "generating" ? "animate-pulse" : ""}`}
      >
        {content}
      </div>
    </div>
  );
}