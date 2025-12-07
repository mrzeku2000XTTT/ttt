import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Lock, Shield, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function Y8Page() {
  const [user, setUser] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [y8Unlocked, setY8Unlocked] = useState(false);
  const [kaswareWallet, setKaswareWallet] = useState({ connected: false, address: null });
  const [showZkVerification, setShowZkVerification] = useState(false);
  const [zkAmount, setZkAmount] = useState('1');
  const [zkVerifying, setZkVerifying] = useState(false);
  const [zkWalletBalance, setZkWalletBalance] = useState(null);
  const [selectedZkWallet, setSelectedZkWallet] = useState('ttt');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [expiresAt, setExpiresAt] = useState(() => {
    const saved = localStorage.getItem('y8_expires_at');
    return saved ? parseInt(saved) : null;
  });

  useEffect(() => {
    loadUser();
    checkKasware();
    loadZkWalletBalance();
    checkSubscription();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      checkSubscription();
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const checkSubscription = () => {
    if (!expiresAt) {
      setY8Unlocked(false);
      setShowPaymentModal(true);
      setTimeRemaining(0);
      return;
    }

    const now = Date.now();
    const remaining = expiresAt - now;

    if (remaining <= 0) {
      setY8Unlocked(false);
      setShowPaymentModal(true);
      setTimeRemaining(0);
      localStorage.removeItem('y8_expires_at');
      setExpiresAt(null);
      toast.error('⏰ Time expired! Pay 1 KAS for 20 more minutes');
    } else {
      setY8Unlocked(true);
      setTimeRemaining(remaining);
    }
  };

  const addTime = () => {
    const now = Date.now();
    const twentyMinutes = 20 * 60 * 1000;
    const newExpiry = (expiresAt && expiresAt > now ? expiresAt : now) + twentyMinutes;
    setExpiresAt(newExpiry);
    localStorage.setItem('y8_expires_at', newExpiry.toString());
    setY8Unlocked(true);
  };

  const formatTimeRemaining = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
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

  const loadZkWalletBalance = async () => {
    try {
      if (user?.created_wallet_address) {
        const response = await base44.functions.invoke('getKaspaBalance', { address: user.created_wallet_address });
        if (response.data?.balance) {
          setZkWalletBalance(response.data.balance);
        }
      }
    } catch (err) {
      console.error('Failed to load balance:', err);
    }
  };

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.log("User not logged in");
    }
  };

  const handleSelfPayment = async () => {
    if (!kaswareWallet.connected) {
      toast.error('Please connect Kasware wallet');
      return;
    }

    try {
      const amountSompi = 100000000; // 1 KAS
      const txId = await window.kasware.sendKaspa(kaswareWallet.address, amountSompi);
      
      addTime();
      setShowPaymentModal(false);
      toast.success('✅ Payment verified! Added 20 minutes');
    } catch (err) {
      console.error('Payment failed:', err);
      toast.error('Payment failed: ' + err.message);
    }
  };

  const handleZkVerification = async () => {
    const verifyAddress = selectedZkWallet === 'ttt' ? user?.created_wallet_address : kaswareWallet.address;
    
    if (!verifyAddress) {
      toast.error(selectedZkWallet === 'ttt' ? 'Please login first' : 'Please connect Kasware');
      return;
    }

    const timestamp = Date.now();
    setZkVerifying(true);

    try {
      const targetAmount = parseFloat(zkAmount);
      let attempts = 0;
      const maxAttempts = 200;

      const checkTransaction = async () => {
        attempts++;

        try {
          const response = await base44.functions.invoke('verifyKaspaSelfTransaction', {
            address: verifyAddress,
            expectedAmount: targetAmount,
            timestamp: timestamp
          });

          if (response.data?.verified && response.data?.transaction) {
            setZkVerifying(false);
            setShowZkVerification(false);
            setShowPaymentModal(false);
            addTime();
            toast.success('✅ Payment verified! Added 20 minutes');
            return true;
          }

          if (attempts < maxAttempts) {
            setTimeout(checkTransaction, 3000);
          } else {
            setZkVerifying(false);
            toast.error('Verification timeout');
          }
        } catch (err) {
          if (attempts < maxAttempts) {
            setTimeout(checkTransaction, 3000);
          } else {
            setZkVerifying(false);
            toast.error('Failed to verify transaction');
          }
        }
      };

      checkTransaction();
    } catch (err) {
      setZkVerifying(false);
      toast.error('Verification failed');
    }
  };

  return (
    <>
      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black border border-yellow-500/30 rounded-xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg flex items-center justify-center">
                    {expiresAt && expiresAt > Date.now() ? <Lock className="w-5 h-5 text-green-400" /> : <Lock className="w-5 h-5 text-yellow-400" />}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">{expiresAt && expiresAt > Date.now() ? 'Add More Time' : 'Unlock Y8 Games'}</h3>
                    <p className="text-white/60 text-sm">1 KAS = 20 minutes {expiresAt && expiresAt > Date.now() ? '(adds to current time)' : ''}</p>
                  </div>
                </div>
                <Link to={createPageUrl("AppStore")}>
                  <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                    <X className="w-5 h-5" />
                  </Button>
                </Link>
              </div>

              <div className="space-y-4">
                {kaswareWallet.connected && (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <div className="text-xs text-white/60 mb-1">Your Kasware Wallet</div>
                    <div className="text-white font-mono text-sm break-all">
                      {kaswareWallet.address}
                    </div>
                  </div>
                )}

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-white/80">
                      <p className="mb-2">Pay <span className="font-bold text-yellow-400">1 KAS</span> to yourself to {expiresAt && expiresAt > Date.now() ? 'add' : 'unlock Y8 for'} <span className="font-bold text-cyan-400">20 minutes</span>.</p>
                      <p className="text-white/60">{expiresAt && expiresAt > Date.now() ? 'Time will be added to your current timer.' : 'Timer-based access. Pay again when time expires.'}</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSelfPayment}
                  disabled={!kaswareWallet.connected}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 h-12 text-black font-bold"
                >
                  {kaswareWallet.connected ? (
                    <>
                      <Lock className="w-5 h-5 mr-2" />
                      Pay 1 KAS - Get 20 Min
                    </>
                  ) : (
                    'Connect Kasware First'
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
                  ZK Verification (iOS/Kaspium)
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
                setShowPaymentModal(true);
                setZkAmount('1');
              }
            }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
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
                Send KAS to yourself in Kaspium to unlock Y8
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
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-lg"
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
                  <p className="text-white/40 text-xs">
                    Verification will happen automatically when the transaction is detected
                  </p>
                  <Button
                    onClick={() => {
                      setZkVerifying(false);
                      setShowZkVerification(false);
                      setShowPaymentModal(true);
                      setZkAmount('1');
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
      </AnimatePresence>

      <div className="fixed left-0 right-0 bottom-0 bg-black flex flex-col" style={{ top: 'calc(var(--sat, 0px) + 7.5rem)' }}>
        {/* Header */}
        <div className="flex-none bg-black/80 backdrop-blur-xl border-b border-white/10 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("AppStore")}>
              <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-white">Y8 Games</h1>
          </div>
          {y8Unlocked && timeRemaining > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ 
                background: timeRemaining < 300000 ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2))' : 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(20, 184, 166, 0.2))',
                border: timeRemaining < 300000 ? '2px solid rgba(239, 68, 68, 0.5)' : '2px solid rgba(6, 182, 212, 0.5)',
                boxShadow: timeRemaining < 300000 ? '0 0 20px rgba(239, 68, 68, 0.3)' : '0 0 20px rgba(6, 182, 212, 0.3)'
              }}
            >
              <div className="flex items-center gap-2">
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  background: timeRemaining < 300000 ? '#ef4444' : '#06b6d4',
                  borderRadius: '50%',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  boxShadow: timeRemaining < 300000 ? '0 0 10px #ef4444' : '0 0 10px #06b6d4'
                }} />
                <span style={{ 
                  fontSize: '1rem', 
                  fontWeight: 700, 
                  color: timeRemaining < 300000 ? '#fca5a5' : '#67e8f9',
                  fontFamily: 'monospace',
                  letterSpacing: '0.05em'
                }}>
                  {formatTimeRemaining(timeRemaining)}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowPaymentModal(true);
                }}
                className="flex items-center gap-1 px-3 py-1 rounded-lg hover:scale-105 transition-transform"
                style={{ 
                  background: 'rgba(6, 182, 212, 0.3)',
                  border: '2px solid rgba(6, 182, 212, 0.5)',
                  color: '#06b6d4',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.75rem'
                }}
                title="Add 20 more minutes"
              >
                <Shield className="w-3.5 h-3.5" />
                ZK
              </button>
            </motion.div>
          )}
        </div>

        {/* Iframe */}
        {y8Unlocked ? (
          <div className="flex-1 relative bg-black">
            <iframe
              src="https://www.y8.com"
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-black">
            <div className="text-center">
              <Lock className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Y8 Games Locked</h2>
              <p className="text-white/60 mb-4">Pay 1 KAS for 20 minutes of access</p>
              <Button
                onClick={() => setShowPaymentModal(true)}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
              >
                <Lock className="w-5 h-5 mr-2" />
                Unlock Y8
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}