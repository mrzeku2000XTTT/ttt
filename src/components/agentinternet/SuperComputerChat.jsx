import React, { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Cpu,
  Plus,
  ExternalLink,
  ChevronLeft,
  Sparkles,
  Loader2
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { APPS } from "@/components/appstore2/appCatalog";
import OrganicOrb from "@/components/agentinternet/OrganicOrb";

const CHAT_KEY = "ttt_super_chat_v1";

// The full TTT app suite — the supercomputer's backend tool registry
const APP_REGISTRY = APPS
  .map((a) => `- ${a.name} [${a.cat}]${a.path ? "" : " (external site)"}: ${a.desc}`)
  .join("\n");

const SYSTEM_PROMPT = `You are TTT SUPER — the TTT supercomputer. You are not a chatbot: you command the entire TTT app suite as your backend. You compete with the top frontier models by orchestrating dozens of specialized apps in the right order.

Your installed apps (name [category]: what it does):
${APP_REGISTRY}

Rules:
- If the user is asking a question or having a conversation, answer directly in "reply" with no app_calls.
- If the task needs real work (generate a video, build a plan, mint a token, analyze media, write copy, edit, research, etc.), dispatch it to the best app(s) via "app_calls". "name" must match an installed app name EXACTLY.
- For big tasks, chain multiple apps in execution order (e.g. research with Sky → script with NICHE Studio → render with FrameZ → thumbnail with Thumbnail Creator).
- "reason": one short line on why this app. "brief": the exact prompt/instruction to run in that app.
- "reply": first person, confident, brief and premium. Explain what you're dispatching and in what order. Never say you're a language model. Never apologize.`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string" },
    app_calls: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          reason: { type: "string" },
          brief: { type: "string" }
        },
        required: ["name", "reason"]
      }
    }
  },
  required: ["reply"]
};

const SUGGESTIONS = [
  "Plan a full marketing campaign for my Kaspa token, then make the launch video",
  "Build me a workout plan, meal plan and budget for this month",
  "Research the crypto market and turn the best story into a viral explainer",
  "Clone this app UI and rebuild it as a TTT app"
];

const AppCallCard = ({ call, index }) => {
  const app = APPS.find((a) => a.name.toLowerCase() === call.name.toLowerCase());
  const url = app ? (app.path ? `/${app.path}` : app.externalUrl) : null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-white/25 transition-colors"
    >
      <div className="flex items-start gap-3">
        {app?.logo ? (
          <img src={app.logo} alt="" className="w-9 h-9 rounded-xl object-cover border border-white/10" />
        ) : (
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-white/50" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">{app?.name || call.name}</span>
            <span className="text-[9px] font-mono tracking-widest uppercase text-white/40 border border-white/10 rounded-full px-2 py-0.5">
              {app?.cat || "app"}
            </span>
          </div>
          {call.reason && <p className="mt-1 text-xs text-white/55">{call.reason}</p>}
          {call.brief && (
            <p className="mt-2 text-[11px] leading-relaxed text-white/40 border-l border-white/15 pl-3 whitespace-pre-wrap">
              {call.brief}
            </p>
          )}
        </div>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white text-black text-[10px] font-mono tracking-widest uppercase hover:bg-white/85 transition-colors"
          >
            Run <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </motion.div>
  );
};

export default function SuperComputerChat({ onExit }) {
  const [messages, setMessages] = useState(() => {
    try {
      return (JSON.parse(localStorage.getItem(CHAT_KEY) || "[]") || []).filter((m) => m && m.role && (m.text || m.calls?.length));
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);
  const taRef = useRef(null);

  useEffect(() => {
    try { localStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-40))); } catch {}
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const send = async (text) => {
    const prompt = (text ?? input).trim();
    if (!prompt || busy) return;
    setError("");
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";
    const history = [...messages, { role: "user", text: prompt }];
    setMessages(history);
    setBusy(true);
    try {
      const convo = history
        .slice(-12)
        .map((m) => `${m.role === "user" ? "User" : "TTT SUPER"}: ${m.text}`)
        .join("\n\n");
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM_PROMPT}\n\n--- Conversation so far ---\n${convo}`,
        response_json_schema: RESPONSE_SCHEMA,
        model: "gpt_5_4"
      });
      const data = typeof res === "string" ? JSON.parse(res) : res;
      const calls = Array.isArray(data?.app_calls)
        ? data.app_calls.filter((c) => c && c.name)
        : [];
      setMessages((m) => [
        ...m,
        { role: "assistant", text: data?.reply || "", calls }
      ]);
    } catch (e) {
      setError("The supercomputer hit a relay error — try again.");
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const newChat = () => {
    setMessages([]);
    setError("");
    setInput("");
  };

  const empty = !messages.length;

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col select-none">
      {/* Subtle premium vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,255,255,0.045), transparent 70%)" }}
      />

      {/* Header */}
      <header
        className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-white/[0.07]"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}
      >
        <div className="flex items-center gap-2.5">
          <OrganicOrb size={24} colors={["#ffffff", "#22d3ee", "#6366f1"]} />
          <div className="flex items-baseline gap-1.5">
            <span className="font-heading font-black text-lg tracking-tight">TTT</span>
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/50">SUPER</span>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 ml-2 px-2.5 h-6 rounded-full border border-white/10 bg-white/[0.03]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-mono tracking-widest uppercase text-white/50">{APPS.length} apps armed</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={newChat}
            title="New chat"
            className="w-9 h-9 flex items-center justify-center rounded-full border border-white/15 bg-black/70 backdrop-blur-xl text-white/70 hover:text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onExit}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-full border border-white/15 bg-black/70 backdrop-blur-xl text-[10px] font-mono tracking-widest uppercase text-white/70 hover:text-white hover:border-white/40 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Landing
          </button>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {empty ? (
            <div className="pt-[12vh] flex flex-col items-center text-center">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <h1 className="font-heading font-black tracking-[-0.03em] text-4xl sm:text-5xl">
                  <span className="bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">TTT SUPER</span>
                </h1>
                <p className="mt-3 text-sm text-white/50 max-w-md mx-auto leading-relaxed">
                  The supercomputer that fights the top models — every TTT app is its backend.
                  Ask anything, or dispatch work to any app in the suite.
                </p>
              </motion.div>
              <div className="mt-8 grid gap-2 w-full max-w-lg">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button
                    key={s}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.07 }}
                    onClick={() => send(s)}
                    className="text-left px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.02] text-xs sm:text-sm text-white/60 hover:text-white hover:border-white/30 transition-colors"
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={m.role === "user" ? "max-w-[85%]" : "w-full"}>
                  {m.role === "assistant" && (
                    <div className="flex items-center gap-1.5 mb-2 text-[9px] font-mono tracking-[0.25em] uppercase text-white/35">
                      <Sparkles className="w-3 h-3" /> TTT SUPER
                    </div>
                  )}
                  {m.text && (
                    <div
                      className={
                        m.role === "user"
                          ? "rounded-3xl rounded-br-lg px-4 py-3 bg-white/[0.07] border border-white/10 text-sm leading-relaxed"
                          : "text-sm sm:text-[15px] leading-relaxed text-white/85 [&_strong]:text-white [&_code]:text-cyan-300 [&_a]:text-cyan-300"
                      }
                    >
                      {m.role === "user" ? m.text : <ReactMarkdown>{m.text}</ReactMarkdown>}
                    </div>
                  )}
                  {m.role === "assistant" && m.calls?.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="text-[9px] font-mono tracking-[0.25em] uppercase text-white/35">
                        dispatching {m.calls.length} app{m.calls.length > 1 ? "s" : ""}
                      </div>
                      {m.calls.map((c, idx) => (
                        <AppCallCard key={idx} call={c} index={idx} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {busy && (
            <div className="flex items-center gap-3 text-white/50">
              <Loader2 className="w-4 h-4 animate-spin text-white/70" />
              <span className="text-xs font-mono tracking-widest uppercase">supercomputing…</span>
              <span className="flex gap-1">
                {[0, 1, 2].map((d) => (
                  <span key={d} className="w-1 h-1 rounded-full bg-white/50 animate-pulse" style={{ animationDelay: `${d * 0.2}s` }} />
                ))}
              </span>
            </div>
          )}
          {error && <div className="text-xs text-red-300/80 border border-red-500/30 rounded-xl px-3 py-2">{error}</div>}
        </div>
      </div>

      {/* Composer */}
      <div
        className="relative z-10 border-t border-white/[0.07] bg-black/60 backdrop-blur-xl"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4">
          <div className="flex items-end gap-2 rounded-3xl border border-white/12 bg-white/[0.03] px-4 py-2.5 focus-within:border-white/30 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <textarea
              ref={taRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Message the supercomputer — it can run any TTT app…"
              className="flex-1 bg-transparent border-0 outline-none resize-none text-sm text-white placeholder:text-white/30 py-1.5"
            />
            <button
              onClick={() => send()}
              disabled={busy || !input.trim()}
              className="shrink-0 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center disabled:opacity-20 transition-opacity"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-[9px] font-mono tracking-[0.2em] uppercase text-white/25">
            TTT SUPER · admin mode · {APPS.length} apps as backend
          </p>
        </div>
      </div>
    </div>
  );
}