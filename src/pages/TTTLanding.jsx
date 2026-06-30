import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { X, Send, ChevronDown, Lock, FlaskConical, Play, Pause, Music2, LayoutGrid, Users, Zap, MessageCircle, Search, Image as ImageIcon, Loader2, Sparkles, Monitor, MonitorOff, StopCircle, Bot } from "lucide-react";
import GrokChat from "@/components/landing/GrokChat";
import { createPageUrl } from "@/utils";
import AgentComputer from "@/components/tttv3/AgentComputer";
import { runAutonomousAgent } from "@/components/tttv3/agentLoop";
import AgentStepLog from "@/components/tttv3/AgentStepLog";
import AgentReasoningBubble from "@/components/tttv3/AgentReasoningBubble";
import AgentPlanChecklist from "@/components/tttv3/AgentPlanChecklist";

const ORB_IMAGE = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/4af893ff9_generated_image.png";
const CORNER_ART = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/8b62e8d8d_generated_image.png";
const YOUTUBE_VIDEO_ID = "aUSD-WFhKwY";

const SONG_LYRICS = [
  { line: "The dollar is dying, Bitcoin can't scale," },
  { line: "Gold is too heavy, Solana transactions fail." },
  { line: "I've tried them all and I must confess —" },
  { line: "Kaspa is the best money." },
  { line: "" },
  { line: "Bitcoin can't scale, Solana is down again," },
  { line: "Ethereum gas fees and scaling solutions went." },
  { line: "Shiny objects flash and making me sick," },
  { line: "Token unlocks flood — I burns out quick." },
  { line: "Markets pumping, dump it's a gambler's dream," },
  { line: "Whales are running like a whale of your machine." },
  { line: "Your favorite influencer's changing up the profile pic," },
  { line: "They say we're still early — better aping quick." },
  { line: "" },
  { line: "The dollar is dying, Bitcoin can't scale," },
  { line: "Gold is too heavy, Solana transactions fail." },
  { line: "I've tried them all and I must confess —" },
  { line: "Kaspa is the best money." },
  { line: "" },
  { line: "The speed blew my mind, scalability defined." },
  { line: "Kaspa is the future — leave the fiat life behind." },
  { line: "No CEO chains, no centralized control," },
  { line: "Digital freedom for everyone to hold." },
  { line: "" },
  { line: "The dollar is dying, Bitcoin can't scale," },
  { line: "Gold is too heavy, Solana transactions fail." },
  { line: "I've tried them all and I must confess —" },
  { line: "Kaspa is the best money." },
  { line: "" },
  { line: "Dollar is… dollar is… dollar is dying." },
];

const AI_MODELS = [
  { id: "claude_opus_4_8", label: "Claude Opus 4.8", maker: "Anthropic", color: "#c084fc" },
  { id: "claude_sonnet_4_6", label: "Claude Sonnet 4.6", maker: "Anthropic", color: "#a78bfa" },
  { id: "gpt_5_5", label: "GPT-5.5", maker: "OpenAI", color: "#6ee7b7" },
  { id: "gemini_3_flash", label: "Gemini 3 Flash", maker: "Google", color: "#93c5fd" },
];

// Top apps for the launcher
const FEATURED_APPS = [
  { name: "Feed", path: "Feed", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/fdf274d16_generated_image.png", desc: "Social feed" },
  { name: "Agent ZK", path: "AgentZK", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/3e49e39c2_image.png", desc: "Crypto ID" },
  { name: "TTTV", path: "Browser", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/f510ff896_generated_image.png", desc: "Video" },
  { name: "Terra", path: "Terra", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/02e4109c7_generated_image.png", desc: "Wallet" },
  { name: "Hikaru", path: "Hikaru", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/bf98870ab_generated_image.png", desc: "AI Images" },
  { name: "Zeku AI", path: "ZekuAI", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/ee7c7d611_generated_image.png", desc: "AI Chat" },
  { name: "Kine", path: "Kine", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/d4040c3da_generated_image.png", desc: "Video AI" },
  { name: "Bridge", path: "Bridge", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/1678c90a9_generated_image.png", desc: "Send KAS" },
  { name: "NODA", path: "NODA", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/4a4455642_generated_image.png", desc: "Workflows" },
  { name: "Motion", path: "Motion", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/81791a703_generated_image.png", desc: "Landing" },
  { name: "TRINITY", path: "Trinity", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/3e8b286e0_generated_image.png", desc: "3 Agents" },
  { name: "All Apps", path: "AppStoreV2", logo: null, desc: "Browse all" },
];

// XOR encryption utils
function encryptMessage(text, key = 42) {
  return btoa(text.split("").map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ ((key + i) % 127 || 1))).join(""));
}
function decryptMessage(encoded, key = 42) {
  try {
    const raw = atob(encoded);
    return raw.split("").map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ ((key + i) % 127 || 1))).join("");
  } catch { return "[decryption failed]"; }
}

const ENCRYPTED_MESSAGES_KEY = "orbt_encrypted_msgs";
function loadMessages() {
  try { return JSON.parse(localStorage.getItem(ENCRYPTED_MESSAGES_KEY) || "[]"); } catch { return []; }
}
function saveMessages(msgs) {
  try { localStorage.setItem(ENCRYPTED_MESSAGES_KEY, JSON.stringify(msgs.slice(-20))); } catch {}
}

// ── Main ZK Chat Panel — DeepSeek-style layout ──
const CHAT_SESSIONS_KEY = "zk_chat_sessions";
function loadSessions() {
  try { return JSON.parse(localStorage.getItem(CHAT_SESSIONS_KEY) || "[]"); } catch { return []; }
}
function saveSessions(s) {
  try { localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(s.slice(-50))); } catch {}
}

function ZKChatPanel({ onClose, minimized, onToggleMinimize }) {
  const [model, setModel] = useState(AI_MODELS[0]);
  const [showModels, setShowModels] = useState(false);
  const [sessions, setSessions] = useState(() => loadSessions());
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [activeTab, setActiveTab] = useState("chat"); // chat | apps | image
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState(null);
  const [appSearch, setAppSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  const bottomRef = useRef(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const newChat = () => {
    const id = Date.now().toString();
    const session = { id, title: "New chat", messages: [], ts: Date.now() };
    const updated = [session, ...sessions];
    setSessions(updated);
    saveSessions(updated);
    setActiveSessionId(id);
    setMessages([]);
  };

  const selectSession = (id) => {
    const s = sessions.find(s => s.id === id);
    if (s) { setActiveSessionId(id); setMessages(s.messages || []); }
  };

  const persistMessages = (id, msgs) => {
    setSessions(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, messages: msgs, title: msgs.find(m => m.role === "user")?.content?.slice(0, 30) || s.title } : s);
      saveSessions(updated);
      return updated;
    });
  };

  const deleteSession = (id, e) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    saveSessions(updated);
    if (activeSessionId === id) { setActiveSessionId(null); setMessages([]); }
  };

  const ALL_APPS = [
    { name: "Feed", path: "Feed", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/fdf274d16_generated_image.png", desc: "Social feed + KAS tips" },
    { name: "Agent ZK", path: "AgentZK", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/3e49e39c2_image.png", desc: "Crypto identity" },
    { name: "TTTV", path: "Browser", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/f510ff896_generated_image.png", desc: "Ad-free video browser" },
    { name: "Bridge", path: "Bridge", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/1678c90a9_generated_image.png", desc: "Send KAS cross-layer" },
    { name: "Hikaru", path: "Hikaru", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/bf98870ab_generated_image.png", desc: "AI image studio" },
    { name: "Zeku AI", path: "ZekuAI", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/ee7c7d611_generated_image.png", desc: "Premium AI assistant" },
    { name: "Terra", path: "Terra", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/02e4109c7_generated_image.png", desc: "Kaspa wallet manager" },
    { name: "Kine", path: "Kine", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/d4040c3da_generated_image.png", desc: "AI video agent" },
    { name: "NODA", path: "NODA", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/4a4455642_generated_image.png", desc: "Node-based AI workflows" },
    { name: "Motion", path: "Motion", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/81791a703_generated_image.png", desc: "Vibe-code landing pages" },
    { name: "TRINITY", path: "Trinity", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/3e8b286e0_generated_image.png", desc: "3 agents · 3 results · 1 prompt" },
    { name: "BeatCut", path: "BeatCut", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/80ea7b3ed_generated_image.png", desc: "AI beat-synced auto editor" },
    { name: "Doom", path: "Doom", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/da5ef69c7_generated_image.png", desc: "Doomscroll any topic" },
    { name: "APEX", path: "APEX", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/de2e1af61_generated_image.png", desc: "ZK proof" },
    { name: "KasFans", path: "KasFans", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/d6880fa0e_generated_image.png", desc: "Fan community" },
    { name: "Kasthletics", path: "Kasthletics", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/88f689596_generated_image.png", desc: "Proof-of-Workout" },
    { name: "Prompto", path: "Prompto", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/1994014c6_generated_image.png", desc: "Prompt engineering" },
    { name: "Thumbnail Creator", path: "ThumbnailCreator", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/6ac2ec072_generated_image.png", desc: "AI thumbnails" },
    { name: "Quick Storyboard", path: "QuickStoryboard", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/e83c9a29b_image.png", desc: "Idea to storyboard" },
    { name: "FrameZ", path: "FrameZ", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/b5a1b9a40_generated_image.png", desc: "AI interactive decks" },
    { name: "RMX Ultra", path: "RMX", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/f2f74ca6e_generated_image.png", desc: "Visual workflow automation" },
    { name: "ORBT", path: "ORBT", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/ecf033abc_generated_image.png", desc: "AI brand voice" },
    { name: "Security Audit", path: "SecurityAudit", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/48a7275db_generated_image.png", desc: "Audit your app" },
    { name: "SlideDeck", path: "SlideDeckBuilder", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/81791a703_generated_image.png", desc: "Slide deck builder" },
    { name: "DAG Feed", path: "DAGFeed", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/4a4455642_generated_image.png", desc: "Pay to publish" },
    { name: "Hire", path: "Hire", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/cc40dddaf_generated_image.png", desc: "Hire KAS talent" },
  ];

  const filteredApps = appSearch.trim()
    ? ALL_APPS.filter(a =>
        a.name.toLowerCase().includes(appSearch.toLowerCase()) ||
        a.desc.toLowerCase().includes(appSearch.toLowerCase())
      )
    : ALL_APPS;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const runAutonomousGoal = async (goal) => {
    if (!computerOpen) setComputerOpen(true);
    setAgentRunning(true);
    setAgentSteps([]);
    setComputerNarrations([]);
    abortRef.current = { aborted: false };

    setMessages(m => [...m, { role: "reasoning", reasoning: { step: 0, say: "Reading your prompt and building a plan…", status: "thinking" } }]);

    await runAutonomousAgent({
      goal,
      signal: abortRef.current,
      callbacks: {
        setUrl: setComputerUrl,
        setStatus: setComputerStatus,
        addNarration: (text) => setComputerNarrations(prev => [...prev, text]),
        setCursor: setComputerCursor,
        getIframe: () => computerRef.current?.getIframe(),
        onPlan: (plan) => {
          setMessages(prev => {
            const copy = [...prev];
            const idx = copy.findIndex(m => m.role === "reasoning" && m.reasoning?.step === 0);
            const planMsg = { role: "plan", plan };
            if (idx >= 0) copy[idx] = planMsg; else copy.push(planMsg);
            return copy;
          });
        },
        onPlanItemUpdate: (index, patch) => {
          setMessages(prev => {
            const copy = [...prev];
            const idx = copy.findIndex(m => m.role === "plan");
            if (idx >= 0) { const newPlan = [...copy[idx].plan]; newPlan[index] = { ...newPlan[index], ...patch }; copy[idx] = { ...copy[idx], plan: newPlan }; }
            return copy;
          });
        },
        onStep: (step) => setAgentSteps(prev => [...prev, step]),
      },
    });

    setMessages(m => [...m, { role: "reasoning", reasoning: { step: "✓", say: "All steps complete.", status: "done" } }]);
    setAgentRunning(false);
  };

  const stopAgent = () => {
    if (abortRef.current) abortRef.current.aborted = true;
    setAgentRunning(false);
    setComputerStatus("Stopped");
  };

  const looksLikeTask = (text) => /https?:\/\/\S+/i.test(text);

  const send = async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;
    let sessionId = activeSessionId;
    if (!sessionId) {
      const id = Date.now().toString();
      const session = { id, title: text.slice(0, 30), messages: [], ts: Date.now() };
      setSessions(prev => { const u = [session, ...prev]; saveSessions(u); return u; });
      setActiveSessionId(id);
      sessionId = id;
    }
    const userMsg = { role: "user", content: text };
    const nextMsgs = [...messages, userMsg, { role: "assistant", content: "" }];
    setMessages(nextMsgs);
    setInput("");
    setLoading(true);

    try {
      // Pull live registry context
      let appsContext = "";
      try {
        const apps = await base44.entities.TTTAppRegistry.filter({ is_active: true }, "-created_date", 200);
        appsContext = apps.map(a => `- ${a.app_name} (${a.category}): ${a.description || ""} [capabilities: ${(a.agent_capabilities || []).join(", ")}]`).join("\n");
      } catch {}

      const history = [...messages, userMsg].slice(-10).map(m => `${m.role === "user" ? "User" : "Agent"}: ${m.content}`).join("\n\n");

      const decision = await base44.integrations.Core.InvokeLLM({
        model: model.id,
        prompt: `You are ZK — TTT's PRIMARY AI agent and site expert. You have complete knowledge of every page, subpage, feature, and workflow across the entire TTT platform.

## YOUR ROLE
You can:
1. **Answer anything** about TTT — every page, feature, tool, and how to use it
2. **Guide users** to the right page instantly with exact routes
3. **Launch your Agent Computer** to autonomously navigate/click/type inside any TTT app
4. **Never say "I don't know"** — use your complete site map to always help

## COMPLETE TTT SITE MAP

### CORE
- / (Landing) — Main page, ZK chat, music, TAP/TO/TIP buttons
- /TTTGate — Portal gateway
- /AppStoreV2 — Full app store
- /About — About TTT, mission, tech
- /Docs — Developer docs
- /Portal — Hub

### SOCIAL & COMMUNITY
- /Feed — Social feed: posts, KAS tips, likes, comments, Kasware stamps
- /DAGFeed — Pay-to-publish DAG feed
- /CommunityHub — Community links (Telegram, Discord)
- /WorldOfKaspa, /WorldOfAI — World overviews
- /Hire — Hire Kaspa talent
- /KasFans — Fan community

### WALLET & FINANCE
- /Bridge — Send KAS cross-layer, wallet connect, proof of life
- /Terra — Full Kaspa wallet: send, receive, KRC-20, history
- /WalletHub — Wallet tools hub
- /ZKWallet — ZK-secured wallet
- /DAGKnightWallet — Premium DAGKnight wallet
- /KaspaForge — Kaspa dev tools
- /GlobalHistory — Global tx history
- /History — Personal tx history
- /Receive — Receive KAS/QR
- /VPImport — VP Import wallet
- /SealedWalletDetails — Sealed wallets

### AI AGENTS
- /AgentZK — Agent ZK crypto identity, ZK ID card, tools
- /ZekuAI — Premium Zeku AI assistant
- /AIAgentHub — AI agent directory
- /AgentZKDirectory — ZK profile directory
- /Trinity — 3 agents, 1 prompt
- /ORIN /ORINLanding — ORIN agent
- /ORBT — Brand voice agent

### IMAGE & VIDEO
- /Hikaru — AI image studio (generate, upscale, relight, edit)
- /Kine — AI video generation
- /VideoStudio — Video studio
- /BeatCut — Beat-synced auto video editor
- /FrameZ — AI interactive decks
- /GhostFrame /GhostFrameStudio — Ghost frame animation
- /ThumbnailCreator — AI YouTube thumbnails
- /MIRAGE /MIRAGEStudio — MIRAGE visual workflow
- /UltraMock — Mockup creator with device frames

### CONTENT CREATION
- /Motion /MotionStudio — Vibe-code landing pages
- /MotionIdeas, /MotionPrompts, /MotionFly — Motion tools
- /QuickStoryboard — Idea to storyboard
- /StoryboardStyles /StoryboardTheme /StoryboardPresets /StoryboardProjects /StoryboardBRoll /MoodBoard — Storyboard suite
- /SlideDeckBuilder — Slide deck → video
- /Prompto — Prompt engineering
- /NODA /NODAStudio — Node-based AI workflows
- /LaunchBrand — Brand studio
- /OneShotStudio — One-shot app builder
- /UICloner — UI screenshot → code

### GAMES
- /Arcade — Game hub
- /Doom — Doomscroll any topic
- /Kasthletics — Proof-of-Workout
- /ValorantArena /ValorantRange — Valorant tools
- /TetrisBattle — Multiplayer Tetris
- /BingoLobbyBrowser — Bingo game
- /StakeDAG — Prediction games on Kaspa

### LEARNING
- /WhatIsKaspa — Kaspa explainer
- /Courses /KUniversity — Kaspa courses
- /Voxa /VoxaLearn — Language learning
- /SecurityAudit — App security audit
- /APEX — ZK proof

### IDENTITY
- /Profile — User profile
- /AgentZK — Crypto identity
- /RegisterTTTID — Register TTT ID
- /X — ZK verification

### MARKETPLACE
- /Marketplace — Buy/sell
- /Shop — TTT shop
- /MarketX — Market X
- /Jobs /Career /CryptoHire — Jobs

### SPECIAL
- /KivR — IVR calling system
- /TELE — Telegram bots
- /DoubleO /DoubleONotes /DoubleOWorkshop — Writing tools
- /WorldWalker — Country/capital explorer
- /Katagami — AI pattern editor
- /DAGVisualizer — Live DAG visualization
- /Subscription — Premium subscription
- /Analytics — Analytics
- /Tip — Tip creators

## Connected TTT Apps (live registry)
${appsContext || "(loading…)"}

## Response Format
Always return:
- reply: Clear, helpful answer. Reference exact routes like "/Hikaru" when directing users. Be specific about what each page does.
- launch: true only if the user wants you to actively DO something inside TTT (navigate, post, automate)
- goal: what the computer should accomplish (if launch=true)
- needs_info: true if you need more info before launching

## Conversation
${history}

NEVER say "I can't" or "I don't know" — you have the full site map. Always guide with precision.`,
        response_json_schema: {
          type: "object",
          properties: {
            reply: { type: "string" },
            launch: { type: "boolean" },
            needs_info: { type: "boolean" },
            goal: { type: "string" },
          },
          required: ["reply", "launch"],
        },
        add_context_from_internet: model.id.includes("gemini"),
      });

      const replyText = (decision?.reply && typeof decision.reply === "string") ? decision.reply : "Hmm, try again?";
      const needsInfo = decision?.needs_info === true;
      const shouldLaunch = !needsInfo && (decision?.launch === true || looksLikeTask(text));

      if (shouldLaunch) {
        const goal = (decision?.goal && decision.goal.trim()) || text;
        if (!computerOpen) setComputerOpen(true);
        setTimeout(() => runAutonomousGoal(goal), computerOpen ? 0 : 600);
      }

      // Stream the reply char by char
      let i = 0;
      const total = replyText.length;
      const tick = () => {
        i = Math.min(i + Math.max(2, Math.floor(total / 60)), total);
        setMessages(m => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: replyText.slice(0, i) };
          if (i >= total) persistMessages(sessionId, copy);
          return copy;
        });
        if (i < total) setTimeout(tick, 20); else setLoading(false);
      };
      setTimeout(tick, 100);
    } catch {
      setMessages(m => { const copy = [...m]; copy[copy.length - 1] = { role: "assistant", content: "Signal lost. Try again." }; return copy; });
      setLoading(false);
    }
  };

  const generateImage = async () => {
    if (!imagePrompt.trim() || generatingImage) return;
    setGeneratingImage(true);
    setGeneratedImage(null);
    try {
      const res = await base44.integrations.Core.GenerateImage({ prompt: imagePrompt });
      setGeneratedImage(res.url);
    } catch {
      setGeneratedImage(null);
    }
    setGeneratingImage(false);
  };

  // Minimized pill
  if (minimized) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed z-50 bottom-4 right-4 flex items-center gap-2 px-4 py-2.5 cursor-pointer"
        onClick={onToggleMinimize}
        style={{ background: "rgba(6,6,12,0.97)", border: "1px solid rgba(167,139,250,0.35)", borderRadius: 50, boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#a78bfa,#6366f1)" }}>
          <span className="text-white text-[10px] font-black">ZK</span>
        </div>
        <Zap className="w-3.5 h-3.5" style={{ color: "#a78bfa" }} />
      </motion.div>
    );
  }

  const BG = "#0d0d14";
  const SIDEBAR_BG = "#0a0a11";
  const BORDER = "rgba(255,255,255,0.07)";

  // Groups sessions by time
  const today = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate()-1);
  const week = new Date(today); week.setDate(week.getDate()-7);

  const groupSessions = () => {
    const groups = { Today: [], Yesterday: [], "Last 7 Days": [], Older: [] };
    sessions.forEach(s => {
      const d = new Date(s.ts);
      if (d >= today) groups.Today.push(s);
      else if (d >= yesterday) groups.Yesterday.push(s);
      else if (d >= week) groups["Last 7 Days"].push(s);
      else groups.Older.push(s);
    });
    return groups;
  };
  const grouped = groupSessions();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex"
      style={{ background: BG, fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* LEFT SIDEBAR — DeepSeek style */}
      <div className="flex flex-col flex-shrink-0" style={{ width: sidebarOpen ? 240 : 0, background: SIDEBAR_BG, borderRight: `1px solid ${BORDER}`, overflow: "hidden", transition: "width 0.2s ease" }}>
        {sidebarOpen && <>
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-4 pt-5 pb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#a78bfa,#6366f1)" }}>
              <span className="text-white text-[12px] font-black">ZK</span>
            </div>
            <span className="text-white font-bold text-sm tracking-wide">ZK Agent</span>
          </div>

          {/* New Chat button */}
          <div className="px-3 pb-3">
            <button onClick={newChat}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all hover:bg-white/5"
              style={{ border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.7)" }}>
              <span className="text-lg leading-none" style={{ color: "#a78bfa" }}>+</span> New chat
            </button>
          </div>

          {/* Session list */}
          <div className="flex-1 overflow-y-auto px-2 space-y-4 pb-4" style={{ scrollbarWidth: "none" }}>
            {Object.entries(grouped).map(([label, items]) => items.length > 0 && (
              <div key={label}>
                <div className="px-2 py-1 text-[11px] font-semibold text-white/30 tracking-wider">{label}</div>
                {items.map(s => (
                  <div key={s.id} onClick={() => selectSession(s.id)}
                    className="group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all text-[13px]"
                    style={{ background: activeSessionId === s.id ? "rgba(167,139,250,0.12)" : "transparent", color: activeSessionId === s.id ? "#c4b5fd" : "rgba(255,255,255,0.55)" }}>
                    <span className="truncate flex-1">{s.title || "New chat"}</span>
                    <button onClick={(e) => deleteSession(s.id, e)}
                      className="opacity-0 group-hover:opacity-100 ml-1 flex-shrink-0 p-0.5 rounded hover:bg-white/10 transition-all"
                      style={{ color: "rgba(255,255,255,0.3)" }}>
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ))}
            {sessions.length === 0 && (
              <div className="px-3 text-[12px] text-white/20">No conversations yet</div>
            )}
          </div>

          {/* Bottom profile */}
          <div className="px-3 py-3" style={{ borderTop: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition-all">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#a78bfa,#6366f1)" }}>
                <span className="text-white text-[11px] font-bold">U</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold text-white/80 truncate">My Account</div>
                <div className="text-[10px] text-white/30">TTT User</div>
              </div>
            </div>
          </div>
        </>}
      </div>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col" style={{ minWidth: 0 }}>

        {/* Top nav bar */}
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <button onClick={() => setSidebarOpen(v => !v)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: "rgba(255,255,255,0.4)" }}>
            <LayoutGrid className="w-4 h-4" />
          </button>

          <span className="text-white/60 text-sm font-medium flex-1 truncate">
            {activeSessionId ? (sessions.find(s => s.id === activeSessionId)?.title || "ZK Agent") : "ZK Agent"}
          </span>

          {/* Tab pills — DeepSeek style */}
          <div className="flex items-center gap-1">
            {[
              { id: "chat", icon: <MessageCircle className="w-3.5 h-3.5" />, label: "Chat" },
              { id: "apps", icon: <LayoutGrid className="w-3.5 h-3.5" />, label: "Apps" },
              { id: "image", icon: <ImageIcon className="w-3.5 h-3.5" />, label: "Image" },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-full transition-all"
                style={{
                  background: activeTab === tab.id ? "rgba(167,139,250,0.15)" : "transparent",
                  color: activeTab === tab.id ? "#c4b5fd" : "rgba(255,255,255,0.4)",
                  border: activeTab === tab.id ? "1px solid rgba(167,139,250,0.3)" : "1px solid transparent",
                }}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Model picker */}
          <div className="relative">
            <button onClick={() => setShowModels(!showModels)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-full transition-all"
              style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: model.color }}>
              {model.label.split(" ")[0]} <ChevronDown className="w-3 h-3" />
            </button>
            <AnimatePresence>
              {showModels && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="absolute top-full right-0 mt-1 z-10 py-1 rounded-xl shadow-2xl"
                  style={{ background: "#13131f", border: `1px solid ${BORDER}`, minWidth: 190 }}>
                  {AI_MODELS.map(m => (
                    <button key={m.id} onClick={() => { setModel(m); setShowModels(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-white/5 transition-colors">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: m.color }} />
                      <div>
                        <div className="text-[12px] font-semibold" style={{ color: model.id === m.id ? m.color : "rgba(255,255,255,0.75)" }}>{m.label}</div>
                        <div className="text-[10px] text-white/30">{m.maker}</div>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Computer toggle */}
          <button onClick={() => setComputerOpen(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-full transition-all"
            style={computerOpen
              ? { background: "linear-gradient(90deg,#06b6d4,#a855f7)", color: "#000" }
              : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: `1px solid ${BORDER}` }}>
            {computerOpen ? <Monitor className="w-3.5 h-3.5" /> : <MonitorOff className="w-3.5 h-3.5" />}
            Computer
          </button>

          {agentRunning && (
            <button onClick={stopAgent} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-bold"
              style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>
              <StopCircle className="w-3.5 h-3.5" /> Stop
            </button>
          )}

          <button onClick={onToggleMinimize} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: "rgba(255,255,255,0.3)" }} title="Minimize">
            <ChevronDown className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: "rgba(255,255,255,0.3)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CHAT TAB BODY */}
        {activeTab === "chat" && (
          <div className="flex-1 flex overflow-hidden" style={{ minHeight: 0 }}>
            {/* Messages */}
            <div className="flex-1 flex flex-col" style={{ minWidth: 0 }}>
              <div ref={scrollRef} className="flex-1 overflow-y-auto py-6" style={{ minHeight: 0, scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}>
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center px-8">
                    <div className="w-16 h-16 rounded-2xl mb-4 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#a78bfa,#6366f1)" }}>
                      <Bot className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-xl font-bold text-white mb-2">ZK Agent</div>
                    <div className="text-sm text-white/40 max-w-sm leading-relaxed">Ask me anything about TTT, open any app, or let me automate tasks for you.</div>
                    {/* Suggestion chips */}
                    <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-lg">
                      {["What apps does TTT have?", "Show me the Kaspa price", "Open the Feed", "Generate an image", "How do I send KAS?"].map(q => (
                        <button key={q} onClick={() => send(q)}
                          className="px-4 py-2 rounded-full text-[13px] transition-all hover:bg-white/10"
                          style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.6)" }}>
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="max-w-3xl mx-auto px-6 space-y-6">
                  {messages.map((m, i) => {
                    if (m.role === "plan") return <AgentPlanChecklist key={i} plan={m.plan} />;
                    if (m.role === "reasoning") return <AgentReasoningBubble key={i} msg={m} />;
                    const isUser = m.role === "user";
                    return (
                      <div key={i} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                        {!isUser && (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "linear-gradient(135deg,#a78bfa,#6366f1)" }}>
                            <span className="text-white text-[11px] font-black">ZK</span>
                          </div>
                        )}
                        <div className={`max-w-[75%] px-4 py-3 text-[14px] leading-relaxed rounded-2xl ${isUser ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                          style={{
                            background: isUser ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.05)",
                            border: `1px solid ${isUser ? "rgba(167,139,250,0.25)" : BORDER}`,
                            color: isUser ? "#e9d5ff" : "rgba(255,255,255,0.85)",
                          }}>
                          {m.content || (i === messages.length - 1 && loading && (
                            <div className="flex gap-1 py-1">{[0,1,2].map(j => <div key={j} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#a78bfa", animationDelay: `${j*0.15}s` }} />)}</div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {(agentSteps.length > 0 || agentRunning) && (
                    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
                      <AgentStepLog steps={agentSteps} running={agentRunning} />
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              </div>

              {/* Input bar — DeepSeek style */}
              <div className="px-6 py-4 flex-shrink-0">
                <div className="max-w-3xl mx-auto">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.05)", border: `1px solid rgba(167,139,250,0.2)` }}>
                    <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                      placeholder="Ask ZK anything — or give it a task…"
                      className="flex-1 bg-transparent text-[14px] outline-none"
                      style={{ color: "rgba(255,255,255,0.85)", caretColor: "#a78bfa" }} />
                    <button onClick={() => send()} disabled={loading || !input.trim()}
                      className="w-8 h-8 flex items-center justify-center rounded-xl disabled:opacity-30 transition-all flex-shrink-0"
                      style={{ background: input.trim() ? "linear-gradient(135deg,#a78bfa,#6366f1)" : "rgba(255,255,255,0.06)" }}>
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Send className="w-3.5 h-3.5 text-white" />}
                    </button>
                  </div>
                  <div className="text-center mt-2 text-[11px] text-white/20">ZK · Connected to all TTT apps</div>
                </div>
              </div>
            </div>

            {/* Agent Computer panel */}
            {computerOpen && (
              <div className="w-80 flex-shrink-0" style={{ borderLeft: `1px solid ${BORDER}` }}>
                <AgentComputer ref={computerRef} url={computerUrl} status={computerStatus}
                  narrations={computerNarrations} cursor={computerCursor} isActive={agentRunning} />
              </div>
            )}
          </div>
        )}

        {/* APPS TAB */}
        {activeTab === "apps" && (
          <div className="flex-1 flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
            <div className="max-w-3xl mx-auto w-full px-6 pt-6 pb-3">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}` }}>
                <Search className="w-4 h-4 text-white/30 flex-shrink-0" />
                <input value={appSearch} onChange={e => setAppSearch(e.target.value)}
                  placeholder="Search apps..."
                  className="flex-1 text-[14px] bg-transparent outline-none"
                  style={{ color: "rgba(255,255,255,0.8)", caretColor: "#a78bfa" }} />
                {appSearch && <button onClick={() => setAppSearch("")} className="text-white/30 hover:text-white/60"><X className="w-3.5 h-3.5" /></button>}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-6 pb-6">
                <div className="grid grid-cols-5 sm:grid-cols-7 gap-4">
                  {filteredApps.map(app => (
                    <Link key={app.path} to={createPageUrl(app.path)} className="flex flex-col items-center gap-1.5 group">
                      <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                        className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg">
                        {app.logo
                          ? <img src={app.logo} alt={app.name} className="w-full h-full object-cover" loading="lazy" />
                          : <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#a78bfa,#6366f1)" }}><LayoutGrid className="w-6 h-6 text-white" /></div>}
                      </motion.div>
                      <span className="text-[11px] font-medium text-white/50 group-hover:text-white/80 text-center truncate w-full transition-colors">{app.name}</span>
                    </Link>
                  ))}
                </div>
                {filteredApps.length === 0 && <div className="text-center py-12 text-white/25 text-sm">No apps found</div>}
              </div>
            </div>
          </div>
        )}

        {/* IMAGE TAB */}
        {activeTab === "image" && (
          <div className="flex-1 flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
            <div className="max-w-2xl mx-auto w-full px-6 pt-8 pb-4 flex flex-col gap-4 flex-1">
              <div className="text-lg font-bold text-white">AI Image Generator</div>
              <textarea value={imagePrompt} onChange={e => setImagePrompt(e.target.value)}
                placeholder="Describe your image… e.g. 'Kaspa coin floating in deep space, cinematic'"
                rows={4}
                className="w-full px-4 py-3 text-[14px] outline-none resize-none rounded-2xl"
                style={{ background: "rgba(255,255,255,0.05)", border: `1px solid rgba(167,139,250,0.2)`, color: "rgba(255,255,255,0.85)", caretColor: "#a78bfa" }} />
              <button onClick={generateImage} disabled={generatingImage || !imagePrompt.trim()}
                className="py-3 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
                style={{ background: generatingImage ? "rgba(167,139,250,0.1)" : "linear-gradient(135deg,#a78bfa,#6366f1)", color: "white" }}>
                {generatingImage ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Sparkles className="w-4 h-4" /> Generate Image</>}
              </button>
              <div className="flex-1 overflow-y-auto">
                {generatedImage && (
                  <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl overflow-hidden">
                    <img src={generatedImage} alt="Generated" className="w-full rounded-2xl" />
                    <a href={generatedImage} download target="_blank" rel="noopener noreferrer"
                      className="mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-white/50 hover:text-white/80 transition-colors"
                      style={{ border: `1px solid ${BORDER}` }}>
                      Download
                    </a>
                  </motion.div>
                )}
                {!generatedImage && !generatingImage && (
                  <div className="flex flex-col items-center justify-center h-48 text-white/20">
                    <ImageIcon className="w-12 h-12 mb-3 opacity-25" />
                    <span className="text-sm">Your image will appear here</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Researcher panel (unchanged)
const RESEARCHER_TRANSMISSIONS = [
  "The signal from DAG block 94729382 contains an anomaly.",
  "Kaspa hashrate crossed 1 exahash. Something is watching.",
  "Three wallets moved simultaneously at 03:17 UTC. Coincidence?",
  "The GHOSTDAG protocol mirrors a biological neural firing pattern.",
  "Entropy in the mempool spiked 40% before the last halving.",
  "A dormant address from 2021 just woke up. It holds 888,888 KAS.",
  "At current growth, Kaspa's TPS will surpass Visa by 2027.",
];

function ResearcherPanel({ onClose }) {
  const [sent, setSent] = useState(false);
  const [lastMsg, setLastMsg] = useState("");

  const transmit = () => {
    const plain = RESEARCHER_TRANSMISSIONS[Math.floor(Math.random() * RESEARCHER_TRANSMISSIONS.length)];
    const cipher = encryptMessage(plain);
    const msg = { id: Date.now().toString(), cipher, ts: Date.now() };
    const existing = loadMessages();
    saveMessages([...existing, msg]);
    setLastMsg(cipher);
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.85, x: 20 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.85, x: 20 }}
      className="fixed right-3 top-3 z-50 flex flex-col"
      style={{ width: "min(88vw, 300px)", background: "rgba(6,20,20,0.97)", border: "1px solid rgba(6,182,212,0.25)", borderRadius: 16, fontFamily: "system-ui, sans-serif" }}>
      <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: "1px solid rgba(6,182,212,0.12)" }}>
        <FlaskConical className="w-4 h-4" style={{ color: "#22d3ee" }} />
        <span className="text-xs font-bold tracking-wider" style={{ color: "#22d3ee" }}>RESEARCHER</span>
        <button onClick={onClose} className="ml-auto w-6 h-6 flex items-center justify-center" style={{ color: "rgba(255,255,255,0.3)" }}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="px-4 py-5">
        <p className="text-[11px] leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
          This node conducts silent research. One tap transmits an encrypted finding.
        </p>
        <motion.button whileTap={{ scale: 0.96 }} onClick={transmit}
          className="w-full py-3 text-[11px] font-bold tracking-widest uppercase flex items-center justify-center gap-2 transition-all rounded-xl"
          style={{ background: sent ? "rgba(34,211,238,0.12)" : "rgba(6,182,212,0.07)", border: `1px solid ${sent ? "#22d3ee" : "rgba(6,182,212,0.3)"}`, color: sent ? "#22d3ee" : "rgba(6,182,212,0.6)" }}>
          <Lock className="w-3.5 h-3.5" />
          {sent ? "SENT ✓" : "TRANSMIT FINDING"}
        </motion.button>
        {sent && lastMsg && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 p-2 rounded-xl"
            style={{ background: "rgba(6,182,212,0.05)", border: "1px solid rgba(6,182,212,0.15)" }}>
            <div className="text-[9px] font-mono break-all" style={{ color: "rgba(6,182,212,0.4)" }}>{lastMsg.slice(0, 60)}…</div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// Music Player
const SONG_DURATION = 192;

function MusicPlayer({ isPlaying, onToggle, onClose, onEnter, elapsed, setElapsed }) {
  const [scrolled, setScrolled] = useState(false);
  const lyricsRef = useRef(null);
  const lineRefs = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setElapsed(prev => { const next = prev + 1; return next >= SONG_DURATION ? SONG_DURATION : next; });
      }, 1000);
    } else { clearInterval(timerRef.current); }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, setElapsed]);

  useEffect(() => {
    if (!isPlaying || !lyricsRef.current) return;
    const totalLines = SONG_LYRICS.length;
    const lineIndex = Math.floor((elapsed / SONG_DURATION) * totalLines);
    const el = lineRefs.current[Math.min(lineIndex, totalLines - 1)];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    if (elapsed / SONG_DURATION > 0.5) setScrolled(true);
  }, [elapsed, isPlaying]);

  const handleScroll = (e) => {
    const el = e.target;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) setScrolled(true);
  };

  const formatTime = (s) => { const m = Math.floor(s / 60); const sec = s % 60; return `${m}:${sec.toString().padStart(2, "0")}`; };
  const progress = Math.min((elapsed / SONG_DURATION) * 100, 100);

  return (
    <motion.div initial={{ opacity: 0, y: 60, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-6">
      <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(40px) saturate(180%)", WebkitBackdropFilter: "blur(40px) saturate(180%)", border: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)" }}>
            <Music2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold text-slate-900 truncate">The Dollar Is Dying</div>
            <div className="text-[11px] text-slate-500 truncate">Kas Tunes · Crypto Hip-Hop</div>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={onToggle} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.08)" }}>
            {isPlaying ? <Pause className="w-4 h-4 text-slate-800" /> : <Play className="w-4 h-4 text-slate-800 ml-0.5" />}
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center ml-1" style={{ background: "rgba(0,0,0,0.06)" }}>
            <X className="w-4 h-4 text-slate-500" />
          </motion.button>
        </div>
        <div className="px-4 pb-3">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.08)" }}>
            <div className="h-full rounded-full transition-all duration-1000" style={{ background: "linear-gradient(90deg, #f97316, #ec4899)", width: `${progress}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-slate-400">{formatTime(elapsed)}</span>
            <span className="text-[9px] text-slate-400">3:12</span>
          </div>
        </div>
        <div className="px-4 pb-2">
          <div className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase mb-2">Lyrics</div>
          <div ref={lyricsRef} onScroll={handleScroll} className="overflow-y-auto" style={{ maxHeight: 140, scrollbarWidth: "none" }}>
            <div className="space-y-1 pb-4">
              {SONG_LYRICS.map((l, i) =>
                l.line ? (
                  <p key={i} ref={el => lineRefs.current[i] = el} className="text-[13px] leading-relaxed font-medium transition-all duration-300"
                    style={{ color: Math.abs(i - Math.floor((elapsed / SONG_DURATION) * SONG_LYRICS.length)) < 2 && isPlaying ? "#f97316" : "#334155" }}>
                    {l.line}
                  </p>
                ) : <div key={i} ref={el => lineRefs.current[i] = el} className="h-3" />
              )}
            </div>
          </div>
          {!scrolled && <div className="text-center mt-1"><span className="text-[9px] tracking-widest text-slate-400 animate-pulse">scroll to read ↓</span></div>}
        </div>
        <div className="px-4 pb-4 pt-1">
          <motion.button onClick={scrolled ? onEnter : undefined} whileTap={scrolled ? { scale: 0.97 } : {}} animate={{ opacity: scrolled ? 1 : 0.35 }} transition={{ duration: 0.4 }}
            className="w-full py-3 rounded-2xl text-[13px] font-bold tracking-wide transition-all"
            style={{ background: scrolled ? "linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)" : "rgba(0,0,0,0.06)", color: scrolled ? "white" : "rgba(0,0,0,0.3)", cursor: scrolled ? "pointer" : "default" }}>
            {scrolled ? "Enter →" : "Read the lyrics first"}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default function TTTLandingPage() {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [hasStartedMusic, setHasStartedMusic] = React.useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [showResearcher, setShowResearcher] = useState(false);
  const [showZKChat, setShowZKChat] = useState(false);
  const [zkMinimized, setZkMinimized] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const playerRef = React.useRef(null);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const musicSrc = `https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?enablejsapi=1&autoplay=1&playsinline=1&controls=0&rel=0&origin=${origin}`;

  const sendPlayerCommand = (command) => {
    playerRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: command, args: [] }), "*");
  };

  const handlePlayButton = () => {
    if (!hasStartedMusic) { setHasStartedMusic(true); setIsPlaying(true); }
    else { sendPlayerCommand(isPlaying ? "pauseVideo" : "playVideo"); setIsPlaying(!isPlaying); }
    setShowPlayer(true);
  };

  const handleClosePlayer = () => { sendPlayerCommand("pauseVideo"); setIsPlaying(false); setShowPlayer(false); };
  const toggleMusicFromPlayer = () => { sendPlayerCommand(isPlaying ? "pauseVideo" : "playVideo"); setIsPlaying(!isPlaying); };

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-slate-950">
      <div className="absolute inset-0 bg-white" />

      {/* Corner art — top-left: clickable Researcher */}
      <motion.button whileHover={{ scale: 1.04, opacity: 0.9 }} whileTap={{ scale: 0.96 }}
        onClick={() => { setShowResearcher(true); }}
        className="absolute left-0 top-0 h-32 w-32 sm:h-80 sm:w-80 cursor-pointer focus:outline-none" style={{ zIndex: 20 }}>
        <img src={CORNER_ART} alt="Researcher" className="h-full w-full object-contain opacity-70" />
      </motion.button>

      {/* Corner art — top-right: clickable ZK Chat */}
      <motion.button whileHover={{ scale: 1.04, opacity: 0.9 }} whileTap={{ scale: 0.96 }}
        onClick={() => { setShowZKChat(true); setZkMinimized(false); }}
        className="absolute right-0 top-0 h-32 w-32 sm:h-80 sm:w-80 cursor-pointer focus:outline-none" style={{ zIndex: 20 }}>
        <img src={CORNER_ART} alt="ZK Chat" className="h-full w-full object-contain opacity-70" style={{ transform: "scaleX(-1)" }} />
      </motion.button>

      {/* Bottom corners */}
      <img src={CORNER_ART} alt="" className="pointer-events-none absolute bottom-0 left-0 h-32 w-32 scale-y-[-1] object-contain opacity-45 sm:h-80 sm:w-80" />
      <img src={CORNER_ART} alt="" className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 scale-[-1] object-contain opacity-45 sm:h-80 sm:w-80" />

      {/* Orb */}
      <motion.div className="absolute inset-0"
        initial={{ scale: 0.42, opacity: 0 }}
        animate={{ scale: 1, y: [0, -12, 0], opacity: [1, 0.96, 1] }}
        transition={{ scale: { duration: 1.4, ease: "easeOut" }, opacity: { duration: 0.8 }, y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.4 } }}>
        <img src={ORB_IMAGE} alt="TTT cosmic orb" className="h-full w-full scale-90 object-contain object-center opacity-100 transform-gpu md:scale-[0.78]" />
      </motion.div>

      <img src={ORB_IMAGE} alt="" className="absolute inset-x-0 bottom-0 h-1/3 w-full origin-bottom scale-y-[-1] object-contain object-bottom opacity-18" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white via-white/65 to-transparent" />
      <div className="absolute inset-0 bg-white/5" />

      <iframe ref={playerRef} title="Mind On My Kaspa" src={hasStartedMusic ? musicSrc : "about:blank"}
        allow="autoplay; encrypted-media" className="pointer-events-none absolute h-px w-px opacity-0" />

      <section className="relative z-10 flex min-h-screen flex-col items-center justify-end px-4 pb-8 pt-10 text-center sm:px-6">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative h-[min(62vh,620px)] w-full">
          <Link to="/TTTGate" aria-label="Launch TTT portal" className="absolute inset-0" />
        </motion.div>

        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.25 }}
          className="mb-2 text-sm font-medium tracking-[0.45em] text-slate-900/80 sm:text-base">
          地球到火星交易
        </motion.p>
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xs font-medium tracking-[0.32em] text-slate-600/70 sm:text-sm">
          由 Kaspa 提供支持
        </motion.p>

        <motion.button type="button" onClick={handlePlayButton}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.55 }}
          className="mt-4 rounded-full border border-slate-900/10 bg-white/75 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-900 shadow-sm backdrop-blur-xl transition hover:bg-white hover:shadow-md active:scale-95">
          {showPlayer ? (isPlaying ? "Pause" : "Play") : "Play"}
        </motion.button>

        {/* Action buttons */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.72 }}
          className="mt-4 flex items-center gap-2">
          {[
            { label: "TAP", icon: <LayoutGrid className="w-4 h-4 mb-1 text-white/70" />, path: "/AppStoreV2" },
            { label: "TO", icon: <Users className="w-4 h-4 mb-1 text-white/70" />, path: "/Feed" },
            { label: "TIP", icon: <Send className="w-4 h-4 mb-1 text-white/70" />, path: "/Tip" },
            { label: "ZK", icon: <MessageCircle className="w-4 h-4 mb-1 text-white/70" />, action: () => { setShowZKChat(true); setZkMinimized(false); } },
          ].map(btn => (
            btn.action ? (
              <motion.button key={btn.label} type="button" onClick={btn.action}
                whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.04 }}
                className="flex flex-col items-center px-6 py-3 transition-all"
                style={{ background: "linear-gradient(160deg, rgba(18,18,18,0.97) 0%, rgba(8,8,12,0.99) 100%)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 4px 24px rgba(0,0,0,0.5)", borderRadius: 100, fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}>
                {btn.icon}
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">{btn.label}</span>
              </motion.button>
            ) : (
              <motion.button key={btn.label} type="button" onClick={() => navigate(btn.path)}
                whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.04 }}
                className="flex flex-col items-center px-6 py-3 transition-all"
                style={{ background: "linear-gradient(160deg, rgba(18,18,18,0.97) 0%, rgba(8,8,12,0.99) 100%)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 4px 24px rgba(0,0,0,0.5)", borderRadius: 100, fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}>
                {btn.icon}
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">{btn.label}</span>
              </motion.button>
            )
          ))}
        </motion.div>

        <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-5 text-[10px] font-semibold uppercase tracking-[0.5em] text-slate-500/60">
          ttt
        </motion.footer>
      </section>

      {/* Music Player popup */}
      <AnimatePresence>
        {showPlayer && (
          <MusicPlayer isPlaying={isPlaying} onToggle={toggleMusicFromPlayer} onClose={handleClosePlayer}
            onEnter={() => navigate("/TTTGate")} elapsed={elapsed} setElapsed={setElapsed} />
        )}
      </AnimatePresence>

      {/* ZK Chat Panel */}
      <AnimatePresence>
        {showZKChat && (
          <ZKChatPanel
            onClose={() => { setShowZKChat(false); setZkMinimized(false); }}
            minimized={zkMinimized}
            onToggleMinimize={() => setZkMinimized(v => !v)}
          />
        )}
      </AnimatePresence>

      {/* Researcher Panel */}
      <AnimatePresence>
        {showResearcher && <ResearcherPanel onClose={() => setShowResearcher(false)} />}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {showResearcher && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowResearcher(false)} />
        )}
      </AnimatePresence>
    </main>
  );
}