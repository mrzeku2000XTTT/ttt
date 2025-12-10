import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Upload, Flame, Link as LinkIcon, X, Scissors, Heart, ArrowLeft, Play } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createPageUrl } from "@/utils";
import ProofOfBullishReels from "@/components/ProofOfBullishReels";

export default function ProofOfBullishPage() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState("");
  const [proofLink, setProofLink] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [proofs, setProofs] = useState([]);
  const [kaswareAddress, setKaswareAddress] = useState(null);
  const [showKaswareModal, setShowKaswareModal] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [showTrimModal, setShowTrimModal] = useState(false);
  const [showReels, setShowReels] = useState(false);
  const [reelStartIndex, setReelStartIndex] = useState(0);
  const videoRef = useRef(null);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const messagesEndRef = useRef(null);
  const [showZkVerification, setShowZkVerification] = useState(false);
  const [zkAmount, setZkAmount] = useState('');
  const [zkTimestamp, setZkTimestamp] = useState(null);
  const [zkVerifying, setZkVerifying] = useState(false);
  const [zkWalletBalance, setZkWalletBalance] = useState(null);
  const [user, setUser] = useState(null);
  const [isSafariIOS, setIsSafariIOS] = useState(false);

  useEffect(() => {
    // Detect Safari iOS
    const ua = navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua);
    const webkit = /WebKit/.test(ua);
    const isSafari = iOS && webkit && !/CriOS|FxiOS|OPiOS|mercury/.test(ua);
    setIsSafariIOS(isSafari);
    
    loadProofs();
    checkKasware();
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      if (currentUser?.created_wallet_address) {
        loadZkWalletBalance(currentUser.created_wallet_address);
      }
    } catch (err) {
      console.log('User not logged in');
    }
  };

  const loadZkWalletBalance = async (address) => {
    try {
      const response = await base44.functions.invoke('getKaspaBalance', { address });
      if (response.data?.balance) {
        setZkWalletBalance(response.data.balance);
      }
    } catch (err) {
      console.error('Failed to load balance:', err);
    }
  };

  useEffect(() => {
    if (proofs.length > 0) {
      checkForSharedProof();
    }
  }, [proofs]);

  const checkForSharedProof = () => {
    const fullHash = window.location.hash;
    const queryString = fullHash.includes('?') ? fullHash.split('?')[1] : window.location.search.substring(1);
    const urlParams = new URLSearchParams(queryString);
    const proofId = urlParams.get('proof');
    
    if (proofId && proofs.length > 0) {
      const videos = proofs.filter(p => p.media_type === 'video');
      const videoIndex = videos.findIndex(v => String(v.id) === String(proofId));
      
      if (videoIndex !== -1) {
        setReelStartIndex(videoIndex);
        setShowReels(true);
      }
    }
  };

  const checkKasware = async () => {
    if (typeof window.kasware !== 'undefined') {
      try {
        const accounts = await window.kasware.getAccounts();
        if (accounts.length > 0) {
          setKaswareAddress(accounts[0]);
        }
      } catch (err) {
        console.error('Kasware check failed:', err);
      }
    }
  };

  const loadProofs = async () => {
    try {
      const data = await base44.entities.ProofOfBullish.list('-created_date', 200);
      setProofs(data);
    } catch (err) {
      console.error('Failed to load proofs:', err);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      alert('File too large. Max 50MB.');
      return;
    }

    if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = Math.floor(video.duration);
        setVideoDuration(duration);
        
        if (duration > 60) {
          setShowTrimModal(true);
        }
      };
      video.src = URL.createObjectURL(file);
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || isUploading) return;
    
    if (!selectedFile.type.startsWith('image/') && !selectedFile.type.startsWith('video/')) {
      alert('Please upload an image or video file');
      return;
    }

    if (selectedFile.type.startsWith('video/') && videoDuration > 60) {
      alert('Please trim your video to 60 seconds or less');
      setShowTrimModal(true);
      return;
    }
    
    setIsUploading(true);
    try {
      const uploadResponse = await base44.integrations.Core.UploadFile({ 
        file: selectedFile 
      });
      
      if (!uploadResponse?.file_url) {
        throw new Error('Upload failed');
      }
      
      setUploadedFileUrl(uploadResponse.file_url);
      setShowKaswareModal(true);
      
    } catch (err) {
      console.error('Upload error:', err);
      alert(`Upload failed: ${err.message || 'Please try again'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const connectKasware = async () => {
    if (typeof window.kasware === 'undefined') {
      alert('Kasware wallet not detected. Please install Kasware extension.');
      return;
    }

    try {
      const accounts = await window.kasware.requestAccounts();
      if (accounts.length > 0) {
        setKaswareAddress(accounts[0]);
      }
    } catch (err) {
      console.error('Kasware connection failed:', err);
      alert('Failed to connect Kasware');
    }
  };

  const sendKASTransaction = async () => {
    if (!kaswareAddress) {
      alert('Please connect Kasware first');
      return;
    }

    try {
      const txResponse = await window.kasware.sendKaspa(kaswareAddress, 100000000); // 1 KAS
      
      // Extract transaction ID - handle all response formats
      let txid;
      if (typeof txResponse === 'string') {
        // If it's a string, try to parse it as JSON first
        try {
          const parsed = JSON.parse(txResponse);
          txid = parsed.id;
        } catch {
          // If parsing fails, it's already the transaction ID
          txid = txResponse;
        }
      } else if (txResponse && typeof txResponse === 'object') {
        // If it's an object, get the id field
        txid = txResponse.id;
      }
      
      // Validate it's a proper transaction ID (64 hex characters)
      if (!txid || !/^[a-f0-9]{64}$/i.test(txid)) {
        console.error('Invalid transaction ID format:', txid);
        alert('Failed to get valid transaction ID');
        return;
      }
      
      console.log('Transaction ID:', txid);
      setTxHash(txid);
      
      setTimeout(() => {
        handleFinalSubmit(txid);
      }, 2000);
      
    } catch (err) {
      console.error('Transaction failed:', err);
      alert('Transaction failed. Please try again.');
    }
  };

  const handleFinalSubmit = async (transactionHash) => {
    const cleanTxHash = typeof transactionHash === 'string' ? transactionHash : transactionHash?.id || '';
    
    console.log('📤 Submitting proof:', {
      hasUploadedUrl: !!uploadedFileUrl,
      hasSelectedFile: !!selectedFile,
      txHash: cleanTxHash,
      walletAddress: kaswareAddress || user?.created_wallet_address
    });

    if (!uploadedFileUrl) {
      console.error('❌ No uploaded file URL');
      alert('Error: Media file was not uploaded. Please try again.');
      return;
    }

    if (!selectedFile) {
      console.error('❌ No selected file');
      alert('Error: No file selected. Please try again.');
      return;
    }

    if (!cleanTxHash) {
      console.error('❌ No transaction hash');
      alert('Error: Transaction hash missing. Please try again.');
      return;
    }
    
    try {
      const proofData = {
        media_url: uploadedFileUrl,
        media_type: selectedFile.type.startsWith('video') ? 'video' : 'image',
        message: message || 'Bullish AF 🚀',
        proof_link: proofLink || '',
        transaction_hash: cleanTxHash,
        kasware_address: kaswareAddress || user?.created_wallet_address || 'ZK_VERIFIED',
        video_duration: videoDuration || 0
      };

      console.log('Creating proof with data:', proofData);

      await base44.entities.ProofOfBullish.create(proofData);
      
      console.log('✅ Proof created successfully');

      setSelectedFile(null);
      setMessage("");
      setProofLink("");
      setUploadedFileUrl(null);
      setTxHash(null);
      setShowKaswareModal(false);
      setShowZkVerification(false);
      setZkVerifying(false);
      
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 z-[200] bg-black border border-white/20 text-white px-4 py-3 rounded-lg shadow-lg';
      notification.textContent = 'Proof submitted successfully! 🚀';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
      
      await loadProofs();
      
    } catch (err) {
      console.error('Submit error:', err);
      console.error('Error details:', err.response?.data || err.message);
      alert(`Failed to submit proof: ${err.response?.data?.message || err.message}`);
    }
  };

  const likeProof = async (proofId, currentLikes) => {
    try {
      await base44.entities.ProofOfBullish.update(proofId, {
        likes: currentLikes + 1
      });
      loadProofs();
    } catch (err) {
      console.error('Like failed:', err);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
  };

  useEffect(() => {
    if (aiMessages.length > 0) {
      scrollToBottom();
    }
  }, [aiMessages]);

  const handleAiChat = async () => {
    if (!aiInput.trim() || aiLoading) return;

    const userMessage = aiInput.trim();
    setAiInput("");
    
    const newMessages = [...aiMessages, { role: "user", content: userMessage }];
    setAiMessages(newMessages);
    setAiLoading(true);

    try {
      // Get current KAS price
      const priceResponse = await base44.functions.invoke('getKaspaPrice');
      const kasPrice = priceResponse.data?.price || 0;

      // Build context from conversation
      const conversationContext = newMessages.map(m => 
        `${m.role === 'user' ? 'User' : 'Bull AI'}: ${m.content}`
      ).join('\n');

      // Call LLM with price data and conversation context
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are BULL AI, an enthusiastic and knowledgeable Kaspa (KAS) cryptocurrency expert and price analyst. You help users understand Kaspa's potential and predict price movements based on market data and sentiment.

Current KAS Price: $${kasPrice}

Conversation so far:
${conversationContext}

Latest user question: ${userMessage}

Instructions:
- Be bullish but realistic about Kaspa
- Provide price predictions when asked (short-term and long-term)
- Use technical analysis terminology naturally
- Reference the current price of $${kasPrice} in your analysis
- Be conversational and engaging
- Use emojis occasionally: 🚀 💎 📈 🔥 💪
- Keep responses under 150 words
- If user talks about uploading proof, encourage them to share their conviction with the community

Respond as BULL AI:`,
        add_context_from_internet: true
      });

      setAiMessages([...newMessages, { 
        role: "assistant", 
        content: response 
      }]);
    } catch (err) {
      console.error('AI chat failed:', err);
      setAiMessages([...newMessages, { 
        role: "assistant", 
        content: "Sorry, I'm having trouble connecting right now. Try again in a moment! 🔥" 
      }]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleZkVerification = async () => {
    if (!user?.created_wallet_address) {
      alert('Please connect your TTT wallet first');
      return;
    }

    if (!zkAmount || parseFloat(zkAmount) <= 0) {
      alert('Please enter a valid KAS amount');
      return;
    }

    // Record timestamp NOW - transactions must be sent AFTER this moment
    const timestamp = Date.now();
    setZkTimestamp(timestamp);
    setZkVerifying(true);

    console.log('🚀 Starting ZK verification:', {
      address: user.created_wallet_address,
      amount: zkAmount,
      timestamp: new Date(timestamp),
      message: 'User must send transaction NOW'
    });

    try {
      const targetAmount = parseFloat(zkAmount);
      let attempts = 0;
      const maxAttempts = 200; // 10 minutes (3s intervals)

      const checkTransaction = async () => {
        attempts++;
        console.log(`Attempt ${attempts}/${maxAttempts} - Checking for transaction...`);

        try {
          const response = await base44.functions.invoke('verifyKaspaSelfTransaction', {
            address: user.created_wallet_address,
            expectedAmount: targetAmount,
            timestamp: timestamp
          });

          console.log('Backend response:', response.data);

          if (response.data?.verified && response.data?.transaction) {
            console.log('✅ Transaction verified!', response.data.transaction);
            setTxHash(response.data.transaction.id);
            setZkVerifying(false);
            
            // Auto-submit proof after verification
            setTimeout(() => {
              handleFinalSubmit(response.data.transaction.id);
            }, 500);

            return true;
          }

          // Continue checking
          if (attempts < maxAttempts) {
            setTimeout(checkTransaction, 3000);
          } else {
            console.error('⏱️ Verification timeout');
            setZkVerifying(false);
            alert('Verification timeout. Transaction not detected within 10 minutes. Please ensure you sent the exact amount to your own address.');
          }
        } catch (err) {
          console.error('❌ Verification error:', err);
          
          // Retry on error
          if (attempts < maxAttempts) {
            console.log('Retrying in 3 seconds...');
            setTimeout(checkTransaction, 3000);
          } else {
            setZkVerifying(false);
            alert('Failed to verify transaction after multiple attempts. Please try again or use Kasware option.');
          }
        }
      };

      // Start checking immediately
      checkTransaction();
    } catch (err) {
      console.error('ZK verification setup error:', err);
      setZkVerifying(false);
      alert('Verification failed to start. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950/30 via-black to-blue-900/25 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Button
          onClick={() => navigate(createPageUrl('Singularity'))}
          variant="ghost"
          className="text-white/60 hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Singularity
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500/20 border border-orange-500/30 rounded-2xl mb-4">
            <Flame className="w-8 h-8 text-orange-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-2 text-white">
            Proof of Bullish
          </h1>
          <p className="text-white/50 text-lg">Show the world your conviction 🚀</p>
        </motion.div>

        {/* Upload Section - Top */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-black/60 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-4 mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <span className="text-sm font-bold text-orange-400">BULL AI</span>
          </div>

          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
            id="proof-upload"
          />

          {selectedFile ? (
            <div className="space-y-3">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{selectedFile.name}</p>
                  <p className="text-white/40 text-xs">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    {videoDuration > 0 && ` • ${videoDuration}s`}
                    {videoDuration > 60 && (
                      <span className="text-red-400 ml-2">⚠️ Trim to 60s</span>
                    )}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setSelectedFile(null);
                    setVideoDuration(0);
                  }}
                  size="sm"
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400 h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Why are you bullish? 🚀"
                className="bg-white/5 border-white/10 text-white placeholder-white/30 resize-none"
                rows={2}
              />

              <Input
                value={proofLink}
                onChange={(e) => setProofLink(e.target.value)}
                placeholder="Proof link (optional)"
                className="bg-white/5 border-white/10 text-white placeholder-white/30 text-sm"
              />

              <Button
                onClick={handleUpload}
                disabled={isUploading || (videoDuration > 60)}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white h-10 font-semibold disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Flame className="w-4 h-4 mr-2" />
                    Submit Proof
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <label htmlFor="proof-upload">
                <Button
                  type="button"
                  size="icon"
                  className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30"
                  asChild
                >
                  <div className="cursor-pointer w-10 h-10 flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                </Button>
              </label>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us why you're bullish on KAS..."
                className="flex-1 bg-white/5 border-white/10 text-white placeholder-white/30"
              />
            </div>
          )}
        </motion.div>

        {/* Bull AI Chat Section - Bottom */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-black/60 backdrop-blur-xl border border-orange-500/30 rounded-2xl overflow-hidden mb-8"
        >
          {/* Chat Messages - Fixed Height with Internal Scroll Only */}
          <div 
            className="h-64 overflow-y-auto p-4 space-y-3"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(251, 146, 60, 0.3) transparent'
            }}
          >
            {aiMessages.length === 0 ? (
              <div className="text-center text-white/40 py-6">
                <Flame className="w-10 h-10 mx-auto mb-2 text-orange-400/30" />
                <p className="text-sm">Ask me about KAS price predictions!</p>
                <p className="text-xs mt-1">Try: "What's your price target?" or "Should I buy now?"</p>
              </div>
            ) : (
              aiMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-xl px-3 py-2 ${
                      msg.role === 'user'
                        ? 'bg-orange-500 text-white'
                        : 'bg-white/5 text-white border border-white/10'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            {aiLoading && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input - Bottom */}
          <div className="p-4 border-t border-orange-500/20">
            <div className="flex items-center gap-2">
              <Input
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAiChat()}
                placeholder="Ask about KAS price predictions..."
                className="flex-1 bg-white/5 border-white/10 text-white placeholder-white/30"
                disabled={aiLoading}
              />
              <Button
                onClick={handleAiChat}
                disabled={aiLoading || !aiInput.trim()}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <TrendingUp className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Kasware Modal */}
        {showKaswareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-black/90 border border-orange-500/30 rounded-2xl p-6 max-w-md w-full"
            >
              <h3 className="text-2xl font-bold text-white mb-4">Prove Your Conviction</h3>
              <p className="text-white/60 mb-6">
                Send 1 KAS to yourself to verify this proof
              </p>

              {!kaswareAddress ? (
                <div className="space-y-3">
                  <Button
                    onClick={connectKasware}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white h-12 font-semibold"
                  >
                    Connect Kasware
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-black/90 px-2 text-white/40">or</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setShowKaswareModal(false);
                      setShowZkVerification(true);
                    }}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white h-12 font-semibold"
                  >
                    ZK
                  </Button>
                </div>
              ) : !txHash ? (
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-white/40 text-xs mb-1">Your Address</p>
                    <p className="text-white text-sm font-mono break-all">{kaswareAddress}</p>
                  </div>
                  <Button
                    onClick={sendKASTransaction}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white h-12 font-semibold"
                  >
                    Send 1 KAS
                  </Button>
                  <Button
                    onClick={() => setShowKaswareModal(false)}
                    variant="outline"
                    className="w-full border-white/10 text-white/60"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Flame className="w-8 h-8 text-green-400" />
                  </div>
                  <p className="text-green-400 font-semibold mb-2">Transaction Confirmed!</p>
                  <p className="text-white/40 text-sm mb-4">Submitting your proof...</p>
                  <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto" />
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-400" />
              Community Proofs
            </h2>
            
            {proofs.filter(p => p.media_type === 'video').length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🎬 Bull Reels button clicked!');
                  const videos = proofs.filter(p => p.media_type === 'video');
                  console.log('📹 Found videos:', videos.length);
                  setReelStartIndex(0);
                  setShowReels(true);
                  console.log('✅ Set showReels to true');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg font-medium cursor-pointer active:scale-95 transition-transform"
              >
                <Play className="w-4 h-4" />
                Bull Reels
              </button>
            )}
          </div>

          {proofs.map((proof, index) => (
            <Card key={proof.id} className="bg-black/40 backdrop-blur-xl border-white/10 overflow-hidden">
              <CardContent className="p-0">
                {proof.media_type === 'video' ? (
                  <div 
                    className="relative cursor-pointer group active:scale-95 transition-transform"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const videoIndex = proofs.filter(p => p.media_type === 'video').findIndex(p => p.id === proof.id);
                      setReelStartIndex(videoIndex);
                      setShowReels(true);
                    }}
                  >
                    <video
                      src={proof.media_url}
                      className="w-full max-h-[500px] object-contain bg-black pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Play className="w-8 h-8 text-white ml-1" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={proof.media_url}
                    alt="Proof"
                    className="w-full max-h-[500px] object-contain bg-black"
                  />
                )}
                
                <div className="p-4">
                  <p className="text-white mb-2">{proof.message}</p>
                  
                  {proof.proof_link && (
                    <a
                      href={proof.proof_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 text-sm hover:underline flex items-center gap-1 mb-2"
                    >
                      <LinkIcon className="w-3 h-3" />
                      Proof Link
                    </a>
                  )}
                  
                  {proof.transaction_hash && (
                    <a
                      href={`https://kas.fyi/transaction/${proof.transaction_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 text-sm hover:underline flex items-center gap-1 mb-2 font-mono"
                    >
                      <TrendingUp className="w-3 h-3" />
                      kas.fyi/transaction/{proof.transaction_hash.substring(0, 8)}...
                    </a>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <p className="text-white/40 text-xs">
                      {new Date(proof.created_date).toLocaleDateString()}
                    </p>
                    
                    {proof.media_type === 'video' && (
                      <button
                        onClick={() => {
                          const shareUrl = `${window.location.origin}${createPageUrl('ProofOfBullish')}?proof=${proof.id}`;
                          navigator.clipboard.writeText(shareUrl);
                          const notification = document.createElement('div');
                          notification.className = 'fixed top-4 right-4 z-[200] bg-black border border-white/20 text-white px-4 py-3 rounded-lg shadow-lg';
                          notification.textContent = '🔗 Link copied to clipboard!';
                          document.body.appendChild(notification);
                          setTimeout(() => notification.remove(), 2000);
                        }}
                        className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        <LinkIcon className="w-4 h-4" />
                        <span className="text-xs">Share</span>
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ZK Verification Modal */}
        {showZkVerification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-black/90 border border-cyan-500/30 rounded-2xl p-6 max-w-md w-full"
            >
              <h3 className="text-2xl font-bold text-white mb-2">ZK Verification</h3>
              <p className="text-white/60 text-sm mb-6">
                Send KAS to yourself in Kaspium to verify this proof
              </p>

              {!zkVerifying ? (
                <div className="space-y-4">
                  {/* Current Balance */}
                  {zkWalletBalance !== null && (
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <p className="text-white/40 text-xs mb-1">Current Balance</p>
                      <p className="text-white text-lg font-bold">{zkWalletBalance.toFixed(2)} KAS</p>
                    </div>
                  )}

                  {/* Wallet Address */}
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-white/40 text-xs mb-1">Your TTT Wallet Address</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-white text-sm font-mono break-all">
                        {user?.created_wallet_address?.substring(0, 12)}...{user?.created_wallet_address?.slice(-8)}
                      </p>
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(user?.created_wallet_address || '');
                          const notification = document.createElement('div');
                          notification.className = 'fixed top-4 right-4 z-[200] bg-black border border-white/20 text-white px-4 py-3 rounded-lg shadow-lg';
                          notification.textContent = '✓ Address copied';
                          document.body.appendChild(notification);
                          setTimeout(() => notification.remove(), 2000);
                        }}
                        size="sm"
                        className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-xs h-7"
                      >
                        Copy
                      </Button>
                    </div>
                  </div>

                  {/* Amount Input */}
                  <div>
                    <label className="text-white/60 text-sm mb-2 block">
                      How much KAS will you send yourself?
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={zkAmount}
                      onChange={(e) => setZkAmount(e.target.value)}
                      placeholder="1.00"
                      className="bg-white/5 border-white/10 text-white placeholder-white/30"
                    />
                  </div>

                  {/* Instructions */}
                  <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3">
                    <p className="text-cyan-400 text-xs font-semibold mb-2">Instructions:</p>
                    <ol className="text-white/60 text-xs space-y-1 list-decimal list-inside">
                      <li>Copy your wallet address above</li>
                      <li>Enter the amount you'll send</li>
                      <li>Click "Start Verification"</li>
                      <li>Open Kaspium and send that amount to your own address</li>
                      <li>Wait for automatic verification</li>
                    </ol>
                  </div>

                  <Button
                    onClick={handleZkVerification}
                    disabled={!zkAmount || parseFloat(zkAmount) <= 0}
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-white h-12 font-semibold disabled:opacity-50"
                  >
                    Start Verification
                  </Button>

                  <Button
                    onClick={() => {
                      setShowZkVerification(false);
                      setZkAmount('');
                    }}
                    variant="outline"
                    className="w-full border-white/10 text-white/60"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-cyan-400 font-semibold mb-2">Waiting for Transaction...</p>
                  <p className="text-white/60 text-sm mb-4">
                    Send {zkAmount} KAS to yourself in Kaspium
                  </p>
                  <div className="bg-white/5 rounded-lg p-3 mb-4">
                    <p className="text-white/40 text-xs mb-1">Your Address</p>
                    <p className="text-white text-xs font-mono break-all">
                      {user?.created_wallet_address}
                    </p>
                  </div>
                  <p className="text-white/40 text-xs">
                    Verification will happen automatically when the transaction is detected
                  </p>
                  <Button
                    onClick={() => {
                      setZkVerifying(false);
                      setShowZkVerification(false);
                      setZkAmount('');
                    }}
                    variant="outline"
                    className="w-full border-white/10 text-white/60 mt-4"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Reels Viewer */}
        {showReels && (
          <ProofOfBullishReels
            videos={proofs.filter(p => p.media_type === 'video')}
            initialIndex={reelStartIndex}
            onClose={() => setShowReels(false)}
          />
        )}
      </div>
    </div>
  );
}