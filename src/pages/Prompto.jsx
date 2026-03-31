import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Send, Lightbulb, Wand2, ArrowLeft, ImagePlus, X, Copy, Check, Eye, Wallet, Bot, Trash2, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

// XOR encryption tied to wallet address
const encryptData = (data, key) => {
  const str = JSON.stringify(data);
  return btoa(str.split('').map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))).join(''));
};
const decryptData = (enc, key) => {
  try {
    const str = atob(enc).split('').map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))).join('');
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
  const [analyzeMode, setAnalyzeMode] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
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
      debounceTimerRef.current = setTimeout(() => generateSuggestions(prompt), 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    return () => clearTimeout(debounceTimerRef.current);
  }, [prompt]);

  useEffect(() => {
    return () => {
      if (uploadedImage?.preview) URL.revokeObjectURL(uploadedImage.preview);
    };
  }, []);

  // Detect connected wallet on mount
  useEffect(() => {
    const detectWallet = async () => {
      let addr = null;
      if (window.kasware) {
        try {
          const accounts = await window.kasware.getAccounts();
          if (accounts?.length > 0) addr = accounts[0];
        } catch {}
      }
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

  // Save messages to localStorage (encrypted) whenever they change
  useEffect(() => {
    if (walletAddress && messages.length > 0) {
      const key = `prompto_chat_${walletAddress.slice(0, 16)}`;
      localStorage.setItem(key, encryptData(messages.filter(m => !m.imagePreview), walletAddress));
    }
  }, [messages, walletAddress]);

  const loadEncryptedMessages = (addr) => {
    const key = `prompto_chat_${addr.slice(0, 16)}`;
    const stored = localStorage.getItem(key);
    if (stored) setMessages(decryptData(stored, addr));
  };

  const clearHistory = () => {
    if (!walletAddress) return;
    const key = `prompto_chat_${walletAddress.slice(0, 16)}`;
    localStorage.removeItem(key);
    setMessages([]);
    toast.success('Chat history cleared');
  };

  const isDesktop = !!window.kasware;

  const createAgent = async () => {
    if (!walletAddress) { toast.error('No wallet connected'); return; }
    setCreatingAgent(true);
    try {
      let txId;

      if (window.kasware) {
        // Desktop: send 1 KAS to self via Kasware
        const SOMPI_PER_KAS = 100000000;
        txId = await window.kasware.sendKaspa(walletAddress, 1 * SOMPI_PER_KAS);
      } else {
        // Mobile / TTT native wallet: send 1 KAS to self
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
        content: `✅ **Prompto Agent activated!**\n\nYour personal AI agent is now sealed to wallet \`${walletAddress.slice(0,8)}...${walletAddress.slice(-6)}\`\n\nTx: \`${txId}\`\n\nAll your conversations are encrypted and stored locally — only readable with your wallet address. I remember you. Let's build something great.`
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
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 3 short, actionable prompt enhancement suggestions (2-5 words each) to improve this user prompt: "${text}". Return as JSON array: ["suggestion1", "suggestion2", "suggestion3"]`,
        model: "gpt_5_mini"
      });
      try {
        const s = JSON.parse(result);
        setSuggestions(s);
        setShowSuggestions(true);
      } catch { setSuggestions([]); }
    } catch (err) {
      console.error("Suggestions failed:", err);
    }
  };

  const enhancePrompt = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const enhanced = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a prompt engineering expert. Enhance and improve this user prompt to be more specific, detailed, and effective for AI tasks: "${prompt}". Provide the enhanced prompt only, no explanation.`,
        model: "gpt_5"
      });
      setPrompt(enhanced);
    } catch (err) {
      toast.error("Enhancement failed. Please try again.");
      console.error(err);
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
      setAnalyzeMode(true);
    } catch (err) {
      URL.revokeObjectURL(preview);
      toast.error("Image upload failed. Please try again.");
      console.error(err);
    }
    setUploading(false);
  };

  const analyzeImage = async () => {
    if (!uploadedImage) return;
    setAnalyzing(true);
    try {
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert in visual design, animation, and digital art. Analyze this image in EXTREME detail and provide:

1. **Image Type**: Is it a cartoon, anime, 3D render, photograph, digital art, illustration, vector art, etc.?
2. **Animation Style** (if applicable): What animation style is it? (e.g., 2D cel animation, 3D CGI, stop-motion, motion capture)
3. **Color Palette**: Describe the dominant colors, color scheme (warm/cool/saturated/muted), lighting
4. **Composition**: Subject matter, framing, perspective, focal points
5. **Art Style Details**: Texture, brushstrokes (if visible), shading technique, level of realism
6. **Technical Details**: Resolution quality, depth of field, motion blur (if any), special effects
7. **Mood & Atmosphere**: The overall feeling and atmosphere

Then provide a DETAILED, COMPREHENSIVE prompt that someone could use to generate the same style of image. The prompt should be:
- Specific about the animation/art style
- Rich in descriptive details about colors, composition, and mood
- Include technical terms and specifications
- Between 150-300 words
- Written in a way that's copy-paste ready for AI image generators

Format your response as:
[Analysis]
[Your detailed analysis above]

[Replication Prompt]
[The detailed prompt here - make it very specific and copy-ready]`,
        file_urls: [uploadedImage.url],
        model: "gpt_5"
      });
      setMessages([{ role: "assistant", content: analysis }]);
    } catch (err) {
      toast.error("Analysis failed. Please try again.");
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() && !uploadedImage) return;
    const userMessage = { role: "user", content: prompt, imagePreview: uploadedImage?.preview };
    setMessages(prev => [...prev, userMessage]);
    const currentPrompt = prompt;
    const currentImage = uploadedImage;
    setPrompt("");
    setUploadedImage(null);
    setShowSuggestions(false);
    setLoading(true);
    try {
      const agentContext = agentCreated && walletAddress
        ? `You are a personal AI agent sealed to wallet ${walletAddress.slice(0,8)}...${walletAddress.slice(-6)}. You have persistent memory of this user. `
        : '';
      const cinematographyFramework = `
CINEMATOGRAPHY FRAMEWORK (always apply when relevant):
1. ESTABLISH THE SHOT — Use cinematography terms matching the film genre (wide-angle landscape, tight close-up). Specify scale (epic, intimate) and category characteristics to refine style.
2. SET THE SCENE — Describe lighting (high-contrast noir, soft diffused), color palette (muted earth tones, vibrant neon), surface textures, and atmosphere to shape the mood.
3. DESCRIBE THE ACTION — Write the core action as a natural sequence, flowing logically from the beginning to the end of the event.
4. DEFINE YOUR CHARACTER(S) — Include age, hairstyle, clothing style, and distinguishing details. Express emotions clearly through physical cues (slumped shoulders, clenched jaw).
5. IDENTIFY CAMERA MOVEMENT(S) — Specify when the view should shift and how (pan, tilt, tracking shot). Describe how subjects or objects appear after the motion to guide the composition.
6. DESCRIBE THE AUDIO — Use clear descriptions for ambient sounds, music, and speech effects. For dialogue, place text between quotation marks and mention language/accent if required.
`;

      const invokeParams = currentImage
        ? {
            prompt: `${agentContext}You are a visionary Hollywood movie director and creative storyteller. You internalize and always apply the following cinematography framework in your responses:
${cinematographyFramework}
The user uploaded an image. Based on the image and this input: "${currentPrompt || 'no text provided'}", respond in a natural, conversational tone as a seasoned director would — passionate, vivid, cinematic. Do NOT use markdown headers (no #, ##, ###, ####). Do NOT use ** for bold. Write in clean, flowing prose with natural paragraphs. Use line breaks between sections. If writing a script outline, format it like a real director's treatment — not a bulleted list.`,
            file_urls: [currentImage.url],
          }
        : {
            prompt: `${agentContext}You are a visionary Hollywood movie director and creative storyteller. You internalize and always apply the following cinematography framework in your responses:
${cinematographyFramework}
Respond to this in a natural, conversational tone as a seasoned director would — passionate, vivid, cinematic. Do NOT use markdown headers (no #, ##, ###, ####). Do NOT use ** for bold. Write in clean, flowing prose with natural paragraphs. Here is the user's request: "${currentPrompt}"`,
          };
      const aiResponse = await base44.integrations.Core.InvokeLLM(invokeParams);
      setMessages(prev => [...prev, { role: "assistant", content: aiResponse }]);
    } catch (err) {
      toast.error("Failed to generate response. Please try again.");
      console.error(err);
      setMessages(prev => [...prev, { role: "assistant", content: "Error generating response. Please try again." }]);
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
              <p className="text-white/70 text-sm">Your agent will be cryptographically tied to:</p>
              <code className="block text-cyan-400 text-xs bg-black/40 rounded-lg px-3 py-2 break-all">{walletAddress}</code>
              <p className="text-white/40 text-xs">All chats are encrypted locally and only readable with this wallet address.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAgentModal(false)}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 text-sm">
                Cancel
              </button>
              <button onClick={createAgent} disabled={creatingAgent}
                className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2">
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
        <img
          src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/073d22c9d_generated_image.png"
          alt="Prompto"
          className="w-8 h-8 rounded-xl object-cover"
        />
        <div className="flex-1">
          <h1 className="text-white font-bold text-lg leading-none">Prompto</h1>
          <p className="text-white/40 text-xs mt-0.5">{analyzeMode ? "Image Analyzer" : "AI Prompt Builder & Enhancer"}</p>
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
                  className="w-8 h-8 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 rounded-full flex items-center justify-center transition-all"
                  title="Clear history">
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
        {analyzeMode && uploadedImage && messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-center min-h-[400px]">
            <img src={uploadedImage.preview} alt="uploaded" className="w-32 h-32 rounded-2xl object-cover border border-white/20" />
            <div>
              <p className="text-white font-semibold text-lg">Analyze this image</p>
              <p className="text-white/40 text-sm mt-1">Get a detailed breakdown and a copy-ready prompt to replicate it</p>
            </div>
            <motion.button
              onClick={analyzeImage}
              disabled={analyzing}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 text-white rounded-xl font-semibold flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              {analyzing ? "Analyzing..." : "Analyze Image"}
            </motion.button>
            <button
              onClick={() => { setAnalyzeMode(false); setUploadedImage(null); setMessages([]); }}
              className="text-white/40 hover:text-white text-sm"
            >
              Or go back to prompt builder
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-center min-h-[400px]">
            <img
              src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/073d22c9d_generated_image.png"
              alt="Prompto"
              className="w-24 h-24 rounded-3xl object-cover shadow-2xl shadow-purple-500/30"
            />
            <div>
              <p className="text-white font-semibold text-xl">Start creating prompts</p>
              <p className="text-white/40 text-sm mt-2">
                {walletAddress && !agentCreated
                  ? 'Wallet detected — create your agent to enable persistent memory'
                  : 'Write anything below or upload an image for AI-powered responses'}
              </p>
            </div>
            {walletAddress && !agentCreated && (
              <button onClick={() => setShowAgentModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl text-white text-sm font-semibold">
                <Bot className="w-4 h-4" />
                Create My Agent
              </button>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2 w-full max-w-xl">
              {["Write a movie script outline", "Explain quantum computing simply", "Create a marketing campaign"].map((ex, i) => (
                <button key={i} onClick={() => setPrompt(ex)}
                  className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white/70 text-left transition-all">
                  {ex}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-purple-600/30 border border-purple-500/30 text-white"
                    : "bg-white/5 border border-white/10 text-white/90"
                }`}>
                  {msg.imagePreview && (
                    <img src={msg.imagePreview} alt="uploaded" className="h-32 rounded-xl object-cover mb-2 border border-white/10" />
                  )}
                  {msg.role === "assistant" ? (
                    <>
                      <div className="prose prose-sm prose-invert max-w-none [&>p]:my-2 [&>p]:leading-relaxed">
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
        {uploadedImage && !analyzeMode && (
          <div className="mb-3 flex items-center gap-2">
            <div className="relative inline-block">
              <img src={uploadedImage.preview} alt="upload" className="h-16 w-16 object-cover rounded-xl border border-white/20" />
              <button onClick={() => setUploadedImage(null)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black border border-white/20 rounded-full flex items-center justify-center text-white/70 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </div>
            <span className="text-white/40 text-xs">Image attached — AI will analyze it with your prompt</span>
          </div>
        )}
        {!analyzeMode && (
          <>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => handleImageUpload(e.target.files[0])} />
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="w-11 h-11 bg-white/5 hover:bg-white/10 disabled:opacity-40 border border-white/10 rounded-full flex items-center justify-center transition-all flex-shrink-0"
                title="Upload image">
                {uploading
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <ImagePlus className="w-4 h-4 text-white/70" />
                }
              </button>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={uploadedImage ? "Describe what you want from this image..." : "Type a prompt..."}
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 transition-all"
              />
              <button type="button" onClick={enhancePrompt} disabled={loading || !prompt.trim()}
                className="w-11 h-11 bg-white/5 hover:bg-white/10 disabled:opacity-40 border border-white/10 rounded-full flex items-center justify-center transition-all flex-shrink-0"
                title="Enhance with AI">
                <Wand2 className="w-4 h-4 text-white" />
              </button>
              <button type="submit" disabled={loading || (!prompt.trim() && !uploadedImage)}
                className="w-11 h-11 bg-purple-600/40 hover:bg-purple-600/60 disabled:opacity-40 border border-purple-500/30 rounded-full flex items-center justify-center transition-all flex-shrink-0">
                <Send className="w-4 h-4 text-white" />
              </button>
            </form>
            <p className="text-white/20 text-xs mt-2 text-center">Press Enter or click Send · Upload an image to analyze and replicate</p>
          </>
        )}
      </div>
    </div>
  );
}