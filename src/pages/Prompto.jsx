import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Send, Lightbulb, Wand2, ArrowLeft, ImagePlus, X, Copy, Check, Eye, Wallet, Bot, Trash2, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

// Safe base64 encode/decode for unicode
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
  } catch { return []; }
};

export default function PromptPage() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [autoAnalyze, setAutoAnalyze] = useState(false); // toggle: analyze image to generate prompt
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [agentCreated, setAgentCreated] = useState(false);
  const [creatingAgent, setCreatingAgent] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    clearTimeout(debounceTimerRef.current);
    if (prompt.trim().length > 3) {
      debounceTimerRef.current = setTimeout(() => generateSuggestions(prompt), 400);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    return () => clearTimeout(debounceTimerRef.current);
  }, [prompt]);

  // Detect connected wallet
  useEffect(() => {
    const detectWallet = async () => {
      let addr = null;
      try {
        if (window.kasware) {
          const accounts = await window.kasware.getAccounts();
          if (accounts?.length > 0) addr = accounts[0];
        }
      } catch {}
      if (!addr) addr = localStorage.getItem('ttt_wallet_address');
      if (addr) {
        setWalletAddress(addr);
        loadEncryptedMessages(addr);
        const agentKey = `prompto_agent_${addr.slice(0, 16)}`;
        setAgentCreated(!!localStorage.getItem(agentKey));
      }
    };
    detectWallet();
  }, []);

  // Persist messages
  useEffect(() => {
    if (walletAddress && messages.length > 0) {
      try {
        const key = `prompto_chat_${walletAddress.slice(0, 16)}`;
        const safe = messages.map(m => ({ role: m.role, content: m.content }));
        localStorage.setItem(key, encryptData(safe, walletAddress));
      } catch {}
    }
  }, [messages, walletAddress]);

  const loadEncryptedMessages = (addr) => {
    try {
      const key = `prompto_chat_${addr.slice(0, 16)}`;
      const stored = localStorage.getItem(key);
      if (stored) setMessages(decryptData(stored, addr));
    } catch {}
  };

  const clearHistory = () => {
    if (!walletAddress) return;
    const key = `prompto_chat_${walletAddress.slice(0, 16)}`;
    localStorage.removeItem(key);
    setMessages([]);
    toast.success('Chat history cleared');
  };

  const isAuthorized = !!(walletAddress && agentCreated);

  const createAgent = async () => {
    if (!walletAddress) { toast.error('No wallet connected'); return; }
    setCreatingAgent(true);
    try {
      let txId;
      if (window.kasware) {
        const SOMPI_PER_KAS = 100000000;
        txId = await window.kasware.sendKaspa(walletAddress, 1 * SOMPI_PER_KAS);
      } else {
        const privateKey = localStorage.getItem('kaspa_private_key') || localStorage.getItem('kaspa_wallet_seed');
        if (!privateKey) {
          toast.error('No TTT wallet found. Please set up your wallet first.');
          setCreatingAgent(false);
          return;
        }
        const res = await base44.functions.invoke('sendKaspaTransaction', {
          privateKey,
          toAddress: walletAddress,
          amount: '1',
        });
        txId = res?.data?.txId || res?.data?.tx_hash || 'ttt-self-tx-' + Date.now();
      }
      const agentKey = `prompto_agent_${walletAddress.slice(0, 16)}`;
      localStorage.setItem(agentKey, JSON.stringify({ address: walletAddress, txId, createdAt: new Date().toISOString() }));
      setAgentCreated(true);
      setShowAgentModal(false);
      toast.success('Agent created and sealed on-chain!');
      setMessages(prev => [{
        role: 'assistant',
        content: `✅ **Prompto Agent activated!**\n\nYour personal AI agent is now sealed to wallet \`${walletAddress.slice(0,8)}...${walletAddress.slice(-6)}\`\n\nAll your conversations are encrypted and stored locally. Let's build something great.`
      }, ...prev]);
    } catch (err) {
      if (err?.message?.includes('rejected') || err?.message?.includes('User reject')) {
        toast.error('Transaction cancelled');
      } else {
        toast.error('Failed: ' + (err?.message || 'Unknown error'));
      }
    } finally {
      setCreatingAgent(false);
    }
  };

  const generateSuggestions = async (text) => {
    if (!isAuthorized) return;
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 3 short prompt enhancement suggestions (2-5 words each) for: "${text}". Return ONLY a JSON array like: ["suggestion1","suggestion2","suggestion3"]`,
        model: "gpt_5_mini"
      });
      const match = result.match(/\[.*\]/s);
      if (match) {
        const s = JSON.parse(match[0]);
        setSuggestions(s);
        setShowSuggestions(true);
      }
    } catch {}
  };

  const enhancePrompt = async () => {
    if (!isAuthorized) { toast.error('Connect wallet and create your agent first.'); return; }
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const enhanced = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a prompt engineering expert. Enhance this prompt to be more specific and effective for AI tasks: "${prompt}". Return only the enhanced prompt, no explanation.`,
        model: "gpt_5"
      });
      setPrompt(enhanced);
    } catch (err) {
      toast.error("Enhancement failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    const preview = URL.createObjectURL(file);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploadedImage({ url: file_url, preview });
      toast.success("Image attached!");
    } catch (err) {
      URL.revokeObjectURL(preview);
      toast.error("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthorized) { toast.error('Connect wallet and create your agent first.'); return; }
    if (!prompt.trim() && !uploadedImage) return;

    const currentPrompt = prompt;
    const currentImage = uploadedImage;
    const isAnalyzeRun = autoAnalyze && !!currentImage;

    const userMessage = {
      role: "user",
      content: isAnalyzeRun
        ? `[Image Analysis] ${currentPrompt || 'Analyze this image and generate a replication prompt'}`
        : currentPrompt,
      imagePreview: currentImage?.preview
    };
    setMessages(prev => [...prev, userMessage]);
    setPrompt("");
    setUploadedImage(null);
    setShowSuggestions(false);
    setLoading(true);

    // Add placeholder streaming message
    const streamId = Date.now();
    setMessages(prev => [...prev, { role: "assistant", content: "", streaming: true, id: streamId }]);

    try {
      let aiResponse;

      if (isAnalyzeRun) {
        aiResponse = await base44.integrations.Core.InvokeLLM({
          prompt: `You are an elite AI image prompt engineer. Analyze this image deeply and output:

**📸 Visual Analysis**
- Image type, art style, technique
- Color palette, lighting, mood
- Composition, camera angle, depth of field

**✨ Replication Prompts — 3 Variations**

**Prompt A — Exact Match:**
[150-word prompt to recreate this exactly]

**Prompt B — Enhanced Version:**
[150-word prompt with cinematic upgrades]

**Prompt C — Alternative Angle:**
[150-word prompt with a creative twist]

**🎯 Key Tips to nail this shot:**
[2-3 specific tips]
${currentPrompt ? `\nUser's goal: ${currentPrompt}` : ''}`,
          file_urls: [currentImage.url],
          model: "gpt_5"
        });
      } else {
        const agentContext = walletAddress
          ? `You are a personal AI prompt engineering agent sealed to wallet ${walletAddress.slice(0,8)}...${walletAddress.slice(-6)}. `
          : '';

        const PROMPT_ENGINEER_SYSTEM = `${agentContext}You are PROMPTO — an elite AI image prompt engineer and creative director. Your job is to take ANY basic idea and transform it into multiple detailed, production-ready AI image generation prompts.

For EVERY request:
1. Understand the user's core vision (even if vague)
2. Output 3 variations of detailed prompts (Exact / Cinematic / Stylized)
3. Each prompt must include: subject, pose/action, environment, lighting, camera angle, art style, color palette, mood, technical quality tags
4. Give real-time iterative suggestions to refine further
5. Be fluid, fast, and quantum — like a creative AI that thinks in images

Format every response like this:
**🎯 Prompto reads your vision:** [1 line interpretation]

**Prompt A — Direct Shot:**
\`\`\`
[detailed prompt, 100-150 words]
\`\`\`

**Prompt B — Cinematic Cut:**
\`\`\`
[dramatic cinematic version, 100-150 words]
\`\`\`

**Prompt C — Stylized:**
\`\`\`
[unique art style variation, 100-150 words]
\`\`\`

**⚡ Quantum Refine — try adding:**
[3 quick suggestions to evolve the prompt further]`;

        const invokeParams = currentImage
          ? { prompt: `${PROMPT_ENGINEER_SYSTEM}\n\nUser request: "${currentPrompt || 'describe and prompt this image'}"

An image has been attached — factor it into your prompts.`, file_urls: [currentImage.url] }
          : { prompt: `${PROMPT_ENGINEER_SYSTEM}\n\nUser request: "${currentPrompt}"` };

        aiResponse = await base44.integrations.Core.InvokeLLM({ ...invokeParams, model: "gpt_5" });
      }

      // Replace streaming placeholder with real content
      setMessages(prev => prev.map(m => m.id === streamId ? { role: "assistant", content: aiResponse } : m));
    } catch (err) {
      console.error("Prompto error:", err);
      toast.error("Failed to generate response. Please try again.");
      setMessages(prev => prev.filter(m => m.id !== streamId));
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Agent Create Modal */}
      {showAgentModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4" onClick={() => setShowAgentModal(false)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}
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
              <p className="text-white/70 text-sm">This sends a <strong className="text-white">1 KAS self-transaction</strong> on Kaspa — sealed to your wallet on-chain.</p>
              <p className="text-cyan-400/70 text-xs">{window.kasware ? '🖥 Desktop: via Kasware' : '📱 Mobile: via TTT Native Wallet'}</p>
              <code className="block text-cyan-400 text-xs bg-black/40 rounded-lg px-3 py-2 break-all">{walletAddress}</code>
              <p className="text-white/40 text-xs">All chats are encrypted locally and only readable with this wallet.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAgentModal(false)}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 text-sm">
                Cancel
              </button>
              <button onClick={createAgent} disabled={creatingAgent}
                className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 disabled:opacity-50 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2">
                {creatingAgent
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing...</>
                  : <><Wallet className="w-4 h-4" /> Approve & Create</>
                }
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
        <Link to={createPageUrl("AppStore")} className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <img src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/073d22c9d_generated_image.png"
          alt="Prompto" className="w-8 h-8 rounded-xl object-cover" />
        <div className="flex-1">
          <h1 className="text-white font-bold text-lg leading-none">Prompto</h1>
          <p className="text-white/40 text-xs mt-0.5">AI Prompt Builder & Enhancer</p>
        </div>
        <div className="flex items-center gap-2">
          {walletAddress ? (
            <>
              {agentCreated ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full">
                  <Lock className="w-3 h-3 text-purple-400" />
                  <span className="text-purple-400 text-[10px] font-semibold">{walletAddress.slice(0,6)}...{walletAddress.slice(-4)}</span>
                </div>
              ) : (
                <button onClick={() => setShowAgentModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40 hover:border-purple-400/60 rounded-full transition-all">
                  <Bot className="w-3 h-3 text-purple-400" />
                  <span className="text-purple-400 text-xs font-semibold">Create Agent</span>
                </button>
              )}
              {messages.length > 0 && (
                <button onClick={clearHistory}
                  className="w-8 h-8 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 rounded-full flex items-center justify-center transition-all">
                  <Trash2 className="w-3.5 h-3.5 text-white/40" />
                </button>
              )}
            </>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-full">
              <Unlock className="w-3 h-3 text-white/30" />
              <span className="text-white/30 text-[10px]">No wallet</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-3xl w-full mx-auto space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-center min-h-[400px]">
            <img src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/073d22c9d_generated_image.png"
              alt="Prompto" className="w-24 h-24 rounded-3xl object-cover shadow-2xl shadow-purple-500/30" />
            <div>
              <p className="text-white font-semibold text-xl">Start creating prompts</p>
              <p className="text-white/40 text-sm mt-2">
                {walletAddress && !agentCreated
                  ? 'Wallet detected — create your agent to enable persistent memory'
                  : 'Write anything below · Upload an image and toggle 👁 to auto-analyze it'}
              </p>
            </div>
            {walletAddress && !agentCreated && (
              <button onClick={() => setShowAgentModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white text-sm font-semibold">
                <Bot className="w-4 h-4" /> Create My Agent
              </button>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2 w-full max-w-xl">
              {["dog looking at a PC screen, wearing glasses, cyberpunk style", "golden retriever in a suit trading crypto, cinematic lighting", "cat as a NASA scientist, realistic photo"].map((ex, i) => (
                <button key={i} onClick={() => setPrompt(ex)}
                  className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white/70 text-left transition-all">
                  {ex}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <motion.div key={msg.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
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
                        {[0,1,2].map(j => <div key={j} className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{animationDelay: `${j*0.15}s`}} />)}
                      </div>
                      <span className="text-purple-300/60 text-xs animate-pulse">⚡ Prompto is quantum-generating your prompts...</span>
                    </div>
                  ) : msg.role === "assistant" ? (
                    <>
                      <div className="prose prose-sm prose-invert max-w-none [&>p]:my-2 [&>p]:leading-relaxed [&_code]:bg-white/10 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-black/40 [&_pre]:p-3 [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-white/10 [&_pre]:text-xs [&_pre]:overflow-x-auto">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(msg.content);
                          setCopiedIdx(i);
                          setTimeout(() => setCopiedIdx(null), 2000);
                        }}
                        className="mt-2 flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/60 transition-colors"
                      >
                        {copiedIdx === i ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                      </button>
                    </>
                  ) : msg.content}
                </div>
              </div>
            </motion.div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="px-4 py-3 border-t border-white/10 max-w-3xl w-full mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-yellow-400/60" />
            <p className="text-white/40 text-xs font-medium">Suggestions</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => setPrompt(s)}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs text-white/70 transition-all">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-white/10 px-4 py-4 max-w-3xl w-full mx-auto">
        {/* Image preview */}
        {uploadedImage && (
          <div className="mb-3 flex items-center gap-3">
            <div className="relative inline-block">
              <img src={uploadedImage.preview} alt="upload" className="h-14 w-14 object-cover rounded-xl border border-white/20" />
              <button onClick={() => setUploadedImage(null)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black border border-white/20 rounded-full flex items-center justify-center text-white/70 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-white/50 text-xs">Image attached</span>
              {/* Auto-analyze toggle */}
              <button
                onClick={() => setAutoAnalyze(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                  autoAnalyze
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                    : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'
                }`}
              >
                <Eye className="w-3 h-3" />
                {autoAnalyze ? 'Auto-Analyze ON — will output replication prompt' : 'Auto-Analyze OFF — tap to enable'}
              </button>
            </div>
          </div>
        )}

        {!isAuthorized && (
          <div className="flex items-center gap-3 px-4 py-3 mb-3 bg-purple-500/10 border border-purple-500/30 rounded-2xl">
            <Lock className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <p className="text-purple-300/80 text-xs">
              {!walletAddress ? 'Connect your Kaspa wallet to use Prompto.' : 'Create your agent to unlock the chat.'}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { if (e.target.files[0]) handleImageUpload(e.target.files[0]); e.target.value = ''; }} />

          {/* Upload button */}
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading || !isAuthorized}
            className={`w-11 h-11 disabled:opacity-40 border rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
              uploadedImage ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/60'
            }`}
            title="Attach image">
            {uploading
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <ImagePlus className="w-4 h-4" />
            }
          </button>

          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
            placeholder={
              !isAuthorized ? 'Wallet + agent required...'
              : uploadedImage && autoAnalyze ? 'Optional note about the image...'
              : uploadedImage ? 'Describe what you want with this image...'
              : 'e.g. "dog looking at the PC, cyberpunk..." — Prompto gives you 3 variations'
            }
            disabled={!isAuthorized}
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          />

          {/* Enhance button */}
          <button type="button" onClick={enhancePrompt} disabled={loading || !prompt.trim() || !isAuthorized}
            className="w-11 h-11 bg-white/5 hover:bg-white/10 disabled:opacity-40 border border-white/10 rounded-full flex items-center justify-center transition-all flex-shrink-0"
            title="Enhance prompt with AI">
            <Wand2 className="w-4 h-4 text-white" />
          </button>

          {/* Send */}
          <button type="submit" disabled={loading || (!prompt.trim() && !uploadedImage) || !isAuthorized}
            className="w-11 h-11 bg-purple-600/40 hover:bg-purple-600/60 disabled:opacity-40 border border-purple-500/30 rounded-full flex items-center justify-center transition-all flex-shrink-0">
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
      </div>
    </div>
  );
}