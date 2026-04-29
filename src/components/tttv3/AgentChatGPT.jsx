import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Loader2, ArrowDown, Bot, User as UserIcon, Copy, Check, Zap, Monitor, MonitorOff, StopCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AgentComputer from "./AgentComputer";
import { runAutonomousAgent } from "./agentLoop";
import AgentStepLog from "./AgentStepLog";
import AgentReasoningBubble from "./AgentReasoningBubble";

const SUGGESTIONS = [
  { icon: "▶️", text: "Play this on TTTV: ", prefill: true },
  { icon: "⚡", text: "Open NODA and build a daily Kaspa briefing workflow" },
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
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${
          isUser
            ? "bg-white/10 ring-1 ring-white/20"
            : "ring-1 ring-white/20 bg-black"
        }`}
      >
        {isUser ? (
          <UserIcon className="w-4 h-4 text-white/70" />
        ) : (
          <img
            src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/4fb83b52e_generated_image.png"
            alt="Vision Agent"
            className="w-full h-full object-cover"
          />
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

  // Quick fallback: treat URLs as tasks even if the LLM mis-classifies
  const looksLikeTask = (text) => /https?:\/\/\S+/i.test(text);

  const runAutonomousGoal = async (goal) => {
    if (!computerOpen) setComputerOpen(true);
    setAgentRunning(true);
    setAgentSteps([]);
    setComputerNarrations([]);

    abortRef.current = { aborted: false };

    // Drop a "kickoff" reasoning bubble into chat so the user sees the sub-agent take over
    setMessages((m) => [
      ...m,
      {
        role: "reasoning",
        reasoning: {
          step: 0,
          say: `Spinning up sub-agent to: ${goal}`,
          status: "thinking",
        },
      },
    ]);

    await runAutonomousAgent({
      goal,
      signal: abortRef.current,
      callbacks: {
        setUrl: setComputerUrl,
        setStatus: setComputerStatus,
        addNarration: (text) => setComputerNarrations((prev) => [...prev, text]),
        setCursor: setComputerCursor,
        getIframe: () => computerRef.current?.getIframe(),
        onStep: (step) => {
          setAgentSteps((prev) => [...prev, step]);
          // Stream each sub-agent reasoning step into the chat as a live message
          setMessages((prev) => [
            ...prev,
            {
              role: "reasoning",
              reasoning: {
                step: step.step,
                thought: step.plan?.thought,
                say: step.plan?.say,
                action: step.plan?.action,
                status: step.plan?.done || step.plan?.action?.type === "finish" ? "done" : "thinking",
              },
            },
          ]);
        },
      },
    });

    // Final "done" bubble in chat
    setMessages((m) => [
      ...m,
      {
        role: "reasoning",
        reasoning: {
          step: "✓",
          say: "Sub-agent finished. Goal complete.",
          status: "done",
        },
      },
    ]);

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

      // ── TOOL DECISION: ask the LLM to both reply AND decide whether to launch the computer
      const decision = await base44.integrations.Core.InvokeLLM({
        prompt: `You are the TTT 3.0 Vision Agent — a sharp, futurist strategist for the TTT super-app on Kaspa.

You have TWO real tools you can use on every turn:

1. **reply** (always): a short, ChatGPT-style text reply (1-3 sentences) shown in chat.
2. **launch_computer** (optional): triggers the autonomous Agent Computer panel which navigates the live app, clicks buttons, types into inputs, and uses connected apps to ACHIEVE a goal. Use this whenever the user asks you to DO something inside the TTT ecosystem (open an app, post, send, build a workflow, play a video, navigate, paste a URL, automate, research live web, etc.).

When you launch_computer, you MUST set "goal" to a clear, specific instruction the autonomous agent can execute (rephrased from the user's request). Examples:
- User: "play this https://youtu.be/abc" → goal: "Open TTTV (/Browser), paste https://youtu.be/abc into the search input, and click play."
- User: "build a NODA workflow that emails me a daily Kaspa briefing" → goal: "Open NODA Studio, click Brain, type 'Write a daily Kaspa briefing and email it to me' into the Brain textarea, then click Build."
- User: "post a hello to TTT" → goal: "Open the TTT Feed and create a post with the text 'hello'."
- User: "what's TTT 3.0?" → DO NOT launch (just reply).

## Connected apps (live registry)
${appsContext || "(loading…)"}

## Conversation
${history}

Decide now. Always include a reply. Only set launch=true when there is a real, executable task. The reply should naturally narrate what the computer is about to do (e.g. "On it — building that workflow in NODA now.") OR just chat if launch=false.

CRITICAL: NEVER say "I can't" or "you'll need to do it yourself". The computer can type, click, and navigate. If unsure whether to launch, prefer launching for any actionable verb (open / play / post / send / build / search / navigate / paste / automate / research).`,
        response_json_schema: {
          type: "object",
          properties: {
            reply: { type: "string", description: "Short conversational reply shown in chat" },
            launch: { type: "boolean", description: "Whether to trigger the autonomous Agent Computer" },
            goal: { type: "string", description: "Clear instruction for the autonomous agent (only when launch=true)" },
          },
          required: ["reply", "launch"],
        },
      });

      const replyText = (decision?.reply && typeof decision.reply === "string")
        ? decision.reply
        : "Hmm, didn't get that. Try again?";

      // Trigger the computer based on LLM decision (fallback to URL heuristic)
      const shouldLaunch = decision?.launch === true || looksLikeTask(text);
      if (shouldLaunch) {
        const goal = (decision?.goal && decision.goal.trim()) || text;
        if (!computerOpen) setComputerOpen(true);
        setTimeout(() => runAutonomousGoal(goal), computerOpen ? 0 : 600);
      }

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
    <section id="chat" className="relative py-16 sm:py-32 px-3 sm:px-5">
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
        <div className={`grid gap-3 sm:gap-4 ${computerOpen ? "lg:grid-cols-2" : "grid-cols-1"}`}>
        {/* Chat shell */}
        <div className="relative rounded-2xl sm:rounded-[28px] ring-1 ring-white/10 bg-zinc-950/60 backdrop-blur-2xl overflow-hidden flex flex-col h-[70vh] sm:h-[640px] min-h-[480px]">
          {/* Header */}
          <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/20 bg-black">
                  <img
                    src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/4fb83b52e_generated_image.png"
                    alt="Vision Agent"
                    className="w-full h-full object-cover"
                  />
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
            className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 sm:py-6 space-y-4 sm:space-y-5"
          >
            {empty ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <motion.div
                  animate={{ scale: [1, 1.05, 1], rotate: [0, 3, -3, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="w-16 h-16 rounded-2xl overflow-hidden ring-1 ring-white/20 mb-5 shadow-[0_0_40px_rgba(167,139,250,0.4)]"
                >
                  <img
                    src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/4fb83b52e_generated_image.png"
                    alt="Vision Agent"
                    className="w-full h-full object-cover"
                  />
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
                {messages.map((m, i) =>
                  m.role === "reasoning" ? (
                    <AgentReasoningBubble key={i} msg={m} />
                  ) : (
                    <MessageBubble key={i} msg={m} isLast={i === messages.length - 1 && loading} />
                  )
                )}
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
          <div className="p-2.5 sm:p-4 border-t border-white/5">
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
              className="h-[70vh] sm:h-[640px] min-h-[480px]"
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