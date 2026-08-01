import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User as UserIcon, Loader2, MessageCircle, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { buildChatPrompt } from "@/lib/blogAi";

function llmText(res) {
  if (typeof res === "string") return res;
  return res?.response || res?.text || res?.data || (res ? JSON.stringify(res) : "");
}

export default function BlogChat({ blog }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, open]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const q = input.trim();
    const next = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        model: "claude_sonnet_4_6",
        prompt: buildChatPrompt(blog, next, q),
      });
      setMessages([...next, { role: "assistant", content: llmText(res) }]);
    } catch (e) {
      setMessages([...next, { role: "assistant", content: "Sorry, I couldn't answer that: " + e.message }]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 sm:bottom-6 sm:right-6 h-14 sm:h-auto sm:px-5 sm:py-3 rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 text-white shadow-xl shadow-violet-500/30 flex items-center justify-center gap-2 font-semibold active:scale-95 transition"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="hidden sm:inline text-sm">Ask AI about this</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 z-40 sm:bottom-6 sm:right-6 sm:rounded-2xl w-full sm:w-[400px] h-[72vh] sm:h-[520px] bg-white shadow-2xl ring-1 ring-zinc-200 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 text-white">
        <div className="flex items-center gap-2 min-w-0">
          <Bot className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-semibold truncate">Ask about this post</span>
        </div>
        <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white text-xl leading-none -mt-0.5">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-zinc-50">
        {messages.length === 0 && (
          <div className="text-center text-xs text-zinc-500 py-6 px-4 leading-relaxed">
            Ask anything about <span className="font-semibold">"{blog?.title}"</span> — the AI answers using the post's content.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-white ring-1 ring-zinc-200 flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-violet-500" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-[13px] leading-relaxed ${m.role === "user" ? "bg-zinc-900 text-white" : "bg-white ring-1 ring-zinc-200 text-zinc-800"}`}>
              <div className="whitespace-pre-wrap break-words">{m.content}</div>
            </div>
            {m.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-zinc-200 flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-3.5 h-3.5 text-zinc-700" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-white ring-1 ring-zinc-200 flex items-center justify-center">
              <Loader2 className="w-3.5 h-3.5 text-violet-500 animate-spin" />
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-zinc-200 bg-white flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={1}
          placeholder="Ask about this post…"
          className="resize-none text-[13px] max-h-28"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <Button onClick={send} disabled={loading || !input.trim()} className="bg-zinc-900 text-white">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}