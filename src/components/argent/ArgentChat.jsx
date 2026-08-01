import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

function CodeChip({ code, onUse }) {
  return (
    <div className="mt-2 rounded-lg border border-cyan-500/30 bg-black/40 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-cyan-500/10 border-b border-cyan-500/20">
        <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-wide">.ag</span>
        <button
          onClick={() => onUse(code)}
          className="text-[10px] font-semibold text-cyan-300 hover:text-cyan-200"
        >
          Load in preview →
        </button>
      </div>
      <pre className="p-3 text-[11px] leading-relaxed font-mono text-cyan-100 overflow-x-auto whitespace-pre-wrap">
{code}
      </pre>
    </div>
  );
}

export default function ArgentChat({ messages, onSend, loading, onUseCode }) {
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 py-10">
            <Bot className="w-8 h-8 text-cyan-400 mb-3" />
            <p className="text-sm text-white/70 max-w-xs">
              Ask me to build a Kaspa covenant — e.g. "mint a transferable .kas name" or "a ticketing app with refund".
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-cyan-300" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                m.role === "user"
                  ? "bg-cyan-500 text-black"
                  : "bg-white/5 text-white/90 border border-white/10"
              }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
              {m.codeBlocks?.map((c, j) => (
                <CodeChip key={j} code={c.code} onUse={onUseCode} />
              ))}
            </div>
            {m.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <UserIcon className="w-4 h-4 text-white/80" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-cyan-300 animate-pulse" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/60">
              <span className="inline-flex gap-1">
                <span className="animate-bounce" style={{ animationDelay: "0ms" }}>·</span>
                <span className="animate-bounce" style={{ animationDelay: "120ms" }}>·</span>
                <span className="animate-bounce" style={{ animationDelay: "240ms" }}>·</span>
              </span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe the covenant you want…"
          rows={2}
          className="resize-none text-sm bg-black/40 border-white/10 text-white placeholder:text-white/40"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <Button type="submit" disabled={loading || !input.trim()} className="bg-cyan-500 hover:bg-cyan-400 text-black">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}