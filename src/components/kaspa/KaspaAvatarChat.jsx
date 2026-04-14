import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Minus, Settings } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const STORAGE_KEY = "kaspa_avatar_video_url";
const DEFAULT_AVATAR_IMG = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/13e8ec094_image.png";
const DEFAULT_VIDEO_URL = "https://base44.app/api/apps/6901295fa9bcfaa0f5ba2c2a/files/mp/public/6901295fa9bcfaa0f5ba2c2a/603409cb0_animation1.mp4";

const KAI_FACTS = [
  "Kaspa processes 10,000+ TPS 🔷",
  "blockDAG = parallel blocks ⚡",
  "No premine. No ICO. Fair launch.",
  "1-second block times!",
  "GHOSTDAG orders all blocks 🧠",
  "kHeavyHash = GPU mining ⛏️",
  "KRC-20 tokens are live on Kaspa",
  "32 BPS target coming soon 🚀",
  "Rust node rewrite is complete",
  "Kaspa = fastest PoW crypto",
];

const IMAGE_KEYWORDS = [
  'draw', 'sketch', 'paint', 'create image', 'generate image', 'make image',
  'make a picture', 'create a picture', 'design', 'illustrate', 'artwork',
  "let's draw", 'lets draw', 'can you draw', 'draw me', 'draw a', 'draw an',
  'show me', 'visualize', 'picture of', 'image of', 'art of', 'xunhua'
];
const FEED_KEYWORDS = [
  'feed', 'ttt feed', 'latest posts', 'recent posts', 'whats on the feed',
  "what's on the feed", 'check feed', 'examine feed', 'what are people saying',
  "what's new", 'whats new', 'latest updates', 'community posts', 'ttt posts'
];
const USER_POST_KEYWORDS = [
  'posts by', 'what has', 'what did', 'posted', 'analyze user', 'user posts',
  'examine posts', 'who posted', 'show me posts from', 'check posts',
  'what does', 'posting', 'activity', 'said'
];

export default function KaspaAvatarChat() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState(() => localStorage.getItem(STORAGE_KEY) || DEFAULT_VIDEO_URL);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hey! I'm KAI — ask me anything about Kaspa, blockDAG, mining, KRC-20, or the ecosystem." }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    // Image/drawing → open Xunhua
    if (isImageRequest(userMsg)) {
      setMessages(prev => [...prev, { role: "action", content: "Opening Xunhua App 🎨" }]);
      await new Promise(r => setTimeout(r, 1200));
      setIsLoading(false);
      setIsOpen(false);
      navigate(createPageUrl('Xunhua'));
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

      const classicPrompt = `You are Kai, a helpful AI assistant embedded in TTT (the Kaspa Super-App — NOT "Trust The Tech"). TTT is a massive community-built platform on Kaspa with 80+ apps, a social feed, AI agents, prediction markets, wallets, and more. The tagline is "Unchain Humanity."

You're knowledgeable about Kaspa, crypto, the TTT platform features (Feed, AgentZK, DAGKnight, Bridge, TTTV, StakeDAG, KA-CHING, Hikaru, Xunhua, Terra, Zeku AI, App Store, NFT Mint, Arcade, Shop, Marketplace, Courses, and all 80+ apps), and general topics. You have access to the community feed and can reference what users have posted. You also have real-time internet access — use it to give accurate, up-to-date answers about crypto prices, news, events, and any topic. Keep responses concise, friendly, and helpful. Use emojis occasionally.${feedContext}

Conversation so far:
${context}

User: ${userMsg}

Respond as Kai:${speedInstruction}`;

      const kaiPrompt = `You are KAI, the AI assistant of TTT — the Kaspa Super-App.

CRITICAL IDENTITY — WHAT IS TTT:
TTT is a Kaspa community super-app platform. It is NOT "Trust The Tech." TTT is the NAME of this application — a massive community-built platform on Kaspa with 80+ apps, a social feed, AI agents, prediction markets, wallets, and more. The tagline is "Unchain Humanity." TTT 2.0 is the latest redesigned version.

TTT PLATFORM FEATURES (you know all of these intimately):
- TTT Feed: Community social feed with posts, comments, media uploads, KAS tipping (including KRC-20 multi-token tips), Kaspa stamps, likes, and threaded replies
- Agent ZK: Cryptographic wallet-based identity system — users verify ownership of Kasware, MetaMask, and TTT wallets to create a DAGKnight certificate
- TTTV: Built-in media browser and YouTube player — watch videos ad-free inside TTT
- Send KAS (Bridge): Transfer KAS between L1 (Kasware) and L2 (Kasplex/MetaMask)
- StakeDAG: Prediction markets with escrow — bet on outcomes using KAS
- KA-CHING: Automated betting engine with live games
- DAGKnight Wallet: Advanced multi-wallet management with verification DAG
- Hikaru: AI image generation studio
- Xunhua: AI sketch-to-image studio (drawing canvas + AI render)
- Zeku AI: Premium AI assistant
- Terra: Kaspa wallet manager with mnemonic creation, KRC-20 token support
- App Store: 80+ community-built apps and tools
- Encrypted Notepad, NFT Mint, Stamped News, Bull Reels, Kaspa Node Map
- K-University / KaSkool / Courses, Shop & Marketplace, TTT ID
- DAG Feed, Global History, Arcade (Tetris Battle, Bingo, PacMan)
- Subscription, Profile, Categories (customizable app dashboard)

KASPA BLOCKCHAIN KNOWLEDGE:
- Kaspa uses blockDAG architecture — multiple blocks created simultaneously
- GHOSTDAG/PHANTOM protocol orders all blocks into a consistent ledger
- Proof of Work secured by kHeavyHash (GPU-mineable, fair, decentralized)
- Fair launch: NO premine, NO ICO, NO VC funding — 100% community-driven
- 1-second block times, 10,000+ TPS capacity, targeting 32 BPS
- Rust node rewrite (Rusty Kaspa), DAGKnight consensus upgrade
- KRC-20 token standard on Kasplex L2
- Founded on research by Yonatan Sompolinsky

You have real-time internet access. Be concise, accurate, friendly. Use emojis occasionally. Always refer to TTT as the platform/app name, never as "Trust The Tech."${feedContext}

Conversation so far:
${context}

User: ${userMsg}

Respond as KAI:${speedInstruction}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: kaiMode === "classic" ? classicPrompt : kaiPrompt,
        add_context_from_internet: !isFast,
        model: "gemini_3_flash",
      });
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
                  onClick={() => { setIsOpen(false); setShowSettings(false); setIsLoading(false); setTypingIndex(-1); setTypingText(""); setMessages([{ role: "assistant", content: kaiMode === "classic" ? "Hey, I'm Kai 👋 Ask me anything about TTT, Kaspa, or literally anything." : "Hey! I'm KAI — ask me anything about Kaspa, blockDAG, mining, KRC-20, or the ecosystem." }]); }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-red-400 transition-colors hover:bg-white/10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

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

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-hide">
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
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {msg.content}
                    </motion.div>
                  ) : (
                    <div
                      className="max-w-[85%] text-sm leading-relaxed px-3 py-2 rounded-2xl"
                      style={msg.role === "user" ? {
                        background: "rgba(6,182,212,0.25)",
                        color: "rgba(255,255,255,0.95)",
                        borderBottomRightRadius: "6px",
                      } : {
                        background: "rgba(255,255,255,0.07)",
                        color: "rgba(255,255,255,0.85)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderBottomLeftRadius: "6px",
                      }}
                    >
                      {typingIndex === i ? (typingText || "") : msg.content}
                      {typingIndex === i && <span className="inline-block w-[2px] h-[14px] bg-cyan-400 ml-0.5 animate-pulse align-middle" />}
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="px-3 py-2 rounded-2xl rounded-bl-md flex items-center gap-1.5"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="w-1.5 h-1.5 bg-cyan-400/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 bg-cyan-400/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 bg-cyan-400/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 pb-3 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder={kaiMode === "classic" ? "Ask Kai anything..." : "Ask KAI about Kaspa..."}
                  className="flex-1 bg-transparent text-white/90 text-sm outline-none placeholder-white/30"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
                  style={{ background: input.trim() && !isLoading ? "rgba(6,182,212,0.4)" : "transparent" }}
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