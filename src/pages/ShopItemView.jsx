
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ShoppingCart, Heart, MapPin, Package, Truck, Shield, Star, Check, Loader2, ExternalLink, Zap, CheckCircle2, Wallet, Copy, RotateCcw, Diamond } from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const KASPLEX_RPC = 'https://evmrpc.kasplex.org';
const KASPLEX_CHAIN_ID = 202555;
const ZEKU_ADDRESS = '0x6E089FE330966a9938707d9D70065145cDf5980A';

const rarityColors = {
  common: { bg: 'from-gray-500/20 to-gray-600/20', text: 'text-gray-300', border: 'border-gray-500/50', badgeBg: 'bg-gray-800', badgeText: 'text-white' },
  uncommon: { bg: 'from-green-500/20 to-emerald-600/20', text: 'text-green-300', border: 'border-green-500/50', badgeBg: 'bg-green-700', badgeText: 'text-white' },
  rare: { bg: 'from-blue-500/20 to-cyan-600/20', text: 'text-blue-300', border: 'border-blue-500/50', badgeBg: 'bg-blue-700', badgeText: 'text-white' },
  epic: { bg: 'from-purple-500/20 to-pink-600/20', text: 'text-purple-300', border: 'border-purple-500/50', badgeBg: 'bg-purple-700', badgeText: 'text-white' },
  legendary: { bg: 'from-yellow-500/20 to-orange-600/20', text: 'text-yellow-300', border: 'border-yellow-500/50', badgeBg: 'bg-gradient-to-r from-yellow-600 to-orange-600', badgeText: 'text-black' }
};

const hexToBigInt = (hex) => {
  if (!hex || hex === '0x' || hex === '0x0') return BigInt(0);
  return BigInt(hex);
};

const formatTokenAmount = (bigIntValue) => {
  const str = bigIntValue.toString();
  const decimals = 18;
  const len = str.length;
  
  if (len <= decimals) {
    const padded = '0'.repeat(decimals - len + 1) + str;
    return '0.' + padded.slice(1);
  } else {
    const integerPart = str.slice(0, len - decimals);
    const decimalPart = str.slice(len - decimals);
    return integerPart + '.' + decimalPart;
  }
};

const padHexAddress = (address) => {
  if (!address || typeof address !== 'string') {
    throw new Error('Invalid address: must be a string');
  }
  
  let cleanAddress = address.toLowerCase().replace('0x', '');
  
  if (!/^[0-9a-f]+$/.test(cleanAddress)) {
    throw new Error(`Invalid address format: ${address}`);
  }
  
  return cleanAddress.padStart(64, '0');
};

const toWei = (amount, decimals = 18) => {
  const amountStr = amount.toString();
  const parts = amountStr.split('.');
  const integerPart = parts[0];
  const decimalPart = (parts[1] || '').padEnd(decimals, '0').slice(0, decimals);
  const fullValue = integerPart + decimalPart;
  return BigInt(fullValue).toString();
};

const padAmount = (amountWei) => {
  const hex = BigInt(amountWei).toString(16);
  return hex.padStart(64, '0');
};

const getErrorMessage = (error) => {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (error.reason) return error.reason;
  return 'Unknown error';
};

export default function ShopItemViewPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const itemId = searchParams.get('id');
  
  const [item, setItem] = useState(null);
  const [nftData, setNftData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [kaswareWallet, setKaswareWallet] = useState({ connected: false, address: null, balance: 0 });
  const [metamaskWallet, setMetamaskWallet] = useState({ connected: false, address: null, zekuBalance: 0, chainId: null });
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [user, setUser] = useState(null);
  const [showBack, setShowBack] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [isConnectingMetaMask, setIsConnectingMetaMask] = useState(false);
  const [tokenAddedToMetaMask, setTokenAddedToMetaMask] = useState(false);

  useEffect(() => {
    if (itemId) {
      loadItem();
    }
    loadUser();
    checkKaswareWallet();
    checkMetaMaskWallet();
  }, [itemId]);

  useEffect(() => {
    const tokenAdded = localStorage.getItem('zeku_token_added_shop');
    if (tokenAdded === 'true') {
      setTokenAddedToMetaMask(true);
    }
  }, []);

  useEffect(() => {
    if (metamaskWallet.connected && metamaskWallet.address) {
      const interval = setInterval(() => {
        checkZEKUBalance(metamaskWallet.address);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [metamaskWallet.connected, metamaskWallet.address]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.log('User not logged in');
    }
  };

  const loadItem = async () => {
    setIsLoading(true);
    try {
      const items = await base44.entities.ShopItem.filter({ id: itemId });
      if (items.length > 0) {
        setItem(items[0]);
        
        const isNFT = items[0].tags?.includes('NFT') || items[0].tags?.includes('AI-Generated');
        if (isNFT) {
          const tokenId = items[0].tags?.find(tag => tag.startsWith('0x'));
          if (tokenId) {
            const nfts = await base44.entities.NFT.filter({ token_id: tokenId });
            if (nfts.length > 0) {
              setNftData(nfts[0]);
            }
          }
        }
        
        await base44.entities.ShopItem.update(itemId, {
          views: (items[0].views || 0) + 1
        });
      }
    } catch (error) {
      console.error('Failed to load item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkKaswareWallet = async () => {
    if (typeof window.kasware !== 'undefined') {
      try {
        const accounts = await window.kasware.getAccounts();
        if (accounts.length > 0) {
          const balanceResult = await window.kasware.getBalance();
          const balance = balanceResult.total || 0;
          setKaswareWallet({
            connected: true,
            address: accounts[0],
            balance: balance / 1e8
          });
        }
      } catch (err) {
        console.log('Kasware not connected');
      }
    }
  };

  const checkZEKUBalance = async (address) => {
    try {
      const functionSelector = '0x70a08231';
      const paddedAddress = padHexAddress(address);
      const callData = functionSelector + paddedAddress;
      
      const result = await window.ethereum.request({
        method: 'eth_call',
        params: [{
          to: ZEKU_ADDRESS,
          data: callData
        }, 'latest']
      });
      
      const balanceBigInt = hexToBigInt(result);
      const formatted = formatTokenAmount(balanceBigInt);
      const zekuBalance = parseFloat(formatted);
      
      setMetamaskWallet(prev => ({
        ...prev,
        zekuBalance: zekuBalance
      }));
      
      return zekuBalance;
    } catch (err) {
      console.error('Failed to check ZEKU balance:', err);
      return 0;
    }
  };

  const checkMetaMaskWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const address = accounts[0];
          
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          
          const zekuBalance = await checkZEKUBalance(address);
          
          setMetamaskWallet({
            connected: true,
            address: address,
            zekuBalance: zekuBalance,
            chainId: chainId
          });
        }
      } catch (err) {
        console.log('MetaMask not connected:', err);
      }
    }
  };

  const connectKasware = async () => {
    if (typeof window.kasware === 'undefined') {
      alert('Kasware wallet not found. Please install Kasware extension.');
      return;
    }

    try {
      await window.kasware.requestAccounts();
      await checkKaswareWallet();
    } catch (err) {
      alert('Failed to connect Kasware wallet');
    }
  };

  const connectMetaMask = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask not found. Please install MetaMask extension.');
      return;
    }

    setIsConnectingMetaMask(true);

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== `0x${KASPLEX_CHAIN_ID.toString(16)}`) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${KASPLEX_CHAIN_ID.toString(16)}` }],
          });
        } catch (switchError) {
          if (switchError && switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${KASPLEX_CHAIN_ID.toString(16)}`,
                chainName: 'Kasplex Layer-2',
                nativeCurrency: {
                  name: 'Kaspa',
                  symbol: 'KAS',
                  decimals: 18
                },
                rpcUrls: [KASPLEX_RPC],
                blockExplorerUrls: ['https://explorer.kasplex.org']
              }],
            });
          } else {
            throw switchError;
          }
        }
      }
      
      if (!tokenAddedToMetaMask) {
        try {
          const wasAdded = await window.ethereum.request({
            method: 'wallet_watchAsset',
            params: {
              type: 'ERC20',
              options: {
                address: ZEKU_ADDRESS,
                symbol: 'ZEKU',
                decimals: 18,
              },
            },
          });
          
          if (wasAdded) {
            setTokenAddedToMetaMask(true);
            localStorage.setItem('zeku_token_added_shop', 'true');
            console.log('✅ ZEKU token added to MetaMask');
          }
        } catch (tokenError) {
          console.log('⚠️ User declined or already has ZEKU token');
        }
      } else {
        console.log('✅ ZEKU token already added, skipping...');
      }
      
      await checkMetaMaskWallet();
    } catch (err) {
      console.error('Failed to connect MetaMask:', err);
      alert('Failed to connect MetaMask: ' + getErrorMessage(err));
    } finally {
      setIsConnectingMetaMask(false);
    }
  };

  const handlePurchase = async () => {
    if (!kaswareWallet.connected) {
      alert('Please connect your Kasware wallet first');
      return;
    }

    const sellerAddress = item.seller_kaspa_address;
    
    if (!sellerAddress) {
      alert('Seller wallet address not found. Cannot process payment.');
      return;
    }

    const totalPrice = (item.price_kas + (item.shipping_cost_kas || 0)) * quantity;
    
    if (kaswareWallet.balance < totalPrice) {
      alert(`Insufficient balance. You need ${totalPrice.toFixed(8)} KAS but only have ${kaswareWallet.balance.toFixed(8)} KAS`);
      return;
    }

    setIsPurchasing(true);

    try {
      const satoshis = Math.floor(totalPrice * 100000000);
      const txHash = await window.kasware.sendKaspa(sellerAddress, satoshis);

      await base44.entities.ShopItem.update(itemId, {
        stock: item.stock - quantity
      });
      
      setPurchaseSuccess(true);
      
      setTimeout(() => {
        alert(`🎉 Purchase successful!\n\nTX: ${txHash}\n\nPayment sent to: ${item.seller_username}`);
        navigate(createPageUrl("Shop"));
      }, 2000);

    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed: ' + getErrorMessage(error));
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleMetaMaskPurchase = async () => {
    if (!metamaskWallet.connected) {
      alert('Please connect MetaMask first');
      return;
    }

    if (!user) {
      alert('Please login to purchase NFTs');
      return;
    }

    const sellerMetaMaskAddress = item.seller_metamask_address;
    
    if (!sellerMetaMaskAddress) {
      alert('⚠️ Seller MetaMask address not found!\n\nThis NFT was listed before MetaMask support.\nPlease contact seller to re-list with MetaMask.');
      return;
    }

    if (!sellerMetaMaskAddress.startsWith('0x') || sellerMetaMaskAddress.length !== 42) {
      alert(`⚠️ Invalid seller MetaMask address!\n\nAddress: ${sellerMetaMaskAddress}`);
      console.error('Invalid EVM seller address:', sellerMetaMaskAddress);
      return;
    }

    console.log('🔍 Purchase Check:');
    console.log('Buyer Email:', user.email);
    console.log('Buyer MetaMask:', metamaskWallet.address);
    console.log('Seller Email:', item.seller_email);
    console.log('Seller MetaMask:', sellerMetaMaskAddress);

    // ✅ ONLY check if buyer's MetaMask matches seller's MetaMask (addresses only!)
    if (metamaskWallet.address.toLowerCase() === sellerMetaMaskAddress.toLowerCase()) {
      alert('⚠️ You cannot buy your own NFT!\n\nYour MetaMask address matches the seller\'s MetaMask address.');
      return;
    }

    const totalPrice = item.price_kas * quantity;
    
    console.log('💰 Payment Check:');
    console.log('Need:', totalPrice, 'ZEKU');
    console.log('Have:', metamaskWallet.zekuBalance, 'ZEKU');
    
    if (metamaskWallet.zekuBalance < totalPrice) {
      alert(`Insufficient ZEKU!\n\nNeed: ${totalPrice} ZEKU\nHave: ${metamaskWallet.zekuBalance.toFixed(2)} ZEKU`);
      return;
    }

    setIsPurchasing(true);

    try {
      console.log('💰 Processing ZEKU payment...');
      console.log('📍 From (Buyer):', metamaskWallet.address);
      console.log('📍 To (Seller):', sellerMetaMaskAddress);
      console.log('💵 Amount:', totalPrice, 'ZEKU');

      const amountWei = toWei(totalPrice, 18);
      console.log('📊 Amount in wei:', amountWei);
      
      let paddedSellerAddress;
      try {
        paddedSellerAddress = padHexAddress(sellerMetaMaskAddress);
      } catch (err) {
        alert(`Error processing seller address: ${getErrorMessage(err)}`);
        setIsPurchasing(false);
        return;
      }
      
      const transferData = '0xa9059cbb' + paddedSellerAddress + padAmount(amountWei);
      
      const currentGasPrice = await window.ethereum.request({
        method: 'eth_gasPrice'
      });
      
      const gasPriceBigInt = BigInt(currentGasPrice);
      const priorityGasPrice = (gasPriceBigInt * BigInt(5)).toString(16);
      
      console.log('📝 Opening MetaMask for approval...');
      console.log('⛽ Using 5x network gas price for speed');
      
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: metamaskWallet.address,
          to: ZEKU_ADDRESS,
          data: transferData,
          gas: '0xC350',
          gasPrice: '0x' + priorityGasPrice,
          value: '0x0'
        }],
      });

      console.log('✅ Transaction sent!', txHash);
      console.log('⏳ Waiting for confirmation...');

      let receipt = null;
      for (let i = 0; i < 30; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const response = await fetch(KASPLEX_RPC, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getTransactionReceipt',
            params: [txHash],
            id: 1
          })
        });

        const result = await response.json();
        if (result.result) {
          receipt = result.result;
          console.log('✅ Transaction confirmed!', receipt);
          break;
        }
      }

      if (!receipt) {
        alert('Transaction confirmation timeout. Check your wallet.');
        setIsPurchasing(false);
        return;
      }
      
      if (nftData) {
        console.log('🔄 Completing purchase via backend...');
        
        const purchaseResponse = await base44.functions.invoke('completeShopPurchase', {
          shopItemId: itemId,
          nftId: nftData.id,
          buyerEmail: user.email,
          buyerWallet: metamaskWallet.address,
          transactionHash: txHash,
          zekuAmount: totalPrice
        });
        
        console.log('📥 Backend response:', purchaseResponse);
        
        if (purchaseResponse.data?.success === false) {
          throw new Error(purchaseResponse.data?.message || purchaseResponse.data?.error || 'Purchase completion failed');
        }
        
        if (!purchaseResponse.data?.success) {
          throw new Error('Invalid response from backend');
        }
        
        console.log('✅ Purchase completed via backend');
      }
      
      setPurchaseSuccess(true);
      
      await checkZEKUBalance(metamaskWallet.address);
      
      setTimeout(() => {
        alert(`🎉 NFT Purchase Successful!\n\n💰 Paid: ${totalPrice} ZEKU to seller\n👤 Seller: ${item.seller_username}\n💳 To: ${sellerMetaMaskAddress.substring(0, 10)}...\n🔒 NFT secured in your NFT Vault!\n⛽ Gas Fee: ~0.0001 KAS\n\n✅ NFT removed from shop\n✅ Ownership transferred to you\n\nTransaction: ${txHash}\n\nAccess your NFT Vault from NFT Mint page!`);
        navigate(createPageUrl("NFTMint"));
      }, 2000);

    } catch (error) {
      console.error('ZEKU payment failed:', error);
      console.error('Error details:', error.response?.data);
      
      if (error && error.code === 4001) {
        alert('Transaction rejected by user');
      } else if (error && getErrorMessage(error).includes('insufficient funds')) {
        alert(`Insufficient funds!\n\nYou need ${totalPrice} ZEKU but have ${metamaskWallet.zekuBalance.toFixed(2)} ZEKU`);
      } else {
        const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
        alert(`Payment failed: ${errorMsg}\n\n${error.response?.data?.error || ''}`);
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const copyAddress = () => {
    const addressToCopy = item.seller_kaspa_address;
    navigator.clipboard.writeText(addressToCopy);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-zinc-950 border-zinc-800 max-w-md">
          <CardContent className="p-8 text-center">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Item Not Found</h2>
            <Link to={createPageUrl("Shop")}>
              <Button className="bg-white/10 border border-white/20 text-white hover:bg-white/20 mt-4">
                Back to Shop
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPrice = (item.price_kas + (item.shipping_cost_kas || 0)) * quantity;
  const totalZEKU = item.price_kas * quantity;
  const inStock = item.stock > 0;
  const isNFT = item.tags?.includes('NFT') || item.tags?.includes('AI-Generated');

  const rarity = item.tags?.find(tag => 
    ['common', 'uncommon', 'rare', 'epic', 'legendary'].includes(tag.toLowerCase())
  )?.toLowerCase() || 'common';
  
  const rarityStyle = rarityColors[rarity] || rarityColors.common;

  const displayTitle = nftData?.metadata?.name || item.title;
  const displayDescription = nftData?.metadata?.description || item.description;

  // ✅ Only block if buyer's MetaMask EXACTLY matches seller's MetaMask
  const isBuyingOwnNFT = metamaskWallet.connected && 
                         item.seller_metamask_address && 
                         metamaskWallet.address.toLowerCase() === item.seller_metamask_address.toLowerCase();

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 p-6 md:p-8 lg:p-12">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <Link to={createPageUrl("Shop")}>
              <Button variant="ghost" className="mb-6 text-gray-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Shop
              </Button>
            </Link>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {isNFT && (
                <div className="flex items-center justify-center mb-4">
                  <Button
                    onClick={() => setShowBack(!showBack)}
                    size="sm"
                    variant="outline"
                    className="bg-black border-white/20 text-white hover:bg-white/10"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {showBack ? 'Show Front' : 'Show Back'}
                  </Button>
                </div>
              )}

              <Card className={`backdrop-blur-xl ${
                isNFT 
                  ? `bg-gradient-to-br ${rarityStyle.bg} border-2 ${rarityStyle.border}` 
                  : 'bg-white/5 border-white/10'
              } overflow-hidden`}>
                <CardContent className="p-0">
                  <div className="aspect-square bg-black/30 flex items-center justify-center relative">
                    <AnimatePresence mode="wait">
                      {!showBack ? (
                        <motion.div
                          key="front"
                          initial={{ rotateY: 90, opacity: 0 }}
                          animate={{ rotateY: 0, opacity: 1 }}
                          exit={{ rotateY: -90, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="absolute inset-0"
                        >
                          {item.images && item.images[selectedImage] ? (
                            <img
                              src={item.images[selectedImage]}
                              alt={displayTitle}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-8xl">
                              {getCategoryIcon(item.category)}
                            </div>
                          )}
                          
                          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                            {isNFT ? (
                              <>
                                <Badge className={`${rarityStyle.badgeBg} ${rarityStyle.badgeText} border-none font-extrabold shadow-2xl px-3 py-1.5 text-sm`}>
                                  {rarity.toUpperCase()}
                                </Badge>
                                <Badge className="bg-green-700 text-white border-none font-bold shadow-2xl">
                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                  Verified NFT
                                </Badge>
                              </>
                            ) : null}
                          </div>

                          {isNFT && (
                            <div className="absolute bottom-4 right-4">
                              <Badge className="bg-black text-white border-none font-bold text-base px-4 py-2 shadow-2xl flex items-center gap-2">
                                <Diamond className="w-5 h-5" strokeWidth={2.5} />
                                <span>{item.price_kas} ZEKU</span>
                              </Badge>
                            </div>
                          )}
                        </motion.div>
                      ) : (
                        <motion.div
                          key="back"
                          initial={{ rotateY: 90, opacity: 0 }}
                          animate={{ rotateY: 0, opacity: 1 }}
                          exit={{ rotateY: -90, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/50 p-6 flex flex-col items-center justify-center"
                        >
                          <h3 className="text-white font-bold text-xl mb-4">Receive Payment</h3>
                          
                          {item.seller_kaspa_address ? (
                            <>
                              <div className="bg-white p-4 rounded-xl mb-4">
                                <img 
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(item.seller_kaspa_address)}&bgcolor=FFFFFF&color=000000}`}
                                  alt="Wallet QR"
                                  className="w-48 h-48"
                                />
                              </div>
                              
                              <div className="w-full max-w-sm bg-black/40 border border-cyan-500/30 rounded-xl p-4 mb-3">
                                <div className="text-xs text-gray-400 mb-2 text-center">Seller's TTT Wallet</div>
                                <code className="text-cyan-400 text-xs font-mono break-all block text-center mb-3">
                                  {item.seller_kaspa_address}
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
                                <Badge className="bg-white/10 text-white border-white/20 text-sm px-4 py-1">
                                  {item.price_kas} ZEKU
                                </Badge>
                              </div>
                            </>
                          ) : (
                            <div className="text-center">
                              <div className="text-yellow-400 text-sm mb-2">⚠️ No Wallet Connected</div>
                              <p className="text-xs text-gray-400">Seller needs to connect TTT Wallet</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>

              {item.images && item.images.length > 1 && !showBack && (
                <div className="flex gap-2">
                  {item.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === idx
                          ? 'border-white/40'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                {item.featured && (
                  <Badge className="bg-white/10 text-white border-white/20 mb-3">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                )}
                
                {isNFT && (
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={`${rarityStyle.badgeBg} ${rarityStyle.badgeText} border-none font-extrabold px-4 py-2 text-base shadow-lg`}>
                      {rarity.toUpperCase()} RARITY
                    </Badge>
                    <Badge className="bg-green-700 text-white border-none font-bold">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Verified
                    </Badge>
                  </div>
                )}
                
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                  {displayTitle}
                </h1>
                <p className="text-gray-400 leading-relaxed">
                  {displayDescription}
                </p>
              </div>

              <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-baseline gap-3 mb-4">
                    <span className="text-4xl font-bold text-white">
                      {item.price_kas} {isNFT ? 'ZEKU' : 'KAS'}
                    </span>
                    {!isNFT && item.shipping_cost_kas > 0 && (
                      <span className="text-gray-400">
                        +{item.shipping_cost_kas} KAS shipping
                      </span>
                    )}
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Condition:</span>
                      <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500/30">
                        {item.condition?.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Stock:</span>
                      <span className="text-white font-semibold">
                        {inStock ? `${item.stock} available` : 'Out of stock'}
                      </span>
                    </div>
                    {item.location && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Ships from:</span>
                        <span className="text-white flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {item.location}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                <CardContent className="p-6 space-y-4">
                  {!isNFT && (
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Quantity</label>
                      <div className="flex items-center gap-3">
                        <Button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          variant="outline"
                          size="sm"
                          className="bg-white/5 border-white/10 text-white"
                          disabled={!inStock}
                        >
                          -
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          max={item.stock}
                          value={quantity}
                          onChange={(e) => setQuantity(Math.min(item.stock, Math.max(1, parseInt(e.target.value) || 1)))}
                          className="w-20 text-center bg-white/5 border-white/10 text-white"
                          disabled={!inStock}
                        />
                        <Button
                          onClick={() => setQuantity(Math.min(item.stock, quantity + 1))}
                          variant="outline"
                          size="sm"
                          className="bg-white/5 border-white/10 text-white"
                          disabled={!inStock}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="bg-black/30 rounded-lg p-4 border border-white/20">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400">Price:</span>
                      <span className="text-white font-semibold">{item.price_kas} {isNFT ? 'ZEKU' : 'KAS'}</span>
                    </div>
                    {!isNFT && quantity > 1 && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400">Quantity:</span>
                        <span className="text-white font-semibold">×{quantity}</span>
                      </div>
                    )}
                    {!isNFT && item.shipping_cost_kas > 0 && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400">Shipping:</span>
                        <span className="text-white font-semibold">{item.shipping_cost_kas.toFixed(2)} KAS</span>
                      </div>
                    )}
                    <div className="border-t border-white/10 pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-semibold text-lg">Total:</span>
                        <span className="text-2xl font-bold text-white">
                          {isNFT ? `${totalZEKU} ZEKU` : `${totalPrice.toFixed(2)} KAS`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isNFT ? (
                    <>
                      {!metamaskWallet.connected ? (
                        <Button
                          onClick={connectMetaMask}
                          disabled={isConnectingMetaMask}
                          className="w-full bg-black border-2 border-white/20 hover:bg-white/10 h-12 text-white"
                        >
                          {isConnectingMetaMask ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Connecting MetaMask...
                            </>
                          ) : (
                            <>
                              <Wallet className="w-5 h-5 mr-2" />
                              Connect MetaMask to Pay with ZEKU
                            </>
                          )}
                        </Button>
                      ) : (
                        <>
                          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-sm">
                              <Check className="w-4 h-4 text-green-400" />
                              <span className="text-green-300">
                                MetaMask Connected: {metamaskWallet.zekuBalance.toFixed(2)} ZEKU
                              </span>
                            </div>
                          </div>

                          <Button
                            onClick={handleMetaMaskPurchase}
                            disabled={isPurchasing || !inStock || purchaseSuccess || metamaskWallet.zekuBalance < totalZEKU || isBuyingOwnNFT}
                            className="w-full bg-black border-2 border-white/20 hover:bg-white/10 h-12 text-lg font-semibold text-white"
                          >
                            {isPurchasing ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Processing ZEKU Payment...
                              </>
                            ) : purchaseSuccess ? (
                              <>
                                <Check className="w-5 h-5 mr-2" />
                                Purchase Complete!
                              </>
                            ) : !inStock ? (
                              'Out of Stock'
                            ) : isBuyingOwnNFT ? (
                              'Cannot Buy Own NFT'
                            ) : metamaskWallet.zekuBalance < totalZEKU ? (
                              `Insufficient ZEKU (${metamaskWallet.zekuBalance.toFixed(2)})`
                            ) : (
                              <>
                                <Zap className="w-5 h-5 mr-2" />
                                Buy with ZEKU - {totalZEKU} ZEKU
                              </>
                            )}
                          </Button>
                        </>
                      )}

                      {!kaswareWallet.connected ? (
                        <Button
                          onClick={connectKasware}
                          className="w-full bg-black border-2 border-white/20 hover:bg-white/10 h-12 text-white"
                        >
                          <Shield className="w-5 h-5 mr-2" />
                          Or Connect Kasware to Pay with KAS
                        </Button>
                      ) : (
                        <>
                          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-sm">
                              <Check className="w-4 h-4 text-green-400" />
                              <span className="text-green-300">
                                Kasware Connected: {kaswareWallet.balance.toFixed(4)} KAS
                              </span>
                            </div>
                          </div>

                          <Button
                            onClick={handlePurchase}
                            disabled={isPurchasing || !inStock || purchaseSuccess}
                            className="w-full bg-black border-2 border-white/20 hover:bg-white/10 h-12 text-lg font-semibold text-white"
                          >
                            {isPurchasing ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Processing KAS Payment...
                              </>
                            ) : purchaseSuccess ? (
                              <>
                                <Check className="w-5 h-5 mr-2" />
                                Purchase Complete!
                              </>
                            ) : !inStock ? (
                              'Out of Stock'
                            ) : (
                              <>
                                <Zap className="w-5 h-5 mr-2" />
                                Buy with KAS - {totalPrice.toFixed(2)} KAS
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      {!kaswareWallet.connected ? (
                        <Button
                          onClick={connectKasware}
                          className="w-full bg-black border-2 border-white/20 hover:bg-white/10 h-12 text-white"
                        >
                          <Shield className="w-5 h-5 mr-2" />
                          Connect Kasware to Purchase
                        </Button>
                      ) : (
                        <>
                          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-sm">
                              <Check className="w-4 h-4 text-green-400" />
                              <span className="text-green-300">
                                Wallet Connected: {kaswareWallet.balance.toFixed(4)} KAS
                              </span>
                            </div>
                          </div>

                          <Button
                            onClick={handlePurchase}
                            disabled={isPurchasing || !inStock || purchaseSuccess}
                            className="w-full bg-black border-2 border-white/20 hover:bg-white/10 h-12 text-lg font-semibold text-white"
                          >
                            {isPurchasing ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Processing Payment...
                              </>
                            ) : purchaseSuccess ? (
                              <>
                                <Check className="w-5 h-5 mr-2" />
                                Purchase Complete!
                              </>
                            ) : !inStock ? (
                              'Out of Stock'
                            ) : (
                              <>
                                <Zap className="w-5 h-5 mr-2" />
                                Buy Now - {totalPrice.toFixed(2)} KAS
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </>
                  )}

                  <div className="bg-white/5 border border-white/20 rounded-lg p-3">
                    <div className="flex items-start gap-2 text-xs text-gray-300">
                      <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold mb-1">Secure P2P Payment</p>
                        <p>
                          {isNFT && '🔒 NFT will be secured in your NFT Vault after payment! '}
                          ⛽ Gas Fee: ~0.0001 KAS (minimal)
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <h3 className="text-white font-semibold mb-4">Seller Information</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-white font-bold">
                        {item.seller_username?.[0]?.toUpperCase() || 'S'}
                      </div>
                      <div>
                        <div className="text-white font-semibold">{item.seller_username || 'Seller'}</div>
                        <div className="text-xs text-gray-400">Verified Seller</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {item.tags.filter(tag => !tag.startsWith('0x')).map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="bg-white/5 border-white/10 text-gray-300">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getCategoryIcon(category) {
  const icons = {
    electronics: "📱",
    fashion: "👔",
    home: "🏠",
    collectibles: "💎",
    art: "🎨",
    crypto: "₿",
    books: "📚",
    sports: "⚽",
    toys: "🎮",
    other: "📦"
  };
  return icons[category] || "📦";
}
