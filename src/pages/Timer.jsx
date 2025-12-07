import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Loader2, Send, Lock, Sparkles, AlertCircle } from "lucide-react";

export default function TimerPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [prompt, setPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [kaswareWallet, setKaswareWallet] = useState({ connected: false, address: null });
  const [user, setUser] = useState(null);
  const [verificationTimestamp, setVerificationTimestamp] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadUser();
    checkKasware();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.log('User not logged in');
    }
  };

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

  const connectKasware = async () => {
    if (typeof window.kasware === 'undefined') {
      alert('Kasware wallet not found. Please install Kasware extension.');
      return;
    }

    try {
      const accounts = await window.kasware.requestAccounts();
      setKaswareWallet({ connected: true, address: accounts[0] });
    } catch (err) {
      alert('Failed to connect Kasware: ' + err.message);
    }
  };

  const handleSubmit = () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    if (!kaswareWallet.connected && !user?.created_wallet_address) {
      alert('Please connect Kasware wallet or login with TTT wallet');
      return;
    }

    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    if (!kaswareWallet.connected && !user?.created_wallet_address) {
      alert('Please connect wallet first');
      return;
    }

    const timestamp = Date.now();
    setVerificationTimestamp(timestamp);
    setIsVerifying(true);

    try {
      if (kaswareWallet.connected) {
        // Kasware payment
        const amountSompi = 100000000; // 1 KAS
        await window.kasware.sendKaspa(kaswareWallet.address, amountSompi);
        
        setIsVerifying(false);
        setShowPaymentModal(false);
        await processAIRequest();
      } else if (user?.created_wallet_address) {
        // ZK wallet payment - wait for self-transaction
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
              await processAIRequest();
              return;
            }

            if (attempts < maxAttempts) {
              setTimeout(checkTransaction, 3000);
            } else {
              setIsVerifying(false);
              alert('Verification timeout. Please try again.');
            }
          } catch (err) {
            if (attempts < maxAttempts) {
              setTimeout(checkTransaction, 3000);
            } else {
              setIsVerifying(false);
              alert('Verification failed. Please try again.');
            }
          }
        };

        checkTransaction();
      }
    } catch (err) {
      setIsVerifying(false);
      alert('Payment failed: ' + err.message);
    }
  };

  const processAIRequest = async () => {
    setIsLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a helpful AI assistant for a timer/clock app. The user asked: "${prompt}". Provide a helpful, concise response about time, clocks, timers, scheduling, or time management. If they ask about the current time, mention it's ${currentTime.toLocaleString()}.`
      });

      setAiResponse(response);
      setPrompt("");
    } catch (err) {
      alert('AI request failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const hours = currentTime.getHours().toString().padStart(2, '0');
  const minutes = currentTime.getMinutes().toString().padStart(2, '0');
  const seconds = currentTime.getSeconds().toString().padStart(2, '0');
  const date = currentTime.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(2px 2px at 20px 30px, white, transparent),
                           radial-gradient(2px 2px at 60px 70px, white, transparent),
                           radial-gradient(1px 1px at 50px 50px, white, transparent)`,
          backgroundSize: '200px 200px',
          animation: 'twinkle 4s ease-in-out infinite'
        }} />
      </div>

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes glow {
          0%, 100% { text-shadow: 0 0 10px rgba(6, 182, 212, 0.5), 0 0 20px rgba(6, 182, 212, 0.3); }
          50% { text-shadow: 0 0 20px rgba(6, 182, 212, 0.8), 0 0 40px rgba(6, 182, 212, 0.5); }
        }
      `}</style>

      <div className="relative z-10 p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Clock className="w-10 h-10 text-cyan-400" />
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              AI Timer
            </h1>
          </div>
          <p className="text-white/60 text-sm sm:text-base">Ask AI anything about time • Pay 1 KAS to unlock</p>
        </motion.div>

        {/* Digital Clock Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 sm:mb-12"
        >
          <div className="bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6 sm:p-8 md:p-12">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4 font-mono">
                <motion.span
                  animate={{ opacity: [1, 0.7, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-5xl sm:text-7xl md:text-9xl font-bold text-cyan-400"
                  style={{ animation: 'glow 2s ease-in-out infinite' }}
                >
                  {hours}
                </motion.span>
                <span className="text-4xl sm:text-6xl md:text-8xl text-cyan-400/60">:</span>
                <motion.span
                  animate={{ opacity: [1, 0.7, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                  className="text-5xl sm:text-7xl md:text-9xl font-bold text-cyan-400"
                  style={{ animation: 'glow 2s ease-in-out infinite' }}
                >
                  {minutes}
                </motion.span>
                <span className="text-4xl sm:text-6xl md:text-8xl text-cyan-400/60">:</span>
                <motion.span
                  animate={{ opacity: [1, 0.7, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
                  className="text-5xl sm:text-7xl md:text-9xl font-bold text-cyan-400"
                  style={{ animation: 'glow 2s ease-in-out infinite' }}
                >
                  {seconds}
                </motion.span>
              </div>
              <p className="text-white/60 text-base sm:text-lg font-medium">{date}</p>
            </div>
          </div>
        </motion.div>

        {/* AI Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-black/40 backdrop-blur-xl border border-white/20 rounded-2xl p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <h3 className="text-white font-bold text-lg">Ask AI About Time</h3>
            </div>

            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask me anything... set a timer, time zones, scheduling tips, productivity hacks..."
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[100px] mb-4 text-sm sm:text-base"
              disabled={isLoading}
            />

            <div className="flex flex-col sm:flex-row gap-3">
              {!kaswareWallet.connected && !user?.created_wallet_address && (
                <Button
                  onClick={connectKasware}
                  className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Connect Kasware
                </Button>
              )}

              <Button
                onClick={handleSubmit}
                disabled={isLoading || !prompt.trim()}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit (1 KAS)
                  </>
                )}
              </Button>
            </div>

            {kaswareWallet.connected && (
              <p className="text-xs text-white/40 mt-2 text-center sm:text-left">
                Connected: {kaswareWallet.address.substring(0, 10)}...{kaswareWallet.address.slice(-6)}
              </p>
            )}
          </div>
        </motion.div>

        {/* AI Response */}
        <AnimatePresence>
          {aiResponse && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-black/40 backdrop-blur-xl border border-green-500/30 rounded-2xl p-4 sm:p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-green-400" />
                <h3 className="text-white font-bold text-lg">AI Response</h3>
              </div>
              <p className="text-white/80 leading-relaxed text-sm sm:text-base whitespace-pre-wrap">
                {aiResponse}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isVerifying && setShowPaymentModal(false)}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black border border-yellow-500/30 rounded-2xl w-full max-w-md p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Lock className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl">Unlock AI Response</h3>
                  <p className="text-white/60 text-sm">Pay 1 KAS to continue</p>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-white/80">
                    <p className="mb-2">
                      {kaswareWallet.connected 
                        ? 'You will pay 1 KAS to yourself via Kasware.'
                        : 'Send 1 KAS to yourself in Kaspium to unlock.'
                      }
                    </p>
                    <p className="text-white/60">This unlocks your AI response.</p>
                  </div>
                </div>
              </div>

              {!kaswareWallet.connected && user?.created_wallet_address && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-4">
                  <p className="text-white/40 text-xs mb-1">Your Wallet</p>
                  <p className="text-white text-xs font-mono break-all">
                    {user.created_wallet_address}
                  </p>
                </div>
              )}

              <Button
                onClick={handlePayment}
                disabled={isVerifying}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 h-12 text-black font-bold"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {kaswareWallet.connected ? 'Processing...' : 'Waiting for Transaction...'}
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 mr-2" />
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}