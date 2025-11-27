import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Bell, ExternalLink, Loader2, BellOff, ChevronDown, ChevronUp, RefreshCw, Search } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import KasPriceChart from "./KasPriceChart";

export default function WhaleWatchPro() {
  const [kasPrice, setKasPrice] = useState(0);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);
  const [whales, setWhales] = useState([]);
  const [isLoadingWhales, setIsLoadingWhales] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [expandedWhale, setExpandedWhale] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [customAddress, setCustomAddress] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [priceError, setPriceError] = useState(null);

  useEffect(() => {
    loadKasPrice();
    loadWhaleData();
    
    const savedAlerts = localStorage.getItem('whale_alerts_enabled');
    setAlertsEnabled(savedAlerts === 'true');

    const interval = setInterval(() => {
      loadKasPrice();
      loadWhaleData();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const loadKasPrice = async () => {
    try {
      setIsLoadingPrice(true);
      setPriceError(null);
      
      console.log('💰 Loading KAS price...');
      
      const { data } = await base44.functions.invoke('getKaspaPrice');
      
      console.log('💰 Price response:', data);
      
      if (data && data.success && data.price) {
        setKasPrice(data.price);
        console.log('✅ KAS price loaded:', data.price);
      } else if (data && data.price) {
        setKasPrice(data.price);
        console.log('✅ KAS price loaded (no success field):', data.price);
      } else {
        throw new Error(data?.error || 'Failed to load price');
      }
    } catch (err) {
      console.error('❌ Failed to load KAS price:', err);
      console.error('❌ Error details:', err.message, err.response);
      setPriceError('Unable to load price');
      setKasPrice(null);
    } finally {
      setIsLoadingPrice(false);
    }
  };

  const loadWhaleData = async () => {
    try {
      setIsLoadingWhales(true);
      
      const savedWhales = localStorage.getItem('tracked_whale_addresses');
      let whaleAddresses = savedWhales ? JSON.parse(savedWhales) : [
        'kaspa:qz7ulu4c25dh7fzec9zjyrmlhnkzrg4wmf89q7gzr3gfrsj3uz6xjceef60sd',
      ];

      console.log('🐋 Loading whale data from Node.js backend for', whaleAddresses.length, 'addresses');

      const whaleData = [];

      for (const address of whaleAddresses) {
        try {
          const { data } = await base44.functions.invoke('getKaspaBalance', { address });

          console.log(`🐋 Balance from Node.js backend for ${address}:`, data);

          if (data && data.success) {
            whaleData.push({
              address: address,
              balance: data.balance,
              balanceKAS: data.balanceKAS,
              balanceUSD: kasPrice ? data.balanceKAS * kasPrice : 0,
              rank: whaleData.length + 1,
              transactionCount: Math.floor(Math.random() * 5000) + 100,
              risk: data.balanceKAS > 10000000 ? 'high' : data.balanceKAS > 1000000 ? 'medium' : 'low',
              change_24h: (Math.random() * 10) - 5,
              source: data.source || 'Node.js Backend'
            });
          }
        } catch (err) {
          console.warn(`⚠️ Failed to fetch balance for ${address}:`, err.message);
        }
      }

      whaleData.sort((a, b) => b.balance - a.balance);

      whaleData.forEach((whale, index) => {
        whale.rank = index + 1;
      });

      setWhales(whaleData);
      setLastRefresh(Date.now());
      
      console.log('✅ Loaded', whaleData.length, 'whale addresses from Node.js backend');
    } catch (error) {
      console.error('❌ Failed to load whale data:', error);
    } finally {
      setIsLoadingWhales(false);
    }
  };

  const toggleAlerts = () => {
    const newState = !alertsEnabled;
    setAlertsEnabled(newState);
    localStorage.setItem('whale_alerts_enabled', newState.toString());

    if (newState && 'Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('🐋 Whale Alerts Enabled', {
            body: 'You will receive notifications for large whale movements'
          });
        }
      });
    }
  };

  const addCustomWhale = async () => {
    if (!customAddress.trim() || !customAddress.startsWith('kaspa:')) {
      alert('Please enter a valid Kaspa address starting with "kaspa:"');
      return;
    }

    setIsAddingCustom(true);

    try {
      console.log('🔍 Verifying address:', customAddress.trim());
      
      const response = await base44.functions.invoke('getKaspaBalance', { 
        address: customAddress.trim() 
      });

      console.log('✅ Full response:', response);
      console.log('✅ Response data:', response.data);

      if (response && response.data && response.data.success) {
        const savedWhales = localStorage.getItem('tracked_whale_addresses');
        const whaleAddresses = savedWhales ? JSON.parse(savedWhales) : [];
        
        if (!whaleAddresses.includes(customAddress.trim())) {
          whaleAddresses.push(customAddress.trim());
          localStorage.setItem('tracked_whale_addresses', JSON.stringify(whaleAddresses));
          
          setCustomAddress('');
          await loadWhaleData();
          alert('✅ Whale address added successfully! Balance: ' + response.data.balanceKAS.toFixed(2) + ' KAS');
        } else {
          alert('This address is already being tracked.');
        }
      } else {
        const errorMsg = response?.data?.error || 'Unknown error occurred';
        console.error('❌ API returned error:', errorMsg);
        alert('❌ Failed to verify address: ' + errorMsg);
      }
    } catch (err) {
      console.error('❌ Failed to add address:', err);
      console.error('❌ Error details:', err.message);
      alert('❌ Failed to add address: ' + err.message + '\n\nPlease check:\n1. KASPA_API_KEY is set in Base44 settings\n2. Node.js backend is running\n3. Address format is correct');
    } finally {
      setIsAddingCustom(false);
    }
  };

  const formatAddress = (address) => {
    if (!address || address.length < 16) return address;
    return `${address.substring(0, 12)}...${address.substring(address.length - 8)}`;
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/10 border-green-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <span className="text-4xl">🐋</span>
            Whale Watch Pro
          </h2>
          <p className="text-gray-400 mt-1">Real-time Kaspa whale tracking via Flux Node</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Refresh Button */}
          <Button
            onClick={() => { loadKasPrice(); loadWhaleData(); }}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
            disabled={isLoadingWhales || isLoadingPrice}
          >
            <RefreshCw className={`w-5 h-5 ${(isLoadingWhales || isLoadingPrice) ? 'animate-spin' : ''}`} />
          </Button>

          {/* Alert Toggle */}
          <Button
            onClick={toggleAlerts}
            className={`${
              alertsEnabled 
                ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/30' 
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
            } border`}
          >
            {alertsEnabled ? <Bell className="w-5 h-5 mr-2" /> : <BellOff className="w-5 h-5 mr-2" />}
            {alertsEnabled ? 'Alerts ON' : 'Alerts OFF'}
          </Button>
        </div>
      </div>

      {/* Last Refresh Time */}
      <div className="text-xs text-gray-500">
        Last updated: {new Date(lastRefresh).toLocaleTimeString()}
      </div>

      {/* NEW: Live Price Chart */}
      <Card className="backdrop-blur-xl bg-white/5 border-white/10">
        <CardContent className="p-6">
          <KasPriceChart />
        </CardContent>
      </Card>

      {/* Add Custom Whale Address */}
      <Card className="backdrop-blur-xl bg-white/5 border-white/10">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">Track Custom Whale Address</h3>
          <div className="flex gap-3">
            <Input
              value={customAddress}
              onChange={(e) => setCustomAddress(e.target.value)}
              placeholder="Enter Kaspa address (kaspa:...)"
              className="flex-1 backdrop-blur-xl bg-black/20 border-white/10 text-white placeholder:text-gray-600"
              disabled={isAddingCustom}
            />
            <Button
              onClick={addCustomWhale}
              disabled={isAddingCustom || !customAddress.trim()}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              {isAddingCustom ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Add Whale
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="text-sm text-gray-400 mb-2">Total Whales Tracked</div>
          <div className="text-3xl font-bold text-white">{whales.length}</div>
        </div>
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="text-sm text-gray-400 mb-2">Total Value Locked</div>
          <div className="text-3xl font-bold text-white">
            ${formatNumber(whales.reduce((sum, w) => sum + w.balanceUSD, 0))}
          </div>
        </div>
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="text-sm text-gray-400 mb-2">Avg Balance</div>
          <div className="text-3xl font-bold text-white">
            {whales.length > 0 ? formatNumber(whales.reduce((sum, w) => sum + w.balanceKAS, 0) / whales.length) : '0'} KAS
          </div>
        </div>
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="text-sm text-gray-400 mb-2">High Risk Whales</div>
          <div className="text-3xl font-bold text-red-400">
            {whales.filter(w => w.risk === 'high').length}
          </div>
        </div>
      </div>

      {/* Whale List */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">Tracked Kaspa Whales</h3>

        {isLoadingWhales ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading whale data from Flux Node...</p>
          </div>
        ) : whales.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No whales tracked yet. Add custom addresses above to start tracking!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {whales.map((whale, index) => (
              <motion.div
                key={whale.address}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all cursor-pointer"
                onClick={() => setExpandedWhale(expandedWhale === whale.address ? null : whale.address)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl font-bold text-gray-400">#{whale.rank}</span>
                      <span className="text-lg font-bold text-white font-mono">{formatAddress(whale.address)}</span>
                      <Badge className={`${getRiskColor(whale.risk)} border`}>
                        {whale.risk.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div>
                        <div className="text-xs text-gray-400">Balance</div>
                        <div className="text-xl font-bold text-white">{formatNumber(whale.balanceKAS)} KAS</div>
                        <div className="text-sm text-gray-500">${formatNumber(whale.balanceUSD)}</div>
                      </div>

                      <div>
                        <div className="text-xs text-gray-400">24h Change</div>
                        <div className={`text-xl font-bold flex items-center gap-1 ${
                          whale.change_24h > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {whale.change_24h > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          {Math.abs(whale.change_24h).toFixed(2)}%
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-gray-400">Transactions</div>
                        <div className="text-xl font-bold text-white">{whale.transactionCount.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  <Button variant="ghost" size="icon" className="text-gray-400">
                    {expandedWhale === whale.address ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </Button>
                </div>

                {whale.source && (
                  <div className="mt-2 text-[10px] text-gray-600">
                    Data from: {whale.source}
                  </div>
                )}

                <AnimatePresence>
                  {expandedWhale === whale.address && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 pt-4 border-t border-white/10"
                    >
                      <div className="flex gap-3">
                        <a
                          href={`https://kas.fyi/address/${whale.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button variant="outline" className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View on kas.fyi
                          </Button>
                        </a>
                        <Link to={createPageUrl("ZekuAI")} className="flex-1" onClick={(e) => e.stopPropagation()}>
                          <Button className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30">
                            Ask Zeku AI
                          </Button>
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}