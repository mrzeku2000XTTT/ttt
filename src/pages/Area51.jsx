import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, Loader2, User as UserIcon, AlertTriangle, Copy, Sparkles, Shield, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import moment from "moment";
import { toast } from "sonner";

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
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationTimestamp, setVerificationTimestamp] = useState(null);
  const [isDagVerified, setIsDagVerified] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  useEffect(() => {
    loadUser();
    loadMessages();
    checkIfCheckedIn();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, []);

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
    scrollToBottom();
  }, [messages]);

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
      const msgs = await base44.entities.Area51Message.list("-created_date", 50);
      setMessages(msgs.reverse());
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

  const triggerAI = async (userMessage) => {
    setAiThinking(true);
    try {
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
        is_ai: true
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

    // Check if user is Ayomuiz and needs DAG verification
    const isAyomuiz = user.created_wallet_address?.toLowerCase() === 'kaspa:qpv8vpyap7fgp4k3vgs5rh66f6wa2upy70fu023s4gyjzhq8ux9nzd37c7ygt'.toLowerCase();
    
    if (isAyomuiz && !isDagVerified) {
      // Show payment modal for DAG CIRCULATE PROTOCOL
      setShowPaymentModal(true);
      return;
    }

    const messageContent = newMessage.trim();
    setSending(true);
    try {
      await base44.entities.Area51Message.create({
        message: messageContent,
        sender_username: user.username || user.email?.split('@')[0] || "Anonymous",
        sender_email: user.email,
        sender_wallet: user.created_wallet_address,
        message_type: "text",
        is_ai: false
      });
      setNewMessage("");
      loadMessages();

      // Trigger AI for admins or verified Ayomuiz
      const isAdmin = user.role === 'admin';
      if (isAdmin || (isAyomuiz && isDagVerified)) {
        setTimeout(() => triggerAI(messageContent), 2000);
      } else {
        // Trigger AI 30% of the time or if message contains keywords
        const keywords = ['alien', 'ufo', 'government', 'conspiracy', 'area51', 'secret', 'truth', 'cover'];
        const hasKeyword = keywords.some(kw => messageContent.toLowerCase().includes(kw));
        if (hasKeyword || Math.random() < 0.3) {
          setTimeout(() => triggerAI(messageContent), 2000);
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleDagPayment = async () => {
    if (!user?.created_wallet_address) {
      toast.error('Wallet not connected');
      return;
    }

    const timestamp = Date.now();
    setVerificationTimestamp(timestamp);
    setIsVerifying(true);

    try {
      let attempts = 0;
      const maxAttempts = 200;

      const checkTransaction = async () => {
        attempts++;

        try {
          const response = await base44.functions.invoke('verifyKaspaSelfTransaction', {
            address: user.created_wallet_address,
            expectedAmount: 1,
            timestamp: timestamp
          });

          if (response.data?.verified) {
            setIsVerifying(false);
            setShowPaymentModal(false);
            setIsDagVerified(true);
            toast.success('✅ DAG CIRCULATE PROTOCOL verified!');
            return;
          }

          if (attempts < maxAttempts) {
            setTimeout(checkTransaction, 3000);
          } else {
            setIsVerifying(false);
            toast.error('Verification timeout. Please try again.');
          }
        } catch (err) {
          if (attempts < maxAttempts) {
            setTimeout(checkTransaction, 3000);
          } else {
            setIsVerifying(false);
            toast.error('Verification failed. Please try again.');
          }
        }
      };

      checkTransaction();
    } catch (err) {
      setIsVerifying(false);
      toast.error('Verification failed to start.');
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
          <div className="max-w-4xl mx-auto w-full flex flex-col gap-4 pb-4">
            {messages.map((msg) => {
              const isMe = user && msg.sender_email === user.email;
              const isAI = msg.is_ai === true;
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
                        <span className="text-[9px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded border border-green-500/30">
                          AI AGENT
                        </span>
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
                    
                    <div className={`px-4 py-2.5 rounded-2xl backdrop-blur-sm ${
                      isAI
                        ? "bg-gradient-to-br from-green-600/30 to-cyan-600/30 border border-green-500/30 text-white shadow-lg shadow-green-900/20 rounded-tl-none"
                        : isMe 
                        ? "bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-900/20 rounded-tr-none" 
                        : "bg-white/10 border border-white/10 text-white/90 rounded-tl-none hover:bg-white/15 transition-colors"
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
                    </div>
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

      {/* DAG CIRCULATE PROTOCOL Payment Modal */}
      {showPaymentModal && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => !isVerifying && setShowPaymentModal(false)}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
          />
          
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black border border-green-500/30 rounded-2xl w-full max-w-md p-6 z-[1000]"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-xl">DAG CIRCULATE PROTOCOL</h3>
                <p className="text-white/60 text-sm">Unlock Agent X Access</p>
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-white/80">
                  <p className="mb-2">Send 1 KAS to yourself in Kaspium to unlock Agent X responses.</p>
                  <p className="text-white/60">This verifies your access to classified communications.</p>
                </div>
              </div>
            </div>

            {user?.created_wallet_address && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-4">
                <p className="text-white/40 text-xs mb-1">Your Wallet</p>
                <p className="text-white text-xs font-mono break-all">
                  {user.created_wallet_address}
                </p>
              </div>
            )}

            <Button
              onClick={handleDagPayment}
              disabled={isVerifying}
              className="w-full bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 h-12 text-black font-bold"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Waiting for Transaction...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-2" />
                  Pay 1 KAS & Unlock
                </>
              )}
            </Button>

            {!isVerifying && (
              <Button
                onClick={() => setShowPaymentModal(false)}
                variant="ghost"
                className="w-full mt-3 text-white/60"
              >
                Cancel
              </Button>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}