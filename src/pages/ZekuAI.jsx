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
      
      if (!currentUser || currentUser.role !== 'admin') {
        setIsLoading(false);
        return;
      }
      
      setUser(currentUser);

      const isAdmin = currentUser.role === 'admin';
      
      if (!isAdmin) {
        const saved = localStorage.getItem('subscription');
        if (saved) {
          const data = JSON.parse(saved);
          if (data.isActive && data.expiresAt < Date.now()) {
            data.isActive = false;
          }
          setSubscription(data);
          
          if (!data.isActive) {
            setTimeout(() => navigate(createPageUrl("Subscription")), 2000);
            return;
          }
        } else {
          navigate(createPageUrl("Subscription"));
          return;
        }
      } else {
        setSubscription({ isActive: true, isAdmin: true });
      }

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

  // Admin-only access
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="backdrop-blur-xl bg-white/5 border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Admin Access Only</h2>
          <p className="text-gray-400 text-sm">
            Zeku AI is restricted to administrators only.
          </p>
        </div>
      </div>
    );
  }

  if (!subscription?.isActive && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <Card className="backdrop-blur-xl bg-yellow-500/20 border-yellow-500/30 max-w-md">
          <CardContent className="p-8 text-center">
            <Lock className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Premium Feature</h2>
            <p className="text-yellow-200 mb-6">
              Zeku AI requires premium subscription
            </p>
            <Button
              onClick={() => navigate(createPageUrl("Subscription"))}
              className="bg-gradient-to-r from-yellow-500 to-orange-500"
            >
              <Crown className="w-5 h-5 mr-2" />
              Get Premium
            </Button>
          </CardContent>
        </Card>
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
    <div className="min-h-screen bg-black relative overflow-hidden">
      <BackgroundLogo text="TTT" opacity={0.03} animated={true} />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[150px] animate-pulse" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-4 md:p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 backdrop-blur-xl bg-black/50 border border-white/10 rounded-2xl p-4 md:p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
                  Zeku AI
                </h1>
                <p className="text-gray-400 text-sm">Your Elite Crypto Companion</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowProofOfLife(!showProofOfLife)}
                variant="outline"
                size="sm"
                className={showProofOfLife ? 'bg-green-500/20 border-green-500' : 'bg-white/5'}
              >
                <Activity className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">Activity</span>
              </Button>

              <Button
                onClick={() => setMatrixMode(!matrixMode)}
                variant="outline"
                size="sm"
                className={matrixMode ? 'bg-green-500/20 border-green-500' : 'bg-white/5'}
                style={{ fontFamily: 'monospace' }}
              >
                {matrixMode ? '◉ ON' : '○ OFF'}
              </Button>

              <Button onClick={handleNewChat} variant="outline" size="sm" className="bg-white/5">
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
            className="mb-6 backdrop-blur-xl bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
            <Button onClick={() => setError(null)} variant="ghost" size="sm">
              <X className="w-4 h-4" />
            </Button>
          </motion.div>
        )}

        {/* Proof of Life Feed */}
        <AnimatePresence>
          {showProofOfLife && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <ProofOfLifeFeed />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 mb-6 min-h-[500px] max-h-[600px] overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center py-20">
              <Bot className="w-16 h-16 text-purple-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'monospace' }}>
                Welcome to Zeku AI
              </h2>
              <p className="text-gray-400 mb-6">Your premium AI assistant is ready</p>
              <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {[
                  { icon: '📊', title: 'Market Analysis', desc: 'Charts, trends, predictions' },
                  { icon: '🖼️', title: 'Image Recognition', desc: 'Analyze trading charts' },
                  { icon: '🌐', title: 'Real-Time Intel', desc: 'News, events, whale tracking' },
                  { icon: '⚡', title: 'Proof of Life', desc: 'Prove you\'re alive & building' }
                ].map((feature, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-4 text-left">
                    <div className="text-2xl mb-2">{feature.icon}</div>
                    <div className="font-semibold text-white mb-1">{feature.title}</div>
                    <div className="text-xs text-gray-500">{feature.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : matrixMode
                        ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                        : 'bg-white/5 border border-white/10 text-gray-200'
                    }`}
                    style={msg.role === 'assistant' ? { fontFamily: 'monospace' } : undefined}
                  >
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown className="prose prose-invert max-w-none text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {isSending && (
                <div className="flex justify-start">
                  <div className={`rounded-2xl px-6 py-4 ${
                    matrixMode ? 'bg-green-500/10 border border-green-500/30' : 'bg-white/5 border border-white/10'
                  }`}>
                    <Loader2 className={`w-5 h-5 ${matrixMode ? 'text-green-400' : 'text-purple-400'} animate-spin`} />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Proof of Life Button */}
        {(kaswareWallet.connected || metamaskWallet.connected) && (
          <div className="mb-6">
            <ProofOfLifeButton 
              kaswareWallet={kaswareWallet}
              metamaskWallet={metamaskWallet}
              user={user}
            />
          </div>
        )}

        {/* Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4"
        >
          {uploadedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="relative bg-white/5 border border-white/10 rounded-lg p-2 pr-8 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-white truncate max-w-[150px]">{file.name}</span>
                  <button
                    onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-red-400"
                  >
                    <X className="w-3 h-3" />
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
              className="bg-white/5 flex-shrink-0"
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
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Ask Zeku AI anything..."
              className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              disabled={isSending}
            />
            
            <Button
              onClick={handleSend}
              disabled={(!input.trim() && !uploadedFiles.length) || isSending}
              className="bg-gradient-to-r from-purple-500 to-pink-500 flex-shrink-0"
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