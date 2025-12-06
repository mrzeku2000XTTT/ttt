import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Bot, Loader2, Lock, Crown, Trash2, Upload, X, Image as ImageIcon, AlertCircle, RefreshCw, Activity, Volume2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ReactMarkdown from "react-markdown";
import BackgroundLogo from "../components/BackgroundLogo";
import ProofOfLifeButton from "../components/bridge/ProofOfLifeButton";
import ProofOfLifeFeed from "../components/bridge/ProofOfLifeFeed";
import LiveTimer from "../components/LiveTimer";

// Background music
const backgroundMusic = new Audio('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/hypemind_background.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.15;

// Alien voice text-to-speech for AI responses
const speakAlienVoice = (text) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // Stop any ongoing speech
    
    // Remove emojis and special characters
    const cleanText = text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
    
    if (!cleanText) return;
    
    // Split long text into chunks if needed (speech synthesis has limits)
    const maxLength = 200;
    const chunks = [];
    
    if (cleanText.length > maxLength) {
      let start = 0;
      while (start < cleanText.length) {
        let end = start + maxLength;
        // Try to break at sentence or word boundary
        if (end < cleanText.length) {
          const lastPeriod = cleanText.lastIndexOf('.', end);
          const lastSpace = cleanText.lastIndexOf(' ', end);
          if (lastPeriod > start + maxLength / 2) {
            end = lastPeriod + 1;
          } else if (lastSpace > start + maxLength / 2) {
            end = lastSpace + 1;
          }
        }
        chunks.push(cleanText.slice(start, end).trim());
        start = end;
      }
    } else {
      chunks.push(cleanText);
    }
    
    // Speak each chunk in sequence
    let currentChunk = 0;
    const speakNext = () => {
      if (currentChunk >= chunks.length) return;
      
      const utterance = new SpeechSynthesisUtterance(chunks[currentChunk]);
      utterance.rate = 0.7; // Slower for alien effect
      utterance.pitch = 0.3; // Lower pitch for alien effect
      utterance.volume = 0.6;
      
      // Try to find a unique voice
      const voices = window.speechSynthesis.getVoices();
      const alienVoice = voices.find(v => 
        v.name.includes('Google') || 
        v.name.includes('UK') || 
        v.lang.includes('en-GB')
      ) || voices[0];
      
      if (alienVoice) utterance.voice = alienVoice;
      
      // Speak next chunk when current one finishes
      utterance.onend = () => {
        currentChunk++;
        speakNext();
      };
      
      window.speechSynthesis.speak(utterance);
    };
    
    speakNext();
  }
};

const TypewriterText = ({ text, speed = 20, onUpdate }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
        onUpdate?.();
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

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
  const [alienVoiceEnabled, setAlienVoiceEnabled] = useState(false);
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState(null);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const lastSpokenMessageRef = useRef(null);
  const [liveUserCount, setLiveUserCount] = useState(0);
  const [userHasProof, setUserHasProof] = useState(false);
  const [userExpiresAt, setUserExpiresAt] = useState(null);

  useEffect(() => {
    initialize();

    // Start background music
    const playMusic = () => {
      backgroundMusic.play().then(() => {
        setMusicPlaying(true);
      }).catch(() => {
        // Auto-play blocked, will play on first user interaction
      });
    };

    // Try to play on load, or on first click
    playMusic();
    const handleFirstClick = () => {
      if (!musicPlaying) {
        playMusic();
        document.removeEventListener('click', handleFirstClick);
      }
    };
    document.addEventListener('click', handleFirstClick);

    // Load live user count every 10 seconds for real-time updates
    loadLiveUserCount();
    const liveInterval = setInterval(loadLiveUserCount, 10000);

    return () => {
      backgroundMusic.pause();
      document.removeEventListener('click', handleFirstClick);
      clearInterval(liveInterval);
    };
  }, []);

  useEffect(() => {
    if (conversation?.id) {
      const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
        if (data?.messages) {
          setMessages(data.messages);
          
          // Check if we just stopped sending (message is complete)
          if (isSending && data.messages.length > 0) {
            setIsSending(false);
            
            // Speak the latest AI message with alien voice if enabled
            if (alienVoiceEnabled) {
              const lastMsg = data.messages[data.messages.length - 1];
              const messageId = `${lastMsg.role}-${lastMsg.content?.length}-${Date.now()}`;
              
              if (lastMsg.role === 'assistant' && lastMsg.content && lastMsg.content.length > 0) {
                // Only speak if this is a new complete message
                if (lastSpokenMessageRef.current !== messageId) {
                  lastSpokenMessageRef.current = messageId;
                  // Wait to ensure streaming is complete
                  setTimeout(() => {
                    speakAlienVoice(lastMsg.content);
                  }, 1000);
                }
              }
            }
          } else if (!isSending && data.messages.length > 0) {
            setIsSending(false);
          }
        }
      });
      return () => unsubscribe?.();
    }
  }, [conversation?.id, alienVoiceEnabled, isSending]);

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

  const loadLiveUserCount = async () => {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const allProofs = await base44.entities.ProofOfLife.filter({});

      // Get latest proof per user within 24 hours
      const userLatestProofs = {};
      allProofs.forEach(proof => {
        const proofTime = new Date(proof.proof_timestamp || proof.created_date);
        if (proofTime >= twentyFourHoursAgo) {
          const existing = userLatestProofs[proof.user_email];
          if (!existing || proofTime > new Date(existing.proof_timestamp || existing.created_date)) {
            userLatestProofs[proof.user_email] = proof;
          }
        }
      });

      const liveUsers = Object.keys(userLatestProofs);
      setLiveUserCount(liveUsers.length);

      // Check current user's status
      if (user?.email) {
        const userProof = userLatestProofs[user.email];
        if (userProof) {
          setUserHasProof(true);
          const proofTime = new Date(userProof.proof_timestamp || userProof.created_date);
          const expiresAt = new Date(proofTime.getTime() + 24 * 60 * 60 * 1000);
          setUserExpiresAt(expiresAt);
        } else {
          setUserHasProof(false);
          setUserExpiresAt(null);
        }
      }
    } catch (err) {
      console.error('Failed to load live user count:', err);
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

      // Reload live count after sending message
      await loadLiveUserCount();
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
                onClick={() => {
                  setShowProofOfLife(!showProofOfLife);
                  if (!showProofOfLife) loadLiveUserCount();
                }}
                variant="outline"
                size="sm"
                className={`h-8 px-3 ${showProofOfLife ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-black/50 border-white/10 text-white'}`}
              >
                <Activity className="w-4 h-4 mr-1" />
                <span className="text-xs">Alive: {liveUserCount}</span>
              </Button>

              <Button
                onClick={() => {
                  setAlienVoiceEnabled(!alienVoiceEnabled);
                  if (!alienVoiceEnabled) {
                    // Test the voice
                    speakAlienVoice("Alien voice activated");
                  } else {
                    window.speechSynthesis.cancel();
                  }
                }}
                variant="outline"
                size="sm"
                className={`h-8 px-3 ${alienVoiceEnabled ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 'bg-black/50 border-white/10 text-white'}`}
              >
                <Bot className="w-4 h-4 mr-1" />
                <span className="text-xs">👽</span>
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

        {/* Live Status Timer */}
        {userExpiresAt && new Date(userExpiresAt) > new Date() && (
          <motion.div
            key={userExpiresAt}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/40 rounded-xl p-3 mb-2 shadow-lg flex-shrink-0"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 font-bold text-sm">You're Alive!</span>
              </div>
              <LiveTimer expiresAt={userExpiresAt} />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Your alive status is active and visible to all {liveUserCount} users
            </p>
          </motion.div>
        )}

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
        
        {/* Proof of Life Section */}
        <AnimatePresence>
          {showProofOfLife && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-2 flex-shrink-0"
            >
              {!userHasProof ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-black/70 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-center"
                >
                  <Activity className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">Prove You're Alive First!</h3>
                  <p className="text-gray-300 text-sm mb-4">
                    Pay 1 KAS to yourself to go alive for 24 hours. 
                    {liveUserCount > 0 && (
                      <span className="block mt-2">
                        Currently <span className="text-green-400 font-bold">{liveUserCount} {liveUserCount === 1 ? 'user is' : 'users are'}</span> alive!
                      </span>
                    )}
                  </p>
                  <ProofOfLifeButton 
                    kaswareWallet={kaswareWallet} 
                    metamaskWallet={metamaskWallet} 
                    user={user}
                    onSuccess={async () => {
                      setUserHasProof(true);
                      await loadLiveUserCount();
                    }}
                  />
                </motion.div>
              ) : (
                <ProofOfLifeFeed onUpdate={loadLiveUserCount} userExpiresAt={userExpiresAt} />
              )}
            </motion.div>
          )}
        </AnimatePresence>

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
                  { emoji: '⚡', title: 'Proof of Life', desc: 'Prove you\'re alive for 24h' }
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
                    <div className="flex items-end gap-2 max-w-[90%]">
                      {msg.role === 'assistant' && alienVoiceEnabled && (
                        <button
                          onClick={() => {
                            setSpeakingMessageIndex(idx);
                            speakAlienVoice(msg.content);
                            setTimeout(() => setSpeakingMessageIndex(null), 2000);
                          }}
                          className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                            speakingMessageIndex === idx
                              ? 'bg-purple-500/30 text-purple-300'
                              : 'bg-black/50 text-white/60 hover:bg-purple-500/20 hover:text-purple-400'
                          }`}
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      )}
                      <div
                        className={`rounded-xl px-3 py-2 text-sm shadow-lg ${
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
                            <TypewriterText text={msg.content} speed={20} onUpdate={scrollToBottom} />
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