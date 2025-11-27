
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Wallet, CheckCircle2, AlertCircle, Loader2, Smartphone, ExternalLink, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ConnectWalletPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [kaswareAddress, setKaswareAddress] = useState(null);
  const [metamaskAddress, setMetamaskAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showMobileInstructions, setShowMobileInstructions] = useState(false);

  // Detect if user is on mobile
  const isMobile = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return /android|iphone|ipad|ipod|blackberry|windows phone/i.test(userAgent.toLowerCase()) || (window.innerWidth <= 768);
  };

  useEffect(() => {
    loadUser();
    checkExistingConnections();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      setUsername(currentUser.username || "");
      setKaswareAddress(currentUser.kasware_address || null);
      setMetamaskAddress(currentUser.metamask_address || null);
    } catch (err) {
      console.error('Failed to load user:', err);
    }
  };

  const checkExistingConnections = async () => {
    // Check if MetaMask is already connected
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setMetamaskAddress(accounts[0]);
        }
      } catch (err) {
        console.error('Failed to check existing MetaMask connection:', err);
      }
    }

    // Check if Kasware is already connected
    if (typeof window.kasware !== 'undefined') {
      try {
        const accounts = await window.kasware.getAccounts();
        if (accounts.length > 0) {
          setKaswareAddress(accounts[0]);
        }
      } catch (err) {
        console.error('Failed to check existing Kasware connection:', err);
      }
    }
  };

  // EXISTING BUTTONS - DO NOT MODIFY THESE FUNCTIONS
  const connectMetaMask = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('MetaMask not installed. Please install MetaMask extension or open this page in MetaMask Mobile browser.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setMetamaskAddress(accounts[0]);
      setSuccess('MetaMask connected! Address: ' + accounts[0].substring(0, 10) + '...');
    } catch (err) {
      setError('Failed to connect MetaMask: ' + err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const connectKasware = async () => {
    if (typeof window.kasware === 'undefined') {
      setError('Kasware not installed. Please install Kasware extension.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = await window.kasware.requestAccounts();
      setKaswareAddress(accounts[0]);
      setSuccess('Kasware connected! Address: ' + accounts[0].substring(0, 10) + '...');
    } catch (err) {
      setError('Failed to connect Kasware: ' + err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  // NEW: Mobile wallet instructions handler
  const handleMobileWalletClick = () => {
    setShowMobileInstructions(!showMobileInstructions);
  };

  const handleSave = async () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (!metamaskAddress && !kaswareAddress) {
      setError('Please connect at least one wallet');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await User.updateMyUserData({
        username: username.trim(),
        metamask_address: metamaskAddress,
        kasware_address: kaswareAddress
      });

      setSuccess('✅ Profile saved! Redirecting to marketplace...');
      
      setTimeout(() => {
        navigate(createPageUrl("Marketplace"));
      }, 2000);

    } catch (err) {
      setError('Failed to save profile: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative z-10 p-6 md:p-8 lg:p-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 text-center"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/50">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
              Connect Your Identity
            </h1>
            <p className="text-gray-400 text-lg">
              Link your wallets and create a marketplace profile
            </p>
          </motion.div>

          {/* Error/Success Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="backdrop-blur-xl bg-red-500/20 border-red-500/30">
                <CardContent className="p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="backdrop-blur-xl bg-green-500/20 border-green-500/30">
                <CardContent className="p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-300">{success}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="backdrop-blur-xl bg-white/5 border-white/10">
              <CardHeader className="border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Your Profile</h2>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Username */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Username (Display Name)</label>
                  <Input
                    placeholder="e.g., KaspaTrader123"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-lg placeholder:text-gray-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">This name will be shown on your listings</p>
                </div>

                {/* EXISTING DESKTOP WALLET BUTTONS - UNCHANGED */}
                {/* MetaMask */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">MetaMask (L2) Wallet - Desktop</label>
                  {metamaskAddress ? (
                    <div className="backdrop-blur-xl bg-green-500/20 border border-green-500/30 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        <div>
                          <div className="text-white font-mono text-sm">{metamaskAddress.substring(0, 20)}...</div>
                          <div className="text-xs text-green-400">Connected</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={connectMetaMask}
                      disabled={isConnecting}
                      className="w-full backdrop-blur-xl bg-white/5 border border-cyan-500/30 hover:bg-white/10 hover:border-cyan-500/50 text-white h-12"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Wallet className="w-5 h-5 mr-2" />
                          Connect MetaMask
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Kasware */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Kasware (L1) Wallet - Desktop</label>
                  {kaswareAddress ? (
                    <div className="backdrop-blur-xl bg-green-500/20 border border-green-500/30 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        <div>
                          <div className="text-white font-mono text-sm">{kaswareAddress.substring(0, 30)}...</div>
                          <div className="text-xs text-green-400">Connected</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={connectKasware}
                      disabled={isConnecting}
                      className="w-full backdrop-blur-xl bg-white/5 border border-orange-500/30 hover:bg-white/10 hover:border-orange-500/50 text-white h-12"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Wallet className="w-5 h-5 mr-2" />
                          Connect Kasware
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* NEW: Mobile Wallet Instructions */}
                {isMobile() && (
                  <div className="pt-4 border-t border-white/10">
                    <label className="text-sm text-gray-400 mb-2 block">Mobile Wallet (L2 Only)</label>
                    <Button
                      onClick={handleMobileWalletClick}
                      className="w-full backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white h-12"
                    >
                      <Smartphone className="w-5 h-5 mr-2" />
                      Connect Mobile Wallet
                    </Button>
                    
                    {showMobileInstructions && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-blue-200 mb-2">How to connect on mobile:</p>
                            <ol className="text-xs text-blue-300 space-y-2 list-decimal list-inside">
                              <li>Open your mobile wallet app (MetaMask, Trust Wallet, etc.)</li>
                              <li>Find the built-in browser inside your wallet app</li>
                              <li>Navigate to this website in the wallet browser</li>
                              <li>Click "Connect MetaMask" above - it will work automatically!</li>
                            </ol>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* NEW: External Bridge Links */}
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <label className="text-sm text-gray-400 mb-2 block">Or use official bridges:</label>
                  
                  <a 
                    href="https://bridge.kasplex.org" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button
                      variant="outline"
                      className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 h-12"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Transform → Kasplex Bridge
                    </Button>
                  </a>

                  <a 
                    href="https://kaskat.io" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button
                      variant="outline"
                      className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 h-12"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Transform → Kaskat Bridge
                    </Button>
                  </a>
                </div>

                {/* Save Button */}
                <Button
                  onClick={handleSave}
                  disabled={isSaving || (!metamaskAddress && !kaswareAddress)}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white disabled:opacity-50 shadow-lg shadow-cyan-500/50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Profile & Continue'
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
