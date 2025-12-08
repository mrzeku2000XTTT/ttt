import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, Loader2, User as UserIcon, AlertTriangle, Copy, Sparkles, Shield, CheckCircle, Lock, LockOpen, X, Eye, EyeOff, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function Area51Page() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [messageToPublish, setMessageToPublish] = useState(null);
  const [publishingMessageId, setPublishingMessageId] = useState(null);
  const [kaswareWallet, setKaswareWallet] = useState({ connected: false, address: null });
  const [showZkVerification, setShowZkVerification] = useState(false);
  const [zkAmount, setZkAmount] = useState('1');
  const [zkTimestamp, setZkTimestamp] = useState(null);
  const [zkVerifying, setZkVerifying] = useState(false);
  const [zkWalletBalance, setZkWalletBalance] = useState(null);
  const [selectedZkWallet, setSelectedZkWallet] = useState('ttt');
  const [showAgentX, setShowAgentX] = useState(true);
  const [agentXToToggle, setAgentXToToggle] = useState(null);
  const [showAgentXModal, setShowAgentXModal] = useState(false);
  const [sharingMessageId, setSharingMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const lastProcessedMessageRef = useRef(null);
  const isProcessingRef = useRef(false);
  const aiResponseMapRef = useRef(new Map());

  useEffect(() => {
    if (showPaymentModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [showPaymentModal]);

  useEffect(() => {
    loadUser();
    loadMessages();
    checkIfCheckedIn();
    checkKasware();
    loadZkWalletBalance();
    const interval = setInterval(loadMessages, 2000); // Faster polling
    return () => clearInterval(interval);
  }, []);

  const checkKasware = async () => {
    if (typeof window.kasware !== 'undefined') {
      try {
        const accounts = await window.kasware.getAccounts();
        if (accounts.length > 0) {
          setKaswareWallet({ connected: true, address: accounts[0] });
        }
      } catch (err) {
        console.log('Kasware not connected');
      }
    }
  };

  const loadZkWalletBalance = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser?.created_wallet_address) {
        const response = await base44.functions.invoke('getKaspaBalance', { address: currentUser.created_wallet_address });
        if (response.data?.balance) {
          setZkWalletBalance(response.data.balance);
        }
      }
    } catch (err) {
      console.error('Failed to load balance:', err);
    }
  };

  const checkIfCheckedIn = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser?.email) {
        const today = new Date().toISOString().split('T')[0];
        const checkIns = await base44.entities.Area51CheckIn.filter({
          user_email: currentUser.email
        });
        const todayCheckIn = checkIns.find(c => c.created_date?.startsWith(today));
        setHasCheckedIn(!!todayCheckIn);
      }
    } catch (err) {
      console.log("Not checking in status");
    }
  };

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive or AI is thinking
    const shouldScroll = aiThinking || sending || messages.length > 0;
    if (shouldScroll) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages.length, aiThinking, sending]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      console.log('✅ Area51 User loaded:', currentUser?.email);
    } catch (error) {
      console.log("❌ Guest user - not logged in");
      setUser(null);
    }
  };

  const loadMessages = async () => {
    try {
      let currentUser = null;
      try {
        currentUser = await base44.auth.me();
      } catch (err) {
        console.log('User not logged in');
      }

      const allMsgs = await base44.entities.Area51Message.list("-created_date", 50);
      
      // Filter: show public messages OR user's own messages OR system messages
      const visibleMessages = allMsgs.filter(msg => {
        // Always show public messages
        if (msg.is_public === true) return true;
        
        // Always show system messages
        if (msg.message_type === 'system') return true;
        
        // Show user's own messages (both text and AI responses)
        if (currentUser && msg.sender_email === currentUser.email) return true;
        
        return false;
      });
      
      console.log(`📊 Loaded ${allMsgs.length} total messages, showing ${visibleMessages.length} to ${currentUser?.email || 'guest'}`);
      
      setMessages(visibleMessages.reverse());
      
      // Check EACH public message to see if it needs AI response (only for messages without responses)
      const publicMessages = allMsgs.filter(msg => msg.is_public && msg.message_type === 'text');
      
      for (const publicMsg of publicMessages) {
        // Skip if we've already tracked this message
        if (aiResponseMapRef.current.has(publicMsg.id)) {
          continue;
        }
        
        // Check if AI response already exists for THIS specific message (check ALL AI messages from same user, not just nearby ones)
        const existingAIResponse = allMsgs.find(msg => 
          msg.message_type === 'ai' && 
          msg.sender_email === publicMsg.sender_email &&
          new Date(msg.created_date).getTime() > new Date(publicMsg.created_date).getTime()
        );
        
        if (existingAIResponse) {
          // Mark as handled - response already exists (public or private)
          aiResponseMapRef.current.set(publicMsg.id, existingAIResponse.id);
          console.log(`✅ Skipping message ${publicMsg.id} - AI response already exists (${existingAIResponse.is_public ? 'public' : 'private'})`);
        } else if (!isProcessingRef.current && !aiThinking) {
          // Only process the LATEST unresponded message
          console.log(`🤖 Triggering AI for message ${publicMsg.id} - no response found`);
          isProcessingRef.current = true;
          aiResponseMapRef.current.set(publicMsg.id, 'processing');
          setTimeout(() => triggerAI(publicMsg.message, publicMsg.id, publicMsg.sender_email), 500); // Faster trigger
          break; // Only process one at a time
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Failed to load messages:", error);
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCheckIn = async () => {
    let checkInUser = user;
    let checkInWallet = "";

    if (!user && !kaswareWallet.connected) {
      toast.error("Please connect Kasware wallet to check in");
      return;
    }

    if (!user && kaswareWallet.connected) {
      checkInUser = {
        email: `${kaswareWallet.address}@wallet`,
        username: `${kaswareWallet.address.slice(0, 6)}...${kaswareWallet.address.slice(-4)}`
      };
      checkInWallet = kaswareWallet.address;
    } else if (user) {
      checkInWallet = user.created_wallet_address || "";
    }

    setCheckingIn(true);
    setHasCheckedIn(true); // Update UI immediately
    
    try {
      const message = `Area 51 Check-In: ${new Date().toISOString()}`;
      let signature = `manual_${Date.now()}`;
      let deviceType = "manual";

      // Try Kasware (non-blocking)
      if (window.kasware) {
        try {
          const accounts = await Promise.race([
            window.kasware.requestAccounts(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
          ]);
          signature = await Promise.race([
            window.kasware.signMessage(message),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
          ]);
          deviceType = "kasware";
        } catch (kasErr) {
          console.log("Kasware not available");
        }
      }

      // Fallback to biometric for iOS/mobile (non-blocking)
      if (deviceType === "manual" && window.PublicKeyCredential) {
        try {
          const available = await Promise.race([
            window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1000))
          ]);
          if (available) {
            deviceType = "ios_faceid";
            signature = `biometric_${Date.now()}`;
          }
        } catch (bioErr) {
          console.log("Biometric not available");
        }
      }

      // Create both records in parallel
      await Promise.all([
        base44.entities.Area51CheckIn.create({
          user_email: checkInUser.email,
          username: checkInUser.username || checkInUser.email?.split('@')[0],
          wallet_address: checkInWallet,
          signature: signature,
          check_in_message: message,
          device_type: deviceType
        }),
        base44.entities.Area51Message.create({
          message: `🛸 ${checkInUser.username || checkInUser.email?.split('@')[0]} has checked into Area 51`,
          sender_username: "SYSTEM",
          sender_email: "system@area51",
          message_type: "system",
          is_ai: false,
          is_public: true
        })
      ]);

      toast.success("Checked in successfully!");
      setTimeout(loadMessages, 500);
    } catch (error) {
      console.error("Check-in failed:", error);
      setHasCheckedIn(false); // Revert on error
      toast.error("Check-in failed");
    } finally {
      setCheckingIn(false);
    }
  };

  const triggerAI = async (userMessage, messageId, triggeringUserEmail) => {
    setAiThinking(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are AGENT X - a conspiracy theory expert at AREA51. Someone just said: "${userMessage}". 
        
Respond with ONE SHORT conspiracy theory paragraph (max 80 words). Be creative and fun.
Topics: aliens, government secrets, shadow organizations, hidden technology.`,
        add_context_from_internet: false
      });

      const aiMsg = await base44.entities.Area51Message.create({
        message: response,
        sender_username: "AGENT X",
        sender_email: triggeringUserEmail,
        message_type: "ai",
        is_ai: true,
        is_public: false
      });
      
      // Mark as completed in our map
      aiResponseMapRef.current.set(messageId, aiMsg.id);

      loadMessages();
    } catch (error) {
      console.error("AI failed:", error);
      aiResponseMapRef.current.delete(messageId);
    } finally {
      setAiThinking(false);
      isProcessingRef.current = false;
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    const messageContent = newMessage.trim();

    // Determine sender info (works with or without login)
    let senderUsername = "Anonymous";
    let senderEmail = "guest@area51";
    let senderWallet = "";

    if (user) {
      senderUsername = user.username || user.email?.split('@')[0] || "Anonymous";
      senderEmail = user.email;
      senderWallet = user.created_wallet_address || "";
    } else if (kaswareWallet.connected) {
      senderUsername = `${kaswareWallet.address.slice(0, 6)}...${kaswareWallet.address.slice(-4)}`;
      senderWallet = kaswareWallet.address;
      senderEmail = `${kaswareWallet.address}@wallet`;
    } else {
      toast.error('Please connect Kasware wallet to post');
      return;
    }

    setSending(true);

    // Optimistic update - show message immediately
    const tempMessage = {
      id: `temp-${Date.now()}`,
      message: messageContent,
      sender_username: senderUsername,
      sender_email: senderEmail,
      sender_wallet: senderWallet,
      message_type: "text",
      is_ai: false,
      is_public: false,
      created_date: new Date().toISOString()
    };

    setMessages([...messages, tempMessage]);
    setNewMessage("");
    scrollToBottom();

    try {
      const newMsg = await base44.entities.Area51Message.create({
        message: messageContent,
        sender_username: senderUsername,
        sender_email: senderEmail,
        sender_wallet: senderWallet,
        message_type: "text",
        is_ai: false,
        is_public: false
      });

      // Replace temp message with real one
      setMessages(prev => prev.map(m => m.id === tempMessage.id ? newMsg : m));
      toast.success('Message sent! (Private - unlock to publish)');
    } catch (error) {
      console.error("❌ Failed to send message:", error);
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      toast.error('Failed to send message: ' + (error.message || 'Unknown error'));
    } finally {
      setSending(false);
    }
  };

  const handleUnlockMessage = (message) => {
    setMessageToPublish(message);
    setShowPaymentModal(true);
  };

  const handleSelfPayment = async () => {
    if (!kaswareWallet.connected) {
      toast.error('Please connect Kasware wallet');
      return;
    }

    setPublishingMessageId(messageToPublish.id);

    try {
      const amountSompi = 100000000; // 1 KAS
      const txId = await window.kasware.sendKaspa(kaswareWallet.address, amountSompi);

      await base44.entities.Area51Message.update(messageToPublish.id, {
        is_public: true,
        made_public_at: new Date().toISOString(),
        self_pay_tx_hash: txId
      });

      setShowPaymentModal(false);
      setMessageToPublish(null);
      
      // Reload messages
      await loadMessages();

      toast.success('✅ Message published to all users!');
    } catch (err) {
      console.error('Failed to publish message:', err);
      toast.error('Failed to publish: ' + err.message);
    } finally {
      setPublishingMessageId(null);
    }
  };

  const handleToggleAgentXVisibility = (msg, makePublic) => {
    setAgentXToToggle({ message: msg, makePublic });
    setShowAgentXModal(true);
  };

  const handleAgentXPayment = async () => {
    if (!kaswareWallet.connected) {
      toast.error('Please connect Kasware wallet');
      return;
    }

    try {
      const amountSompi = 100000000; // 1 KAS
      const txId = await window.kasware.sendKaspa(kaswareWallet.address, amountSompi);

      // Update Agent X message
      await base44.entities.Area51Message.update(agentXToToggle.message.id, {
        is_public: agentXToToggle.makePublic,
        made_public_at: agentXToToggle.makePublic ? new Date().toISOString() : null
      });

      // If making public, also make the user's original message public
      if (agentXToToggle.makePublic) {
        const allMsgs = await base44.entities.Area51Message.list("-created_date", 100);
        const userMsg = allMsgs.find(m => 
          m.sender_email === agentXToToggle.message.sender_email &&
          m.message_type === 'text' &&
          new Date(m.created_date).getTime() < new Date(agentXToToggle.message.created_date).getTime()
        );
        if (userMsg && !userMsg.is_public) {
          await base44.entities.Area51Message.update(userMsg.id, {
            is_public: true,
            made_public_at: new Date().toISOString()
          });
        }
      }

      setShowAgentXModal(false);
      setAgentXToToggle(null);
      await loadMessages();

      toast.success(agentXToToggle.makePublic ? '✅ Agent X message is now public!' : '✅ Agent X message is now private!');
    } catch (err) {
      console.error('Failed to toggle visibility:', err);
      toast.error('Failed: ' + err.message);
    }
  };

  const handleShareToDAGFeed = async (msg) => {
    if (!user) {
      toast.error('Please login first');
      return;
    }

    if (sharingMessageId) {
      toast.error('Already sharing a message');
      return;
    }

    setSharingMessageId(msg.id);
    toast.success('🎨 Generating viral post...');
    
    try {
      // Generate viral post content and image
      const response = await base44.functions.invoke('generateViralPost', {
        message: msg.message
      });

      if (!response.data) {
        throw new Error('Failed to generate post');
      }

      const { caption, image_url } = response.data;

      // Store generated content in localStorage for DAG Feed to pick up
      localStorage.setItem('dagfeed_draft', JSON.stringify({
        content: caption,
        image_url: image_url,
        from: 'area51'
      }));

      // Redirect immediately to DAG Feed
      window.location.href = createPageUrl('DAGFeed');

    } catch (err) {
      console.error('Failed to generate:', err);
      toast.error('Failed to generate post');
      setSharingMessageId(null);
    }
  };

  const handleZkVerification = async () => {
    const verifyAddress = selectedZkWallet === 'ttt' ? user?.created_wallet_address : kaswareWallet.address;
    
    if (!verifyAddress) {
      toast.error(selectedZkWallet === 'ttt' ? 'Please login first' : 'Please connect Kasware');
      return;
    }

    const timestamp = Date.now();
    setZkTimestamp(timestamp);
    setZkVerifying(true);

    try {
      const targetAmount = parseFloat(zkAmount);
      let attempts = 0;
      const maxAttempts = 200;

      const checkTransaction = async () => {
        attempts++;
        console.log(`Attempt ${attempts}/${maxAttempts} - Checking for transaction...`);

        try {
          const response = await base44.functions.invoke('verifyKaspaSelfTransaction', {
            address: verifyAddress,
            expectedAmount: targetAmount,
            timestamp: timestamp
          });

          if (response.data?.verified && response.data?.transaction) {
            console.log('✅ Transaction verified!', response.data.transaction);
            setZkVerifying(false);
            setShowZkVerification(false);

            // Check if we're updating Agent X visibility or regular message
            if (agentXToToggle) {
              await base44.entities.Area51Message.update(agentXToToggle.message.id, {
                is_public: agentXToToggle.makePublic,
                made_public_at: agentXToToggle.makePublic ? new Date().toISOString() : null
              });

              // If making public, also make the user's original message public
              if (agentXToToggle.makePublic) {
                const allMsgs = await base44.entities.Area51Message.list("-created_date", 100);
                const userMsg = allMsgs.find(m => 
                  m.sender_email === agentXToToggle.message.sender_email &&
                  m.message_type === 'text' &&
                  new Date(m.created_date).getTime() < new Date(agentXToToggle.message.created_date).getTime()
                );
                if (userMsg && !userMsg.is_public) {
                  await base44.entities.Area51Message.update(userMsg.id, {
                    is_public: true,
                    made_public_at: new Date().toISOString()
                  });
                }
              }

              setShowAgentXModal(false);
              setAgentXToToggle(null);
              toast.success(agentXToToggle.makePublic ? '✅ Agent X message is now public!' : '✅ Agent X message is now private!');
            } else {
              // Update the message to be public
              await base44.entities.Area51Message.update(messageToPublish.id, {
                is_public: true,
                made_public_at: new Date().toISOString(),
                self_pay_tx_hash: response.data.transaction.id
              });
              setShowPaymentModal(false);
              setMessageToPublish(null);
              toast.success('✅ Message published to all users!');
            }

            // Reload messages
            await loadMessages();
            return true;
          }

          if (attempts < maxAttempts) {
            setTimeout(checkTransaction, 3000);
          } else {
            setZkVerifying(false);
            toast.error('Verification timeout. Transaction not detected within 10 minutes.');
          }
        } catch (err) {
          console.error('❌ Verification error:', err);
          if (attempts < maxAttempts) {
            setTimeout(checkTransaction, 3000);
          } else {
            setZkVerifying(false);
            toast.error('Failed to verify transaction. Please try again or use Kasware option.');
          }
        }
      };

      checkTransaction();
    } catch (err) {
      console.error('ZK verification setup error:', err);
      setZkVerifying(false);
      toast.error('Verification failed to start. Please try again.');
    }
  };

  return (
    <div className="fixed left-0 right-0 bottom-0 bg-black flex flex-col overflow-hidden" style={{ top: 'var(--sat, 0px)' }}>
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-black to-cyan-900/20" />
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.15) 0%, transparent 50%)`
          }}
        />
        {/* Static Orbs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px]" />
      </div>

      {/* Header - Fixed */}
      <div className="flex-none bg-black/60 backdrop-blur-xl border-b border-green-500/20 p-4 flex items-center justify-between gap-4 z-20">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl("Gate")}>
            <Button variant="ghost" size="icon" className="text-white/60 hover:text-green-400 hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400">
              AREA 51
            </h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p className="text-[10px] font-medium text-white/60 uppercase tracking-widest">Classified Chat Network</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showAgentX && aiThinking && (
            <div className="flex items-center gap-2 text-green-400 text-xs animate-pulse">
              <Sparkles className="w-3 h-3" />
              <span className="hidden sm:inline">AGENT X typing...</span>
            </div>
          )}
          <Button
            onClick={() => setShowAgentX(!showAgentX)}
            size="sm"
            variant="ghost"
            className="text-white/60 hover:text-green-400"
            title={showAgentX ? "Hide Agent X" : "Show Agent X"}
          >
            <Sparkles className={`w-4 h-4 ${showAgentX ? 'text-green-400' : 'text-white/40'}`} />
          </Button>
          <Button
            onClick={handleCheckIn}
            disabled={checkingIn || hasCheckedIn}
            size="sm"
            className={`${
              hasCheckedIn 
                ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                : "bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 text-black"
            } shadow-lg transition-all`}
            title={hasCheckedIn ? 'Already checked in today' : 'Check in to Area 51'}
          >
            {checkingIn ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : hasCheckedIn ? (
              <>
                <CheckCircle className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Checked In</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Check In</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Chat Area - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide z-10 relative">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-full gap-4">
            <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            <p className="text-white/40 text-sm animate-pulse">Decrypting classified channel...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/40 gap-4">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
              <AlertTriangle className="w-10 h-10 text-green-500/50" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white/80">No transmissions yet</p>
              <p className="text-sm text-white/40">Share your theories. The truth is out there.</p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full flex flex-col gap-4 pb-4">
            {messages.map((msg) => {
              const isMe = user && msg.sender_email === user.email;
              const isAI = msg.is_ai === true;
              const isSystem = msg.message_type === 'system';
              
              // Hide Agent X messages if toggle is off
              if (isAI && !showAgentX) return null;
              
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"} group`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
                    isAI
                      ? "bg-green-500/30 border-green-400/50 shadow-lg shadow-green-500/20"
                      : isMe 
                      ? "bg-cyan-500/20 border-cyan-500/30" 
                      : "bg-white/10 border-white/10"
                  }`}>
                    {isAI ? (
                      <Sparkles className="w-4 h-4 text-green-400" />
                    ) : (
                      <UserIcon className={`w-4 h-4 ${isMe ? "text-cyan-400" : "text-white/60"}`} />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[85%] sm:max-w-[70%]`}>
                    <div className="flex items-center gap-2 mb-1 px-1 flex-wrap">
                      <span className={`text-xs font-bold ${
                        isAI ? "text-green-400" : isMe ? "text-cyan-400" : "text-white/70"
                      }`}>
                        {msg.sender_username}
                      </span>
                      {isAI && (
                        <>
                          <span className="text-[9px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded border border-green-500/30">
                            AI AGENT
                          </span>
                          {!msg.is_public && isMe && (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] px-1.5 py-0">
                              <Lock className="w-2.5 h-2.5 mr-1" />
                              PRIVATE
                            </Badge>
                          )}
                          {msg.is_public && (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] px-1.5 py-0">
                              <LockOpen className="w-2.5 h-2.5 mr-1" />
                              PUBLIC
                            </Badge>
                          )}
                        </>
                      )}
                      {!msg.is_public && isMe && !isAI && !isSystem && (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] px-1.5 py-0">
                          <Lock className="w-2.5 h-2.5 mr-1" />
                          PRIVATE
                        </Badge>
                      )}
                      {msg.is_public && !isAI && !isSystem && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] px-1.5 py-0">
                          <LockOpen className="w-2.5 h-2.5 mr-1" />
                          PUBLIC
                        </Badge>
                      )}
                      {msg.sender_wallet && !isAI && (
                        <div className="flex items-center gap-1 bg-white/5 rounded px-1.5 py-0.5 border border-white/5">
                          <span className="text-[10px] font-mono text-white/40">
                            {msg.sender_wallet.substring(0, 4)}...{msg.sender_wallet.substring(msg.sender_wallet.length - 4)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(msg.sender_wallet);
                            }}
                            className="text-white/20 hover:text-green-400 transition-colors"
                            title="Copy Address"
                          >
                            <Copy className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                      <span className="text-[10px] text-white/30">
                        {moment(msg.created_date).utc().format('HH:mm')} UTC
                      </span>
                    </div>
                    
                    <div className="flex items-start gap-2 w-full">
                      <div className={`flex-1 px-4 py-2.5 rounded-2xl backdrop-blur-sm ${
                        isAI
                          ? "bg-gradient-to-br from-green-600/30 to-cyan-600/30 border border-green-500/30 text-white shadow-lg shadow-green-900/20 rounded-tl-none"
                          : isMe 
                          ? "bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-900/20 rounded-tr-none" 
                          : "bg-white/10 border border-white/10 text-white/90 rounded-tl-none hover:bg-white/15 transition-colors"
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
                      </div>
                      {!msg.is_public && isMe && !isAI && !isSystem && (
                        <Button
                          onClick={() => handleUnlockMessage(msg)}
                          disabled={publishingMessageId === msg.id}
                          variant="ghost"
                          size="sm"
                          className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 h-7 px-2 text-xs mt-1"
                        >
                          {publishingMessageId === msg.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <Lock className="w-3 h-3 mr-1" />
                              Unlock
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    
                    {isAI && isMe && (
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => handleToggleAgentXVisibility(msg, !msg.is_public)}
                          className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors text-xs"
                        >
                          {msg.is_public ? (
                            <>
                              <EyeOff className="w-3 h-3 text-white/60" />
                              <span className="text-white/60">Make Private</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3 text-yellow-400" />
                              <span className="text-yellow-400">Unlock</span>
                            </>
                          )}
                        </button>
                        {msg.is_public && (
                          <button
                            onClick={() => handleShareToDAGFeed(msg)}
                            disabled={sharingMessageId === msg.id}
                            className="flex items-center gap-1 px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 rounded border border-cyan-500/30 transition-colors text-xs disabled:opacity-50"
                          >
                            {sharingMessageId === msg.id ? (
                              <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
                            ) : (
                              <>
                                <Share2 className="w-3 h-3 text-cyan-400" />
                                <span className="text-cyan-400">Share to Feed</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - Fixed */}
      <div className="flex-none p-4 bg-black/80 backdrop-blur-xl border-t border-green-500/20 z-20">
        <div className="max-w-4xl mx-auto w-full">
          <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
            <div className="relative flex-1">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Share your conspiracy theories..."
                className="bg-white/5 border-green-500/20 text-white placeholder:text-white/30 focus:border-green-500/50 min-h-[44px] py-2 pr-10 rounded-xl"
                disabled={sending || aiThinking}
                autoComplete="off"
              />
            </div>
            <Button 
              type="submit" 
              disabled={!newMessage.trim() || sending || aiThinking}
              className={`h-11 w-11 rounded-xl bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 text-black shadow-lg shadow-green-900/20 transition-all ${
                sending ? 'opacity-80' : 'hover:scale-105'
              }`}
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </form>
          {!user && !kaswareWallet.connected && (
            <div className="mt-3 text-center">
              <Button 
                onClick={connectKasware}
                size="sm"
                variant="outline"
                className="text-xs text-white/60 hover:text-white border-white/20"
              >
                Connect Kasware to Post
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && messageToPublish && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowPaymentModal(false);
              setMessageToPublish(null);
            }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black border border-white/20 rounded-xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg flex items-center justify-center">
                    <Lock className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Publish Message</h3>
                    <p className="text-white/60 text-sm">Pay 1 KAS to unlock</p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setMessageToPublish(null);
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="text-xs text-white/60 mb-1">Your Wallet</div>
                  <div className="text-white font-mono text-sm break-all">
                    {kaswareWallet.address}
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-white/80">
                      <p className="mb-2">You will pay <span className="font-bold text-yellow-400">1 KAS</span> to yourself.</p>
                      <p className="text-white/60">This unlocks your message for all users to see.</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSelfPayment}
                  disabled={publishingMessageId === messageToPublish.id}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 h-12 text-black font-bold"
                >
                  {publishingMessageId === messageToPublish.id ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5 mr-2" />
                      Pay 1 KAS & Publish
                    </>
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-black px-2 text-white/40">or</span>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setShowZkVerification(true);
                  }}
                  className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400 h-12 font-semibold"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  ZK (iOS)
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Agent X Visibility Modal */}
      <AnimatePresence>
        {showAgentXModal && agentXToToggle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowAgentXModal(false);
              setAgentXToToggle(null);
            }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black border border-white/20 rounded-xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500/20 to-cyan-500/20 border border-green-500/30 rounded-lg flex items-center justify-center">
                    {agentXToToggle.makePublic ? <Eye className="w-5 h-5 text-green-400" /> : <EyeOff className="w-5 h-5 text-white/60" />}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">
                      {agentXToToggle.makePublic ? 'Make Public' : 'Make Private'}
                    </h3>
                    <p className="text-white/60 text-sm">Pay 1 KAS to toggle visibility</p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setShowAgentXModal(false);
                    setAgentXToToggle(null);
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="text-xs text-white/60 mb-1">Your Wallet</div>
                  <div className="text-white font-mono text-sm break-all">
                    {kaswareWallet.address}
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-white/80">
                      <p className="mb-2">You will pay <span className="font-bold text-yellow-400">1 KAS</span> to yourself.</p>
                      <p className="text-white/60">
                        {agentXToToggle.makePublic 
                          ? 'This makes the Agent X response visible to everyone.' 
                          : 'This makes the Agent X response private (only you can see it).'}
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleAgentXPayment}
                  className="w-full bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 h-12 text-black font-bold"
                >
                  {agentXToToggle.makePublic ? <Eye className="w-5 h-5 mr-2" /> : <EyeOff className="w-5 h-5 mr-2" />}
                  Pay 1 KAS & {agentXToToggle.makePublic ? 'Make Public' : 'Make Private'}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-black px-2 text-white/40">or</span>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setShowAgentXModal(false);
                    setShowZkVerification(true);
                  }}
                  className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400 h-12 font-semibold"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  ZK (iOS)
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ZK Verification Modal */}
      <AnimatePresence>
        {showZkVerification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!zkVerifying) {
                setShowZkVerification(false);
                setZkAmount('1');
              }
            }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black border border-cyan-500/30 rounded-xl w-full max-w-md p-6"
            >
              <h3 className="text-2xl font-bold text-white mb-2">ZK Verification</h3>
              <p className="text-white/60 text-sm mb-6">
                Send KAS to yourself to verify this message
              </p>

              {!zkVerifying ? (
                <div className="space-y-4">
                  {zkWalletBalance !== null && selectedZkWallet === 'ttt' && (
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <p className="text-white/40 text-xs mb-1">Current Balance</p>
                      <p className="text-white text-lg font-bold">{zkWalletBalance.toFixed(2)} KAS</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-white/60 text-sm">Select wallet to send from:</p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setSelectedZkWallet('ttt')}
                        className={`flex-1 h-auto py-3 ${selectedZkWallet === 'ttt' ? 'bg-cyan-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                      >
                        <div className="text-left">
                          <p className="text-xs font-semibold mb-1">TTT Wallet</p>
                          <p className="text-[10px] font-mono opacity-70">
                            {user?.created_wallet_address?.substring(0, 10)}...
                          </p>
                        </div>
                      </Button>
                      <Button
                        onClick={() => setSelectedZkWallet('kasware')}
                        className={`flex-1 h-auto py-3 ${selectedZkWallet === 'kasware' ? 'bg-cyan-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                      >
                        <div className="text-left">
                          <p className="text-xs font-semibold mb-1">Kasware L1</p>
                          <p className="text-[10px] font-mono opacity-70">
                            {kaswareWallet.address?.substring(0, 10)}...
                          </p>
                        </div>
                      </Button>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-white/40 text-xs mb-1">Selected Address</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-white text-sm font-mono break-all">
                        {selectedZkWallet === 'ttt' 
                          ? `${user?.created_wallet_address?.substring(0, 12)}...${user?.created_wallet_address?.slice(-8)}`
                          : `${kaswareWallet.address?.substring(0, 12)}...${kaswareWallet.address?.slice(-8)}`
                        }
                      </p>
                      <Button
                        onClick={() => {
                          const address = selectedZkWallet === 'ttt' ? user?.created_wallet_address : kaswareWallet.address;
                          navigator.clipboard.writeText(address || '');
                          toast.success('✓ Address copied');
                        }}
                        size="sm"
                        className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-xs h-7"
                      >
                        Copy
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-white/60 text-sm mb-2 block">
                      Amount to send yourself (KAS)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={zkAmount}
                      onChange={(e) => setZkAmount(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white"
                    />
                  </div>

                  <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3">
                    <p className="text-cyan-400 text-xs font-semibold mb-2">Instructions:</p>
                    <ol className="text-white/60 text-xs space-y-1 list-decimal list-inside">
                      <li>Select which wallet to send from</li>
                      <li>Copy your selected wallet address above</li>
                      <li>Enter the amount (default: 1 KAS)</li>
                      <li>Click "Start Verification"</li>
                      <li>Open {selectedZkWallet === 'ttt' ? 'Kaspium' : 'Kasware'} and send that amount to your own address</li>
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
                      if (agentXToToggle) {
                        setShowAgentXModal(true);
                      } else {
                        setShowPaymentModal(true);
                      }
                      setZkAmount('1');
                    }}
                    variant="outline"
                    className="w-full border-white/10 text-white/60"
                  >
                    Back
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-cyan-400 font-semibold mb-2">🔍 Waiting for Transaction...</p>
                <p className="text-white/60 text-sm mb-4">
                  Send {zkAmount} KAS to yourself in {selectedZkWallet === 'ttt' ? 'Kaspium' : 'Kasware'}
                </p>
                <div className="bg-white/5 rounded-lg p-3 mb-4">
                  <p className="text-white/40 text-xs mb-1">Send to this address:</p>
                  <div className="flex items-center gap-2">
                    <p className="text-white text-xs font-mono break-all flex-1">
                      {selectedZkWallet === 'ttt' ? user?.created_wallet_address : kaswareWallet.address}
                    </p>
                    <Button
                      onClick={() => {
                        const address = selectedZkWallet === 'ttt' ? user?.created_wallet_address : kaswareWallet.address;
                        navigator.clipboard.writeText(address || '');
                        toast.success('Address copied!');
                      }}
                      size="sm"
                      className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-xs h-7 px-2"
                    >
                      Copy
                    </Button>
                  </div>
                </div>
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 mb-4">
                  <p className="text-cyan-400 text-xs">
                    💡 Checking blockchain every 3 seconds...
                  </p>
                  <p className="text-white/40 text-[10px] mt-1">
                    Make sure you send exactly {zkAmount} KAS
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setZkVerifying(false);
                    setShowZkVerification(false);
                    setShowPaymentModal(true);
                    setZkAmount('1');
                  }}
                  variant="outline"
                  className="w-full border-white/10 text-white/60"
                >
                  Cancel Verification
                </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}