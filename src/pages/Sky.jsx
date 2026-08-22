import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Cloud, Send, Loader2, Infinity as InfinityIcon, AlertTriangle, TrendingUp, ShieldCheck } from "lucide-react";
import SkyChatBubble from "@/components/sky/SkyChatBubble";
import SkyAgentCard from "@/components/sky/SkyAgentCard";
import { SKY_AGENT_TYPES, SKY_VERDICT_PROMPT } from "@/components/sky/skyPrompts";

const VERDICT_STYLE = {
  validated: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-400/30", label: "VALIDATED", icon: ShieldCheck },
  not_validated: { color: "text-rose-400", bg: "bg-rose-500/10 border-rose-400/30", label: "NOT VALIDATED", icon: AlertTriangle },
  mixed: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-400/30", label: "MIXED SIGNALS", icon: TrendingUp },
};

export default function Sky() {
  const [messages, setMessages] = useState([
    { role: "sky", text: "I'm Sky — your honest idea-validation cofounder. Tell me your app idea and I'll dispatch 4 research agents to find real web sources and decide if people actually want it. No limits. Real sources only." },
  ]);
  const [agents, setAgents] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [running, setRunning] = useState(false);
  const [input, setInput] = useState("");
  const [idea, setIdea] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, agents, verdict]);

  const runResearch = async (ideaText) => {
    setRunning(true);
    setVerdict(null);
    setExpanded(null);
    setAgents(SKY_AGENT_TYPES.map((a) => ({ ...a, status: "waiting", findings: [] })));
    setMessages((m) => [...m, { role: "sky", text: "Okay, let's research market demand. Dispatching 4 agents — each hunting real, cited web sources." }]);

    const results = await Promise.all(SKY_AGENT_TYPES.map(async (a, idx) => {
      setAgents((prev) => prev.map((x, i) => (i === idx ? { ...x, status: "gathering" } : x)));
      try {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: a.query(ideaText),
          add_context_from_internet: true,
          model: "gemini_3_flash",
          response_json_schema: {
            type: "object",
            properties: {
              findings: { type: "array", items: { type: "object", properties: {
                insight: { type: "string" }, evidence: { type: "string" },
                source_url: { type: "string" }, source_title: { type: "string" },
              } } },
              summary: { type: "string" },
            },
          },
        });
        const findings = res?.findings || [];
        setAgents((prev) => prev.map((x, i) => (i === idx ? { ...x, status: "done", findings } : x)));
        return { id: a.id, findings, summary: res?.summary || "" };
      } catch {
        setAgents((prev) => prev.map((x, i) => (i === idx ? { ...x, status: "error" } : x)));
        return { id: a.id, findings: [], error: true };
      }
    }));

    const valid = results.filter((r) => !r.error && r.findings.length);
    setMessages((m) => [...m, { role: "sky", text: "Agents reporting in. Weighing the evidence for a verdict…" }]);
    try {
      const v = await base44.integrations.Core.InvokeLLM({
        prompt: SKY_VERDICT_PROMPT(ideaText, valid),
        add_context_from_internet: true,
        model: "gemini_3_1_pro",
        response_json_schema: {
          type: "object",
          properties: {
            verdict: { type: "string" }, score: { type: "number" },
            headline: { type: "string" }, reasoning: { type: "string" },
            biggest_risk: { type: "string" }, biggest_opportunity: { type: "string" },
            recommendation: { type: "string" },
            top_sources: { type: "array", items: { type: "object", properties: {
              url: { type: "string" }, title: { type: "string" }, why: { type: "string" },
            } } },
          },
        },
      });
      setVerdict(v);
    } catch {
      setMessages((m) => [...m, { role: "sky", text: "I couldn't synthesize a verdict right now — try sending your idea again." }]);
    }
    setRunning(false);
  };

  const send = () => {
    const text = input.trim();
    if (!text || running) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setIdea(text);
    runResearch(text);
  };

  const vStyle = verdict ? VERDICT_STYLE[verdict.verdict] || VERDICT_STYLE.mixed : null;
  const VIcon = vStyle?.icon;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/AppStoreV2" className="flex items-center gap-2 text-white/40 hover:text-white text-sm">
            <ArrowLeft className="w-4 h-4" /> TTT
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <Cloud className="w-5 h-5 text-black" />
            </div>
            <span className="font-black tracking-tight">Sky</span>
          </div>
          <div className="flex items-center gap-1 h-7 px-2.5 rounded-full bg-cyan-500/15 border border-cyan-400/30">
            <InfinityIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-bold text-cyan-300 tracking-wider">NO LIMIT</span>
          </div>
        </div>
      </div>

      {/* Transcript */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto max-w-2xl w-full mx-auto px-4 py-5 space-y-4">
        {messages.map((m, i) => (
          <SkyChatBubble key={i} role={m.role}>{m.text}</SkyChatBubble>
        ))}

        {agents.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-1">
              {running ? "Waiting for agent reports…" : "Agent reports"}
            </div>
            {agents.map((a, i) => (
              <SkyAgentCard
                key={a.id}
                agent={a}
                expanded={expanded === i}
                onToggle={() => setExpanded(expanded === i ? null : i)}
              />
            ))}
          </div>
        )}

        {verdict && vStyle && (
          <div className={`rounded-2xl border p-4 ${vStyle.bg}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <VIcon className={`w-5 h-5 ${vStyle.color}`} />
                <span className={`text-xs font-black tracking-widest ${vStyle.color}`}>{vStyle.label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-black ${vStyle.color}`}>{verdict.score}</span>
                <span className="text-white/30 text-xs">/100</span>
              </div>
            </div>
            <p className="text-white font-bold text-sm mb-2">{verdict.headline}</p>
            <p className="text-white/70 text-xs leading-relaxed mb-3">{verdict.reasoning}</p>
            <div className="grid grid-cols-1 gap-2 mb-3">
              <div className="bg-black/30 rounded-lg p-2.5">
                <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-0.5">Biggest risk</p>
                <p className="text-xs text-white/80">{verdict.biggest_risk}</p>
              </div>
              <div className="bg-black/30 rounded-lg p-2.5">
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-0.5">Biggest opportunity</p>
                <p className="text-xs text-white/80">{verdict.biggest_opportunity}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] text-white/40 uppercase tracking-wider">Recommendation:</span>
              <span className={`text-xs font-bold ${vStyle.color}`}>{verdict.recommendation}</span>
            </div>
            {verdict.top_sources?.length > 0 && (
              <div className="border-t border-white/10 pt-2.5 space-y-1.5">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Top sources</p>
                {verdict.top_sources.map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noreferrer" className="block text-xs text-cyan-400 hover:underline truncate">
                    ↗ {s.title || s.url} <span className="text-white/40">— {s.why}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="sticky bottom-0 z-20 bg-black/80 backdrop-blur-xl border-t border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            rows={1}
            placeholder={running ? "Sky is researching…" : "Describe your app idea…"}
            disabled={running}
            className="flex-1 bg-white/[0.05] border border-white/10 rounded-2xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 resize-none max-h-32 disabled:opacity-50"
          />
          <button
            onClick={send}
            disabled={running || !input.trim()}
            className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center disabled:opacity-40 flex-shrink-0"
          >
            {running ? <Loader2 className="w-5 h-5 text-black animate-spin" /> : <Send className="w-5 h-5 text-black" />}
          </button>
        </div>
      </div>
    </div>
  );
}