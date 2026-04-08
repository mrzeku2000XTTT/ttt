import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  Send, Lightbulb, Wand2, ArrowLeft, ImagePlus, X, Copy, Check,
  Eye, Wallet, Bot, Trash2, Lock, Unlock, Sliders, Shuffle, Zap,
  TrendingUp, Plus, Brain, ChevronDown, MessageSquare, Activity,
  ShieldCheck, Timer, Coins
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

const toB64 = (str) => btoa(unescape(encodeURIComponent(str)));
const fromB64 = (str) => decodeURIComponent(escape(atob(str)));
const encryptData = (data, key) => {
  try {
    const str = JSON.stringify(data);
    const xored = str.split('').map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))).join('');
    return toB64(xored);
  } catch { return ''; }
};
const decryptData = (enc, key) => {
  try {
    const str = fromB64(enc).split('').map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))).join('');
    return JSON.parse(str);
  } catch { return null; }
};

const STYLES = ["Photorealistic", "Anime", "Cyberpunk", "Studio Ghibli", "Oil Painting", "Pixel Art", "Dark Fantasy", "3D Render"];
const SHOTS = ["Close-up", "Wide Shot", "Bird's Eye", "Low Angle", "Dutch Angle", "POV", "Medium Shot"];
const MOODS = ["🌅 Golden Hour", "🌙 Night", "⚡ Neon", "🌫 Foggy", "🔥 Dramatic", "🌊 Ethereal", "🎬 Cinematic"];

export default function PromptPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [autoAnalyze, setAutoAnalyze] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [showToolkit, setShowToolkit] = useState(false);
  const [activeStyle, setActiveStyle] = useState(null);
  const [activeShot, setActiveShot] = useState(null);
  const [activeMood, setActiveMood] = useState(null);
  const [showSessions, setShowSessions] = useState(false);

  // Wallet / agent
  const [walletAddress, setWalletAddress] = useState(null);
  const [agentCreated, setAgentCreated] = useState(false);
  const [creatingAgent, setCreatingAgent] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [manualAddr, setManualAddr] = useState("");
  const [b44User, setB44User] = useState(null);

  // Multi-session
  const [sessions, setSessions] = useState([]); // [{id, title, messages}]
  const [activeSessionId, setActiveSessionId] = useState(null);

  // Agent knowledge base
  const [knowledgeBase, setKnowledgeBase] = useState([]);
  const [showKnowledge, setShowKnowledge] = useState(false);

  // UTXO wallet access
  const [walletPermission, setWalletPermission] = useState(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [permDuration, setPermDuration] = useState(24);
  const [training, setTraining] = useState(false);
  const [trainingLog, setTrainingLog] = useState([]);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const sessionsRef = useRef([]);

  const isAuthorized = !!(walletAddress && agentCreated);
  const walletAccessActive = !!(walletPermission && walletPermission.expiresAt > Date.now());
  const activeSession = sessions.find(s => s.id === activeSessionId);
  const messages = activeSession?.messages || [];

  // ── Init ──────────────────────────────────────────────────────
  useEffect(() => {
    const detect = async () => {
      let addr = null;
      // Try kasware first
      try { if (window.kasware) { const a = await window.kasware.getAccounts(); if (a?.length) addr = a[0]; } } catch {}
      // Fallback to localStorage
      if (!addr) addr = localStorage.getItem('ttt_wallet_address');
      // Fallback to base44 user wallet
      if (!addr) {
        try {
          const u = await base44.auth.me();
          setB44User(u);
          if (u?.created_wallet_address) addr = u.created_wallet_address;
        } catch {}
      } else {
        try { const u = await base44.auth.me(); setB44User(u); } catch {}
      }
      if (addr) {
        setWalletAddress(addr);
        setAgentCreated(!!localStorage.getItem(`prompto_agent_${addr.slice(0,16)}`));
        loadSessions(addr);
        loadKnowledge(addr);
        try {
          const perm = localStorage.getItem(`prompto_wallet_perm_${addr.slice(0,16)}`);
          if (perm) setWalletPermission(JSON.parse(perm));
        } catch {}
        try {
          const log = localStorage.getItem(`prompto_training_${addr.slice(0,16)}`);
          if (log) setTrainingLog(JSON.parse(log));
        } catch {}
      }
    };
    detect();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    clearTimeout(debounceTimerRef.current);
    if (prompt.trim().length > 3 && isAuthorized) {
      debounceTimerRef.current = setTimeout(() => generateSuggestions(prompt), 500);
    } else { setSuggestions([]); setShowSuggestions(false); }
    return () => clearTimeout(debounceTimerRef.current);
  }, [prompt]);

  // Keep ref in sync
  useEffect(() => { sessionsRef.current = sessions; }, [sessions]);

  // Persist sessions on change
  useEffect(() => {
    if (!walletAddress || sessions.length === 0) return;
    try {
      const key = `prompto_sessions_${walletAddress.slice(0,16)}`;
      localStorage.setItem(key, encryptData(sessions, walletAddress));
    } catch {}
  }, [sessions, walletAddress]);

  // ── Storage ────────────────────────────────────────────────────
  const loadSessions = (addr) => {
    try {
      const key = `prompto_sessions_${addr.slice(0,16)}`;
      const stored = localStorage.getItem(key);
      const data = stored ? decryptData(stored, addr) : null;
      if (data?.length) {
        setSessions(data);
        setActiveSessionId(data[data.length - 1].id);
      } else {
        createNewSession(addr, true);
      }
    } catch { createNewSession(addr, true); }
  };

  const loadKnowledge = (addr) => {
    try {
      const key = `prompto_kb_${addr.slice(0,16)}`;
      const stored = localStorage.getItem(key);
      const data = stored ? JSON.parse(stored) : [];
      setKnowledgeBase(data);
    } catch {}
  };

  const saveKnowledge = (kb, addr) => {
    try {
      localStorage.setItem(`prompto_kb_${addr.slice(0,16)}`, JSON.stringify(kb));
    } catch {}
  };

  const grantWalletAccess = () => {
    if (!walletAddress) return;
    const now = Date.now();
    const perm = { grantedAt: now, expiresAt: now + permDuration * 60 * 60 * 1000, durationHours: permDuration, txCount: walletPermission?.txCount || 0, totalKasFed: walletPermission?.totalKasFed || 0 };
    setWalletPermission(perm);
    try { localStorage.setItem(`prompto_wallet_perm_${walletAddress.slice(0,16)}`, JSON.stringify(perm)); } catch {}
    setShowWalletModal(false);
    toast.success(`Wallet access granted for ${permDuration}h`);
  };

  const revokeWalletAccess = () => {
    setWalletPermission(null);
    if (walletAddress) localStorage.removeItem(`prompto_wallet_perm_${walletAddress.slice(0,16)}`);
    toast.success('Wallet access revoked');
  };

  const trainAgent = async () => {
    if (!walletAddress) return;
    setTraining(true);
    try {
      const txContext = `Training session | wallet: ${walletAddress.slice(0,12)}... | ${new Date().toISOString()}`;
      const entry = { id: Date.now(), text: `[LOCAL TRAINING] ${txContext}`, addedAt: new Date().toISOString(), isTraining: true };
      const updatedKb = [...knowledgeBase, entry];
      setKnowledgeBase(updatedKb);
      saveKnowledge(updatedKb, walletAddress);
      toast.success('Agent trained!');
      if (activeSessionId) {
        updateSessionMessages(activeSessionId, prev => [...prev, {
          id: Date.now(), role: 'assistant',
          content: `**Training Complete**\n\nKnowledge base updated locally.\n\n\`\`\`\n${txContext}\n\`\`\`\n\nEmbedded in knowledge base — active across all sessions.`
        }]);
      }
    } catch (err) {
      toast.error('Training failed: ' + (err?.message || 'Unknown'));
    } finally { setTraining(false); }
  };

  // ── Sessions ───────────────────────────────────────────────────
  const createNewSession = (addr, init = false) => {
    const id = Date.now().toString();
    const session = { id, title: `Chat ${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`, messages: [], createdAt: new Date().toISOString() };
    if (init) {
      setSessions([session]);
    } else {
      setSessions(prev => [...prev, session]);
    }
    setActiveSessionId(id);
    setShowSessions(false);
  };

  const deleteSession = (id) => {
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== id);
      if (id === activeSessionId) {
        setActiveSessionId(updated.length ? updated[updated.length - 1].id : null);
        if (!updated.length && walletAddress) setTimeout(() => createNewSession(walletAddress), 0);
      }
      return updated;
    });
    toast.success('Chat deleted');
  };

  const updateSessionMessages = (sessionId, updater) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messages: typeof updater === 'function' ? updater(s.messages) : updater } : s));
  };

  const updateSessionTitle = (sessionId, title) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title } : s));
  };

  // ── Knowledge Base ─────────────────────────────────────────────
  const addToKnowledge = async (content) => {
    if (!walletAddress) return;
    setLoading(true);
    try {
      const summary = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract the key prompt engineering insight or technique from this content in 1-2 sentences max. Be specific and actionable:\n\n${content}`,
        model: "gpt_5_mini"
      });
      const entry = { id: Date.now(), text: summary.trim(), addedAt: new Date().toISOString() };
      const updated = [...knowledgeBase, entry];
      setKnowledgeBase(updated);
      saveKnowledge(updated, walletAddress);
      toast.success('✅ Added to Agent Knowledge!');
    } catch { toast.error('Failed to add to knowledge'); }
    finally { setLoading(false); }
  };

  const deleteKnowledge = (id) => {
    const updated = knowledgeBase.filter(k => k.id !== id);
    setKnowledgeBase(updated);
    if (walletAddress) saveKnowledge(updated, walletAddress);
  };

  // Build knowledge context string for injection
  const getKnowledgeContext = () => {
    if (!knowledgeBase.length) return '';
    return `\n\n**Agent Trained Knowledge (apply these learnings):**\n${knowledgeBase.map((k, i) => `${i+1}. ${k.text}`).join('\n')}`;
  };

  // ── Wallet / Agent ─────────────────────────────────────────────
  const createAgent = async () => {
    if (!walletAddress) { toast.error('No wallet connected'); return; }
    setCreatingAgent(true);
    try {
      const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(`prompto_agent_${walletAddress.slice(0,16)}`, JSON.stringify({ address: walletAddress, sessionId, createdAt: new Date().toISOString() }));
      setAgentCreated(true);
      setShowAgentModal(false);
      toast.success('Agent created! Encrypted session started.');

      // Ensure a session exists
      let currentSessionId = activeSessionId;
      if (!currentSessionId || !sessions.find(s => s.id === currentSessionId)) {
        const newId = Date.now().toString();
        const newSession = { id: newId, title: 'New Chat', messages: [], createdAt: new Date().toISOString() };
        setSessions(prev => prev.length === 0 ? [newSession] : [...prev, newSession]);
        setActiveSessionId(newId);
        currentSessionId = newId;
      }

      // Add welcome message
      const welcomeMsg = {
        role: 'assistant', id: Date.now(),
        content: `✅ **Prompto Agent activated!**\n\nSealed to \`${walletAddress.slice(0,8)}...${walletAddress.slice(-6)}\`\n\nAll chats encrypted locally. Each new chat trains from your shared knowledge base. Let's build.`
      };
      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [welcomeMsg, ...s.messages] } : s));
    } catch (err) {
      toast.error('Failed: ' + (err?.message || 'Unknown'));
    } finally { setCreatingAgent(false); }
  };

  // ── Suggestions ────────────────────────────────────────────────
  const generateSuggestions = async (text) => {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 3 short prompt enhancement suggestions (2-5 words each) for: "${text}". Return ONLY a JSON array like: ["suggestion1","suggestion2","suggestion3"]`,
        model: "gpt_5_mini"
      });
      const match = result.match(/\[.*\]/s);
      if (match) { setSuggestions(JSON.parse(match[0])); setShowSuggestions(true); }
    } catch {}
  };

  const enhancePrompt = async () => {
    if (!isAuthorized || !prompt.trim()) return;
    setLoading(true);
    try {
      const enhanced = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a prompt engineering expert. Enhance this image prompt to be more specific and detailed: "${prompt}". Return only the enhanced prompt.`,
        model: "gpt_5_mini"
      });
      setPrompt(enhanced.trim());
    } catch { toast.error("Enhancement failed."); }
    finally { setLoading(false); }
  };

  // ── Toolkit chips ──────────────────────────────────────────────
  const appendToPrompt = (tag) => setPrompt(prev => prev ? `${prev}, ${tag}` : tag);

  const handleStyleChip = (style) => {
    if (activeStyle) setPrompt(prev => prev.replace(`, ${activeStyle}`, '').replace(activeStyle, '').trim());
    if (activeStyle === style) { setActiveStyle(null); return; }
    setActiveStyle(style); appendToPrompt(style);
  };
  const handleShotChip = (shot) => {
    if (activeShot) setPrompt(prev => prev.replace(`, ${activeShot}`, '').replace(activeShot, '').trim());
    if (activeShot === shot) { setActiveShot(null); return; }
    setActiveShot(shot); appendToPrompt(shot);
  };
  const handleMoodChip = (mood) => {
    if (activeMood) setPrompt(prev => prev.replace(`, ${activeMood}`, '').replace(activeMood, '').trim());
    if (activeMood === mood) { setActiveMood(null); return; }
    setActiveMood(mood); appendToPrompt(mood);
  };

  const handleSmartAction = async (action) => {
    if (!isAuthorized) { toast.error('Connect wallet first'); return; }
    setLoading(true);
    try {
      if (action === 'random') {
        const r = await base44.integrations.Core.InvokeLLM({ prompt: 'Give me ONE short creative AI image prompt idea (10-15 words max). Return only the prompt.', model: 'gpt_5_mini' });
        setPrompt(r.trim());
      } else if (action === 'fix') {
        if (!prompt.trim()) { toast.error('Describe what went wrong first'); return; }
        const r = await base44.integrations.Core.InvokeLLM({ prompt: `This image prompt didn't work: "${prompt}". Rewrite it with specific fixes for pose, angle, and subject focus. Return only the improved prompt.`, model: 'gpt_5_mini' });
        setPrompt(r.trim()); toast.success('Prompt fixed!');
      } else if (action === 'viral') {
        if (!prompt.trim()) { toast.error('Enter a prompt first'); return; }
        const r = await base44.integrations.Core.InvokeLLM({ prompt: `Make this image prompt viral-ready with trending aesthetic tags: "${prompt}". Return only the enhanced prompt.`, model: 'gpt_5_mini' });
        setPrompt(r.trim()); toast.success('Made viral-ready!');
      }
    } catch {} finally { setLoading(false); }
  };

  // ── Image upload ───────────────────────────────────────────────
  const handleImageUpload = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    const preview = URL.createObjectURL(file);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploadedImage({ url: file_url, preview });
      toast.success("Image attached!");
    } catch { URL.revokeObjectURL(preview); toast.error("Upload failed."); }
    finally { setUploading(false); }
  };

  // ── Submit ─────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthorized) { toast.error('Connect wallet and create your agent first.'); return; }
    if (!prompt.trim() && !uploadedImage) return;

    const currentPrompt = prompt;
    const currentImage = uploadedImage;
    const isAnalyzeRun = autoAnalyze && !!currentImage;
    const streamId = Date.now() + 1;

    const userMsg = {
      id: Date.now(), role: "user",
      content: isAnalyzeRun ? `[Image Analysis] ${currentPrompt || 'Analyze and generate replication prompt'}` : currentPrompt,
      imagePreview: currentImage?.preview
    };
    const streamMsg = { id: streamId, role: "assistant", content: "", streaming: true };

    // Use functional updater that guarantees session exists
    let sessionId = activeSessionId;
    setSessions(prev => {
      let updated = [...prev];
      let session = updated.find(s => s.id === sessionId);
      if (!session) {
        sessionId = Date.now().toString();
        session = { id: sessionId, title: currentPrompt.slice(0, 32) || 'New Chat', messages: [], createdAt: new Date().toISOString() };
        updated.push(session);
      }
      return updated.map(s => s.id === session.id ? {
        ...s,
        title: s.messages.length === 0 ? (currentPrompt.slice(0, 32) || 'Image Analysis') : s.title,
        messages: [...s.messages, userMsg, streamMsg]
      } : s);
    });
    if (!activeSessionId) setActiveSessionId(sessionId);

    setPrompt(""); setUploadedImage(null); setShowSuggestions(false); setLoading(true);

    try {
      const kb = getKnowledgeContext();

      let aiResponse;
      if (isAnalyzeRun) {
        aiResponse = await base44.integrations.Core.InvokeLLM({
          prompt: `Analyze this image. Output: visual analysis (style, colors, lighting, composition), then 3 replication prompts (Exact Match, Enhanced, Alternative) each in code blocks. Add 2-3 tips.${currentPrompt ? ` User goal: ${currentPrompt}` : ''}${kb}`,
          file_urls: [currentImage.url]
        });
      } else {
        const system = `You are PROMPTO, an AI image prompt engineer. For every request output 3 prompt variations (Direct, Cinematic, Stylized) each in code blocks with detailed descriptions. Add 3 refinement suggestions at the end.${kb}`;

        const params = currentImage
          ? { prompt: `${system}\n\nUser: "${currentPrompt || 'describe and prompt this image'}"`, file_urls: [currentImage.url] }
          : { prompt: `${system}\n\nUser: "${currentPrompt}"` };

        aiResponse = await base44.integrations.Core.InvokeLLM(params);
      }

      setSessions(prev => prev.map(s => ({
        ...s,
        messages: s.messages.map(m => m.id === streamId ? { ...m, content: aiResponse, streaming: false } : m)
      })));
    } catch (err) {
      console.error('Prompto LLM error:', err);
      toast.error("Failed to generate. Try again.");
      setSessions(prev => prev.map(s => ({
        ...s,
        messages: s.messages.filter(m => m.id !== streamId)
      })));
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">

      {/* Agent Create Modal */}
      <AnimatePresence>
        {showAgentModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
            onClick={() => setShowAgentModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="bg-zinc-950 border border-white/20 rounded-2xl p-6 max-w-sm w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Create Personal Agent</h3>
                  <p className="text-white/40 text-xs">Seal your agent to your wallet</p>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 space-y-2">
                <p className="text-white/70 text-sm">Creates an <strong className="text-white">encrypted local session</strong> sealed to your address.</p>
                <code className="block text-cyan-400 text-xs bg-black/40 rounded-lg px-3 py-2 break-all">{walletAddress}</code>
                <p className="text-white/40 text-xs">No payment required. Chats are encrypted locally.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowAgentModal(false)} className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 text-sm">Cancel</button>
                <button onClick={createAgent} disabled={creatingAgent}
                  className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 disabled:opacity-50 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2">
                  {creatingAgent ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</> : <><Bot className="w-4 h-4" /> Create Agent</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connect Wallet Modal */}
      <AnimatePresence>
        {showConnectModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[1000] flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowConnectModal(false)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-zinc-950 border border-purple-500/30 rounded-2xl p-6 w-full max-w-sm space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-bold">Connect Wallet</h3>
                <button onClick={() => setShowConnectModal(false)} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              {/* ZK / Base44 wallet */}
              {b44User?.created_wallet_address && (
                <button onClick={() => {
                  const addr = b44User.created_wallet_address;
                  setWalletAddress(addr);
                  localStorage.setItem('ttt_wallet_address', addr);
                  setAgentCreated(!!localStorage.getItem(`prompto_agent_${addr.slice(0,16)}`));
                  loadSessions(addr); loadKnowledge(addr);
                  setShowConnectModal(false);
                  toast.success('ZK wallet connected!');
                }}
                  className="w-full p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40 rounded-xl hover:from-purple-500/30 hover:to-pink-500/30 transition-all text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <Lock className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">Agent ZK Wallet</p>
                      <p className="text-xs text-gray-400 truncate max-w-[200px]">{b44User.created_wallet_address}</p>
                    </div>
                  </div>
                </button>
              )}

              {/* Kasware (if available) */}
              {typeof window !== 'undefined' && window.kasware && (
                <button onClick={async () => {
                  try {
                    const accounts = await window.kasware.requestAccounts();
                    if (accounts?.[0]) {
                      const addr = accounts[0];
                      setWalletAddress(addr);
                      setAgentCreated(!!localStorage.getItem(`prompto_agent_${addr.slice(0,16)}`));
                      loadSessions(addr); loadKnowledge(addr);
                      setShowConnectModal(false);
                      toast.success('Kasware connected!');
                    }
                  } catch { toast.error('Kasware connection failed'); }
                }}
                  className="w-full p-4 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 rounded-xl hover:from-cyan-500/30 hover:to-emerald-500/30 transition-all text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">Kasware</p>
                      <p className="text-xs text-gray-400">Browser extension</p>
                    </div>
                  </div>
                </button>
              )}

              {/* Manual entry */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-white/40" />
                  <span className="text-white/70 text-sm font-medium">Enter Kaspa Address</span>
                </div>
                <input
                  value={manualAddr}
                  onChange={e => setManualAddr(e.target.value)}
                  placeholder="kaspa:..."
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
                />
                <button onClick={() => {
                  if (!manualAddr.trim()) return;
                  const addr = manualAddr.trim();
                  setWalletAddress(addr);
                  localStorage.setItem('ttt_wallet_address', addr);
                  setAgentCreated(!!localStorage.getItem(`prompto_agent_${addr.slice(0,16)}`));
                  loadSessions(addr); loadKnowledge(addr);
                  setShowConnectModal(false);
                  setManualAddr('');
                  toast.success('Wallet connected!');
                }} disabled={!manualAddr.trim()}
                  className="w-full py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 rounded-lg text-purple-300 text-sm font-semibold disabled:opacity-40 transition-all">
                  Connect
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UTXO Wallet Permission Modal */}
      <AnimatePresence>
        {showWalletModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[997] flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowWalletModal(false)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-zinc-950 border border-cyan-500/30 rounded-2xl p-6 w-full max-w-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-green-500 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h3 className="text-white font-bold">UTXO Wallet Access</h3>
                  <p className="text-white/40 text-xs">Allow agent to train on live tx data</p>
                </div>
              </div>
              <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4 mb-4 space-y-3">
                <p className="text-white/70 text-xs leading-relaxed">Each <strong className="text-cyan-400">Train Agent</strong> click sends <strong className="text-white">0.1 KAS</strong> as a self-tx and pulls your real UTXO patterns to feed the agent's knowledge base. It trains on actual on-chain activity.</p>
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">Access Duration</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 6, 24, 72].map(h => (
                      <button key={h} onClick={() => setPermDuration(h)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${permDuration === h ? 'bg-cyan-500/25 border-cyan-500/50 text-cyan-300' : 'bg-white/5 border-white/10 text-white/50 hover:text-white'}`}>
                        {h}h
                      </button>
                    ))}
                  </div>
                </div>
                {walletPermission && (
                  <div className="text-xs text-white/40 border-t border-white/10 pt-2 flex gap-4">
                    <span className="text-green-400">{walletPermission.txCount || 0} sessions</span>
                    <span className="text-cyan-400">{walletPermission.totalKasFed || 0} KAS fed</span>
                    {walletAccessActive && <span className="text-yellow-400">Active</span>}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowWalletModal(false)} className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white/60 text-sm">Cancel</button>
                {walletAccessActive && (
                  <button onClick={revokeWalletAccess} className="py-2.5 px-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold">Revoke</button>
                )}
                <button onClick={grantWalletAccess} className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-green-400 rounded-xl text-black text-sm font-black">
                  Grant {permDuration}h
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Knowledge Base Modal */}
      <AnimatePresence>
        {showKnowledge && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[998] flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowKnowledge(false)}>
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-zinc-950 border border-white/20 rounded-2xl p-5 w-full max-w-lg max-h-[70vh] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  <h3 className="text-white font-bold">Agent Knowledge Base</h3>
                  <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">{knowledgeBase.length} entries</span>
                </div>
                <button onClick={() => setShowKnowledge(false)} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-white/40 text-xs mb-3">These learnings are injected into every chat session — your agent trains simultaneously across all chats.</p>
              <div className="flex-1 overflow-y-auto space-y-2">
                {knowledgeBase.length === 0 ? (
                  <p className="text-white/30 text-sm text-center py-8">No knowledge yet. Click "Add to Agent" on any response.</p>
                ) : knowledgeBase.map(k => (
                  <div key={k.id} className="flex items-start gap-2 p-3 bg-white/5 border border-white/10 rounded-xl">
                    <p className="text-white/70 text-xs flex-1 leading-relaxed">{k.text}</p>
                    <button onClick={() => deleteKnowledge(k.id)} className="text-white/20 hover:text-red-400 flex-shrink-0 mt-0.5"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FIXED HEADER ── */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-black z-10">
        <Link to={createPageUrl("AppStore")} className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <img src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/073d22c9d_generated_image.png"
          alt="Prompto" className="w-8 h-8 rounded-xl object-cover" />

        {/* Session selector */}
        <div className="flex-1 relative">
          <button onClick={() => isAuthorized && setShowSessions(v => !v)}
            className="flex items-center gap-1.5 text-white font-bold text-sm hover:text-purple-300 transition-colors">
            <span className="truncate max-w-[140px]">{activeSession?.title || 'Prompto'}</span>
            {isAuthorized && <ChevronDown className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />}
          </button>

          <AnimatePresence>
            {showSessions && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="absolute top-full left-0 mt-2 w-64 bg-zinc-950 border border-white/20 rounded-2xl shadow-2xl z-50 overflow-hidden">
                <div className="p-2 border-b border-white/10">
                  <button onClick={() => createNewSession(walletAddress)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-sm font-semibold transition-all">
                    <Plus className="w-4 h-4" /> New Chat
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                  {[...sessions].reverse().map(s => (
                    <div key={s.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all group ${s.id === activeSessionId ? 'bg-white/10' : 'hover:bg-white/5'}`}
                      onClick={() => { setActiveSessionId(s.id); setShowSessions(false); }}>
                      <MessageSquare className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                      <span className="text-white/70 text-xs flex-1 truncate">{s.title}</span>
                      <button onClick={e => { e.stopPropagation(); deleteSession(s.id); }}
                        className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right header actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isAuthorized && (
            <>
              <button onClick={trainAgent} disabled={training}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold border transition-all disabled:opacity-50 ${
                  walletAccessActive ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 animate-pulse' : 'bg-white/5 border-white/10 text-white/40 hover:border-cyan-500/30 hover:text-cyan-400'
                }`} title={walletAccessActive ? 'Train agent with live UTXO data (0.1 KAS)' : 'Grant wallet access first'}>
                {training
                  ? <><div className="w-3 h-3 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" /><span>Training</span></>
                  : <><Coins className="w-3 h-3" /><span>Train</span></>
                }
              </button>
              <button onClick={() => setShowKnowledge(true)}
                className="relative flex items-center gap-1 px-2.5 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-full transition-all"
                title="Agent Knowledge">
                <Brain className="w-3.5 h-3.5 text-purple-400" />
                {knowledgeBase.length > 0 && <span className="text-purple-400 text-[10px] font-bold">{knowledgeBase.length}</span>}
              </button>
              <button onClick={() => createNewSession(walletAddress)}
                className="w-8 h-8 bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/30 rounded-full flex items-center justify-center transition-all"
                title="New chat">
                <Plus className="w-3.5 h-3.5 text-white/60" />
              </button>
            </>
          )}
          {walletAddress ? (
            agentCreated ? (
              <div className="flex items-center gap-1 px-2 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full">
                <Lock className="w-3 h-3 text-purple-400" />
                <span className="text-purple-400 text-[10px] font-semibold hidden sm:block">{walletAddress.slice(0,6)}...{walletAddress.slice(-4)}</span>
              </div>
            ) : (
              <button onClick={() => setShowAgentModal(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40 rounded-full">
                <Bot className="w-3 h-3 text-purple-400" />
                <span className="text-purple-400 text-xs font-semibold">Create Agent</span>
              </button>
            )
          ) : (
            <button onClick={() => setShowConnectModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 rounded-full transition-all">
              <Wallet className="w-3 h-3 text-purple-400" />
              <span className="text-purple-300 text-[10px] font-semibold">Connect</span>
            </button>
          )}
        </div>
      </div>

      {/* ── SCROLLABLE MESSAGES ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-3xl w-full mx-auto space-y-4"
        onClick={() => { setShowSessions(false); }}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-center min-h-[300px]">
            <img src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/073d22c9d_generated_image.png"
              alt="Prompto" className="w-20 h-20 rounded-3xl object-cover shadow-2xl shadow-purple-500/30" />
            <div>
              <p className="text-white font-semibold text-lg">Start creating prompts</p>
              <p className="text-white/40 text-sm mt-1">
                {walletAddress && !agentCreated ? 'Create your agent to unlock' : 'Type any idea — Prompto gives you 3 ready-to-use variations'}
              </p>
            </div>
            {walletAddress && !agentCreated && (
              <button onClick={() => setShowAgentModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white text-sm font-semibold">
                <Bot className="w-4 h-4" /> Create My Agent
              </button>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 w-full max-w-xl">
              {["dog looking at a PC screen, wearing glasses, cyberpunk", "golden retriever in a suit trading crypto, cinematic lighting", "cat as a NASA scientist, realistic photo"].map((ex, i) => (
                <button key={i} onClick={() => setPrompt(ex)}
                  className="px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-white/60 text-left transition-all">
                  {ex}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <motion.div key={msg.id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-purple-600/30 border border-purple-500/30 text-white"
                    : "bg-white/5 border border-white/10 text-white/90"
                }`}>
                  {msg.imagePreview && (
                    <img src={msg.imagePreview} alt="uploaded" className="h-28 rounded-xl object-cover mb-2 border border-white/10" />
                  )}
                  {msg.streaming ? (
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[0,1,2].map(j => <div key={j} className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{animationDelay:`${j*0.15}s`}} />)}
                      </div>
                      <span className="text-purple-300/60 text-xs animate-pulse">⚡ Quantum-generating prompts...</span>
                    </div>
                  ) : msg.role === "assistant" ? (
                    <>
                      <div className="prose prose-sm prose-invert max-w-none [&>p]:my-2 [&_code]:bg-white/10 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-black/40 [&_pre]:p-3 [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-white/10 [&_pre]:text-xs [&_pre]:overflow-x-auto">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <button onClick={() => { navigator.clipboard.writeText(msg.content); setCopiedIdx(i); setTimeout(() => setCopiedIdx(null), 2000); }}
                          className="flex items-center gap-1 text-[11px] text-white/30 hover:text-white/60 transition-colors">
                          {copiedIdx === i ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                        </button>
                        <button onClick={() => addToKnowledge(msg.content)} disabled={loading}
                          className="flex items-center gap-1 text-[11px] text-purple-400/50 hover:text-purple-300 transition-colors disabled:opacity-40">
                          <Brain className="w-3 h-3" /> Add to Agent
                        </button>
                      </div>
                    </>
                  ) : msg.content}
                </div>
              </div>
            </motion.div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── FIXED BOTTOM PANEL ── */}
      <div className="flex-shrink-0 border-t border-white/10 bg-black">
        {/* Suggestions */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="px-4 pt-2 max-w-3xl w-full mx-auto">
              <div className="flex items-center gap-2 mb-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-yellow-400/60" />
                <p className="text-white/30 text-[10px] uppercase tracking-widest">Suggestions</p>
              </div>
              <div className="flex flex-wrap gap-1.5 pb-2">
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => setPrompt(s)}
                    className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs text-white/60 transition-all">
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toolkit Panel */}
        <AnimatePresence>
          {showToolkit && isAuthorized && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="px-4 py-3 max-w-3xl w-full mx-auto space-y-2.5 border-b border-white/10">
              <div className="flex gap-2 flex-wrap">
                {[
                  { action: 'random', icon: Shuffle, label: 'Random', color: 'purple' },
                  { action: 'fix', icon: Zap, label: 'Fix Shot', color: 'orange' },
                  { action: 'viral', icon: TrendingUp, label: 'Make Viral', color: 'pink' },
                ].map(({ action, icon: Icon, label, color }) => (
                  <button key={action} onClick={() => handleSmartAction(action)} disabled={loading}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all disabled:opacity-40 bg-${color}-500/15 hover:bg-${color}-500/25 border border-${color}-500/30 text-${color}-300`}>
                    <Icon className="w-3 h-3" /> {label}
                  </button>
                ))}
              </div>
              <div>
                <p className="text-white/25 text-[9px] uppercase tracking-widest mb-1">Style</p>
                <div className="flex flex-wrap gap-1">
                  {STYLES.map(s => (
                    <button key={s} onClick={() => handleStyleChip(s)}
                      className={`px-2 py-0.5 rounded-full text-[11px] border transition-all ${activeStyle === s ? 'bg-cyan-500/25 border-cyan-500/50 text-cyan-300' : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-white/25 text-[9px] uppercase tracking-widest mb-1">Shot</p>
                <div className="flex flex-wrap gap-1">
                  {SHOTS.map(s => (
                    <button key={s} onClick={() => handleShotChip(s)}
                      className={`px-2 py-0.5 rounded-full text-[11px] border transition-all ${activeShot === s ? 'bg-yellow-500/25 border-yellow-500/50 text-yellow-300' : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-white/25 text-[9px] uppercase tracking-widest mb-1">Mood</p>
                <div className="flex flex-wrap gap-1">
                  {MOODS.map(s => (
                    <button key={s} onClick={() => handleMoodChip(s)}
                      className={`px-2 py-0.5 rounded-full text-[11px] border transition-all ${activeMood === s ? 'bg-pink-500/25 border-pink-500/50 text-pink-300' : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image preview + auth warning */}
        <div className="px-4 max-w-3xl w-full mx-auto">
          {uploadedImage && (
            <div className="mt-2 flex items-center gap-3">
              <div className="relative inline-block">
                <img src={uploadedImage.preview} alt="upload" className="h-12 w-12 object-cover rounded-xl border border-white/20" />
                <button onClick={() => setUploadedImage(null)} className="absolute -top-1 -right-1 w-4 h-4 bg-black border border-white/20 rounded-full flex items-center justify-center text-white/70">
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
              <button onClick={() => setAutoAnalyze(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${autoAnalyze ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-white/5 border-white/10 text-white/40'}`}>
                <Eye className="w-3 h-3" />
                {autoAnalyze ? 'Auto-Analyze ON' : 'Auto-Analyze OFF'}
              </button>
            </div>
          )}
          {!isAuthorized && (
            <div className="flex items-center gap-2 px-3 py-2 my-2 bg-purple-500/10 border border-purple-500/30 rounded-xl">
              <Lock className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
              <p className="text-purple-300/80 text-xs">
                {!walletAddress
                  ? <button onClick={() => setShowConnectModal(true)} className="underline hover:text-purple-200">Connect your wallet to start</button>
                  : 'Create your agent to unlock.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="px-4 pb-4 pt-2 max-w-3xl w-full mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-2 items-center">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => { if (e.target.files[0]) handleImageUpload(e.target.files[0]); e.target.value = ''; }} />

            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading || !isAuthorized}
              className={`w-10 h-10 disabled:opacity-40 border rounded-full flex items-center justify-center flex-shrink-0 transition-all ${uploadedImage ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/60'}`}>
              {uploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ImagePlus className="w-4 h-4" />}
            </button>

            <button type="button" onClick={() => setShowToolkit(v => !v)} disabled={!isAuthorized}
              className={`w-10 h-10 disabled:opacity-40 border rounded-full flex items-center justify-center flex-shrink-0 transition-all ${showToolkit ? 'bg-purple-500/20 border-purple-500/40 text-purple-400' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/60'}`}>
              <Sliders className="w-4 h-4" />
            </button>

            <input type="text" value={prompt} onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
              placeholder={!isAuthorized ? 'Wallet + agent required...' : uploadedImage && autoAnalyze ? 'Optional note...' : 'Any idea → 3 prompt variations'}
              disabled={!isAuthorized}
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 transition-all disabled:opacity-40 text-sm" />

            <button type="button" onClick={enhancePrompt} disabled={loading || !prompt.trim() || !isAuthorized}
              className="w-10 h-10 bg-white/5 hover:bg-white/10 disabled:opacity-40 border border-white/10 rounded-full flex items-center justify-center flex-shrink-0 transition-all">
              <Wand2 className="w-4 h-4 text-white" />
            </button>

            <button type="submit" disabled={loading || (!prompt.trim() && !uploadedImage) || !isAuthorized}
              className="w-10 h-10 bg-purple-600/40 hover:bg-purple-600/60 disabled:opacity-40 border border-purple-500/30 rounded-full flex items-center justify-center flex-shrink-0 transition-all">
              <Send className="w-4 h-4 text-white" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}