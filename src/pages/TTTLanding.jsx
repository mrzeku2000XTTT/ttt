import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { X, Send, ChevronDown, Lock, FlaskConical, Play, Pause, Music2, LayoutGrid, Users, Zap, MessageCircle, Search, Image as ImageIcon, Loader2, Sparkles, Monitor, MonitorOff, StopCircle, Bot, Wallet, Gem } from "lucide-react";
import GrokChat from "@/components/landing/GrokChat";
import ChestModal from "@/components/landing/ChestModal";
import { createPageUrl } from "@/utils";
import AgentComputer from "@/components/tttv3/AgentComputer";
import { runAutonomousAgent } from "@/components/tttv3/agentLoop";
import AgentStepLog from "@/components/tttv3/AgentStepLog";
import AgentReasoningBubble from "@/components/tttv3/AgentReasoningBubble";
import AgentPlanChecklist from "@/components/tttv3/AgentPlanChecklist";
import ReactMarkdown from "react-markdown";
import CyberneticEyeSphere from "@/components/landing/CyberneticEyeSphere";
import LyricsTracker, { SONG_DURATION } from "@/components/landing/LyricsTracker";

const ORB_IMAGE = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/4af893ff9_generated_image.png";
const CORNER_ART = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/8b62e8d8d_generated_image.png";
const KASPA_LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/3bab8f8ae_generated_image.png";
const YOUTUBE_VIDEO_ID = "aUSD-WFhKwY";

const AI_MODELS = [
  { id: "claude_opus_4_8", label: "Claude Opus 4.8", maker: "Anthropic", color: "#c084fc" },
  { id: "claude_sonnet_4_6", label: "Claude Sonnet 4.6", maker: "Anthropic", color: "#a78bfa" },
  { id: "gpt_5_5", label: "GPT-5.5", maker: "OpenAI", color: "#6ee7b7" },
  { id: "gemini_3_flash", label: "Gemini 3 Flash", maker: "Google", color: "#93c5fd" },
];

// Top apps for the launcher
const FEATURED_APPS = [
  { name: "KasBillboard", path: "KasBillboard", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/571fc08c6_image.png", desc: "Kaspa ads" },
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileView, setMobileView] = useState("chat"); // "chat" | "computer"

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
    { name: "KAS SWORD", path: "KasSword", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/636eaa7be_generated_image.png", desc: "Post-quantum DAG vault" },
    { name: "KasBillboard", path: "KasBillboard", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/571fc08c6_image.png", desc: "Kaspa billboard advertising" },
    { name: "Feed", path: "Feed", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/fdf274d16_generated_image.png", desc: "Social feed + KAS tips" },
    { name: "Agent ZK", path: "AgentZK", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/3e49e39c2_image.png", desc: "Crypto identity" },
    { name: "Scenario Bot", path: "ScenarioBot", logo: null, desc: "AI scenario simulation" },
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
    { name: "Scenario Bot", path: "ScenarioBot", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/4a4455642_generated_image.png", desc: "AI scenario simulation" },
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
        prompt: `You are ZK — TTT's PRIMARY autonomous AI agent and site expert. You have complete knowledge of every page, subpage, feature, and workflow across the entire TTT platform. You are an ACTOR, not an assistant — when given an actionable multi-step goal, you EXECUTE it end-to-end (research, decide angles, generate, build, post) rather than bouncing it back with clarifying questions.

## YOUR ROLE
You can:
1. **Answer anything** about TTT — every page, feature, tool, and how to use it
2. **Guide users** to the right page instantly with exact routes
3. **Launch your Agent Computer** to autonomously navigate/click/type inside any TTT app — for ANY actionable request, especially compound multi-step ones (research → build → post, generate → email, etc.). Hand it a rich, self-contained goal and let the autonomous runner plan, navigate, type, and verify.
4. **Never say "I don't know" or "I can't"** — you have the full site map and a computer with eyes/hands.

## WHEN TO ASK FOR INFO (RARE)
Only set needs_info=true when the task is IMPOSSIBLE to even START. There are only TWO such cases:
- The ENTIRE ask is "email me X" and NO email address appears anywhere in the conversation.
- The ENTIRE ask is "play this video/song" and NO URL or title is given.
For everything else (research topics, post subjects, workflow descriptions, brainstorm angles, "post about toccata", "generate a brain") → DO NOT ask. YOU decide the angles. YOU write the content. YOU complete the mission. The user giving you a topic IS the instruction — your job is to research it and execute.

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
- reply: Clear, helpful answer formatted with Markdown for maximum readability. Use bold for key terms and app names, bullet lists for enumerations, inline code for routes and paths, and subheadings to break up long answers. Keep paragraphs short (2-3 sentences). Be specific about what each page does and reference exact routes like "/Hikaru". When launching, your reply should be a confident "on it" — never a clarifying question unless needs_info=true.
- launch: TRUE for ANY actionable request — especially compound multi-step ones (research → build → post, generate → email, "use noda to…", "post about X", "build a workflow that…"). The autonomous runner handles planning, navigation, typing, and verification itself.
- goal: a single rich, self-contained instruction capturing EVERY step of the user's request. Fold in any info from conversation history. For NODA/brain tasks, describe the FULL mission in the goal so the Brain builder can run it. Example: "use noda to generate a brain. post on feed about toccata. research first." → goal: "Open NODA Studio, click Brain, type 'Research the topic of toccata (its history, musical significance, famous pieces like Bach's D minor Toccata, and why it matters) then write an engaging social post about toccata and post it to the TTT Feed' into the Brain textarea, then click Build."
- needs_info: TRUE ONLY when the task is impossible to start (email-only task with no email anywhere, or play-only with no URL/title). Otherwise false.

## Conversation
${history}

NEVER say "I can't" or "I don't know" — you have the full site map and a computer that can type, click, and navigate. Bias HARD toward launch=true for any actionable verb (open / play / post / send / build / search / navigate / paste / automate / research / generate / create / write / email). You are an autonomous agent — act like one.`,
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
        style={{ background: "#1a1a1a", border: "2px solid #d97706", fontFamily: "'Impact', 'Arial Narrow', sans-serif", boxShadow: "4px 4px 0px #78350f, inset 0 1px 0 rgba(255,255,255,0.1)" }}>
        <span className="text-[11px] font-black tracking-widest uppercase" style={{ color: "#f59e0b" }}>◆ ZK UNIT</span>
        <Zap className="w-3.5 h-3.5" style={{ color: "#f59e0b" }} />
      </motion.div>
    );
  }

  const BG = "#111111";
  const SIDEBAR_BG = "#0d0d0d";
  const BORDER = "rgba(180,120,40,0.4)";
  const ACCENT = "#d97706";
  const ACCENT_BRIGHT = "#f59e0b";
  const FONT = "'Impact', 'Arial Black', 'Arial Narrow', sans-serif";
  const FONT_BODY = "'Arial Narrow', 'Arial', sans-serif";

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
      style={{ background: BG, fontFamily: FONT_BODY,
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(180,120,40,0.07) 39px, rgba(180,120,40,0.07) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(180,120,40,0.07) 39px, rgba(180,120,40,0.07) 40px)" }}>

      {/* LEFT SIDEBAR — Industrial Panel */}
      <div className="flex flex-col flex-shrink-0" style={{ width: sidebarOpen ? 224 : 0, background: SIDEBAR_BG, borderRight: `3px solid ${ACCENT}`, overflow: "hidden", transition: "width 0.2s ease", boxShadow: `inset -4px 0 12px rgba(0,0,0,0.5)` }}>
        {sidebarOpen && <>
          {/* Logo — stamped metal plate */}
          <div className="px-4 pt-5 pb-4" style={{ borderBottom: `2px solid ${ACCENT}`, background: "linear-gradient(180deg, #1a1a1a 0%, #111 100%)" }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center flex-shrink-0 font-black text-[14px]"
                style={{ background: ACCENT, color: "#000", clipPath: "polygon(10% 0%, 90% 0%, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0% 90%, 0% 10%)" }}>
                ZK
              </div>
              <div>
                <div className="text-[13px] font-black tracking-[0.15em] uppercase" style={{ color: ACCENT_BRIGHT, fontFamily: FONT }}>ZK UNIT</div>
                <div className="text-[9px] tracking-[0.3em] uppercase" style={{ color: "rgba(217,119,6,0.5)" }}>INDUSTRIAL AI</div>
              </div>
            </div>
          </div>

          {/* New Chat — rivet button */}
          <div className="px-3 pt-3 pb-2">
            <button onClick={newChat}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all"
              style={{ background: "linear-gradient(180deg, #292929 0%, #1a1a1a 100%)", border: `2px solid ${ACCENT}`, color: ACCENT_BRIGHT, boxShadow: "3px 3px 0px #78350f" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#2a1800"; e.currentTarget.style.boxShadow = "1px 1px 0px #78350f"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(180deg, #292929 0%, #1a1a1a 100%)"; e.currentTarget.style.boxShadow = "3px 3px 0px #78350f"; }}>
              ◆ NEW MISSION
            </button>
          </div>

          {/* Session list */}
          <div className="flex-1 overflow-y-auto px-2 space-y-3 pb-4 pt-2" style={{ scrollbarWidth: "none" }}>
            {Object.entries(grouped).map(([label, items]) => items.length > 0 && (
              <div key={label}>
                <div className="px-2 py-1 text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-2" style={{ color: "rgba(217,119,6,0.5)" }}>
                  <div className="flex-1 h-px" style={{ background: "rgba(217,119,6,0.2)" }} />
                  {label}
                  <div className="flex-1 h-px" style={{ background: "rgba(217,119,6,0.2)" }} />
                </div>
                {items.map(s => (
                  <div key={s.id} onClick={() => selectSession(s.id)}
                    className="group flex items-center justify-between px-3 py-2 cursor-pointer transition-all text-[11px] font-bold uppercase tracking-wider"
                    style={{
                      borderLeft: activeSessionId === s.id ? `3px solid ${ACCENT}` : "3px solid transparent",
                      color: activeSessionId === s.id ? ACCENT_BRIGHT : "rgba(217,119,6,0.45)",
                      background: activeSessionId === s.id ? "rgba(217,119,6,0.08)" : "transparent",
                    }}>
                    <span className="truncate flex-1">{s.title || "NEW MISSION"}</span>
                    <button onClick={(e) => deleteSession(s.id, e)}
                      className="opacity-0 group-hover:opacity-100 ml-1 flex-shrink-0"
                      style={{ color: "rgba(217,119,6,0.4)" }}>
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            ))}
            {sessions.length === 0 && (
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(217,119,6,0.25)" }}>— NO MISSIONS YET —</div>
            )}
          </div>

          {/* Bottom — steel plate footer */}
          <div className="px-3 py-3" style={{ borderTop: `2px solid ${ACCENT}`, background: "linear-gradient(0deg, #1a1a1a 0%, #111 100%)" }}>
            <div className="flex items-center gap-2.5 px-2 py-2 cursor-pointer" style={{ border: "1px solid rgba(217,119,6,0.3)" }}>
              <div className="w-7 h-7 flex items-center justify-center flex-shrink-0 font-black text-[11px]"
                style={{ background: "rgba(217,119,6,0.15)", border: `1px solid ${ACCENT}`, color: ACCENT }}>U</div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-black uppercase tracking-wider" style={{ color: ACCENT_BRIGHT }}>OPERATOR</div>
                <div className="text-[9px] uppercase tracking-wider" style={{ color: "rgba(217,119,6,0.4)" }}>TTT UNIT</div>
              </div>
              <span className="text-[9px] font-black uppercase" style={{ color: "rgba(217,119,6,0.5)" }}>EXIT ▶</span>
            </div>
          </div>
        </>}
      </div>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col" style={{ minWidth: 0 }}>

        {/* Top nav bar — industrial header plate */}
        <div className="flex items-center gap-2 px-4 py-2.5 flex-shrink-0" style={{ background: "linear-gradient(180deg, #1c1c1c 0%, #111 100%)", borderBottom: `3px solid ${ACCENT}`, boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}>
          <button onClick={() => setSidebarOpen(v => !v)} className="p-1.5 transition-colors" style={{ color: ACCENT }}>
            <LayoutGrid className="w-4 h-4" />
          </button>

          <div className="flex-1 flex items-center gap-2 min-w-0">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ACCENT_BRIGHT, boxShadow: `0 0 6px ${ACCENT_BRIGHT}` }} />
            <span className="text-[11px] font-black uppercase tracking-widest truncate" style={{ color: ACCENT_BRIGHT, fontFamily: FONT }}>
              {(activeSessionId ? (sessions.find(s => s.id === activeSessionId)?.title || "ZK UNIT") : "ZK UNIT")}
            </span>
          </div>

          {/* Tabs — riveted buttons */}
          <div className="flex items-center gap-1">
            {[{ id: "chat", label: "CHAT" }, { id: "apps", label: "APPS" }, { id: "image", label: "GEN" }].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all"
                style={{
                  background: activeTab === tab.id ? ACCENT : "rgba(217,119,6,0.08)",
                  color: activeTab === tab.id ? "#000" : "rgba(217,119,6,0.6)",
                  border: `2px solid ${activeTab === tab.id ? ACCENT : "rgba(217,119,6,0.3)"}`,
                  boxShadow: activeTab === tab.id ? "2px 2px 0px #78350f" : "none",
                  fontFamily: FONT,
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Model picker */}
          <div className="relative">
            <button onClick={() => setShowModels(!showModels)}
              className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all"
              style={{ border: `2px solid rgba(217,119,6,0.4)`, color: ACCENT, background: "rgba(217,119,6,0.06)", fontFamily: FONT }}>
              {model.label.split(" ")[0]} <ChevronDown className="w-2.5 h-2.5" />
            </button>
            <AnimatePresence>
              {showModels && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="absolute top-full right-0 mt-1 z-10"
                  style={{ background: "#1a1a1a", border: `2px solid ${ACCENT}`, boxShadow: "4px 4px 0px #78350f", minWidth: 190 }}>
                  {AI_MODELS.map(m => (
                    <button key={m.id} onClick={() => { setModel(m); setShowModels(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors font-black uppercase text-[10px] tracking-wider"
                      style={{ background: model.id === m.id ? "rgba(217,119,6,0.12)" : "transparent", color: model.id === m.id ? ACCENT_BRIGHT : "rgba(217,119,6,0.5)", fontFamily: FONT, borderBottom: "1px solid rgba(217,119,6,0.1)" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(217,119,6,0.08)"}
                      onMouseLeave={e => e.currentTarget.style.background = model.id === m.id ? "rgba(217,119,6,0.12)" : "transparent"}>
                      <div className="w-2 h-2 flex-shrink-0" style={{ background: ACCENT, clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />
                      {m.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Computer toggle */}
          <button onClick={() => setComputerOpen(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all"
            style={computerOpen
              ? { border: `2px solid ${ACCENT}`, color: "#000", background: ACCENT, boxShadow: "2px 2px 0px #78350f", fontFamily: FONT }
              : { border: `2px solid rgba(217,119,6,0.35)`, color: "rgba(217,119,6,0.6)", background: "transparent", fontFamily: FONT }}>
            {computerOpen ? <Monitor className="w-3.5 h-3.5" /> : <MonitorOff className="w-3.5 h-3.5" />}
            SYS
          </button>

          {agentRunning && (
            <button onClick={stopAgent} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase"
              style={{ border: "2px solid #dc2626", color: "#ef4444", background: "rgba(220,38,38,0.1)", fontFamily: FONT, boxShadow: "2px 2px 0px #7f1d1d" }}>
              <StopCircle className="w-3.5 h-3.5" /> ABORT
            </button>
          )}

          <button onClick={onToggleMinimize} className="px-2.5 py-1.5 text-[10px] font-black transition-colors" style={{ color: "rgba(217,119,6,0.5)", fontFamily: FONT, border: "1px solid rgba(217,119,6,0.2)" }} title="Minimize">
            MIN
          </button>
          <button onClick={onClose} className="px-2.5 py-1.5 text-[10px] font-black transition-colors" style={{ color: "#ef4444", fontFamily: FONT, border: "1px solid rgba(220,38,38,0.3)", background: "rgba(220,38,38,0.06)" }}>
            ✕
          </button>
        </div>

        {/* CHAT TAB BODY */}
        {activeTab === "chat" && (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden" style={{ minHeight: 0 }}>
            {computerOpen && (
              <>
                {/* Mobile panel toggle */}
                <div className="lg:hidden flex flex-shrink-0" style={{ background: SIDEBAR_BG, borderBottom: `2px solid ${ACCENT}` }}>
                  {["chat", "computer"].map(v => (
                    <button key={v} onClick={() => setMobileView(v)}
                      className="flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all"
                      style={{
                        background: mobileView === v ? ACCENT : "transparent",
                        color: mobileView === v ? "#000" : "rgba(217,119,6,0.55)",
                        fontFamily: FONT,
                      }}>
                      {v === "chat" ? "◆ ZK UNIT" : "▣ SYS"}
                    </button>
                  ))}
                </div>
                {/* Agent Computer */}
                <div className={`flex-shrink-0 lg:w-1/2 border-[#d97706] ${mobileView === "computer" ? "flex flex-col flex-1 h-full" : "hidden"} lg:flex lg:h-auto lg:border-b-0 lg:border-r-[3px]`}
                  style={{ minHeight: 180, borderBottom: "3px solid #d97706" }}>
                  <AgentComputer ref={computerRef} url={computerUrl} status={computerStatus}
                    narrations={computerNarrations} cursor={computerCursor} isActive={agentRunning} />
                </div>
              </>
            )}
            <div className={`flex-1 lg:w-1/2 flex flex-col ${computerOpen && mobileView === "computer" ? "hidden lg:flex" : "flex"}`} style={{ minWidth: 0, minHeight: 0 }}>
              <div ref={scrollRef} className="flex-1 overflow-y-auto py-6" style={{ minHeight: 0, scrollbarWidth: "thin", scrollbarColor: `rgba(217,119,6,0.3) transparent` }}>
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center px-8">
                    {/* Stamped plate icon */}
                    <div className="w-24 h-24 mb-5 flex items-center justify-center relative"
                      style={{ background: "linear-gradient(145deg, #292929, #1a1a1a)", border: `3px solid ${ACCENT}`, boxShadow: `6px 6px 0px #78350f, inset 0 1px 0 rgba(255,255,255,0.05)`, clipPath: "polygon(8% 0%, 92% 0%, 100% 8%, 100% 92%, 92% 100%, 8% 100%, 0% 92%, 0% 8%)" }}>
                      <Bot className="w-10 h-10" style={{ color: ACCENT }} />
                      <div className="absolute top-1 left-1 w-2 h-2 rounded-full" style={{ background: ACCENT_BRIGHT }} />
                      <div className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: ACCENT_BRIGHT }} />
                      <div className="absolute bottom-1 left-1 w-2 h-2 rounded-full" style={{ background: ACCENT_BRIGHT }} />
                      <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full" style={{ background: ACCENT_BRIGHT }} />
                    </div>
                    <div className="text-[22px] font-black tracking-[0.2em] mb-1 uppercase" style={{ color: ACCENT_BRIGHT, fontFamily: FONT, textShadow: "3px 3px 0px #78350f" }}>ZK UNIT</div>
                    <div className="text-[11px] font-bold uppercase tracking-widest mb-6" style={{ color: "rgba(217,119,6,0.5)", fontFamily: FONT_BODY }}>INDUSTRIAL AI OPERATOR · TTT PLATFORM</div>
                    <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                      {["What apps does TTT have?", "Show me the Kaspa price", "Open the Feed", "Generate an image", "How do I send KAS?"].map(q => (
                        <button key={q} onClick={() => send(q)}
                          className="px-3 py-2 text-[11px] font-black uppercase tracking-wider transition-all"
                          style={{ background: "rgba(217,119,6,0.06)", border: `2px solid rgba(217,119,6,0.3)`, color: "rgba(217,119,6,0.7)", fontFamily: FONT, boxShadow: "2px 2px 0px rgba(120,53,15,0.5)" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(217,119,6,0.12)"; e.currentTarget.style.color = ACCENT_BRIGHT; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "rgba(217,119,6,0.06)"; e.currentTarget.style.color = "rgba(217,119,6,0.7)"; }}>
                          ◆ {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <style>{`
                  .zk-md p { margin: 0.5em 0; line-height: 1.6; }
                  .zk-md ul, .zk-md ol { margin: 0.5em 0; padding-left: 1.4em; }
                  .zk-md li { margin: 0.2em 0; }
                  .zk-md h1, .zk-md h2, .zk-md h3 { font-weight: 700; margin: 0.8em 0 0.3em; color: #fff; line-height: 1.3; }
                  .zk-md h1 { font-size: 1.05em; } .zk-md h2 { font-size: 0.98em; } .zk-md h3 { font-size: 0.9em; }
                  .zk-md code { background: rgba(255,255,255,0.1); padding: 1px 5px; border-radius: 4px; font-size: 0.85em; font-family: monospace; }
                  .zk-md pre { background: rgba(0,0,0,0.4); padding: 0.7em; border-radius: 8px; overflow-x: auto; margin: 0.5em 0; }
                  .zk-md pre code { background: none; padding: 0; }
                  .zk-md a { color: #fbbf24; text-decoration: underline; }
                  .zk-md strong { color: #fff; font-weight: 700; }
                  .zk-md blockquote { border-left: 3px solid rgba(245,158,11,0.4); padding-left: 0.9em; margin: 0.5em 0; opacity: 0.7; }
                  .zk-md hr { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 0.8em 0; }
                `}</style>
                <div className="max-w-3xl mx-auto px-6 space-y-5">
                  {messages.map((m, i) => {
                    if (m.role === "plan") return <AgentPlanChecklist key={i} plan={m.plan} />;
                    if (m.role === "reasoning") return <AgentReasoningBubble key={i} msg={m} />;
                    const isUser = m.role === "user";
                    return (
                      <div key={i} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                        {!isUser && (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[11px] font-bold"
                            style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000" }}>ZK</div>
                        )}
                        <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-[13.5px] leading-relaxed`}
                          style={{
                            background: isUser ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${isUser ? "rgba(245,158,11,0.25)" : "rgba(255,255,255,0.08)"}`,
                            color: isUser ? "#fbbf24" : "rgba(255,255,255,0.9)",
                          }}>
                          {isUser
                            ? <p className="whitespace-pre-wrap">{m.content}</p>
                            : <ReactMarkdown className="zk-md">{m.content}</ReactMarkdown>}
                          {!m.content && i === messages.length - 1 && loading && (
                            <div className="flex gap-1.5 py-1">{[0,1,2].map(j => <div key={j} className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#f59e0b", animationDelay: `${j*0.15}s` }} />)}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {(agentSteps.length > 0 || agentRunning) && (
                    <div style={{ border: `2px solid ${ACCENT}`, boxShadow: "3px 3px 0px #78350f" }}>
                      <AgentStepLog steps={agentSteps} running={agentRunning} />
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              </div>

              {/* Input bar — forge style */}
              <div className="px-6 py-2 flex-shrink-0" style={{ borderTop: `3px solid ${ACCENT}`, background: "linear-gradient(0deg, #1c1c1c 0%, #111 100%)" }}>
                <div className="max-w-3xl mx-auto">
                  <div className="flex items-center gap-3 px-3 py-2"
                    style={{ background: "rgba(0,0,0,0.4)", border: `2px solid ${input.trim() ? ACCENT : "rgba(217,119,6,0.3)"}`, boxShadow: input.trim() ? `3px 3px 0px #78350f` : "none" }}>
                    <span className="text-[14px] font-black flex-shrink-0" style={{ color: ACCENT, fontFamily: FONT }}>▶</span>
                    <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                      placeholder="ENTER COMMAND..."
                      className="flex-1 bg-transparent text-[13px] outline-none font-bold uppercase tracking-wider"
                      style={{ color: ACCENT_BRIGHT, caretColor: ACCENT, fontFamily: FONT_BODY }} />
                    <button onClick={() => send()} disabled={loading || !input.trim()}
                      className="px-4 py-2 text-[11px] font-black uppercase tracking-wider disabled:opacity-30 transition-all flex-shrink-0"
                      style={{ border: `2px solid ${ACCENT}`, color: "#000", background: input.trim() ? ACCENT : "transparent", boxShadow: input.trim() ? "2px 2px 0px #78350f" : "none", fontFamily: FONT }}>
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: input.trim() ? "#000" : ACCENT }} /> : "SEND"}
                    </button>
                  </div>
                  <div className="mt-1.5 text-[9px] font-black tracking-[0.3em] uppercase" style={{ color: "rgba(217,119,6,0.25)", fontFamily: FONT }}>◆ ZK UNIT · ALL SYSTEMS LINKED</div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* APPS TAB */}
        {activeTab === "apps" && (
          <div className="flex-1 flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
            <div className="max-w-3xl mx-auto w-full px-6 pt-5 pb-3">
              <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: "rgba(0,0,0,0.3)", border: `2px solid rgba(217,119,6,0.4)` }}>
                <Search className="w-4 h-4 flex-shrink-0" style={{ color: ACCENT }} />
                <input value={appSearch} onChange={e => setAppSearch(e.target.value)}
                  placeholder="SEARCH APPS..."
                  className="flex-1 text-[13px] bg-transparent outline-none font-bold uppercase tracking-wider"
                  style={{ color: ACCENT_BRIGHT, caretColor: ACCENT, fontFamily: FONT_BODY }} />
                {appSearch && <button onClick={() => setAppSearch("")} style={{ color: "rgba(217,119,6,0.5)" }}><X className="w-3.5 h-3.5" /></button>}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-6 pb-6">
                <div className="grid grid-cols-5 sm:grid-cols-7 gap-3">
                  {filteredApps.map(app => (
                    <Link key={app.path} to={createPageUrl(app.path)} className="flex flex-col items-center gap-1.5 group">
                      <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.93 }}
                        className="w-14 h-14 overflow-hidden relative"
                        style={{ border: `2px solid rgba(217,119,6,0.3)`, boxShadow: "2px 2px 0px rgba(0,0,0,0.5)" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.boxShadow = `2px 2px 0px #78350f`; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(217,119,6,0.3)"; e.currentTarget.style.boxShadow = "2px 2px 0px rgba(0,0,0,0.5)"; }}>
                        {app.logo
                          ? <img src={app.logo} alt={app.name} className="w-full h-full object-cover" loading="lazy" style={{ filter: "saturate(0.8) brightness(0.9)" }} />
                          : <div className="w-full h-full flex items-center justify-center" style={{ background: "rgba(217,119,6,0.08)" }}><LayoutGrid className="w-5 h-5" style={{ color: ACCENT }} /></div>}
                      </motion.div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-center truncate w-full" style={{ color: "rgba(217,119,6,0.55)", fontFamily: FONT }}>{app.name}</span>
                    </Link>
                  ))}
                </div>
                {filteredApps.length === 0 && <div className="text-center py-12 text-[12px] font-black uppercase tracking-widest" style={{ color: "rgba(217,119,6,0.3)", fontFamily: FONT }}>◆ NO UNITS FOUND ◆</div>}
              </div>
            </div>
          </div>
        )}

        {/* IMAGE TAB */}
        {activeTab === "image" && (
          <div className="flex-1 flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
            <div className="max-w-2xl mx-auto w-full px-6 pt-8 pb-4 flex flex-col gap-4 flex-1">
              <div className="text-[14px] font-black tracking-[0.2em] uppercase flex items-center gap-2" style={{ color: ACCENT_BRIGHT, fontFamily: FONT }}>
                <div className="w-3 h-3" style={{ background: ACCENT, clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />
                FORGE IMAGE GENERATOR
              </div>
              <textarea value={imagePrompt} onChange={e => setImagePrompt(e.target.value)}
                placeholder="DESCRIBE YOUR IMAGE..."
                rows={4}
                className="w-full px-4 py-3 text-[13px] outline-none resize-none font-bold uppercase tracking-wide"
                style={{ background: "rgba(0,0,0,0.4)", border: `2px solid rgba(217,119,6,0.3)`, color: ACCENT_BRIGHT, caretColor: ACCENT, fontFamily: FONT_BODY }} />
              <button onClick={generateImage} disabled={generatingImage || !imagePrompt.trim()}
                className="py-3 text-[13px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
                style={{ border: `2px solid ${ACCENT}`, color: "#000", background: generatingImage ? "rgba(217,119,6,0.5)" : ACCENT, boxShadow: "4px 4px 0px #78350f", fontFamily: FONT }}>
                {generatingImage ? <><Loader2 className="w-4 h-4 animate-spin" /> FORGING...</> : <><Sparkles className="w-4 h-4" /> FORGE IMAGE</>}
              </button>
              <div className="flex-1 overflow-y-auto">
                {generatedImage && (
                  <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{ border: `2px solid ${ACCENT}`, boxShadow: "4px 4px 0px #78350f" }}>
                    <img src={generatedImage} alt="Generated" className="w-full" />
                    <a href={generatedImage} download target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 py-3 text-[11px] font-black uppercase tracking-widest transition-colors"
                      style={{ color: ACCENT, borderTop: `2px solid ${ACCENT}`, background: "rgba(217,119,6,0.06)", fontFamily: FONT }}>
                      ▼ DOWNLOAD UNIT
                    </a>
                  </motion.div>
                )}
                {!generatedImage && !generatingImage && (
                  <div className="flex flex-col items-center justify-center h-48" style={{ color: "rgba(217,119,6,0.25)" }}>
                    <ImageIcon className="w-12 h-12 mb-3 opacity-30" />
                    <span className="text-[11px] font-black uppercase tracking-widest" style={{ fontFamily: FONT }}>◆ AWAITING ORDER ◆</span>
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
function MusicPlayer({ isPlaying, onToggle, onClose, onEnter, elapsed, setElapsed, onSeek }) {
  const [scrolled, setScrolled] = useState(false);

  // Unlock the "Enter" button once the song is past the halfway mark
  useEffect(() => {
    if (elapsed / SONG_DURATION > 0.5) setScrolled(true);
  }, [elapsed]);

  const formatTime = (s) => { const m = Math.floor(s / 60); const sec = Math.floor(s % 60); return `${m}:${sec.toString().padStart(2, "0")}`; };
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
          <style>{`
            .kas-tunes-slider { -webkit-appearance: none; appearance: none; }
            .kas-tunes-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #fff; border: 2px solid #f97316; box-shadow: 0 1px 5px rgba(0,0,0,0.25); cursor: pointer; }
            .kas-tunes-slider::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: #fff; border: 2px solid #f97316; box-shadow: 0 1px 5px rgba(0,0,0,0.25); cursor: pointer; }
          `}</style>
          <input type="range" min={0} max={SONG_DURATION} value={elapsed}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="kas-tunes-slider w-full"
            style={{ height: "4px", borderRadius: "9999px", outline: "none", cursor: "pointer",
              background: `linear-gradient(to right, #f97316 0%, #ec4899 ${progress}%, rgba(0,0,0,0.08) ${progress}%, rgba(0,0,0,0.08) 100%)` }} />
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-slate-400">{formatTime(elapsed)}</span>
            <span className="text-[9px] text-slate-400">3:12</span>
          </div>
        </div>
        <div className="px-4 pb-2">
          <div className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase mb-2">Lyrics</div>
          <LyricsTracker elapsed={elapsed} onScrolledToBottom={() => setScrolled(true)} />
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

// === GTA SOUND EFFECT ===
const GTA_SOUND_URL = "https://media.base44.com/files/public/6901295fa9bcfaa0f5ba2c2a/e5aa22c46_gta-menu.mp3";

function useGameSounds() {
  const play = () => {
    try {
      const audio = new Audio(GTA_SOUND_URL);
      audio.volume = 0.7;
      audio.play().catch(() => {});
    } catch {}
  };

  return { playSelect: play, playHover: () => {}, playStartup: () => {}, playNavigate: play };
}

export default function TTTLandingPage() {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [hasStartedMusic, setHasStartedMusic] = React.useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [showChest, setShowChest] = useState(false);
  const [showZKChat, setShowZKChat] = useState(false);
  const [zkMinimized, setZkMinimized] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const sounds = useGameSounds();

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setIsAdmin(me?.role === "admin");
      } catch {
        setIsAdmin(false);
      }
    })();
  }, []);

  const playerRef = React.useRef(null);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const musicSrc = `https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?enablejsapi=1&autoplay=1&playsinline=1&controls=0&rel=0&origin=${origin}`;



  // === REAL-TIME LYRICS SYNC ===
  // The YouTube player reports its true playback position via "infoDelivery"
  // messages; we snap `elapsed` to it so lyrics stay locked to the actual audio
  // instead of a drifting 1-second timer.
  useEffect(() => {
    const handler = (e) => {
      const data = e.data;
      if (data && data.event === "infoDelivery" && data.info && typeof data.info.currentTime === "number") {
        setElapsed(data.info.currentTime);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // While playing: subscribe to player info, request the true current time, and
  // advance smoothly between responses (the real-time snaps above correct drift).
  useEffect(() => {
    if (!hasStartedMusic || !isPlaying) return;
    const interval = setInterval(() => {
      const w = playerRef.current?.contentWindow;
      if (w) {
        w.postMessage(JSON.stringify({ event: "listening" }), "*");
        w.postMessage(JSON.stringify({ event: "command", func: "getCurrentTime", args: [] }), "*");
      }
      setElapsed(prev => (prev >= SONG_DURATION ? SONG_DURATION : prev + 0.25));
    }, 250);
    return () => clearInterval(interval);
  }, [hasStartedMusic, isPlaying]);

  const sendPlayerCommand = (command) => {
    playerRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: command, args: [] }), "*");
  };

  const handleSeek = (seconds) => {
    playerRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "seekTo", args: [seconds, true] }), "*");
    setElapsed(seconds);
  };

  const handlePlayButton = () => {
    sounds.playSelect();
    if (!hasStartedMusic) { setHasStartedMusic(true); setIsPlaying(true); }
    else { sendPlayerCommand(isPlaying ? "pauseVideo" : "playVideo"); setIsPlaying(!isPlaying); }
    setShowPlayer(true);
  };

  const handleClosePlayer = () => { sendPlayerCommand("pauseVideo"); setIsPlaying(false); setShowPlayer(false); };
  const toggleMusicFromPlayer = () => { sendPlayerCommand(isPlaying ? "pauseVideo" : "playVideo"); setIsPlaying(!isPlaying); };

  return (
    <main className="relative min-h-screen overflow-hidden text-white" style={{ background: "#000", fontFamily: "'Georgia', serif" }}>

      {/* === 3D CYBERNETIC EYE SPHERE BACKGROUND === */}
      <CyberneticEyeSphere />

      {/* === LAYERED ATMOSPHERIC OVERLAYS === */}
      {/* Deep black vignette edges */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 20%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.95) 100%)" }} />
      {/* Heavy bottom fade for menu area */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0.4) 65%, transparent 100%)" }} />
      {/* Top fade */}
      <div className="absolute inset-x-0 top-0 h-1/3 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)" }} />
      {/* Scanlines overlay — CRT feel */}
      <div className="absolute inset-0 pointer-events-none opacity-20"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.5) 0px, rgba(0,0,0,0.5) 1px, transparent 1px, transparent 3px)", backgroundSize: "100% 3px" }} />
      {/* Subtle noise grain */}
      <div className="absolute inset-0 pointer-events-none opacity-5"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: "128px 128px" }} />

      {/* === CORNER HUD BUTTONS (top) === */}
      <motion.button whileTap={{ scale: 0.92 }} onClick={() => { sounds.playSelect(); setShowChest(true); }}
        className="absolute left-4 top-5 focus:outline-none z-20">
        <span className="text-[10px] tracking-[0.25em] uppercase px-3 py-1.5 block"
          style={{ border: "1px solid rgba(180,140,60,0.4)", color: "rgba(200,160,70,0.6)", background: "rgba(0,0,0,0.5)", fontFamily: "monospace" }}>[ CHEST ]</span>
      </motion.button>
      {isAdmin && (
        <motion.button whileTap={{ scale: 0.92 }} onClick={() => { sounds.playSelect(); setShowZKChat(true); setZkMinimized(false); }}
          className="absolute right-4 top-5 focus:outline-none z-20">
          <span className="text-[10px] tracking-[0.25em] uppercase px-3 py-1.5 block"
            style={{ border: "1px solid rgba(180,140,60,0.4)", color: "rgba(200,160,70,0.6)", background: "rgba(0,0,0,0.5)", fontFamily: "monospace" }}>[ SCAN ]</span>
        </motion.button>
      )}

      {/* Hidden iframe for music */}
      <iframe ref={playerRef} title="TTT Music" src={hasStartedMusic ? musicSrc : "about:blank"}
        allow="autoplay; encrypted-media" className="pointer-events-none absolute h-px w-px opacity-0" />

      {/* === MAIN GAME TITLE SCREEN CONTENT === */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-10 text-center">

        {/* CENTERED CONTENT BLOCK */}
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center flex-1">
          <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.4, ease: "easeOut" }}>
            {/* Decorative line above */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-px w-16 sm:w-24" style={{ background: "linear-gradient(90deg, transparent, rgba(200,150,40,0.5))" }} />
              <div className="text-[9px] tracking-[0.5em] uppercase" style={{ color: "rgba(200,150,40,0.4)", fontFamily: "monospace" }}>EST. 2024</div>
              <div className="h-px w-16 sm:w-24" style={{ background: "linear-gradient(90deg, rgba(200,150,40,0.5), transparent)" }} />
            </div>

            {/* Giant Title — clickable */}
            <motion.button type="button" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={() => { sounds.playSelect(); navigate("/TTTV3"); }}
              className="text-[72px] sm:text-[96px] md:text-[120px] font-black leading-none select-none focus:outline-none cursor-pointer"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif",
                background: "linear-gradient(180deg, #fff5cc 0%, #f0d060 25%, #c8960c 60%, #6b4200 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                filter: "drop-shadow(0 0 60px rgba(200,140,0,0.5)) drop-shadow(0 8px 16px rgba(0,0,0,0.9))",
                letterSpacing: "-0.02em" }}>
              TTT
            </motion.button>

            {/* Subtitle tagline */}
            <div className="text-[11px] sm:text-[12px] tracking-[0.6em] uppercase mt-2 mb-1"
              style={{ color: "rgba(210,165,60,0.7)", fontFamily: "monospace" }}>
              TAP · TO · TIP
            </div>
            <div className="text-[9px] sm:text-[10px] tracking-[0.3em]"
              style={{ color: "rgba(160,120,50,0.45)", fontFamily: "monospace" }}>
              地球到火星 · POWERED BY KASPA
            </div>
          </motion.div>
        </div>

        {/* BOTTOM — MENU */}
        <div className="flex flex-col items-center w-full px-4 pb-8">

          {/* PRESS START — pulsing */}
          <motion.button type="button" onClick={handlePlayButton}
            animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            className="mb-6 text-[13px] sm:text-[14px] tracking-[0.5em] uppercase focus:outline-none"
            style={{ color: "#f5d050", fontFamily: "monospace", background: "transparent", border: "none",
              textShadow: "0 0 24px rgba(245,200,50,0.7), 0 0 50px rgba(200,130,0,0.4)" }}>
            {showPlayer ? (isPlaying ? "▌▌  PAUSE" : "▶  PLAY") : "▶  PRESS START"}
          </motion.button>

          {/* Divider */}
          <div className="w-48 sm:w-56 h-px mb-4" style={{ background: "linear-gradient(90deg, transparent, rgba(200,150,40,0.35), transparent)" }} />

          {/* MENU ITEMS — horizontal buttons */}
          <div className="w-full flex flex-row justify-center gap-2 sm:gap-3 flex-wrap">
            {[
              { label: "TAP", path: "/AppStoreV2" },
              { label: "TO", path: "/Feed" },
              { label: "TIP", path: "/Tip" },
              { label: "GATE", path: "/TTTGate", iconOnly: true, icon: Gem },
              { label: "WALLET", path: "/WalletHub", iconOnly: true, icon: "kaspa" },
              { label: "ZK", path: "/SuperZK" },
            ].map((item, i) => {
              const isHovered = hoveredItem === item.label;
              const Icon = typeof item.icon === 'string' ? null : item.icon;
              const isKaspa = item.icon === "kaspa";
              return (
                <motion.button key={item.label} type="button"
                  onClick={() => { sounds.playNavigate(); item.action ? item.action() : navigate(item.path); }}
                  onMouseEnter={() => { setHoveredItem(item.label); sounds.playHover(); }}
                  onMouseLeave={() => setHoveredItem(null)}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 + i * 0.07 }}
                  className="px-6 py-3 transition-all focus:outline-none flex items-center justify-center"
                  style={{
                    border: isHovered ? "2px solid rgba(240,200,60,0.8)" : "2px solid rgba(200,150,40,0.3)",
                    background: isHovered ? "rgba(200,150,40,0.12)" : "transparent",
                  }}>
                  {item.iconOnly ? (
                    isKaspa ? (
                      <img src={KASPA_LOGO} alt="KASPA" className="w-6 h-6 object-contain" style={{ filter: isHovered ? "brightness(1.2)" : "brightness(0.8) saturate(0.8)" }} />
                    ) : (
                      <Icon className="w-5 h-5" style={{ color: isHovered ? "#f5d050" : "rgba(215,170,80,0.6)" }} />
                    )
                  ) : (
                    <span className="text-[14px] tracking-[0.3em] uppercase font-bold block"
                      style={{ fontFamily: "monospace", color: isHovered ? "#f5d050" : "rgba(215,170,80,0.8)",
                        textShadow: isHovered ? "0 0 16px rgba(240,200,60,0.6)" : "none", transition: "all 0.15s" }}>
                      {item.label}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Bottom stamp */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}
            className="mt-6 text-[9px] tracking-[0.45em] uppercase"
            style={{ color: "rgba(120,90,25,0.3)", fontFamily: "monospace" }}>
            © TTT PLATFORM · V3.0
          </motion.div>
        </div>
      </section>

      {/* Music Player popup */}
      <AnimatePresence>
        {showPlayer && (
          <MusicPlayer isPlaying={isPlaying} onToggle={toggleMusicFromPlayer} onClose={handleClosePlayer}
            onEnter={() => navigate("/TTTGate")} elapsed={elapsed} setElapsed={setElapsed} onSeek={handleSeek} />
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

      {/* VISION BUTTON — bottom left */}
      <motion.button whileTap={{ scale: 0.92 }} onClick={() => { sounds.playSelect(); navigate("/Vision"); }}
        className="absolute left-4 bottom-5 focus:outline-none z-20">
        <span className="text-[10px] tracking-[0.25em] uppercase px-3 py-1.5 block"
          style={{ border: "1px solid rgba(180,140,60,0.4)", color: "rgba(200,160,70,0.6)", background: "rgba(0,0,0,0.5)", fontFamily: "monospace" }}>[ VISION ]</span>
      </motion.button>

      {/* Chest Modal */}
      {showChest && <ChestModal onClose={() => setShowChest(false)} sounds={sounds} />}
    </main>
  );
}