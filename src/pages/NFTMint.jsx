import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Wallet, Image as ImageIcon, Check, AlertCircle, Zap, Trophy, Copy, ExternalLink, RefreshCw, Plus, Minus, X, Edit2, Layers, Shield, Diamond } from "lucide-react";
import NFTEditModal from "@/components/nft/NFTEditModal";
import VaultModal from "@/components/nft/VaultModal";

const KASPLEX_RPC = 'https://evmrpc.kasplex.org';
const KASPLEX_CHAIN_ID = 202555;
const ZEKU_ADDRESS = '0x6E089FE330966a9938707d9D70065145cDf5980A';
const ZEKU_TICKER = 'zeku'; // KRC-20 ticker

const Toast = ({ message, type, onClose }) => {
  const bgColor = type === 'success' ? 'from-green-500/20 to-emerald-500/20 border-green-500/30' :
                  type === 'error' ? 'from-red-500/20 to-pink-500/20 border-red-500/30' :
                  type === 'info' ? 'from-white/10 to-white/5 border-white/20' :
                  'from-white/10 to-white/5 border-white/20';
  
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] max-w-md w-full mx-4`}
    >
      <div className={`bg-gradient-to-br ${bgColor} backdrop-blur-xl border rounded-xl p-4 shadow-2xl`}>
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">{icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm leading-relaxed whitespace-pre-line break-words">
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
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
    const result = '0.' + padded.slice(1);
    return parseFloat(result);
  } else {
    const integerPart = str.slice(0, len - decimals);
    const decimalPart = str.slice(len - decimals);
    const result = integerPart + '.' + decimalPart;
    return parseFloat(result);
  }
};

const padHexAddress = (address) => {
  return address.toLowerCase().replace('0x', '').padStart(64, '0');
};

const toWei = (amount, decimals = 18) => {
  const factor = BigInt(10) ** BigInt(decimals);
  const amountBigInt = BigInt(Math.floor(amount * 1e6)); // Multiply by 1e6 to handle floating point precision before BigInt conversion
  return (amountBigInt * factor / BigInt(1e6)).toString(); // Divide back after BigInt multiplication
};

const padAmount = (amountWei) => {
  const hex = BigInt(amountWei).toString(16);
  return hex.padStart(64, '0');
};

const createPageUrl = (path) => `/${path.toLowerCase()}`;

const rarityColors = {
  common: { bg: 'from-gray-500/20 to-gray-600/20', text: 'text-gray-300', border: 'border-gray-500/50', badgeBg: 'bg-gray-800', badgeText: 'text-white' },
  uncommon: { bg: 'from-green-500/20 to-emerald-600/20', text: 'text-green-300', border: 'border-green-500/50', badgeBg: 'bg-green-700', badgeText: 'text-white' },
  rare: { bg: 'from-blue-500/20 to-cyan-600/20', text: 'text-blue-300', border: 'border-blue-500/50', badgeBg: 'bg-blue-700', badgeText: 'text-white' },
  epic: { bg: 'from-purple-500/20 to-pink-600/20', text: 'text-purple-300', border: 'border-purple-700/50', badgeBg: 'bg-purple-700', badgeText: 'text-white' },
  legendary: { bg: 'from-yellow-500/20 to-orange-600/20', text: 'text-yellow-300', border: 'border-yellow-500/50', badgeBg: 'bg-gradient-to-r from-yellow-600 to-orange-600', badgeText: 'text-black' }
};

export default function NFTMintPage() {
  const [user, setUser] = useState(null);
  const [agentProfile, setAgentProfile] = useState(null);
  
  // Kasware state
  const [kaswareConnected, setKaswareConnected] = useState(false);
  const [kaswareAddress, setKaswareAddress] = useState('');
  const [kaswareZekuBalance, setKaswareZekuBalance] = useState(0);
  const [isConnectingKasware, setIsConnectingKasware] = useState(false);
  
  // MetaMask state
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [zekuBalance, setZekuBalance] = useState(0);
  
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isMinting, setIsMinting] = useState(false);
  const [mintAmount, setMintAmount] = useState(10);
  const [customListPrice, setCustomListPrice] = useState('');
  const [batchCount, setBatchCount] = useState(1);
  const [showBatchMint, setShowBatchMint] = useState(false);
  const [myNFTs, setMyNFTs] = useState([]);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);
  const [lastMintedNFT, setLastMintedNFT] = useState(null);
  
  const [nftRarity, setNftRarity] = useState('common');
  const [customTraits, setCustomTraits] = useState([]);
  const [newTraitName, setNewTraitName] = useState('');
  const [newTraitValue, setNewTraitValue] = useState('');
  
  const [toast, setToast] = useState(null);
  const [editingNFT, setEditingNFT] = useState(null);
  const [showVault, setShowVault] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [tokenAddedToMetaMask, setTokenAddedToMetaMask] = useState(false);

  const showToast = (message, type = 'info', duration = 5000) => {
    setToast({ message, type });
    if (duration > 0) {
      setTimeout(() => setToast(null), duration);
    }
  };

  const rarityOptions = [
    { value: 'common', label: 'Common', color: 'bg-white/5 text-white border-white/20', multiplier: 1 },
    { value: 'uncommon', label: 'Uncommon', color: 'bg-white/10 text-white border-white/20', multiplier: 1.5 },
    { value: 'rare', label: 'Rare', color: 'bg-white/10 text-white border-white/20', multiplier: 2 },
    { value: 'epic', label: 'Epic', color: 'bg-white/10 text-white border-white/20', multiplier: 3 },
    { value: 'legendary', label: 'Legendary', color: 'bg-white/10 text-white border-white/20', multiplier: 5 }
  ];

  const currentRarity = rarityOptions.find(r => r.value === nftRarity);
  const totalMintCost = mintAmount * currentRarity.multiplier * batchCount;

  useEffect(() => {
    // Load persisted generated image from localStorage
    const savedImage = localStorage.getItem('nft_generated_image');
    const savedPrompt = localStorage.getItem('nft_ai_prompt');
    
    if (savedImage) {
      setGeneratedImage(savedImage);
    }
    if (savedPrompt) {
      setAiPrompt(savedPrompt);
    }
    
    loadUser();
    loadMyNFTs();
    
    // Check if token was already added to MetaMask
    const tokenAdded = localStorage.getItem('zeku_token_added_mint');
    if (tokenAdded === 'true') {
      setTokenAddedToMetaMask(true);
      console.log('✅ ZEKU token already added to MetaMask');
    }
    
    // Check MetaMask
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setWalletConnected(true);
            checkZEKUBalance(accounts[0]);
          }
        })
        .catch(err => console.error('Failed to check MetaMask accounts:', err));
    }
    
    // Check Kasware
    if (window.kasware) {
      window.kasware.getAccounts()
        .then(accounts => {
          if (accounts.length > 0) {
            setKaswareAddress(accounts[0]);
            setKaswareConnected(true);
            checkKaswareZEKUBalance(accounts[0]);
          }
        })
        .catch(err => console.error('Failed to check Kasware accounts:', err));
    }
  }, []);

  // Smart MetaMask account change detection
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      console.log('🔄 MetaMask account changed:', accounts[0]);
      
      if (accounts.length === 0) {
        // User disconnected
        setWalletConnected(false);
        setWalletAddress('');
        setZekuBalance(0);
      } else {
        // User switched accounts - silently update
        setWalletAddress(accounts[0]);
        setWalletConnected(true);
        
        // Silently check new balance
        await checkZEKUBalance(accounts[0]);
        
        // Silently reload NFTs for new account
        await loadMyNFTs();
      }
    };

    const handleChainChanged = () => {
      console.log('🔄 MetaMask chain changed, reloading...');
      setTimeout(() => window.location.reload(), 3000);
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  useEffect(() => {
    if (walletConnected && walletAddress) {
      const interval = setInterval(() => {
        checkZEKUBalance(walletAddress);
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [walletConnected, walletAddress]);

  useEffect(() => {
    if (kaswareConnected && kaswareAddress) {
      const interval = setInterval(() => {
        checkKaswareZEKUBalance(kaswareAddress);
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [kaswareConnected, kaswareAddress]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // ✅ Load Agent ZK profile based on TTT wallet address
      if (currentUser.created_wallet_address) {
        console.log('🔍 Loading Agent ZK profile for TTT wallet:', currentUser.created_wallet_address);
        
        try {
          const profiles = await base44.entities.AgentZKProfile.filter({
            wallet_address: currentUser.created_wallet_address
          });

          if (profiles.length > 0) {
            console.log('✅ Found Agent ZK profile:', profiles[0].agent_zk_id);
            setAgentProfile(profiles[0]);
          } else {
            // Try searching by ttt_wallet_address field
            const profilesByTTT = await base44.entities.AgentZKProfile.filter({
              ttt_wallet_address: currentUser.created_wallet_address
            });
            
            if (profilesByTTT.length > 0) {
              console.log('✅ Found Agent ZK profile via TTT wallet:', profilesByTTT[0].agent_zk_id);
              setAgentProfile(profilesByTTT[0]);
            } else {
              // Try searching by user email
              const profilesByEmail = await base44.entities.AgentZKProfile.filter({
                user_email: currentUser.email
              });
              
              if (profilesByEmail.length > 0) {
                console.log('✅ Found Agent ZK profile via email:', profilesByEmail[0].agent_zk_id);
                setAgentProfile(profilesByEmail[0]);
              } else {
                console.log('⚠️ No Agent ZK profile found, will create truncated name');
              }
            }
          }
        } catch (profileErr) {
          console.error('Failed to load Agent ZK profile:', profileErr);
        }
      }
    } catch (err) {
      console.log('👤 No user logged in - wallet-only mode');
      setUser(null);
    }
  };

  const loadMyNFTs = async () => {
    setIsLoadingNFTs(true);
    try {
      // Try to load by email first
      const currentUser = await base44.auth.me();
      
      const allNFTs = await base44.entities.NFT.filter({
        owner_email: currentUser.email
      }, '-minted_at', 500);
      
      console.log('📦 All user NFTs:', allNFTs.length);
      
      const myNFTsList = allNFTs.filter(n => !n.in_nft_vault);
      setMyNFTs(myNFTsList);
    } catch (err) {
      // If not logged in, try loading by wallet address
      if (walletAddress) {
        try {
          const nftsByWallet = await base44.entities.NFT.filter({
            owner_wallet: walletAddress
          }, '-minted_at', 500);
          
          const myNFTsList = nftsByWallet.filter(n => !n.in_nft_vault);
          setMyNFTs(myNFTsList);
          console.log('📦 Loaded NFTs by wallet:', myNFTsList.length);
        } catch (walletErr) {
          console.error('Failed to load NFTs by wallet:', walletErr);
          setMyNFTs([]);
        }
      } else {
        console.log('No email or wallet available for loading NFTs');
        setMyNFTs([]);
      }
    } finally {
      setIsLoadingNFTs(false);
    }
  };

  const checkKaswareZEKUBalance = async (address) => {
    try {
      console.log('💰 Checking KRC-20 ZEKU balance for:', address);
      
      // Get KRC-20 token balance from Kasware
      const balanceResult = await window.kasware.getKRC20Balance(address, ZEKU_TICKER);
      
      console.log('✅ KRC-20 ZEKU Balance Result:', balanceResult);
      
      // Balance is returned as an array, get first element
      if (!balanceResult || balanceResult.length === 0) {
        console.warn('⚠️ No KRC-20 ZEKU balance found');
        setKaswareZekuBalance(0);
        return 0;
      }
      
      const tokenData = balanceResult[0];
      console.log('📊 Token data:', tokenData);
      
      // Balance is in smallest unit, convert to decimal
      // For KRC-20, decimals are typically 8
      const decimals = tokenData.dec || 8;
      const balanceRaw = parseFloat(tokenData.balance || 0);
      const balanceDecimal = balanceRaw / Math.pow(10, decimals);
      
      console.log('💎 ZEKU Balance:', balanceDecimal, 'ZEKU');
      
      setKaswareZekuBalance(balanceDecimal);
      return balanceDecimal;
      
    } catch (err) {
      console.error('Failed to check Kasware ZEKU balance:', err);
      setKaswareZekuBalance(0);
      return 0;
    }
  };

  const checkZEKUBalance = async (address) => {
    try {
      const functionSelector = '0x70a08231';
      const paddedAddress = padHexAddress(address);
      const callData = functionSelector + paddedAddress;
      
      try {
        const result = await window.ethereum.request({
          method: 'eth_call',
          params: [{
            to: ZEKU_ADDRESS,
            data: callData
          }, 'latest']
        });
        
        const balanceBigInt = hexToBigInt(result);
        const numericBalance = formatTokenAmount(balanceBigInt);
        
        console.log('💰 MetaMask ZEKU Balance:', numericBalance, 'ZEKU');
        
        setZekuBalance(numericBalance);
        return numericBalance;
        
      } catch (mmError) {
        const response = await fetch(KASPLEX_RPC, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_call',
            params: [{
              to: ZEKU_ADDRESS,
              data: callData
            }, 'latest']
          })
        });
        
        const json = await response.json();
        
        if (json.error) {
          throw new Error(json.error.message);
        }
        
        const balanceBigInt = hexToBigInt(json.result);
        const numericBalance = formatTokenAmount(balanceBigInt);
        
        console.log('💰 ZEKU Balance (RPC):', numericBalance, 'ZEKU');
        
        setZekuBalance(numericBalance);
        return numericBalance;
      }
      
    } catch (err) {
      console.error('Failed to check ZEKU balance:', err);
      setZekuBalance(0);
      return 0;
    }
  };

  const connectKasware = async () => {
    if (!window.kasware) {
      showToast('Kasware wallet not found!\n\nPlease install Kasware extension.', 'error');
      return;
    }

    setIsConnectingKasware(true);

    try {
      const accounts = await window.kasware.requestAccounts();
      const address = accounts[0];
      
      setKaswareAddress(address);
      setKaswareConnected(true);
      
      await checkKaswareZEKUBalance(address);
      
      showToast('Kasware connected successfully!', 'success');
      
    } catch (err) {
      console.error('Failed to connect Kasware:', err);
      showToast(`Connection failed\n\n${err.message}`, 'error');
    } finally {
      setIsConnectingKasware(false);
    }
  };

  const connectMetaMask = async () => {
    if (!window.ethereum) {
      showToast('MetaMask not found!\n\nPlease install MetaMask extension.', 'error');
      return;
    }

    setIsConnecting(true);

    try {
      // Detect if we're in iframe (development/preview mode)
      const isInIframe = window.self !== window.top;
      
      if (isInIframe) {
        console.log('🖼️ Running in iframe - MetaMask popup may be blocked');
        showToast('👆 Click the MetaMask extension icon\n\nPopups may be blocked in preview mode', 'info', 10000);
      }

      console.log('🔌 Requesting MetaMask accounts...');
      
      // Request accounts - this should trigger popup
      const requestedAccounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      console.log('✅ Accounts received:', requestedAccounts);
      
      // Check chain
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      if (chainId !== `0x${KASPLEX_CHAIN_ID.toString(16)}`) {
        console.log('🔄 Switching to Kasplex network...');
        
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${KASPLEX_CHAIN_ID.toString(16)}` }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            console.log('➕ Adding Kasplex network...');
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${KASPLEX_CHAIN_ID.toString(16)}`,
                chainName: 'Kasplex Network',
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

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const address = accounts[0];
      
      setWalletAddress(address);
      setWalletConnected(true);
      
      // Add ZEKU token
      if (!tokenAddedToMetaMask) {
        try {
          console.log('🪙 Adding ZEKU token...');
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
            localStorage.setItem('zeku_token_added_mint', 'true');
          }
        } catch (tokenError) {
          console.log('Token add skipped');
        }
      }
      
      await checkZEKUBalance(address);
      
      showToast('✅ MetaMask connected successfully!', 'success', 3000);
      
    } catch (err) {
      console.error('❌ Connection failed:', err);
      
      let errorMsg = 'Connection failed';
      
      if (err.code === 4001) {
        errorMsg = 'You rejected the connection';
      } else if (err.code === -32002) {
        errorMsg = '⚠️ MetaMask request pending\n\n👆 Click MetaMask extension to approve';
      } else {
        errorMsg = `Connection failed\n\n${err.message || 'Unknown error'}`;
      }
      
      showToast(errorMsg, 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  // ✅ Disconnect MetaMask
  const disconnectMetaMask = () => {
    setWalletConnected(false);
    setWalletAddress('');
    setZekuBalance(0);
    showToast('MetaMask disconnected', 'info', 2000);
  };

  // ✅ Switch MetaMask Account
  const switchMetaMaskAccount = async () => {
    if (!window.ethereum) {
      showToast('MetaMask not found!', 'error');
      return;
    }

    try {
      // Request permissions to change accounts
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      });
      // MetaMask should then trigger 'accountsChanged' event which will update state
      showToast('Please select a new account in MetaMask', 'info', 3000);
    } catch (err) {
      console.error('Failed to switch account:', err);
      showToast('Failed to switch account', 'error');
    }
  };

  const generateImage = async () => {
    if (!aiPrompt.trim()) {
      showToast('Please enter an AI prompt!', 'error');
      return;
    }

    setIsGenerating(true);

    try {
      const rarityPrompt = nftRarity !== 'common' ? `, ${nftRarity} quality, premium details` : '';
      
      const response = await base44.integrations.Core.GenerateImage({
        prompt: `Professional NFT art: ${aiPrompt}${rarityPrompt}. High quality, centered, clean background, detailed.`
      });

      if (response.url) {
        setGeneratedImage(response.url);
        
        // Save to localStorage so it persists
        localStorage.setItem('nft_generated_image', response.url);
        localStorage.setItem('nft_ai_prompt', aiPrompt);
        
        showToast('Image generated!', 'success', 3000);
      } else {
        throw new Error('No image URL returned');
      }
      
    } catch (err) {
      console.error('Generation failed:', err);
      showToast(`Image generation failed\n\n${err.message}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const addCustomTrait = () => {
    if (!newTraitName.trim() || !newTraitValue.trim()) return;
    
    setCustomTraits([...customTraits, {
      trait_type: newTraitName.trim(),
      value: newTraitValue.trim()
    }]);
    
    setNewTraitName('');
    setNewTraitValue('');
  };

  const removeTrait = (index) => {
    setCustomTraits(customTraits.filter((_, i) => i !== index));
  };

  const mintNFT = async (isBatch = false) => { // This function now only handles MetaMask (ERC-20) minting
    if (!walletConnected) {
      showToast('Please connect MetaMask first!', 'error');
      return;
    }

    if (!generatedImage) {
      showToast('Please generate an image first!', 'error');
      return;
    }

    if (zekuBalance < totalMintCost) {
      showToast(`Insufficient ZEKU!\n\nNeed: ${totalMintCost} ZEKU\nHave: ${zekuBalance.toFixed(2)} ZEKU`, 'error');
      return;
    }

    setIsMinting(true);

    try {
      const burnAddress = '0x000000000000000000000000000000000000dEaD';
      const amountWei = toWei(totalMintCost, 18);
      
      console.log('🔥 Preparing to burn ZEKU tokens:', {
        amount: totalMintCost,
        amountWei: amountWei,
        from: walletAddress,
        to: burnAddress,
        token: ZEKU_ADDRESS
      });

      // ERC-20 transfer function signature
      const transferData = '0xa9059cbb' + 
        padHexAddress(burnAddress) + 
        padAmount(amountWei);
      
      console.log('📝 Transaction data prepared:', {
        functionSignature: '0xa9059cbb',
        to: burnAddress,
        amount: totalMintCost
      });

      showToast('Opening MetaMask...', 'info', 0);
      
      let txHash;
      try {
        console.log('⛽ Fetching gas price...');
        
        // Get current network gas price
        const currentGasPrice = await window.ethereum.request({
          method: 'eth_gasPrice'
        });
        
        console.log('Current gas price:', currentGasPrice);
        
        // Use 2x for faster confirmation (not 5x to avoid too high gas)
        const gasPriceBigInt = BigInt(currentGasPrice);
        const priorityGasPrice = (gasPriceBigInt * BigInt(2)).toString(16);
        
        console.log('Using 2x priority gas:', '0x' + priorityGasPrice);
        
        console.log('🚀 Sending transaction to MetaMask...');
        
        // This should trigger MetaMask popup
        txHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: walletAddress,
            to: ZEKU_ADDRESS,
            data: transferData,
            gas: '0x13880',  // 80,000 gas (more buffer for ERC-20)
            gasPrice: '0x' + priorityGasPrice,
            value: '0x0'
          }],
        });
        
        console.log('✅ Transaction hash received:', txHash);
        
      } catch (txError) {
        console.error('❌ Transaction error:', txError);
        
        // Hide info toast
        setToast(null);
        
        // Handle specific MetaMask errors
        if (txError.code === 4001) {
          showToast('Transaction cancelled', 'error');
          setIsMinting(false);
          return;
        } else if (txError.code === -32002) {
          showToast('MetaMask is already processing a request.\n\nPlease check MetaMask popup.', 'error');
          setIsMinting(false);
          return;
        } else if (txError.code === -32603) {
          showToast('Transaction failed.\n\nPlease check your ZEKU balance and try again.', 'error');
          setIsMinting(false);
          return;
        } else if (txError.message?.includes('insufficient funds')) {
          showToast(`Insufficient funds for gas.\n\nMake sure you have KAS for gas fees.`, 'error');
          setIsMinting(false);
          return;
        }
        
        throw txError;
      }
      
      console.log('⏳ Waiting for confirmation...');
      showToast(`Transaction sent!\n\nWaiting for confirmation...`, 'info', 0);
      
      // Wait for confirmation
      let receipt = null;
      let attempts = 0;
      const maxAttempts = 60;
      
      while (attempts < maxAttempts && !receipt) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
        
        try {
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
            console.log('✅ Transaction confirmed!');
          }
        } catch (fetchError) {
          console.warn('Receipt check attempt', attempts, 'of', maxAttempts);
        }
      }
      
      if (!receipt) {
        throw new Error('Transaction confirmation timeout. Check MetaMask activity.');
      }

      console.log('💾 Creating NFT metadata...');

      const truncatedWalletAddr = walletAddress.substring(0, 10);
      const creatorName = agentProfile?.username || user?.username || `Wallet-${walletAddress.substring(0, 8)}`;
      const agentZkId = agentProfile?.agent_zk_id || null;
      const listPrice = customListPrice ? parseFloat(customListPrice) : totalMintCost;

      const nftsToMint = batchCount;
      const mintedNFTs = [];

      for (let i = 0; i < nftsToMint; i++) {
        const hashInput = `${truncatedWalletAddr}-${Date.now()}-${i}-${aiPrompt}`;
        const encoder = new TextEncoder();
        const data = encoder.encode(hashInput);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const uniqueHash = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        const mintTimestamp = new Date().toISOString();
        
        const allTraits = [
          { trait_type: 'Creator', value: creatorName },
          { trait_type: 'Agent ZK ID', value: agentZkId || 'None' },
          { trait_type: 'Rarity', value: currentRarity.label },
          { trait_type: 'AI Generated', value: 'Yes' },
          { trait_type: 'Platform', value: 'TTT' },
          { trait_type: 'Mint Cost', value: `${totalMintCost} ZEKU` },
          { trait_type: 'List Price', value: `${listPrice} ZEKU` },
          { trait_type: 'Minted', value: new Date(mintTimestamp).toLocaleDateString() },
          { trait_type: 'Minted With', value: 'MetaMask (ERC-20)' },
          ...customTraits
        ];

        const nftData = {
          token_id: uniqueHash,
          owner_email: user?.email || `wallet_${walletAddress}`,
          owner_wallet: walletAddress,
          owner_agent_zk_id: agentZkId,
          owner_agent_name: creatorName,
          image_url: generatedImage,
          metadata: {
            name: `${aiPrompt.substring(0, 30)} #${i + 1}`,
            description: `AI-generated ${currentRarity.label} NFT: ${aiPrompt}`,
            creator: creatorName,
            agent_zk_id: agentZkId,
            rarity: currentRarity.label,
            attributes: allTraits
          },
          unique_hash: uniqueHash,
          truncated_address: truncatedWalletAddr,
          mint_transaction: txHash,
          zeku_cost: totalMintCost,
          list_price: listPrice,
          contract_address: ZEKU_ADDRESS,
          minted_at: mintTimestamp,
          stamped_at: mintTimestamp,
          is_verified: true,
          is_listed: false,
          ai_prompt: aiPrompt,
          generation_status: 'minted',
          rarity: currentRarity.value,
          in_nft_vault: false
        };

        // Try to save to database (optional if user not logged in)
        try {
          const nft = await base44.entities.NFT.create(nftData);
          mintedNFTs.push(nft);

          if (i === 0) {
            setLastMintedNFT(nft);
          }
          
          console.log(`✅ NFT #${i + 1} saved to database`);
        } catch (dbErr) {
          console.log(`⚠️ NFT #${i + 1} minted on-chain but not saved to database (user not logged in)`);
          // Still track the NFT locally even if DB save fails
          mintedNFTs.push(nftData);
          if (i === 0) {
            setLastMintedNFT(nftData);
          }
        }

        if (i < nftsToMint - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      console.log('🎉 Minting complete!');
      
      await checkZEKUBalance(walletAddress);
      if (kaswareConnected) {
        await checkKaswareZEKUBalance(kaswareAddress);
      }
      await loadMyNFTs();
      
      setCustomTraits([]);
      setNftRarity('common');
      setBatchCount(1);
      setCustomListPrice('');
      
      const successMsg = nftsToMint > 1 
        ? `${nftsToMint} NFTs Minted!\n\n💰 Cost: ${totalMintCost} ZEKU\n🎯 Rarity: ${currentRarity.label}\n👤 Creator: ${creatorName}\n🔥 Tokens burned to: 0x...dEaD\n\n${user ? '✅ Check "My NFTs"!' : '⚠️ Login to save NFTs to your account'}`
        : `NFT Minted!\n\n💰 Cost: ${totalMintCost} ZEKU\n🎯 Rarity: ${currentRarity.label}\n👤 Creator: ${creatorName}\n🔥 Tokens burned to: 0x...dEaD\n\n${user ? '✅ Check "My NFTs"!' : '⚠️ Login to save NFTs to your account'}`;
      
      showToast(successMsg, 'success', 10000);
      
    } catch (err) {
      console.error('❌ Minting failed:', err);
      
      let errorMsg = 'Minting failed';
      
      if (err.message?.includes('user rejected') || err.message?.includes('User rejected')) {
        errorMsg = 'Transaction cancelled';
      } else if (err.message?.includes('insufficient funds')) {
        errorMsg = `Insufficient funds\n\nNeed: ${totalMintCost} ZEKU + gas`;
      } else if (err.message?.includes('timeout')) {
        errorMsg = 'Transaction timeout\n\nCheck MetaMask activity';
      } else {
        errorMsg = `Minting failed\n\n${err.message}`;
      }
      
      showToast(errorMsg, 'error');
    } finally {
      setIsMinting(false);
    }
  };

  const mintNFTWithKasware = async (isBatch = false) => {
    if (!kaswareConnected) {
      showToast('Please connect Kasware first!', 'error');
      return;
    }

    if (!generatedImage) {
      showToast('Please generate an image first!', 'error');
      return;
    }

    if (kaswareZekuBalance < totalMintCost) {
      showToast(`Insufficient ZEKU!\n\nNeed: ${totalMintCost} ZEKU\nHave: ${kaswareZekuBalance.toFixed(2)} ZEKU`, 'error');
      return;
    }

    setIsMinting(true);

    try {
      showToast('🚧 Kasware KRC-20 minting coming soon!\n\nPlease use MetaMask for now.', 'info', 0);
      setIsMinting(false);
      return;

      // TODO: Implement Kasware KRC-20 minting when API is ready
      // const burnAddress = 'kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e';
      // const result = await window.kasware.sendKaspa(burnAddress, totalMintCost * 100000000);
      
    } catch (err) {
      console.error('❌ Kasware minting failed:', err);
      showToast(`Kasware minting failed\n\n${err.message}`, 'error');
    } finally {
      setIsMinting(false);
    }
  };

  const clearGeneratedImage = () => {
    setGeneratedImage(null);
    setAiPrompt('');
    localStorage.removeItem('nft_generated_image');
    localStorage.removeItem('nft_ai_prompt');
  };

  const truncateAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 10)}...${address.substring(address.length - 8)}`;
  };

  const copyToClipboard = (text, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    if (isScrolling) {
      return;
    }
    
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success', 2000);
  };

  useEffect(() => {
    let scrollTimer = null;
    
    const handleScroll = () => {
      setIsScrolling(true);
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimer);
    };
  }, []);

  // Total ZEKU balance across both wallets
  const totalZekuBalance = kaswareZekuBalance + zekuBalance;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      {editingNFT && (
        <NFTEditModal
          nft={editingNFT}
          onClose={() => setEditingNFT(null)}
          onUpdate={loadMyNFTs}
          showToast={showToast}
        />
      )}

      <AnimatePresence>
        {showVault && (
          <VaultModal
            user={user}
            walletAddress={walletAddress}
            onClose={() => setShowVault(false)}
            showToast={showToast}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 p-6 md:p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Trophy className="w-16 h-16 text-white" strokeWidth={1.5} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              AI NFT Generator
            </h1>
            <p className="text-gray-400 text-lg mb-4">
              Create and mint AI-generated NFTs with custom attributes using ZEKU
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Badge className="bg-white/5 text-white border-white/20 px-4 py-2">
                <Sparkles className="w-4 h-4 mr-2" />
                AI-Powered
              </Badge>
              <Badge className="bg-white/5 text-white border-white/20 px-4 py-2">
                <Layers className="w-4 h-4 mr-2" />
                Custom Traits
              </Badge>
              <Badge className="bg-white/5 text-white border-white/20 px-4 py-2">
                <Zap className="w-4 h-4 mr-2" />
                Batch Minting
              </Badge>
            </div>
          </motion.div>

          {(!walletConnected && !kaswareConnected) ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Card className="bg-black border-white/10">
                <CardContent className="p-8 text-center">
                  <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-4">Connect Wallet</h2>
                  <p className="text-gray-400 mb-6">
                    Connect Kasware (KRC-20) or MetaMask (EVM) to mint NFTs with ZEKU
                  </p>
                  <div className="flex gap-4 justify-center flex-wrap">
                    <Button
                      onClick={connectKasware}
                      disabled={isConnectingKasware}
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 h-12 px-8"
                    >
                      {isConnectingKasware ? (
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
                    <Button
                      onClick={connectMetaMask}
                      disabled={isConnecting}
                      className="bg-white/10 border border-white/20 text-white hover:bg-white/20 h-12 px-8"
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
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <Card className="bg-black border-white/10">
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Kasware Wallet Info */}
                      {kaswareConnected && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                              <Check className="w-3 h-3 mr-1" />
                              Kasware Connected
                            </Badge>
                            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                              KRC-20
                            </Badge>
                          </div>
                          <div>
                            <div className="text-sm text-gray-400 mb-1">Kasware Address</div>
                            <div className="flex items-center gap-2">
                              <code className="text-white font-mono text-sm select-all">{truncateAddress(kaswareAddress)}</code>
                              <button
                                onClick={(e) => copyToClipboard(kaswareAddress, e)}
                                className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors flex-shrink-0 touch-manipulation"
                                title="Copy wallet address"
                                type="button"
                              >
                                <Copy className="w-4 h-4 pointer-events-none" />
                              </button>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-400 mb-1">KRC-20 ZEKU Balance</div>
                            <div className="flex items-center gap-2">
                              <div className="text-xl font-bold text-cyan-400">
                                {kaswareZekuBalance.toFixed(2)}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  if (!isScrolling) checkKaswareZEKUBalance(kaswareAddress);
                                }}
                                className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors flex-shrink-0 touch-manipulation"
                                title="Refresh balance"
                                type="button"
                              >
                                <RefreshCw className="w-4 h-4 pointer-events-none" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* MetaMask Wallet Info */}
                      {walletConnected && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 justify-between">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                                <Check className="w-3 h-3 mr-1" />
                                MetaMask Connected
                              </Badge>
                              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                                EVM
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                onClick={switchMetaMaskAccount}
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs bg-white/5 hover:bg-white/10 border border-white/10"
                                title="Switch Account"
                              >
                                <RefreshCw className="w-3 h-3" />
                              </Button>
                              <Button
                                onClick={disconnectMetaMask}
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                title="Disconnect"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-400 mb-1">MetaMask Address</div>
                            <div className="flex items-center gap-2">
                              <code className="text-white font-mono text-sm select-all">{truncateAddress(walletAddress)}</code>
                              <button
                                onClick={(e) => copyToClipboard(walletAddress, e)}
                                className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors flex-shrink-0 touch-manipulation"
                                title="Copy wallet address"
                                type="button"
                              >
                                <Copy className="w-4 h-4 pointer-events-none" />
                              </button>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-400 mb-1">EVM ZEKU Balance</div>
                            <div className="flex items-center gap-2">
                              <div className="text-xl font-bold text-blue-400">
                                {zekuBalance.toFixed(2)}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  if (!isScrolling) checkZEKUBalance(walletAddress);
                                }}
                                className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors flex-shrink-0 touch-manipulation"
                                title="Refresh balance"
                                type="button"
                              >
                                <RefreshCw className="w-4 h-4 pointer-events-none" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Agent ZK Info */}
                      {agentProfile && (
                        <div className={walletConnected && kaswareConnected ? "md:col-span-2" : ""}>
                          <div className="text-sm text-gray-400 mb-1">Agent ZK</div>
                          <div className="flex items-center gap-2">
                            <div className="text-white font-semibold text-sm">{agentProfile.username}</div>
                            <Badge className="bg-white/5 text-white border-white/20 text-xs">
                              {agentProfile.agent_zk_id}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Total Balance Display */}
                    {(kaswareConnected || walletConnected) && (
                      <div className="mt-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4">
                        <div className="text-center">
                          <div className="text-sm text-gray-400 mb-2">Total ZEKU Balance</div>
                          <div className="text-3xl font-bold text-white mb-1">
                            {totalZekuBalance.toFixed(2)} ZEKU
                          </div>
                          <div className="text-xs text-gray-400">
                            {kaswareConnected && `KRC-20: ${kaswareZekuBalance.toFixed(2)}`}
                            {kaswareConnected && walletConnected && ' + '}
                            {walletConnected && `EVM: ${zekuBalance.toFixed(2)}`}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <div className="grid lg:grid-cols-2 gap-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Card className="bg-black border-white/10">
                    <CardContent className="p-6">
                      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-white" />
                        Generate & Customize
                      </h2>

                      <div className="space-y-4">
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">
                            AI Prompt
                          </label>
                          <Textarea
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="cyber samurai, neon armor, futuristic city..."
                            className="bg-white/5 border-white/10 text-white h-24"
                          />
                        </div>

                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">
                            Rarity (affects cost & quality)
                          </label>
                          <div className="grid grid-cols-5 gap-2">
                            {rarityOptions.map((rarity) => (
                              <button
                                key={rarity.value}
                                onClick={() => setNftRarity(rarity.value)}
                                className={`p-3 rounded-lg border-2 transition-all ${
                                  nftRarity === rarity.value
                                    ? rarity.color + ' border-white'
                                    : 'bg-black border-white/10 text-gray-500'
                                }`}
                              >
                                <div className="text-xs font-bold mb-1">{rarity.label}</div>
                                <div className="text-[10px] text-gray-400">
                                  {rarity.multiplier}x
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">
                            Custom Traits (Optional)
                          </label>
                          <div className="space-y-2">
                            {customTraits.map((trait, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-2">
                                <span className="text-xs text-gray-400 flex-1">{trait.trait_type}:</span>
                                <span className="text-xs text-white">{trait.value}</span>
                                <button
                                  onClick={() => removeTrait(idx)}
                                  className="text-gray-400 hover:text-white"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            
                            <div className="flex gap-2">
                              <Input
                                value={newTraitName}
                                onChange={(e) => setNewTraitName(e.target.value)}
                                placeholder="Trait name"
                                className="flex-1 bg-white/5 border-white/10 text-white text-sm h-9"
                              />
                              <Input
                                value={newTraitValue}
                                onChange={(e) => setNewTraitValue(e.target.value)}
                                placeholder="Value"
                                className="flex-1 bg-white/5 border-white/10 text-white text-sm h-9"
                              />
                              <Button
                                onClick={addCustomTrait}
                                size="sm"
                                variant="outline"
                                className="border-white/20 text-white h-9 px-3 bg-white/5 hover:bg-white/10"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={generateImage}
                          disabled={isGenerating || !aiPrompt.trim()}
                          className="w-full bg-white/10 border border-white/20 text-white hover:bg-white/20 h-12"
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <ImageIcon className="w-5 h-5 mr-2" />
                              Generate Image
                            </>
                          )}
                        </Button>

                        {generatedImage && (
                          <div className="mt-6 space-y-4">
                            <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-white/20">
                              <img
                                src={generatedImage}
                                alt="Generated NFT"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-2 right-2">
                                <Badge className={currentRarity.color}>
                                  {currentRarity.label}
                                </Badge>
                              </div>
                            </div>
                            <Button
                              onClick={clearGeneratedImage}
                              variant="destructive"
                              className="w-full bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 h-10"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Clear Generated Image
                            </Button>

                            <div>
                              <label className="text-sm text-gray-400 mb-2 block">
                                Custom Shop Price (Optional)
                              </label>
                              <Input
                                type="number"
                                value={customListPrice}
                                onChange={(e) => setCustomListPrice(e.target.value)}
                                placeholder={`Default: ${totalMintCost} ZEKU`}
                                className="bg-white/5 border-white/10 text-white"
                                min="0"
                                step="0.1"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Set a custom price for shop listings (defaults to mint cost if empty)
                              </p>
                            </div>

                            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3">
                              <div className="text-sm text-white">Batch Mint</div>
                              <button
                                onClick={() => setShowBatchMint(!showBatchMint)}
                                className={`w-12 h-6 rounded-full transition-all ${
                                  showBatchMint ? 'bg-white/20' : 'bg-white/10'
                                }`}
                              >
                                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                  showBatchMint ? 'translate-x-6' : 'translate-x-0.5'
                                }`} />
                              </button>
                            </div>

                            {showBatchMint && (
                              <div>
                                <label className="text-sm text-gray-400 mb-2 block">
                                  Number of NFTs to Mint
                                </label>
                                <div className="flex items-center gap-3">
                                  <Button
                                    onClick={() => setBatchCount(Math.max(1, batchCount - 1))}
                                    variant="outline"
                                    size="icon"
                                    className="border-white/20 text-white bg-white/5 hover:bg-white/10"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </Button>
                                  <Input
                                    type="number"
                                    value={batchCount}
                                    onChange={(e) => setBatchCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                                    className="flex-1 bg-white/5 border-white/10 text-white text-center text-lg font-bold"
                                    min="1"
                                    max="10"
                                  />
                                  <Button
                                    onClick={() => setBatchCount(Math.min(10, batchCount + 1))}
                                    variant="outline"
                                    size="icon"
                                    className="border-white/20 text-white bg-white/5 hover:bg-white/10"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </div>
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                  Maximum 10 NFTs per batch
                                </p>
                              </div>
                            )}

                            <div className="bg-white/5 border border-white/20 rounded-xl p-4">
                              <div className="text-center">
                                <div className="text-sm text-gray-400 mb-2">Total Mint Cost</div>
                                <div className="text-3xl font-bold text-white mb-1">
                                  {totalMintCost} ZEKU
                                </div>
                                <div className="text-xs text-gray-400">
                                  {mintAmount} base × {currentRarity.multiplier}x rarity × {batchCount} NFT{batchCount > 1 ? 's' : ''}
                                </div>
                                <div className="text-xs text-gray-500 mt-2">
                                  Available: {totalZekuBalance.toFixed(2)} ZEKU
                                </div>
                              </div>
                            </div>

                            {/* Separate Mint Buttons */}
                            <div className="space-y-3">
                              {/* MetaMask Mint Button */}
                              <Button
                                onClick={() => mintNFT(batchCount > 1)}
                                disabled={isMinting || !walletConnected || zekuBalance < totalMintCost}
                                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white h-14 text-lg font-semibold"
                              >
                                {isMinting ? (
                                  <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Minting...
                                  </>
                                ) : !walletConnected ? (
                                  <>
                                    <Wallet className="w-5 h-5 mr-2" />
                                    Connect MetaMask First
                                  </>
                                ) : zekuBalance < totalMintCost ? (
                                  <>
                                    <AlertCircle className="w-5 h-5 mr-2" />
                                    Insufficient MetaMask ZEKU ({zekuBalance.toFixed(2)})
                                  </>
                                ) : (
                                  <>
                                    <Trophy className="w-5 h-5 mr-2" />
                                    Mint with MetaMask - {totalMintCost} ZEKU
                                  </>
                                )}
                              </Button>

                              {/* Kasware Mint Button */}
                              <Button
                                onClick={() => mintNFTWithKasware(batchCount > 1)}
                                disabled={isMinting || !kaswareConnected || kaswareZekuBalance < totalMintCost}
                                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white h-14 text-lg font-semibold"
                              >
                                {isMinting ? (
                                  <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Minting...
                                  </>
                                ) : !kaswareConnected ? (
                                  <>
                                    <Shield className="w-5 h-5 mr-2" />
                                    Connect Kasware First
                                  </>
                                ) : kaswareZekuBalance < totalMintCost ? (
                                  <>
                                    <AlertCircle className="w-5 h-5 mr-2" />
                                    Insufficient Kasware ZEKU ({kaswareZekuBalance.toFixed(2)})
                                  </>
                                ) : (
                                  <>
                                    <Trophy className="w-5 h-5 mr-2" />
                                    Mint with Kasware - {totalMintCost} ZEKU (Coming Soon)
                                  </>
                                )}
                              </Button>
                            </div>

                            <div className="bg-white/5 border border-white/20 rounded-lg p-3">
                              <div className="flex items-start gap-2 text-xs text-gray-300">
                                <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="font-semibold mb-1">Choose Your Wallet</p>
                                  <p>
                                    🟠 MetaMask: Use ERC-20 ZEKU tokens<br/>
                                    🟣 Kasware: KRC-20 support coming soon!
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Card className="bg-black border-white/10">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                          <Trophy className="w-6 h-6 text-white" />
                          My NFTs ({myNFTs.length + (lastMintedNFT && !myNFTs.find(n => n.id === lastMintedNFT.id) ? 1 : 0)})
                        </h2>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => setShowVault(true)}
                            size="sm"
                            variant="outline"
                            className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 bg-purple-500/5"
                            title="Open ZK Vault"
                          >
                            <Shield className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={loadMyNFTs}
                            size="sm"
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10 bg-white/5"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {isLoadingNFTs ? (
                        <div className="text-center py-12">
                          <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
                          <p className="text-gray-400">Loading NFTs...</p>
                        </div>
                      ) : (myNFTs.length === 0 && !lastMintedNFT) ? (
                        <div className="text-center py-12">
                          <ImageIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                          <p className="text-gray-400">No NFTs minted yet</p>
                          <p className="text-sm text-gray-500 mt-2">
                            Generate and mint your first NFT!
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-3" style={{
                          scrollbarWidth: 'thin',
                          scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
                        }}>
                          <style>{`
                            .space-y-4::-webkit-scrollbar {
                              width: 8px;
                            }
                            .space-y-4::-webkit-scrollbar-track {
                              background: transparent;
                            }
                            .space-y-4::-webkit-scrollbar-thumb {
                              background: rgba(255, 255, 255, 0.2);
                              border-radius: 4px;
                            }
                            .space-y-4::-webkit-scrollbar-thumb:hover {
                              background: rgba(255, 255, 255, 0.3);
                            }
                          `}</style>

                          {lastMintedNFT && !myNFTs.find(n => n.id === lastMintedNFT.id) && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="relative cursor-pointer hover:scale-[1.02] transition-transform"
                              onClick={() => setEditingNFT(lastMintedNFT)}
                            >
                              <Card className={`bg-gradient-to-br ${rarityColors[(lastMintedNFT.metadata?.rarity || lastMintedNFT.rarity || 'common').toLowerCase()]?.bg} border-2 ${rarityColors[(lastMintedNFT.metadata?.rarity || lastMintedNFT.rarity || 'common').toLowerCase()]?.border} shadow-xl overflow-hidden`}>
                                <CardContent className="p-0">
                                  <div className="aspect-square relative">
                                    <img
                                      src={lastMintedNFT.image_url}
                                      alt={lastMintedNFT.metadata?.name}
                                      className="w-full h-full object-cover"
                                    />
                                    
                                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                                      <Badge className={`${rarityColors[(lastMintedNFT.metadata?.rarity || lastMintedNFT.rarity || 'common').toLowerCase()]?.badgeBg} ${rarityColors[(lastMintedNFT.metadata?.rarity || lastMintedNFT.rarity || 'common').toLowerCase()]?.badgeText} border-none font-extrabold text-xs shadow-2xl px-3 py-1 animate-pulse`}>
                                        {(lastMintedNFT.metadata?.rarity || lastMintedNFT.rarity || 'common').toUpperCase()}
                                      </Badge>
                                      <Badge className="bg-green-700 text-white border-none font-bold animate-pulse text-xs px-2 py-1 shadow-2xl">
                                        JUST MINTED!
                                      </Badge>
                                    </div>

                                    <div className="absolute bottom-2 right-2">
                                      <Badge className="bg-black text-white border-none font-bold shadow-2xl flex items-center gap-1.5 px-3 py-1.5">
                                        <Diamond className="w-4 h-4" strokeWidth={2.5} />
                                        <span className="text-sm">{lastMintedNFT.zeku_cost} ZEKU</span>
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  <div className="p-4 bg-black/40 backdrop-blur-sm">
                                    <h3 className="text-white font-bold mb-1 truncate">
                                      {lastMintedNFT.metadata?.name || 'Untitled NFT'}
                                    </h3>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {lastMintedNFT.owner_agent_zk_id && (
                                        <Badge className="bg-white/5 text-white border-white/20 text-xs">
                                          {lastMintedNFT.owner_agent_zk_id}
                                        </Badge>
                                      )}
                                      <span className="text-xs text-gray-400">
                                        {lastMintedNFT.owner_agent_name}
                                      </span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          )}

                          {myNFTs.map((nft, idx) => {
                            const rarity = nft.metadata?.rarity || nft.rarity || 'common';
                            const rarityStyle = rarityColors[rarity.toLowerCase()] || rarityColors.common;
                            
                            return (
                              <motion.div
                                key={nft.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="cursor-pointer hover:scale-[1.02] transition-transform"
                                onClick={() => setEditingNFT(nft)}
                              >
                                <Card className={`bg-gradient-to-br ${rarityStyle.bg} border ${rarityStyle.border} hover:border-white/50 shadow-lg overflow-hidden`}>
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
                                        {nft.is_verified && (
                                          <Badge className="bg-green-700 text-white border-none font-bold text-xs px-2 py-1 shadow-2xl">
                                            <Check className="w-3 h-3 mr-1" />
                                            Verified
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
                                      <h3 className="text-white font-semibold mb-1 truncate">
                                        {nft.metadata?.name || 'Untitled NFT'}
                                      </h3>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        {nft.owner_agent_zk_id && (
                                          <Badge className="bg-white/5 text-white border-white/20 text-xs">
                                            {nft.owner_agent_zk_id}
                                          </Badge>
                                        )}
                                        <span className="text-xs text-gray-500">
                                          {nft.owner_agent_name}
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
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}