import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, Wallet, RefreshCw, AlertCircle, Grid3x3 } from "lucide-react";
import TransferForm from "../components/bridge/TransferForm";
import RecentTransactions from "../components/bridge/RecentTransactions";
import BridgeAssistant from "../components/bridge/BridgeAssistant";
import GlobalCounter from "../components/bridge/GlobalCounter";
import IOSWalletModal from "../components/bridge/IOSWalletModal";
import ProofOfLifeButton from "../components/bridge/ProofOfLifeButton";

// Network configurations - UPDATED WITH CORRECT KASPLEX L2 INFO
const NETWORKS = {
  mainnet: {
    chainId: '0x31D9B', // 202555 in decimal - Kasplex Layer-2
    chainName: 'Kasplex Layer-2',
    nativeCurrency: {
      name: 'Kaspa',
      symbol: 'KAS',
      decimals: 18
    },
    rpcUrls: ['https://evmrpc.kasplex.org'],
    blockExplorerUrls: ['https://explorer.kasplex.org']
  },
  testnet: {
    chainId: '0x28D74',
    chainName: 'Kasplex Network Testnet',
    nativeCurrency: {
      name: 'Kaspa',
      symbol: '$KAS',
      decimals: 18
    },
    rpcUrls: ['https://rpc.kasplextest.xyz'],
    blockExplorerUrls: ['https://frontend.kasplextest.xyz']
  }
};

// Detect iOS device
const isIOS = () => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
};

// Detect if running in a native wrapper (like Natively)
const isNativeWrapper = () => {
  return window.navigator.standalone ||
         window.matchMedia('(display-mode: standalone)').matches ||
         document.referrer.includes('android-app://') ||
         /natively/i.test(window.navigator.userAgent);
};

// Detect if running in Mises Browser
const isMisesBrowser = () => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /mises/i.test(userAgent);
};

export default function BridgePage() {
  const [kaswareWallet, setKaswareWallet] = useState({ connected: false, address: null, balance: 0 });
  const [metamaskWallet, setMetamaskWallet] = useState({ connected: false, address: null, balance: 0 });
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAssistant, setShowAssistant] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [user, setUser] = useState(null);
  const [globalCounterRefresh, setGlobalCounterRefresh] = useState(0);
  const [network, setNetwork] = useState('mainnet');
  const [detectedNetwork, setDetectedNetwork] = useState(null);
  const [transactionError, setTransactionError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [isInNativeWrapper, setIsInNativeWrapper] = useState(false);
  const [isInMisesBrowser, setIsInMisesBrowser] = useState(false);

  const loadTransactions = async (isRetry = false) => {
    try {
      if (!isRetry) {
        console.log('🔄 Loading transactions in real-time...');
      } else {
        console.log(`🔄 Retrying transaction load (attempt ${retryCount + 1})...`);
      }
      
      setTransactionError(null);
      
      // Increased timeout to 30 seconds and reduced query size
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout - please check your internet connection')), 30000)
      );
      
      // Reduced from 100 to 50 for faster loading
      const loadPromise = base44.entities.BridgeTransaction.list('-created_date', 50);
      
      const allTransactions = await Promise.race([loadPromise, timeoutPromise]);
      
      console.log('✅ Loaded', allTransactions.length, 'transactions');
      if (allTransactions.length > 0) {
        console.log('📅 Most recent transaction:', {
          id: allTransactions[0].id,
          created: allTransactions[0].created_date,
          status: allTransactions[0].status,
          amount: allTransactions[0].amount
        });
      }
      
      setTransactions(allTransactions);
      setRetryCount(0); // Reset retry count on success
      
    } catch (error) {
      console.error('❌ Failed to load transactions:', error);
      
      const errorMessage = error.message || 'Network Error';
      setTransactionError(errorMessage);
      
      // Only retry if we haven't exceeded max retries
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.log(`⏳ Retrying in ${delay/1000}s...`);
        
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          loadTransactions(true);
        }, delay);
      } else {
        console.error('❌ Max retries reached. Showing empty list.');
        setTransactions([]); // Set empty array instead of leaving undefined
        setRetryCount(0); // Reset for next manual attempt
      }
    }
  };

  const loadUserAndTransactions = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me().catch(() => null);
      setUser(currentUser);
      await loadTransactions();
    } catch (error) {
      console.error('Failed to load user:', error);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateBridgeWalletsState = (updates) => {
    try {
      const current = localStorage.getItem('bridge_wallets_state');
      const state = current ? JSON.parse(current) : {};
      const newState = { ...state, ...updates };
      localStorage.setItem('bridge_wallets_state', JSON.stringify(newState));
    } catch (e) {
      console.error('Failed to update bridge wallets state:', e);
    }
  };

  const detectMetaMaskNetwork = async () => {
    if (typeof window.ethereum === 'undefined') {
      setDetectedNetwork(null);
      setNetwork('mainnet');
      localStorage.removeItem('bridge_network');
      return;
    }

    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      console.log('🔍 Detected MetaMask Chain ID:', chainId);
      console.log('🔍 Chain ID as decimal:', parseInt(chainId, 16));
      
      // Kasplex Layer-2 Mainnet = 202555 (0x31D9B)
      // Kasplex L2 Testnet = 166260 (0x28D74)
      
      if (chainId === NETWORKS.mainnet.chainId || parseInt(chainId, 16) === 202555) {
        console.log('✅ On Kasplex Layer-2 Mainnet (202555)');
        setDetectedNetwork('mainnet');
        setNetwork('mainnet');
        localStorage.setItem('bridge_network', 'mainnet');
      } else if (chainId === NETWORKS.testnet.chainId || parseInt(chainId, 16) === 166260) {
        console.log('✅ On Kasplex Network Testnet (166260)');
        setDetectedNetwork('testnet');
        setNetwork('testnet');
        localStorage.setItem('bridge_network', 'testnet');
      } else {
        console.log('⚠️ Unknown network:', chainId, '(decimal:', parseInt(chainId, 16) + ')');
        console.log('⚠️ Defaulting to mainnet');
        setDetectedNetwork('mainnet');
        setNetwork('mainnet');
        localStorage.setItem('bridge_network', 'mainnet');
      }
    } catch (err) {
      console.error('Failed to detect network:', err);
      setDetectedNetwork('mainnet');
      setNetwork('mainnet');
      localStorage.setItem('bridge_network', 'mainnet');
    }
  };

  const checkIOSWalletConnections = () => {
    const metamaskConnected = localStorage.getItem('ios_metamask_connected');
    const metamaskAddress = localStorage.getItem('ios_metamask_address');
    
    if (metamaskConnected === 'true' && metamaskAddress) {
      console.log('✅ iOS MetaMask connection found:', metamaskAddress);
      setMetamaskWallet({
        connected: true,
        address: metamaskAddress,
        balance: 0
      });
      
      if (typeof window.ethereum !== 'undefined') {
        window.ethereum.request({
          method: 'eth_getBalance',
          params: [metamaskAddress, 'latest']
        }).then(balance => {
          const balanceInKAS = parseInt(balance, 16) / 1e18;
          console.log('💰 iOS MetaMask balance:', balanceInKAS, 'KAS');
          setMetamaskWallet(prev => ({ 
            ...prev, 
            balance: balanceInKAS
          }));
        }).catch(err => {
          console.error('Failed to fetch iOS MetaMask balance:', err);
        });
      }
    }

    const kastleConnected = localStorage.getItem('ios_kastle_connected');
    const kastleAddress = localStorage.getItem('ios_kastle_address');
    
    if (kastleConnected === 'true' && kastleAddress) {
      console.log('✅ iOS Kastle connection found:', kastleAddress);
      setKaswareWallet({
        connected: true,
        address: kastleAddress,
        balance: 0
      });
    }
  };

  const checkWallets = async () => {
    const kaswareDisconnected = sessionStorage.getItem('kasware_disconnected') === 'true';
    
    if (typeof window.kasware !== 'undefined' && !kaswareDisconnected) {
      try {
        const accounts = await window.kasware.getAccounts();
        if (accounts.length > 0) {
          const balanceResult = await window.kasware.getBalance();
          const balance = balanceResult.total || 0;
          const walletData = { 
            connected: true, 
            address: accounts[0], 
            balance: balance / 1e8 
          };
          setKaswareWallet(walletData);
          updateBridgeWalletsState({ kasware: walletData });
        } else {
          setKaswareWallet({ connected: false, address: null, balance: 0 });
          updateBridgeWalletsState({ kasware: { connected: false, address: null, balance: 0 } });
        }
      } catch (err) {
        console.error('Failed to check Kasware:', err);
        setKaswareWallet({ connected: false, address: null, balance: 0 });
        updateBridgeWalletsState({ kasware: { connected: false, address: null, balance: 0 } });
      }
    } else if (kaswareDisconnected) {
      setKaswareWallet({ connected: false, address: null, balance: 0 });
      updateBridgeWalletsState({ kasware: { connected: false, address: null, balance: 0 } });
    } else {
      setKaswareWallet({ connected: false, address: null, balance: 0 });
      updateBridgeWalletsState({ kasware: { connected: false, address: null, balance: 0 } });
    }

    const metamaskDisconnected = sessionStorage.getItem('metamask_disconnected') === 'true';

    if (typeof window.ethereum !== 'undefined' && !metamaskDisconnected) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          console.log('💰 Fetching MetaMask balance for:', accounts[0]);
          
          try {
            // Force a fresh balance check with multiple retries
            let balanceWei;
            let retries = 3;
            
            while (retries > 0) {
              try {
                balanceWei = await window.ethereum.request({
                  method: 'eth_getBalance',
                  params: [accounts[0], 'latest']
                });
                
                console.log('📦 Raw balance response:', balanceWei);
                
                if (balanceWei !== undefined && balanceWei !== null) {
                  break;
                }
              } catch (e) {
                console.warn(`⚠️ Balance fetch attempt ${4 - retries} failed:`, e);
                retries--;
                if (retries > 0) {
                  await new Promise(resolve => setTimeout(resolve, 500));
                }
              }
            }
            
            if (!balanceWei && balanceWei !== '0x0') {
              throw new Error('Failed to fetch balance after retries');
            }
            
            // Convert from hex to decimal
            let balanceNum;
            if (typeof balanceWei === 'string' && balanceWei.startsWith('0x')) {
              balanceNum = BigInt(balanceWei);
            } else if (typeof balanceWei === 'number') {
              balanceNum = BigInt(Math.floor(balanceWei));
            } else {
              balanceNum = BigInt(balanceWei);
            }
            
            const balanceInKAS = Number(balanceNum) / 1e18;
            
            console.log('✅ MetaMask balance:', balanceInKAS, 'KAS');
            console.log('   Wei:', balanceNum.toString());
            
            const walletData = { 
              connected: true, 
              address: accounts[0], 
              balance: balanceInKAS
            };
            
            setMetamaskWallet(walletData);
            updateBridgeWalletsState({ metamask: walletData });

            await detectMetaMaskNetwork();
            
          } catch (balanceError) {
            console.error('❌ Failed to fetch balance:', balanceError);
            
            // Set connected with 0 balance and show error
            const walletData = { 
              connected: true, 
              address: accounts[0], 
              balance: 0
            };
            
            setMetamaskWallet(walletData);
            updateBridgeWalletsState({ metamask: walletData });
            
            await detectMetaMaskNetwork();
            
            // Try to refresh balance after a delay
            setTimeout(() => checkWallets(), 2000);
          }
        } else {
          setMetamaskWallet({ connected: false, address: null, balance: 0 });
          setDetectedNetwork(null);
          setNetwork('mainnet');
          updateBridgeWalletsState({ metamask: { connected: false, address: null, balance: 0 } });
          localStorage.removeItem('bridge_network');
        }
      } catch (err) {
        console.error('Failed to check MetaMask:', err);
        setMetamaskWallet({ connected: false, address: null, balance: 0 });
        setDetectedNetwork(null);
        setNetwork('mainnet');
        updateBridgeWalletsState({ metamask: { connected: false, address: null, balance: 0 } });
        localStorage.removeItem('bridge_network');
      }
    } else if (metamaskDisconnected) {
      setMetamaskWallet({ connected: false, address: null, balance: 0 });
      setDetectedNetwork(null);
      setNetwork('mainnet');
      updateBridgeWalletsState({ metamask: { connected: false, address: null, balance: 0 } });
      localStorage.removeItem('bridge_network');
    } else {
      setMetamaskWallet({ connected: false, address: null, balance: 0 });
      setDetectedNetwork(null);
      setNetwork('mainnet');
      updateBridgeWalletsState({ metamask: { connected: false, address: null, balance: 0 } });
      localStorage.removeItem('bridge_network');
    }
  };

  useEffect(() => {
    setIsIOSDevice(isIOS());
    setIsInNativeWrapper(isNativeWrapper());
    setIsInMisesBrowser(isMisesBrowser());
    
    console.log('📱 Device Detection:');
    console.log('  - iOS:', isIOS());
    console.log('  - Native Wrapper:', isNativeWrapper());
    console.log('  - Mises Browser:', isMisesBrowser());
    console.log('  - User Agent:', window.navigator.userAgent);

    loadUserAndTransactions();
    checkWallets();
    detectMetaMaskNetwork();
    checkIOSWalletConnections();
    
    // Reduced polling interval from 3s to 10s to reduce load
    const interval = setInterval(() => {
      if (retryCount === 0 && !transactionError) {
        loadTransactions();
      }
    }, 10000); // Changed from 3000 to 10000 (10 seconds)
    
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('chainChanged', detectMetaMaskNetwork);
      window.ethereum.on('accountsChanged', checkWallets);
    }
    
    return () => {
      clearInterval(interval);
      if (typeof window.ethereum !== 'undefined') {
        window.ethereum.removeListener('chainChanged', detectMetaMaskNetwork);
        window.ethereum.removeListener('accountsChanged', checkWallets);
      }
    };
  }, [retryCount]); // Keep dependency on retryCount

  const connectKasware = async () => {
    console.log('🔵 Connect Kasware clicked');
    console.log('🔵 Kasware available:', typeof window.kasware !== 'undefined');
    
    if (typeof window.kasware === 'undefined') {
      console.log('❌ Kasware not found');
      alert('Kasware wallet not found. Please install Kasware extension.');
      return;
    }

    try {
      console.log('🔵 Calling kasware.requestAccounts()...');
      sessionStorage.removeItem('kasware_disconnected');
      
      // Request accounts - this should trigger the Kasware popup
      const accounts = await window.kasware.requestAccounts();
      console.log('✅ Got accounts:', accounts);
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from Kasware');
      }
      
      console.log('🔵 Getting balance...');
      const balanceResult = await window.kasware.getBalance();
      const balance = balanceResult.total || 0;
      console.log('✅ Balance:', balance);
      
      const walletData = { 
        connected: true, 
        address: accounts[0], 
        balance: balance / 1e8 
      };
      setKaswareWallet(walletData);
      updateBridgeWalletsState({ kasware: walletData });
      console.log('✅ Kasware connected successfully!');
    } catch (err) {
      console.error('❌ Failed to connect Kasware:', err);
      alert('Failed to connect Kasware: ' + (err.message || 'Unknown error'));
      setKaswareWallet({ connected: false, address: null, balance: 0 });
      updateBridgeWalletsState({ kasware: { connected: false, address: null, balance: 0 } });
      sessionStorage.setItem('kasware_disconnected', 'true');
    }
  };

  const connectMetaMask = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask not found. Please install MetaMask extension.');
      return;
    }

    try {
      sessionStorage.removeItem('metamask_disconnected');
      
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      await checkWallets();
    } catch (err) {
      console.error('Failed to connect MetaMask:', err);
      setMetamaskWallet({ connected: false, address: null, balance: 0 });
      setDetectedNetwork(null);
      setNetwork('mainnet');
      updateBridgeWalletsState({ metamask: { connected: false, address: null, balance: 0 } });
      localStorage.removeItem('bridge_network');
      sessionStorage.setItem('metamask_disconnected', 'true');
    }
  };

  const disconnectKasware = () => {
    sessionStorage.setItem('kasware_disconnected', 'true');
    setKaswareWallet({ connected: false, address: null, balance: 0 });
    updateBridgeWalletsState({ kasware: { connected: false, address: null, balance: 0 } });
  };

  const disconnectMetaMask = () => {
    sessionStorage.setItem('metamask_disconnected', 'true');
    setMetamaskWallet({ connected: false, address: null, balance: 0 });
    setDetectedNetwork(null);
    updateBridgeWalletsState({ metamask: { connected: false, address: null, balance: 0 } });
    localStorage.removeItem('bridge_network');
  };

  const connectMIST = async () => {
    console.log('🌫️ Connect MIST clicked (Mises MetaMask)');
    console.log('🌫️ window.ethereum available:', typeof window.ethereum !== 'undefined');
    
    if (typeof window.ethereum === 'undefined') {
      console.log('❌ MetaMask not found in Mises');
      alert('MetaMask extension not found in Mises Browser. Please install MetaMask extension in Mises.');
      return;
    }

    try {
      console.log('🌫️ Requesting MetaMask accounts in Mises...');
      sessionStorage.removeItem('metamask_disconnected');
      
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      console.log('✅ MetaMask connection initiated in Mises');
      await checkWallets();
    } catch (err) {
      console.error('❌ Failed to connect MetaMask in Mises:', err);
      alert('Failed to connect MetaMask in Mises: ' + (err.message || 'Unknown error'));
      setMetamaskWallet({ connected: false, address: null, balance: 0 });
      setDetectedNetwork(null);
      setNetwork('mainnet');
      updateBridgeWalletsState({ metamask: { connected: false, address: null, balance: 0 } });
      localStorage.removeItem('bridge_network');
      sessionStorage.setItem('metamask_disconnected', 'true');
    }
  };

  const handleTransactionComplete = async () => {
    console.log('🔄 Transaction complete, refreshing...');
    setRetryCount(0);
    await loadTransactions();
    await checkWallets();
  };

  const handleShareToGlobal = async (transaction) => {
    try {
      console.log('📤 Sharing transaction to global counter:', transaction.tx_hash);

      if (!transaction.tx_hash || typeof transaction.tx_hash !== 'string') {
        alert('❌ Invalid transaction hash');
        return;
      }

      const cleanTxHash = transaction.tx_hash.trim();

      const existing = await base44.entities.GlobalTransaction.filter({
        tx_hash: cleanTxHash
      });

      if (existing.length > 0) {
        alert('✅ This transaction is already shared to the global counter!');
        return;
      }

      const truncateAddress = (addr) => {
        if (!addr) return '';
        if (addr.length <= 20) return addr;
        return `${addr.substring(0, 10)}...${addr.substring(addr.length - 6)}`;
      };

      await base44.entities.GlobalTransaction.create({
        tx_hash: cleanTxHash,
        from_address: truncateAddress(transaction.from_address),
        to_address: truncateAddress(transaction.to_address),
        amount: transaction.amount,
        fee: transaction.fee || 0,
        network: transaction.from_network,
        timestamp: transaction.created_date,
        is_public: true
      });

      console.log('✅ Transaction shared successfully!');
      alert('🎉 Transaction shared to global counter! You\'re helping reach 1 billion!');

      setGlobalCounterRefresh(prev => prev + 1);
      
    } catch (error) {
      console.error('Failed to share to global:', error);
      alert('❌ Failed to share transaction. Please try again.');
    }
  };

  const handleIOSWalletConnect = (walletType) => {
    console.log(`✅ iOS ${walletType} connected successfully`);
    setShowIOSModal(false);
    
    setTimeout(() => {
      checkIOSWalletConnections();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-400/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 p-3 sm:p-4 md:p-6 lg:p-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 sm:mb-8 md:mb-12"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 backdrop-blur-xl bg-white/5 border border-cyan-500/30 rounded-xl flex items-center justify-center">
                  <Send className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                    Send KAS
                  </h1>
                  <p className="text-gray-400 text-xs sm:text-sm mt-1">
                    Transfer KAS on L1 or L2
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {isIOSDevice && isInNativeWrapper && (
                  <Button
                    onClick={() => setShowIOSModal(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/50 flex-1 sm:flex-initial"
                    size="sm"
                  >
                    <Grid3x3 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    <span className="hidden sm:inline">Mobile Wallets</span>
                    <span className="sm:hidden">Wallets</span>
                  </Button>
                )}

                {metamaskWallet.connected && detectedNetwork && (
                  <Badge
                    variant="outline"
                    className={`${detectedNetwork === 'mainnet' 
                      ? "bg-green-500/20 text-green-300 border-green-500/30" 
                      : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                    } text-xs`}
                  >
                    {detectedNetwork === 'mainnet' ? '🟢 Mainnet' : '🟡 Testnet'}
                  </Badge>
                )}

                {isInMisesBrowser && !metamaskWallet.connected && (
                  <Button
                    onClick={connectMIST}
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg shadow-purple-500/30"
                    size="sm"
                  >
                    <Wallet className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
                    <span className="text-xs font-semibold">MIST</span>
                  </Button>
                )}

                {isInMisesBrowser && !kaswareWallet.connected && (
                  <Button
                    onClick={connectKasware}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg shadow-orange-500/30"
                    size="sm"
                  >
                    <Wallet className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
                    <span className="text-xs font-semibold">Kasware</span>
                  </Button>
                )}

                <Button
                  onClick={() => setShowAssistant(!showAssistant)}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/50 text-sm flex-1 sm:flex-initial"
                  size="sm"
                >
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  AI Assistant
                </Button>
              </div>
            </div>
            
            {isIOSDevice && isInNativeWrapper && (
              <div className="mb-4 bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 flex items-center gap-2">
                <Grid3x3 className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-sm text-purple-300 font-semibold">📱 iOS Native App Detected</p>
                  <p className="text-xs text-purple-400">Tap "Mobile Wallets" above to connect MetaMask or Kastle on iOS</p>
                </div>
              </div>
            )}
            

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 md:gap-8">
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg px-3 py-2 sm:px-4 sm:py-3">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">{transactions.length}</div>
                <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider">Total Transfers</div>
              </div>
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg px-3 py-2 sm:px-4 sm:py-3">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-cyan-400 mb-1">
                  {transactions.filter(tx => tx.status === 'completed').length}
                </div>
                <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider">Completed</div>
              </div>
            </div>
          </motion.div>

          <AnimatePresence>
            {transactionError && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6"
              >
                <div className="backdrop-blur-xl bg-red-500/20 border border-red-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <div>
                        <p className="text-sm font-semibold text-red-300">
                          {retryCount > 0 ? `Retrying... (${retryCount}/3)` : 'Failed to load transactions'}
                        </p>
                        <p className="text-xs text-red-400 mt-1">{transactionError}</p>
                      </div>
                    </div>
                    {retryCount === 0 && (
                      <Button
                        onClick={() => {
                          setRetryCount(0);
                          loadTransactions();
                        }}
                        size="sm"
                        className="bg-red-500/20 border border-red-500 hover:bg-red-500/30 text-red-300"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry Now
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!kaswareWallet.connected && !metamaskWallet.connected ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto"
            >
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12 text-center">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-xl border border-cyan-500/20">
                  <Wallet className="w-8 h-8 md:w-10 md:h-10 text-cyan-400" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
                <p className="text-gray-400 mb-6 md:mb-8 text-sm md:text-base">
                  {isIOSDevice && isInNativeWrapper 
                    ? "Tap 'Mobile Wallets' above to connect MetaMask or Kastle on iOS"
                    : "Connect Kasware for L1 transfers or MetaMask for L2 operations"
                  }
                </p>
                {(!isIOSDevice || !isInNativeWrapper) && !isInMisesBrowser && (
                  <div className="flex flex-col md:flex-row gap-4 justify-center">
                    <Button
                      onClick={connectKasware}
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white h-12 px-6 md:px-8 shadow-lg shadow-orange-500/50"
                    >
                      <Wallet className="w-5 h-5 mr-2" />
                      Connect Kasware
                    </Button>
                    <Button
                      onClick={connectMetaMask}
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white h-12 px-6 md:px-8 shadow-lg shadow-cyan-500/50"
                    >
                      <Wallet className="w-5 h-5 mr-2" />
                      Connect MetaMask
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8"
            >
              <div className="lg:col-span-2 space-y-4 sm:space-y-6 md:space-y-8">
                <GlobalCounter refreshTrigger={globalCounterRefresh} />

                <TransferForm 
                  kaswareWallet={kaswareWallet}
                  metamaskWallet={metamaskWallet}
                  onTransactionComplete={handleTransactionComplete}
                  onConnectKasware={connectKasware}
                  onConnectMetaMask={connectMetaMask}
                  onDisconnectKasware={disconnectKasware}
                  onDisconnectMetaMask={disconnectMetaMask}
                  network={network}
                  detectedMetaMaskNetwork={detectedNetwork}
                />

                {/* NEW: Proof of Life Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <ProofOfLifeButton 
                    kaswareWallet={kaswareWallet}
                    metamaskWallet={metamaskWallet}
                    user={user}
                  />
                </motion.div>
              </div>
              
              <div className="space-y-4 sm:space-y-6">
                <RecentTransactions 
                  transactions={transactions}
                  onShareToGlobal={handleShareToGlobal}
                  onRefresh={loadTransactions}
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <IOSWalletModal
        isOpen={showIOSModal}
        onClose={() => setShowIOSModal(false)}
        onConnect={handleIOSWalletConnect}
      />

      <AnimatePresence>
        {showAssistant && (
          <BridgeAssistant onClose={() => setShowAssistant(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}