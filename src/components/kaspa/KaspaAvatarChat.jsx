import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Minus, Settings, ImagePlus, FileImage } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ReactMarkdown from "react-markdown";
import { setKaSshiGlobal, markKaSshiInlineVisited } from "@/components/KaSshiPlayer";
import AgentBrowserPanel from "@/components/feed/AgentBrowserPanel";

const KAI_THINKING_PHRASES = [
  "Scanning the blockDAG…",
  "Consulting the GHOSTDAG…",
  "Mining some knowledge…",
  "Checking the mempool…",
  "Traversing the DAG…",
  "Processing blocks…",
  "Syncing with Kaspa nodes…",
  "Thinking at 10 BPS…",
  "Querying the network…",
  "Reading the chain…",
];

function KAIBlocksAnimation() {
  return (
    <div className="flex items-end gap-[3px] h-[14px] flex-shrink-0">
      {[0, 1, 2, 3, 4].map(i => (
        <div
          key={i}
          className="w-[3px] rounded-sm"
          style={{
            background: `linear-gradient(to top, rgba(6,182,212,0.9), rgba(139,92,246,0.9))`,
            animation: `kai-blocks 1.2s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
      <style>{`@keyframes kai-blocks { 0%,100% { height: 4px; opacity: 0.4; } 50% { height: 14px; opacity: 1; } }`}</style>
    </div>
  );
}

function KAIThinkingBubble() {
  const [phrase, setPhrase] = useState(() => KAI_THINKING_PHRASES[Math.floor(Math.random() * KAI_THINKING_PHRASES.length)]);
  useEffect(() => {
    const interval = setInterval(() => {
      setPhrase(KAI_THINKING_PHRASES[Math.floor(Math.random() * KAI_THINKING_PHRASES.length)]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex justify-start">
      <div className="px-3 py-2 rounded-2xl rounded-bl-md flex items-center gap-2 text-[12px]"
        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(6,182,212,0.8)" }}>
        <KAIBlocksAnimation />
        <span className="italic">{phrase}</span>
      </div>
    </div>
  );
}

const STORAGE_KEY = "kaspa_avatar_video_url";
const DEFAULT_AVATAR_IMG = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/13e8ec094_image.png";
const DEFAULT_VIDEO_URL = "https://base44.app/api/apps/6901295fa9bcfaa0f5ba2c2a/files/mp/public/6901295fa9bcfaa0f5ba2c2a/603409cb0_animation1.mp4";

const KAI_FACTS = [
  "Kaspa runs at 10 BPS — live! 🔷",
  "blockDAG = parallel blocks ⚡",
  "No premine. No ICO. Fair launch.",
  "10 blocks per second, 1s finality!",
  "GHOSTDAG orders all blocks 🧠",
  "kHeavyHash = optical GPU mining ⛏️",
  "KRC-20 tokens are live on Kaspa",
  "32 BPS target on the roadmap 🚀",
  "Rusty Kaspa node rewrite is live",
  "Kaspa = fastest PoW crypto",
  "DAGKnight consensus is coming",
  "Kaspa smart contracts in development",
];

const TTT_APP_DOCS = `TTT PLATFORM — COMPLETE APP DIRECTORY (use these exact descriptions):
- TTT Feed: Community social feed — posts, comments, media uploads, KAS tipping (including KRC-20 multi-token tips), Kaspa stamps, likes, threaded replies
- Agent ZK: Cryptographic wallet-based identity system — users verify ownership of Kasware, MetaMask, and TTT wallets to create a DAGKnight certificate. NOT an AI agent.
- TTTV: Built-in media browser and YouTube player — watch videos ad-free inside TTT. NOT for creating content.
- Send KAS (Bridge): Transfer KAS between L1 (Kasware) and L2 (Kasplex/MetaMask). Cross-layer bridge.
- StakeDAG: Prediction markets with escrow — bet on outcomes using KAS
- KA-CHING: Automated betting engine with live games and rounds
- DAGKnight Wallet: Advanced multi-wallet management with verification DAG and blue-score system
- Hikaru: AI image generation studio — generate images from text prompts. This is for IMAGE GENERATION.
- Xunhua: AI sketch-to-image studio — draw on a canvas and AI renders it into a full image. This is for DRAWING + AI rendering.
- Zeku AI: Premium AI assistant with advanced capabilities
- Terra: Kaspa WALLET manager — create wallets from mnemonic seed phrases, manage multiple wallets, send/receive KAS, view KRC-20 tokens, check balances. Terra is a WALLET app, NOT for image generation or AI.
- App Store: 80+ community-built apps and tools
- Encrypted Notepad: Private encrypted notes secured by your identity
- NFT Mint: Create and mint NFTs on Kaspa
- Stamped News: Blockchain-verified news publishing with Kasware signatures
- Bull Reels: Short-form video content feed
- Kaspa Node Map: Visual map of Kaspa network nodes worldwide
- K-University / KaSkool / Courses: Educational platform for learning about Kaspa and crypto
- Shop: Buy items with KAS
- Marketplace: P2P marketplace for buying/selling with KAS
- TTT ID: Register a unique identity tied to your Kaspa wallet
- DAG Feed: Alternative feed focused on DAG-related content
- Global History: Track global Kaspa network transactions toward milestones
- Arcade: Games including Tetris Battle, Bingo, PacMan
- KivR: IVR/phone system with Kaspa wallet integration
- Canvas: Template design studio
- Countdown: Kaspa milestone countdown timer
- Profile: User profile management
- Categories: Customizable app dashboard with drag-and-drop organization
- Subscription: Premium subscription management
- Prompto: AI prompt engineering tool
- Cinekas: Movie/cinema browser
- Speed: Quick image generation
- Farlands: Exploration game
- Klock: Clock/timer utility
- Security Audit: App security scanning tool
- Window: Embedded web browser
- Freedom: Privacy-focused tools
- Voxa: Voice/audio tools
- V1: Legacy version viewer

IMPORTANT CORRECTIONS — DO NOT CONFUSE THESE:
- Terra = WALLET (seed phrases, send KAS, KRC-20 tokens). NOT image generation.
- Hikaru = AI IMAGE generation from text. NOT a wallet.
- Xunhua = AI SKETCH-to-image (canvas drawing). NOT a wallet.
- Agent ZK = IDENTITY verification. NOT an AI chatbot.
- Zeku AI = Premium AI ASSISTANT. Different from Agent ZK.
- TTTV = VIDEO player/browser. NOT for creating videos.`;

const IMAGE_KEYWORDS = [
  'draw', 'sketch', 'paint', 'create image', 'generate image', 'make image',
  'make a picture', 'create a picture', 'design', 'illustrate', 'artwork',
  "let's draw", 'lets draw', 'can you draw', 'draw me', 'draw a', 'draw an',
  'show me', 'visualize', 'picture of', 'image of', 'art of', 'xunhua'
];
const SEARCH_KEYWORDS = [
  'search', 'google', 'look up', 'lookup', 'find out', 'who is',
  'when did', 'price of', 'latest news',
  'news about', 'search for', 'research'
];
const FEED_KEYWORDS = [
  'ttt feed', 'latest posts', 'recent posts', 'whats on the feed',
  "what's on the feed", 'check feed', 'examine feed', 'what are people saying',
  'community posts', 'ttt posts', 'show me the feed'
];
const USER_POST_KEYWORDS = [
  'posts by', 'analyze user', 'user posts',
  'examine posts', 'who posted', 'show me posts from', 'check posts'
];

// App directory for "open X" detection
const APP_DIRECTORY = [
  { names: ['hikaru'], path: 'Hikaru', label: 'Hikaru 🖼️', desc: 'AI image generation studio' },
  { names: ['xunhua', 'xùnhuà'], path: 'Xunhua', label: 'Xunhua 🎨', desc: 'AI sketch-to-image studio' },
  { names: ['terra'], path: 'Terra', label: 'Terra 💰', desc: 'Kaspa wallet manager' },
  { names: ['feed', 'ttt feed'], path: 'Feed', label: 'TTT Feed 📝', desc: 'Community social feed' },
  { names: ['agent zk', 'agentzk', 'zk'], path: 'AgentZK', label: 'Agent ZK 🔐', desc: 'Cryptographic identity system' },
  { names: ['bridge', 'send kas'], path: 'Bridge', label: 'Send KAS 🌉', desc: 'Transfer KAS between L1/L2' },
  { names: ['stakedag', 'stake dag', 'prediction'], path: 'StakeDAG', label: 'StakeDAG 🎯', desc: 'Prediction markets' },
  { names: ['dagknight', 'dag knight'], path: 'DAGKnightWallet', label: 'DAGKnight ⚔️', desc: 'Advanced multi-wallet' },
  { names: ['zeku', 'zeku ai'], path: 'ZekuAI', label: 'Zeku AI 🤖', desc: 'Premium AI assistant' },
  { names: ['tttv', 'browser', 'tv'], path: 'Browser', label: 'TTTV 📺', desc: 'Media browser & player' },
  { names: ['arcade', 'games'], path: 'Arcade', label: 'Arcade 🎮', desc: 'Games & entertainment' },
  { names: ['shop'], path: 'Shop', label: 'Shop 🛒', desc: 'Buy items with KAS' },
  { names: ['marketplace'], path: 'Marketplace', label: 'Marketplace 🏪', desc: 'P2P marketplace' },
  { names: ['nft', 'nft mint', 'mint'], path: 'NFTMint', label: 'NFT Mint 🏆', desc: 'Create & mint NFTs' },
  { names: ['wallet'], path: 'Wallet', label: 'Wallet 👛', desc: 'Kaspa wallet' },
  { names: ['profile'], path: 'Profile', label: 'Profile 👤', desc: 'User profile' },
  { names: ['app store', 'appstore', 'apps'], path: 'AppStore', label: 'App Store 📱', desc: '80+ community apps' },
  { names: ['courses', 'university', 'learn', 'kaskool'], path: 'Courses', label: 'Courses 📚', desc: 'Kaspa education' },
  { names: ['countdown'], path: 'Countdown', label: 'Countdown ⏰', desc: 'Kaspa milestone timer' },
  { names: ['analytics'], path: 'Analytics', label: 'Analytics 📊', desc: 'Platform analytics' },
  { names: ['subscription', 'premium'], path: 'Subscription', label: 'Subscription 👑', desc: 'Premium subscription' },
  { names: ['settings'], path: 'Settings', label: 'Settings ⚙️', desc: 'App settings' },
  { names: ['canvas'], path: 'Canvas', label: 'Canvas 🎨', desc: 'Template design studio' },
  { names: ['prompto', 'prompt'], path: 'Prompto', label: 'Prompto ✍️', desc: 'AI prompt engineering' },
  { names: ['cinekas', 'movies'], path: 'Cinekas', label: 'Cinekas 🎬', desc: 'Movie browser' },
  { names: ['speed'], path: 'Speed', label: 'Speed ⚡', desc: 'Quick image generation' },
  { names: ['security', 'audit'], path: 'SecurityAudit', label: 'Security Audit 🔒', desc: 'Security scanning' },
  { names: ['dag feed'], path: 'DAGFeed', label: 'DAG Feed 🌐', desc: 'DAG-focused content feed' },
  { names: ['global history', 'history'], path: 'GlobalHistory', label: 'Global History 🕐', desc: 'Global transaction tracker' },
  { names: ['area 51', 'area51'], path: 'Area51', label: 'Area 51 👽', desc: 'Experimental zone' },
  { names: ['voxa', 'voice'], path: 'Voxa', label: 'Voxa 🎤', desc: 'Voice/audio tools' },
  { names: ['freedom'], path: 'Freedom', label: 'Freedom 🕊️', desc: 'Privacy tools' },
  { names: ['farlands'], path: 'Farlands', label: 'Farlands 🌍', desc: 'Exploration game' },
  { names: ['klock', 'clock'], path: 'Klock', label: 'Klock 🕐', desc: 'Clock/timer' },
  { names: ['categories'], path: 'Categories', label: 'Categories 📂', desc: 'App dashboard' },
  { names: ['kivr', 'phone'], path: 'KivR', label: 'KivR 📞', desc: 'IVR/phone system' },
  { names: ['kaspa node', 'node map'], path: 'KaspaNodeMap', label: 'Node Map 🗺️', desc: 'Kaspa network node map' },
  { names: ['what is kaspa', 'kaspa info'], path: 'WhatIsKaspa', label: 'What is Kaspa 📖', desc: 'Kaspa education page' },
];

// Fetch live Kaspa context from external knowledge base
const fetchKaspaContext = async (userMessage) => {
  try {
    const encoded = encodeURIComponent(userMessage);
    const res = await fetch(`https://kaspa-b3ad561a.base44.app/functions/kaspaContext?format=prompt&limit=30&q=${encoded}`);
    if (res.ok) {
      const text = await res.text();
      return text.trim();
    }
  } catch {}
  return '';
};

const isExplorerRequest = (msg) => {
  const trimmed = msg.trim();
  // Only trigger for actual hashes, addresses, or explicit network stats commands
  if (/^[a-f0-9]{64}$/i.test(trimmed)) return true;
  if (trimmed.startsWith('kaspa:')) return true;
  if (/\b[a-f0-9]{64}\b/i.test(trimmed)) return true;
  if (/(kaspa:[a-z0-9]{10,})/i.test(trimmed)) return true;
  // Only very explicit network stats requests
  const lower = msg.toLowerCase();
  const explicitNetworkPhrases = ['network stats', 'kaspa stats', 'show hashrate', 'show coin supply', 'kaspa network info'];
  return explicitNetworkPhrases.some(kw => lower.includes(kw));
};

const detectExplorerAction = (msg) => {
  const trimmed = msg.trim();
  if (/^[a-f0-9]{64}$/i.test(trimmed)) return { action: 'transaction', query: trimmed };
  if (trimmed.startsWith('kaspa:')) return { action: 'address', query: trimmed };
  const addrMatch = trimmed.match(/(kaspa:[a-z0-9]{10,})/i);
  if (addrMatch) return { action: 'address', query: addrMatch[1] };
  const txMatch = trimmed.match(/\b([a-f0-9]{64})\b/i);
  if (txMatch) return { action: 'transaction', query: txMatch[1] };
  const lower = msg.toLowerCase();
  if (['network stats', 'kaspa stats', 'show hashrate', 'show coin supply', 'kaspa network info'].some(kw => lower.includes(kw))) {
    return { action: 'network', query: '' };
  }
  return null;
};

const TRAIN_KEYWORDS = [
  'train yourself', 'train on this', 'learn this', 'study this', 'read this',
  'watch this', 'ingest this', 'memorize this', 'remember this', 'learn from',
  'train on', 'study from', 'read from', 'learn about this', 'absorb this',
];

const BRAIN_KEYWORDS = [
  'what do you know', 'show me your brain', 'show your brain', 'your knowledge',
  'what have you learned', 'your memory', 'show memory', 'list knowledge',
  'what did you learn', 'knowledge base',
];

const BROWSE_KEYWORDS = [
  'browse', 'search for', 'look up', 'lookup', 'go to site', 'open link',
  'open site', 'open website', 'navigate to site', 'visit', 'load site',
  'google', 'find me', 'check out site', 'show me site'
];

const isUrlInput = (text) => /^(https?:\/\/|www\.)/i.test(text.trim());

const isBrowseRequest = (msg) => {
  if (isUrlInput(msg)) return true;
  const lower = msg.toLowerCase().trim();
  return BROWSE_KEYWORDS.some(kw => lower.startsWith(kw) || lower.includes(kw));
};

const getBrowseUrl = (msg) => {
  const trimmed = msg.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^www\./i.test(trimmed)) return `https://${trimmed}`;
  const urlMatch = trimmed.match(/(https?:\/\/[^\s]+)/i);
  if (urlMatch) return urlMatch[1];
  const wwwMatch = trimmed.match(/(www\.[^\s]+)/i);
  if (wwwMatch) return `https://${wwwMatch[1]}`;
  const query = trimmed
    .replace(/^(browse|search for|look up|lookup|go to site|open link|open site|open website|navigate to site|visit|load site|google|find me|check out site|show me site)\s*/i, '')
    .trim();
  if (!query) return "https://kaspa-app-9cc9fe40.base44.app";
  return `https://www.google.com/search?igu=1&q=${encodeURIComponent(query)}`;
};

const detectOpenApp = (msg) => {
  const lower = msg.toLowerCase().trim();
  // Match patterns: "open X", "go to X", "take me to X", "launch X", "navigate to X"
  const openPatterns = [/^open\s+(.+)$/i, /^go\s+to\s+(.+)$/i, /^take\s+me\s+to\s+(.+)$/i, /^launch\s+(.+)$/i, /^navigate\s+to\s+(.+)$/i, /^start\s+(.+)$/i];
  for (const pattern of openPatterns) {
    const match = lower.match(pattern);
    if (match) {
      const appName = match[1].trim().replace(/[?.!]/g, '');
      for (const app of APP_DIRECTORY) {
        if (app.names.some(n => appName === n || appName.includes(n))) {
          return app;
        }
      }
    }
  }
  return null;
};

export default function KaspaAvatarChat() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState(() => localStorage.getItem(STORAGE_KEY) || DEFAULT_VIDEO_URL);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hey! I'm KAI — ask me anything about Kaspa, blockDAG, mining, KRC-20, or the ecosystem." }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [browserUrl, setBrowserUrl] = useState(null); // persistent browser URL
  const [showBrowser, setShowBrowser] = useState(false); // toggle chat vs browser view
  const [pendingImages, setPendingImages] = useState([]); // [{url, name}]
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const [bubbleText, setBubbleText] = useState(KAI_FACTS[0]);
  const [showBubble, setShowBubble] = useState(() => {
    try { const v = localStorage.getItem("kai_show_bubble"); return v === null ? true : v === "true"; } catch { return true; }
  });
  const [showSettings, setShowSettings] = useState(false);
  const [kaiMode, setKaiMode] = useState(() => {
    try { return localStorage.getItem("kai_mode") || "kai"; } catch { return "kai"; }
  }); // "kai" = new KAI (Kaspa expert), "classic" = old Kai (general TTT assistant with tools)
  const [responseSpeed, setResponseSpeed] = useState(() => {
    try { return localStorage.getItem("kai_speed") || "fast"; } catch { return "fast"; }
  }); // "fast" = short answers, "thinking" = detailed/long answers
  const [typingIndex, setTypingIndex] = useState(-1); // index of message being typed, -1 = none
  const [typingText, setTypingText] = useState("");
  const typingRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch global KAI video URL from database (visible to all users)
  useEffect(() => {
    const fetchGlobalVideo = async () => {
      try {
        const configs = await base44.entities.KAIConfig.filter({ config_key: "avatar_video_url" });
        if (configs.length > 0 && configs[0].config_value) {
          setVideoUrl(configs[0].config_value);
        }
      } catch { /* ignore for non-auth */ }
    };

    // If admin has a local video, sync it to the global entity
    const syncLocalToGlobal = async () => {
      const localUrl = localStorage.getItem(STORAGE_KEY);
      if (!localUrl) return;
      try {
        const configs = await base44.entities.KAIConfig.filter({ config_key: "avatar_video_url" });
        if (configs.length > 0) {
          if (configs[0].config_value !== localUrl) {
            await base44.entities.KAIConfig.update(configs[0].id, { config_value: localUrl });
          }
        } else {
          await base44.entities.KAIConfig.create({ config_key: "avatar_video_url", config_value: localUrl });
        }
      } catch { /* not admin or not auth */ }
    };

    fetchGlobalVideo();
    syncLocalToGlobal();
  }, []);

  // Persist bubble preference & mode
  useEffect(() => {
    try { localStorage.setItem("kai_show_bubble", String(showBubble)); } catch {}
  }, [showBubble]);
  useEffect(() => {
    try { localStorage.setItem("kai_mode", kaiMode); } catch {}
  }, [kaiMode]);
  useEffect(() => {
    try { localStorage.setItem("kai_speed", responseSpeed); } catch {}
  }, [responseSpeed]);

  // Rotate speech bubble facts
  useEffect(() => {
    if (isOpen || !showBubble) return;
    const interval = setInterval(() => {
      setBubbleText(KAI_FACTS[Math.floor(Math.random() * KAI_FACTS.length)]);
    }, 5000);
    return () => clearInterval(interval);
  }, [isOpen, showBubble]);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, typingText]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const isImageRequest = (msg) => IMAGE_KEYWORDS.some(kw => msg.toLowerCase().includes(kw));
  const isFeedRequest = (msg) => FEED_KEYWORDS.some(kw => msg.toLowerCase().includes(kw));
  const isUserPostRequest = (msg) => USER_POST_KEYWORDS.some(kw => msg.toLowerCase().includes(kw));
  const isSearchRequest = (msg) => SEARCH_KEYWORDS.some(kw => msg.toLowerCase().includes(kw));
  const isTrainRequest = (msg) => TRAIN_KEYWORDS.some(kw => msg.toLowerCase().includes(kw));
  const isBrainRequest = (msg) => BRAIN_KEYWORDS.some(kw => msg.toLowerCase().includes(kw));

  // Load user's learned knowledge for context injection
  const loadLearnedKnowledge = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) return '';
      const user = await base44.auth.me();
      const memories = await base44.entities.AgentMemory.filter({ user_id: user.email });
      if (memories.length === 0 || !memories[0].long_term?.length) return '';
      const blocks = memories[0].long_term;
      // Get summaries and recent chunks (most relevant)
      const summaries = blocks.filter(b => b.metadata?.summary).map(b => `[${b.metadata.source_title}]: ${b.metadata.summary}`);
      const recentChunks = blocks.slice(-10).map(b => b.value).join('\n');
      if (summaries.length === 0) return '';
      return `\n\nYOUR LEARNED KNOWLEDGE (trained by this user):\nSources learned: ${summaries.join(' | ')}\n\nRecent knowledge context:\n${recentChunks.slice(0, 2000)}`;
    } catch { return ''; }
  };

  const showBrain = async () => {
    setIsLoading(true);
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        addAssistantMessage("You need to be logged in for me to remember things across sessions. Log in and train me! 🧠");
        setIsLoading(false);
        return;
      }
      const user = await base44.auth.me();
      const memories = await base44.entities.AgentMemory.filter({ user_id: user.email });
      if (memories.length === 0 || !memories[0].long_term?.length) {
        addAssistantMessage("My brain is empty for you — I haven't been trained yet! Send me a URL or article and say \"learn this\" to get started. 🧠");
        setIsLoading(false);
        return;
      }
      const blocks = memories[0].long_term;
      // Group by source
      const sources = {};
      blocks.forEach(b => {
        const title = b.metadata?.source_title || 'Unknown';
        if (!sources[title]) {
          sources[title] = { title, url: b.metadata?.source_url, type: b.metadata?.source_type, chunks: 0, summary: b.metadata?.summary || '', date: b.stored };
        }
        sources[title].chunks++;
      });
      const list = Object.values(sources).map(s =>
        `• **${s.title}** (${s.type})\n  ${s.chunks} knowledge blocks · ${new Date(s.date).toLocaleDateString()}\n  ${s.summary}`
      ).join('\n\n');
      addAssistantMessage(`🧠 **My Brain — ${blocks.length} knowledge blocks from ${Object.keys(sources).length} sources:**\n\n${list}\n\nAsk me anything about these topics!`);
    } catch {
      addAssistantMessage("Couldn't access my memory right now. Try again! 🧠");
    }
    setIsLoading(false);
  };

  const trainOnContent = async (userMsg) => {
    // Extract URL from message
    const urlMatch = userMsg.match(/(https?:\/\/[^\s]+)/i);
    const url = urlMatch ? urlMatch[1] : null;
    const rawText = !url ? userMsg.replace(/^(train yourself|train on this|learn this|study this|read this|watch this|ingest this|memorize this|remember this|learn from|train on|study from|read from|learn about this|absorb this)\s*/i, '').trim() : null;

    if (!url && (!rawText || rawText.length < 20)) {
      addAssistantMessage("Send me a URL, article link, YouTube video, or paste some text and say \"learn this\" — I'll process it and add it to my brain. 🧠");
      setIsLoading(false);
      return;
    }

    // Step 1: Acknowledge
    setMessages(prev => [...prev, { role: "assistant", content: "🧠 Got it. Let me process this now." }]);
    await new Promise(r => setTimeout(r, 600));

    // Step 2: Fetch
    setMessages(prev => [...prev, { role: "action", content: url ? `Fetching content from ${url}...` : "Processing your text..." }]);
    await new Promise(r => setTimeout(r, 400));

    try {
      const res = await base44.functions.invoke('kaiLearn', { url, rawText });
      const data = res.data;

      if (!data.success) {
        setMessages(prev => prev.filter(m => m.role !== 'action'));
        addAssistantMessage("❌ Couldn't process that content. Try a different URL or paste the text directly.");
        return;
      }

      // Step 3: Extract
      setMessages(prev => prev.filter(m => m.role !== 'action'));
      setMessages(prev => [...prev, { role: "action", content: `Found ${data.word_count.toLocaleString()} words from "${data.source_title}" (${data.source_type})...` }]);
      await new Promise(r => setTimeout(r, 800));

      // Step 4: Chunk & Store
      setMessages(prev => prev.filter(m => m.role !== 'action'));
      setMessages(prev => [...prev, { role: "action", content: `Breaking into knowledge blocks... storing ${data.chunks_stored} chunks to my memory.` }]);
      await new Promise(r => setTimeout(r, 800));

      // Step 5: Confirm
      setMessages(prev => prev.filter(m => m.role !== 'action'));
      addAssistantMessage(`✅ **Done. I've learned this.**\n\n📄 **${data.source_title}**\n📊 ${data.word_count.toLocaleString()} words → ${data.chunks_stored} knowledge blocks\n💡 ${data.summary}\n\nYou can now ask me anything about it!`);
    } catch (err) {
      setMessages(prev => prev.filter(m => m.role !== 'action'));
      addAssistantMessage("❌ Something went wrong while learning that. Try again or paste the text directly.");
    }
  };

  // Detect if a question is about TTT platform (no internet needed)
  const isTTTQuestion = (msg) => {
    const lower = msg.toLowerCase();
    const tttKeywords = ['suggest', 'recommend', 'app', 'ttt', 'feature', 'what can', 'how do i', 'where', 'which app', 'open', 'use', 'wallet', 'bridge', 'feed', 'agent', 'hikaru', 'xunhua', 'terra', 'zeku', 'stakedag', 'arcade', 'shop', 'marketplace', 'courses', 'nft', 'mint', 'profile', 'subscription', 'dagknight'];
    return tttKeywords.some(kw => lower.includes(kw));
  };

  // Typewriter effect - animate typing for the current typing message
  useEffect(() => {
    if (typingIndex < 0 || typingIndex >= messages.length) return;
    const fullText = messages[typingIndex].content;
    if (typingText.length >= fullText.length) {
      // Done typing
      setTypingIndex(-1);
      setTypingText("");
      return;
    }
    // Type 2-3 chars at a time for speed
    const charsPerTick = Math.random() > 0.3 ? 2 : 3;
    typingRef.current = setTimeout(() => {
      setTypingText(fullText.slice(0, typingText.length + charsPerTick));
    }, 18);
    return () => clearTimeout(typingRef.current);
  }, [typingIndex, typingText, messages]);

  const addAssistantMessage = (content) => {
    setMessages(prev => {
      const newMessages = [...prev, { role: "assistant", content }];
      if (isFast) {
        setTypingIndex(newMessages.length - 1);
        setTypingText("");
      }
      return newMessages;
    });
  };

  const isFast = responseSpeed === "fast";
  const speedInstruction = isFast
    ? "\n\nRESPONSE LENGTH: Keep your response VERY SHORT — 1-3 sentences max. Be direct and punchy. No fluff."
    : "\n\nRESPONSE LENGTH: Give a thorough, detailed response. Explain deeply, provide examples, context, and analysis. Take your time.";

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingImage(true);
    for (const file of files) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setPendingImages(prev => [...prev, { url: file_url, name: file.name }]);
      } catch (err) {
        console.error("Upload failed:", err);
      }
    }
    setUploadingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePendingImage = (idx) => {
    setPendingImages(prev => prev.filter((_, i) => i !== idx));
  };

  const sendMessage = async () => {
    if ((!input.trim() && pendingImages.length === 0) || isLoading) return;
    const userMsg = input.trim() || (pendingImages.length > 0 ? "Analyze this image" : "");
    const imageUrls = pendingImages.map(img => img.url);
    const imageNames = pendingImages.map(img => img.name);
    setInput("");
    setPendingImages([]);
    setMessages(prev => [...prev, { role: "user", content: userMsg, images: imageUrls.length > 0 ? imageUrls : undefined }]);
    setIsLoading(true);

    // Brain / knowledge request
    if (isBrainRequest(userMsg)) {
      await showBrain();
      setIsLoading(false);
      return;
    }

    // Train / learn request
    if (isTrainRequest(userMsg)) {
      await trainOnContent(userMsg);
      setIsLoading(false);
      return;
    }

    // Explorer / blockchain lookup
    if (isExplorerRequest(userMsg) && !isImageRequest(userMsg)) {
      const explorerAction = detectExplorerAction(userMsg);
      if (explorerAction) {
        setMessages(prev => [...prev, { role: "action", content: "🔍 Querying Kaspa blockchain…" }]);
        try {
          const res = await base44.functions.invoke('kaspaExplorer', explorerAction);
          const data = res.data;
          setMessages(prev => prev.filter(m => m.role !== 'action'));
          if (data.error) {
            addAssistantMessage(`❌ ${data.error}`);
          } else {
            // Use LLM to format the response nicely
            const formatted = await base44.integrations.Core.InvokeLLM({
              prompt: `You are KAI, the Kaspa AI assistant. Format this blockchain data into a clean, readable response. Use markdown links like [Explorer](url) for links. Use emojis sparingly. Be concise. Amounts should show KAS units.\n\nData:\n${JSON.stringify(data, null, 2)}${speedInstruction}`,
            });
            addAssistantMessage(formatted);
          }
        } catch (err) {
          setMessages(prev => prev.filter(m => m.role !== 'action'));
          addAssistantMessage("Couldn't query the blockchain right now. Try again! 🙏");
        }
        setIsLoading(false);
        return;
      }
    }

    // Browse / search / URL → persistent browser panel
    if (isBrowseRequest(userMsg) && !isImageRequest(userMsg)) {
      const browseUrl = getBrowseUrl(userMsg);
      setBrowserUrl(browseUrl);
      setShowBrowser(true);
      setMessages(prev => [...prev, { role: "assistant", content: "🌐 Opened in browser panel — tap the Browser tab above to view.", browserLink: browseUrl }]);
      setIsLoading(false);
      return;
    }

    // KaSshi / music detection
    const kasshiKeywords = ['kasshi', 'ka-sshi', 'music', 'play music', 'play some music', 'open music', 'music player', 'listen to music', 'listen'];
    const isKasshiRequest = kasshiKeywords.some(kw => userMsg.toLowerCase().includes(kw));
    if (isKasshiRequest) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "🎵 **KaSshi.io** — the TTT music player! Tap below to launch it. Music keeps playing across all pages.",
        kasshiAction: true,
      }]);
      setIsLoading(false);
      return;
    }

    // "Open X" → instant app link with button
    const openApp = detectOpenApp(userMsg);
    if (openApp) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `Opening **${openApp.label.replace(/\s*[🎨🖼️💰📝🔐🌉🎯⚔️🤖📺🎮🛒🏪🏆👛👤📱📚⏰📊👑⚙️✍️🎬⚡🔒🌐🕐👽🎤🕊️🌍📂📞🗺️📖]/g, '')}** — ${openApp.desc}`,
        links: [{ label: `Open ${openApp.label}`, path: openApp.path }]
      }]);
      setIsLoading(false);
      return;
    }

    // Image/drawing → suggest Xunhua with clickable button (don't auto-redirect)
    if (isImageRequest(userMsg)) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "For creating images and drawings, check out **Xunhua** — our AI sketch-to-image studio! 🎨 You can draw on a canvas and AI will render it into a full image. Or try **Hikaru** for text-to-image generation.",
        links: [
          { label: "Open Xunhua 🎨", path: "Xunhua" },
          { label: "Open Hikaru 🖼️", path: "Hikaru" },
        ]
      }]);
      setIsLoading(false);
      return;
    }

    // User post analysis
    if (isUserPostRequest(userMsg)) {
      if (!isFast) setMessages(prev => [...prev, { role: "action", content: "Analyzing user posts... 🔍" }]);
      try {
        const posts = await base44.entities.Post.list('-created_date', isFast ? 20 : 50);
        const postData = posts.map(p => `[${p.author_name}] ${p.content?.slice(0, isFast ? 80 : 150)}${p.media_files?.length ? ' [has media]' : ''} (${p.likes || 0} likes, ${p.comments_count || 0} comments)`).join('\n');
        const analysis = await base44.integrations.Core.InvokeLLM({
          prompt: `You are KAI, the AI assistant of TTT — the Kaspa Super-App (NOT "Trust The Tech"). TTT is a community platform with Feed, Agent ZK, TTTV, Bridge, StakeDAG, and 80+ apps. Here are recent posts from the TTT feed:\n\n${postData}\n\nUser question: "${userMsg}"\n\nAnswer the user's question about specific users or posting activity. Be specific, cite usernames and what they posted.${speedInstruction}`,
          add_context_from_internet: !isFast,
          model: isFast ? 'gemini_3_flash' : 'gemini_3_flash',
        });
        setMessages(prev => prev.filter(m => m.role !== 'action'));
        addAssistantMessage(analysis);
      } catch {
        setMessages(prev => prev.filter(m => m.role !== 'action'));
        addAssistantMessage("Couldn't analyze posts right now. Try again! 🙏");
      }
      setIsLoading(false);
      return;
    }

    // Feed summary
    if (isFeedRequest(userMsg)) {
      if (!isFast) setMessages(prev => [...prev, { role: "action", content: "Checking TTT Feed... 📡" }]);
      try {
        const posts = await base44.entities.Post.list('-created_date', isFast ? 10 : 20);
        const feedSummary = posts.map(p => `- ${p.author_name}: ${p.content?.slice(0, isFast ? 60 : 120)}`).join('\n');
        const summary = await base44.integrations.Core.InvokeLLM({
          prompt: `You are KAI, the AI assistant of TTT — the Kaspa Super-App (NOT "Trust The Tech"). TTT is a community platform with Feed, Agent ZK, TTTV, Bridge, StakeDAG, and 80+ apps. Here are recent posts from the TTT feed:\n\n${feedSummary}\n\nProvide a summary of what the community is talking about.${speedInstruction}`,
          add_context_from_internet: !isFast,
          model: 'gemini_3_flash',
        });
        setMessages(prev => prev.filter(m => m.role !== 'action'));
        addAssistantMessage(summary);
      } catch {
        setMessages(prev => prev.filter(m => m.role !== 'action'));
        addAssistantMessage("Couldn't load the feed right now. Try again! 🙏");
      }
      setIsLoading(false);
      return;
    }

    // General message with feed context
    try {
      // Fetch live Kaspa ecosystem context from knowledge base
      const liveKaspaContext = await fetchKaspaContext(userMsg);
      // Fetch user's learned knowledge
      const learnedKnowledge = await loadLearnedKnowledge();

      let feedContext = '';
      // Skip feed fetch in fast mode for instant responses
      if (!isFast) {
        try {
          const recentPosts = await base44.entities.Post.list('-created_date', 15);
          if (recentPosts.length > 0) {
            feedContext = `\n\nRecent TTT Feed activity (for context):\n${recentPosts.map(p => `- ${p.author_name}: ${p.content?.slice(0, 80)}`).join('\n')}`;
          }
        } catch {}
      }
      const context = messages.slice(isFast ? -4 : -8).map(m => `${m.role === "user" ? "User" : "KAI"}: ${m.content}`).join("\n");

      const imageContext = imageUrls.length > 0
        ? `\n\nThe user has uploaded ${imageUrls.length} image(s)${imageNames.length ? ` (${imageNames.join(', ')})` : ''}. Analyze the image(s) thoroughly — describe what you see, extract any text, identify objects/charts/documents, and provide useful insights. If it's a chart or data, interpret it. If it's a screenshot, explain what it shows. If it's a document, summarize the content. Share your analysis so all users can learn from it.`
        : '';

      // Prepend live context block if available
      const liveContextBlock = liveKaspaContext ? `${liveKaspaContext}\n\n---\n\n` : '';

      const classicPrompt = `${liveContextBlock}You are Kai, a helpful AI assistant embedded in TTT (the Kaspa Super-App — NOT "Trust The Tech"). TTT is a massive community-built platform on Kaspa. The tagline is "Unchain Humanity."${learnedKnowledge}

${TTT_APP_DOCS}

KASPA BLOCKCHAIN ORACLE FACTS (verified from kaspa.org):
- Kaspa uses blockDAG (Directed Acyclic Graph) architecture — NOT a traditional blockchain
- Multiple blocks are created in parallel and all are included in the ledger
- GHOSTDAG protocol (upgrading to DAGKnight) provides consensus ordering of all blocks
- Kaspa has already reached 10 BPS (blocks per second) — this is LIVE, not upcoming
- 32 BPS is the next target on the roadmap
- kHeavyHash Proof-of-Work algorithm — GPU mineable, designed for optical mining ASICs
- 100% fair launch: ZERO premine, ZERO ICO, ZERO VC funding, fully community-driven
- Rusty Kaspa: full node rewrite in Rust is complete and live on mainnet
- KRC-20 token standard powers fungible tokens on Kaspa via Kasplex
- Founded on academic research by Yonatan Sompolinsky (co-author of GHOST protocol used in Ethereum)
- Smart contracts (currently in development) will bring DeFi to Kaspa
- Sub-second block times with near-instant visual confirmation
- DAGKnight consensus upgrade will provide the most advanced PoW consensus ever built

IMPORTANT: Always use these verified facts. Do NOT say Kaspa "targets" or "plans" 10 BPS — it already runs at 10 BPS. Use real-time web search for anything you're unsure about. Search kaspa.org for the latest facts.

You have real-time internet access — ALWAYS use it for Kaspa-related questions to ensure accuracy. Keep responses concise, friendly, helpful. Use emojis occasionally. When recommending TTT apps, use the EXACT descriptions above — never guess.${feedContext}

Conversation so far:
${context}

User: ${userMsg}${imageContext}

Respond as Kai:${speedInstruction}`;

      const kaiPrompt = `${liveContextBlock}You are KAI, the AI assistant of TTT — the Kaspa Super-App.${learnedKnowledge}

CRITICAL IDENTITY — WHAT IS TTT:
TTT is a Kaspa community super-app platform. It is NOT "Trust The Tech." TTT is the NAME of this application. The tagline is "Unchain Humanity." TTT 2.0 is the latest redesigned version.

${TTT_APP_DOCS}

KASPA BLOCKCHAIN ORACLE FACTS (verified from kaspa.org):
- Kaspa uses blockDAG (Directed Acyclic Graph) architecture — NOT a traditional blockchain
- Multiple blocks are created in parallel and all are included in the ledger
- GHOSTDAG protocol (upgrading to DAGKnight) provides consensus ordering of all blocks
- Kaspa has already reached 10 BPS (blocks per second) — this is LIVE on mainnet, not upcoming
- 32 BPS is the next target on the roadmap
- kHeavyHash Proof-of-Work algorithm — GPU mineable, designed for optical mining ASICs
- 100% fair launch: ZERO premine, ZERO ICO, ZERO VC funding, fully community-driven
- Rusty Kaspa: full node rewrite in Rust is complete and live on mainnet
- KRC-20 token standard powers fungible tokens on Kaspa via Kasplex
- Founded on academic research by Yonatan Sompolinsky (co-author of GHOST protocol used in Ethereum)
- Smart contracts (currently in development) will bring DeFi to Kaspa
- Sub-second block times with near-instant visual confirmation
- DAGKnight consensus upgrade will provide the most advanced PoW consensus ever built

IMPORTANT: Always use these verified facts. Do NOT say Kaspa "targets" or "plans" 10 BPS — it already runs at 10 BPS. Use real-time web search for anything you're unsure about.

You have real-time internet access — ALWAYS use it for Kaspa-related questions to ensure accuracy. Be concise, accurate, friendly. Use emojis occasionally. Always refer to TTT as the platform/app name, never as "Trust The Tech." When recommending apps, use the EXACT descriptions from the docs above.${feedContext}

Conversation so far:
${context}

User: ${userMsg}${imageContext}

Respond as KAI:${speedInstruction}`;

      // Always use web search for Kaspa questions, search requests, and non-TTT questions
      const lower = userMsg.toLowerCase();
      const isKaspaQuestion = ['kaspa', 'kas ', 'bps', 'blockdag', 'dag', 'ghostdag', 'krc-20', 'krc20', 'kasplex', 'mining', 'hashrate', 'sompolinsky', 'rusty', 'dagknight', 'kheavyhash'].some(kw => lower.includes(kw));
      const isSearch = isSearchRequest(userMsg);
      const needsInternet = isKaspaQuestion || isSearch || (!isTTTQuestion(userMsg) && !isFast);
      
      const searchPrefix = isSearch ? `The user is performing a web search. Use your real-time internet access to find the most accurate, up-to-date information. Search thoroughly like Google would. Give comprehensive results with facts, sources, and details.\n\n` : '';
      const llmParams = {
        prompt: searchPrefix + (kaiMode === "classic" ? classicPrompt : kaiPrompt),
        add_context_from_internet: needsInternet,
        model: "gemini_3_flash",
      };
      if (imageUrls.length > 0) {
        llmParams.file_urls = imageUrls;
      }
      const response = await base44.integrations.Core.InvokeLLM(llmParams);
      addAssistantMessage(response);
    } catch {
      addAssistantMessage("Sorry, something went wrong. Try again! 🙏");
    } finally {
      setIsLoading(false);
    }
  };

  const videoRef = useRef(null);
  const headerVideoRef = useRef(null);

  // Slow down video playback
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = 0.5;
    if (headerVideoRef.current) headerVideoRef.current.playbackRate = 0.5;
  }, [videoUrl, isOpen]);

  return (
    <>
      {/* Floating KAI bubble + speech cloud */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed z-[80] bottom-20 lg:bottom-6 right-4 flex items-end gap-2"
          >
            {/* Speech bubble — click to dismiss */}
            {showBubble && <div className="relative mb-2 max-w-[180px] cursor-pointer" onClick={(e) => { e.stopPropagation(); setShowBubble(false); }}>
              <div
                className="px-3 py-2 rounded-2xl rounded-br-sm text-[11px] font-medium leading-snug"
                style={{
                  background: "rgba(0,0,0,0.85)",
                  color: "rgba(255,255,255,0.9)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(6,182,212,0.25)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                }}
              >
                {bubbleText}
              </div>
              <div
                className="absolute -right-1 bottom-1 w-0 h-0"
                style={{
                  borderLeft: "6px solid rgba(0,0,0,0.85)",
                  borderTop: "4px solid transparent",
                  borderBottom: "4px solid transparent",
                }}
              />
            </div>}

            {/* Avatar button */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(true)}
              className="w-14 h-14 rounded-full overflow-hidden shadow-2xl shadow-black/40 ring-2 ring-white/20 flex-shrink-0 relative"
              style={{ background: "#000" }}
            >
              {videoUrl ? (
                <video ref={videoRef} src={videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" onLoadedMetadata={e => { e.target.playbackRate = 0.5; }} />
              ) : (
                <img src={DEFAULT_AVATAR_IMG} alt="KAI" className="w-full h-full object-cover" />
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed z-[80] bottom-20 lg:bottom-6 right-4 flex flex-col"
            style={{
              width: "min(380px, calc(100vw - 2rem))",
              height: "500px",
              borderRadius: "20px",
              background: "rgba(12, 12, 18, 0.92)",
              backdropFilter: "blur(40px)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/20 flex-shrink-0"
                  style={{ background: "#000" }}>
                  {videoUrl ? (
                    <video ref={headerVideoRef} src={videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" onLoadedMetadata={e => { e.target.playbackRate = 0.5; }} />
                  ) : (
                    <img src={DEFAULT_AVATAR_IMG} alt="KAI" className="w-full h-full object-cover" />
                  )}
                </div>
                <div>
                  <div className="text-white font-bold text-sm tracking-wide">{kaiMode === "classic" ? "Kai" : "KAI"}</div>
                  <div className="text-white/40 text-[10px]">{kaiMode === "classic" ? "Classic • TTT Assistant" : "Kaspa AI Assistant"}</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Mode toggle */}
                <button
                  onClick={() => {
                    const next = kaiMode === "kai" ? "classic" : "kai";
                    setKaiMode(next);
                    setIsLoading(false);
                    setTypingIndex(-1); setTypingText("");
                    setMessages([{ role: "assistant", content: next === "classic"
                      ? "Hey, I'm Kai 👋 Ask me anything about TTT, Kaspa, or literally anything — I have internet access and know every feature of the platform."
                      : "Hey! I'm KAI — ask me anything about Kaspa, blockDAG, mining, KRC-20, or the ecosystem."
                    }]);
                  }}
                  className="h-6 px-2 rounded-full flex items-center gap-1 text-[10px] font-bold transition-all"
                  style={{
                    background: kaiMode === "classic" ? "rgba(168,85,247,0.3)" : "rgba(6,182,212,0.3)",
                    border: `1px solid ${kaiMode === "classic" ? "rgba(168,85,247,0.5)" : "rgba(6,182,212,0.5)"}`,
                    color: kaiMode === "classic" ? "rgba(192,132,252,0.95)" : "rgba(6,182,212,0.95)",
                  }}
                  title={kaiMode === "classic" ? "Switch to KAI mode" : "Switch to Classic Kai mode"}
                >
                  {kaiMode === "classic" ? "Classic" : "KAI"}
                </button>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-white/10 ${showSettings ? 'text-cyan-400' : 'text-white/40 hover:text-white/80'}`}
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { setIsOpen(false); setShowSettings(false); setIsLoading(false); }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 transition-colors hover:bg-white/10"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { setIsOpen(false); setShowSettings(false); setIsLoading(false); setTypingIndex(-1); setTypingText(""); setBrowserUrl(null); setShowBrowser(false); setMessages([{ role: "assistant", content: kaiMode === "classic" ? "Hey, I'm Kai 👋 Ask me anything about TTT, Kaspa, or literally anything." : "Hey! I'm KAI — ask me anything about Kaspa, blockDAG, mining, KRC-20, or the ecosystem." }]); }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-red-400 transition-colors hover:bg-white/10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Chat / Browser tab toggle — only show when browser has been opened */}
            {browserUrl && (
              <div className="flex items-center px-2 py-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <button
                  onClick={() => setShowBrowser(false)}
                  className="flex-1 py-1 text-[10px] font-bold rounded-md transition-all text-center"
                  style={{
                    background: !showBrowser ? "rgba(255,255,255,0.1)" : "transparent",
                    color: !showBrowser ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)",
                  }}
                >
                  💬 Chat
                </button>
                <button
                  onClick={() => setShowBrowser(true)}
                  className="flex-1 py-1 text-[10px] font-bold rounded-md transition-all text-center"
                  style={{
                    background: showBrowser ? "rgba(6,182,212,0.2)" : "transparent",
                    color: showBrowser ? "rgba(6,182,212,1)" : "rgba(255,255,255,0.35)",
                  }}
                >
                  🌐 Browser
                </button>
              </div>
            )}

            {/* Settings Panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <div className="px-4 py-3 space-y-3">
                    <div className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Settings</div>
                    
                    {/* Response Speed Toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[13px] text-white/90 font-medium">Response Mode</div>
                        <div className="text-[10px] text-white/40">{responseSpeed === "fast" ? "Short & quick answers" : "Detailed & thorough"}</div>
                      </div>
                      <div className="flex items-center rounded-full overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.15)" }}>
                        <button
                          onClick={() => setResponseSpeed("fast")}
                          className="px-2.5 py-1 text-[10px] font-bold transition-all"
                          style={{
                            background: responseSpeed === "fast" ? "rgba(6,182,212,0.4)" : "transparent",
                            color: responseSpeed === "fast" ? "rgba(6,182,212,1)" : "rgba(255,255,255,0.4)",
                          }}
                        >
                          ⚡ Fast
                        </button>
                        <button
                          onClick={() => setResponseSpeed("thinking")}
                          className="px-2.5 py-1 text-[10px] font-bold transition-all"
                          style={{
                            background: responseSpeed === "thinking" ? "rgba(168,85,247,0.4)" : "transparent",
                            color: responseSpeed === "thinking" ? "rgba(192,132,252,1)" : "rgba(255,255,255,0.4)",
                          }}
                        >
                          🧠 Thinking
                        </button>
                      </div>
                    </div>

                    {/* Cloud Messages Toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[13px] text-white/90 font-medium">Cloud Messages</div>
                        <div className="text-[10px] text-white/40">Show floating fact bubbles</div>
                      </div>
                      <button
                        onClick={() => setShowBubble(!showBubble)}
                        className={`w-10 h-5.5 rounded-full relative transition-colors duration-200 ${showBubble ? 'bg-cyan-500' : 'bg-white/15'}`}
                        style={{ width: 40, height: 22 }}
                      >
                        <div
                          className="absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform duration-200"
                          style={{ width: 18, height: 18, transform: showBubble ? 'translateX(20px)' : 'translateX(2px)' }}
                        />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Persistent browser panel — always mounted, toggled via CSS */}
            <div
              className="flex-1 overflow-hidden"
              style={{ display: showBrowser && browserUrl ? "flex" : "none", flexDirection: "column" }}
            >
              <AgentBrowserPanel url={browserUrl} key="persistent-browser" onAskKai={(q) => { setShowBrowser(false); setInput(q); setTimeout(() => { inputRef.current?.focus(); }, 100); }} />
            </div>

            {/* Messages — hidden when browser is shown */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-hide" style={{ display: showBrowser && browserUrl ? "none" : undefined }}>
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "action" ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-medium"
                      style={{
                        background: "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(168,85,247,0.2))",
                        border: "1px solid rgba(6,182,212,0.35)",
                        color: "rgba(6,182,212,0.95)",
                      }}
                    >
                      <KAIBlocksAnimation />
                      {msg.content}
                    </motion.div>
                  ) : (
                    <div
                      className="max-w-[85%] text-[13px] leading-relaxed px-3.5 py-2.5 rounded-2xl break-words overflow-hidden"
                      style={msg.role === "user" ? {
                        background: "rgba(6,182,212,0.2)",
                        color: "rgba(255,255,255,0.95)",
                        borderBottomRightRadius: "4px",
                      } : {
                        background: "rgba(255,255,255,0.05)",
                        color: "rgba(255,255,255,0.85)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderBottomLeftRadius: "4px",
                      }}
                    >
                      {msg.images && msg.images.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {msg.images.map((imgUrl, ii) => (
                            <img key={ii} src={imgUrl} alt="uploaded" className="w-16 h-16 rounded-lg object-cover ring-1 ring-white/20" />
                          ))}
                        </div>
                      )}
                      {msg.role === "assistant" ? (
                        <ReactMarkdown
                          className="kai-md text-[13px] leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                          components={{
                            p: ({ children }) => <p className="my-1">{children}</p>,
                            a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 break-all">{children}</a>,
                            strong: ({ children }) => <span className="font-semibold text-white/95">{children}</span>,
                            ul: ({ children }) => <ul className="my-1 ml-3 list-disc text-white/70">{children}</ul>,
                            ol: ({ children }) => <ol className="my-1 ml-3 list-decimal text-white/70">{children}</ol>,
                            li: ({ children }) => <li className="my-0.5">{children}</li>,
                            code: ({ children }) => <code className="px-1 py-0.5 rounded bg-white/10 text-cyan-300 text-[11px] font-mono">{children}</code>,
                          }}
                        >
                          {typingIndex === i ? (typingText || "") : msg.content}
                        </ReactMarkdown>
                      ) : (
                        <span>{typingIndex === i ? (typingText || "") : msg.content}</span>
                      )}
                      {typingIndex === i && <span className="inline-block w-[2px] h-[14px] bg-cyan-400 ml-0.5 animate-pulse align-middle" />}
                      {msg.kasshiAction && (
                        <div className="mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markKaSshiInlineVisited();
                              setKaSshiGlobal(true);
                            }}
                            className="flex items-center gap-2 px-3.5 py-2 rounded-full text-[11px] font-bold transition-all hover:scale-105"
                            style={{
                              background: "linear-gradient(135deg, rgba(168,85,247,0.35), rgba(6,182,212,0.35))",
                              border: "1px solid rgba(168,85,247,0.5)",
                              color: "rgba(192,132,252,1)",
                            }}
                          >
                            <span className="flex items-end gap-[2px] h-[12px]">
                              {[8,12,6,10].map((h,i) => (
                                <span key={i} className="inline-block w-[2.5px] rounded-sm" style={{
                                  height: h, background: 'linear-gradient(to top, #a855f7, #06b6d4)',
                                  animation: `kasshi-eq-chat 0.8s ease-in-out ${i*0.15}s infinite alternate`,
                                }} />
                              ))}
                            </span>
                            Open KaSshi Player
                          </button>
                          <style>{`@keyframes kasshi-eq-chat { 0% { transform: scaleY(0.3); } 100% { transform: scaleY(1); } }`}</style>
                        </div>
                      )}
                      {msg.browserLink && (
                        <button
                          onClick={() => { setBrowserUrl(msg.browserLink); setShowBrowser(true); }}
                          className="mt-2 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all hover:scale-105 flex items-center gap-1.5"
                          style={{
                            background: "rgba(6,182,212,0.2)",
                            border: "1px solid rgba(6,182,212,0.35)",
                            color: "rgba(6,182,212,1)",
                          }}
                        >
                          🌐 View in Browser
                        </button>
                      )}
                      {msg.links && msg.links.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {msg.links.map((link, li) => (
                            <button
                              key={li}
                              onClick={() => { setIsOpen(false); navigate(createPageUrl(link.path)); }}
                              className="px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all hover:scale-105"
                              style={{
                                background: "rgba(6,182,212,0.25)",
                                border: "1px solid rgba(6,182,212,0.4)",
                                color: "rgba(6,182,212,1)",
                              }}
                            >
                              {link.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {isLoading && typingIndex < 0 && (
                <KAIThinkingBubble />
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input — hidden in browser mode */}
            <div className="px-3 pb-3 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", display: showBrowser && browserUrl ? "none" : undefined }}>
              {/* Pending images preview */}
              {pendingImages.length > 0 && (
                <div className="flex items-center gap-1.5 px-2 pb-2 overflow-x-auto scrollbar-hide">
                  {pendingImages.map((img, idx) => (
                    <div key={idx} className="relative flex-shrink-0">
                      <img src={img.url} alt={img.name} className="w-12 h-12 rounded-lg object-cover ring-1 ring-cyan-500/40" />
                      <button
                        onClick={() => removePendingImage(idx)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
                      >
                        <X className="w-2.5 h-2.5 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                {/* Image upload button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all flex-shrink-0 hover:bg-white/10"
                  style={{ color: pendingImages.length > 0 ? "rgba(6,182,212,0.9)" : "rgba(255,255,255,0.4)" }}
                  title="Upload image"
                >
                  {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder={pendingImages.length > 0 ? "Ask about the image…" : (kaiMode === "classic" ? "Search or ask Kai..." : "Search or ask KAI...")}
                  className="flex-1 bg-transparent text-white/90 outline-none placeholder-white/30"
                  style={{ fontSize: '16px' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={(!input.trim() && pendingImages.length === 0) || isLoading}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
                  style={{ background: (input.trim() || pendingImages.length > 0) && !isLoading ? "rgba(6,182,212,0.4)" : "transparent" }}
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}