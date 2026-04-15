import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function IDEChatPanel({ messages, onSend, isLoading, suggestions }) {
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="h-full flex flex-col" style={{ background: "rgba(10,10,18,0.98)", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(6,182,212,0.2)" }}>
          <Bot className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <span className="text-sm font-bold text-white/90">KAI Agent</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(6,182,212,0.15)", color: "rgba(6,182,212,0.8)" }}>MCP</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-hide">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role !== "user" && (
              <div className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: "rgba(6,182,212,0.15)" }}>
                <Sparkles className="w-3 h-3 text-cyan-400" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-[12px] leading-relaxed ${
              msg.role === "user"
                ? "bg-cyan-500/20 text-white/90"
                : msg.role === "status"
                ? "bg-white/5 text-cyan-400/80 italic"
                : "bg-white/5 text-white/80"
            }`}>
              {msg.role === "assistant" ? (
                <ReactMarkdown className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 text-[12px]"
                  components={{
                    p: ({ children }) => <p className="my-1">{children}</p>,
                    code: ({ children }) => <code className="text-emerald-300 bg-black/30 px-1 rounded text-[11px]">{children}</code>,
                    strong: ({ children }) => <span className="text-white font-semibold">{children}</span>,
                  }}>
                  {msg.content}
                </ReactMarkdown>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2 items-center">
            <div className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center" style={{ background: "rgba(6,182,212,0.15)" }}>
              <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
            </div>
            <div className="text-[11px] text-cyan-400/60 animate-pulse">Generating code…</div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Suggestions (when no messages yet) */}
      {messages.length <= 1 && suggestions && (
        <div className="px-3 pb-2">
          <div className="text-[9px] font-bold text-white/20 uppercase tracking-wider mb-1.5">Try</div>
          <div className="flex flex-wrap gap-1">
            {suggestions.slice(0, 4).map((s, i) => (
              <button key={i} onClick={() => { setInput(s); }}
                className="px-2 py-1 rounded-md text-[10px] text-white/40 hover:text-white/70 transition-colors"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-3 pb-3 pt-2 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Describe what to build…"
            className="flex-1 bg-transparent text-white/90 outline-none placeholder-white/25 text-[13px]"
            style={{ fontSize: "16px" }}
          />
          <button onClick={handleSend} disabled={!input.trim() || isLoading}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-20"
            style={{ background: input.trim() && !isLoading ? "rgba(6,182,212,0.4)" : "transparent" }}>
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}