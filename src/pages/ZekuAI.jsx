import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Bot, Loader2, Lock, Crown, Trash2, Upload, X, Image as ImageIcon, AlertCircle, RefreshCw, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ReactMarkdown from "react-markdown";
import BackgroundLogo from "../components/BackgroundLogo";
import ProofOfLifeButton from "../components/bridge/ProofOfLifeButton";
import ProofOfLifeFeed from "../components/bridge/ProofOfLifeFeed";

// Shared audio context to avoid browser limits
let audioContext = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

// Advanced mechanical keyboard sound generator with matrix theme
const playKeySound = () => {
  try {
    const ctx = getAudioContext();
    
    // Create multiple oscillators for rich mechanical sound
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    const noiseGain = ctx.createGain();
    const clickGain = ctx.createGain();
    const masterGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const compressor = ctx.createDynamicsCompressor();
    
    // Configure filter for mechanical resonance
    filter.type = 'bandpass';
    filter.frequency.value = 1800 + Math.random() * 600;
    filter.Q.value = 3;
    
    // Connect audio graph
    osc1.connect(filter);
    osc2.connect(clickGain);
    osc3.connect(noiseGain);
    filter.connect(masterGain);
    clickGain.connect(masterGain);
    noiseGain.connect(masterGain);
    masterGain.connect(compressor);
    compressor.connect(ctx.destination);
    
    // Main resonance (spring sound)
    osc1.frequency.value = 2400 + Math.random() * 800;
    osc1.type = 'sine';
    
    // Click component (switch contact)
    osc2.frequency.value = 4000 + Math.random() * 2000;
    osc2.type = 'square';
    
    // Noise component (friction/mechanical)
    osc3.frequency.value = 8000 + Math.random() * 4000;
    osc3.type = 'sawtooth';
    
    const now = ctx.currentTime;
    const attackTime = 0.001;
    const decayTime = 0.03;
    const clickDecay = 0.008;
    const noiseDecay = 0.015;
    
    // Master volume with sharp attack
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(0.12, now + attackTime);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + decayTime);
    
    // Click envelope (sharp and short)
    clickGain.gain.setValueAtTime(0.15, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + clickDecay);
    
    // Noise envelope (quick burst)
    noiseGain.gain.setValueAtTime(0.05, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseDecay);
    
    // Frequency sweep for mechanical spring effect
    osc1.frequency.exponentialRampToValueAtTime(
      osc1.frequency.value * 0.7, 
      now + decayTime
    );
    
    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    osc1.stop(now + decayTime);
    osc2.stop(now + clickDecay);
    osc3.stop(now + noiseDecay);
  } catch (e) {
    // Silently fail if audio context is not available
  }
};

const TypewriterText = ({ text, speed = 20, onUpdate, playSound = false }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        if (playSound) playKeySound();
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
        onUpdate?.();
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed, playSound]);

  return <p className="text-xs whitespace-pre-wrap">{displayedText}</p>;
};

export default function ZekuAIPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [matrixMode, setMatrixMode] = useState(false);
  const [showProofOfLife, setShowProofOfLife] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [kaswareWallet, setKaswareWallet] = useState({ connected: false, address: null, balance: 0 });
  const [metamaskWallet, setMetamaskWallet] = useState({ connected: false, address: null, balance: 0 });
  const [typedMessageIds, setTypedMessageIds] = useState(new Set());
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (conversation?.id) {
      const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
        if (data?.messages) {
          setMessages(data.messages);
          setIsSending(false);
        }
      });
      return () => unsubscribe?.();
    }
  }, [conversation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  useEffect(() => {
    if (conversation?.id) {
      scrollToBottom();
    }
  }, [conversation?.id]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);
  };

  const initialize = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      await loadConversation(currentUser);
      checkWallets();
    } catch (err) {
      console.error('Initialization error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversation = async (currentUser) => {
    try {
      const savedId = localStorage.getItem('zeku_conversation_id');
      
      if (savedId) {
        try {
          const conv = await base44.agents.getConversation(savedId);
          if (conv?.id) {
            setConversation(conv);
            setMessages(conv.messages || []);
            return;
          }
        } catch {
          localStorage.removeItem('zeku_conversation_id');
        }
      }

      const conv = await base44.agents.createConversation({
        agent_name: "zeku_ai",
        metadata: {
          name: "Zeku AI Chat",
          user_id: currentUser.id,
          user_email: currentUser.email,
          created_at: new Date().toISOString()
        }
      });

      setConversation(conv);
      localStorage.setItem('zeku_conversation_id', conv.id);
    } catch (err) {
      throw new Error('Failed to initialize conversation: ' + err.message);
    }
  };

  const checkWallets = async () => {
    if (typeof window.kasware !== 'undefined') {
      try {
        const accounts = await window.kasware.getAccounts();
        if (accounts.length > 0) {
          const balance = await window.kasware.getBalance();
          setKaswareWallet({ 
            connected: true, 
            address: accounts[0], 
            balance: (balance.total || 0) / 1e8 
          });
        }
      } catch {}
    }

    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const balanceWei = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [accounts[0], 'latest']
          });
          setMetamaskWallet({ 
            connected: true, 
            address: accounts[0], 
            balance: Number(BigInt(balanceWei)) / 1e18
          });
        }
      } catch {}
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setIsUploading(true);
    try {
      const uploads = await Promise.all(
        files.map(async (file) => {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          return { name: file.name, url: file_url, type: file.type };
        })
      );
      setUploadedFiles([...uploadedFiles, ...uploads]);
    } catch (err) {
      setError('File upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSend = async () => {
    if (!conversation?.id || (!input.trim() && !uploadedFiles.length) || isSending) return;

    const messageContent = input.trim() || "Please analyze the attached image(s).";
    const files = uploadedFiles.map(f => f.url);
    
    setInput("");
    setUploadedFiles([]);
    setIsSending(true);
    setError(null);

    try {
      const messageData = { role: "user", content: messageContent };
      if (files.length) messageData.file_urls = files;

      await base44.agents.addMessage(conversation, messageData);
      scrollToBottom();
    } catch (err) {
      setError('Failed to send message: ' + err.message);
      setIsSending(false);
    }
    };

  const handleNewChat = async () => {
    if (!confirm('Start new conversation?')) return;
    
    localStorage.removeItem('zeku_conversation_id');
    setConversation(null);
    setMessages([]);
    setError(null);
    
    await loadConversation(user);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }



  if (error && !conversation) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <Card className="backdrop-blur-xl bg-red-500/20 border-red-500/30 max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Connection Error</h2>
            <p className="text-red-200 mb-6 text-sm">{error}</p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => window.location.reload()} className="bg-cyan-500">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
              <Button onClick={() => navigate(createPageUrl("Bridge"))} variant="outline">
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed bg-black overflow-hidden flex flex-col" style={{ 
      top: 'calc(var(--sat, 0px) + 7.5rem)',
      left: 0,
      right: 0,
      bottom: 0
    }}>
      {/* Epic Cosmic Background Image */}
      <div className="fixed inset-0 z-0">
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/079265af5_image.png"
          alt="Zeku AI"
          className="w-full h-full object-cover object-[center_30%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      </div>

      {/* Matrix Rain Background Overlay */}
      <canvas
        ref={(canvas) => {
          if (!canvas) return;
          const ctx = canvas.getContext('2d');
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;

          const chars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ01';
          const fontSize = 14;
          const columns = canvas.width / fontSize;
          const drops = Array(Math.floor(columns)).fill(1);

          function draw() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#0f0';
            ctx.font = fontSize + 'px monospace';

            for (let i = 0; i < drops.length; i++) {
              const text = chars[Math.floor(Math.random() * chars.length)];
              ctx.fillText(text, i * fontSize, drops[i] * fontSize);

              if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
              }
              drops[i]++;
            }
          }

          const interval = setInterval(draw, 33);
          return () => clearInterval(interval);
        }}
        className="fixed inset-0 z-[1] opacity-20"
      />

      <div className="relative z-10 flex flex-col h-full max-w-7xl mx-auto w-full p-2">
        {/* Minimal Floating Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-transparent border-none rounded-2xl p-3 mb-2 flex-shrink-0"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white" style={{ fontFamily: 'monospace' }}>
                  Zeku AI
                </h1>
                <p className="text-gray-300 text-xs">Your Elite Crypto Companion</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowProofOfLife(!showProofOfLife)}
                variant="outline"
                size="sm"
                className={`h-8 px-3 ${showProofOfLife ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-black/50 border-white/10 text-white'}`}
              >
                <Activity className="w-4 h-4 mr-1" />
                <span className="text-xs">Proof of Life</span>
              </Button>

              <Button
                onClick={() => setMatrixMode(!matrixMode)}
                variant="outline"
                size="sm"
                className={`h-8 w-8 p-0 ${matrixMode ? 'bg-green-500/20 border-green-500/50' : 'bg-black/50 border-white/10'}`}
                style={{ fontFamily: 'monospace' }}
              >
                <span className="text-sm">{matrixMode ? '◉' : '○'}</span>
              </Button>

              <Button onClick={handleNewChat} variant="outline" size="sm" className="h-8 w-8 p-0 bg-black/50 border-white/10">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Error Banner */}
        {error && conversation && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-2 flex items-center justify-between mb-2 flex-shrink-0"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
            <Button onClick={() => setError(null)} variant="ghost" size="sm" className="h-6">
              <X className="w-3 h-3" />
            </Button>
          </motion.div>
        )}

        {/* Messages - Fully Transparent */}
        <div ref={messagesContainerRef} className="flex-1 bg-transparent border-none rounded-2xl p-4 overflow-y-auto mb-2 min-h-0 scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
              >
                <div className="w-24 h-24 bg-black rounded-3xl flex items-center justify-center mb-6 shadow-2xl mx-auto">
                  <Bot className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: 'monospace' }}>
                  Welcome to Zeku AI
                </h2>
                <p className="text-gray-300 text-lg mb-8">Your premium AI assistant is ready</p>
              </motion.div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
                {[
                  { emoji: '📊', title: 'Market Analysis', desc: 'Charts, trends, predictions' },
                  { emoji: '🖼️', title: 'Image Recognition', desc: 'Analyze trading charts' },
                  { emoji: '🌐', title: 'Real-Time Intel', desc: 'News, events, whale tracking' },
                  { emoji: '⚡', title: 'Proof of Life', desc: 'Prove you\'re alive & building' }
                ].map((feature, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-black border border-white/10 rounded-2xl p-5 text-left hover:border-white/30 hover:scale-105 transition-all cursor-pointer shadow-xl"
                  >
                    <div className="w-14 h-14 bg-black border border-white/10 rounded-xl flex items-center justify-center mb-3 text-3xl">
                      {feature.emoji}
                    </div>
                    <div className="font-bold text-white text-base mb-2">{feature.title}</div>
                    <div className="text-sm text-gray-300">{feature.desc}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg, idx) => {
                const messageId = `${idx}-${msg.content?.substring(0, 20)}`;
                const isLastAssistantMessage = msg.role === 'assistant' && idx === messages.length - 1;
                const shouldTypewrite = matrixMode && isLastAssistantMessage && !typedMessageIds.has(messageId);

                if (shouldTypewrite && !typedMessageIds.has(messageId)) {
                  setTimeout(() => setTypedMessageIds(prev => new Set([...prev, messageId])), 100);
                }

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 text-sm shadow-lg ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                          : matrixMode
                          ? 'bg-green-500/20 backdrop-blur-sm border border-green-500/50 text-green-400'
                          : 'bg-black/70 backdrop-blur-sm border border-white/20 text-gray-100'
                      }`}
                      style={msg.role === 'assistant' ? { fontFamily: 'monospace' } : undefined}
                    >
                      {msg.role === 'assistant' ? (
                        shouldTypewrite ? (
                          <TypewriterText text={msg.content} speed={20} onUpdate={scrollToBottom} playSound={true} />
                        ) : matrixMode ? (
                          <p className="text-xs whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <ReactMarkdown className="prose prose-invert max-w-none text-xs [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                            {msg.content}
                          </ReactMarkdown>
                        )
                      ) : (
                        <p className="text-xs">{msg.content}</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              
              {isSending && (
                <div className="flex justify-start">
                  <div className={`rounded-xl px-4 py-3 backdrop-blur-sm shadow-lg ${
                    matrixMode ? 'bg-green-500/20 border border-green-500/50' : 'bg-black/70 border border-white/20'
                  }`}>
                    <Loader2 className={`w-4 h-4 ${matrixMode ? 'text-green-400' : 'text-purple-400'} animate-spin`} />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Floating Input Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-transparent border-none rounded-2xl p-3 flex-shrink-0"
        >
          {uploadedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="relative bg-black border border-white/20 rounded-xl p-2 pr-8 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-white" />
                  <span className="text-xs text-white truncate max-w-[120px]">{file.name}</span>
                  <button
                    onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isSending}
              variant="outline"
              size="sm"
              className="h-11 px-3 bg-black border-white/20 hover:bg-black/80 text-white flex-shrink-0"
            >
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
            </Button>

            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
                  playKeySound();
                }
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask Zeku AI anything..."
              className={`h-11 flex-1 text-base focus:ring-2 ${
                matrixMode 
                  ? 'bg-green-500/10 border-green-500/30 text-green-400 placeholder:text-green-600/50 focus:ring-green-500/30 font-mono' 
                  : 'bg-black/30 border-white/10 text-white placeholder:text-gray-500 focus:ring-white/20'
              }`}
              disabled={isSending}
            />

            <Button
              onClick={handleSend}
              disabled={(!input.trim() && !uploadedFiles.length) || isSending}
              className="h-11 px-6 bg-black hover:bg-black/80 flex-shrink-0 shadow-lg"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}