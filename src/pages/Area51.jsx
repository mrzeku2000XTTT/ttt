import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, Loader2, User as UserIcon, AlertTriangle, Copy, Sparkles, Shield, CheckCircle, Lock, LockOpen, X } from "lucide-react";
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
  const messagesEndRef = useRef(null);

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
    const interval = setInterval(loadMessages, 3000);
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
    } catch (error) {
      console.log("Guest user");
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
      
      // Filter visible messages but keep ALL in state for finding AI responses
      const visibleMessages = allMsgs.filter(msg => {
        // Always show public messages
        if (msg.is_public === true) return true;
        
        // Always show system messages
        if (msg.message_type === 'system') return true;
        
        // Show user's own messages
        if (currentUser && msg.sender_email === currentUser.email) return true;
        
        // Show AI responses only if parent is visible
        if (msg.is_ai && msg.parent_message_id) {
          const parentMsg = allMsgs.find(m => m.id === msg.parent_message_id);
          if (parentMsg && currentUser && parentMsg.sender_email === currentUser.email) {
            return true;
          }
        }
        
        return false;
      });
      
      setMessages(visibleMessages.reverse());
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
    if (!user) {
      toast.error("Please login to check in");
      return;
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
          user_email: user.email,
          username: user.username || user.email?.split('@')[0],
          wallet_address: user.created_wallet_address || "",
          signature: signature,
          check_in_message: message,
          device_type: deviceType
        }),
        base44.entities.Area51Message.create({
          message: `🛸 ${user.username || user.email?.split('@')[0]} has checked into Area 51`,
          sender_username: "SYSTEM",
          sender_email: "system@area51",
          message_type: "system",
          is_ai: false
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

  const triggerAI = async (userMessageId, userMessage) => {
    setAiThinking(true);
    try {
      // Check if AI response already exists for this message
      const existingAI = messages.find(m => m.parent_message_id === userMessageId && m.is_ai);
      if (existingAI) {
        console.log('AI response already exists for this message');
        setAiThinking(false);
        return;
      }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are AGENT X - a conspiracy theory expert at AREA51. Someone just said: "${userMessage}". 
        
Respond with a conspiracy theory perspective (serious or humorous). Keep it under 150 words. 
Topics can include: aliens, government secrets, shadow organizations, hidden technology, etc.`,
        add_context_from_internet: false
      });

      await base44.entities.Area51Message.create({
        message: response,
        sender_username: "AGENT X",
        sender_email: "ai@area51.gov",
        message_type: "ai",
        is_ai: true,
        is_public: false,
        parent_message_id: userMessageId
      });

      loadMessages();
    } catch (error) {
      console.error("AI failed:", error);
    } finally {
      setAiThinking(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const messageContent = newMessage.trim();
    setSending(true);
    try {
      const createdMessage = await base44.entities.Area51Message.create({
        message: messageContent,
        sender_username: user.username || user.email?.split('@')[0] || "Anonymous",
        sender_email: user.email,
        sender_wallet: user.created_wallet_address,
        message_type: "text",
        is_ai: false,
        is_public: false
      });
      setNewMessage("");
      await loadMessages();
      
      // Trigger AI response after message is created
      triggerAI(createdMessage.id, messageContent);
    } catch (error) {
      console.error("Failed to send message:", error);
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

      // Update user message
      await base44.entities.Area51Message.update(messageToPublish.id, {
        is_public: true,
        made_public_at: new Date().toISOString(),
        self_pay_tx_hash: txId
      });

      // Find and update AI response
      const aiResponse = messages.find(m => m.parent_message_id === messageToPublish.id && m.is_ai);
      if (aiResponse) {
        await base44.entities.Area51Message.update(aiResponse.id, {
          is_public: true,
          made_public_at: new Date().toISOString()
        });
      }

      setShowPaymentModal(false);
      setMessageToPublish(null);

      await loadMessages();

      toast.success('✅ Message published to all users!');
    } catch (err) {
      console.error('Failed to publish message:', err);
      toast.error('Failed to publish: ' + err.message);
    } finally {
      setPublishingMessageId(null);
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

            // Update user message
            await base44.entities.Area51Message.update(messageToPublish.id, {
              is_public: true,
              made_public_at: new Date().toISOString(),
              self_pay_tx_hash: response.data.transaction.id
            });

            // Find and update AI response
            const aiResponse = messages.find(m => m.parent_message_id === messageToPublish.id && m.is_ai);
            if (aiResponse) {
              await base44.entities.Area51Message.update(aiResponse.id, {
                is_public: true,
                made_public_at: new Date().toISOString()
              });
            }

            // Reload messages to get updated data
            await loadMessages();

            // Now close modals and show success
            setZkVerifying(false);
            setShowZkVerification(false);
            setShowPaymentModal(false);
            setMessageToPublish(null);

            toast.success('✅ Message published to all users!');
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
          {aiThinking && (
            <div className="flex items-center gap-2 text-green-400 text-xs animate-pulse">
              <Sparkles className="w-3 h-3" />
              <span className="hidden sm:inline">AGENT X typing...</span>
            </div>
          )}
          {user && (
            <Button
              onClick={handleCheckIn}
              disabled={checkingIn || hasCheckedIn}
              size="sm"
              className={`${
                hasCheckedIn 
                  ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                  : "bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 text-black"
              } shadow-lg transition-all`}
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
          )}
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
          <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 pb-4">
            {messages.filter(m => !m.parent_message_id).map((msg) => {
              const isMe = user && msg.sender_email === user.email;
              const isSystem = msg.message_type === 'system';
              const aiResponse = messages.find(m => m.parent_message_id === msg.id && m.is_ai);

              return (
                <div key={msg.id} className="flex flex-col gap-3">
                  {/* User Message on Right */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex gap-3 flex-row-reverse ${isSystem ? 'justify-center' : ''}`}
                  >
                    {!isSystem && (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
                        isMe ? "bg-cyan-500/20 border-cyan-500/30" : "bg-white/10 border-white/10"
                      }`}>
                        <UserIcon className={`w-4 h-4 ${isMe ? "text-cyan-400" : "text-white/60"}`} />
                      </div>
                    )}

                    <div className={`flex flex-col ${isMe || isSystem ? "items-end" : "items-start"} ${isSystem ? '' : 'max-w-[85%] sm:max-w-[70%]'}`}>
                      <div className="flex items-center gap-2 mb-1 px-1 flex-wrap">
                        <span className={`text-xs font-bold ${isMe ? "text-cyan-400" : "text-white/70"}`}>
                          {msg.sender_username}
                        </span>
                        {!msg.is_public && isMe && !isSystem && (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] px-1.5 py-0">
                            <Lock className="w-2.5 h-2.5 mr-1" />
                            PRIVATE
                          </Badge>
                        )}
                        {msg.is_public && !isSystem && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] px-1.5 py-0">
                            <LockOpen className="w-2.5 h-2.5 mr-1" />
                            PUBLIC
                          </Badge>
                        )}
                        {msg.sender_wallet && !isSystem && (
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

                      <div className="flex items-start gap-2">
                        <div className={`px-4 py-2.5 rounded-2xl backdrop-blur-sm ${
                          isMe 
                            ? "bg-white/10 border border-white/10 text-white/90 rounded-tr-none" 
                            : "bg-white/10 border border-white/10 text-white/90 rounded-tl-none hover:bg-white/15 transition-colors"
                        }`}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
                        </div>
                        {!msg.is_public && isMe && !isSystem && aiResponse && (
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
                    </div>
                  </motion.div>

                  {/* AI Response Below User Message on Right */}
                  {aiResponse && (isMe || (msg.is_public && aiResponse.is_public)) && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-3 flex-row-reverse"
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border bg-green-500/30 border-green-400/50 shadow-lg shadow-green-500/20">
                        <Sparkles className="w-4 h-4 text-green-400" />
                      </div>
                      <div className="flex flex-col items-end max-w-[85%] sm:max-w-[70%]">
                        <div className="flex items-center gap-2 mb-1 px-1">
                          <span className="text-xs font-bold text-green-400">AGENT X</span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded border border-green-500/30">
                            AI AGENT
                          </span>
                          {!aiResponse.is_public && (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] px-1.5 py-0">
                              <Lock className="w-2.5 h-2.5 mr-1" />
                              PRIVATE
                            </Badge>
                          )}
                          {aiResponse.is_public && (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] px-1.5 py-0">
                              <LockOpen className="w-2.5 h-2.5 mr-1" />
                              PUBLIC
                            </Badge>
                          )}
                          <span className="text-[10px] text-white/30">
                            {moment(aiResponse.created_date).utc().format('HH:mm')} UTC
                          </span>
                        </div>
                        <div className="px-4 py-2.5 rounded-2xl backdrop-blur-sm bg-gradient-to-br from-green-600/30 to-cyan-600/30 border border-green-500/30 text-white shadow-lg shadow-green-900/20 rounded-tr-none">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{aiResponse.message}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - Fixed */}
      <div className="flex-none p-4 bg-black/80 backdrop-blur-xl border-t border-green-500/20 z-20">
        <div className="max-w-4xl mx-auto w-full">
          {user ? (
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
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-white/5 to-white/10 border border-green-500/20 backdrop-blur-md"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Clearance Required</p>
                  <p className="text-xs text-white/50">Sign in to access classified chat</p>
                </div>
              </div>
              <Button 
                onClick={() => base44.auth.redirectToLogin()}
                size="sm"
                className="bg-green-500 text-black hover:bg-green-400 font-bold"
              >
                Login
              </Button>
            </motion.div>
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
                      setShowPaymentModal(true);
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