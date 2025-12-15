import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Copy, CheckCircle2, Loader2, Smartphone, AlertCircle, Shield, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function ZKMobileModal({ isOpen, onClose, onVerify }) {
  const [user, setUser] = useState(null);
  const [zkAmount, setZkAmount] = useState('1');
  const [zkVerifying, setZkVerifying] = useState(false);
  const [selectedZkWallet, setSelectedZkWallet] = useState('ttt');
  const [kaswareWallet, setKaswareWallet] = useState({ connected: false, address: null });
  const [zkWalletBalance, setZkWalletBalance] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadUser();
      checkKasware();
    }
  }, [isOpen]);

  useEffect(() => {
    if (user?.created_wallet_address) {
      loadZkWalletBalance();
    }
  }, [user]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.log("Guest user");
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

  const handleZkVerification = async () => {
    const verifyAddress = selectedZkWallet === 'ttt' ? user?.created_wallet_address : kaswareWallet.address;
    
    if (!verifyAddress) {
      toast.error(selectedZkWallet === 'ttt' ? 'Please login first (TTT Wallet)' : 'Please connect Kasware');
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
        console.log(`Attempt ${attempts}/${maxAttempts} - Checking for transaction...`);

        try {
          const response = await base44.functions.invoke('verifyKaspaSelfTransaction', {
            address: verifyAddress,
            expectedAmount: targetAmount,
            timestamp: timestamp
          });

          if (response.data?.verified && response.data?.transaction) {
            console.log('✅ Transaction verified!', response.data.transaction);
            
            toast.success('✅ Transaction verified!');
            
            if (onVerify) {
                onVerify(response.data.transaction.id, verifyAddress);
            }
            
            onClose();
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
            toast.error('Failed to verify transaction. Please try again.');
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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
          onClick={() => {
              if (!zkVerifying) onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-black border border-cyan-500/30 rounded-xl w-full max-w-md p-6 relative"
          >
            <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-4 right-4 text-white/40 hover:text-white"
                onClick={onClose}
                disabled={zkVerifying}
            >
                <X className="w-5 h-5" />
            </Button>

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
                          {user?.created_wallet_address ? `${user.created_wallet_address.substring(0, 10)}...` : 'Not connected'}
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
                          {kaswareWallet.address ? `${kaswareWallet.address.substring(0, 10)}...` : 'Not connected'}
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
                        ? (user?.created_wallet_address ? `${user.created_wallet_address.substring(0, 12)}...${user.created_wallet_address.slice(-8)}` : 'No address')
                        : (kaswareWallet.address ? `${kaswareWallet.address.substring(0, 12)}...${kaswareWallet.address.slice(-8)}` : 'No address')
                      }
                    </p>
                    <Button
                      onClick={() => {
                        const address = selectedZkWallet === 'ttt' ? user?.created_wallet_address : kaswareWallet.address;
                        if (address) {
                            navigator.clipboard.writeText(address);
                            toast.success('✓ Address copied');
                        }
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
                  disabled={!zkAmount || parseFloat(zkAmount) <= 0 || (selectedZkWallet === 'ttt' && !user?.created_wallet_address) || (selectedZkWallet === 'kasware' && !kaswareWallet.address)}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-white h-12 font-semibold disabled:opacity-50"
                >
                  Start Verification
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
  );
}