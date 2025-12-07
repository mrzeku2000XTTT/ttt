import React, { useState, useEffect } from "react";
import { ArrowLeft, Shield, Lock, Copy, Loader2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function Y9Page() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [showZkVerification, setShowZkVerification] = useState(false);
  const [zkAmount, setZkAmount] = useState('1');
  const [zkVerifying, setZkVerifying] = useState(false);
  const [zkWalletBalance, setZkWalletBalance] = useState(null);
  const [kaswareWallet, setKaswareWallet] = useState({ connected: false, address: null });
  const [selectedZkWallet, setSelectedZkWallet] = useState('ttt');

  useEffect(() => {
    loadUser();
    checkKasware();
    loadZkWalletBalance();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setLoading(false);
    } catch (error) {
      console.log("Guest user");
      setLoading(false);
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

  const handleKaswarePayment = async () => {
    if (!kaswareWallet.connected) {
      toast.error('Please connect Kasware wallet');
      return;
    }

    try {
      const amountSompi = 100000000; // 1 KAS
      const txId = await window.kasware.sendKaspa(kaswareWallet.address, amountSompi);
      
      setUnlocked(true);
      toast.success('✅ Payment verified! Access granted!');
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
            setUnlocked(true);
            toast.success('✅ Payment verified! Access granted!');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Y9 Games</h1>
          <p className="text-white/60 mb-6">Please login to access</p>
          <Button
            onClick={() => base44.auth.redirectToLogin()}
            className="bg-purple-500 hover:bg-purple-600 text-white"
          >
            Login
          </Button>
        </div>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-black border border-purple-500/30 rounded-xl p-6 max-w-md w-full"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Unlock Y9 Games</h3>
                <p className="text-white/60 text-sm">Pay 1 KAS to access</p>
              </div>
            </div>
            <Link to={createPageUrl("AppStore")}>
              <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
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

            <Button
              onClick={handleKaswarePayment}
              disabled={!kaswareWallet.connected}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-12 text-white font-bold"
            >
              {kaswareWallet.connected ? (
                <>
                  <Lock className="w-5 h-5 mr-2" />
                  Pay 1 KAS & Access
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
              onClick={() => setShowZkVerification(true)}
              className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400 h-12 font-semibold"
            >
              <Shield className="w-5 h-5 mr-2" />
              ZK Verification (iOS/Kaspium)
            </Button>
          </div>
        </motion.div>

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
                  Send KAS to yourself to unlock Y9 Games
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
                        setZkAmount('1');
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
                    <Button
                      onClick={() => {
                        setZkVerifying(false);
                        setShowZkVerification(false);
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

  return (
    <div className="fixed inset-0 bg-black">
      <div className="absolute top-0 left-0 right-0 z-10 bg-black/80 backdrop-blur-sm border-b border-purple-500/20 p-3 flex items-center justify-between">
        <Link to={createPageUrl("AppStore")}>
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-white font-bold text-lg">Y9 Games</h1>
        <div className="w-20" />
      </div>

      <iframe
        src="https://www.y9gamer.com"
        className="w-full h-full"
        style={{ border: 'none' }}
        title="Y9 Games"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}