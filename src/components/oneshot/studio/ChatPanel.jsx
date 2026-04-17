import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, FileCode } from "lucide-react";

export default function ChatPanel({ history, onSend, sending }) {
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, sending]);

  const submit = () => {
    const msg = input.trim();
    if (!msg || sending) return;
    onSend(msg);
    setInput("");
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950 border-t border-white/[0.05]">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.05]">
        <Sparkles className="w-3.5 h-3.5 text-violet-400" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-white/60">AI Chat</span>
        <span className="text-[10px] text-white/30 ml-auto">Claude Sonnet 4.6</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {history.length === 0 && (
          <div className="text-center py-8">
            <Sparkles className="w-8 h-8 text-violet-400/50 mx-auto mb-3" />
            <p className="text-white/40 text-sm mb-1">Chat with Claude to edit your project</p>
            <p className="text-white/25 text-[11px]">Try: "make the hero taller" or "add a pricing page"</p>
          </div>
        )}

        {history.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-[13px] ${
              msg.role === "user"
                ? "bg-violet-500/20 text-white border border-violet-500/30"
                : "bg-white/[0.04] text-white/80 border border-white/[0.07]"
            }`}>
              <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              {msg.files_changed && msg.files_changed.length > 0 && (
                <div className="mt-2 pt-2 border-t border-white/10 flex flex-wrap gap-1">
                  {msg.files_changed.map((f) => (
                    <span key={f} className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/15 text-emerald-300 rounded px-1.5 py-0.5 font-mono border border-emerald-500/20">
                      <FileCode className="w-2.5 h-2.5" />
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
              <span className="text-white/50 text-[12px]">Claude is editing…</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-white/[0.05]">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Ask Claude to edit, add, or refactor…"
            rows={2}
            disabled={sending}
            className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-white/30 outline-none focus:border-violet-400/50 resize-none disabled:opacity-50"
          />
          <button
            onClick={submit}
            disabled={!input.trim() || sending}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}