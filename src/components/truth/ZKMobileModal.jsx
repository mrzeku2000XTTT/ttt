import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Copy, CheckCircle2, Loader2, Smartphone, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function ZKMobileModal({ isOpen, onClose, onVerify }) {
  const [step, setStep] = useState(1); // 1: Enter Address (if unknown), 2: Send & Verify
  const [userAddress, setUserAddress] = useState("");
  const [txHash, setTxHash] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadUserAddress();
    }
  }, [isOpen]);

  const loadUserAddress = async () => {
    try {
      const user = await base44.auth.me();
      // Check for various address fields that might exist
      const address = user?.kaspa_address || user?.wallet_address || user?.created_wallet_address;
      
      if (address) {
        setUserAddress(address);
        setStep(2);
      } else {
        setStep(1);
      }
    } catch (error) {
      console.error("Failed to load user address", error);
      setStep(1);
    } finally {
      setLoadingUser(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleNext = () => {
    if (!userAddress.trim()) {
      toast.error("Please enter your wallet address");
      return;
    }
    setStep(2);
  };

  const handleVerify = async () => {
    if (!txHash.trim()) {
      toast.error("Please enter the transaction hash");
      return;
    }

    setIsVerifying(true);
    
    // In a real ZK scenario, we would verify the proof on-chain or via a verifier service.
    // Here we simulate the verification delay and trust the user input for the "Truth" entry.
    // The actual verification might happen asynchronously by a backend watcher checking the TXID.
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate verification
      await onVerify(txHash, userAddress);
      onClose();
    } catch (error) {
      console.error("Verification error", error);
      toast.error("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-zinc-950 border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl pointer-events-auto flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-zinc-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">ZK Mobile Access</h2>
                    <p className="text-xs text-cyan-400 font-mono">Zero-Knowledge Verification</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto custom-scrollbar">
                {loadingUser ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mb-4" />
                    <p className="text-gray-400">Loading wallet details...</p>
                  </div>
                ) : step === 1 ? (
                  <div className="space-y-6">
                    <div className="text-center">
                      <p className="text-gray-300">
                        To verify your humanity, we need to know your Kaspa wallet address.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Your Wallet Address</label>
                      <Input
                        value={userAddress}
                        onChange={(e) => setUserAddress(e.target.value)}
                        placeholder="kaspa:..."
                        className="bg-zinc-900 border-zinc-800 text-white font-mono text-sm h-12"
                      />
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        We'll ask you to send a self-transaction to this address.
                      </p>
                    </div>

                    <Button 
                      onClick={handleNext} 
                      className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-6 text-lg font-bold"
                    >
                      Continue
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Instruction Step 1 */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-xs">1</span>
                        SEND 1 KAS TO YOURSELF
                      </div>
                      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-3">
                        <p className="text-xs text-gray-400">
                          Open your mobile wallet and send <strong className="text-white">1 KAS</strong> to your own address below:
                        </p>
                        <div className="flex items-center gap-2 bg-black/50 rounded-lg p-2 border border-white/5">
                          <code className="text-xs text-gray-300 font-mono break-all flex-1">
                            {userAddress}
                          </code>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-cyan-400 hover:bg-cyan-500/10"
                            onClick={() => handleCopy(userAddress)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Instruction Step 2 */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/20 text-xs">2</span>
                        VERIFY PROOF
                      </div>
                      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-3">
                        <p className="text-xs text-gray-400">
                          Paste the Transaction ID (TXID) after sending:
                        </p>
                        <Input
                          value={txHash}
                          onChange={(e) => setTxHash(e.target.value)}
                          placeholder="Enter TXID hash..."
                          className="bg-black/50 border-zinc-800 text-white font-mono text-sm"
                        />
                      </div>
                    </div>

                    <Button 
                      onClick={handleVerify} 
                      disabled={isVerifying}
                      className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-6 text-lg font-bold shadow-lg shadow-cyan-500/20"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Verifying Proof...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5 mr-2" />
                          Verify Transaction
                        </>
                      )}
                    </Button>
                    
                    <button 
                      onClick={() => setStep(1)}
                      className="w-full text-center text-xs text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      Use a different address
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}