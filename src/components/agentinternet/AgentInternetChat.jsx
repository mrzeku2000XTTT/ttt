import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Send, Loader2, Check, CreditCard, Globe,
  FileText, Lock, Sparkles, Image as ImageIcon, Play, Shield, MessageSquare, Download, ExternalLink,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import OrganicOrb from "@/components/agentinternet/OrganicOrb";
import { SETTINGS } from "@/components/agentinternet/LandingSettings";
import ChatSessionsDrawer from "@/components/agentinternet/ChatSessionsDrawer";
import ChatWalletButton from "@/components/agentinternet/ChatWalletButton";
import ResultLightbox from "@/components/agentinternet/ResultLightbox";
import { generateWallet } from "@/lib/localKaspaWallet";
import { tryQuickAnswer } from "@/components/agentinternet/quickAnswer";
import { runAgent } from "@/components/agentinternet/agentRunner";
import { instantAck } from "@/components/agentinternet/instantAck";
import K6ixLaunchCard from "@/components/agentinternet/K6ixLaunchCard";
import MotionSpecPicker from "@/components/agentinternet/MotionSpecPicker";
import MotionSceneBoard from "@/components/agentinternet/MotionSceneBoard";
import { runMotionPipeline } from "@/components/agentinternet/motionPipeline";
import { isVideoRequest } from "@/components/agentinternet/videoSpec";
import AgentStepFeed from "@/components/agentinternet/AgentStepFeed";

const STORAGE_KEY = "ttt_ai_chats";
// commands that create a wallet locally (never touch the server)
const WALLET_CMD = /^(generate|create|make)\s+(me\s+)?(a\s+)?(mainnet\s+|testnet\s+)?wallet\b|^new wallet\b/i;

const SCHEMA = {
  type: "object",
  properties: {
    skill: { type: "string", description: "primary app/agent handling it" },
    agent: { type: "string", description: "lead sub-agent name" },
    ack: { type: "string", description: "one short sentence acknowledging the user's specific intent, referencing what they actually asked for" },
    plan: {
      type: "array",
      items: {
        type: "object",
        properties: { step: { type: "string" }, agent: { type: "string" } },
        required: ["step"],
      },
    },
    output: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["payment", "image", "site", "research", "video", "text", "escrow", "mint"] },
        title: { type: "string" },
        detail: { type: "string" },
        meta: { type: "object" },
      },
      required: ["type", "title", "detail"],
    },
  },
  required: ["skill", "plan", "output"],
};

function buildPrompt(command, settings, history) {
  const enabled = (p) => SETTINGS.filter((s) => s.key.startsWith(p) && settings[s.key]).map((s) => s.label);
  const agents = enabled("agent_");
  const apps = enabled("app_");
  const maxAgents = settings.max_100 ? 100 : settings.max_50 ? 50 : settings.max_10 ? 10 : 1;
  const moneyMode = settings.money_testnet ? "testnet" : settings.money_mainnet ? "mainnet" : "disabled";
  const autonomy = settings.auto_execute ? "execute without asking" : "plan only";

  const ctx = (history || []).slice(-6).map((m) =>
    m.role === "user" ? `User: ${m.text}` : `Assistant used ${m.skill || "KAI"} → ${m.output?.title || ""}`
  ).join("\n");

  return `You are KAI — the unified superagent at the center of the Agent Internet. You control up to ${maxAgents} sub-agents and ${apps.length} callable apps. You decide how many to call and in what order. You remember the full conversation history.

ACTIVE AGENTS: ${agents.join(", ") || "none"}
ENABLED APPS: ${apps.join(", ") || "none"}
MONEY MODE: ${moneyMode}
AUTONOMY: ${autonomy}

Respond as JSON matching the schema.
- ALWAYS set "ack" to a single short sentence confirming you understood the user's intent — reference their actual request specifically (never a generic "got it"). Example: user says "advertise kaspa.org" → ack "On it — I'll spin up a Kaspa.org ad campaign across our broadcast agents."
- If the user is asking a QUESTION or chatting (not commanding an app task), reply FAST: set plan = [] and output.type = "text", output.title = a short 2-4 word label, output.detail = a direct, concise, factual, conversational answer (1-3 sentences). Do NOT invent sub-agent steps or fake transactions for questions.
- If the user is commanding a real app task, set plan = ordered sub-agent calls (1-4 steps, only as many as needed) and produce a concrete, specific result:
Output = a concrete, simulated-but-specific result:
- payment: meta = { amount, address, txid, status }
- escrow: meta = { amount, address, status }
- mint: meta = { token_id, address, status }
- image: meta = { prompt }
- site: meta = { url }
- video: meta = { url, duration }
- research: meta = { points: [string, ...] }
- text: meta = {}

Be specific and confident. Invent realistic kaspa: addresses and txids for payment/escrow/mint.
CRITICAL: If the user asks to draw, sketch, paint, render, generate, or create any image/picture/visual/artwork, you MUST set output.type = "image" and put a VIVID, detailed visual prompt in output.meta.prompt (describe subject, style, lighting, mood, composition). Example: "draw me a cloud" → type "image", meta.prompt "a majestic fluffy cumulus cloud at golden hour, volumetric soft light, cinematic, hyper-detailed, warm color grading".
Use prior context to maintain continuity across the conversation.

${ctx ? `Conversation so far:\n${ctx}\n` : ""}
User command: "${command}"`;
}

function loadChats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function SkillBadge({ skill }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-cyan-400/30 bg-cyan-500/10 text-cyan-300 text-[9px] font-mono tracking-widest uppercase">
      <Sparkles className="w-2.5 h-2.5" /> {skill}
    </span>
  );
}

function PlanChecklist({ plan }) {
  return (
    <div className="space-y-1 mt-2">
      {plan.map((p, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.12 }}
          className="flex items-start gap-2"
        >
          <div className="mt-0.5 w-3.5 h-3.5 rounded-full bg-cyan-400/20 border border-cyan-400/50 flex items-center justify-center shrink-0">
            <Check className="w-2.5 h-2.5 text-cyan-300" />
          </div>
          <div className="text-[11px] leading-snug">
            <span className="text-white/85">{p.step}</span>
            {p.agent && <span className="text-white/40"> · {p.agent}</span>}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function WalletCard({ output }) {
  const meta = output?.meta || {};
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState("");
  const copy = (k, v) => {
    try { navigator.clipboard?.writeText(v); } catch {}
    setCopied(k);
    setTimeout(() => setCopied(""), 1500);
  };
  return (
    <div className="mt-3 rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/10 to-emerald-500/5 p-3">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-3.5 h-3.5 text-cyan-300" />
        <span className="text-white text-xs font-semibold">{output?.title || "Mainnet Wallet"}</span>
        <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-400/20 text-cyan-300 uppercase">local</span>
      </div>
      <div className="space-y-2 text-[10px] font-mono">
        <div>
          <div className="text-white/40">address</div>
          <button onClick={() => copy("address", meta.address)} className="text-cyan-300 break-all text-left hover:underline">{meta.address}</button>
        </div>
        <div>
          <div className="text-white/40 flex items-center justify-between">
            <span>private key</span>
            <button onClick={() => setRevealed((v) => !v)} className="text-cyan-300/80 hover:text-cyan-200">{revealed ? "hide" : "reveal"}</button>
          </div>
          <button onClick={() => copy("key", meta.privateKey)} className="text-white/80 break-all text-left hover:underline block">
            {revealed ? meta.privateKey : "•".repeat(52)}
          </button>
        </div>
        {copied && <div className="text-emerald-300 text-[9px]">copied {copied}</div>}
      </div>
      {output?.detail && <p className="text-[9px] text-white/40 mt-2 leading-snug">{output.detail}</p>}
    </div>
  );
}

function OutputCard({ output, image, generating, genFailed, onOpen }) {
  if (!output) return null;
  const { type, title, detail, meta } = output;

  if (type === "wallet") return <WalletCard output={output} />;
  // video/motion never renders here — it hands off to the K6ix launcher in-chat
  if (type === "k6ix") return <K6ixLaunchCard output={output} />;

  const openable = image || meta?.url;

  if (type === "payment" || type === "escrow") {
    const Icon = type === "escrow" ? Lock : CreditCard;
    return (
      <div className="mt-3 rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 p-3">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-3.5 h-3.5 text-emerald-300" />
          <span className="text-white text-xs font-semibold">{title}</span>
          <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300 uppercase">{meta?.status || "settled"}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
          <div><div className="text-white/40">amount</div><div className="text-white">{meta?.amount || "—"} KAS</div></div>
          <div><div className="text-white/40">type</div><div className="text-white uppercase">{type}</div></div>
          <div className="col-span-2"><div className="text-white/40">to</div><div className="text-emerald-300 truncate">{meta?.address || "—"}</div></div>
          <div className="col-span-2"><div className="text-white/40">txid</div><div className="text-white/70 truncate">{meta?.txid || "—"}</div></div>
        </div>
      </div>
    );
  }

  if (type === "mint") {
    return (
      <div className="mt-3 rounded-2xl border border-violet-400/20 bg-violet-500/10 p-3">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-3.5 h-3.5 text-violet-300" />
          <span className="text-white text-xs font-semibold">{title}</span>
          <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-violet-400/20 text-violet-300 uppercase">minted</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
          <div><div className="text-white/40">token</div><div className="text-white">{meta?.token_id || "—"}</div></div>
          <div><div className="text-white/40">owner</div><div className="text-violet-300 truncate">{meta?.address || "—"}</div></div>
        </div>
      </div>
    );
  }

  if (type === "image") {
    return (
      <div className="mt-3 rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
        <button
          type="button"
          disabled={!image || generating}
          onClick={() => onOpen?.({ type, title, detail, image })}
          className="block w-full text-left aspect-video relative flex items-center justify-center bg-gradient-to-br from-fuchsia-500/20 via-violet-500/10 to-cyan-500/20 group disabled:cursor-default"
        >
          {generating ? (
            <div className="flex flex-col items-center gap-2 text-white/50 text-[10px] font-mono">
              <Loader2 className="w-5 h-5 animate-spin text-violet-300" />
              generating visual…
            </div>
          ) : image ? (
            <>
              <img src={image} alt={title} className="w-full h-full object-cover" />
              <span className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-1.5 text-white text-[10px] font-mono opacity-0 group-hover:opacity-100">
                <ExternalLink className="w-3.5 h-3.5" /> tap to view & save
              </span>
            </>
          ) : genFailed ? (
            <div className="text-center px-4">
              <div className="text-white/40 text-[10px] font-mono">visual unavailable</div>
              <div className="text-white/30 text-[9px] font-mono mt-1 line-clamp-2">{meta?.prompt || detail}</div>
            </div>
          ) : (
            <OrganicOrb size={64} colors={["#ec4899", "#a855f7", "#22d3ee"]} />
          )}
        </button>
        <div className="p-3 flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <ImageIcon className="w-3.5 h-3.5 text-violet-300" />
              <span className="text-white text-xs font-semibold">{title}</span>
            </div>
            <p className="text-[10px] text-white/55 leading-relaxed">{detail}</p>
          </div>
          {image && (
            <button
              type="button"
              onClick={() => onOpen?.({ type, title, detail, image })}
              className="shrink-0 flex items-center gap-1 px-2.5 h-7 rounded-full bg-cyan-400/15 border border-cyan-400/30 text-cyan-300 text-[9px] font-mono uppercase tracking-wider hover:bg-cyan-400/25 transition-colors"
            >
              <Download className="w-3 h-3" /> save
            </button>
          )}
        </div>
      </div>
    );
  }

  if (type === "site") {
    return (
      <a
        href={meta?.url || "#"}
        target="_blank"
        rel="noreferrer"
        className="block mt-3 rounded-2xl border border-white/10 bg-black/40 overflow-hidden hover:border-cyan-400/40 transition-colors"
      >
        <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border-b border-white/10">
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-red-400/60" />
            <span className="w-2 h-2 rounded-full bg-yellow-400/60" />
            <span className="w-2 h-2 rounded-full bg-green-400/60" />
          </div>
          <span className="text-[9px] font-mono text-white/40 truncate">{meta?.url || "deployed.ttt.ai"}</span>
        </div>
        <div className="h-24 bg-gradient-to-br from-cyan-500/15 via-violet-500/10 to-transparent flex items-center justify-center">
          <Globe className="w-6 h-6 text-cyan-300/40" />
        </div>
        <div className="p-3">
          <span className="text-white text-xs font-semibold">{title}</span>
          <p className="text-[10px] text-white/55 mt-0.5">{detail}</p>
        </div>
      </a>
    );
  }

  if (type === "video") {
    return (
      <a
        href={meta?.url || "#"}
        target="_blank"
        rel="noreferrer"
        className="block mt-3 rounded-2xl border border-white/10 bg-black/40 overflow-hidden hover:border-rose-400/40 transition-colors"
      >
        <div className="aspect-video relative flex items-center justify-center bg-gradient-to-br from-rose-500/20 to-orange-500/10">
          <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="w-4 h-4 text-black ml-0.5" />
          </div>
          <span className="absolute bottom-2 right-2 text-[9px] font-mono bg-black/60 px-1.5 py-0.5 rounded text-white/70">{meta?.duration || "0:08"}</span>
        </div>
        <div className="p-3">
          <span className="text-white text-xs font-semibold">{title}</span>
          <p className="text-[10px] text-white/55 mt-0.5">{detail}</p>
        </div>
      </a>
    );
  }

  if (type === "research") {
    return (
      <div className="mt-3 rounded-2xl border border-white/10 bg-black/40 p-3">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-3.5 h-3.5 text-cyan-300" />
          <span className="text-white text-xs font-semibold">{title}</span>
        </div>
        <ul className="space-y-1.5">
          {(meta?.points || []).map((pt, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px] text-white/70 leading-snug">
              <span className="text-cyan-400 mt-1">•</span>{pt}
            </li>
          ))}
        </ul>
        {detail && <p className="text-[10px] text-white/45 mt-2">{detail}</p>}
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-2xl border border-white/10 bg-black/40 p-3">
      <span className="text-white text-xs font-semibold">{title}</span>
      <p className="text-[11px] text-white/65 mt-1 leading-relaxed">{detail}</p>
    </div>
  );
}

function Message({ msg, onOpen, onMotion }) {
  if (msg.role === "user") {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
        <div className="max-w-[80%] px-3.5 py-2.5 rounded-2xl rounded-br-md bg-cyan-400 text-black text-sm font-medium">
          {msg.text}
        </div>
      </motion.div>
    );
  }
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5">
      <div className="shrink-0 mt-0.5">
        <OrganicOrb size={28} colors={["#67e8f9", "#22d3ee", "#6366f1"]} />
      </div>
      <div className="min-w-0 flex-1">
        {msg.loading && !msg.ack && !msg.steps?.length ? (
          <div className="flex items-center gap-2 text-white/55 text-xs font-mono py-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            orchestrating sub-agents…
          </div>
        ) : (
          <>
            {msg.ack && (
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-white/80 text-sm font-medium leading-snug">{msg.ack}</span>
              </div>
            )}
            {msg.loading && (
              <div className="flex items-center gap-2 text-white/55 text-xs font-mono py-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                orchestrating sub-agents…
              </div>
            )}
            {!msg.loading && msg.skill && <SkillBadge skill={msg.skill} />}
            {msg.motion?.stage === "spec" && <MotionSpecPicker text={msg.motion.text} onRun={onMotion} />}
            {msg.motion && msg.motion.stage !== "spec" && <MotionSceneBoard motion={msg.motion} onOpen={onOpen} />}
            {msg.steps?.length > 0 && <AgentStepFeed steps={msg.steps} onOpen={onOpen} />}
            {!msg.loading && msg.plan?.length > 0 && <PlanChecklist plan={msg.plan} />}
            {!msg.loading && (
              <OutputCard output={msg.output} image={msg.image} generating={msg.genLoading} genFailed={msg.genFailed} onOpen={onOpen} />
            )}
            {!msg.loading && msg.question && (
              <div className="mt-2 text-[11px] text-cyan-200/90 leading-snug border-l-2 border-cyan-400/40 pl-2">
                {msg.question}
              </div>
            )}
            {msg.error && <div className="text-red-400 text-[10px] font-mono mt-2">router error — retry</div>}
          </>
        )}
      </div>
    </motion.div>
  );
}

export default function AgentInternetChat({ open, initialCommand, settings, onClose }) {
  const [chats, setChats] = useState(loadChats);
  const [activeId, setActiveId] = useState(() => loadChats()[0]?.id || null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const scrollRef = useRef(null);
  const chatsRef = useRef(chats);
  const sentRef = useRef(false);

  useEffect(() => { chatsRef.current = chats; }, [chats]);

  // persist
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(chats)); } catch {}
  }, [chats]);

  const activeChat = chats.find((c) => c.id === activeId);
  const messages = activeChat?.messages || [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const createChat = (title = "New chat") => {
    const id = `c${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const chat = { id, title, createdAt: Date.now(), messages: [] };
    setChats((prev) => [...prev, chat]);
    return id;
  };

  const newChat = () => {
    const id = createChat();
    setActiveId(id);
    setShowSessions(false);
    setInput("");
    sentRef.current = true; // don't auto-send a landing command into the blank chat
  };

  const selectChat = (id) => {
    setActiveId(id);
    setShowSessions(false);
  };

  const deleteChat = (id) => {
    setChats((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (id === activeId) setActiveId(next[0]?.id || null);
      return next;
    });
  };

  const patchMsg = (chatId, msgId, update) =>
    setChats((prev) => prev.map((c) =>
      c.id === chatId ? { ...c, messages: c.messages.map((m) => m.id === msgId ? { ...m, ...update } : m) } : c
    ));

  // Real motion run: scrape the site, research it live, write the scenes,
  // render a saveable still for each. No orchestration theatre.
  const runMotion = async (msgId, chatId, text, spec) => {
    patchMsg(chatId, msgId, { motion: { stage: "run", spec, text, progress: "reading the site" } });
    try {
      const res = await runMotionPipeline({
        text,
        spec,
        onProgress: (progress) => patchMsg(chatId, msgId, { motion: { stage: "run", spec, text, progress } }),
      });
      patchMsg(chatId, msgId, { motion: { stage: "done", spec, text, ...res } });
    } catch {
      patchMsg(chatId, msgId, { motion: { stage: "error", spec, text } });
    }
  };

  const send = async (text, chatId) => {
    if (!text.trim() || sending) return;

    const uid = `u${Date.now()}`;
    const aid = `a${Date.now()}`;

    // Local-only wallet generation — private key never leaves the device
    if (WALLET_CMD.test(text.trim())) {
      setSending(true);
      setChats((prev) => prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              title: (c.title === "New chat" || !c.title) ? text.slice(0, 42) : c.title,
              messages: [...c.messages, { id: uid, role: "user", text: text.trim() }, { id: aid, role: "assistant", loading: true }],
            }
          : c
      ));
      try {
        const w = await generateWallet();
        setChats((prev) => prev.map((c) => c.id === chatId
          ? { ...c, messages: c.messages.map((m) => m.id === aid ? { ...m, loading: false, skill: "Wallet · local", output: { type: "wallet", title: "Mainnet Wallet Created", detail: "Generated entirely on this device — your private key never touched the server. Save it somewhere safe; clearing browser data will erase it.", meta: { address: w.address, privateKey: w.privateKey } } } : m) }
          : c));
      } catch {
        setChats((prev) => prev.map((c) => c.id === chatId ? { ...c, messages: c.messages.map((m) => m.id === aid ? { ...m, loading: false, error: true } : m) } : c));
      } finally { setSending(false); }
      return;
    }

    // Motion / video: straight to the spec picker, then the real pipeline.
    if (isVideoRequest(text)) {
      setChats((prev) => prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              title: (c.title === "New chat" || !c.title) ? text.slice(0, 42) : c.title,
              messages: [
                ...c.messages,
                { id: uid, role: "user", text: text.trim() },
                { id: aid, role: "assistant", loading: false, skill: "Motion · real assets", motion: { stage: "spec", text: text.trim() } },
              ],
            }
          : c
      ));
      return;
    }

    setSending(true);
    const hist = chatsRef.current.find((c) => c.id === chatId)?.messages || [];

    setChats((prev) => prev.map((c) =>
      c.id === chatId
        ? {
            ...c,
            title: (c.title === "New chat" || !c.title) ? text.slice(0, 42) : c.title,
            messages: [
              ...c.messages,
              { id: uid, role: "user", text: text.trim() },
              // ack is computed locally so it paints in the SAME frame as the user's message
              { id: aid, role: "assistant", loading: true, ack: instantAck(text) },
            ],
          }
        : c
    ));

    // The LLM then refines that acknowledgment in the background — the user is
    // never left staring at a spinner while it arrives.
    base44.integrations.Core.InvokeLLM({
      prompt: `A user just told a superagent: "${text}". Reply with ONE short sentence (max 14 words) acknowledging you understood and are on it — reference what they actually asked for. No quotes, no preamble, just the sentence. Example: user "advertise kaspa.org" → "On it — spinning up a Kaspa.org ad campaign now."`,
      model: "gemini_3_flash",
    }).then((r) => {
      const ackText = (typeof r === "string" ? r : "").trim();
      if (!ackText) return;
      setChats((prev) => prev.map((c) =>
        c.id === chatId ? { ...c, messages: c.messages.map((m) => (m.id === aid && m.loading) ? { ...m, ack: ackText } : m) } : c
      ));
    }).catch(() => {});

    // Fast lane: plain questions skip orchestration entirely and get an
    // internet-grounded answer straight away.
    try {
      const quick = await tryQuickAnswer(text, hist);
      if (quick) {
        setChats((prev) => prev.map((c) =>
          c.id === chatId
            ? { ...c, messages: c.messages.map((m) => m.id === aid ? { ...m, loading: false, ...quick } : m) }
            : c
        ));
        setSending(false);
        return;
      }
    } catch {}

    // Real multi-app run: plan → call our actual apps → narrate each step live
    try {
      const run = await runAgent({
        text,
        history: hist,
        onStep: (steps) => setChats((prev) => prev.map((c) =>
          c.id === chatId ? { ...c, messages: c.messages.map((m) => m.id === aid ? { ...m, steps } : m) } : c
        )),
      });
      if (run) {
        setChats((prev) => prev.map((c) =>
          c.id === chatId ? { ...c, messages: c.messages.map((m) => m.id === aid ? { ...m, loading: false, ...run } : m) } : c
        ));
        setSending(false);
        return;
      }
    } catch {}

    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildPrompt(text, settings, hist),
        response_json_schema: SCHEMA,
        model: "gemini_3_flash",
      });
      const data = typeof res === "string" ? JSON.parse(res) : res;
      // keep the instant ack if the orchestration didn't return one
      if (!data.ack) {
        setChats((prev) => prev.map((c) => c.id === chatId
          ? { ...c, messages: c.messages.map((m) => m.id === aid ? { ...m, ack: m.ack || "" } : m) }
          : c));
      }
      setChats((prev) => prev.map((c) =>
        c.id === chatId
          ? { ...c, messages: c.messages.map((m) => m.id === aid ? { ...m, loading: false, ...data } : m) }
          : c
      ));
      if (data.output?.type === "image") {
        const imgPrompt = data.output?.meta?.prompt || `${text}. ${data.output?.title || ""}. ${data.output?.detail || ""}`.trim();
        setChats((prev) => prev.map((c) =>
          c.id === chatId ? { ...c, messages: c.messages.map((m) => m.id === aid ? { ...m, genLoading: true } : m) } : c
        ));
        try {
          const r = await base44.integrations.Core.GenerateImage({ prompt: imgPrompt });
          setChats((prev) => prev.map((c) =>
            c.id === chatId ? { ...c, messages: c.messages.map((m) => m.id === aid ? { ...m, genLoading: false, image: r?.url } : m) } : c
          ));
        } catch {
          setChats((prev) => prev.map((c) =>
            c.id === chatId ? { ...c, messages: c.messages.map((m) => m.id === aid ? { ...m, genLoading: false, genFailed: true } : m) } : c
          ));
        }
      }
    } catch {
      setChats((prev) => prev.map((c) =>
        c.id === chatId ? { ...c, messages: c.messages.map((m) => m.id === aid ? { ...m, loading: false, error: true } : m) } : c
      ));
    } finally {
      setSending(false);
    }
  };

  // open: seed a new chat from the landing power input, else ensure one active chat.
  // single guarded init so we never create a competing blank chat over the seeded one.
  useEffect(() => {
    if (!open) { sentRef.current = false; return; }
    if (sentRef.current) return;
    sentRef.current = true;
    if (initialCommand) {
      const id = createChat(initialCommand.slice(0, 42));
      setActiveId(id);
      send(initialCommand, id);
    } else if (!activeId) {
      const id = createChat();
      setActiveId(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialCommand]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!activeId) return;
    send(input, activeId);
    setInput("");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 30, stiffness: 280 }}
          className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <ChatSessionsDrawer
            open={showSessions}
            onClose={() => setShowSessions(false)}
            chats={chats}
            activeId={activeId}
            onSelect={selectChat}
            onNew={newChat}
            onDelete={deleteChat}
          />

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/60 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSessions(true)}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                title="Chats"
              >
                <MessageSquare className="w-3.5 h-3.5 text-white/70" />
              </button>
              <button onClick={onClose} className="flex items-center gap-2 group" title="Back to landing">
                <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5 text-white/70" />
                </div>
                <div className="flex items-center gap-1.5">
                  <OrganicOrb size={18} colors={["#ffffff", "#22d3ee", "#6366f1"]} glow={false} />
                  <span className="font-heading font-black text-sm tracking-tight text-white">TTT</span>
                  <span className="font-mono text-[8px] tracking-[0.3em] uppercase text-cyan-300/80">A.I</span>
                </div>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 h-7 rounded-full border border-white/15 bg-black/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-mono tracking-widest uppercase text-white/50">Agent Internet</span>
              </div>
              <ChatWalletButton />
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4">
            <div className="max-w-2xl mx-auto space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-white/30 text-xs font-mono mt-10">
                  new chat — tell the superagent what to do
                </div>
              )}
              {messages.map((m) => (
                <Message
                  key={m.id}
                  msg={m}
                  onOpen={setLightbox}
                  onMotion={(spec) => runMotion(m.id, activeId, m.motion?.text || "", spec)}
                />
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-white/10 bg-black/60 backdrop-blur-xl">
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={activeId ? "tell the superagent what to do next…" : "start a new chat…"}
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                className="flex-1 h-11 px-4 rounded-2xl bg-black/60 border border-white/15 text-white text-sm font-mono outline-none focus:border-cyan-400/60 placeholder:text-white/30"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="w-11 h-11 rounded-2xl bg-cyan-400 text-black flex items-center justify-center disabled:opacity-30 enabled:hover:bg-cyan-300 transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          <ResultLightbox item={lightbox} onClose={() => setLightbox(null)} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}