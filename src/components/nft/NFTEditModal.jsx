import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShoppingCart, Heart, MapPin, Package, Truck, Shield, Star, Check, Loader2, ExternalLink, Zap, CheckCircle2, Wallet, Copy, RotateCcw, Diamond } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const getErrorMessage = (error) => {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (error.reason) return error.reason;
  return 'Unknown error';
};

const rarityColors = {
  common: { bg: 'from-gray-500/20 to-gray-600/20', text: 'text-gray-300', border: 'border-gray-500/50', badgeBg: 'bg-gray-800', badgeText: 'text-white' },
  uncommon: { bg: 'from-green-500/20 to-emerald-600/20', text: 'text-green-300', border: 'border-green-500/50', badgeBg: 'bg-green-700', badgeText: 'text-white' },
  rare: { bg: 'from-blue-500/20 to-cyan-600/20', text: 'text-blue-300', border: 'border-blue-500/50', badgeBg: 'bg-blue-700', badgeText: 'text-white' },
  epic: { bg: 'from-purple-500/20 to-pink-600/20', text: 'text-purple-300', border: 'border-purple-500/50', badgeBg: 'bg-purple-700', badgeText: 'text-white' },
  legendary: { bg: 'from-yellow-500/20 to-orange-600/20', text: 'text-yellow-300', border: 'border-yellow-500/50', badgeBg: 'bg-gradient-to-r from-yellow-600 to-orange-600', badgeText: 'text-black' }
};

export default function NFTEditModal({ nft, onClose, onUpdate, showToast }) {
  const navigate = useNavigate();
  const [nftTitle, setNftTitle] = useState(nft.metadata?.name || '');
  const [listPrice, setListPrice] = useState(nft.list_price || '');
  const [isListed, setIsListed] = useState(nft.is_listed || false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPushingToVault, setIsPushingToVault] = useState(false);
  const [showBack, setShowBack] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [tttWalletAddress, setTttWalletAddress] = useState('');
  const [metamaskAddress, setMetamaskAddress] = useState('');
  const [agentProfile, setAgentProfile] = useState(null);
  const [isConnectingMetaMask, setIsConnectingMetaMask] = useState(false);

  useEffect(() => {
    loadWallets();
    loadAgentProfile();
  }, []);

  const loadAgentProfile = async () => {
    try {
      const currentUser = await base44.auth.me();
      const profiles = await base44.entities.AgentZKProfile.filter({
        user_email: currentUser.email
      });
      if (profiles.length > 0) {
        setAgentProfile(profiles[0]);
      }
    } catch (err) {
      console.error('Failed to load agent profile:', err);
    }
  };

  const loadWallets = async () => {
    try {
      const currentUser = await base44.auth.me();
      
      console.log('📍 Loading wallets for publishing...');
      
      // Load TTT Wallet
      if (currentUser?.created_wallet_address) {
        setTttWalletAddress(currentUser.created_wallet_address);
        console.log('✅ TTT Wallet:', currentUser.created_wallet_address);
      }
      
      // Check if MetaMask is connected
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setMetamaskAddress(accounts[0]);
            console.log('✅ MetaMask connected:', accounts[0]);
          } else {
            console.log('⚠️ MetaMask not connected');
          }
        } catch (err) {
          console.log('MetaMask not available:', err);
        }
      } else {
        console.log('⚠️ MetaMask not installed');
      }
    } catch (err) {
      console.error('Failed to load wallets:', err);
    }
  };

  const connectMetaMask = async () => {
    if (typeof window.ethereum === 'undefined') {
      showToast?.('MetaMask not found! Please install MetaMask extension.', 'error');
      return;
    }

    setIsConnectingMetaMask(true);

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setMetamaskAddress(accounts[0]);
        console.log('✅ MetaMask connected:', accounts[0]);
        showToast?.('MetaMask connected successfully!', 'success', 3000);
      }
    } catch (err) {
      console.error('Failed to connect MetaMask:', err);
      showToast?.('Failed to connect MetaMask: ' + getErrorMessage(err), 'error');
    } finally {
      setIsConnectingMetaMask(false);
    }
  };

  const handleSave = async () => {
    if (!nftTitle.trim()) {
      showToast?.('Please enter a title!', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await base44.entities.NFT.update(nft.id, {
        metadata: {
          ...nft.metadata,
          name: nftTitle.trim()
        },
        list_price: parseFloat(listPrice) || 0,
        is_listed: isListed
      });

      showToast?.('NFT updated successfully!', 'success', 3000);
      onUpdate?.();
      onClose();
    } catch (err) {
      console.error('Failed to update NFT:', err);
      showToast?.(`Update failed\n\n${getErrorMessage(err)}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePushToVault = async () => {
    if (!nftTitle.trim()) {
      showToast?.('Please enter a title first!', 'error');
      return;
    }

    setIsPushingToVault(true);
    try {
      const currentUser = await base44.auth.me();
      
      console.log('🔍 Checking for existing NFT vault...');
      
      let vaults = await base44.entities.NFTVault.filter({
        user_email: currentUser.email
      });

      console.log('📦 Found', vaults.length, 'NFT vault(s)');

      let vault;
      if (vaults.length === 0) {
        console.log('🆕 Creating new NFT vault for', currentUser.email);
        
        vault = await base44.entities.NFTVault.create({
          user_email: currentUser.email,
          wallet_address: tttWalletAddress || nft.owner_wallet,
          nft_ids: [nft.id],
          total_nfts: 1,
          total_value_zeku: nft.zeku_cost || 0,
          is_locked: true,
          vault_created: new Date().toISOString()
        });
        
        console.log('✅ NFT Vault created:', vault.id);
      } else {
        vault = vaults[0];
        console.log('📂 Using existing NFT vault:', vault.id);
        
        if (vault.nft_ids?.includes(nft.id)) {
          showToast?.('NFT already in vault!', 'info', 3000);
          setIsPushingToVault(false);
          return;
        }
        
        const updatedNftIds = [...(vault.nft_ids || []), nft.id];
        console.log('➕ Adding NFT, new total:', updatedNftIds.length);
        
        await base44.entities.NFTVault.update(vault.id, {
          nft_ids: updatedNftIds,
          total_nfts: updatedNftIds.length,
          total_value_zeku: (vault.total_value_zeku || 0) + (nft.zeku_cost || 0)
        });
        
        console.log('✅ NFT Vault updated');
      }
      
      console.log('🔒 Updating NFT', nft.id, 'to be in NFT vault');
      
      await base44.entities.NFT.update(nft.id, {
        in_nft_vault: true,
        vault_id: vault.id,
        metadata: {
          ...nft.metadata,
          name: nftTitle.trim()
        }
      });
      
      console.log('✅ NFT updated - now in NFT vault!');

      showToast?.('✅ NFT secured in NFT Vault!\n\nClose this window and open the vault to see it.', 'success', 5000);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onUpdate?.();
      onClose();
    } catch (err) {
      console.error('❌ Push to vault failed:', err);
      showToast?.(`Push to vault failed\n\n${getErrorMessage(err)}`, 'error');
    } finally {
      setIsPushingToVault(false);
    }
  };

  const handlePublishToShop = async () => {
    if (!nftTitle.trim()) {
      showToast?.('Please enter a title!', 'error');
      return;
    }

    if (!listPrice || parseFloat(listPrice) <= 0) {
      showToast?.('Please enter a valid price!', 'error');
      return;
    }

    if (!tttWalletAddress) {
      showToast?.('TTT Wallet not found!', 'error');
      return;
    }

    if (!metamaskAddress) {
      showToast?.('⚠️ MetaMask Not Connected!\n\nPlease connect MetaMask to publish NFTs.\nBuyers need your MetaMask address to pay with ZEKU.', 'error');
      return;
    }

    setIsPublishing(true);
    try {
      const currentUser = await base44.auth.me();
      
      // Check if already published
      const existingShopItems = await base44.entities.ShopItem.filter({
        seller_email: currentUser.email
      });

      const duplicateItem = existingShopItems.find(item => 
        item.tags && item.tags.includes(nft.token_id)
      );

      if (duplicateItem) {
        showToast?.('⚠️ NFT already published to shop!', 'error');
        setIsPublishing(false);
        return;
      }

      // ✅ Use Agent ZK profile username if available, otherwise truncate TTT wallet
      const displayName = agentProfile?.username || `Agent-${tttWalletAddress.substring(0, 10)}`;
      const nftRarity = (nft.metadata?.rarity || nft.rarity || 'common').toLowerCase();

      console.log('🛍️ Publishing to shop:', {
        seller_email: currentUser.email,
        seller_username: displayName,
        seller_agent_zk_id: agentProfile?.agent_zk_id || 'N/A',
        seller_kaspa_address: tttWalletAddress,
        seller_metamask_address: metamaskAddress,
        nft_token_id: nft.token_id
      });

      const shopItemData = {
        title: nftTitle.trim(),
        description: nft.metadata?.description || nft.ai_prompt || 'AI-generated NFT',
        price_kas: parseFloat(listPrice),
        category: 'art',
        condition: 'new',
        images: [nft.image_url],
        seller_email: currentUser.email,
        seller_username: displayName,
        seller_kaspa_address: tttWalletAddress,
        seller_metamask_address: metamaskAddress,
        location: 'Digital',
        stock: 1,
        status: 'active',
        tags: ['NFT', 'AI-Generated', nftRarity, agentProfile?.agent_zk_id || 'Digital Art', nft.token_id],
        featured: false
      };

      console.log('📝 Shop item data:', shopItemData);

      await base44.entities.ShopItem.create(shopItemData);

      await base44.entities.NFT.update(nft.id, {
        metadata: {
          ...nft.metadata,
          name: nftTitle.trim()
        },
        list_price: parseFloat(listPrice),
        is_listed: true
      });

      console.log('✅ NFT published to shop successfully!');

      showToast?.('✅ NFT published to Shop!', 'success', 3000);
      
      setTimeout(() => {
        navigate(createPageUrl("Shop"));
      }, 1500);

    } catch (err) {
      console.error('Failed to publish:', err);
      showToast?.(`Publish failed\n\n${getErrorMessage(err)}`, 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const copyAddress = () => {
    const addressToCopy = tttWalletAddress || nft.owner_wallet;
    navigator.clipboard.writeText(addressToCopy);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const truncate = (addr) => addr ? `${addr.substring(0, 8)}...${addr.substring(addr.length - 6)}` : '';

  const rarity = nft.metadata?.rarity || nft.rarity || 'common';
  const rarityStyle = rarityColors[rarity.toLowerCase()] || rarityColors.common;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
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
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Edit NFT</h2>
                <p className="text-sm text-gray-400">Manage your NFT listing</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex items-center justify-center mb-4">
                    <Button
                      onClick={() => setShowBack(!showBack)}
                      size="sm"
                      variant="outline"
                      className="border-cyan-500/30 text-cyan-400"
                    >
                      {showBack ? 'Show Front' : 'Show Back'} ↻
                    </Button>
                  </div>

                  <div className="relative w-full max-w-md mx-auto aspect-[3/4]">
                    <AnimatePresence mode="wait">
                      {!showBack ? (
                        <motion.div
                          key="front"
                          initial={{ rotateY: 90, opacity: 0 }}
                          animate={{ rotateY: 0, opacity: 1 }}
                          exit={{ rotateY: -90, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className={`absolute inset-0 bg-gradient-to-br ${rarityStyle.bg} border-2 ${rarityStyle.border} rounded-2xl overflow-hidden shadow-2xl`}
                        >
                          <img
                            src={nft.image_url}
                            alt={nft.metadata?.name}
                            className="w-full h-full object-cover"
                          />
                          
                          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                            <Badge className={`${rarityStyle.badgeBg} ${rarityStyle.badgeText} border-none font-extrabold text-sm px-3 py-1.5 shadow-2xl`}>
                              {rarity.toUpperCase()}
                            </Badge>
                            <Badge className="bg-black text-white border-none font-bold text-sm px-3 py-1.5 shadow-2xl flex items-center gap-1.5">
                              <Diamond className="w-4 h-4" strokeWidth={2.5} />
                              {nft.zeku_cost} ZEKU
                            </Badge>
                          </div>

                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6">
                            <h3 className="text-white font-bold text-xl mb-2">
                              {nftTitle || 'Untitled NFT'}
                            </h3>
                            <div className="flex items-center gap-2 mb-2">
                              {(agentProfile?.agent_zk_id || nft.owner_agent_zk_id) && (
                                <Badge className="bg-cyan-500/30 text-cyan-200 border-cyan-500/50">
                                  {agentProfile?.agent_zk_id || nft.owner_agent_zk_id}
                                </Badge>
                              )}
                              <span className="text-sm text-gray-300">
                                by {agentProfile?.username || nft.owner_agent_name || truncate(nft.owner_wallet)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400">
                              Minted: {new Date(nft.minted_at).toLocaleDateString()}
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="back"
                          initial={{ rotateY: 90, opacity: 0 }}
                          animate={{ rotateY: 0, opacity: 1 }}
                          exit={{ rotateY: -90, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/50 rounded-2xl overflow-hidden shadow-2xl p-6"
                        >
                          <div className="h-full flex flex-col items-center justify-center">
                            <h3 className="text-white font-bold text-xl mb-4">Receive Payment</h3>
                            
                            {tttWalletAddress ? (
                              <>
                                <div className="bg-white p-4 rounded-xl mb-4">
                                  <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(tttWalletAddress)}&bgcolor=FFFFFF&color=000000`}
                                    alt="Wallet QR"
                                    className="w-48 h-48"
                                  />
                                </div>
                                
                                <div className="w-full max-w-sm bg-black/40 border border-cyan-500/30 rounded-xl p-4 mb-3">
                                  <div className="text-xs text-gray-400 mb-2 text-center">TTT Wallet Address</div>
                                  <code className="text-cyan-400 text-xs font-mono break-all block text-center mb-3">
                                    {tttWalletAddress}
                                  </code>
                                  
                                  <Button
                                    onClick={copyAddress}
                                    size="sm"
                                    className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400"
                                  >
                                    {copiedAddress ? (
                                      <>
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Copied!
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copy Address
                                      </>
                                    )}
                                  </Button>
                                </div>

                                <div className="space-y-2 text-center">
                                  <Badge className="bg-black/80 text-white border-black text-sm px-4 py-1 flex items-center gap-1.5 mx-auto w-fit">
                                    <Diamond className="w-4 h-4" strokeWidth={2.5} />
                                    {listPrice || nft.zeku_cost} ZEKU
                                  </Badge>
                                  <div className="text-xs text-gray-400">
                                    NFT ID: {nft.token_id?.substring(0, 12)}...
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="text-center">
                                <div className="text-yellow-400 text-sm mb-2">⚠️ No TTT Wallet Connected</div>
                                <p className="text-xs text-gray-400">Connect your TTT Wallet to receive payments</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      NFT Title *
                    </label>
                    <Input
                      type="text"
                      value={nftTitle}
                      onChange={(e) => setNftTitle(e.target.value)}
                      placeholder="Enter your NFT title..."
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      List Price (ZEKU)
                    </label>
                    <Input
                      type="number"
                      value={listPrice}
                      onChange={(e) => setListPrice(e.target.value)}
                      placeholder="0.00"
                      className="bg-white/5 border-white/10 text-white"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  {!metamaskAddress && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Wallet className="w-5 h-5 text-yellow-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-yellow-300 mb-2">
                            MetaMask Required to Publish
                          </p>
                          <p className="text-xs text-yellow-400 mb-3">
                            Buyers will pay you with ZEKU tokens. Connect MetaMask to receive payments.
                          </p>
                          <Button
                            onClick={connectMetaMask}
                            disabled={isConnectingMetaMask}
                            size="sm"
                            className="bg-yellow-500 hover:bg-yellow-600 text-black"
                          >
                            {isConnectingMetaMask ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              <>
                                <Wallet className="w-4 h-4 mr-2" />
                                Connect MetaMask
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {metamaskAddress && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="text-sm font-semibold text-green-300">MetaMask Connected</p>
                          <p className="text-xs text-green-400">{truncate(metamaskAddress)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
                    <h4 className="text-white font-semibold text-sm">NFT Details</h4>
                    <div className="text-xs text-gray-400 space-y-2">
                      <div className="flex justify-between">
                        <span>Rarity:</span>
                        <Badge className={`${rarityStyle.badgeBg} ${rarityStyle.badgeText} border-none font-extrabold text-xs px-2 py-1 shadow-lg`}>
                          {rarity.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Mint Cost:</span>
                        <span className="text-purple-400 font-bold flex items-center gap-1">
                          <Diamond className="w-3 h-3" strokeWidth={2.5} />
                          {nft.zeku_cost} ZEKU
                        </span>
                      </div>
                      {agentProfile && (
                        <div className="flex justify-between">
                          <span>Creator:</span>
                          <span className="text-cyan-400">{agentProfile.username}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Token ID:</span>
                        <code className="text-cyan-400">{nft.token_id?.substring(0, 16)}...</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 p-6 bg-black/50 flex gap-3">
              <Button
                onClick={handleSave}
                disabled={isSaving || !nftTitle.trim()}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </Button>

              <Button
                onClick={handlePushToVault}
                disabled={isPushingToVault || !nftTitle.trim()}
                className="flex-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 hover:from-purple-600 hover:via-pink-600 hover:to-purple-700"
              >
                {isPushingToVault ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Pushing...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Push to Vault
                  </>
                )}
              </Button>

              <Button
                onClick={handlePublishToShop}
                disabled={isPublishing || !listPrice || parseFloat(listPrice) <= 0 || !nftTitle.trim() || !metamaskAddress}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Publish to Shop
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}