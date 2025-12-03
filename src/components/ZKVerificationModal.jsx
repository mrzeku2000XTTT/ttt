import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, Loader2, CheckCircle, Copy, AlertCircle, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function ZKVerificationModal({ isOpen, onClose, currentUser }) {
  const [kaswareAddress, setKaswareAddress] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState("");
  const [lastChecked, setLastChecked] = useState(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      loadKaswareAddress();
      checkExistingVerification();
    }
  }, [isOpen, currentUser]);

  useEffect(() => {
    if (isOpen && isVerifying && kaswareAddress) {
      const interval = setInterval(checkForVerification, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, isVerifying, kaswareAddress]);

  const loadKaswareAddress = async () => {
    try {
      // Get user's Kasware address from their profile
      const address = currentUser?.created_wallet_address;
      if (address) {
        setKaswareAddress(address);
      } else {
        setError("No Kasware wallet found. Please connect on desktop first.");
      }
    } catch (err) {
      console.error("Failed to load wallet:", err);
      setError("Failed to load wallet address");
    }
  };

  const checkExistingVerification = async () => {
    try {
      const verifications = await base44.entities.WalletVerification.filter({
        user_email: currentUser.email,
        is_verified: true
      }, '-created_date', 1);

      if (verifications.length > 0) {
        const latestVerification = verifications[0];
        const verificationTime = new Date(latestVerification.created_date).getTime();
        const now = Date.now();
        const hoursSinceVerification = (now - verificationTime) / (1000 * 60 * 60);

        // Verification valid for 24 hours
        if (hoursSinceVerification < 24) {
          setIsVerified(true);
          localStorage.setItem(`zk_verified_${currentUser.email}`, 'true');
        }
      }
    } catch (err) {
      console.error("Failed to check verification:", err);
    }
  };

  const startVerification = () => {
    setIsVerifying(true);
    setError("");
  };

  const checkForVerification = async () => {
    if (!kaswareAddress || !currentUser) return;

    try {
      setLastChecked(new Date());

      // Check for incoming 1 KAS transaction in last 10 minutes
      const response = await base44.functions.invoke('verifyZKTransaction', {
        wallet_address: kaswareAddress,
        user_email: currentUser.email
      });

      if (response.data.verified) {
        setIsVerified(true);
        setIsVerifying(false);
        localStorage.setItem(`zk_verified_${currentUser.email}`, 'true');

        // Create verification record
        await base44.entities.WalletVerification.create({
          user_email: currentUser.email,
          wallet_address: kaswareAddress,
          verification_method: 'zk_ios',
          is_verified: true
        });
      }
    } catch (err) {
      console.error("Verification check failed:", err);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(kaswareAddress);
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-[9999]';
    notification.textContent = 'Address copied!';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-black border border-white/20 rounded-xl w-full max-w-md max-h-[85vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 bg-black z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">ZK Connect</h3>
                <p className="text-white/60 text-xs">iOS Wallet Verification</p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-red-400 font-semibold text-sm">Error</div>
                  <p className="text-white/80 text-xs mt-1">{error}</p>
                </div>
              </div>
            )}

            {isVerified ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <div>
                    <div className="text-green-400 font-bold text-lg">Verified!</div>
                    <p className="text-white/60 text-xs">You can now access all pages</p>
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 mt-3">
                  <div className="text-white/60 text-xs mb-1">Connected Wallet</div>
                  <div className="text-white font-mono text-sm break-all">{kaswareAddress}</div>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="text-white font-semibold text-sm mb-2">📱 How it works:</div>
                  <ol className="text-white/70 text-xs space-y-2 list-decimal list-inside">
                    <li>Your desktop/Android Kasware wallet address is shown below</li>
                    <li>Send exactly <span className="text-cyan-400 font-bold">1 KAS</span> from your iOS Kaspium wallet</li>
                    <li>Send to your own wallet address (the one below)</li>
                    <li>System verifies the transaction automatically</li>
                    <li>Once verified, you get full access for 24 hours</li>
                  </ol>
                </div>

                {kaswareAddress && (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <div className="text-white/60 text-xs mb-3">Your Kasware Wallet Address</div>

                    {/* Address Text */}
                    <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/30 rounded-lg p-4 mb-3">
                      <div className="text-white font-mono text-sm break-all mb-3 text-center">
                        {kaswareAddress}
                      </div>
                      <Button
                        onClick={copyAddress}
                        size="sm"
                        className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white font-semibold"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Address
                      </Button>
                    </div>

                    {/* Verification Instructions */}
                    <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/30 rounded-lg p-3">
                      <div className="flex items-start gap-2 mb-2">
                        <Wallet className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-cyan-400 font-semibold text-xs">Send from Kaspium</div>
                          <p className="text-white/70 text-xs mt-1">
                            Open Kaspium on your iOS device and send exactly <span className="text-cyan-400 font-bold">1 KAS</span> to the address above.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!isVerifying ? (
                  <Button
                    onClick={startVerification}
                    disabled={!kaswareAddress}
                    className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white font-bold h-12"
                  >
                    <Shield className="w-5 h-5 mr-2" />
                    Start Verification
                  </Button>
                ) : (
                  <div className="bg-white/5 border border-cyan-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                      <div>
                        <div className="text-cyan-400 font-semibold text-sm">Listening for transaction...</div>
                        <p className="text-white/60 text-xs">Send 1 KAS from your Kaspium now</p>
                      </div>
                    </div>
                    {lastChecked && (
                      <div className="text-white/40 text-xs">
                        Last checked: {lastChecked.toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-white/60">
                  <span className="text-purple-400 font-semibold">Why ZK Connect?</span>
                  <br />
                  iOS doesn't allow Kasware extension. This lets you verify your identity by sending 1 KAS from your mobile Kaspium wallet to your desktop Kasware wallet.
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}