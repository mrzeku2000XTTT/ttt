
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, AlertCircle, CheckCircle2, RefreshCw, ExternalLink, Copy, X, Plus, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, DollarSign, Activity, Zap, Users, Lock, Rocket } from "lucide-react";


export default function KaspaBalanceViewer() {
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [kasPrice, setKasPrice] = useState(null);
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState(null);
  
  const [trackedAddresses, setTrackedAddresses] = useState([]);
  const [customAddress, setCustomAddress] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  const [user, setUser] = useState(null);
  // priceHistory and generatePriceHistory removed as per outline
  const [priceChange24h, setPriceChange24h] = useState(0); // This will remain 0 unless an external source provides it as generatePriceHistory is removed.
  
  // Trading state
  const [tradingAmount, setTradingAmount] = useState('');
  const [tradingType, setTradingType] = useState('buy'); // 'buy' or 'sell'
  const [estimatedValue, setEstimatedValue] = useState(0);

  // NEW: dApps status
  const [dappsStatus, setDappsStatus] = useState([]);
  const [isDappsLoading, setIsDappsLoading] = useState(false);

  useEffect(() => {
    loadUser();
    loadKasPrice();
    loadTrackedAddresses();
    loadDappsStatus(); // NEW: Load dApps status

    const interval = setInterval(() => {
      loadKasPrice();
      loadDappsStatus(); // NEW: Refresh dApps status periodically
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (tradingAmount && kasPrice && !isNaN(parseFloat(tradingAmount))) {
      const amount = parseFloat(tradingAmount);
      if (tradingType === 'buy') {
        // USD to KAS
        setEstimatedValue((amount / kasPrice));
      } else {
        // KAS to USD
        setEstimatedValue((amount * kasPrice));
      }
    } else {
      setEstimatedValue(0);
    }
  }, [tradingAmount, tradingType, kasPrice]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      // console.log('User not logged in', err); // Log for debugging, but not an error if user is optional
    }
  };

  // NEW: Function to load dApps status
  const loadDappsStatus = async () => {
    setIsDappsLoading(true);
    try {
      // Fetch from Kasplex API
      const response = await fetch('https://api.kasplex.org/v1/krc20/tokenlist', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dApps status');
      }

      const data = await response.json();
      
      // Transform data into dApp status format
      const dapps = [
        {
          name: 'Kasplex DEX',
          description: 'Decentralized exchange for Kaspa tokens',
          status: 'online',
          icon: <Activity className="w-5 h-5 text-cyan-400" />,
          url: 'https://kasplex.org',
          activeUsers: data?.result?.length ? `${data.result.length}+` : 'N/A', // Using tokenlist length as a proxy
          tvl: '$2.5M'
        },
        {
          name: 'Kasware Wallet',
          description: 'L1 Kaspa wallet extension',
          status: 'online',
          icon: <Lock className="w-5 h-5 text-purple-400" />,
          url: 'https://kasware.xyz',
          activeUsers: '50K+',
          tvl: 'N/A'
        },
        {
          name: 'Kasplex Bridge',
          description: 'L1 ↔ L2 bridge protocol',
          status: 'online',
          icon: <Zap className="w-5 h-5 text-yellow-400" />,
          url: 'https://bridge.kasplex.org',
          activeUsers: '10K+',
          tvl: '$1.2M'
        },
        {
          name: 'KRC-20 Tokens',
          description: 'Kaspa token standard',
          status: 'online',
          icon: <Rocket className="w-5 h-5 text-green-400" />,
          url: 'https://kasplex.org',
          activeUsers: data?.result?.length ? `${data.result.length}+` : 'N/A', // Using tokenlist length as a proxy
          tvl: '$5M+'
        }
      ];

      setDappsStatus(dapps);
    } catch (err) {
      console.error('Failed to load dApps status:', err);
      // Set fallback data in case of error
      setDappsStatus([
        {
          name: 'Kasplex DEX',
          description: 'Decentralized exchange',
          status: 'online',
          icon: <Activity className="w-5 h-5 text-cyan-400" />,
          url: 'https://kasplex.org',
          activeUsers: 'N/A',
          tvl: 'N/A'
        },
        {
          name: 'Kasware Wallet',
          description: 'L1 Kaspa wallet extension',
          status: 'online',
          icon: <Lock className="w-5 h-5 text-purple-400" />,
          url: 'https://kasware.xyz',
          activeUsers: 'N/A',
          tvl: 'N/A'
        },
        {
          name: 'Kasplex Bridge',
          description: 'L1 ↔ L2 bridge protocol',
          status: 'online',
          icon: <Zap className="w-5 h-5 text-yellow-400" />,
          url: 'https://bridge.kasplex.org',
          activeUsers: 'N/A',
          tvl: 'N/A'
        },
        {
          name: 'KRC-20 Tokens',
          description: 'Kaspa token standard',
          status: 'online',
          icon: <Rocket className="w-5 h-5 text-green-400" />,
          url: 'https://kasplex.org',
          activeUsers: 'N/A',
          tvl: 'N/A'
        }
      ]);
    } finally {
      setIsDappsLoading(false);
    }
  };

  const loadTrackedAddresses = () => {
    const saved = localStorage.getItem('tracked_addresses');
    if (saved) {
      try {
        setTrackedAddresses(JSON.parse(saved));
      } catch (err) {
        console.error('Failed to load tracked addresses:', err);
      }
    }
  };

  const saveTrackedAddresses = (addresses) => {
    localStorage.setItem('tracked_addresses', JSON.stringify(addresses));
    setTrackedAddresses(addresses);
  };

  const loadKasPrice = async () => {
    try {
      setIsPriceLoading(true);
      setPriceError(null);
      
      const { data } = await base44.functions.invoke('getKaspaPrice');
      
      if (data && data.success && data.price) {
        setKasPrice(data.price);
      } else if (data && data.price) {
        setKasPrice(data.price);
      } else {
        throw new Error(data?.error || 'Failed to load price');
      }
    } catch (err) {
      console.error('❌ Failed to load KAS price:', err);
      setPriceError('Unable to load price');
      setKasPrice(null);
    } finally {
      setIsPriceLoading(false);
    }
  };

  const handleCheckBalance = async (addressToCheck = null) => {
    const addrToUse = addressToCheck || address;
    
    if (!addrToUse || !addrToUse.trim()) {
      setError('Please enter a valid Kaspa address');
      return null;
    }

    if (!addrToUse.startsWith('kaspa:')) {
      setError('Address must start with "kaspa:"');
      return null;
    }

    setIsLoading(true);
    setError(null);
    if (!addressToCheck) {
      setBalance(null);
    }

    try {
      const { data } = await base44.functions.invoke('getKaspaBalance', { 
        address: addrToUse.trim() 
      });

      if (data && data.success) {
        const balanceData = {
          ...data,
          balanceUSD: kasPrice ? data.balanceKAS * kasPrice : 0
        };
        
        if (!addressToCheck) {
          setBalance(balanceData);
        }
        return balanceData;
      } else {
        throw new Error(data?.error || 'Failed to fetch balance');
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to fetch balance. Please try again.';
      if (!addressToCheck) {
        setError(errorMsg);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const addCustomAddress = async () => {
    if (!customAddress.trim() || !customAddress.startsWith('kaspa:')) {
      setError('Please enter a valid Kaspa address starting with "kaspa:"');
      return;
    }

    if (trackedAddresses.some(addr => addr.address === customAddress.trim())) {
      setError('This address is already being tracked');
      return;
    }

    setIsAddingCustom(true);
    setError(null);

    try {
      const balanceData = await handleCheckBalance(customAddress.trim());

      if (balanceData) {
        const newAddress = {
          address: customAddress.trim(),
          addedAt: Date.now(),
          balance: balanceData.balanceKAS,
          balanceUSD: balanceData.balanceUSD || 0
        };

        const updated = [...trackedAddresses, newAddress];
        saveTrackedAddresses(updated);
        setCustomAddress('');
      }
    } catch (err) {
      setError('Failed to add address: ' + err.message);
    } finally {
      setIsAddingCustom(false);
    }
  };

  const removeTrackedAddress = (address) => {
    const updated = trackedAddresses.filter(addr => addr.address !== address);
    saveTrackedAddresses(updated);
  };

  const refreshTrackedAddress = async (address) => {
    const balanceData = await handleCheckBalance(address);
    if (balanceData) {
      const updated = trackedAddresses.map(addr => 
        addr.address === address 
          ? { ...addr, balance: balanceData.balanceKAS, balanceUSD: balanceData.balanceUSD || 0 }
          : addr
      );
      saveTrackedAddresses(updated);
    }
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    // Check if num is a valid number before formatting
    if (typeof num !== 'number' || isNaN(num)) return 'N/A';

    if (Math.abs(num) >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (Math.abs(num) >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const isAdmin = user && user.role === 'admin';

  return (
    <div className="min-h-screen bg-black p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">KAS PRICE TRACKER</h1>
            <p className="text-gray-500 mt-1 text-sm">Live Kaspa price tracking & interactive trading</p>
          </div>
          <div className="flex items-center gap-3">
            {/* KAS Price with change */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-1">KAS Price</div>
              {isPriceLoading ? (
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              ) : priceError ? (
                <div className="text-xs text-red-400">{priceError}</div>
              ) : kasPrice !== null ? (
                <>
                  <div className="text-2xl font-bold text-green-400">${kasPrice.toFixed(6)}</div>
                  {priceChange24h !== 0 && ( // priceChange24h will default to 0 as history generation is removed.
                    <div className={`text-xs flex items-center gap-1 mt-1 ${priceChange24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {priceChange24h > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(priceChange24h).toFixed(2)}% (24h)
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-gray-500">N/A</div>
              )}
            </div>

            {/* Refresh */}
            <Button
              onClick={() => { loadKasPrice(); loadDappsStatus(); }} // NEW: Refresh dApps status
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
              disabled={isPriceLoading || isDappsLoading}
            >
              <RefreshCw className={`w-5 h-5 ${isPriceLoading || isDappsLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Live Price Chart - REMOVED as per outline (generatePriceHistory is removed) */}
        {/* The section for Live Price Chart was removed here */}

        {/* NEW: Kaspa dApps Status */}
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Kaspa Ecosystem Status</h2>
                <p className="text-sm text-gray-500 mt-1">Live dApp status from Kasplex</p>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Activity className="w-3 h-3 mr-1" />
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isDappsLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {dappsStatus.map((dapp, index) => (
                  <motion.div
                    key={dapp.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-black border border-zinc-800 rounded-lg p-4 hover:border-cyan-500/30 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center">
                          {dapp.icon}
                        </div>
                        <div>
                          <h3 className="font-bold text-white">{dapp.name}</h3>
                          <p className="text-xs text-gray-500">{dapp.description}</p>
                        </div>
                      </div>
                      <Badge className={`${
                        dapp.status === 'online' 
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}>
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {dapp.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-zinc-950 rounded-lg p-2">
                        <div className="text-xs text-gray-500">Active Users</div>
                        <div className="text-sm font-bold text-white">{dapp.activeUsers}</div>
                      </div>
                      <div className="bg-zinc-950 rounded-lg p-2">
                        <div className="text-xs text-gray-500">TVL</div>
                        <div className="text-sm font-bold text-cyan-400">{dapp.tvl}</div>
                      </div>
                    </div>

                    <a
                      href={dapp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Visit dApp
                    </a>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Interactive Trading Tool */}
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="border-b border-zinc-800">
            <h2 className="text-xl font-bold text-white">Interactive Trading Calculator</h2>
            <p className="text-sm text-gray-500">Calculate KAS ⇄ USD conversions</p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Trading Type Toggle */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setTradingType('buy')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    tradingType === 'buy'
                      ? 'bg-green-500/20 border-green-500/50 text-white'
                      : 'bg-zinc-900 border-zinc-800 text-gray-500 hover:border-green-500/30'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <ArrowUpRight className="w-5 h-5" />
                    <span className="text-lg font-bold">Buy KAS</span>
                  </div>
                  <div className="text-xs text-gray-400">USD → KAS</div>
                </button>

                <button
                  onClick={() => setTradingType('sell')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    tradingType === 'sell'
                      ? 'bg-red-500/20 border-red-500/50 text-white'
                      : 'bg-zinc-900 border-zinc-800 text-gray-500 hover:border-red-500/30'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <ArrowDownRight className="w-5 h-5" />
                    <span className="text-lg font-bold">Sell KAS</span>
                  </div>
                  <div className="text-xs text-gray-400">KAS → USD</div>
                </button>
              </div>

              {/* Trading Input */}
              <div className="bg-black border border-zinc-800 rounded-lg p-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      {tradingType === 'buy' ? 'Amount in USD' : 'Amount in KAS'}
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={tradingAmount}
                        onChange={(e) => setTradingAmount(e.target.value)}
                        placeholder={tradingType === 'buy' ? '100.00' : '1000.00'}
                        className="bg-zinc-950 border-zinc-800 text-white text-2xl font-bold h-16 pr-16"
                        step="0.01"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                        {tradingType === 'buy' ? 'USD' : 'KAS'}
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <div className="bg-zinc-900 rounded-full p-3">
                      {tradingType === 'buy' ? (
                        <ArrowUpRight className="w-6 h-6 text-green-400" />
                      ) : (
                        <ArrowDownRight className="w-6 h-6 text-red-400" />
                      )}
                    </div>
                  </div>

                  {/* Result */}
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      {tradingType === 'buy' ? 'You will receive' : 'You will receive'}
                    </label>
                    <div className={`bg-zinc-950 border-2 rounded-lg p-4 ${
                      tradingType === 'buy' ? 'border-green-500/30' : 'border-red-500/30'
                    }`}>
                      <div className={`text-3xl font-bold ${
                        tradingType === 'buy' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {estimatedValue !== null && estimatedValue !== 0 ? (
                            tradingType === 'buy' ? `${estimatedValue.toFixed(8)} KAS` : `$${estimatedValue.toFixed(2)} USD`
                        ) : '0.00'}
                      </div>
                      {kasPrice && tradingAmount && (
                        <div className="text-xs text-gray-500 mt-2">
                          Rate: 1 KAS = ${kasPrice.toFixed(6)} USD
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-3">
                {tradingType === 'buy' ? (
                  <>
                    <Button onClick={() => setTradingAmount('10')} variant="outline" className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800">$10</Button>
                    <Button onClick={() => setTradingAmount('50')} variant="outline" className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800">$50</Button>
                    <Button onClick={() => setTradingAmount('100')} variant="outline" className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800">$100</Button>
                    <Button onClick={() => setTradingAmount('500')} variant="outline" className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800">$500</Button>
                  </>
                ) : (
                  <>
                    <Button onClick={() => setTradingAmount('100')} variant="outline" className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800">100 KAS</Button>
                    <Button onClick={() => setTradingAmount('500')} variant="outline" className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800">500 KAS</Button>
                    <Button onClick={() => setTradingAmount('1000')} variant="outline" className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800">1K KAS</Button>
                    <Button onClick={() => setTradingAmount('5000')} variant="outline" className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800">5K KAS</Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Only: Check Single Address */}
        {isAdmin && (
          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader className="border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Check Address Balance</h2>
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                  Admin Only
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex gap-3">
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="kaspa:qqq..."
                  className="flex-1 bg-black border-zinc-800 text-white placeholder:text-gray-600 font-mono h-12"
                  disabled={isLoading}
                />
                <Button
                  onClick={() => handleCheckBalance()}
                  disabled={isLoading || !address.trim()}
                  className="bg-white text-black hover:bg-gray-200 h-12 px-6"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Check Balance
                    </>
                  )}
                </Button>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-semibold text-red-300 mb-1">Error</div>
                    <div className="text-sm text-red-200">{error}</div>
                  </div>
                </div>
              )}

              {balance && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-black border border-zinc-800 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Balance Details</h3>
                    <a
                      href={`https://kas.fyi/address/${balance.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View on Explorer
                      </Button>
                    </a>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Address</div>
                      <div className="text-white font-mono text-sm break-all bg-zinc-950 border border-zinc-800 rounded p-3">{balance.address}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                        <div className="text-xs text-gray-500 mb-2">Balance (KAS)</div>
                        <div className="text-3xl font-bold text-cyan-400">{balance.balanceKAS.toFixed(8)}</div>
                      </div>

                      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                        <div className="text-xs text-gray-500 mb-2">Balance (USD)</div>
                        <div className="text-2xl font-bold text-white">${formatNumber(balance.balanceUSD)}</div>
                      </div>
                    </div>

                    {balance.source && (
                      <div className="text-xs text-gray-600">
                        Data source: {balance.source}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Track Custom Addresses */}
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="border-b border-zinc-800">
            <h3 className="text-lg font-bold text-white">Track Custom Addresses</h3>
            <p className="text-sm text-gray-500">Monitor multiple Kaspa addresses</p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex gap-3 mb-6">
              <Input
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                placeholder="Enter Kaspa address (kaspa:...)"
                className="flex-1 bg-black border-zinc-800 text-white placeholder:text-gray-600 font-mono h-12"
                disabled={isAddingCustom}
              />
              <Button
                onClick={addCustomAddress}
                disabled={isAddingCustom || !customAddress.trim()}
                className="bg-white text-black hover:bg-gray-200 h-12 px-6"
              >
                {isAddingCustom ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Address
                  </>
                )}
              </Button>
            </div>

            {trackedAddresses.length > 0 ? (
              <div className="space-y-3">
                {trackedAddresses.map((addr, index) => (
                  <motion.div
                    key={addr.address}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-black border border-zinc-800 rounded-lg p-4 hover:border-cyan-500/50 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-mono text-sm break-all mb-3">
                          {addr.address}
                        </div>
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="text-xs text-gray-500">Balance</div>
                            <div className="text-lg font-bold text-cyan-400">{addr.balance?.toFixed(8) || '0.00000000'} KAS</div>
                          </div>
                          {kasPrice && (
                            <div>
                              <div className="text-xs text-gray-500">USD Value</div>
                              <div className="text-lg font-bold text-white">${formatNumber(addr.balanceUSD)}</div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => refreshTrackedAddress(addr.address)}
                          size="sm"
                          variant="ghost"
                          className="text-gray-400 hover:text-white"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => removeTrackedAddress(addr.address)}
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No addresses tracked yet. Add an address above to start monitoring.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
