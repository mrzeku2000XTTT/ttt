import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Wand2, Shield, LogIn, ArrowRight, Zap, LogOut, Link as LinkIcon, Hand, ChevronRight, X, TrendingUp, Link2, ArrowUpDown, Wallet, Key, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showKaspaModal, setShowKaspaModal] = useState(false);
  const [kaspaPrice, setKaspaPrice] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [showPortal, setShowPortal] = useState(false);
  const [userIdentity, setUserIdentity] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [openRouterKey, setOpenRouterKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("xiaomi/MiMo-v2-flash:free");
  const [useOpenRouter, setUseOpenRouter] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const messagesEndRef = React.useRef(null);

  useEffect(() => {
    loadUser();
    checkWalletConnection();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAnalyzing]);

  const checkWalletConnection = async () => {
    try {
      if (typeof window.kasware !== 'undefined') {
        const accounts = await window.kasware.requestAccounts();
        if (accounts && accounts.length > 0) {
          setWalletAddress(accounts[0]);
          await loadConversationHistory(accounts[0]);
        }
      }
    } catch (err) {
      console.log("Wallet not connected");
    }
  };

  const connectKasware = async () => {
    setIsConnectingWallet(true);
    try {
      if (typeof window.kasware === 'undefined') {
        alert('Please install Kasware wallet extension');
        return;
      }
      
      const accounts = await window.kasware.requestAccounts();
      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0]);
        await loadConversationHistory(accounts[0]);
        setShowWalletModal(false);
      }
    } catch (err) {
      console.error('Wallet connection failed:', err);
      alert('Failed to connect wallet');
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const connectZKWallet = async () => {
    setIsConnectingWallet(true);
    try {
      const zkAddress = user?.created_wallet_address;
      if (!zkAddress) {
        alert('Please create a ZK wallet first');
        return;
      }
      setWalletAddress(zkAddress);
      await loadConversationHistory(zkAddress);
      setShowWalletModal(false);
    } catch (err) {
      console.error('ZK wallet connection failed:', err);
      alert('Failed to connect ZK wallet');
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const connectIOSSelfSend = () => {
    alert('Please send a small transaction to yourself from your iOS wallet, then paste your address here');
    const address = prompt('Enter your Kaspa wallet address:');
    if (address && address.trim()) {
      setWalletAddress(address.trim());
      loadConversationHistory(address.trim());
      setShowWalletModal(false);
    }
  };

  const loadConversationHistory = async (address) => {
    try {
      const history = await base44.entities.AIConversation.filter({
        user_wallet_address: address
      }, '-created_date', 1);
      
      if (history.length > 0 && history[0].messages) {
        setChatMessages(history[0].messages);
      }
    } catch (err) {
      console.error('Failed to load conversation history:', err);
    }
  };

  const saveConversationToDatabase = async (messages, address) => {
    if (!address) return;
    
    try {
      const existing = await base44.entities.AIConversation.filter({
        user_wallet_address: address
      }, '-created_date', 1);
      
      if (existing.length > 0) {
        await base44.entities.AIConversation.update(existing[0].id, {
          messages: messages,
          last_interaction: new Date().toISOString()
        });
      } else {
        await base44.entities.AIConversation.create({
          user_wallet_address: address,
          user_email: user?.email || 'anonymous',
          messages: messages,
          conversation_type: 'general_question',
          last_interaction: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Failed to save conversation:', err);
    }
  };

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setUserIdentity(currentUser.user_identity || "");
      const savedKey = currentUser.openrouter_api_key || "";
      const savedModel = currentUser.openrouter_model || "xiaomi/MiMo-v2-flash:free";
      setOpenRouterKey(savedKey);
      setSelectedModel(savedModel);
      setUseOpenRouter(!!savedKey);
    } catch (err) {
      console.log("User not logged in");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!user?.email) {
      alert('Please login to save API key');
      return;
    }
    
    try {
      await base44.auth.updateMe({ 
        openrouter_api_key: openRouterKey,
        openrouter_model: selectedModel 
      });
      setUseOpenRouter(!!openRouterKey);
      setShowApiSettings(false);
      alert('✅ API settings saved successfully!');
    } catch (err) {
      console.error('Failed to save API settings:', err);
      alert('Failed to save API settings');
    }
  };

  const handleIdentityChange = async (e) => {
    const value = e.target.value;
    setUserIdentity(value);
    
    if (user?.email) {
      try {
        await base44.auth.updateMe({ user_identity: value });
      } catch (err) {
        console.error('Failed to save identity:', err);
      }
    }
  };

  const handleAnalyzeIdentity = async () => {
    if (!userIdentity.trim() || isAnalyzing) return;
    
    const userMessage = userIdentity;
    const updatedMessages = [...chatMessages, { role: 'user', content: userMessage }];
    setChatMessages(updatedMessages);
    setUserIdentity("");
    setIsAnalyzing(true);
    
    try {
      let response;
      
      // Build personalized context from user's full conversation history
      let personalizedContext = '';
      if (walletAddress && chatMessages.length > 0) {
        const fullHistory = chatMessages.map(msg => 
          `${msg.role === 'user' ? 'User' : 'You'}: ${msg.content}`
        ).join('\n');
        personalizedContext = `\n\nYour conversation history with this user (${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}):\n${fullHistory}\n\nUse this history to provide personalized responses. Remember their preferences, previous questions, and context.\n\n`;
      }
      
      // Use OpenRouter if key is provided AND user wants to use it
      if (openRouterKey && useOpenRouter) {
        const messagesWithContext = [
          {
            role: 'system',
            content: `You are ${selectedModel}, a personalized AI companion. ${personalizedContext}Learn from each interaction and adapt your responses based on the user's history. Be their intelligent, learning assistant.`
          },
          ...updatedMessages
        ];
        
        const result = await base44.functions.invoke('openRouterChat', {
          messages: messagesWithContext,
          model: selectedModel,
          apiKey: openRouterKey
        });
        
        if (result.data.error) {
          throw new Error(result.data.error);
        }
        
        response = result.data.content;
      } else {
        // TTT LLM with full personalized learning
        const conversationContext = updatedMessages.slice(-8)
          .map(msg => `${msg.role === 'user' ? 'User' : 'You'}: ${msg.content}`)
          .join('\n\n');
        
        response = await base44.integrations.Core.InvokeLLM({
          prompt: `You are TTT LLM, a personalized AI companion for TTT Chain. ${personalizedContext}Current conversation:\n${conversationContext}\n\nRespond naturally and personally. Learn from this user's history and adapt your responses to their style and needs. If asked which model you are, say you're TTT LLM.`,
          add_context_from_internet: false
        });
      }

      const finalMessages = [...updatedMessages, { role: 'assistant', content: response }];
      setChatMessages(finalMessages);
      
      // Save conversation to database for continuous learning
      if (walletAddress) {
        await saveConversationToDatabase(finalMessages, walletAddress);
      }
      
      if (user?.email) {
        await base44.auth.updateMe({ 
          user_identity: userMessage,
          last_identity_analysis: response,
          last_analysis_date: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Analysis failed:', err);
      setChatMessages(prev => [...prev, { role: 'error', content: 'Failed to analyze. Please try again.' }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAnalyzeIdentity();
    }
  };

  const handleLogout = async () => {
    await base44.auth.logout();
    setUser(null);
  };

  const loadKaspaPrice = async () => {
    setLoadingPrice(true);
    try {
      const response = await base44.functions.invoke('getKaspaPrice');
      if (response.data?.price) {
        setKaspaPrice(response.data.price);
      }
    } catch (err) {
      console.error('Failed to load Kaspa price:', err);
    } finally {
      setLoadingPrice(false);
    }
  };

  const handleKaspaClick = () => {
    setShowKaspaModal(true);
    loadKaspaPrice();
  };

  if (loading) {
    return null;
  }

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-black">
      {/* Water Background */}
      <div className="absolute inset-0">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/cb2f8e8f0_image.png"
          alt="Dark Water"
          className="w-full h-full object-cover"
          style={{ 
            imageRendering: 'high-quality',
            filter: 'brightness(0.7) contrast(1.1)'
          }}
        />
        
        {/* TTT Text Behind Everything - Made More Visible */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1 }}>
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="text-[40vw] font-black text-white/20"
            style={{
              textShadow: '0 0 100px rgba(255, 255, 255, 0.3), 0 0 200px rgba(6, 182, 212, 0.2)',
              letterSpacing: '-0.05em'
            }}
          >
            TTT
          </motion.div>
        </div>

        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" style={{ zIndex: 2 }} />
      </div>
      
      {/* KASPA Button - Top Left */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute top-4 left-4 md:top-6 md:left-6 z-50"
      >
        <Button
          onClick={handleKaspaClick}
          className="bg-transparent hover:bg-white/5 border border-white/20 text-white backdrop-blur-sm h-8 px-3 text-xs md:h-10 md:px-4 md:text-sm font-semibold"
        >
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/13e8ec094_image.png"
            alt="Kaspa"
            className="w-4 h-4 md:w-5 md:h-5 mr-2 rounded-full"
          />
          KASPA
        </Button>
      </motion.div>

      {/* Logout Button */}
      {user && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute top-4 right-4 md:top-6 md:right-6 z-50"
        >
          <Button
            onClick={handleLogout}
            className="bg-cyan-900/80 hover:bg-cyan-800/90 border border-cyan-400/30 text-white backdrop-blur-xl h-8 px-3 text-xs md:h-10 md:px-4 md:text-sm"
          >
            <LogOut className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
            <span className="hidden md:inline">Logout</span>
          </Button>
        </motion.div>
      )}

      {/* Main Content - Centered but Lower */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-48 md:pt-20" style={{ zIndex: 10 }}>
        {/* Top UNCHAIN HUMANITY - Darker */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.5 }}
          className="mb-4 px-4 text-center"
        >
          <h1 
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-2 tracking-tight leading-tight"
            style={{
              color: '#d1d5db',
              textShadow: '0 4px 20px rgba(0, 0, 0, 0.8), 0 0 40px rgba(255, 255, 255, 0.1)',
              fontFamily: '"Orbitron", "Rajdhani", sans-serif',
              fontWeight: 900
            }}
          >
            UNCHAIN HUMANITY
          </h1>
        </motion.div>

        {/* Subtitle */}
        <div className="flex items-center justify-center gap-3 mb-8 ml-8 md:ml-12">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="text-white/70 text-xs md:text-sm tracking-[0.2em] font-light"
            style={{
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
              fontFamily: '"Orbitron", "Rajdhani", sans-serif',
            }}
          >
            KASPA L1
          </motion.span>

          <button 
            onClick={() => setShowPortal(true)}
            className="relative w-12 h-12 md:w-16 md:h-16 flex items-center justify-center flex-shrink-0 cursor-pointer hover:scale-110 transition-transform duration-300"
          >
            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 blur-xl"
              animate={{
                opacity: [0.1, 0.4, 0.1],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div className="w-full h-full bg-cyan-500/20" />
            </motion.div>

            {/* Chain 1 - Forms pyramid, square, line */}
            <motion.div
              className="absolute"
              animate={{
                x: [0, 0, 8, 0],
                y: [0, -8, 0, 0],
                opacity: [0.4, 0.6, 0.5, 0.4],
                rotate: [0, 45, 90, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                filter: 'drop-shadow(0 0 8px rgba(0, 0, 0, 0.5))',
              }}
            >
              <Link2 className="w-4 h-4 md:w-5 md:h-5 text-black/80" strokeWidth={2.5} />
            </motion.div>

            {/* Chain 2 - Center, morphs with others */}
            <motion.div
              className="absolute"
              animate={{
                x: [0, 0, 0, 0],
                y: [0, 0, 0, 0],
                scale: [1, 1.3, 1, 1],
                opacity: [0.5, 0.8, 0.6, 0.5],
                rotate: [0, 90, 180, 360],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                filter: 'drop-shadow(0 0 12px rgba(0, 0, 0, 0.6))',
              }}
            >
              <Link2 className="w-4 h-4 md:w-5 md:h-5 text-black/80" strokeWidth={2.5} />
            </motion.div>

            {/* Chain 3 - Completes shapes */}
            <motion.div
              className="absolute"
              animate={{
                x: [0, 0, -8, 0],
                y: [0, 8, 0, 0],
                opacity: [0.4, 0.6, 0.5, 0.4],
                rotate: [0, -45, -90, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                filter: 'drop-shadow(0 0 8px rgba(0, 0, 0, 0.5))',
              }}
            >
              <Link2 className="w-4 h-4 md:w-5 md:h-5 text-black/80" strokeWidth={2.5} />
            </motion.div>

            {/* Connecting lines */}
            <motion.div
              className="absolute w-12 h-0.5 bg-gradient-to-r from-transparent via-black/30 to-transparent"
              animate={{
                opacity: [0, 0.5, 0],
                rotate: [0, 45, 90, 0],
                scaleX: [0.5, 1, 0.7, 0.5],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Energy particles */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-black/40 rounded-full"
                animate={{
                  x: [0, Math.cos(i * 72 * Math.PI / 180) * 20, 0],
                  y: [0, Math.sin(i * 72 * Math.PI / 180) * 20, 0],
                  opacity: [0, 0.6, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.2,
                  }}
                  />
                  ))}
                  </button>

          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="text-white/70 text-xs md:text-sm tracking-[0.2em] font-light"
            style={{
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
              fontFamily: '"Orbitron", "Rajdhani", sans-serif',
            }}
          >
            KASPLEX L2
          </motion.span>
          </div>

        {/* Buttons - Vertical Stack Centered - Higher Position */}
        <div className="flex flex-col items-center gap-4 mb-16 mt-40 md:mt-60 lg:mt-80">
          {/* Claim Agent ZK Button - Centered */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <Link to={createPageUrl("AgentZK")}>
              <Button
                className="h-12 px-8 text-sm md:text-base font-bold bg-black/60 hover:bg-black/40 text-white border border-white/20 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Claim Agent ZK Identity
              </Button>
            </Link>
          </motion.div>

          {/* Enter TTT Button - No Background */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 1.4 }}
          >
            <Link to={createPageUrl("Feed")}>
              <button className="text-white/90 hover:text-white text-sm md:text-base font-semibold transition-all duration-300 flex items-center gap-2">
                <Hand className="w-4 h-4" />
                Enter TTT
              </button>
            </Link>
          </motion.div>
        </div>

        {/* Bottom UNCHAIN REALITY - Mirror/Reflection Effect (Upside Down + Glassy) */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 1.5 }}
          className="mt-auto pb-8 px-4"
        >
          <h1 
            className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-white/40 tracking-tight text-center"
            style={{
              transform: 'scaleY(-1)',
              textShadow: '0 -8px 32px rgba(0, 0, 0, 0.3), 0 0 60px rgba(6, 182, 212, 0.2)',
              background: 'linear-gradient(to top, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.2))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backdropFilter: 'blur(15px)',
              filter: 'blur(1px) drop-shadow(0 0 30px rgba(255, 255, 255, 0.2))',
              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)',
            }}
          >
            UNCHAIN HUMANITY
          </h1>
        </motion.div>
      </div>

      {/* Kaspa Price Modal */}
      <AnimatePresence>
        {showKaspaModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowKaspaModal(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black/90 border border-white/20 rounded-2xl w-full max-w-md p-6 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-500/20 border border-cyan-500/30 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h3 className="text-white font-bold text-xl">Kaspa Price</h3>
                </div>
                <Button
                  onClick={() => setShowKaspaModal(false)}
                  variant="ghost"
                  size="sm"
                  className="text-white/60 hover:text-white h-8 w-8 p-0"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {loadingPrice ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                </div>
              ) : kaspaPrice ? (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-6">
                    <div className="text-center">
                      <p className="text-white/60 text-sm mb-2">Current Price</p>
                      <p className="text-white text-4xl font-black mb-1">
                        ${kaspaPrice.toFixed(4)}
                      </p>
                      <p className="text-white/40 text-xs">USD per KAS</p>
                    </div>
                  </div>

                  {kaspaPrice?.change24h !== undefined && (
                    <div className="flex items-center justify-center gap-2">
                      <span className={`text-sm font-semibold ${kaspaPrice.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {kaspaPrice.change24h >= 0 ? '+' : ''}{kaspaPrice.change24h?.toFixed(2)}%
                      </span>
                      <span className="text-white/40 text-xs">24h</span>
                    </div>
                  )}


                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-white/60">Unable to load price</p>
                  <Button
                    onClick={loadKaspaPrice}
                    className="mt-4 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400"
                  >
                    Retry
                  </Button>
                  </div>
                  )}

                  <div className="mt-6 pt-4 border-t border-white/10 flex justify-center">
                    <Link to={createPageUrl("B44Prompts")}>
                      <Button
                        className="bg-black/60 hover:bg-black/40 border border-white/20 text-white flex items-center justify-center gap-2 h-10 text-sm px-6"
                      >
                        <img 
                          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/bc56007fd_image.png"
                          alt="b44"
                          className="w-4 h-4 object-contain"
                        />
                        b44
                      </Button>
                    </Link>
                  </div>
                  </motion.div>
                  </motion.div>
                  )}
                  </AnimatePresence>

                  {/* Wallet Connection Modal */}
                  <AnimatePresence>
                    {showWalletModal && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[120] flex items-center justify-center p-4"
                        onClick={() => setShowWalletModal(false)}
                      >
                        <motion.div
                          initial={{ scale: 0.9, y: 20 }}
                          animate={{ scale: 1, y: 0 }}
                          exit={{ scale: 0.9, y: 20 }}
                          onClick={(e) => e.stopPropagation()}
                          className="bg-gradient-to-br from-zinc-900 to-black border-2 border-cyan-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                        >
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">Connect Wallet</h3>
                            <button
                              onClick={() => setShowWalletModal(false)}
                              className="text-white/60 hover:text-white"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="space-y-3">
                            {/* ZK Wallet Option */}
                            <button
                              onClick={connectZKWallet}
                              disabled={isConnectingWallet}
                              className="w-full p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40 rounded-xl hover:from-purple-500/30 hover:to-pink-500/30 transition-all text-left"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                                  <Shield className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                  <p className="text-white font-semibold">Agent ZK Wallet</p>
                                  <p className="text-xs text-gray-400">Use your ZK identity wallet</p>
                                </div>
                              </div>
                            </button>

                            {/* iOS Self Send Option */}
                            <button
                              onClick={connectIOSSelfSend}
                              disabled={isConnectingWallet}
                              className="w-full p-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/40 rounded-xl hover:from-blue-500/30 hover:to-cyan-500/30 transition-all text-left"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                                  <ArrowUpDown className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                  <p className="text-white font-semibold">iOS Self Send</p>
                                  <p className="text-xs text-gray-400">Manually enter your address</p>
                                </div>
                              </div>
                            </button>

                            {/* Kasware Option */}
                            <button
                              onClick={connectKasware}
                              disabled={isConnectingWallet}
                              className="w-full p-4 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 rounded-xl hover:from-cyan-500/30 hover:to-emerald-500/30 transition-all text-left"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center">
                                  <Wallet className="w-6 h-6 text-cyan-400" />
                                </div>
                                <div>
                                  <p className="text-white font-semibold">Kasware</p>
                                  <p className="text-xs text-gray-400">Connect browser extension</p>
                                </div>
                              </div>
                            </button>
                          </div>

                          {isConnectingWallet && (
                            <div className="mt-4 flex items-center justify-center gap-2 text-cyan-400">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span className="text-sm">Connecting...</span>
                            </div>
                          )}
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* API Settings Modal */}
                  <AnimatePresence>
                    {showApiSettings && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[110] flex items-center justify-center p-4"
                        onClick={() => setShowApiSettings(false)}
                      >
                        <motion.div
                          initial={{ scale: 0.9, y: 20 }}
                          animate={{ scale: 1, y: 0 }}
                          exit={{ scale: 0.9, y: 20 }}
                          onClick={(e) => e.stopPropagation()}
                          className="bg-gradient-to-br from-zinc-900 to-black border-2 border-cyan-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                        >
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center">
                              <Key className="w-6 h-6 text-cyan-400" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-white">AI Settings</h3>
                              <p className="text-xs text-gray-400">Optional: Add OpenRouter API key</p>
                            </div>
                          </div>

                          <div className={`mb-4 p-4 rounded-lg border ${useOpenRouter && openRouterKey ? 'bg-purple-500/10 border-purple-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
                            <div className="flex items-center justify-between">
                              <p className={`text-sm flex items-center gap-2 ${useOpenRouter && openRouterKey ? 'text-purple-400' : 'text-green-400'}`}>
                                <CheckCircle2 className="w-4 h-4" />
                                {useOpenRouter && openRouterKey ? `Using: ${selectedModel}` : 'Using: TTT LLM'}
                              </p>
                              {openRouterKey && (
                                <Button
                                  onClick={() => setUseOpenRouter(!useOpenRouter)}
                                  size="sm"
                                  variant="outline"
                                  className={`text-xs ${useOpenRouter ? 'border-purple-500/50 text-purple-400 hover:bg-purple-500/20' : 'border-green-500/50 text-green-400 hover:bg-green-500/20'}`}
                                >
                                  {useOpenRouter ? 'Switch to TTT LLM' : 'Use OpenRouter'}
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="text-sm text-gray-300 mb-2 block">OpenRouter API Key (Optional)</label>
                              <Input
                                type="password"
                                value={openRouterKey}
                                onChange={(e) => setOpenRouterKey(e.target.value)}
                                placeholder="sk-or-v1-..."
                                className="w-full bg-zinc-900 border-zinc-700 text-white"
                              />
                              <p className="text-xs text-gray-500 mt-2">
                                Get your key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">openrouter.ai/keys</a>
                              </p>
                            </div>

                            <div>
                              <label className="text-sm text-gray-300 mb-2 block">Model Name</label>
                              <Input
                                type="text"
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                placeholder="e.g., xiaomi/mimo-v2-flash:free"
                                className="w-full bg-zinc-900 border-zinc-700 text-white mb-2"
                              />
                              <p className="text-xs text-gray-500">
                                Browse models at <a href="https://openrouter.ai/models" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">openrouter.ai/models</a>
                              </p>
                            </div>

                            <div className="flex gap-3">
                              <Button
                                onClick={handleSaveApiKey}
                                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                              >
                                Save
                              </Button>
                              <Button
                                onClick={() => setShowApiSettings(false)}
                                variant="outline"
                                className="border-zinc-700 text-white"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Portal Modal */}
                  <AnimatePresence>
                    {showPortal && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowPortal(false)}
                        className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4"
                      >
                        <motion.div
                          initial={{ scale: 0.9, y: 20 }}
                          animate={{ scale: 1, y: 0 }}
                          exit={{ scale: 0.9, y: 20 }}
                          onClick={(e) => e.stopPropagation()}
                          className="relative bg-gradient-to-br from-zinc-900 to-black border-2 border-cyan-500/50 rounded-3xl w-full max-w-2xl shadow-2xl shadow-cyan-500/20 flex flex-col"
                          style={{ height: '80vh' }}
                        >
                          {/* Top Bar with Wallet, Settings, and Close */}
                          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                            {/* Connect Wallet Button - Left */}
                            {!walletAddress ? (
                              <button
                                onClick={() => setShowWalletModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 rounded-full hover:from-cyan-500/30 hover:to-blue-500/30 transition-all"
                              >
                                <Wallet className="w-4 h-4 text-cyan-400" />
                                <span className="text-sm text-cyan-300 font-medium">
                                  Connect Wallet
                                </span>
                              </button>
                            ) : (
                              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/40 rounded-full">
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                                <span className="text-sm text-green-300 font-medium">
                                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                                </span>
                              </div>
                            )}

                            {/* Settings and Close - Right */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setShowApiSettings(true)}
                                className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/20 rounded-full flex items-center justify-center transition-all"
                                title="API Settings"
                              >
                                <Key className="w-5 h-5 text-cyan-400" />
                              </button>
                              <button
                                onClick={() => setShowPortal(false)}
                                className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/20 rounded-full flex items-center justify-center transition-all"
                              >
                                <X className="w-5 h-5 text-white" />
                              </button>
                            </div>
                          </div>

                          {/* Header with Icon */}
                          <div className="flex-shrink-0 text-center pt-8 pb-4">
                            <motion.div
                              animate={{
                                rotate: [0, 180, 360],
                                scale: [1, 1.1, 1],
                              }}
                              transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                              className="w-16 h-16 mx-auto mb-4 relative"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full blur-xl opacity-70" />
                              <Link2 className="w-full h-full text-cyan-400 relative drop-shadow-[0_0_20px_rgba(34,211,238,0.8)]" strokeWidth={2.5} />
                            </motion.div>
                          </div>

                          {/* Chat Messages Area */}
                          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6" style={{ scrollBehavior: 'smooth' }}>
                            {chatMessages.length === 0 ? (
                              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                                <p className="text-gray-400 text-lg mb-4 max-w-md">Ask anything. Discover truth filtered from multiple sources.</p>
                                {walletAddress && (
                                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-full mb-8">
                                    <Shield className="w-4 h-4 text-purple-400" />
                                    <span className="text-xs text-purple-300">Personal AI • Learning from your history</span>
                                  </div>
                                )}

                                {/* Floating Icon Buttons */}
                                <div className="flex items-center justify-center gap-8">
                                  <Link to={createPageUrl("Bridge")}>
                                    <motion.div whileHover={{ scale: 1.15, y: -8 }} whileTap={{ scale: 0.95 }} className="relative group">
                                      <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl group-hover:bg-cyan-500/40 transition-all" />
                                      <ArrowUpDown className="w-10 h-10 text-cyan-400 relative drop-shadow-[0_0_12px_rgba(34,211,238,0.8)] group-hover:drop-shadow-[0_0_20px_rgba(34,211,238,1)]" strokeWidth={2.5} />
                                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        <span className="text-xs text-cyan-400 font-semibold">Send KAS</span>
                                      </div>
                                    </motion.div>
                                  </Link>

                                  <Link to={createPageUrl("DAGKnightWallet")}>
                                    <motion.div whileHover={{ scale: 1.15, y: -8 }} whileTap={{ scale: 0.95 }} className="relative group">
                                      <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl group-hover:bg-purple-500/40 transition-all" />
                                      <Shield className="w-10 h-10 text-purple-400 relative drop-shadow-[0_0_12px_rgba(192,132,252,0.8)] group-hover:drop-shadow-[0_0_20px_rgba(192,132,252,1)]" strokeWidth={2.5} />
                                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        <span className="text-xs text-purple-400 font-semibold">DAGKnight</span>
                                      </div>
                                    </motion.div>
                                  </Link>

                                  <Link to={createPageUrl("Wallet")}>
                                    <motion.div whileHover={{ scale: 1.15, y: -8 }} whileTap={{ scale: 0.95 }} className="relative group">
                                      <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl group-hover:bg-emerald-500/40 transition-all" />
                                      <Wallet className="w-10 h-10 text-emerald-400 relative drop-shadow-[0_0_12px_rgba(52,211,153,0.8)] group-hover:drop-shadow-[0_0_20px_rgba(52,211,153,1)]" strokeWidth={2.5} />
                                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        <span className="text-xs text-emerald-400 font-semibold">Wallet</span>
                                      </div>
                                    </motion.div>
                                  </Link>

                                  <Link to={createPageUrl("GlobalHistory")}>
                                    <motion.div whileHover={{ scale: 1.15, y: -8 }} whileTap={{ scale: 0.95 }} className="relative group">
                                      <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl group-hover:bg-orange-500/40 transition-all" />
                                      <TrendingUp className="w-10 h-10 text-orange-400 relative drop-shadow-[0_0_12px_rgba(251,146,60,0.8)] group-hover:drop-shadow-[0_0_20px_rgba(251,146,60,1)]" strokeWidth={2.5} />
                                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                                        <span className="text-xs text-orange-400 font-semibold">Analytics</span>
                                      </div>
                                    </motion.div>
                                  </Link>
                                </div>
                              </div>
                            ) : (
                              <>
                                {chatMessages.map((msg, idx) => (
                                  <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                  >
                                    <div className={`max-w-[85%] rounded-3xl px-6 py-4 shadow-lg ${
                                      msg.role === 'user' 
                                        ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border border-cyan-400/50 text-white backdrop-blur-sm' 
                                        : msg.role === 'error'
                                        ? 'bg-red-500/20 border border-red-500/40 text-red-300 backdrop-blur-sm'
                                        : 'bg-zinc-900/80 border border-white/10 text-gray-200 backdrop-blur-sm'
                                    }`}>
                                      <p className="whitespace-pre-wrap text-sm leading-relaxed break-words overflow-wrap-anywhere">{msg.content}</p>
                                    </div>
                                    </motion.div>
                                    ))}
                                    {isAnalyzing && (
                                    <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex justify-start"
                                    >
                                    <div className="bg-zinc-900/80 border border-cyan-500/30 rounded-3xl px-6 py-4 backdrop-blur-sm shadow-lg">
                                      <div className="flex items-center gap-3">
                                        <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                                        <span className="text-base text-cyan-300">Analyzing across sources...</span>
                                      </div>
                                    </div>
                                    </motion.div>
                                    )}
                                    <div ref={messagesEndRef} />
                                    </>
                                    )}
                                    </div>

                          {/* Input Area */}
                          <div className="flex-shrink-0 p-6 border-t border-white/10 bg-black/40 backdrop-blur-sm">
                            <div className="flex gap-3">
                              <Input
                                value={userIdentity}
                                onChange={handleIdentityChange}
                                onKeyPress={handleKeyPress}
                                placeholder="I am..."
                                disabled={isAnalyzing}
                                className="flex-1 bg-zinc-900/80 border-2 border-cyan-500/40 text-white text-base placeholder:text-gray-500 focus:border-cyan-400 h-14 rounded-2xl px-5 shadow-inner"
                              />
                              <Button
                                onClick={handleAnalyzeIdentity}
                                disabled={!userIdentity.trim() || isAnalyzing}
                                className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white px-8 h-14 rounded-2xl shadow-lg shadow-cyan-500/30"
                              >
                                {isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                              </Button>
                            </div>
                            <p className="text-xs text-gray-400 mt-3 text-center">
                              Press Enter • Your AI will remember this
                            </p>
                          </div>

                          {/* Footer */}
                          <div className="flex-shrink-0 py-3 text-center border-t border-white/10">
                            <p className="text-gray-500 text-xs">Secured by TTT Chain Protocol</p>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  </div>
                  );
                  }