
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Unlock, Loader2, X, Eye, EyeOff, CheckCircle2, Trophy, Key, Settings, ExternalLink, Diamond, ShoppingCart } from "lucide-react";

const rarityColors = {
  common: { bg: 'from-gray-500/20 to-gray-600/20', text: 'text-gray-300', border: 'border-gray-500/50', badgeBg: 'bg-gray-800', badgeText: 'text-white' },
  uncommon: { bg: 'from-green-500/20 to-emerald-600/20', text: 'text-green-300', border: 'border-green-500/50', badgeBg: 'bg-green-700', badgeText: 'text-white' },
  rare: { bg: 'from-blue-500/20 to-cyan-600/20', text: 'text-blue-300', border: 'border-blue-500/50', badgeBg: 'bg-blue-700', badgeText: 'text-white' },
  epic: { bg: 'from-purple-500/20 to-pink-600/20', text: 'text-purple-300', border: 'border-purple-500/50', badgeBg: 'bg-purple-700', badgeText: 'text-white' },
  legendary: { bg: 'from-yellow-500/20 to-orange-600/20', text: 'text-yellow-300', border: 'border-yellow-500/50', badgeBg: 'bg-gradient-to-r from-yellow-600 to-orange-600', badgeText: 'text-black' }
};

export default function VaultModal({ user, walletAddress, onClose, showToast }) {
  const [vault, setVault] = useState(null);
  const [vaultNFTs, setVaultNFTs] = useState([]);
  const [isLocked, setIsLocked] = useState(true);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [isRemovingFromShop, setIsRemovingFromShop] = useState(false);
  const [isRemovingFromVault, setIsRemovingFromVault] = useState(false);

  useEffect(() => {
    loadVault();
  }, []);

  const loadVault = async () => {
    try {
      const userVaults = await base44.entities.NFTVault.filter({
        user_email: user.email
      });

      if (userVaults.length > 0) {
        const userVault = userVaults[0];
        setVault(userVault);
        setIsLocked(userVault.is_locked && !!userVault.pin_hash);

        const allNFTs = await base44.entities.NFT.filter({
          owner_email: user.email,
          in_nft_vault: true
        });
        
        setVaultNFTs(allNFTs);
      } else {
        setVault(null);
        setVaultNFTs([]);
      }
    } catch (err) {
      console.error('Failed to load NFT vault:', err);
      showToast?.('Failed to load vault: ' + err.message, 'error');
    }
  };

  const handleSetPin = async () => {
    if (pin.length !== 6 || confirmPin.length !== 6) {
      showToast?.('PIN must be 6 digits', 'error');
      return;
    }

    if (pin !== confirmPin) {
      showToast?.('PINs do not match', 'error');
      return;
    }

    setIsSettingPin(true);

    try {
      console.log('🔐 Setting PIN for NFT vault...');
      const hashResponse = await base44.functions.invoke('hashPin', { pin });
      
      if (hashResponse.data?.success) {
        if (vault) {
          console.log('🔄 Updating existing NFT vault with PIN');
          await base44.entities.NFTVault.update(vault.id, {
            pin_hash: hashResponse.data.hash,
            is_locked: false
          });
        } else {
          console.log('🆕 Creating new NFT vault with PIN');
          
          const existingNFTs = await base44.entities.NFT.filter({
            owner_email: user.email,
            in_nft_vault: true
          });
          
          const nftIds = existingNFTs.map(n => n.id);
          const totalValue = existingNFTs.reduce((sum, n) => sum + (n.zeku_cost || 0), 0);
          
          console.log('📦 Creating NFT vault with', nftIds.length, 'existing NFTs');
          
          const newVault = await base44.entities.NFTVault.create({
            user_email: user.email,
            wallet_address: walletAddress,
            nft_ids: nftIds,
            total_nfts: nftIds.length,
            total_value_zeku: totalValue,
            is_locked: false,
            pin_hash: hashResponse.data.hash,
            vault_created: new Date().toISOString()
          });
          
          console.log('✅ NFT Vault created:', newVault.id);
          setVault(newVault);
        }

        showToast?.('✅ PIN set successfully!', 'success', 3000);
        setPin('');
        setConfirmPin('');
        setIsLocked(false);
        
        await loadVault();
      }
    } catch (err) {
      console.error('❌ Failed to set PIN:', err);
      showToast?.('Failed to set PIN: ' + err.message, 'error');
    } finally {
      setIsSettingPin(false);
    }
  };

  const handleUnlock = async () => {
    if (pin.length !== 6) {
      showToast?.('Enter 6-digit PIN', 'error');
      return;
    }

    setIsUnlocking(true);

    try {
      const hashResponse = await base44.functions.invoke('hashPin', { pin });
      
      if (hashResponse.data?.success) {
        if (hashResponse.data.hash === vault.pin_hash) {
          await base44.entities.NFTVault.update(vault.id, {
            is_locked: false,
            last_unlocked: new Date().toISOString(),
            unlock_attempts: 0
          });

          setIsLocked(false);
          showToast?.('✅ Vault unlocked!', 'success', 2000);
          setPin('');
          
          await loadVault();
        } else {
          const attempts = (vault.unlock_attempts || 0) + 1;
          await base44.entities.NFTVault.update(vault.id, {
            unlock_attempts: attempts
          });

          showToast?.(`❌ Incorrect PIN (${attempts} failed attempts)`, 'error');
          setPin('');
        }
      }
    } catch (err) {
      console.error('Failed to unlock:', err);
      showToast?.('Failed to unlock vault: ' + err.message, 'error');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleLock = async () => {
    try {
      await base44.entities.NFTVault.update(vault.id, {
        is_locked: true
      });
      setIsLocked(true);
      setShowSettings(false);
      showToast?.('🔒 Vault locked', 'success', 2000);
      await loadVault();
    } catch (err) {
      console.error('Failed to lock vault:', err);
      showToast?.('Failed to lock vault: ' + err.message, 'error');
    }
  };

  const handleChangePin = async () => {
    if (!currentPin || currentPin.length !== 6) {
      showToast?.('Enter current PIN', 'error');
      return;
    }

    if (newPin.length !== 6 || confirmNewPin.length !== 6) {
      showToast?.('New PIN must be 6 digits', 'error');
      return;
    }

    if (newPin !== confirmNewPin) {
      showToast?.('New PINs do not match', 'error');
      return;
    }

    if (newPin === currentPin) {
      showToast?.('New PIN must be different', 'error');
      return;
    }

    setIsChangingPin(true);

    try {
      const currentHashResponse = await base44.functions.invoke('hashPin', { pin: currentPin });
      
      if (currentHashResponse.data?.success) {
        if (currentHashResponse.data.hash !== vault.pin_hash) {
          showToast?.('❌ Incorrect current PIN', 'error');
          setIsChangingPin(false);
          return;
        }

        const newHashResponse = await base44.functions.invoke('hashPin', { pin: newPin });
        
        if (newHashResponse.data?.success) {
          await base44.entities.NFTVault.update(vault.id, {
            pin_hash: newHashResponse.data.hash
          });

          showToast?.('✅ PIN changed successfully!', 'success', 3000);
          setCurrentPin('');
          setNewPin('');
          setConfirmNewPin('');
          setShowSettings(false);
          await loadVault();
        }
      }
    } catch (err) {
      console.error('Failed to change PIN:', err);
      showToast?.('Failed to change PIN: ' + err.message, 'error');
    } finally {
      setIsChangingPin(false);
    }
  };

  const handleRemoveFromVault = async (nft) => {
    if (!confirm('Remove this NFT from vault?\n\nIt will appear in "My NFTs" where you can edit or publish it.')) return;

    setIsRemovingFromVault(true);
    try {
      console.log('📤 Removing NFT from vault:', nft.id);
      
      // Remove from vault's NFT list
      const updatedNftIds = (vault.nft_ids || []).filter(id => id !== nft.id);
      
      await base44.entities.NFTVault.update(vault.id, {
        nft_ids: updatedNftIds,
        total_nfts: updatedNftIds.length,
        total_value_zeku: Math.max(0, (vault.total_value_zeku || 0) - (nft.zeku_cost || 0))
      });

      // Mark NFT as not in vault
      await base44.entities.NFT.update(nft.id, {
        in_nft_vault: false,
        vault_id: null
      });

      showToast?.('✅ NFT removed from vault!\n\nYou can now edit or publish it from "My NFTs".', 'success', 5000);
      setSelectedNFT(null);
      await loadVault();
    } catch (err) {
      console.error('Failed to remove from vault:', err);
      showToast?.('Failed to remove from vault: ' + err.message, 'error');
    } finally {
      setIsRemovingFromVault(false);
    }
  };

  const handleRemoveFromShop = async (nft) => {
    if (!confirm('Are you sure you want to remove this NFT from your shop listing?')) return;

    setIsRemovingFromShop(true);
    try {
      const shopItems = await base44.entities.ShopItem.filter({
        seller_email: user.email
      });

      const nftShopItem = shopItems.find(item => 
        item.tags && item.tags.includes(nft.token_id)
      );

      if (nftShopItem) {
        await base44.entities.ShopItem.delete(nftShopItem.id);
      }

      await base44.entities.NFT.update(nft.id, {
        is_listed: false
      });

      showToast?.('✅ NFT removed from shop!', 'success', 3000);
      setSelectedNFT(null);
      await loadVault();
    } catch (err) {
      console.error('Failed to remove from shop:', err);
      showToast?.('Failed to remove from shop: ' + err.message, 'error');
    } finally {
      setIsRemovingFromShop(false);
    }
  };

  const hasPinSet = vault && vault.pin_hash;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        <Card className="bg-black border-white/20">
          <CardContent className="p-0">
            <div className="border-b border-white/10 p-6 flex items-center justify-between bg-gradient-to-r from-purple-500/10 to-pink-500/10">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-purple-400" />
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">NFT Vault</h2>
                  <p className="text-sm text-gray-400">
                    {vaultNFTs.length} NFTs • {vaultNFTs.reduce((sum, nft) => sum + (nft.zeku_cost || 0), 0).toFixed(2)} ZEKU Value
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasPinSet && !isLocked && (
                  <Button
                    onClick={() => setShowSettings(!showSettings)}
                    size="sm"
                    variant="outline"
                    className="border-white/20 text-white bg-white/5 hover:bg-white/10"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                )}
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="p-6">
                <div className="mb-6 flex items-center justify-center">
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
                </div>

                {showSettings && !isLocked && (
                  <Card className="bg-yellow-500/10 border-yellow-500/30 mb-6">
                    <CardContent className="p-6 space-y-4">
                      <h3 className="text-white font-bold flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Vault Settings
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">Current PIN</label>
                          <Input
                            type={showPin ? "text" : "password"}
                            inputMode="numeric"
                            maxLength={6}
                            value={currentPin}
                            onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                            placeholder="••••••"
                            className="bg-black border-yellow-500/30 text-white text-center text-lg font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">New PIN (6 digits)</label>
                          <Input
                            type={showPin ? "text" : "password"}
                            inputMode="numeric"
                            maxLength={6}
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                            placeholder="••••••"
                            className="bg-black border-yellow-500/30 text-white text-center text-lg font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">Confirm New PIN</label>
                          <Input
                            type={showPin ? "text" : "password"}
                            inputMode="numeric"
                            maxLength={6}
                            value={confirmNewPin}
                            onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
                            placeholder="••••••"
                            className="bg-black border-yellow-500/30 text-white text-center text-lg font-mono"
                          />
                        </div>

                        <button
                          onClick={() => setShowPin(!showPin)}
                          className="text-gray-400 hover:text-white text-sm flex items-center gap-2"
                        >
                          {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          {showPin ? 'Hide' : 'Show'} PINs
                        </button>

                        <div className="flex gap-3">
                          <Button
                            onClick={handleChangePin}
                            disabled={isChangingPin || currentPin.length !== 6 || newPin.length !== 6 || confirmNewPin.length !== 6}
                            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black"
                          >
                            {isChangingPin ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Changing...
                              </>
                            ) : (
                              <>
                                <Key className="w-4 h-4 mr-2" />
                                Change PIN
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => {
                              setShowSettings(false);
                              setCurrentPin('');
                              setNewPin('');
                              setConfirmNewPin('');
                            }}
                            variant="outline"
                            className="border-white/20 text-white"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!hasPinSet && !showSettings && (
                  <Card className="bg-purple-500/10 border-purple-500/30 mb-6">
                    <CardContent className="p-6 space-y-4">
                      <div className="text-center mb-4">
                        <h3 className="text-white font-bold text-xl mb-2">🔐 Secure Your Vault</h3>
                        <p className="text-gray-400 text-sm">Create a 6-digit PIN to protect your NFTs</p>
                      </div>
                      <Input 
                        type="password" 
                        inputMode="numeric"
                        maxLength={6} 
                        value={pin} 
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} 
                        placeholder="Enter PIN (6 digits)" 
                        className="bg-black border-zinc-800 text-white text-center text-lg"
                      />
                      <Input 
                        type="password" 
                        inputMode="numeric"
                        maxLength={6} 
                        value={confirmPin} 
                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))} 
                        placeholder="Confirm PIN" 
                        className="bg-black border-zinc-800 text-white text-center text-lg"
                      />
                      <Button 
                        onClick={handleSetPin} 
                        disabled={isSettingPin || pin.length !== 6 || pin !== confirmPin} 
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white h-12"
                      >
                        {isSettingPin ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Setting PIN...
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4 mr-2" />
                            Set PIN & Unlock Vault
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {hasPinSet && isLocked && !showSettings && (
                  <Card className="bg-red-500/10 border-red-500/30 mb-6">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-6">
                        <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Lock className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-white mb-2">Vault Locked</h2>
                          <p className="text-gray-400 text-sm">
                            Enter your 6-digit PIN to unlock your NFT Vault
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
                )}

                {!isLocked && !showSettings && (
                  <>
                    <div className="mb-6 flex justify-end">
                      <Button
                        onClick={handleLock}
                        size="sm"
                        className="bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Lock Vault
                      </Button>
                    </div>

                    {vaultNFTs.length === 0 ? (
                      <div className="text-center py-12">
                        <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No NFTs in Vault</h3>
                        <p className="text-gray-400 text-sm mb-4">
                          Your purchased NFTs will appear here automatically
                        </p>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {vaultNFTs.map((nft, index) => {
                          const rarity = nft.metadata?.rarity || nft.rarity || 'common';
                          const rarityStyle = rarityColors[rarity.toLowerCase()] || rarityColors.common;
                          const isInShop = nft.is_listed;
                          
                          return (
                            <motion.div
                              key={nft.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.05 }}
                              whileHover={{ scale: 1.03 }}
                              className="cursor-pointer"
                              onClick={() => setSelectedNFT(nft)}
                            >
                              <Card className={`bg-gradient-to-br ${rarityStyle.bg} border ${rarityStyle.border} hover:border-white/50 transition-all overflow-hidden shadow-lg`}>
                                <CardContent className="p-0">
                                  <div className="aspect-square relative">
                                    <img
                                      src={nft.image_url}
                                      alt={nft.metadata?.name}
                                      className="w-full h-full object-cover"
                                    />
                                    
                                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                                      <Badge className={`${rarityStyle.badgeBg} ${rarityStyle.badgeText} border-none font-extrabold text-xs shadow-2xl px-3 py-1`}>
                                        {rarity.toUpperCase()}
                                      </Badge>
                                      {isInShop ? (
                                        <Badge className="bg-green-700 text-white border-none font-bold text-xs px-2 py-1 shadow-2xl">
                                          <ShoppingCart className="w-3 h-3 mr-1" />
                                          In Shop
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-purple-700 text-white border-none font-bold text-xs px-2 py-1 shadow-2xl">
                                          <CheckCircle2 className="w-3 h-3 mr-1" />
                                          Secured
                                        </Badge>
                                      )}
                                    </div>

                                    <div className="absolute bottom-2 right-2">
                                      <Badge className="bg-black text-white border-none font-bold shadow-2xl flex items-center gap-1.5 px-3 py-1.5">
                                        <Diamond className="w-4 h-4" strokeWidth={2.5} />
                                        <span className="text-sm">{nft.zeku_cost} ZEKU</span>
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  <div className="p-4 bg-black/40 backdrop-blur-sm">
                                    <h3 className="text-white font-bold mb-2 truncate">
                                      {nft.metadata?.name || 'Untitled NFT'}
                                    </h3>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-gray-400">
                                        {new Date(nft.sold_at || nft.minted_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <AnimatePresence>
        {selectedNFT && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
            onClick={() => setSelectedNFT(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-950 border border-purple-500/50 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="aspect-square rounded-xl overflow-hidden mb-4 border-2 border-purple-500/30">
                <img
                  src={selectedNFT.image_url}
                  alt={selectedNFT.metadata?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-4">
                {selectedNFT.metadata?.name || 'Untitled NFT'}
              </h2>
              
              <div className="space-y-3 text-sm bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Purchase Price:</span>
                  <span className="text-purple-400 font-bold flex items-center gap-1">
                    <Diamond className="w-3 h-3" strokeWidth={2.5} />
                    {selectedNFT.zeku_cost} ZEKU
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Rarity:</span>
                  <Badge className={`${rarityColors[(selectedNFT.metadata?.rarity || selectedNFT.rarity || 'common').toLowerCase()]?.badgeBg} ${rarityColors[(selectedNFT.metadata?.rarity || selectedNFT.rarity || 'common').toLowerCase()]?.badgeText} border-none font-extrabold text-xs px-2 py-1 shadow-lg`}>
                    {(selectedNFT.metadata?.rarity || selectedNFT.rarity || 'common').toUpperCase()}
                  </Badge>
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
                {selectedNFT.sale_transaction && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Purchase TX:</span>
                    <a
                      href={`https://explorer.kasplex.org/tx/${selectedNFT.sale_transaction}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-xs"
                    >
                      View <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {selectedNFT.is_listed && (
                  <div className="flex justify-between items-center pt-2 border-t border-white/10">
                    <span className="text-gray-400">Status:</span>
                    <Badge className="bg-green-700 text-white border-none font-bold text-xs">
                      <ShoppingCart className="w-3 h-3 mr-1" />
                      Listed in Shop
                    </Badge>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => handleRemoveFromVault(selectedNFT)}
                  disabled={isRemovingFromVault}
                  className="flex-1 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30"
                >
                  {isRemovingFromVault ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Remove from Vault
                    </>
                  )}
                </Button>
                
                {selectedNFT.is_listed && (
                  <Button
                    onClick={() => handleRemoveFromShop(selectedNFT)}
                    disabled={isRemovingFromShop}
                    className="flex-1 bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30"
                  >
                    {isRemovingFromShop ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Removing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Remove from Shop
                      </>
                    )}
                  </Button>
                )}
                
                <Button
                  onClick={() => setSelectedNFT(null)}
                  className="flex-1 bg-white/10 hover:bg-white/20"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
