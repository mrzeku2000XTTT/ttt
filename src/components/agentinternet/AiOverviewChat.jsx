import React, { useState } from "react";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";

/** Follow-up chat for the AI overview — every answer is grounded in live web
 *  results fetched at ask-time, with the sources shown inline. */
export default function AiOverviewChat({ query, overview }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([]);

  const ask = async (e) => {
    e?.preventDefault();
    const q = input.trim();
    if (!q || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setBusy(true);
    try {
      const raw = await base44.functions.invoke("openWebSearch", {
        query: `${q}${query ? ` ${query}` : ""} Kaspa`,
      });
      const res = raw?.data ?? raw;
      const sources = ((res?.success && res.results) || []).slice(0, 6);
      const live = sources
        .map((s, i) => `[${i + 1}] ${s.title} (${s.url})\n${s.snippet || ""}`)
        .join("\n\n");
      const llm = await base44.integrations.Core.InvokeLLM({
        prompt:
          `You are the Search Kaspa AI overview chat. Answer the user's follow-up question using the LIVE web results fetched seconds ago — report what the fresh data says and cite sources inline as [1], [2]. If the live results do not answer the question, say so plainly instead of guessing. Under 150 words.\n\n` +
          `TOPIC: ${query || "Kaspa"}\nEARLIER AI OVERVIEW: ${overview || "(none)"}\n\n` +
          `LIVE RESULTS:\n${live || "(no live results — say you could not fetch live data)"}\n\nQUESTION: ${q}`,
      });
      const answer = typeof llm === "string" ? llm : llm?.response || llm?.text || "";
      setMessages((m) => [...m, { role: "ai", text: answer || "No answer came back — try again.", sources }]);
    } catch {
      setMessages((m) => [...m, { role: "ai", text: "Live lookup failed — try again in a moment." }]);
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-cyan-300/80 hover:text-cyan-200 transition-colors"
      >
        <MessageSquare className="w-3 h-3" /> Chat with live data
      </button>
    );
  }

  return (
    <div className="mt-3 border-t border-cyan-500/15 pt-2.5">
      <div className="space-y-2.5 max-h-64 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i}>
            <div className={m.role === "user" ? "text-right" : "text-left"}>
              <p
                className={`inline-block text-[12px] leading-relaxed rounded-lg px-2.5 py-1.5 max-w-[92%] ${
                  m.role === "user" ? "bg-cyan-500/15 text-cyan-100" : "bg-white/[0.05] text-white/75"
                }`}
              >
                {m.text}
              </p>
            </div>
            {m.sources?.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                {m.sources.slice(0, 6).map((s, si) => (
                  <a
                    key={si}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-white/35 hover:text-cyan-300 truncate max-w-[160px]"
                  >
                    [{si + 1}] {s.host || s.title}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-1.5 text-[11px] text-white/40">
            <Loader2 className="w-3 h-3 animate-spin" /> fetching live data…
          </div>
        )}
      </div>
      <form onSubmit={ask} className="mt-2.5 flex items-center gap-1.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a follow-up — answered with live data…"
          maxLength={200}
          className="flex-1 bg-white/[0.05] border border-white/10 rounded-full px-3 h-9 text-[12px] text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-300/50 min-w-0"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="w-9 h-9 shrink-0 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 flex items-center justify-center hover:bg-cyan-500/25 disabled:opacity-40 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}