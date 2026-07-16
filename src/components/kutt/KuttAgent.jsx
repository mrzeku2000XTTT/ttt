import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Loader2, Clapperboard, Check, Link2 } from "lucide-react";
import { runKuttOrchestrator } from "./kuttOrchestrator";

export default function KuttAgent({ assets, clips, setClips, addAssets }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "🎬 I'm your **Director** — I orchestrate a team of AI sub-agents:\n\n- 🔎 **Researcher** scans the web\n- 📝 **Scriptwriter** drafts scenes\n- 🎨 **Media Agents** generate video/images\n- ✂️ **Editor Agents** (up to 10) cut, split & layer in parallel\n- 📊 **Analyst** reviews viral potential\n- 🎯 **Hyperframes** add text overlays & animations\n\nDrop a **URL** or tell me what to make. I'll absorb your intent, plan the production, and dispatch my agents." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState([]);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, steps]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setBusy(true);
    setSteps([]);
    try {
      const result = await runKuttOrchestrator({
        input: text,
        assets,
        clips,
        addAssets,
        setClips,
        onStep: (s) => setSteps((prev) => {
          const i = prev.findIndex((p) => p.label === s.label);
          if (i >= 0) { const next = [...prev]; next[i] = s; return next; }
          return [...prev, s];
        }),
      });
      setMessages((m) => [...m, { role: "assistant", content: result.message }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", content: `⚠️ ${err.message}` }]);
    }
    setBusy(false);
  };

  return (
    <div className="h-full flex flex-col bg-black/50 border-l border-white/10">
      <div className="px-3 py-2 border-b border-white/10 flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center">
          <Clapperboard className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <span className="text-white font-black text-xs">DIRECTOR</span>
          <span className="text-white/30 text-[9px] ml-1.5 font-bold">orchestrator · sub-agents · hyperframes</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div className={`max-w-[92%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
              m.role === "user" ? "bg-cyan-500/20 border border-cyan-500/30 text-white" : "bg-white/5 border border-white/10 text-white/90"
            }`}>
              {m.role === "user"
                ? <p className="whitespace-pre-wrap">{m.content}</p>
                : <ReactMarkdown className="prose prose-invert prose-xs max-w-none [&_h2]:text-sm [&_h3]:text-xs [&_p]:my-1 [&_hr]:my-2">{m.content}</ReactMarkdown>}
            </div>
          </div>
        ))}

        {/* Soul steps */}
        {busy && steps.length > 0 && (
          <div className="bg-white/[0.03] border border-fuchsia-500/20 rounded-xl p-2.5 space-y-1.5">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px]">
                {s.status === "done"
                  ? <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  : <Loader2 className="w-3 h-3 text-fuchsia-400 animate-spin flex-shrink-0" />}
                {s.agent && <span className="px-1 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 text-[8px] font-bold uppercase flex-shrink-0">{s.agent}</span>}
                <span className={s.status === "done" ? "text-white/50" : "text-white font-bold"}>{s.label}</span>
              </div>
            ))}
          </div>
        )}
        {busy && steps.length === 0 && (
          <div className="flex items-center gap-2 text-white/40 text-[11px]"><Loader2 className="w-3 h-3 animate-spin" /> Director engaging…</div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-2.5 border-t border-white/10">
        <div className="flex items-end gap-1.5">
          <textarea
            data-agent-id="kutt-brain"
            aria-label="director"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Drop a URL or direct me…"
            rows={2}
            className="flex-1 bg-black/50 border border-white/10 focus:border-fuchsia-400/50 rounded-xl px-3 py-2 text-white text-xs outline-none resize-none placeholder:text-white/25"
          />
          <button
            data-agent-id="kutt-send"
            aria-label="Send"
            onClick={send}
            disabled={busy || !input.trim()}
            className="p-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 disabled:opacity-40 text-white shadow-lg shadow-fuchsia-500/20"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-white/20 text-[9px] mt-1 flex items-center gap-1"><Link2 className="w-2.5 h-2.5" /> URL → script → scenes → timeline, automatically</p>
      </div>
    </div>
  );
}