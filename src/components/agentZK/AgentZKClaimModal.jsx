import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Wallet, Key, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AgentZKClaimModal({ onClaim, kaswareWallet, checkWallets }) {
  const [claimMethod, setClaimMethod] = useState(null); // 'ttt', 'kasware', 'manual'
  const [manualAddress, setManualAddress] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleKaswareClaim = async () => {
    if (!window.kasware) {
      alert('Kasware wallet not detected. Please install Kasware extension.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const accounts = await window.kasware.requestAccounts();
      if (accounts.length === 0) {
        throw new Error('No Kasware account found');
      }

      const address = accounts[0];
      
      // Store in localStorage
      localStorage.setItem('ttt_wallet_address', address);
      localStorage.setItem('agent_zk_claim_method', 'kasware');
      
      // Update user profile if logged in
      try {
        const currentUser = await base44.auth.me();
        if (currentUser) {
          await base44.auth.updateMe({ created_wallet_address: address });
        }
      } catch (err) {
        console.log('Not logged in, using local storage only');
      }

      await checkWallets();
      onClaim();
    } catch (err) {
      console.error('Kasware claim error:', err);
      setError('Failed to connect Kasware: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualClaim = async () => {
    if (!manualAddress.trim()) {
      setError('Please enter a valid Kaspa address');
      return;
    }

    if (!manualAddress.startsWith('kaspa:')) {
      setError('Address must start with kaspa:');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Store in localStorage
      localStorage.setItem('ttt_wallet_address', manualAddress.trim());
      localStorage.setItem('agent_zk_claim_method', 'manual');
      
      // Update user profile if logged in
      try {
        const currentUser = await base44.auth.me();
        if (currentUser) {
          await base44.auth.updateMe({ created_wallet_address: manualAddress.trim() });
        }
      } catch (err) {
        console.log('Not logged in, using local storage only');
      }

      onClaim();
    } catch (err) {
      console.error('Manual claim error:', err);
      setError('Failed to claim identity: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/15 rounded-full blur-[150px]"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 max-w-2xl w-full bg-black/80 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-8"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Claim Agent ZK Identity</h1>
          <p className="text-white/60">Choose how you want to create your unique Agent ZK identity</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {!claimMethod ? (
            <motion.div
              key="options"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* TTT Wallet Option */}
              <button
                onClick={() => setClaimMethod('ttt')}
                className="w-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 hover:from-cyan-500/30 hover:to-blue-500/30 hover:border-cyan-400 rounded-xl p-6 text-left transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors">
                    <Wallet className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold mb-1">TTT Wallet</h3>
                    <p className="text-white/60 text-sm">Create or use your TTT Wallet to claim your identity</p>
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-cyan-400" />
                </div>
              </button>

              {/* Kasware L1 Option */}
              <button
                onClick={() => setClaimMethod('kasware')}
                className="w-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40 hover:from-purple-500/30 hover:to-pink-500/30 hover:border-purple-400 rounded-xl p-6 text-left transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                    <Shield className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold mb-1">Kasware L1</h3>
                    <p className="text-white/60 text-sm">Connect your Kasware wallet to claim identity</p>
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-purple-400" />
                </div>
              </button>

              {/* Manual Address Option */}
              <button
                onClick={() => setClaimMethod('manual')}
                className="w-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/40 hover:from-blue-500/30 hover:to-indigo-500/30 hover:border-blue-400 rounded-xl p-6 text-left transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                    <Key className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold mb-1">Manual Address</h3>
                    <p className="text-white/60 text-sm">Paste your Kaspa address to claim identity</p>
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-blue-400" />
                </div>
              </button>
            </motion.div>
          ) : claimMethod === 'ttt' ? (
            <motion.div
              key="ttt"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center py-8"
            >
              <Wallet className="w-16 h-16 text-cyan-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-white mb-4">Create TTT Wallet</h2>
              <p className="text-white/60 mb-8">
                You'll be redirected to create your TTT Wallet. Once created, your Agent ZK identity will be automatically generated.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setClaimMethod(null)}
                  variant="outline"
                  className="flex-1 border-white/10 text-white hover:bg-white/5"
                >
                  Back
                </Button>
                <Link to={createPageUrl("Wallet")} className="flex-1">
                  <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                    <Wallet className="w-4 h-4 mr-2" />
                    Create Wallet
                  </Button>
                </Link>
              </div>
            </motion.div>
          ) : claimMethod === 'kasware' ? (
            <motion.div
              key="kasware"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center py-8"
            >
              <Shield className="w-16 h-16 text-purple-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-white mb-4">Connect Kasware</h2>
              <p className="text-white/60 mb-8">
                Click below to connect your Kasware wallet. Your Agent ZK identity will be created using your Kasware L1 address.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setClaimMethod(null)}
                  variant="outline"
                  className="flex-1 border-white/10 text-white hover:bg-white/5"
                  disabled={isProcessing}
                >
                  Back
                </Button>
                <Button
                  onClick={handleKaswareClaim}
                  disabled={isProcessing}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Connect Kasware
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="manual"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="py-8"
            >
              <Key className="w-16 h-16 text-blue-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-white mb-4 text-center">Enter Kaspa Address</h2>
              <p className="text-white/60 mb-6 text-center">
                Paste your Kaspa address to create your unique Agent ZK identity.
              </p>
              <div className="mb-6">
                <Input
                  value={manualAddress}
                  onChange={(e) => {
                    setManualAddress(e.target.value);
                    setError(null);
                  }}
                  placeholder="kaspa:..."
                  className="bg-zinc-900 border-blue-500/30 text-white placeholder:text-white/30 h-12"
                />
                <p className="text-xs text-white/40 mt-2">
                  Your address must start with "kaspa:"
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setClaimMethod(null)}
                  variant="outline"
                  className="flex-1 border-white/10 text-white hover:bg-white/5"
                  disabled={isProcessing}
                >
                  Back
                </Button>
                <Button
                  onClick={handleManualClaim}
                  disabled={isProcessing || !manualAddress.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4 mr-2" />
                      Claim Identity
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}