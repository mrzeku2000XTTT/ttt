import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { X, Send, ChevronDown, Lock, Unlock, Cpu, FlaskConical, Play, Pause, Music2, LayoutGrid, Users, Zap, MessageCircle, Search, Image as ImageIcon, Loader2, Sparkles, ExternalLink } from "lucide-react";
import GrokChat from "@/components/landing/GrokChat";
import { createPageUrl } from "@/utils";

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

// ── Main ZK Chat Panel with real LLM + search + image gen ──
function ZKChatPanel({ onClose }) {
  const [model, setModel] = useState(AI_MODELS[0]);
  const [showModels, setShowModels] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Ask me anything about Kaspa, crypto, or generate an image. Type naturally — I search as you type." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [activeTab, setActiveTab] = useState("chat"); // chat | apps | image
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState(null);
  const [appSearch, setAppSearch] = useState("");
  const bottomRef = useRef(null);
  const searchTimeout = useRef(null);

  // All apps for search
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
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Live search as user types
  const handleInputChange = (val) => {
    setInput(val);
    clearTimeout(searchTimeout.current);
    if (val.trim().length < 2) { setSearchResults([]); setShowSearch(false); return; }
    searchTimeout.current = setTimeout(() => {
      const q = val.toLowerCase();
      const matched = ALL_APPS.filter(a =>
        a.name.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q)
      ).slice(0, 4);
      setSearchResults(matched);
      setShowSearch(matched.length > 0);
    }, 200);
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    setShowSearch(false);
    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are ZK, TTT platform's AI assistant. Be concise, helpful, and slightly edgy. You know everything about Kaspa blockchain, crypto, and the TTT app ecosystem. Context: user is on the TTT landing page which has apps for feed, wallet, AI image gen, video browser, and more.\n\nPrevious messages:\n${messages.slice(-6).map(m => `${m.role}: ${m.content}`).join("\n")}\nuser: ${userMsg.content}\nassistant:`,
        model: model.id,
        add_context_from_internet: model.id.includes("gemini"),
      });
      setMessages(prev => [...prev, { role: "assistant", content: typeof res === "string" ? res : JSON.stringify(res) }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Signal lost. Try again." }]);
    }
    setLoading(false);
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

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed inset-x-3 bottom-3 z-50 flex flex-col sm:inset-auto sm:right-4 sm:bottom-4 sm:left-auto"
      style={{ width: "min(96vw, 400px)", maxHeight: "85vh", background: "rgba(6,6,12,0.97)", border: "1px solid rgba(167,139,250,0.3)", borderRadius: 16, fontFamily: "system-ui, sans-serif", boxShadow: "0 24px 80px rgba(0,0,0,0.7)" }}>

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid rgba(167,139,250,0.12)" }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #a78bfa, #6366f1)" }}>
          <span className="text-white text-[11px] font-black">ZK</span>
        </div>
        <span className="text-sm font-bold" style={{ color: "#a78bfa" }}>ZK Assistant</span>

        {/* Tabs */}
        <div className="ml-auto flex items-center gap-1">
          {[
            { id: "chat", icon: <MessageCircle className="w-3 h-3" />, label: "Chat" },
            { id: "apps", icon: <LayoutGrid className="w-3 h-3" />, label: "Apps" },
            { id: "image", icon: <ImageIcon className="w-3 h-3" />, label: "Image" },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-full transition-all"
              style={{
                background: activeTab === tab.id ? "rgba(167,139,250,0.2)" : "transparent",
                color: activeTab === tab.id ? "#a78bfa" : "rgba(255,255,255,0.35)",
                border: activeTab === tab.id ? "1px solid rgba(167,139,250,0.3)" : "1px solid transparent",
              }}>
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
          {/* Model picker */}
          <div className="relative ml-1">
            <button onClick={() => setShowModels(!showModels)}
              className="flex items-center gap-1 px-2 py-1 text-[9px] font-semibold rounded-full"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: model.color }}>
              {model.label.split(" ")[0]} <ChevronDown className="w-2 h-2" />
            </button>
            <AnimatePresence>
              {showModels && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full right-0 mt-1 z-[60] py-1 rounded-xl"
                  style={{ background: "rgba(6,6,12,0.99)", border: "1px solid rgba(167,139,250,0.3)", minWidth: 170 }}>
                  {AI_MODELS.map(m => (
                    <button key={m.id} onClick={() => { setModel(m); setShowModels(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.color }} />
                      <div>
                        <div className="text-[11px] font-semibold" style={{ color: model.id === m.id ? m.color : "rgba(255,255,255,0.7)" }}>{m.label}</div>
                        <div className="text-[9px] text-white/30">{m.maker}</div>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={onClose} className="ml-1 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors" style={{ color: "rgba(255,255,255,0.3)" }}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* CHAT TAB */}
      {activeTab === "chat" && (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ minHeight: 0 }}>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[85%] px-3 py-2 text-[12px] leading-relaxed rounded-2xl"
                  style={{
                    background: m.role === "user" ? "rgba(167,139,250,0.18)" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${m.role === "user" ? "rgba(167,139,250,0.3)" : "rgba(255,255,255,0.07)"}`,
                    color: m.role === "user" ? "#e9d5ff" : "rgba(255,255,255,0.8)",
                  }}>
                  {m.image ? (
                    <img src={m.image} alt="Generated" className="rounded-lg max-w-full" />
                  ) : m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex gap-1">
                    {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#a78bfa", animationDelay: `${i*0.12}s` }} />)}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input with live search dropdown */}
          <div className="px-3 py-3 relative" style={{ borderTop: "1px solid rgba(167,139,250,0.1)" }}>
            <AnimatePresence>
              {showSearch && searchResults.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                  className="absolute bottom-full left-3 right-3 mb-2 rounded-xl overflow-hidden"
                  style={{ background: "rgba(10,8,25,0.98)", border: "1px solid rgba(167,139,250,0.25)", zIndex: 10 }}>
                  <div className="px-3 py-1.5 text-[9px] tracking-widest text-white/30 border-b border-white/5">APPS FOUND</div>
                  {searchResults.map(app => (
                    <Link key={app.path} to={createPageUrl(app.path)} onClick={() => setShowSearch(false)}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 transition-colors">
                      <img src={app.logo} alt={app.name} className="w-8 h-8 rounded-xl object-cover flex-shrink-0" />
                      <div>
                        <div className="text-[12px] font-semibold text-white">{app.name}</div>
                        <div className="text-[10px] text-white/40">{app.desc}</div>
                      </div>
                      <ExternalLink className="w-3 h-3 text-white/20 ml-auto flex-shrink-0" />
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex gap-2">
              <input value={input} onChange={e => handleInputChange(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                onFocus={() => input.length > 1 && setShowSearch(searchResults.length > 0)}
                onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                placeholder="Ask anything or search apps..."
                className="flex-1 px-3 py-2 text-[12px] outline-none rounded-xl"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(167,139,250,0.2)", color: "rgba(255,255,255,0.85)", caretColor: "#a78bfa" }} />
              <button onClick={send} disabled={loading || !input.trim()}
                className="w-9 h-9 flex items-center justify-center flex-shrink-0 disabled:opacity-30 transition-all rounded-xl"
                style={{ background: "rgba(167,139,250,0.2)", border: "1px solid rgba(167,139,250,0.35)" }}>
                <Send className="w-3.5 h-3.5" style={{ color: "#a78bfa" }} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* APPS TAB */}
      {activeTab === "apps" && (
        <div className="flex-1 flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Search className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
              <input value={appSearch} onChange={e => setAppSearch(e.target.value)}
                placeholder="Search apps..."
                className="flex-1 text-[12px] bg-transparent outline-none"
                style={{ color: "rgba(255,255,255,0.8)", caretColor: "#a78bfa" }} />
              {appSearch && <button onClick={() => setAppSearch("")} className="text-white/30 hover:text-white/60"><X className="w-3 h-3" /></button>}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="grid grid-cols-4 gap-3">
              {filteredApps.map(app => (
                <Link key={app.path} to={createPageUrl(app.path)}
                  className="flex flex-col items-center gap-1 group">
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
                    className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg">
                    {app.logo ? (
                      <img src={app.logo} alt={app.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center rounded-2xl"
                        style={{ background: "linear-gradient(135deg, #a78bfa, #6366f1)" }}>
                        <LayoutGrid className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </motion.div>
                  <span className="text-[10px] font-semibold text-white/60 group-hover:text-white/90 transition-colors text-center truncate w-full">{app.name}</span>
                </Link>
              ))}
            </div>
            {filteredApps.length === 0 && (
              <div className="text-center py-8 text-white/30 text-sm">No apps found</div>
            )}
          </div>
        </div>
      )}

      {/* IMAGE TAB */}
      {activeTab === "image" && (
        <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3" style={{ minHeight: 0 }}>
          <div className="text-[11px] text-white/40 font-semibold tracking-wider">AI IMAGE GENERATOR</div>
          <textarea value={imagePrompt} onChange={e => setImagePrompt(e.target.value)}
            placeholder="Describe your image... e.g. 'Kaspa coin floating in deep space, photorealistic'"
            rows={3}
            className="w-full px-3 py-2.5 text-[12px] outline-none resize-none rounded-xl"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(167,139,250,0.2)", color: "rgba(255,255,255,0.85)", caretColor: "#a78bfa" }} />
          <button onClick={generateImage} disabled={generatingImage || !imagePrompt.trim()}
            className="w-full py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
            style={{ background: generatingImage ? "rgba(167,139,250,0.1)" : "linear-gradient(135deg, #a78bfa, #6366f1)", color: "white" }}>
            {generatingImage ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Image</>}
          </button>
          <div className="flex-1 overflow-y-auto">
            {generatedImage && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl overflow-hidden">
                <img src={generatedImage} alt="Generated" className="w-full rounded-xl" />
                <a href={generatedImage} download target="_blank" rel="noopener noreferrer"
                  className="mt-2 flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-semibold text-white/50 hover:text-white/80 transition-colors"
                  style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                  Download
                </a>
              </motion.div>
            )}
            {!generatedImage && !generatingImage && (
              <div className="flex flex-col items-center justify-center h-32 text-white/20">
                <ImageIcon className="w-10 h-10 mb-2 opacity-30" />
                <span className="text-[11px]">Your image will appear here</span>
              </div>
            )}
          </div>
        </div>
      )}
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
        onClick={() => setShowZKChat(true)}
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
            { label: "ZK", icon: <MessageCircle className="w-4 h-4 mb-1 text-white/70" />, action: () => setShowZKChat(true) },
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
        {showZKChat && <ZKChatPanel onClose={() => setShowZKChat(false)} />}
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