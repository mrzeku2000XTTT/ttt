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
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
    <div className="h-screen bg-black relative overflow-hidden flex flex-col">
      {/* Matrix Rain Background */}
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
        className="fixed inset-0 z-0 opacity-30"
      />

      <div className="relative z-10 flex flex-col h-full max-w-7xl mx-auto w-full p-3">
        {/* Compact Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl bg-black/80 border border-white/5 rounded-xl p-3 mb-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Black on Black Logo Box */}
              <div className="w-10 h-10 bg-black/90 border border-white/10 rounded-lg flex items-center justify-center shadow-lg">
                <Bot className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white" style={{ fontFamily: 'monospace' }}>
                  Zeku AI
                </h1>
                <p className="text-gray-500 text-xs">Your Elite Crypto Companion</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                onClick={() => setShowProofOfLife(!showProofOfLife)}
                variant="outline"
                size="sm"
                className={`h-8 ${showProofOfLife ? 'bg-green-500/20 border-green-500/50' : 'bg-black/50 border-white/10'}`}
              >
                <Activity className="w-3 h-3" />
              </Button>

              <Button
                onClick={() => setMatrixMode(!matrixMode)}
                variant="outline"
                size="sm"
                className={`h-8 ${matrixMode ? 'bg-green-500/20 border-green-500/50' : 'bg-black/50 border-white/10'}`}
                style={{ fontFamily: 'monospace' }}
              >
                {matrixMode ? '◉' : '○'}
              </Button>

              <Button onClick={handleNewChat} variant="outline" size="sm" className="h-8 bg-black/50 border-white/10">
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Error Banner */}
        {error && conversation && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-xl bg-red-500/20 border border-red-500/30 rounded-xl p-2 flex items-center justify-between mb-3"
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

        {/* Messages - Fixed Height */}
        <div className="flex-1 backdrop-blur-xl bg-black/50 border border-white/10 rounded-xl p-4 overflow-y-auto mb-3">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-black/80 border border-purple-500/30 rounded-2xl flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'monospace' }}>
                Welcome to Zeku AI
              </h2>
              <p className="text-gray-500 text-sm mb-6">Your premium AI assistant is ready</p>
              <div className="grid grid-cols-2 gap-3 w-full max-w-2xl">
                {[
                  { emoji: '📊', title: 'Market Analysis', desc: 'Charts, trends, predictions' },
                  { emoji: '🖼️', title: 'Image Recognition', desc: 'Analyze trading charts' },
                  { emoji: '🌐', title: 'Real-Time Intel', desc: 'News, events, whale tracking' },
                  { emoji: '⚡', title: 'Proof of Life', desc: 'Prove you\'re alive & building' }
                ].map((feature, i) => (
                  <div key={i} className="bg-black/60 border border-white/10 rounded-xl p-3 text-left hover:border-purple-500/30 transition-all">
                    <div className="w-10 h-10 bg-black/80 border border-white/10 rounded-lg flex items-center justify-center mb-2 text-xl">
                      {feature.emoji}
                    </div>
                    <div className="font-semibold text-white text-sm mb-1">{feature.title}</div>
                    <div className="text-xs text-gray-600">{feature.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : matrixMode
                        ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                        : 'bg-black/60 border border-white/10 text-gray-200'
                    }`}
                    style={msg.role === 'assistant' ? { fontFamily: 'monospace' } : undefined}
                  >
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown className="prose prose-invert max-w-none text-xs [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      <p className="text-xs">{msg.content}</p>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {isSending && (
                <div className="flex justify-start">
                  <div className={`rounded-xl px-4 py-3 ${
                    matrixMode ? 'bg-green-500/10 border border-green-500/30' : 'bg-black/60 border border-white/10'
                  }`}>
                    <Loader2 className={`w-4 h-4 ${matrixMode ? 'text-green-400' : 'text-purple-400'} animate-spin`} />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Compact Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl bg-black/80 border border-white/10 rounded-xl p-2"
        >
          {uploadedFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="relative bg-black/60 border border-white/10 rounded-lg p-1 pr-6 flex items-center gap-1">
                  <ImageIcon className="w-3 h-3 text-cyan-400" />
                  <span className="text-[10px] text-white truncate max-w-[100px]">{file.name}</span>
                  <button
                    onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx))}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-red-400"
                  >
                    <X className="w-2 h-2" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isSending}
              variant="outline"
              size="sm"
              className="h-9 bg-black/50 border-white/10 flex-shrink-0"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
            </Button>

            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Ask Zeku AI anything..."
              className="h-9 flex-1 bg-black/50 border-white/10 text-white placeholder:text-gray-600 text-sm"
              disabled={isSending}
            />
            
            <Button
              onClick={handleSend}
              disabled={(!input.trim() && !uploadedFiles.length) || isSending}
              className="h-9 bg-gradient-to-r from-purple-600 to-pink-600 flex-shrink-0"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}