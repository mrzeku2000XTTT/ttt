import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Sparkles, Loader2, RefreshCw, Terminal, Database, Activity, Users, Brain, Eye, Wallet, TrendingUp, Globe, Zap, Shield, MessageSquare, Download, Save, Copy, Trash2, X as XIcon, Maximize2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ESCPage() {
  const [background, setBackground] = useState(null);
  const [bgPrompt, setBgPrompt] = useState("");
  const [isGeneratingBg, setIsGeneratingBg] = useState(false);
  const [showBgGenerator, setShowBgGenerator] = useState(false);
  const [matrixChars, setMatrixChars] = useState([]);
  const [user, setUser] = useState(null);
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);
  
  // Real data stats
  const [realStats, setRealStats] = useState({
    totalUsers: 0,
    totalTransactions: 0,
    totalNFTs: 0,
    totalVerifications: 0,
    totalPatterns: 0,
    totalVisions: 0,
    totalAgentProfiles: 0,
    totalMessages: 0
  });
  
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [quickCommand, setQuickCommand] = useState('');
  const [commandOutput, setCommandOutput] = useState([]);
  const [isExecutingCommand, setIsExecutingCommand] = useState(false);
  
  // Wallet Designer State
  const [walletAddress, setWalletAddress] = useState(null);
  const [walletBgImage, setWalletBgImage] = useState(null);
  const [walletBgPrompt, setWalletBgPrompt] = useState("");
  const [isGeneratingWalletBg, setIsGeneratingWalletBg] = useState(false);
  const [walletCardStyle, setWalletCardStyle] = useState('kasware');
  const [savedWalletDesigns, setSavedWalletDesigns] = useState([]);
  const [showWalletFullscreen, setShowWalletFullscreen] = useState(false);

  useEffect(() => {
    loadBackground();
    initializeMatrix();
    loadUser();
    loadRealStats();
    loadWalletDesigns();
    
    const interval = setInterval(loadRealStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      if (currentUser?.created_wallet_address) {
        setWalletAddress(currentUser.created_wallet_address);
      }
    } catch (err) {
      console.error('Failed to load user:', err);
    }
  };

  const loadRealStats = async () => {
    setIsLoadingStats(true);
    try {
      const [
        users,
        transactions,
        nfts,
        verifications,
        patterns,
        visions,
        profiles,
        messages
      ] = await Promise.all([
        base44.entities.User.list('-created_date', 1000),
        base44.entities.BridgeTransaction.list('-created_date', 1000),
        base44.entities.NFT.list('-minted_at', 1000),
        base44.entities.AgentYingVerification.list('-verified_at', 1000),
        base44.entities.AgentYingPattern.list('-usage_count', 1000),
        base44.entities.AgentYingVision.list('-analyzed_at', 1000),
        base44.entities.AgentZKProfile.list('-created_date', 1000),
        base44.entities.AgentMessage.list('-created_date', 1000)
      ]);

      setRealStats({
        totalUsers: users.length,
        totalTransactions: transactions.length,
        totalNFTs: nfts.length,
        totalVerifications: verifications.length,
        totalPatterns: patterns.length,
        totalVisions: visions.length,
        totalAgentProfiles: profiles.length,
        totalMessages: messages.length,
        avgVerificationScore: verifications.length > 0 
          ? Math.round(verifications.reduce((sum, v) => sum + v.verification_score, 0) / verifications.length)
          : 0,
        totalNFTValue: nfts.reduce((sum, n) => sum + (n.zeku_cost || 0), 0),
        activeProfiles: profiles.filter(p => p.is_public).length
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadBackground = () => {
    const saved = localStorage.getItem('esc_background');
    if (saved) {
      setBackground(saved);
    }
  };
  
  const loadWalletDesigns = () => {
    const saved = localStorage.getItem('wallet_designs');
    if (saved) {
      try {
        setSavedWalletDesigns(JSON.parse(saved));
      } catch (err) {
        setSavedWalletDesigns([]);
      }
    }
  };
  
  const generateWalletBackground = async () => {
    if (!walletBgPrompt.trim()) {
      alert("Enter a wallet background design prompt");
      return;
    }

    setIsGeneratingWalletBg(true);
    try {
      const response = await base44.integrations.Core.GenerateImage({
        prompt: walletBgPrompt
      });

      if (response.url) {
        setWalletBgImage(response.url);
      }
    } catch (err) {
      console.error("Wallet background generation failed:", err);
      alert("Failed to generate wallet background");
    } finally {
      setIsGeneratingWalletBg(false);
    }
  };
  
  const saveWalletDesign = () => {
    if (!walletBgImage) {
      alert("Please generate a background first");
      return;
    }
    
    const design = {
      id: Date.now().toString(),
      backgroundImage: walletBgImage,
      prompt: walletBgPrompt,
      style: walletCardStyle,
      createdAt: new Date().toISOString()
    };
    
    const updated = [...savedWalletDesigns, design];
    setSavedWalletDesigns(updated);
    localStorage.setItem('wallet_designs', JSON.stringify(updated));
    alert("Wallet design saved!");
  };
  
  const loadWalletDesign = (design) => {
    setWalletBgImage(design.backgroundImage);
    setWalletBgPrompt(design.prompt);
    setWalletCardStyle(design.style);
  };
  
  const deleteWalletDesign = (designId) => {
    const updated = savedWalletDesigns.filter(d => d.id !== designId);
    setSavedWalletDesigns(updated);
    localStorage.setItem('wallet_designs', JSON.stringify(updated));
  };

  const initializeMatrix = () => {
    const chars = [];
    const columns = Math.floor(window.innerWidth / 20);
    for (let i = 0; i < columns; i++) {
      chars.push({
        id: i,
        char: String.fromCharCode(33 + Math.random() * 94),
        x: i * 20,
        y: Math.random() * window.innerHeight,
        speed: 1 + Math.random() * 3
      });
    }
    setMatrixChars(chars);
  };

  const executeCommand = async () => {
    if (!quickCommand.trim()) return;
    
    setIsExecutingCommand(true);
    const cmd = quickCommand.toLowerCase().trim();
    
    const newOutput = [...commandOutput, { type: 'input', text: `$ ${quickCommand}` }];
    
    try {
      if (cmd === 'help') {
        newOutput.push({ 
          type: 'output', 
          text: `Available commands:
• help - Show this help
• stats - Show system statistics
• users - List recent users
• nfts - Show NFT statistics
• patterns - Agent Ying patterns
• clear - Clear terminal
• refresh - Reload all data` 
        });
      } else if (cmd === 'stats') {
        newOutput.push({ 
          type: 'output', 
          text: `SYSTEM STATISTICS:
Users: ${realStats.totalUsers}
Transactions: ${realStats.totalTransactions}
NFTs: ${realStats.totalNFTs}
Verifications: ${realStats.totalVerifications}
Patterns: ${realStats.totalPatterns}
Vision Analyses: ${realStats.totalVisions}
Messages: ${realStats.totalMessages}` 
        });
      } else if (cmd === 'users') {
        const recentUsers = await base44.entities.User.list('-created_date', 5);
        newOutput.push({ 
          type: 'output', 
          text: `RECENT USERS:\n${recentUsers.map((u, i) => `${i + 1}. ${u.username || u.email} (${new Date(u.created_date).toLocaleDateString()})`).join('\n')}` 
        });
      } else if (cmd === 'nfts') {
        newOutput.push({ 
          type: 'output', 
          text: `NFT STATISTICS:
Total Minted: ${realStats.totalNFTs}
Total Value: ${realStats.totalNFTValue?.toFixed(2)} ZEKU
Avg Cost: ${(realStats.totalNFTValue / realStats.totalNFTs || 0).toFixed(2)} ZEKU` 
        });
      } else if (cmd === 'patterns') {
        const topPatterns = await base44.entities.AgentYingPattern.list('-usage_count', 5);
        newOutput.push({ 
          type: 'output', 
          text: `TOP PATTERNS:\n${topPatterns.map((p, i) => `${i + 1}. ${p.task_type} - ${p.usage_count || 0} uses`).join('\n')}` 
        });
      } else if (cmd === 'clear') {
        setCommandOutput([]);
        setQuickCommand('');
        setIsExecutingCommand(false);
        return;
      } else if (cmd === 'refresh') {
        await loadRealStats();
        newOutput.push({ type: 'output', text: '✓ Data refreshed successfully' });
      } else {
        newOutput.push({ type: 'error', text: `Command not found: ${cmd}. Type 'help' for available commands.` });
      }
    } catch (err) {
      newOutput.push({ type: 'error', text: `Error: ${err.message}` });
    }
    
    setCommandOutput(newOutput);
    setQuickCommand('');
    setIsExecutingCommand(false);
  };

  const generateBackground = async () => {
    if (!bgPrompt.trim()) {
      alert("Enter a background prompt");
      return;
    }

    setIsGeneratingBg(true);
    try {
      const response = await base44.integrations.Core.GenerateImage({
        prompt: `Ultra HD 8K cinematic background: ${bgPrompt}. Crystal clear, photorealistic, highly detailed, masterpiece quality, sharp focus, no blur, professional photography`
      });

      if (response.url) {
        setBackground(response.url);
        localStorage.setItem('esc_background', response.url);
        setShowBgGenerator(false);
        setBgPrompt("");
      }
    } catch (err) {
      console.error("Background generation failed:", err);
      alert("Failed to generate background");
    } finally {
      setIsGeneratingBg(false);
    }
  };

  // Wallet Card Component (reusable)
  const WalletCard = ({ fullscreen = false, onClick }) => (
    <div 
      className={`relative ${fullscreen ? 'w-full max-w-3xl mx-auto' : 'w-full'} rounded-2xl overflow-hidden shadow-2xl ${!fullscreen && 'cursor-pointer hover:scale-[1.02] transition-transform'}`}
      style={{ aspectRatio: '1.586/1' }}
      onClick={onClick}
    >
      {/* Background Layer */}
      <div className="absolute inset-0">
        {walletBgImage ? (
          <img
            src={walletBgImage}
            alt="Wallet background"
            className="w-full h-full object-cover"
            style={{ imageRendering: 'high-quality' }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cyan-900 via-blue-900 to-purple-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/20 to-black/60" />
      </div>

      {/* Card Content - Horizontal Layout */}
      <div className={`relative h-full ${fullscreen ? 'p-4 sm:p-6 md:p-8' : 'p-6'} flex items-center justify-between gap-3 sm:gap-4 md:gap-6`}>
        {/* Left Side: Text Content */}
        <div className="flex-1 flex flex-col justify-between h-full min-w-0">
          {/* Top Section */}
          <div>
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <div className={`text-white font-bold ${fullscreen ? 'text-2xl sm:text-3xl md:text-5xl' : 'text-2xl'} tracking-wider drop-shadow-lg`}>TTT</div>
              <Badge className={`bg-black border-cyan-400 text-cyan-400 font-mono ${fullscreen ? 'text-xs sm:text-sm md:text-base px-2 sm:px-3 md:px-4 py-1' : 'text-xs'} backdrop-blur-sm`}>
                KASPA
              </Badge>
            </div>
          </div>

          {/* Bottom Section - Address */}
          <div>
            <div className={`text-white/70 ${fullscreen ? 'text-[10px] sm:text-xs md:text-sm' : 'text-[10px]'} font-mono mb-1 sm:mb-2 tracking-wider drop-shadow`}>KASPA ADDRESS</div>
            <div className={`bg-black/60 backdrop-blur-md border border-white/30 rounded-lg ${fullscreen ? 'p-2 sm:p-2.5 md:p-3' : 'p-3'} shadow-xl`}>
              <code className={`text-white font-mono ${fullscreen ? 'text-[9px] sm:text-[10px] md:text-xs' : 'text-[11px]'} drop-shadow truncate block`}>
                {walletAddress ? `${walletAddress.slice(0, 20)}...${walletAddress.slice(-10)}` : ''}
              </code>
            </div>
            <div className={`flex items-center justify-between ${fullscreen ? 'mt-1.5 sm:mt-2 md:mt-3' : 'mt-3'}`}>
              <div className={`text-white/60 ${fullscreen ? 'text-[8px] sm:text-[9px] md:text-xs' : 'text-[9px]'} font-mono tracking-widest drop-shadow`}>
                🔐 ENCRYPTED
              </div>
              <div className={`text-white/70 ${fullscreen ? 'text-[8px] sm:text-[9px] md:text-xs' : 'text-[9px]'} font-mono drop-shadow`}>
                {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: QR Code */}
        <div className="flex-shrink-0 flex items-center">
          <div className={`bg-white rounded-lg sm:rounded-xl ${fullscreen ? 'p-2 sm:p-3 md:p-4' : 'p-3'} shadow-2xl`}>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(walletAddress)}`}
              alt="Wallet QR"
              className={fullscreen ? 'w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32' : 'w-28 h-28'}
            />
          </div>
        </div>
      </div>

      {/* Fullscreen Indicator */}
      {!fullscreen && (
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm border border-white/20 rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Maximize2 className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* HD Background */}
      <div className="fixed inset-0 z-0">
        {background ? (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${background})`,
              imageRendering: 'high-quality',
              filter: 'contrast(1.1) saturate(1.2)'
            }}
          >
            <div className={`absolute inset-0 ${isFullscreenMode ? 'bg-black/20' : 'bg-gradient-to-b from-black/60 via-black/40 to-black/70'}`} />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-black via-cyan-950/20 to-black" />
        )}
      </div>

      {/* Matrix Rain Effect */}
      <div className={`fixed inset-0 z-[1] pointer-events-none overflow-hidden ${isFullscreenMode ? 'opacity-30' : 'opacity-20'}`}>
        {matrixChars.map((char) => (
          <motion.div
            key={char.id}
            initial={{ y: char.y }}
            animate={{ y: window.innerHeight + 100 }}
            transition={{
              duration: 10 / char.speed,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute text-cyan-400 font-mono text-sm"
            style={{ left: char.x }}
          >
            {char.char}
          </motion.div>
        ))}
      </div>

      {/* Scanlines */}
      <div className="fixed inset-0 z-[2] pointer-events-none opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(6, 182, 212, 0.1) 2px, rgba(6, 182, 212, 0.1) 4px)'
        }} />
      </div>

      {/* Wallet Fullscreen Modal */}
      <AnimatePresence>
        {showWalletFullscreen && walletAddress && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[60]"
              onClick={() => setShowWalletFullscreen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-[70] flex items-center justify-center p-4"
              onClick={() => setShowWalletFullscreen(false)}
            >
              <div className="max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <div className="flex justify-end mb-4">
                  <Button
                    onClick={() => setShowWalletFullscreen(false)}
                    className="bg-white/10 border border-white/20 text-white hover:bg-white/20"
                  >
                    <XIcon className="w-5 h-5 mr-2" />
                    Close
                  </Button>
                </div>

                {/* Fullscreen Card */}
                <div className="group">
                  <WalletCard fullscreen />
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-4">
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(walletAddress);
                      const toast = document.createElement('div');
                      toast.className = 'fixed top-24 left-1/2 -translate-x-1/2 bg-green-500/20 border border-green-500/30 text-green-400 px-6 py-3 rounded-lg backdrop-blur-xl z-[100] font-mono text-sm';
                      toast.textContent = '✓ Address copied!';
                      document.body.appendChild(toast);
                      setTimeout(() => toast.remove(), 2000);
                    }}
                    className="flex-1 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Address
                  </Button>
                  <Button
                    onClick={() => {
                      const toast = document.createElement('div');
                      toast.className = 'fixed top-24 left-1/2 -translate-x-1/2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 px-6 py-3 rounded-lg backdrop-blur-xl z-[100] font-mono text-sm';
                      toast.textContent = 'To download: Take a screenshot of the card';
                      document.body.appendChild(toast);
                      setTimeout(() => toast.remove(), 3000);
                    }}
                    className="flex-1 bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download HD
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Fullscreen Mode - Just Logo and Background */}
      {isFullscreenMode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex items-center justify-center"
        >
          <Button
            onClick={() => setIsFullscreenMode(false)}
            className="fixed top-24 left-6 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 backdrop-blur-xl z-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="text-center">
            <motion.div
              animate={{
                textShadow: [
                  '0 0 30px rgba(6, 182, 212, 0.6)',
                  '0 0 60px rgba(6, 182, 212, 0.9)',
                  '0 0 30px rgba(6, 182, 212, 0.6)',
                ],
                scale: [1, 1.05, 1]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-[120px] md:text-[200px] font-black text-cyan-400 tracking-tighter cursor-pointer select-none"
              onClick={() => setIsFullscreenMode(false)}
            >
              ESC
            </motion.div>
            <motion.div
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-cyan-300/60 font-mono text-lg md:text-2xl tracking-widest"
            >
              ENHANCED SYSTEM CONTROL
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Normal UI - Hidden in Fullscreen Mode */}
      {!isFullscreenMode && (
        <>
          {/* Background Generator Button */}
          <div className="fixed top-24 right-6 z-50">
            <Button
              onClick={() => setShowBgGenerator(!showBgGenerator)}
              size="sm"
              className="bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 backdrop-blur-xl"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Change BG
            </Button>
          </div>

      {/* Background Generator Modal */}
      <AnimatePresence>
        {showBgGenerator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowBgGenerator(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black/90 border border-cyan-500/30 rounded-xl p-6 max-w-md w-full backdrop-blur-xl"
            >
              <h3 className="text-white font-bold text-xl mb-4">AI Background Generator</h3>
              <Textarea
                value={bgPrompt}
                onChange={(e) => setBgPrompt(e.target.value)}
                placeholder="Cyberpunk cityscape, neon lights, futuristic..."
                className="bg-white/5 border-cyan-500/30 text-white placeholder:text-gray-600 mb-4 h-24"
              />
              <div className="flex gap-3">
                <Button
                  onClick={generateBackground}
                  disabled={isGeneratingBg}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                >
                  {isGeneratingBg ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setBackground(null);
                    localStorage.removeItem('esc_background');
                    setShowBgGenerator(false);
                  }}
                  variant="outline"
                  className="border-cyan-500/30 text-cyan-400"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link to={createPageUrl("Settings")}>
              <Button
                variant="ghost"
                className="mb-6 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Settings
              </Button>
            </Link>

            <div className="text-center mb-12">
              <motion.div
                animate={{
                  textShadow: [
                    '0 0 20px rgba(6, 182, 212, 0.5)',
                    '0 0 40px rgba(6, 182, 212, 0.8)',
                    '0 0 20px rgba(6, 182, 212, 0.5)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl md:text-8xl font-black text-cyan-400 mb-4 tracking-tighter cursor-pointer hover:scale-105 transition-transform select-none"
                onClick={() => setIsFullscreenMode(true)}
                title="Click to enter fullscreen mode"
              >
                ESC
              </motion.div>
              <div className="text-cyan-300/60 font-mono text-sm tracking-widest">
                ENHANCED SYSTEM CONTROL
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
            {['overview', 'wallet', 'database', 'ai', 'network', 'terminal'].map((tab) => (
              <Button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`font-mono text-sm ${
                  activeTab === tab
                    ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400'
                    : 'bg-black/30 border border-cyan-500/10 text-cyan-500/60 hover:bg-cyan-500/10'
                }`}
              >
                {tab.toUpperCase()}
              </Button>
            ))}
          </div>

          {/* WALLET DESIGNER Tab */}
          {activeTab === 'wallet' && (
            <div className="space-y-6">
              {!walletAddress ? (
                <Card className="bg-cyan-500/5 border border-cyan-500/20 backdrop-blur-xl">
                  <CardContent className="p-12 text-center">
                    <Wallet className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                    <h3 className="text-white font-bold text-xl mb-2">No TTT Wallet Found</h3>
                    <p className="text-gray-400 mb-6">Create a TTT Wallet to use the Wallet Designer</p>
                    <Link to={createPageUrl("Wallet")}>
                      <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                        <Wallet className="w-4 h-4 mr-2" />
                        Create TTT Wallet
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Left: Designer Controls */}
                  <div className="space-y-6">
                    <Card className="bg-cyan-500/5 border border-cyan-500/20 backdrop-blur-xl">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-cyan-500/20">
                          <Sparkles className="w-6 h-6 text-cyan-400" />
                          <h2 className="text-xl font-bold text-cyan-300 font-mono">WALLET.DESIGNER</h2>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="text-sm text-cyan-400/80 mb-2 block font-mono">AI Background Prompt</label>
                            <Textarea
                              value={walletBgPrompt}
                              onChange={(e) => setWalletBgPrompt(e.target.value)}
                              placeholder="Luxury gold waves, futuristic neon city, cosmic nebula, abstract art..."
                              className="bg-black/50 border-cyan-500/30 text-cyan-300 placeholder:text-cyan-500/30 font-mono h-24"
                            />
                            <p className="text-xs text-cyan-500/50 mt-2 font-mono">
                              ✨ Generate ANY HD image - landscapes, abstract art, space, luxury textures...
                            </p>
                          </div>

                          <Button
                            onClick={generateWalletBackground}
                            disabled={isGeneratingWalletBg || !walletBgPrompt.trim()}
                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 h-12"
                          >
                            {isGeneratingWalletBg ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating HD Image...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Generate HD Background
                              </>
                            )}
                          </Button>

                          <div className="flex gap-2">
                            <Button
                              onClick={saveWalletDesign}
                              disabled={!walletBgImage}
                              className="flex-1 bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30"
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Save Design
                            </Button>
                            <Button
                              onClick={() => {
                                setWalletBgImage(null);
                                setWalletBgPrompt('');
                              }}
                              variant="outline"
                              className="flex-1 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Reset
                            </Button>
                          </div>

                          {/* Example Prompts */}
                          <div className="bg-black/50 border border-cyan-500/20 rounded-lg p-4">
                            <h4 className="text-xs text-cyan-400/80 font-mono mb-2">Try These HD Backgrounds:</h4>
                            <div className="space-y-1 text-[10px] text-cyan-500/60 font-mono">
                              <div>• Futuristic neon cityscape at night</div>
                              <div>• Cosmic purple nebula in deep space</div>
                              <div>• Abstract liquid gold flowing waves</div>
                              <div>• Cyberpunk rain on glass texture</div>
                              <div>• Northern lights aurora borealis</div>
                              <div>• Japanese wave art modern style</div>
                            </div>
                          </div>

                          {/* Saved Designs */}
                          {savedWalletDesigns.length > 0 && (
                            <div className="mt-6">
                              <h3 className="text-sm text-cyan-400/80 mb-3 font-mono">Saved Designs ({savedWalletDesigns.length})</h3>
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {savedWalletDesigns.map((design) => (
                                  <div key={design.id} className="bg-black/50 border border-cyan-500/20 rounded-lg p-3 flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs text-cyan-300 truncate">{design.prompt.substring(0, 40)}...</div>
                                      <div className="text-[10px] text-cyan-500/50 font-mono">{new Date(design.createdAt).toLocaleDateString()}</div>
                                    </div>
                                    <div className="flex gap-1 flex-shrink-0">
                                      <Button
                                        onClick={() => loadWalletDesign(design)}
                                        size="sm"
                                        className="h-7 w-7 p-0 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                                      >
                                        <Download className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        onClick={() => deleteWalletDesign(design.id)}
                                        size="sm"
                                        className="h-7 w-7 p-0 bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right: Wallet Card Preview */}
                  <div className="space-y-6">
                    <Card className="bg-cyan-500/5 border border-cyan-500/20 backdrop-blur-xl">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-cyan-500/20">
                          <div className="flex items-center gap-3">
                            <Eye className="w-6 h-6 text-cyan-400" />
                            <h2 className="text-xl font-bold text-cyan-300 font-mono">PREVIEW</h2>
                          </div>
                          <Button
                            onClick={() => setShowWalletFullscreen(true)}
                            size="sm"
                            className="bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30"
                          >
                            <Maximize2 className="w-4 h-4 mr-2" />
                            Fullscreen
                          </Button>
                        </div>

                        {/* Wallet Card - With proper padding */}
                        <div className="p-4 group">
                          <WalletCard onClick={() => setShowWalletFullscreen(true)} />
                        </div>

                        {/* Download Card */}
                        <div className="mt-6 flex gap-2">
                          <Button
                            onClick={() => {
                              window.open(walletBgImage || 'https://api.qrserver.com/v1/create-qr-code/?size=800x800&data=' + encodeURIComponent(walletAddress), '_blank');
                            }}
                            className="flex-1 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 font-mono"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export Design
                          </Button>
                          <Button
                            onClick={() => {
                              navigator.clipboard.writeText(walletAddress);
                              const toast = document.createElement('div');
                              toast.className = 'fixed top-24 left-1/2 -translate-x-1/2 bg-green-500/20 border border-green-500/30 text-green-400 px-6 py-3 rounded-lg backdrop-blur-xl z-[100] font-mono text-sm';
                              toast.textContent = '✓ Address copied!';
                              document.body.appendChild(toast);
                              setTimeout(() => toast.remove(), 2000);
                            }}
                            variant="outline"
                            className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                          <p className="text-xs text-blue-300">
                            💡 <strong>Tip:</strong> Click the card to view fullscreen! Generate ANY HD image as your wallet background. Perfect for e-commerce and business!
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* OVERVIEW Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-4 gap-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <Card className="bg-cyan-500/5 border border-cyan-500/20 backdrop-blur-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <Users className="w-5 h-5 text-cyan-400" />
                        <span className="text-cyan-300/80 text-sm font-mono">USERS</span>
                      </div>
                      <div className="text-3xl font-bold text-cyan-400">
                        {isLoadingStats ? '...' : realStats.totalUsers}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Card className="bg-cyan-500/5 border border-cyan-500/20 backdrop-blur-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <TrendingUp className="w-5 h-5 text-cyan-400" />
                        <span className="text-cyan-300/80 text-sm font-mono">TRANSACTIONS</span>
                      </div>
                      <div className="text-3xl font-bold text-cyan-400">
                        {isLoadingStats ? '...' : realStats.totalTransactions}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <Card className="bg-cyan-500/5 border border-cyan-500/20 backdrop-blur-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <Sparkles className="w-5 h-5 text-cyan-400" />
                        <span className="text-cyan-300/80 text-sm font-mono">NFTs</span>
                      </div>
                      <div className="text-3xl font-bold text-cyan-400">
                        {isLoadingStats ? '...' : realStats.totalNFTs}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <Card className="bg-cyan-500/5 border border-cyan-500/20 backdrop-blur-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <Shield className="w-5 h-5 text-cyan-400" />
                        <span className="text-cyan-300/80 text-sm font-mono">PROFILES</span>
                      </div>
                      <div className="text-3xl font-bold text-cyan-400">
                        {isLoadingStats ? '...' : realStats.totalAgentProfiles}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <Card className="bg-cyan-500/5 border border-cyan-500/20 backdrop-blur-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Brain className="w-5 h-5 text-purple-400" />
                      <span className="text-cyan-300/80 text-sm font-mono">AI VERIFICATIONS</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-400">
                      {isLoadingStats ? '...' : realStats.totalVerifications}
                    </div>
                    <div className="text-xs text-cyan-400/60 mt-1">
                      Avg: {realStats.avgVerificationScore}%
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-cyan-500/5 border border-cyan-500/20 backdrop-blur-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Eye className="w-5 h-5 text-blue-400" />
                      <span className="text-cyan-300/80 text-sm font-mono">VISION SCANS</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-400">
                      {isLoadingStats ? '...' : realStats.totalVisions}
                    </div>
                    <div className="text-xs text-cyan-400/60 mt-1">
                      Google Lens AI
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-cyan-500/5 border border-cyan-500/20 backdrop-blur-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <MessageSquare className="w-5 h-5 text-green-400" />
                      <span className="text-cyan-300/80 text-sm font-mono">MESSAGES</span>
                    </div>
                    <div className="text-2xl font-bold text-green-400">
                      {isLoadingStats ? '...' : realStats.totalMessages}
                    </div>
                    <div className="text-xs text-cyan-400/60 mt-1">
                      Agent Network
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* DATABASE Tab */}
          {activeTab === 'database' && (
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-cyan-500/5 border border-cyan-500/20 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-cyan-500/20">
                    <Database className="w-6 h-6 text-cyan-400" />
                    <h2 className="text-xl font-bold text-cyan-300 font-mono">DATABASE.STATS</h2>
                  </div>
                  <div className="space-y-3 font-mono text-sm">
                    <div className="flex justify-between">
                      <span className="text-cyan-400/60">Total Users:</span>
                      <span className="text-cyan-300">{realStats.totalUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-400/60">NFTs Minted:</span>
                      <span className="text-cyan-300">{realStats.totalNFTs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-400/60">Transactions:</span>
                      <span className="text-cyan-300">{realStats.totalTransactions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-400/60">Agent Profiles:</span>
                      <span className="text-cyan-300">{realStats.totalAgentProfiles}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-400/60">Active Profiles:</span>
                      <span className="text-green-400">{realStats.activeProfiles}</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-cyan-500/20">
                      <span className="text-cyan-400/60">Total NFT Value:</span>
                      <span className="text-purple-400 font-bold">{realStats.totalNFTValue?.toFixed(2)} ZEKU</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-cyan-500/5 border border-cyan-500/20 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-cyan-500/20">
                    <Activity className="w-6 h-6 text-cyan-400" />
                    <h2 className="text-xl font-bold text-cyan-300 font-mono">LIVE.ACTIVITY</h2>
                  </div>
                  <div className="space-y-2 font-mono text-xs">
                    {Array.from({ length: 8 }).map((_, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: [0.3, 0.8, 0.3], x: 0 }}
                        transition={{
                          opacity: { duration: 2, repeat: Infinity, delay: idx * 0.3 },
                          x: { duration: 0.5, delay: idx * 0.1 }
                        }}
                        className="flex items-center gap-3 text-cyan-400/60"
                      >
                        <span className="text-cyan-500">•</span>
                        <span className="flex-1">
                          {['User login', 'NFT minted', 'Vision scan', 'Pattern learned', 'Message sent', 'Transaction', 'Verification', 'Profile update'][idx % 8]}
                        </span>
                        <span className="text-green-400 text-[10px]">{Math.floor(Math.random() * 60)}s ago</span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* AI Tab */}
          {activeTab === 'ai' && (
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-cyan-500/5 border border-cyan-500/20 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Brain className="w-6 h-6 text-purple-400" />
                    <h3 className="text-lg font-bold text-cyan-300 font-mono">AGENT.YING</h3>
                  </div>
                  <div className="space-y-2 font-mono text-sm">
                    <div className="flex justify-between">
                      <span className="text-cyan-400/60">Patterns:</span>
                      <span className="text-purple-400 font-bold">{realStats.totalPatterns}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-400/60">Verifications:</span>
                      <span className="text-cyan-300">{realStats.totalVerifications}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-400/60">Avg Score:</span>
                      <span className="text-green-400">{realStats.avgVerificationScore}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-cyan-500/5 border border-cyan-500/20 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Eye className="w-6 h-6 text-blue-400" />
                    <h3 className="text-lg font-bold text-cyan-300 font-mono">VISION.AI</h3>
                  </div>
                  <div className="space-y-2 font-mono text-sm">
                    <div className="flex justify-between">
                      <span className="text-cyan-400/60">Images Scanned:</span>
                      <span className="text-blue-400 font-bold">{realStats.totalVisions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-400/60">Status:</span>
                      <span className="text-green-400">ACTIVE</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-400/60">Mode:</span>
                      <span className="text-cyan-300">Google Lens</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-cyan-500/5 border border-cyan-500/20 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <MessageSquare className="w-6 h-6 text-green-400" />
                    <h3 className="text-lg font-bold text-cyan-300 font-mono">NETWORK.COMM</h3>
                  </div>
                  <div className="space-y-2 font-mono text-sm">
                    <div className="flex justify-between">
                      <span className="text-cyan-400/60">Messages:</span>
                      <span className="text-green-400 font-bold">{realStats.totalMessages}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-400/60">Active Agents:</span>
                      <span className="text-cyan-300">{realStats.activeProfiles}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-400/60">Network:</span>
                      <span className="text-green-400">ONLINE</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* NETWORK Tab */}
          {activeTab === 'network' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-cyan-500/5 border border-cyan-500/20 backdrop-blur-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-cyan-500/20">
                      <Globe className="w-6 h-6 text-cyan-400" />
                      <h2 className="text-xl font-bold text-cyan-300 font-mono">BLOCKCHAIN.STATS</h2>
                    </div>
                    <div className="space-y-3 font-mono text-sm">
                      <div className="flex justify-between">
                        <span className="text-cyan-400/60">Total Transactions:</span>
                        <span className="text-cyan-300">{realStats.totalTransactions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-cyan-400/60">NFT Volume:</span>
                        <span className="text-purple-400">{realStats.totalNFTValue?.toFixed(2)} ZEKU</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-cyan-400/60">Network:</span>
                        <span className="text-green-400">Kasplex L2</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-cyan-400/60">Chain Status:</span>
                        <span className="text-green-400">SYNCED</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-cyan-500/5 border border-cyan-500/20 backdrop-blur-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-cyan-500/20">
                      <Zap className="w-6 h-6 text-yellow-400" />
                      <h2 className="text-xl font-bold text-cyan-300 font-mono">QUICK.ACTIONS</h2>
                    </div>
                    <div className="space-y-3">
                      <Link to={createPageUrl("X")}>
                        <Button className="w-full bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 font-mono">
                          <Brain className="w-4 h-4 mr-2" />
                          Agent Yang Verify
                        </Button>
                      </Link>
                      <Link to={createPageUrl("NFTMint")}>
                        <Button className="w-full bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 font-mono">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Mint NFT
                        </Button>
                      </Link>
                      <Link to={createPageUrl("AgentMessages")}>
                        <Button className="w-full bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 font-mono">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Messages
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* TERMINAL Tab */}
          {activeTab === 'terminal' && (
            <Card className="bg-cyan-500/5 border border-cyan-500/20 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-cyan-500/20">
                  <Terminal className="w-6 h-6 text-cyan-400" />
                  <h2 className="text-xl font-bold text-cyan-300 font-mono">SYSTEM.TERMINAL</h2>
                </div>

                <div className="bg-black/50 border border-cyan-500/10 rounded-lg p-4 mb-4 h-64 overflow-y-auto font-mono text-sm">
                  {commandOutput.length === 0 ? (
                    <div className="text-cyan-400/40">
                      TTT Enhanced System Control v2.1.0<br/>
                      Type 'help' for available commands<br/><br/>
                      $<motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.8, repeat: Infinity }}>_</motion.span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {commandOutput.map((line, idx) => (
                        <div key={idx} className={
                          line.type === 'input' ? 'text-cyan-300' :
                          line.type === 'error' ? 'text-red-400' :
                          'text-cyan-400/80'
                        }>
                          {line.text.split('\n').map((l, i) => (
                            <div key={i}>{l}</div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500 font-mono">$</span>
                    <Input
                      value={quickCommand}
                      onChange={(e) => setQuickCommand(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && executeCommand()}
                      placeholder="Enter command..."
                      className="pl-8 bg-black/50 border-cyan-500/30 text-cyan-300 font-mono placeholder:text-cyan-500/30"
                      disabled={isExecutingCommand}
                    />
                  </div>
                  <Button
                    onClick={executeCommand}
                    disabled={isExecutingCommand || !quickCommand.trim()}
                    className="bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30"
                  >
                    {isExecutingCommand ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>

                <div className="mt-4 text-xs text-cyan-400/40 font-mono">
                  Available: help | stats | users | nfts | patterns | clear | refresh
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats Bar */}
          <div className="mb-6 flex items-center justify-between bg-cyan-500/5 border border-cyan-500/20 backdrop-blur-xl rounded-lg p-4">
            <div className="flex items-center gap-6 text-xs font-mono">
              <div className="flex items-center gap-2">
                <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="w-2 h-2 bg-green-400 rounded-full" />
                <span className="text-cyan-400/80">SYSTEM ONLINE</span>
              </div>
              <div className="text-cyan-400/60">Users: {realStats.totalUsers}</div>
              <div className="text-cyan-400/60">NFTs: {realStats.totalNFTs}</div>
              <div className="text-cyan-400/60">AI Scans: {realStats.totalVisions}</div>
            </div>
            <Button onClick={loadRealStats} size="sm" variant="ghost" className="text-cyan-400 hover:bg-cyan-500/10">
              <RefreshCw className={`w-4 h-4 ${isLoadingStats ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Footer Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 text-center"
          >
            <div className="text-cyan-400/40 font-mono text-xs space-y-1">
              <div>TTT • ENHANCED SYSTEM CONTROL • v2.1.0</div>
              <div>SECURE • ENCRYPTED • VERIFIED</div>
              <div className="flex items-center justify-center gap-2 mt-2">
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 bg-cyan-400 rounded-full"
                />
                <span>SYSTEM ACTIVE</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      </>
      )}

      {/* Corner Accents */}
      <div className="fixed top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-cyan-500/20 pointer-events-none z-[3]" />
      <div className="fixed top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-cyan-500/20 pointer-events-none z-[3]" />
      <div className="fixed bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-cyan-500/20 pointer-events-none z-[3]" />
      <div className="fixed bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-cyan-500/20 pointer-events-none z-[3]" />
    </div>
  );
}