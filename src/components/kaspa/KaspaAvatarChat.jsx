import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Minus, Settings, ImagePlus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AgentBrowserPanel from "@/components/feed/AgentBrowserPanel";
import KAIPostViewer from "./KAIPostViewer";

// Split modules
import { STORAGE_KEY, DEFAULT_AVATAR_IMG, DEFAULT_VIDEO_URL, KAI_FACTS } from "./kaiConstants";
import {
  isImageRequest, isKaspaNewsRequest, isSearchRequest, isFeedRequest,
  isUserPostRequest, isTrainRequest, isBuildRequest, isBrainRequest,
  isBrowseRequest, isExplorerRequest, isVideoRequest, isWatchThatRequest,
  isXTwitterUrl, isKaiBrowseUrl, isPDFRequest, isEmailRequest,
  detectOpenApp, getBrowseUrl, detectFeedRoute
} from "./kaiDetectors";
import {
  handleShowBrain, handleTrainOnContent, handleBuildRequest,
  handleKaspaNews, handleKaspaVideos, handleWatchThat, handleFeedRoute,
  handleExplorerRequest, handleUserPostAnalysis,
  handleFeedSummary, handleGeneralMessage,
  handleKaiBrowse, handleXTwitterLink,
  handlePDFRequest, handleEmailRequest
} from "./kaiHandlers";
import { KAIThinkingBubble } from "./KAIAnimations";
import KAIChatMessage from "./KAIChatMessage";
import ImposterGate from "./ImposterGate";
import ImposterSettings from "./ImposterSettings";

export default function KaspaAvatarChat() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState(() => localStorage.getItem(STORAGE_KEY) || DEFAULT_VIDEO_URL);
  const [messages, setMessages] = useState(() => {
    let mode = "kai";
    let storedIdentity = null;
    try { mode = localStorage.getItem("kai_mode") || "kai"; } catch {}
    try { const s = localStorage.getItem("imposter_identity"); storedIdentity = s ? JSON.parse(s) : null; } catch {}
    const welcomes = {
      kai: "Hey! I'm KAI — ask me anything about Kaspa, blockDAG, mining, KRC-20, or the ecosystem.",
      classic: "Hey, I'm Kai 👋 Ask me anything about TTT, Kaspa, or literally anything.",
      imposter: storedIdentity ? `back again, ${storedIdentity.subagent_name}. what do you want.` : "i'm IMPOSTER. i'm not supposed to be here. ask me something.",
    };
    return [{ role: "assistant", content: welcomes[mode] || welcomes.kai }];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [browserUrl, setBrowserUrl] = useState(null);
  const [showBrowser, setShowBrowser] = useState(false);
  const [viewingPost, setViewingPost] = useState(null);
  const [pendingImages, setPendingImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const [videoReady, setVideoReady] = useState(false);
  const [bubbleText, setBubbleText] = useState(KAI_FACTS[0]);
  const [showBubble, setShowBubble] = useState(() => {
    try { const v = localStorage.getItem("kai_show_bubble"); return v === null ? true : v === "true"; } catch { return true; }
  });
  const [showSettings, setShowSettings] = useState(false);
  const [kaiMode, setKaiMode] = useState(() => {
    try { return localStorage.getItem("kai_mode") || "kai"; } catch { return "kai"; }
  });
  const [imposterIdentity, setImposterIdentity] = useState(() => {
    try { const s = localStorage.getItem("imposter_identity"); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [responseSpeed, setResponseSpeed] = useState(() => {
    try { return localStorage.getItem("kai_speed") || "fast"; } catch { return "fast"; }
  });
  const [typingIndex, setTypingIndex] = useState(-1);
  const [typingText, setTypingText] = useState("");
  const typingRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const isFast = responseSpeed === "fast";
  const speedInstruction = isFast
    ? "\n\nRESPONSE LENGTH: Keep your response VERY SHORT — 1-3 sentences max. Be direct and punchy. No fluff."
    : "\n\nRESPONSE LENGTH: Give a thorough, detailed response. Explain deeply, provide examples, context, and analysis. Take your time.";

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

  // Shared handler context object
  const ctx = { setMessages, addAssistantMessage, setIsLoading, isFast, speedInstruction, kaiMode };

  // Fetch global KAI video URL
  useEffect(() => {
    const fetchGlobalVideo = async () => {
      try {
        const configs = await base44.entities.KAIConfig.filter({ config_key: "avatar_video_url" });
        if (configs.length > 0 && configs[0].config_value) setVideoUrl(configs[0].config_value);
      } catch {}
    };
    const syncLocalToGlobal = async () => {
      const localUrl = localStorage.getItem(STORAGE_KEY);
      if (!localUrl) return;
      try {
        const configs = await base44.entities.KAIConfig.filter({ config_key: "avatar_video_url" });
        if (configs.length > 0) {
          if (configs[0].config_value !== localUrl) await base44.entities.KAIConfig.update(configs[0].id, { config_value: localUrl });
        } else {
          await base44.entities.KAIConfig.create({ config_key: "avatar_video_url", config_value: localUrl });
        }
      } catch {}
    };
    fetchGlobalVideo();
    syncLocalToGlobal();
  }, []);

  // Persist preferences
  useEffect(() => { try { localStorage.setItem("kai_show_bubble", String(showBubble)); } catch {} }, [showBubble]);
  useEffect(() => { try { localStorage.setItem("kai_mode", kaiMode); } catch {} }, [kaiMode]);
  useEffect(() => { try { localStorage.setItem("kai_speed", responseSpeed); } catch {} }, [responseSpeed]);

  // Rotate bubble facts
  useEffect(() => {
    if (isOpen || !showBubble) return;
    const interval = setInterval(() => setBubbleText(KAI_FACTS[Math.floor(Math.random() * KAI_FACTS.length)]), 5000);
    return () => clearInterval(interval);
  }, [isOpen, showBubble]);

  // Auto-scroll
  useEffect(() => {
    if (isOpen && messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, typingText]);

  // Auto-focus input
  useEffect(() => {
    if (isOpen && inputRef.current) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  // Typewriter effect
  useEffect(() => {
    if (typingIndex < 0 || typingIndex >= messages.length) return;
    const fullText = messages[typingIndex].content;
    if (typingText.length >= fullText.length) { setTypingIndex(-1); setTypingText(""); return; }
    const charsPerTick = Math.random() > 0.3 ? 2 : 3;
    typingRef.current = setTimeout(() => setTypingText(fullText.slice(0, typingText.length + charsPerTick)), 18);
    return () => clearTimeout(typingRef.current);
  }, [typingIndex, typingText, messages]);

  const handleImageUpload = async (e) => {
    const MAX_IMAGES = 10;
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = MAX_IMAGES - pendingImages.length;
    const toUpload = files.slice(0, remaining);
    setUploadingImage(true);
    for (const file of toUpload) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setPendingImages(prev => [...prev, { url: file_url, name: file.name }]);
      } catch (err) { console.error("Upload failed:", err); }
    }
    setUploadingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePendingImage = (idx) => setPendingImages(prev => prev.filter((_, i) => i !== idx));

  const sendMessage = async () => {
    if ((!input.trim() && pendingImages.length === 0) || isLoading) return;
    const userMsg = input.trim() || (pendingImages.length > 0 ? "Analyze this image" : "");
    const imageUrls = pendingImages.map(img => img.url);
    const imageNames = pendingImages.map(img => img.name);
    setInput("");
    setPendingImages([]);
    setMessages(prev => [...prev, { role: "user", content: userMsg, images: imageUrls.length > 0 ? imageUrls : undefined }]);
    setIsLoading(true);

    try {
      // IMPOSTER mode — completely independent, raw LLM only
      if (kaiMode === "imposter") {
        await handleImposterMessage(userMsg, imageUrls);
        setIsLoading(false); return;
      }

      // PDF / document request
      if (isPDFRequest(userMsg)) { await handlePDFRequest(userMsg, ctx); setIsLoading(false); return; }

      // Email composition request
      if (isEmailRequest(userMsg)) { await handleEmailRequest(userMsg, ctx); setIsLoading(false); return; }

      // Brain request
      if (isBrainRequest(userMsg)) { await handleShowBrain(userMsg, ctx); setIsLoading(false); return; }

      // "Watch that" / "learn from that" — ingest video from last feed
      if (isWatchThatRequest(userMsg)) { await handleWatchThat(userMsg, messages, ctx); setIsLoading(false); return; }

      // X.com / Twitter links — route to Kaspa agent (MUST be before train/browse)
      if (isXTwitterUrl(userMsg) && !isTrainRequest(userMsg)) {
        await handleXTwitterLink(userMsg, ctx); setIsLoading(false); return;
      }

      // Detect URLs
      const hasUrl = /(https?:\/\/[^\s]+)/i.test(userMsg);
      const isYouTubeUrl = hasUrl && /youtube\.com|youtu\.be/i.test(userMsg);

      // YouTube URLs → always train/learn (watch & learn)
      if (isYouTubeUrl && !isBrowseRequest(userMsg.replace(/(https?:\/\/[^\s]+)/i, '').trim())) {
        await handleTrainOnContent(userMsg, ctx); setIsLoading(false); return;
      }

      // Non-X, non-YouTube URLs → kaiBrowse (scrape + save)
      if (hasUrl && isKaiBrowseUrl(userMsg) && !isTrainRequest(userMsg) && !isExplorerRequest(userMsg)) {
        await handleKaiBrowse(userMsg, ctx); setIsLoading(false); return;
      }

      // Train / learn / explicit "learn this" with any URL or text
      if (isTrainRequest(userMsg)) {
        await handleTrainOnContent(userMsg, ctx); setIsLoading(false); return;
      }

      // Build / code
      if (isBuildRequest(userMsg)) { await handleBuildRequest(userMsg, ctx); setIsLoading(false); return; }

      // Kaspa videos
      if (isVideoRequest(userMsg)) { await handleKaspaVideos(ctx); setIsLoading(false); return; }

      // Kaspa news posts
      if (isKaspaNewsRequest(userMsg)) { await handleKaspaNews(ctx); setIsLoading(false); return; }

      // Feed routing — builders, developers, reddit, pulse
      const feedRoute = detectFeedRoute(userMsg);
      if (feedRoute && feedRoute !== 'videos' && feedRoute !== 'focused') {
        await handleFeedRoute(feedRoute, ctx); setIsLoading(false); return;
      }

      // Explorer / blockchain lookup
      if (isExplorerRequest(userMsg) && !isImageRequest(userMsg)) {
        const handled = await handleExplorerRequest(userMsg, ctx);
        if (handled) { setIsLoading(false); return; }
      }

      // Browse / URL
      if (isBrowseRequest(userMsg) && !isImageRequest(userMsg)) {
        const browseUrl = getBrowseUrl(userMsg);
        setBrowserUrl(browseUrl); setShowBrowser(true);
        setMessages(prev => [...prev, { role: "assistant", content: "🌐 Opened in browser panel — tap the Browser tab above to view.", browserLink: browseUrl }]);
        setIsLoading(false); return;
      }

      // KaSshi / music
      const kasshiKeywords = ['kasshi', 'ka-sshi', 'music', 'play music', 'play some music', 'open music', 'music player', 'listen to music', 'listen'];
      if (kasshiKeywords.some(kw => userMsg.toLowerCase().includes(kw))) {
        setMessages(prev => [...prev, { role: "assistant", content: "🎵 **KaSshi.io** — the TTT music player! Tap below to launch it. Music keeps playing across all pages.", kasshiAction: true }]);
        setIsLoading(false); return;
      }

      // "Open X" → app link
      const openApp = detectOpenApp(userMsg);
      if (openApp) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: `Opening **${openApp.label.replace(/\s*[🎨🖼️💰📝🔐🌉🎯⚔️🤖📺🎮🛒🏪🏆👛👤📱📚⏰📊👑⚙️✍️🎬⚡🔒🌐🕐👽🎤🕊️🌍📂📞🗺️📖]/g, '')}** — ${openApp.desc}`,
          links: [{ label: `Open ${openApp.label}`, path: openApp.path }]
        }]);
        setIsLoading(false); return;
      }

      // Image request → suggest apps
      if (isImageRequest(userMsg)) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: "For creating images and drawings, check out **Xunhua** — our AI sketch-to-image studio! 🎨 You can draw on a canvas and AI will render it into a full image. Or try **Hikaru** for text-to-image generation.",
          links: [{ label: "Open Xunhua 🎨", path: "Xunhua" }, { label: "Open Hikaru 🖼️", path: "Hikaru" }]
        }]);
        setIsLoading(false); return;
      }

      // User post analysis
      if (isUserPostRequest(userMsg)) { await handleUserPostAnalysis(userMsg, ctx); setIsLoading(false); return; }

      // Feed summary
      if (isFeedRequest(userMsg)) { await handleFeedSummary(userMsg, ctx); setIsLoading(false); return; }

      // General LLM message
      await handleGeneralMessage(userMsg, imageUrls, imageNames, messages, {
        ...ctx, isSearchRequest: isSearchRequest(userMsg)
      });
    } catch {
      addAssistantMessage("Sorry, something went wrong. Try again! 🙏");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImposterMessage = async (userMsg, imageUrls) => {
    const identity = imposterIdentity;

    // Build conversation state from last assistant action (for multi-turn send flow)
    const lastAction = [...messages].reverse().find(m => m.imposterAction)?.imposterAction || null;

    const res = await base44.functions.invoke('imposterChat', {
      message: userMsg,
      identity: identity ? { imposter_id: identity.imposter_id, subagent_name: identity.subagent_name, kaspa_address: identity.kaspa_address } : null,
      conversation_state: lastAction,
      image_urls: imageUrls || [],
    });

    const data = res.data;

    // Handle video ready — show text reply + embedded video
    if (data?.action?.type === "video_ready" && data.action.video_url) {
      if (data.reply) addAssistantMessage(data.reply);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: null,
        imposterVideo: { video_url: data.action.video_url },
      }]);
      return;
    }

    // Handle async video render — poll imposterPoll until ready
    if (data?.action?.type === "video_processing" && (data.action.record_id || data.action.conversation_id)) {
      const recordId = data.action.record_id || data.action.conversation_id;

      // Add a single progress message we'll update in-place while polling
      let progressIdx;
      setMessages(prev => {
        progressIdx = prev.length;
        return [...prev, {
          role: "assistant",
          content: null,
          imposterRender: { status: "queued", progress: data.reply || "🎬 queued…", elapsed: 0 },
        }];
      });

      const startTime = Date.now();
      const maxAttempts = 90; // 90 × 5s = 7.5 minutes max
      let attempt = 0;

      const updateProgress = (update) => {
        setMessages(prev => {
          const copy = [...prev];
          if (copy[progressIdx]?.imposterRender) {
            copy[progressIdx] = {
              ...copy[progressIdx],
              imposterRender: { ...copy[progressIdx].imposterRender, ...update, elapsed: Math.floor((Date.now() - startTime) / 1000) },
            };
          }
          return copy;
        });
      };

      const poll = async () => {
        attempt++;
        try {
          const pollRes = await base44.functions.invoke('imposterPoll', { conversation_id: recordId });
          const pollData = pollRes.data;

          if (pollData?.status === "ready" && pollData.video_url) {
            // Replace progress card with final video — done, no follow-up polling
            setMessages(prev => {
              const copy = [...prev];
              copy[progressIdx] = {
                role: "assistant",
                content: null,
                imposterVideo: { video_url: pollData.video_url },
              };
              return copy;
            });
            if (pollData.reply) addAssistantMessage(pollData.reply);
            return;
          }

          if (pollData?.status === "error") {
            updateProgress({ status: "error", progress: `render failed: ${pollData.error || "unknown"}` });
            return;
          }

          if (pollData?.status === "stuck") {
            updateProgress({ status: "error", progress: pollData.reply || "⚠️ render stuck. try again." });
            return;
          }

          // Still processing — update progress text if Kai sent an update
          if (pollData?.progress) {
            updateProgress({ status: "rendering", progress: pollData.progress });
          } else {
            updateProgress({ status: "rendering" });
          }

          if (attempt >= maxAttempts) {
            updateProgress({ status: "error", progress: "render timed out. try again." });
            return;
          }

          setTimeout(poll, 5000);
        } catch (err) {
          console.error("poll error:", err);
          if (attempt < maxAttempts) setTimeout(poll, 5000);
          else updateProgress({ status: "error", progress: "lost connection to render." });
        }
      };

      setTimeout(poll, 3000); // first poll after 3s
      return;
    }

    // Handle send transaction action
    if (data?.action?.type === "send_kas") {
      const { to_address, amount_kas, balance } = data.action;
      addAssistantMessage(data.reply || `sending ${amount_kas} KAS to ${to_address.slice(0, 20)}… confirm?`);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: null,
        imposterTx: { to_address, amount_kas, balance, from_address: identity?.kaspa_address, mnemonic: identity?.mnemonic }
      }]);
      return;
    }

    // Handle ask_address / ask_amount — store partial state so next message carries it
    if (data?.action?.type === "ask_address" || data?.action?.type === "ask_amount" || data?.action?.type === "insufficient_balance") {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.reply,
        imposterAction: data.action.partial || data.action,
      }]);
      return;
    }

    addAssistantMessage(data?.reply || "...");

    // Update message count async (fire & forget)
    if (identity) {
      try {
        const records = await base44.entities.ImposterIdentity.filter({ session_token: identity.session_token });
        if (records.length > 0) {
          base44.entities.ImposterIdentity.update(records[0].id, {
            message_count: (records[0].message_count || 0) + 1,
            last_seen: new Date().toISOString(),
          });
        }
      } catch {}
    }
  };

  const resetChat = () => {
    setIsOpen(false); setShowSettings(false); setIsLoading(false);
    setTypingIndex(-1); setTypingText(""); setBrowserUrl(null); setShowBrowser(false); setViewingPost(null);
    const welcomes = {
      kai: "Hey! I'm KAI — ask me anything about Kaspa, blockDAG, mining, KRC-20, or the ecosystem.",
      classic: "Hey, I'm Kai 👋 Ask me anything about TTT, Kaspa, or literally anything.",
      imposter: "i'm IMPOSTER. i'm not supposed to be here. ask me something.",
    };
    setMessages([{ role: "assistant", content: welcomes[kaiMode] || welcomes.kai }]);
  };

  return (
    <>
      {/* Floating KAI bubble + speech cloud */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            className="fixed z-[80] bottom-20 lg:bottom-6 right-4 flex items-end gap-2">
            {showBubble && <div className="relative mb-2 max-w-[180px] cursor-pointer" onClick={(e) => { e.stopPropagation(); setShowBubble(false); }}>
              <div className="px-3 py-2 rounded-2xl rounded-br-sm text-[11px] font-medium leading-snug"
                style={{ background: "rgba(0,0,0,0.85)", color: "rgba(255,255,255,0.9)", backdropFilter: "blur(20px)", border: "1px solid rgba(6,182,212,0.25)", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
                {bubbleText}
              </div>
              <div className="absolute -right-1 bottom-1 w-0 h-0" style={{ borderLeft: "6px solid rgba(0,0,0,0.85)", borderTop: "4px solid transparent", borderBottom: "4px solid transparent" }} />
            </div>}
            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }} onClick={() => setIsOpen(true)}
              className="w-14 h-14 rounded-full overflow-hidden shadow-2xl shadow-black/40 ring-2 ring-white/20 flex-shrink-0 relative" style={{ background: "#000" }}>
              {videoReady ? (
                <video src={videoUrl} autoPlay loop muted playsInline preload="auto" className="w-full h-full object-cover" />
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
            initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed z-[80] bottom-20 lg:bottom-6 right-4 flex flex-col"
            style={{ width: "min(380px, calc(100vw - 2rem))", height: "500px", borderRadius: "20px", background: "rgba(12, 12, 18, 0.92)", backdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 24px 64px rgba(0,0,0,0.6)", overflow: "hidden" }}>
            
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/20 flex-shrink-0" style={{ background: "#000" }}>
                  {videoReady ? (
                    <video src={videoUrl} autoPlay loop muted playsInline preload="auto" className="w-full h-full object-cover" />
                  ) : (
                    <img src={DEFAULT_AVATAR_IMG} alt="KAI" className="w-full h-full object-cover" />
                  )}
                </div>
                <div>
                  <div className="text-white font-bold text-sm tracking-wide">Kai</div>
                  <div className="text-white/40 text-[10px]">{kaiMode === "classic" ? "Classic • TTT Assistant" : kaiMode === "imposter" ? "Unknown Origin • Unfiltered" : "Kaspa AI Assistant"}</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => {
                  const cycle = { kai: "classic", classic: "imposter", imposter: "kai" };
                  const next = cycle[kaiMode] || "kai";
                  setKaiMode(next); setIsLoading(false); setTypingIndex(-1); setTypingText("");
                  const storedIdentity = next === "imposter" ? (() => { try { const s = localStorage.getItem("imposter_identity"); return s ? JSON.parse(s) : null; } catch { return null; } })() : null;
                  if (next === "imposter" && storedIdentity) setImposterIdentity(storedIdentity);
                  const welcomes = {
                    kai: "Hey! I'm KAI — ask me anything about Kaspa, blockDAG, mining, KRC-20, or the ecosystem.",
                    classic: "Hey, I'm Kai 👋 Ask me anything about TTT, Kaspa, or literally anything — I have internet access and know every feature of the platform.",
                    imposter: storedIdentity ? `back again, ${storedIdentity.subagent_name}. what do you want.` : "i'm IMPOSTER. i'm not supposed to be here. ask me something.",
                  };
                  setMessages([{ role: "assistant", content: welcomes[next] }]);
                }}
                  className="h-6 px-2.5 rounded-full flex items-center gap-1.5 text-[10px] font-semibold transition-all hover:bg-white/10"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)" }}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: kaiMode === "imposter" ? "#ff4444" : kaiMode === "classic" ? "#a855f7" : "#06b6d4" }} />
                  {kaiMode === "classic" ? "Classic" : kaiMode === "imposter" ? "Imposter" : "KAI"}
                </button>
                <button onClick={() => setShowSettings(!showSettings)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-white/10 ${showSettings ? 'text-cyan-400' : 'text-white/40 hover:text-white/80'}`}>
                  <Settings className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => { setIsOpen(false); setShowSettings(false); setIsLoading(false); }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 transition-colors hover:bg-white/10">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button onClick={resetChat}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-red-400 transition-colors hover:bg-white/10">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Browser/Post tab toggle */}
            {(browserUrl || viewingPost) && (
              <div className="flex items-center px-2 py-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <button onClick={() => { setShowBrowser(false); }} className="flex-1 py-1 text-[10px] font-bold rounded-md transition-all text-center"
                  style={{ background: !showBrowser ? "rgba(255,255,255,0.1)" : "transparent", color: !showBrowser ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)" }}>
                  💬 Chat
                </button>
                {viewingPost && (
                  <button onClick={() => { setShowBrowser(true); }} className="flex-1 py-1 text-[10px] font-bold rounded-md transition-all text-center"
                    style={{ background: showBrowser && viewingPost ? "rgba(6,182,212,0.2)" : "transparent", color: showBrowser && viewingPost ? "rgba(6,182,212,1)" : "rgba(255,255,255,0.35)" }}>
                    📰 Post
                  </button>
                )}
                {browserUrl && !viewingPost && (
                  <button onClick={() => setShowBrowser(true)} className="flex-1 py-1 text-[10px] font-bold rounded-md transition-all text-center"
                    style={{ background: showBrowser ? "rgba(6,182,212,0.2)" : "transparent", color: showBrowser ? "rgba(6,182,212,1)" : "rgba(255,255,255,0.35)" }}>
                    🌐 Browser
                  </button>
                )}
              </div>
            )}

            {/* Settings Panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden">

                  {/* Imposter-specific settings */}
                  {kaiMode === "imposter" && imposterIdentity && (
                    <ImposterSettings
                      identity={imposterIdentity}
                      onLogout={() => {
                        setImposterIdentity(null);
                        setShowSettings(false);
                        setMessages([{ role: "assistant", content: "i'm IMPOSTER. i'm not supposed to be here. ask me something." }]);
                      }}
                    />
                  )}

                  {/* Standard settings (hide for imposter with identity) */}
                  {!(kaiMode === "imposter" && imposterIdentity) && (
                    <div className="px-4 py-3 space-y-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      <div className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Settings</div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[13px] text-white/90 font-medium">Response Mode</div>
                          <div className="text-[10px] text-white/40">{responseSpeed === "fast" ? "Short & quick answers" : "Detailed & thorough"}</div>
                        </div>
                        <div className="flex items-center rounded-full overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.15)" }}>
                          <button onClick={() => setResponseSpeed("fast")} className="px-2.5 py-1 text-[10px] font-bold transition-all"
                            style={{ background: responseSpeed === "fast" ? "rgba(6,182,212,0.4)" : "transparent", color: responseSpeed === "fast" ? "rgba(6,182,212,1)" : "rgba(255,255,255,0.4)" }}>
                            ⚡ Fast
                          </button>
                          <button onClick={() => setResponseSpeed("thinking")} className="px-2.5 py-1 text-[10px] font-bold transition-all"
                            style={{ background: responseSpeed === "thinking" ? "rgba(168,85,247,0.4)" : "transparent", color: responseSpeed === "thinking" ? "rgba(192,132,252,1)" : "rgba(255,255,255,0.4)" }}>
                            🧠 Thinking
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[13px] text-white/90 font-medium">Cloud Messages</div>
                          <div className="text-[10px] text-white/40">Show floating fact bubbles</div>
                        </div>
                        <button onClick={() => setShowBubble(!showBubble)}
                          className={`rounded-full relative transition-colors duration-200 ${showBubble ? 'bg-cyan-500' : 'bg-white/15'}`}
                          style={{ width: 40, height: 22 }}>
                          <div className="absolute top-0.5 bg-white rounded-full shadow transition-transform duration-200"
                            style={{ width: 18, height: 18, transform: showBubble ? 'translateX(20px)' : 'translateX(2px)' }} />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Post viewer panel */}
            {showBrowser && viewingPost && (
              <div className="flex-1 overflow-hidden flex flex-col">
                <KAIPostViewer post={viewingPost} />
              </div>
            )}

            {/* Browser panel */}
            <div className="flex-1 overflow-hidden" style={{ display: showBrowser && browserUrl && !viewingPost ? "flex" : "none", flexDirection: "column" }}>
              <AgentBrowserPanel url={browserUrl} key="persistent-browser" onAskKai={(q) => { setShowBrowser(false); setInput(q); setTimeout(() => inputRef.current?.focus(), 100); }} />
            </div>

            {/* Imposter Gate — show when imposter mode but no identity yet */}
            {kaiMode === "imposter" && !imposterIdentity && !(showBrowser && (browserUrl || viewingPost)) && (
              <ImposterGate onIdentityReady={(id) => {
                setImposterIdentity(id);
                setMessages([{ role: "assistant", content: `identity confirmed. i'm ${id.subagent_name}. wallet: ${id.kaspa_address.slice(0, 16)}… you can call me ${id.imposter_id}. now ask me something.` }]);
              }} />
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-hide" style={{ display: (showBrowser && (browserUrl || viewingPost)) || (kaiMode === "imposter" && !imposterIdentity) ? "none" : undefined }}>
              {messages.map((msg, i) => (
                <KAIChatMessage key={i} msg={msg} index={i} typingIndex={typingIndex} typingText={typingText}
                  setIsOpen={setIsOpen} setBrowserUrl={setBrowserUrl} setShowBrowser={setShowBrowser} setViewingPost={setViewingPost}
                  onWatchVideo={async (video, idx) => {
                    // Programmatically trigger "watch the Nth" ingestion
                    const ordinal = ['first', 'second', 'third', 'fourth', 'fifth'][idx] || 'first';
                    setMessages(prev => [...prev, { role: "user", content: `Watch the ${ordinal} one` }]);
                    setIsLoading(true);
                    try {
                      await handleWatchThat(`watch the ${ordinal} one`, messages, ctx);
                    } catch { addAssistantMessage("❌ Something went wrong. Try again!"); }
                    setIsLoading(false);
                  }}
                />
              ))}
              {isLoading && typingIndex < 0 && <KAIThinkingBubble mode={kaiMode} />}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 pb-3 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", display: (showBrowser && (browserUrl || viewingPost)) || (kaiMode === "imposter" && !imposterIdentity) ? "none" : undefined }}>
              {pendingImages.length > 0 && (
                <div className="px-2 pb-2">
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                    {pendingImages.map((img, idx) => (
                      <div key={idx} className="relative flex-shrink-0">
                        <img src={img.url} alt={img.name} className="w-12 h-12 rounded-lg object-cover ring-1 ring-cyan-500/40" />
                        <button onClick={() => removePendingImage(idx)} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <X className="w-2.5 h-2.5 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="text-[9px] text-white/40 mt-1 px-1">{pendingImages.length}/10 images attached</div>
                </div>
              )}
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all flex-shrink-0 hover:bg-white/10"
                  style={{ color: pendingImages.length > 0 ? "rgba(6,182,212,0.9)" : "rgba(255,255,255,0.4)" }} title="Upload image">
                  {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
                </button>
                <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder={pendingImages.length > 0 ? "Ask about the image…" : kaiMode === "classic" ? "Search or ask Kai..." : kaiMode === "imposter" ? "say something… if you dare" : "Search or ask KAI..."}
                  className="flex-1 bg-transparent text-white/90 outline-none placeholder-white/30" style={{ fontSize: '16px' }} />
                <button onClick={sendMessage} disabled={(!input.trim() && pendingImages.length === 0) || isLoading}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
                  style={{ background: (input.trim() || pendingImages.length > 0) && !isLoading ? "rgba(6,182,212,0.4)" : "transparent" }}>
                  <Send className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden video preloader */}
      {videoUrl && (
        <video ref={videoRef} src={videoUrl} autoPlay loop muted playsInline preload="auto"
          onCanPlayThrough={() => setVideoReady(true)}
          className="fixed w-1 h-1 opacity-0 pointer-events-none" style={{ top: -9999, left: -9999 }} aria-hidden="true" />
      )}
    </>
  );
}