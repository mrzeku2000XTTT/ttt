import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Sparkles, Minus, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function KaiChatbot() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isEnabled, setIsEnabled] = useState(() => {
    const saved = localStorage.getItem('kai_enabled');
    return saved === null ? true : saved === 'true';
  });
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hey, I'm Kai 👋 Ask me anything about TTT or Kaspa." }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('kai_enabled');
      setIsEnabled(saved === null ? true : saved === 'true');
    };
    window.addEventListener('kai_toggle', handleStorageChange);
    return () => window.removeEventListener('kai_toggle', handleStorageChange);
  }, []);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const IMAGE_KEYWORDS = [
    'draw', 'sketch', 'paint', 'create image', 'generate image', 'make image',
    'make a picture', 'create a picture', 'design', 'illustrate', 'artwork',
    'let\'s draw', 'lets draw', 'can you draw', 'draw me', 'draw a', 'draw an',
    'show me', 'visualize', 'picture of', 'image of', 'art of', 'xunhua'
  ];

  const FEED_KEYWORDS = [
    'feed', 'ttt feed', 'latest posts', 'recent posts', 'whats on the feed',
    "what's on the feed", 'check feed', 'examine feed', 'what are people saying',
    'what\'s new', 'whats new', 'latest updates', 'community posts', 'ttt posts'
  ];

  const USER_POST_KEYWORDS = [
    'posts by', 'what has', 'what did', 'posted', 'analyze user', 'user posts',
    'examine posts', 'who posted', 'show me posts from', 'check posts',
    'what does', 'posting', 'activity', 'said'
  ];

  const isUserPostRequest = (msg) => {
    const lower = msg.toLowerCase();
    return USER_POST_KEYWORDS.some(kw => lower.includes(kw));
  };

  const isFeedRequest = (msg) => {
    const lower = msg.toLowerCase();
    return FEED_KEYWORDS.some(kw => lower.includes(kw));
  };

  const isImageRequest = (msg) => {
    const lower = msg.toLowerCase();
    return IMAGE_KEYWORDS.some(kw => lower.includes(kw));
  };

  const APP_DIRECTORY = [
    { names: ['hikaru'], path: 'Hikaru', label: 'Hikaru 🖼️', desc: 'AI image generation studio' },
    { names: ['xunhua', 'xùnhuà'], path: 'Xunhua', label: 'Xunhua 🎨', desc: 'AI sketch-to-image studio' },
    { names: ['terra'], path: 'Terra', label: 'Terra 💰', desc: 'Kaspa wallet manager' },
    { names: ['feed', 'ttt feed'], path: 'Feed', label: 'TTT Feed 📝', desc: 'Community social feed' },
    { names: ['agent zk', 'agentzk', 'zk'], path: 'AgentZK', label: 'Agent ZK 🔐', desc: 'Cryptographic identity' },
    { names: ['bridge', 'send kas'], path: 'Bridge', label: 'Send KAS 🌉', desc: 'Transfer KAS between L1/L2' },
    { names: ['stakedag', 'stake dag'], path: 'StakeDAG', label: 'StakeDAG 🎯', desc: 'Prediction markets' },
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
    { names: ['courses', 'university', 'learn'], path: 'Courses', label: 'Courses 📚', desc: 'Kaspa education' },
    { names: ['countdown'], path: 'Countdown', label: 'Countdown ⏰', desc: 'Milestone timer' },
    { names: ['analytics'], path: 'Analytics', label: 'Analytics 📊', desc: 'Platform analytics' },
    { names: ['canvas'], path: 'Canvas', label: 'Canvas 🎨', desc: 'Template design studio' },
    { names: ['prompto', 'prompt'], path: 'Prompto', label: 'Prompto ✍️', desc: 'AI prompt engineering' },
    { names: ['speed'], path: 'Speed', label: 'Speed ⚡', desc: 'Quick image generation' },
    { names: ['security', 'audit'], path: 'SecurityAudit', label: 'Security Audit 🔒', desc: 'Security scanning' },
    { names: ['area 51', 'area51'], path: 'Area51', label: 'Area 51 👽', desc: 'Experimental zone' },
    { names: ['categories'], path: 'Categories', label: 'Categories 📂', desc: 'App dashboard' },
    { names: ['voxa'], path: 'Voxa', label: 'Voxa 🎤', desc: 'Voice/audio tools' },
    { names: ['freedom'], path: 'Freedom', label: 'Freedom 🕊️', desc: 'Privacy tools' },
    { names: ['cinekas', 'movies'], path: 'Cinekas', label: 'Cinekas 🎬', desc: 'Movie browser' },
  ];

  const detectOpenApp = (msg) => {
    const lower = msg.toLowerCase().trim();
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

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    // "Open X" → instant app link with button
    const openApp = detectOpenApp(userMsg);
    if (openApp) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `Opening **${openApp.label.replace(/\s*[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')}** — ${openApp.desc}`,
        links: [{ label: `Open ${openApp.label}`, path: openApp.path }]
      }]);
      setIsLoading(false);
      return;
    }

    // Detect image/drawing intent — suggest apps with clickable buttons
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

    // Detect user-specific post analysis
    if (isUserPostRequest(userMsg)) {
      setMessages(prev => [...prev, { role: "action", content: "Analyzing user posts... 🔍" }]);
      try {
        const posts = await base44.entities.Post.list('-created_date', 50);
        const postData = posts.map(p => `[${p.author_name}] ${p.content?.slice(0, 150)}${p.media_files?.length ? ' [has media]' : ''} (${p.likes || 0} likes, ${p.comments_count || 0} comments)`).join('\n');
        const analysis = await base44.integrations.Core.InvokeLLM({
          prompt: `You are Kai, an AI assistant for the TTT community. Here are the 50 most recent posts from the TTT feed:\n\n${postData}\n\nUser question: "${userMsg}"\n\nAnswer the user's question about specific users or posting activity. Be specific, cite usernames and what they posted. Keep it concise, friendly, and use emojis.`,
          add_context_from_internet: true,
          model: 'gemini_3_flash',
        });
        setMessages(prev => [
          ...prev.filter(m => m.role !== 'action'),
          { role: "assistant", content: analysis }
        ]);
      } catch (err) {
        setMessages(prev => [
          ...prev.filter(m => m.role !== 'action'),
          { role: "assistant", content: "Couldn't analyze posts right now. Try again! 🙏" }
        ]);
      }
      setIsLoading(false);
      return;
    }

    // Detect feed request
    if (isFeedRequest(userMsg)) {
      setMessages(prev => [...prev, { role: "action", content: "Checking TTT Feed... 📡" }]);
      try {
        const posts = await base44.entities.Post.list('-created_date', 20);
        const feedSummary = posts.map(p => `- ${p.author_name}: ${p.content?.slice(0, 120)}`).join('\n');
        const summary = await base44.integrations.Core.InvokeLLM({
          prompt: `You are Kai, an AI assistant for the TTT community. Here are the 20 most recent posts from the TTT feed:\n\n${feedSummary}\n\nProvide a friendly, concise summary of what the community is talking about. Highlight key themes, hot topics, and any interesting discussions. Keep it under 200 words. Use emojis.`,
          add_context_from_internet: true,
          model: 'gemini_3_flash',
        });
        setMessages(prev => [
          ...prev.filter(m => m.role !== 'action'),
          { role: "assistant", content: summary }
        ]);
      } catch (err) {
        setMessages(prev => [
          ...prev.filter(m => m.role !== 'action'),
          { role: "assistant", content: "Couldn't load the feed right now. Try again! 🙏" }
        ]);
      }
      setIsLoading(false);
      return;
    }

    try {
      // Fetch recent posts for context so Kai always knows what's happening
      let feedContext = '';
      try {
        const recentPosts = await base44.entities.Post.list('-created_date', 15);
        if (recentPosts.length > 0) {
          feedContext = `\n\nRecent TTT Feed activity (for context):\n${recentPosts.map(p => `- ${p.author_name}: ${p.content?.slice(0, 80)}`).join('\n')}`;
        }
      } catch {} 
      const context = messages.slice(-6).map(m => `${m.role === 'user' ? 'User' : 'Kai'}: ${m.content}`).join('\n');
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Kai, a helpful AI assistant embedded in TTT (a Kaspa blockchain community app). You're knowledgeable about Kaspa, crypto, the TTT platform features (Feed, AgentZK, DAGKnight, Bridge, etc.), and general topics. You have access to the community feed and can reference what users have posted. You also have real-time internet access — use it to give accurate, up-to-date answers about crypto prices, news, events, and any topic. Keep responses concise, friendly, and helpful. Use emojis occasionally.${feedContext}\n\nConversation so far:\n${context}\n\nUser: ${userMsg}\n\nRespond as Kai:`,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
      });
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I ran into an issue. Try again! 🙏" }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isEnabled) return null;

  return (
    <>
      {/* Persistent Kai Tab - always visible when not open */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => { setIsOpen(true); setIsMinimized(false); }}
            className="fixed z-[70] flex items-center justify-center"
            style={{
              bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))',
              right: '1rem',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0)',
              backgroundColor: 'transparent',
              border: '1px solid rgba(255,255,255,0.25)',
              boxShadow: 'none',
              padding: 0,
              outline: 'none',
            }}
            title="Chat with Kai"
          >
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1 }}>✦</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed z-[70] flex flex-col"
            style={{
              bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))',
              right: '1rem',
              width: 'min(360px, calc(100vw - 2rem))',
              height: '480px',
              borderRadius: '20px',
              background: 'rgba(12, 12, 18, 0.85)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8"
              style={{ borderBottomColor: 'rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  ✦
                </div>
                <div>
                  <div className="text-white font-semibold text-sm leading-none">Kai</div>
                  <div className="text-white/40 text-[10px] mt-0.5">AI Assistant</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 transition-colors hover:bg-white/10"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { setIsOpen(false); setMessages([{ role: "assistant", content: "Hey, I'm Kai 👋 Ask me anything about TTT or Kaspa." }]); }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-red-400 transition-colors hover:bg-white/10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-hide">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'action' ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-medium"
                      style={{
                        background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(168,85,247,0.2))',
                        border: '1px solid rgba(6,182,212,0.35)',
                        color: 'rgba(6,182,212,0.95)',
                      }}
                    >
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {msg.content}
                    </motion.div>
                  ) : (
                    <div
                      className="max-w-[80%] text-sm leading-relaxed px-3 py-2 rounded-2xl"
                      style={msg.role === 'user' ? {
                        background: 'rgba(255,255,255,0.15)',
                        color: 'rgba(255,255,255,0.95)',
                        borderBottomRightRadius: '6px',
                      } : {
                        background: 'rgba(255,255,255,0.07)',
                        color: 'rgba(255,255,255,0.85)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderBottomLeftRadius: '6px',
                      }}
                    >
                      {msg.content}
                      {msg.links && msg.links.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {msg.links.map((link, li) => (
                            <button
                              key={li}
                              onClick={() => { setIsOpen(false); navigate(createPageUrl(link.path)); }}
                              className="px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all hover:scale-105"
                              style={{
                                background: 'rgba(6,182,212,0.25)',
                                border: '1px solid rgba(6,182,212,0.4)',
                                color: 'rgba(6,182,212,1)',
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
              {isLoading && (
                <div className="flex justify-start">
                  <div className="px-3 py-2 rounded-2xl rounded-bl-md flex items-center gap-1.5"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 pb-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Ask Kai anything..."
                  className="flex-1 bg-transparent text-white/90 text-sm outline-none placeholder-white/30"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
                  style={{ background: input.trim() && !isLoading ? 'rgba(255,255,255,0.2)' : 'transparent' }}
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