
import React, { useState, useEffect } from 'react';
import { Clock, Zap, Shield, CheckCircle, Wallet } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const PRICING = {
  hour: 0.5,    // 0.5 KAS per hour
  day: 10,      // 10 KAS per day
  week: 60,     // 60 KAS per week
  month: 200    // 200 KAS per month
};

// Payment addresses for L1 and L2
const PAYMENT_ADDRESSES = {
  L1: 'kaspa:qrvsw0p7w5ksgsz3q08glnp0r65yvmp9cx83lajqgtx8v9527z2hkzqgwekq3',
  L2_MAINNET: '0x7A4f6C9B2128F10d3B7Aa01bf288825d4e1b5194', // Your L2 mainnet address
  L2_TESTNET: '0x7A4f6C9B2128F10d3B7Aa01bf288825d4e1b5194'  // Your L2 testnet address
};

// Network configurations
const NETWORKS = {
  mainnet: {
    chainId: '0x144',
    chainName: 'Kasplex L2 Mainnet',
    rpcUrls: ['https://evmrpc.kasplex.org'],
    blockExplorerUrls: ['https://explorer.kasplex.org']
  },
  testnet: {
    chainId: '0x28D74',
    chainName: 'Kasplex Network Testnet',
    rpcUrls: ['https://rpc.kasplextest.xyz'],
    blockExplorerUrls: ['https://frontend.kasplextest.xyz']
  }
};

export default function SubscriptionSystem() {
  const [subscription, setSubscription] = useState({
    isActive: false,
    expiresAt: 0,
    autoRenew: false,
  });
  
  const [showPurchase, setShowPurchase] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('day');
  const [customHours, setCustomHours] = useState(24);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Wallet states
  const [kaswareWallet, setKaswareWallet] = useState({ connected: false, address: null, balance: 0 });
  const [metamaskWallet, setMetamaskWallet] = useState({ connected: false, address: null, balance: 0 });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('L1'); // 'L1' or 'L2'
  const [detectedNetwork, setDetectedNetwork] = useState(null); // 'mainnet' or 'testnet'
  const [network, setNetwork] = useState('mainnet'); // 'mainnet' or 'testnet', used for payment addresses

  // Helper to update global wallet state in local storage (e.g., for bridge page)
  const updateBridgeWalletsState = (walletUpdate) => {
    try {
      const existingState = JSON.parse(localStorage.getItem('bridge_wallets_state') || '{}');
      const newState = { ...existingState, ...walletUpdate };
      localStorage.setItem('bridge_wallets_state', JSON.stringify(newState));
    } catch (e) {
      console.error('Failed to update bridge wallet state:', e);
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
      
      if (chainId === NETWORKS.mainnet.chainId) {
        console.log('✅ On Kasplex L2 Mainnet');
        setDetectedNetwork('mainnet');
        setNetwork('mainnet');
        localStorage.setItem('bridge_network', 'mainnet');
      } else if (chainId === NETWORKS.testnet.chainId) {
        console.log('✅ On Kasplex Network Testnet');
        setDetectedNetwork('testnet');
        setNetwork('testnet');
        localStorage.setItem('bridge_network', 'testnet');
      } else {
        console.log('⚠️ Different network:', chainId);
        setDetectedNetwork(null);
        setNetwork('mainnet');
        localStorage.removeItem('bridge_network');
      }
    } catch (err) {
      console.error('Failed to detect network:', err);
      setDetectedNetwork(null);
      setNetwork('mainnet');
      localStorage.removeItem('bridge_network');
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
          const balance = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [accounts[0], 'latest']
          });
          const balanceInKAS = parseInt(balance, 16) / 1e18;
          const walletData = { 
            connected: true, 
            address: accounts[0], 
            balance: balanceInKAS 
          };
          setMetamaskWallet(walletData);
          updateBridgeWalletsState({ metamask: walletData });

          // Detect current network
          await detectMetaMaskNetwork();
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

  const handleChainChanged = () => {
    detectMetaMaskNetwork();
    checkWallets();
  };

  useEffect(() => {
    loadSubscription();
    checkWallets();
    detectMetaMaskNetwork();
    
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('accountsChanged', checkWallets);
    }
    
    return () => {
      if (typeof window.ethereum !== 'undefined') {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('accountsChanged', checkWallets);
      }
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (subscription.isActive && subscription.expiresAt) {
        const remaining = subscription.expiresAt - Date.now();
        
        if (remaining <= 0) {
          if (subscription.autoRenew) {
            handleAutoRenewal();
          } else {
            expireSubscription();
          }
        } else {
          setTimeRemaining(formatTimeRemaining(remaining));
        }
      }
    }, 1000);

    let successTimer;
    if (successMessage) {
      successTimer = setTimeout(() => setSuccessMessage(''), 5000);
    }
    
    let errorTimer;
    if (errorMessage) {
      errorTimer = setTimeout(() => setErrorMessage(''), 5000);
    }

    return () => {
      clearInterval(interval);
      clearTimeout(successTimer);
      clearTimeout(errorTimer);
    };
  }, [subscription, successMessage, errorMessage]);


  const connectKasware = async () => {
    if (typeof window.kasware === 'undefined') {
      setErrorMessage('Kasware wallet not found. Please install Kasware extension.');
      return;
    }

    try {
      const accounts = await window.kasware.requestAccounts();
      sessionStorage.removeItem('kasware_disconnected');
      setKaswareWallet({ connected: true, address: accounts[0], balance: 0 }); // Temporary, checkWallets will update
      setSuccessMessage('✅ Kasware connected!');
      checkWallets(); // Fetch balance and update bridge state
    } catch (err) {
      console.error('Failed to connect Kasware:', err);
      setErrorMessage('Failed to connect Kasware wallet');
    }
  };

  const connectMetaMask = async () => {
    if (typeof window.ethereum === 'undefined') {
      setErrorMessage('MetaMask not found. Please install MetaMask extension.');
      return;
    }

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      sessionStorage.removeItem('metamask_disconnected');
      await checkWallets();
      await detectMetaMaskNetwork();
      setSuccessMessage('✅ MetaMask connected!');
    } catch (err) {
      console.error('Failed to connect MetaMask:', err);
      setErrorMessage('Failed to connect MetaMask wallet');
    }
  };

  const loadSubscription = () => {
    const saved = localStorage.getItem('subscription');
    if (saved) {
      const data = JSON.parse(saved);
      setSubscription(data);
      
      if (data.isActive && data.wallet_address) {
        if (kaswareWallet.connected && kaswareWallet.address === data.wallet_address) {
          console.log('✅ Subscription verified for Kasware wallet');
        } else if (metamaskWallet.connected && metamaskWallet.address === data.wallet_address) {
          console.log('✅ Subscription verified for MetaMask wallet');
        }
      }
    }
  };

  const saveSubscription = (data) => {
    localStorage.setItem('subscription', JSON.stringify(data));
    setSubscription(data);
  };

  const formatTimeRemaining = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const calculatePrice = () => {
    // Always calculate based on hours and hourly rate
    return PRICING.hour * customHours;
  };

  const calculateDuration = () => {
    // Always calculate based on custom hours
    return customHours * 60 * 60 * 1000;
  };

  const handlePurchaseL1 = async () => {
    if (!window.kasware) {
      setErrorMessage('Kasware wallet not found');
      return;
    }

    if (!kaswareWallet.connected) {
      setErrorMessage('Please connect Kasware wallet first');
      return;
    }

    setIsProcessing(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const price = calculatePrice();
      const satoshis = Math.floor(price * 100000000);

      console.log('Processing L1 subscription payment:', {
        amount: price,
        satoshis,
        plan: selectedPlan,
        wallet: kaswareWallet.address,
        isExtension: subscription.isActive
      });

      const result = await window.kasware.sendKaspa(
        PAYMENT_ADDRESSES.L1,
        satoshis
      );

      console.log('L1 Payment result:', result);

      let txId;
      
      if (typeof result === 'string') {
        try {
          const decodedResult = decodeURIComponent(result);
          const parsedResult = JSON.parse(decodedResult);
          txId = parsedResult.id;
        } catch (e) {
          txId = result.trim();
        }
      } else if (result && typeof result === 'object') {
        txId = result.id || result.txId || result.txid || result.hash;
      }

      if (!txId) {
        throw new Error('Could not extract transaction ID');
      }

      console.log('✅ L1 Transaction ID:', txId);

      const duration = calculateDuration();
      
      // If subscription is active, extend it; otherwise start new
      const newExpiry = subscription.isActive 
        ? subscription.expiresAt + duration 
        : Date.now() + duration;

      const newSubscription = {
        isActive: true,
        expiresAt: newExpiry,
        autoRenew: subscription.autoRenew || false,
        txId: txId,
        address: kaswareWallet.address,
        wallet_address: kaswareWallet.address,
        paymentMethod: 'L1',
      };

      saveSubscription(newSubscription);
      
      setSuccessMessage(`✅ Premium ${subscription.isActive ? 'extended' : 'activated'} via L1! TX: ${txId.substring(0, 8)}...`);
      setShowPurchase(false);

    } catch (error) {
      console.error('L1 Purchase failed:', error);
      setErrorMessage(`L1 Purchase failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePurchaseL2 = async () => {
    if (!window.ethereum) {
      setErrorMessage('MetaMask not found');
      return;
    }

    if (!metamaskWallet.connected) {
      setErrorMessage('Please connect MetaMask wallet first');
      return;
    }

    if (!detectedNetwork) {
      setErrorMessage('Please connect MetaMask to Kasplex L2 (Mainnet or Testnet)');
      return;
    }

    setIsProcessing(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const price = calculatePrice();
      const paymentAddress = detectedNetwork === 'mainnet' 
        ? PAYMENT_ADDRESSES.L2_MAINNET 
        : PAYMENT_ADDRESSES.L2_TESTNET;

      console.log('Processing L2 subscription payment:', {
        amount: price,
        network: detectedNetwork,
        to: paymentAddress,
        wallet: metamaskWallet.address,
        isExtension: subscription.isActive
      });

      // Convert KAS to Wei (18 decimals)
      const amountInWei = '0x' + (BigInt(Math.floor(price * 1e18))).toString(16);

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: metamaskWallet.address,
          to: paymentAddress,
          value: amountInWei,
          gas: '0x5208', // 21000
        }],
      });

      console.log('✅ L2 Transaction Hash:', txHash);

      const duration = calculateDuration();
      
      // If subscription is active, extend it; otherwise start new
      const newExpiry = subscription.isActive 
        ? subscription.expiresAt + duration 
        : Date.now() + duration;

      const newSubscription = {
        isActive: true,
        expiresAt: newExpiry,
        autoRenew: subscription.autoRenew || false,
        txId: txHash,
        address: metamaskWallet.address,
        wallet_address: metamaskWallet.address,
        paymentMethod: 'L2',
        network: detectedNetwork,
      };

      saveSubscription(newSubscription);
      
      setSuccessMessage(`✅ Premium ${subscription.isActive ? 'extended' : 'activated'} via L2! TX: ${txHash.substring(0, 10)}...`);
      setShowPurchase(false);

    } catch (error) {
      console.error('L2 Purchase failed:', error);
      
      if (error.code === 4001) {
        setErrorMessage('Transaction cancelled by user');
      } else if (error.message && error.message.includes('insufficient funds')) {
        setErrorMessage('Insufficient KAS balance for transaction + gas');
      } else {
        setErrorMessage(`L2 Purchase failed: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePurchase = () => {
    if (selectedPaymentMethod === 'L1') {
      handlePurchaseL1();
    } else {
      handlePurchaseL2();
    }
  };

  const handleAutoRenewal = async () => {
    console.log('Auto-renewal triggered');
    
    // Temporarily set isProcessing to prevent multiple renewals
    setIsProcessing(true);
    
    // Check if enough KAS balance is available for L1, or if L2 wallet is connected and on correct network
    let canAutoRenew = false;
    if (subscription.paymentMethod === 'L1' && kaswareWallet.connected) {
      // For a real app, you'd check Kasware balance here
      canAutoRenew = true;
    } else if (subscription.paymentMethod === 'L2' && metamaskWallet.connected && detectedNetwork === subscription.network) {
      // For a real app, you'd check MetaMask balance here
      canAutoRenew = true;
    }

    if (!canAutoRenew) {
      setErrorMessage(`Auto-renewal failed: Could not connect to wallet or insufficient funds.`);
      expireSubscription();
      setIsProcessing(false);
      return;
    }

    const price = calculatePrice(); // Re-calculate price for clarity

    // In a real application, auto-renewal would likely be handled server-side or with more robust in-wallet permissions.
    // For this client-side example, we'll simulate a user confirmation.
    const shouldRenew = window.confirm(
      `Your premium access has expired. Auto-renew for ${price} KAS using ${subscription.paymentMethod}?`
    );

    if (shouldRenew) {
      if (subscription.paymentMethod === 'L1') {
        await handlePurchaseL1(); // This will re-calculate price for the selected plan
      } else {
        await handlePurchaseL2(); // This will re-calculate price for the selected plan
      }
    } else {
      expireSubscription();
    }
    setIsProcessing(false);
  };

  const expireSubscription = () => {
    const expired = {
      isActive: false,
      expiresAt: 0,
      autoRenew: false,
    };
    saveSubscription(expired);
    setErrorMessage('Your premium access has expired');
    
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  const toggleAutoRenew = () => {
    const updated = {
      ...subscription,
      autoRenew: !subscription.autoRenew,
    };
    saveSubscription(updated);
  };

  // Updated render logic to handle showPurchase when subscription is active
  if (!subscription.isActive || showPurchase) {
    return (
      <div className="space-y-8">
        {errorMessage && (
          <div className="bg-zinc-950 border border-red-900 rounded-xl p-4 text-red-400 text-sm">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="bg-zinc-950 border border-white rounded-xl p-4 text-white text-sm">
            {successMessage}
          </div>
        )}

        {!showPurchase ? (
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Choose Your Plan</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <button
                onClick={() => { 
                  setSelectedPlan('hour'); 
                  setCustomHours(1);
                  setShowPurchase(true); 
                }}
                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl p-6 text-left transition-all"
              >
                <div className="text-2xl font-bold text-white mb-1">{PRICING.hour} KAS</div>
                <div className="text-sm text-gray-500">Per Hour</div>
              </button>

              <button
                onClick={() => { 
                  setSelectedPlan('day'); 
                  setCustomHours(24);
                  setShowPurchase(true); 
                }}
                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl p-6 text-left transition-all"
              >
                <div className="text-2xl font-bold text-white mb-1">{PRICING.day} KAS</div>
                <div className="text-sm text-gray-500">24 Hours</div>
              </button>

              <button
                onClick={() => { 
                  setSelectedPlan('week'); 
                  setCustomHours(168);
                  setShowPurchase(true); 
                }}
                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl p-6 text-left transition-all"
              >
                <div className="text-2xl font-bold text-white mb-1">{PRICING.week} KAS</div>
                <div className="text-sm text-gray-500">7 Days (168 hrs)</div>
              </button>

              <button
                onClick={() => { 
                  setSelectedPlan('month'); 
                  setCustomHours(720);
                  setShowPurchase(true); 
                }}
                className="bg-zinc-900 hover:bg-zinc-800 border border-white rounded-xl p-6 text-left transition-all"
              >
                <div className="text-2xl font-bold text-white mb-1">{PRICING.month} KAS</div>
                <div className="text-sm text-gray-500">30 Days (720 hrs)</div>
              </button>
            </div>

            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Premium Benefits</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
                <li className="flex items-start text-gray-400">
                  <span className="text-white mr-3">✓</span>
                  <span>Unlimited KAS transfers</span>
                </li>
                <li className="flex items-start text-gray-400">
                  <span className="text-white mr-3">✓</span>
                  <span>Priority transaction processing</span>
                </li>
                <li className="flex items-start text-gray-400">
                  <span className="text-white mr-3">✓</span>
                  <span>Real-time transaction history</span>
                </li>
                <li className="flex items-start text-gray-400">
                  <span className="text-white mr-3">✓</span>
                  <span>Auto-renewal option available</span>
                </li>
                <li className="flex items-start text-gray-400">
                  <span className="text-white mr-3">✓</span>
                  <span>Proof of payment on blockchain</span>
                </li>
                <li className="flex items-start text-gray-400">
                  <span className="text-white mr-3">✓</span>
                  <span>Pay with L1 (Kasware) or L2 (MetaMask)</span>
                </li>
                <li className="flex items-start text-gray-400">
                  <span className="text-white mr-3">✓</span>
                  <span>Access to exclusive L2 dApps</span>
                </li>
                <li className="flex items-start text-gray-400">
                  <span className="text-white mr-3">✓</span>
                  <span>Lower L2 transaction fees</span>
                </li>
                <li className="flex items-start text-gray-400">
                  <span className="text-white mr-3">✓</span>
                  <span>Dedicated API access (higher rate limits)</span>
                </li>
                <li className="flex items-start text-gray-400">
                  <span className="text-white mr-3">✓</span>
                  <span>Enhanced security monitoring</span>
                </li>
                <li className="flex items-start text-gray-400">
                  <span className="text-white mr-3">✓</span>
                  <span>Multi-signature wallet support</span>
                </li>
                <li className="flex items-start text-gray-400">
                  <span className="text-white mr-3">✓</span>
                  <span>Advanced analytics & reporting</span>
                </li>
                <li className="flex items-start text-gray-400">
                  <span className="text-white mr-3">✓</span>
                  <span>Early access to new features</span>
                </li>
                <li className="flex items-start text-gray-400">
                  <span className="text-white mr-3">✓</span>
                  <span>24/7 priority customer support</span>
                </li>
                <li className="flex items-start text-gray-400">
                  <span className="text-white mr-3">✓</span>
                  <span>Customizable alert notifications</span>
                </li>
                <li className="flex items-start text-gray-400">
                  <span className="text-white mr-3">✓</span>
                  <span>Whitelisting of frequently used addresses</span>
                </li>
                <li className="flex items-start text-gray-400">
                  <span className="text-white mr-3">✓</span>
                  <span>NFT marketplace integration (L2)</span>
                </li>
                <li className="flex items-start text-gray-400">
                  <span className="text-white mr-3">✓</span>
                  <span>Staking rewards boost</span>
                </li>
                <li className="flex items-start text-gray-400">
                  <span className="text-white mr-3">✓</span>
                  <span>Decentralized governance voting power</span>
                </li>
                <li className="flex items-start text-gray-400">
                  <span className="text-white mr-3">✓</span>
                  <span>Ad-free experience across all platforms</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
            <button
              onClick={() => setShowPurchase(false)}
              className="text-gray-400 hover:text-white mb-6 text-sm"
            >
              ← Back to {subscription.isActive ? 'subscription' : 'plans'}
            </button>

            <h2 className="text-2xl font-bold text-white mb-6">
              {subscription.isActive ? 'Extend Subscription' : 'Complete Purchase'}
            </h2>

            {subscription.isActive && (
              <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <p className="text-sm text-green-300">
                  ✅ Your current subscription will be extended by the selected duration
                </p>
              </div>
            )}

            {/* ALWAYS SHOW HOURS INPUT - NOT JUST FOR 'hour' PLAN */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Number of Hours
              </label>
              <Input
                type="number"
                value={customHours}
                onChange={(e) => setCustomHours(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max="8760"
                className="bg-zinc-900 border-zinc-800 text-white text-lg"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm text-gray-500">
                  {customHours} hour{customHours !== 1 ? 's' : ''} 
                  {customHours >= 24 && ` (${(customHours / 24).toFixed(1)} days)`}
                </p>
                <p className="text-lg font-bold text-cyan-400">
                  = {calculatePrice().toFixed(2)} KAS
                </p>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                💡 Tip: Rate is {PRICING.hour} KAS per hour
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-3">
                Choose Payment Method
              </label>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectedPaymentMethod('L1')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedPaymentMethod === 'L1'
                      ? 'bg-orange-500/20 border-orange-500/50'
                      : 'backdrop-blur-xl bg-white/5 border-white/10 hover:border-orange-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">Kasware (L1)</span>
                    {kaswareWallet.connected && <Badge className="bg-green-500/20 text-green-400 text-xs">Connected</Badge>}
                  </div>
                  {!kaswareWallet.connected && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        connectKasware();
                      }}
                      size="sm"
                      variant="outline"
                      className="w-full mt-2 text-xs bg-white/5 border-white/10 hover:bg-white/10"
                    >
                      Connect Kasware
                    </Button>
                  )}
                  {kaswareWallet.connected && (
                    <div className="text-xs text-gray-400 mt-2">
                      Balance: {kaswareWallet.balance.toFixed(4)} KAS
                    </div>
                  )}
                </button>

                <button
                  onClick={() => setSelectedPaymentMethod('L2')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedPaymentMethod === 'L2'
                      ? 'bg-cyan-500/20 border-cyan-500/50'
                      : 'backdrop-blur-xl bg-white/5 border-white/10 hover:border-cyan-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">MetaMask (L2)</span>
                    {metamaskWallet.connected && detectedNetwork && (
                      <Badge className={
                        detectedNetwork === 'mainnet' 
                          ? "bg-green-500/20 text-green-400 text-xs"
                          : "bg-yellow-500/20 text-yellow-400 text-xs"
                      }>
                        {detectedNetwork === 'mainnet' ? 'Mainnet' : 'Testnet'}
                      </Badge>
                    )}
                  </div>
                  {!metamaskWallet.connected && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        connectMetaMask();
                      }}
                      size="sm"
                      variant="outline"
                      className="w-full mt-2 text-xs bg-white/5 border-white/10 hover:bg-white/10"
                    >
                      Connect MetaMask
                    </Button>
                  )}
                  {metamaskWallet.connected && (
                    <div className="text-xs text-gray-400 mt-2">
                      Balance: {metamaskWallet.balance.toFixed(4)} KAS
                      {detectedNetwork && (
                        <div className="text-[10px] text-cyan-400 mt-1">
                          Network: {detectedNetwork === 'mainnet' ? 'Kasplex L2 Mainnet' : 'Kasplex L2 Testnet'}
                        </div>
                      )}
                    </div>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400">Duration:</span>
                <span className="text-white font-semibold">
                  {customHours} hour{customHours !== 1 ? 's' : ''}
                  {customHours >= 24 && ` (${(customHours / 24).toFixed(1)} days)`}
                </span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400">Price:</span>
                <span className="text-2xl font-bold text-white">{calculatePrice().toFixed(2)} KAS</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400">Payment Method:</span>
                <span className="text-white font-semibold">
                  {selectedPaymentMethod === 'L1' ? 'Kasware (L1)' : `MetaMask (L2 ${detectedNetwork || 'Not connected to L2'})`}
                </span>
              </div>
              <div className="border-t border-zinc-800 pt-4">
                <span className="text-xs text-gray-600">Payment Address:</span>
                <p className="text-xs text-gray-400 font-mono break-all mt-1">
                  {selectedPaymentMethod === 'L1' 
                    ? PAYMENT_ADDRESSES.L1
                    : detectedNetwork === 'mainnet'
                      ? PAYMENT_ADDRESSES.L2_MAINNET
                      : detectedNetwork === 'testnet'
                        ? PAYMENT_ADDRESSES.L2_TESTNET
                        : 'Connect L2 wallet to see address'
                  }
                </p>
              </div>
            </div>

            <Button
              onClick={handlePurchase}
              disabled={
                isProcessing || 
                (selectedPaymentMethod === 'L1' && !kaswareWallet.connected) ||
                (selectedPaymentMethod === 'L2' && (!metamaskWallet.connected || !detectedNetwork))
              }
              className="w-full h-14 bg-white hover:bg-gray-200 text-black font-bold disabled:opacity-50"
            >
              {isProcessing ? 'Processing Payment...' : `Pay ${calculatePrice().toFixed(2)} KAS & ${subscription.isActive ? 'Extend' : 'Activate'} Premium`}
            </Button>

            <p className="text-xs text-gray-600 text-center mt-4">
              Payment verified on {selectedPaymentMethod === 'L1' ? 'Kaspa' : 'Kasplex L2'} blockchain
            </p>
          </div>
        )}
      </div>
    );
  }

  // Active subscription card
  return (
    <Card className="backdrop-blur-xl bg-white/5 border-white/10">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Premium Active</h3>
              <p className="text-sm text-gray-400">
                Paid via {subscription.paymentMethod === 'L1' ? 'Kasware (L1)' : `MetaMask (L2 ${subscription.network || ''})`}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowPurchase(true)}
            className="bg-purple-500 hover:bg-purple-600"
          >
            Add Time
          </Button>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Time Remaining
            </span>
            <span className="text-2xl font-bold text-green-400">{timeRemaining}</span>
          </div>
          
          <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-green-400 to-green-500 h-full transition-all duration-1000"
              style={{
                width: `${Math.max(0, Math.min(100, ((subscription.expiresAt - Date.now()) / calculateDuration()) * 100))}%`
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={subscription.autoRenew}
              onChange={toggleAutoRenew}
              className="w-5 h-5 text-purple-500 rounded focus:ring-2 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-300">Auto-renew when expired</span>
          </label>
          
          {subscription.txId && (
            <a
              href={subscription.paymentMethod === 'L1' 
                ? `https://kas.fyi/txs/${subscription.txId}`
                : subscription.network === 'mainnet'
                  ? `https://explorer.kasplex.org/tx/${subscription.txId}`
                  : `https://frontend.kasplextest.xyz/tx/${subscription.txId}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              View Proof →
            </a>
          )}
        </div>

        {successMessage && (
          <div className="mt-4 p-3 rounded-lg bg-green-500/20 border border-green-500/50 text-green-400 text-sm">
            {successMessage}
          </div>
        )}
         {errorMessage && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
            {errorMessage}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
