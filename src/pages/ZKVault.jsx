import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Lock, Unlock, Shield, Loader2, Eye, EyeOff, CheckCircle2, Trophy, Sparkles, Key, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ZKVaultPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [vault, setVault] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(true);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Load vault
      const vaults = await base44.entities.ZKVault.filter({
        user_email: currentUser.email
      });

      if (vaults.length > 0) {
        const userVault = vaults[0];
        setVault(userVault);
        setIsLocked(userVault.is_locked);

        // Load NFTs in vault
        if (userVault.nft_ids && userVault.nft_ids.length > 0) {
          const allNFTs = await base44.entities.NFT.list();
          const vaultNFTs = allNFTs.filter(nft => userVault.nft_ids.includes(nft.id));
          setNfts(vaultNFTs);
        }
      }
    } catch (err) {
      console.error('Failed to load vault:', err);
      setError('Failed to load vault data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPin = async () => {
    if (pin.length !== 6 || confirmPin.length !== 6) {
      setError('PIN must be 6 digits');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setIsSettingPin(true);
    setError(null);

    try {
      // Hash the PIN
      const hashResponse = await base44.functions.invoke('hashPin', { pin });
      
      if (hashResponse.data?.success) {
        // Update vault with hashed PIN
        await base44.entities.ZKVault.update(vault.id, {
          pin_hash: hashResponse.data.hash
        });

        setSuccess('✅ PIN set successfully!');
        setPin('');
        setConfirmPin('');
        await loadData();
      }
    } catch (err) {
      console.error('Failed to set PIN:', err);
      setError('Failed to set PIN. Please try again.');
    } finally {
      setIsSettingPin(false);
    }
  };

  const handleUnlock = async () => {
    if (pin.length !== 6) {
      setError('Enter 6-digit PIN');
      return;
    }

    setIsUnlocking(true);
    setError(null);

    try {
      // Hash the entered PIN
      const hashResponse = await base44.functions.invoke('hashPin', { pin });
      
      if (hashResponse.data?.success) {
        // Compare with stored hash
        if (hashResponse.data.hash === vault.pin_hash) {
          // Unlock vault
          await base44.entities.ZKVault.update(vault.id, {
            is_locked: false,
            last_unlocked: new Date().toISOString(),
            unlock_attempts: 0
          });

          setIsLocked(false);
          setSuccess('✅ Vault unlocked!');
          setPin('');
        } else {
          // Increment unlock attempts
          const attempts = (vault.unlock_attempts || 0) + 1;
          await base44.entities.ZKVault.update(vault.id, {
            unlock_attempts: attempts
          });

          setError(`❌ Incorrect PIN (${attempts} failed attempts)`);
          setPin('');
        }
      }
    } catch (err) {
      console.error('Failed to unlock:', err);
      setError('Failed to unlock vault');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleLock = async () => {
    try {
      await base44.entities.ZKVault.update(vault.id, {
        is_locked: true
      });
      setIsLocked(true);
      setSuccess('🔒 Vault locked');
    } catch (err) {
      console.error('Failed to lock vault:', err);
      setError('Failed to lock vault');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-zinc-950 border-zinc-800 max-w-md">
          <CardContent className="p-8 text-center">
            <Lock className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
            <Button onClick={() => base44.auth.redirectToLogin()} className="bg-cyan-500">
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!vault) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 p-6 md:p-8 lg:p-12">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-black border-zinc-800">
              <CardContent className="p-12 text-center">
                <Shield className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">No ZK Vault Found</h2>
                <p className="text-gray-400 mb-6">
                  Your ZK Vault will be created automatically when you purchase your first NFT.
                </p>
                <Button
                  onClick={() => navigate(createPageUrl("Shop"))}
                  className="bg-gradient-to-r from-purple-500 to-pink-500"
                >
                  Browse Shop
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
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
          className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px]"
        />
      </div>

      <div className="relative z-10 p-6 md:p-8 lg:p-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/50">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">ZK Vault</h1>
                <p className="text-gray-400">Secure NFT Storage</p>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <Badge className={`${isLocked ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-green-500/20 text-green-300 border-green-500/30'} px-4 py-2`}>
                {isLocked ? (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Locked
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4 mr-2" />
                    Unlocked
                  </>
                )}
              </Badge>
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 px-4 py-2">
                <Trophy className="w-4 h-4 mr-2" />
                {vault.total_nfts || 0} NFTs
              </Badge>
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 px-4 py-2">
                <Sparkles className="w-4 h-4 mr-2" />
                {vault.total_value_zeku || 0} ZEKU Value
              </Badge>
            </div>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-4"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-300">{error}</span>
              </div>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 bg-green-500/10 border border-green-500/30 rounded-lg p-4"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span className="text-green-300">{success}</span>
              </div>
            </motion.div>
          )}

          {!vault.pin_hash ? (
            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30 mb-8">
              <CardContent className="p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Key className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Set Your PIN</h2>
                    <p className="text-gray-400">
                      Create a 6-digit PIN to secure your ZK Vault
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Enter PIN (6 digits)</label>
                    <div className="relative">
                      <Input
                        type={showPin ? "text" : "password"}
                        inputMode="numeric"
                        maxLength={6}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••••"
                        className="bg-black border-purple-500/30 text-white text-center text-2xl font-mono tracking-widest h-14"
                      />
                      <button
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Confirm PIN</label>
                    <Input
                      type={showPin ? "text" : "password"}
                      inputMode="numeric"
                      maxLength={6}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      className="bg-black border-purple-500/30 text-white text-center text-2xl font-mono tracking-widest h-14"
                    />
                  </div>

                  <Button
                    onClick={handleSetPin}
                    disabled={isSettingPin || pin.length !== 6 || confirmPin.length !== 6}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-12"
                  >
                    {isSettingPin ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Setting PIN...
                      </>
                    ) : (
                      <>
                        <Key className="w-5 h-5 mr-2" />
                        Set PIN
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : isLocked ? (
            <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/30 mb-8">
              <CardContent className="p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Lock className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Vault Locked</h2>
                    <p className="text-gray-400">
                      Enter your 6-digit PIN to unlock your ZK Vault
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Enter PIN</label>
                    <div className="relative">
                      <Input
                        type={showPin ? "text" : "password"}
                        inputMode="numeric"
                        maxLength={6}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
                        placeholder="••••••"
                        className="bg-black border-red-500/30 text-white text-center text-2xl font-mono tracking-widest h-14"
                      />
                      <button
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    onClick={handleUnlock}
                    disabled={isUnlocking || pin.length !== 6}
                    className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 h-12"
                  >
                    {isUnlocking ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Unlocking...
                      </>
                    ) : (
                      <>
                        <Unlock className="w-5 h-5 mr-2" />
                        Unlock Vault
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="mb-8 flex justify-end">
              <Button
                onClick={handleLock}
                className="bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30"
              >
                <Lock className="w-4 h-4 mr-2" />
                Lock Vault
              </Button>
            </div>
          )}

          {!isLocked && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Your NFTs</h2>
              
              {nfts.length === 0 ? (
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-12 text-center">
                    <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No NFTs Yet</h3>
                    <p className="text-gray-400 mb-6">
                      Purchase NFTs from the shop to add them to your vault
                    </p>
                    <Button
                      onClick={() => navigate(createPageUrl("Shop"))}
                      className="bg-gradient-to-r from-purple-500 to-pink-500"
                    >
                      Browse Shop
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {nfts.map((nft) => (
                    <motion.div
                      key={nft.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.02 }}
                      className="cursor-pointer"
                      onClick={() => setSelectedNFT(nft)}
                    >
                      <Card className="bg-white/5 border-white/10 hover:border-purple-500/50 transition-all overflow-hidden">
                        <CardContent className="p-0">
                          <div className="aspect-square relative">
                            <img
                              src={nft.image_url}
                              alt={nft.metadata?.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            </div>
                          </div>
                          <div className="p-4">
                            <h3 className="text-white font-bold mb-2 truncate">
                              {nft.metadata?.name || 'Untitled NFT'}
                            </h3>
                            <div className="flex items-center justify-between">
                              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                                {nft.zeku_cost} ZEKU
                              </Badge>
                              <span className="text-xs text-gray-400">
                                {new Date(nft.sold_at || nft.minted_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedNFT && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedNFT(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-950 border border-purple-500/50 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="aspect-square rounded-xl overflow-hidden mb-4">
                <img
                  src={selectedNFT.image_url}
                  alt={selectedNFT.metadata?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-4">
                {selectedNFT.metadata?.name || 'Untitled NFT'}
              </h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Purchase Price:</span>
                  <span className="text-purple-400 font-bold">{selectedNFT.zeku_cost} ZEKU</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Acquired:</span>
                  <span className="text-white">
                    {new Date(selectedNFT.sold_at || selectedNFT.minted_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Token ID:</span>
                  <code className="text-cyan-400 text-xs">
                    {selectedNFT.token_id?.substring(0, 16)}...
                  </code>
                </div>
              </div>

              <Button
                onClick={() => setSelectedNFT(null)}
                className="w-full mt-6 bg-white/10 hover:bg-white/20"
              >
                Close
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}