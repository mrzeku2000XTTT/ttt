import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { Zap, Loader2, X, CheckCircle2, Activity } from "lucide-react";

export default function ProofOfLifeButton({ kaswareWallet, metamaskWallet, user, onSuccess, onReset, userHasProof }) {
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('1.0');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleOpen = () => {
    if (kaswareWallet.connected) {
      setSelectedWallet('kasware');
    } else if (metamaskWallet.connected) {
      setSelectedWallet('metamask');
    }
    setShowModal(true);
  };

  const handleSubmitProof = async () => {
    if (!selectedWallet) {
      alert('Please select a wallet');
      return;
    }

    if (parseFloat(amount) < 1.0) {
      alert('Minimum 1 KAS required to go alive');
      return;
    }

    setIsSending(true);
    try {
      let txHash = null;
      let walletType = '';
      let walletAddress = '';
      let network = '';
      let signature = null;

      if (selectedWallet === 'kasware' && kaswareWallet.connected) {
        walletAddress = kaswareWallet.address;
        walletType = 'kasware_l1';
        network = 'L1';

        // Step 1: Request signature to verify identity
        const signMessage = `I am alive and active on TTT!\nTimestamp: ${new Date().toISOString()}`;
        try {
          signature = await window.kasware.signMessage(signMessage);
        } catch (signErr) {
          throw new Error('Signature required to go alive');
        }

        // Step 2: Send payment to self
        const amountInSompi = Math.floor(parseFloat(amount) * 1e8);
        const tx = await window.kasware.sendKaspa(kaswareWallet.address, amountInSompi);
        txHash = tx;

      } else if (selectedWallet === 'metamask' && metamaskWallet.connected) {
        walletAddress = metamaskWallet.address;
        walletType = 'metamask_l2';
        network = 'L2';

        // Step 1: Request signature to verify identity
        const signMessage = `I am alive and active on TTT!\nTimestamp: ${new Date().toISOString()}`;
        try {
          signature = await window.ethereum.request({
            method: 'personal_sign',
            params: [signMessage, metamaskWallet.address]
          });
        } catch (signErr) {
          throw new Error('Signature required to go alive');
        }

        // Step 2: Send payment to self
        const amountInWei = Math.floor(parseFloat(amount) * 1e18).toString(16);
        const tx = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: metamaskWallet.address,
            to: metamaskWallet.address,
            value: `0x${amountInWei}`,
          }],
        });
        txHash = tx;
      }

      if (!txHash) {
        throw new Error('Transaction failed');
      }

      const now = new Date();
      await base44.entities.ProofOfLife.create({
        user_email: user?.email || 'anonymous',
        wallet_address: walletAddress,
        wallet_type: walletType,
        tx_hash: txHash,
        amount: parseFloat(amount),
        message: message.trim() || '✓ Alive for 24 hours',
        network: network,
        proof_timestamp: now.toISOString(),
        is_verified: true
      });

      console.log('✅ Proof of Life submitted:', txHash);
      setSuccess(true);

      setTimeout(() => {
        setShowModal(false);
        setSuccess(false);
        setAmount('1.0');
        setMessage('');
        if (onSuccess) onSuccess();
      }, 2000);

    } catch (error) {
      console.error('Failed to submit proof:', error);
      alert('Failed to submit proof of life: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  const hasConnectedWallet = kaswareWallet.connected || metamaskWallet.connected;

  return (
    <>
      <div className="flex gap-2 w-full">
        <Button
          onClick={handleOpen}
          disabled={!hasConnectedWallet || userHasProof}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/50 flex-1 h-9 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Activity className="w-4 h-4 mr-2" />
          {userHasProof ? "You're Alive!" : "Go Alive!"}
        </Button>
        {userHasProof && onReset && (
          <Button
            onClick={() => {
              if (confirm('Reset your alive status? You can go alive again immediately.')) {
                onReset();
              }
            }}
            variant="outline"
            className="h-9 px-3 text-sm border-white/20 hover:border-white/40 text-gray-400 hover:text-white"
          >
            Reset
          </Button>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={() => !isSending && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <Card className="bg-zinc-950 border-zinc-800">
                <CardContent className="p-6">
                  {success ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-8"
                    >
                      <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-white mb-2">You're Alive!</h3>
                      <p className="text-gray-400">Alive for 24 hours - visible to all users 🎉</p>
                    </motion.div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">Go Alive for 24 Hours</h3>
                          <p className="text-xs text-gray-500">Sign + send 1 KAS to yourself</p>
                        </div>
                        <Button
                          onClick={() => setShowModal(false)}
                          variant="ghost"
                          size="sm"
                          className="text-gray-400"
                        >
                          <X className="w-5 h-5" />
                        </Button>
                      </div>

                      {/* Wallet Selection */}
                      <div className="mb-4">
                        <label className="text-xs text-gray-400 mb-2 block">Select Wallet</label>
                        <div className="space-y-2">
                          {kaswareWallet.connected && (
                            <button
                              onClick={() => setSelectedWallet('kasware')}
                              className={`w-full p-3 rounded-lg border transition-colors text-left ${
                                selectedWallet === 'kasware'
                                  ? 'bg-orange-500/20 border-orange-500/50 text-white'
                                  : 'bg-zinc-900 border-zinc-700 text-gray-400 hover:border-zinc-600'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-semibold text-sm">Kasware L1</div>
                                  <div className="text-xs font-mono">{kaswareWallet.address.substring(0, 20)}...</div>
                                </div>
                                <div className="text-sm">{kaswareWallet.balance.toFixed(4)} KAS</div>
                              </div>
                            </button>
                          )}

                          {metamaskWallet.connected && (
                            <button
                              onClick={() => setSelectedWallet('metamask')}
                              className={`w-full p-3 rounded-lg border transition-colors text-left ${
                                selectedWallet === 'metamask'
                                  ? 'bg-cyan-500/20 border-cyan-500/50 text-white'
                                  : 'bg-zinc-900 border-zinc-700 text-gray-400 hover:border-zinc-600'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-semibold text-sm">MetaMask L2</div>
                                  <div className="text-xs font-mono">{metamaskWallet.address.substring(0, 20)}...</div>
                                </div>
                                <div className="text-sm">{metamaskWallet.balance.toFixed(4)} KAS</div>
                              </div>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="mb-4">
                        <label className="text-xs text-gray-400 mb-2 block">Amount (KAS)</label>
                        <Input
                          type="number"
                          step="0.1"
                          min="1.0"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="1.0"
                          className="bg-zinc-900 border-zinc-700 text-white"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Minimum: 1 KAS - Valid for 24 hours
                        </p>
                      </div>

                      {/* Info Box */}
                      <div className="mb-4 bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                        <p className="text-xs text-green-300">
                          ✓ Sign message + pay 1 KAS to yourself<br/>
                          ✓ Go alive for 24 hours - visible to all users<br/>
                          ✓ Auto-expires after 24 hours - renew anytime
                        </p>
                      </div>

                      {/* Message */}
                      <div className="mb-6">
                        <label className="text-xs text-gray-400 mb-2 block">Message (Optional)</label>
                        <Textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="I'm alive and active! 💪"
                          maxLength={140}
                          className="bg-zinc-900 border-zinc-700 text-white h-20"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {message.length}/140 characters
                        </p>
                      </div>

                      {/* Submit */}
                      <Button
                        onClick={handleSubmitProof}
                        disabled={isSending || !selectedWallet}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                      >
                        {isSending ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Submitting Proof...
                          </>
                        ) : (
                          <>
                            <Zap className="w-5 h-5 mr-2" />
                            Go Alive Now
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}