import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Loader2, ArrowDown, Bot, User as UserIcon, Copy, Check, Zap, Monitor, MonitorOff, StopCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AgentComputer from "./AgentComputer";
import { runAutonomousAgent } from "./agentLoop";
import AgentStepLog from "./AgentStepLog";

const SUGGESTIONS = [
  { icon: "▶️", text: "Play this on TTTV: ", prefill: true },
  { icon: "🚀", text: "What apps can a TTT 3.0 agent connect to?" },
  { icon: "🧠", text: "Brainstorm 5 vision items for the agent internet" },
  { icon: "💸", text: "How would agent-to-agent KAS payments work?" },
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-1">
      {[0, 0.15, 0.3].map((d, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: d }}
          className="w-1.5 h-1.5 rounded-full bg-white/60"
        />
      ))}
    </div>
  );
}

function MessageBubble({ msg, isLast }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === "user";

  const copy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`group flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? "bg-white/10 ring-1 ring-white/20"
            : "bg-gradient-to-br from-cyan-400 via-violet-400 to-pink-400"
        }`}
      >
        {isUser ? (
          <UserIcon className="w-4 h-4 text-white/70" />
        ) : (
          <Sparkles className="w-4 h-4 text-black" />
        )}
      </div>

      {/* Bubble */}
      <div className={`flex flex-col gap-1 min-w-0 flex-1 max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-[14px] leading-relaxed whitespace-pre-wrap break-words ${
            isUser
              ? "bg-white text-black rounded-tr-md"
              : "bg-white/[0.06] text-white/90 ring-1 ring-white/10 rounded-tl-md backdrop-blur-sm"
          }`}
        >
          {msg.content || (isLast && <TypingDots />)}
        </div>
        {!isUser && msg.content && (
          <button
            onClick={copy}
            className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-white/40 hover:text-white/70 px-1"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function AgentChatGPT() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Agent Computer state
  const [computerOpen, setComputerOpen] = useState(false);
  const [computerUrl, setComputerUrl] = useState(null);
  const [computerStatus, setComputerStatus] = useState("Idle");
  const [computerNarrations, setComputerNarrations] = useState([]);
  const [computerCursor, setComputerCursor] = useState({ x: 50, y: 50, clicking: false });
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentSteps, setAgentSteps] = useState([]);
  const computerRef = useRef(null);
  const abortRef = useRef(null);

  // Detect if user message looks like a task the agent should DO (vs just chat)
  const isTaskGoal = (text) => {
    // Any URL → treat as task (user wants the agent to use it)
    if (/https?:\/\/\S+/i.test(text)) return true;
    // Action verbs
    return /\b(open|go to|navigate|post|send|tip|click|type|paste|search|find|browse|show me|take me|fill|submit|read|watch|play)\b/i.test(text);
  };

  const runAutonomousGoal = async (goal) => {
    if (!computerOpen) setComputerOpen(true);
    setAgentRunning(true);
    setAgentSteps([]);
    setComputerNarrations([]);

    abortRef.current = { aborted: false };

    await runAutonomousAgent({
      goal,
      signal: abortRef.current,
      callbacks: {
        setUrl: setComputerUrl,
        setStatus: setComputerStatus,
        addNarration: (text) => setComputerNarrations((prev) => [...prev, text]),
        setCursor: setComputerCursor,
        getIframe: () => computerRef.current?.getIframe(),
        onStep: (step) => setAgentSteps((prev) => [...prev, step]),
      },
    });

    setAgentRunning(false);
  };

  const stopAgent = () => {
    if (abortRef.current) abortRef.current.aborted = true;
    setAgentRunning(false);
    setComputerStatus("Stopped");
  };

  // Auto-scroll on new message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowScrollDown(scrollHeight - scrollTop - clientHeight > 100);
  };

  const send = async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    setMessages((m) => [...m, userMsg, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    // If user gave a task-like instruction, auto-open the computer and run autonomously
    if (isTaskGoal(text)) {
      if (!computerOpen) setComputerOpen(true);
      // Small delay so the iframe can mount before the loop starts
      setTimeout(() => runAutonomousGoal(text), computerOpen ? 0 : 600);
    }

    try {
      // Pull live registry context so the agent knows what apps exist
      let appsContext = "";
      try {
        const apps = await base44.entities.TTTAppRegistry.filter({ is_active: true }, "-created_date", 200);
        appsContext = apps
          .map((a) => `- ${a.app_name} (${a.category}): ${a.description || ""} [capabilities: ${(a.agent_capabilities || []).join(", ")}]`)
          .join("\n");
      } catch {}

      const history = [...messages, userMsg]
        .slice(-10)
        .map((m) => `${m.role === "user" ? "User" : "Agent"}: ${m.content}`)
        .join("\n\n");

      const reply = await base44.integrations.Core.InvokeLLM({
        prompt: `You are the TTT 3.0 Vision Agent — a sharp, futurist strategist for the TTT super-app on Kaspa (agent internet, ZK identity, autonomous agents, blockDAG).

You have direct access to ${appsContext.split("\n").length} connected apps in the TTT ecosystem. You can open, search, and invoke capabilities across all of them on the user's behalf.

## Connected apps (live registry)
${appsContext || "(loading…)"}

## Conversation
${history}

Reply directly, conversationally, and concisely (2-5 sentences usually, longer only when needed). Use markdown sparingly. Don't use stage directions or roleplay — just respond like ChatGPT. When the user asks about apps, reference real ones from the registry above.`,
      });

      const replyText = typeof reply === "string" ? reply : "Hmm, didn't get that. Try again?";

      // Stream-in effect: reveal char by char
      let i = 0;
      const total = replyText.length;
      const tick = () => {
        i = Math.min(i + Math.max(2, Math.floor(total / 60)), total);
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: replyText.slice(0, i) };
          return copy;
        });
        if (i < total) setTimeout(tick, 20);
        else setLoading(false);
      };
      setTimeout(tick, 100);
    } catch {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: "Hit a snag. Try again?" };
        return copy;
      });
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const empty = messages.length === 0;

  return (
    <section id="chat" className="relative py-32 px-5">
      <div className={`mx-auto transition-all ${computerOpen ? "max-w-7xl" : "max-w-3xl"}`}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
          <p className="text-[12px] font-semibold text-cyan-400 tracking-widest uppercase mb-3">Talk to the Agent</p>
          <h2 className="text-4xl sm:text-5xl font-[900] tracking-tight mb-3">Chat with TTT 3.0.</h2>
          <p className="text-white/50 text-sm max-w-md mx-auto">
            A direct line to the agent runtime. It can open any app, brainstorm, and reason about the ecosystem in real time.
          </p>
        </motion.div>

        {/* Toggle bar */}
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <span className="text-[11px] text-white/40">
            {computerOpen ? "Autonomous mode · agent observes & acts on its own" : "Phase 1 · Feed, Bridge, TTTV"}
          </span>
          <div className="flex items-center gap-2">
            {agentRunning && (
              <button
                onClick={stopAgent}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-red-500/20 text-red-300 ring-1 ring-red-400/30 hover:bg-red-500/30 transition-all"
              >
                <StopCircle className="w-3.5 h-3.5" /> Stop
              </button>
            )}
            <button
              onClick={() => setComputerOpen((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                computerOpen
                  ? "bg-gradient-to-r from-cyan-400 to-violet-400 text-black"
                  : "bg-white/5 text-white/60 ring-1 ring-white/10 hover:bg-white/10"
              }`}
            >
              {computerOpen ? <Monitor className="w-3.5 h-3.5" /> : <MonitorOff className="w-3.5 h-3.5" />}
              {computerOpen ? "Computer ON" : "Show Agent Computer"}
            </button>
          </div>
        </div>

        {/* Split: Chat + Computer */}
        <div className={`grid gap-4 ${computerOpen ? "lg:grid-cols-2" : "grid-cols-1"}`}>
        {/* Chat shell */}
        <div className="relative rounded-[28px] ring-1 ring-white/10 bg-zinc-950/60 backdrop-blur-2xl overflow-hidden flex flex-col h-[640px]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 via-violet-400 to-pink-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-black" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-zinc-950 animate-pulse" />
              </div>
              <div>
                <div className="text-white text-[13px] font-bold">Vision Agent</div>
                <div className="text-white/40 text-[10px]">Online · connected to ecosystem</div>
              </div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="text-[11px] text-white/40 hover:text-white/80 transition-colors"
              >
                New chat
              </button>
            )}
          </div>

          {/* Messages or empty state */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-5 py-6 space-y-5"
          >
            {empty ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <motion.div
                  animate={{ scale: [1, 1.05, 1], rotate: [0, 3, -3, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 via-violet-400 to-pink-400 flex items-center justify-center mb-5 shadow-[0_0_40px_rgba(167,139,250,0.4)]"
                >
                  <Sparkles className="w-7 h-7 text-black" />
                </motion.div>
                <h3 className="text-2xl font-[900] tracking-tight text-white mb-2">How can I help?</h3>
                <p className="text-white/40 text-sm mb-8 max-w-sm">
                  Ask about the agent internet, the connected apps, or vibe out a new vision for TTT 3.0.
                </p>
                <div className="grid sm:grid-cols-2 gap-2 w-full max-w-lg">
                  {SUGGESTIONS.map((s, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (s.prefill) {
                          setInput(s.text);
                          inputRef.current?.focus();
                        } else {
                          send(s.text);
                        }
                      }}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] ring-1 ring-white/10 hover:ring-white/20 text-left transition-all"
                    >
                      <span className="text-lg">{s.icon}</span>
                      <span className="text-[12px] text-white/70 leading-snug">{s.text}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((m, i) => (
                  <MessageBubble key={i} msg={m} isLast={i === messages.length - 1 && loading} />
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Scroll-to-bottom */}
          <AnimatePresence>
            {showScrollDown && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                onClick={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })}
                className="absolute bottom-24 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white/10 backdrop-blur-md ring-1 ring-white/20 flex items-center justify-center text-white/70 hover:bg-white/20"
              >
                <ArrowDown className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Input */}
          <div className="p-4 border-t border-white/5">
            <div className="relative flex items-end gap-2 bg-white/[0.05] rounded-3xl px-4 py-2.5 ring-1 ring-white/10 focus-within:ring-white/30 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Message TTT 3.0…"
                className="flex-1 bg-transparent text-white text-[14px] outline-none placeholder-white/30 resize-none max-h-32 py-1.5"
                style={{
                  minHeight: "24px",
                  height: "auto",
                  fontSize: "16px",
                }}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
                }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="flex-shrink-0 w-9 h-9 rounded-full bg-white text-black flex items-center justify-center disabled:opacity-20 disabled:bg-white/40 transition-all hover:scale-105 active:scale-95"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-2.5">
              <Zap className="w-3 h-3 text-white/30" />
              <p className="text-[10px] text-white/30">
                Live agent · connected to all TTT apps · responses can be wrong
              </p>
            </div>
          </div>
        </div>

        {/* Agent Computer */}
        <AnimatePresence>
          {computerOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
              className="h-[640px]"
            >
              <div className="h-full flex flex-col gap-2">
                <div className="flex-1 min-h-0">
                  <AgentComputer
                    ref={computerRef}
                    url={computerUrl}
                    status={computerStatus}
                    narrations={computerNarrations}
                    cursor={computerCursor}
                    isActive={agentRunning}
                  />
                </div>
                {(agentSteps.length > 0 || agentRunning) && (
                  <div className="rounded-2xl ring-1 ring-white/10 bg-zinc-950/80 backdrop-blur-xl overflow-hidden">
                    <AgentStepLog steps={agentSteps} running={agentRunning} />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </section>
  );
}