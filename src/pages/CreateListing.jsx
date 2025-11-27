import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, AlertCircle, Shield, CheckCircle, RefreshCw, MapPin, Users, Crown, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const CONTRACT_ADDRESSES = {
  mainnet: "0x7A4f6C9B2128F10d3B7Aa01bf288825d4e1b5194",
  testnet: "0x7A4f6C9B2128F10d3B7Aa01bf288825d4e1b5194"
};

export default function CreateListingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [wallet, setWallet] = useState({ connected: false, address: null, balance: 0 });
  const [network, setNetwork] = useState('mainnet');
  const [contractAddress, setContractAddress] = useState(CONTRACT_ADDRESSES.mainnet);

  const [formData, setFormData] = useState({
    kas_amount: "",
    fiat_amount: "",
    location: "",
    meeting_notes: ""
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [step, setStep] = useState(1);

  useEffect(() => {
    loadUser();
    checkWallet();
    checkNetwork();
    checkSubscription();
  }, []);

  const checkSubscription = () => {
    const saved = localStorage.getItem('subscription');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.isActive && data.expiresAt < Date.now()) {
        data.isActive = false;
      }
      setSubscription(data);
    }
  };

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.error('Failed to load user:', err);
    }
  };

  const checkNetwork = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const envParam = urlParams.get('env');

    if (envParam === 'testnet') {
      setNetwork('testnet');
      setContractAddress(CONTRACT_ADDRESSES.testnet);
    } else {
      setNetwork('mainnet');
      setContractAddress(CONTRACT_ADDRESSES.mainnet);
    }
  };

  const checkWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const balance = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [accounts[0], 'latest']
          });
          const balanceInKAS = parseInt(balance, 16) / 1e18;
          setWallet({ 
            connected: true, 
            address: accounts[0], 
            balance: balanceInKAS 
          });
        }
      } catch (err) {
        console.error('Failed to check wallet:', err);
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await checkWallet();
      setSuccess('✅ Wallet info refreshed!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError('Failed to refresh wallet info');
    } finally {
      setIsRefreshing(false);
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('MetaMask not installed. Please install MetaMask extension.');
      return;
    }

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      await checkWallet();
    } catch (err) {
      setError('Failed to connect wallet: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check premium subscription
    const isAdmin = user && user.role === 'admin';
    if (!isAdmin && (!subscription || !subscription.isActive)) {
      setError('Premium subscription required to create listings. Please subscribe first.');
      setTimeout(() => {
        navigate(createPageUrl("Subscription"));
      }, 2000);
      return;
    }

    // Check trust score
    const trustScore = user?.reputation_score || 5.0;
    if (trustScore < 3.0) {
      setError('Your trust score is too low to create listings. Complete more trades to improve your reputation.');
      return;
    }

    if (!wallet.connected || !wallet.address) {
      setError('Please connect your wallet first.');
      return;
    }

    if (!contractAddress || !contractAddress.startsWith('0x') || contractAddress.length !== 42) {
      setError('Please enter a valid contract address');
      return;
    }

    const kasAmount = parseFloat(formData.kas_amount);
    const fiatAmount = parseFloat(formData.fiat_amount);

    if (!kasAmount || kasAmount <= 0) {
      setError('Please enter a valid KAS amount.');
      return;
    }

    if (!fiatAmount || fiatAmount <= 0) {
      setError('Please enter a valid price.');
      return;
    }

    if (!formData.location.trim()) {
      setError('Please provide your location');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    setStep(1);

    try {
      setStep(1);
      console.log('📝 Step 1: Preparing contract transaction...');

      const fiatAmountCents = Math.floor(fiatAmount * 100);
      const amountInWei = '0x' + (BigInt(Math.floor(kasAmount * 1e18))).toString(16);

      setStep(2);
      console.log('🔐 Step 2: Locking KAS in escrow...');

      // Simple transaction to lock funds
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: wallet.address,
          to: contractAddress,
          value: amountInWei,
          gas: '0x493E0',
          maxFeePerGas: '0x2BA7DEF3000',
          maxPriorityFeePerGas: '0xB2D05E00',
        }]
      });

      setStep(3);
      console.log('✅ Transaction sent! Hash:', txHash);
      console.log('⏳ Waiting for confirmation...');

      // Wait for transaction receipt
      let receipt = null;
      let attempts = 0;
      while (!receipt && attempts < 60) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        try {
          receipt = await window.ethereum.request({
            method: 'eth_getTransactionReceipt',
            params: [txHash]
          });
        } catch (e) {
          console.log('Waiting for receipt...');
        }
        attempts++;
      }

      if (receipt && receipt.status === '0x1') {
        console.log('✅ Transaction confirmed!');
        await saveListing(txHash);
      } else {
        throw new Error('Transaction failed or timed out');
      }

    } catch (err) {
      console.error('❌ Failed to create listing:', err);
      if (err.code === 4001) {
        setError('Transaction cancelled by user');
      } else {
        setError(err.message || 'Failed to create listing');
      }
      setIsProcessing(false);
    }
  };

  const saveListing = async (txHash) => {
    try {
      const kasAmount = parseFloat(formData.kas_amount);
      const fiatAmount = parseFloat(formData.fiat_amount);

      await base44.entities.Listing.create({
        type: "sell",
        kas_amount: kasAmount,
        fiat_amount: fiatAmount,
        location: formData.location.trim(),
        meeting_notes: formData.meeting_notes.trim() || "Flexible meeting location",
        status: "open",
        seller_address: wallet.address,
        tx_hash: txHash,
        contract_trade_id: 0,
        contract_address: contractAddress
      });

      console.log('✅ Listing created!');
      setSuccess('✅ Listing created successfully! Redirecting...');

      setTimeout(() => {
        navigate(createPageUrl("Marketplace"));
      }, 2000);

    } catch (err) {
      console.error('Failed to save listing:', err);
      setError('Transaction confirmed, but failed to save listing: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const rate = formData.kas_amount && formData.fiat_amount
    ? (parseFloat(formData.fiat_amount) / parseFloat(formData.kas_amount)).toFixed(4)
    : '0';

  const isAdmin = user && user.role === 'admin';
  const hasPremium = isAdmin || (subscription && subscription.isActive);
  const trustScore = user?.reputation_score || 5.0;
  const canCreateListing = hasPremium && trustScore >= 3.0;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative z-10 p-6 md:p-8 lg:p-12">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link to={createPageUrl("Marketplace")}>
              <Button variant="ghost" className="mb-6 text-gray-400 hover:text-white hover:bg-white/5">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Marketplace
              </Button>
            </Link>

            <div className="flex items-center justify-between mb-4">
              <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                Create P2P Listing
              </h1>

              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={network === 'mainnet'
                    ? "bg-green-500/20 text-green-300 border-green-500/30"
                    : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                  }
                >
                  {network === 'mainnet' ? '🟢 Mainnet' : '🟡 Testnet'}
                </Badge>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newNetwork = network === 'mainnet' ? 'testnet' : 'mainnet';
                    setNetwork(newNetwork);
                    setContractAddress(CONTRACT_ADDRESSES[newNetwork]);
                  }}
                  className="text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20"
                >
                  Switch to {network === 'mainnet' ? 'Testnet' : 'Mainnet'}
                </Button>
              </div>
            </div>

            <p className="text-gray-400 text-lg">
              Meet buyers in person - safer, personal, real-world adoption
            </p>
          </motion.div>

          {/* Requirements Card */}
          {!canCreateListing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="backdrop-blur-xl bg-red-500/20 border-red-500/30">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-200 font-semibold mb-2">Requirements Not Met</p>
                      <ul className="text-sm text-red-300 space-y-1">
                        {!hasPremium && (
                          <li className="flex items-center gap-2">
                            <Crown className="w-4 h-4" />
                            Premium subscription required
                          </li>
                        )}
                        {trustScore < 3.0 && (
                          <li className="flex items-center gap-2">
                            <Star className="w-4 h-4" />
                            Trust score too low (need 3.0+, you have {trustScore.toFixed(1)})
                          </li>
                        )}
                      </ul>
                      {!hasPremium && (
                        <Link to={createPageUrl("Subscription")}>
                          <Button className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500">
                            <Crown className="w-4 h-4 mr-2" />
                            Get Premium
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {wallet.connected && wallet.address && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="backdrop-blur-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Connected Wallet</div>
                      <div className="text-lg font-bold text-white font-mono">
                        {wallet.address?.substring(0, 10)}...{wallet.address?.substring(wallet.address.length - 8)}
                      </div>
                      <div className="text-sm text-cyan-400 mt-1">{wallet.balance.toFixed(4)} KAS</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400 mb-1">Trust Score</div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span className="text-lg font-bold text-white">{trustScore.toFixed(1)}</span>
                      </div>
                    </div>
                    <Button
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      variant="outline"
                      size="sm"
                      className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {!wallet.connected && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Card className="backdrop-blur-xl bg-yellow-500/20 border-yellow-500/30">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-yellow-200 font-semibold mb-2">Wallet Required</p>
                      <p className="text-sm text-yellow-100 mb-4">
                        Connect your MetaMask wallet to lock KAS in escrow.
                      </p>
                      <Button
                        onClick={connectWallet}
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                      >
                        Connect MetaMask
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="backdrop-blur-xl bg-red-500/20 border-red-500/30">
                <CardContent className="p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300 whitespace-pre-line">{error}</p>
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
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-300">{success}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className={`flex items-center gap-3 ${step >= 1 ? 'text-cyan-400' : 'text-gray-600'}`}>
                      {step > 1 ? <Shield className="w-5 h-5" /> : <Loader2 className="w-5 h-5 animate-spin" />}
                      <span className="font-semibold">Step 1: Preparing transaction</span>
                    </div>
                    <div className={`flex items-center gap-3 ${step >= 2 ? 'text-cyan-400' : 'text-gray-600'}`}>
                      {step > 2 ? <Shield className="w-5 h-5" /> : step === 2 ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                      <span className="font-semibold">Step 2: Locking {formData.kas_amount} KAS in escrow</span>
                    </div>
                    <div className={`flex items-center gap-3 ${step >= 3 ? 'text-cyan-400' : 'text-gray-600'}`}>
                      {step === 3 ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                      <span className="font-semibold">Step 3: Publishing listing</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="backdrop-blur-xl bg-white/5 border-white/10">
              <CardHeader className="border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Listing Details</h2>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block font-semibold">Contract Address</label>
                    <Input
                      type="text"
                      placeholder="0x..."
                      value={contractAddress}
                      onChange={(e) => setContractAddress(e.target.value)}
                      className="bg-white/5 border-white/20 text-white font-mono text-sm"
                      disabled={isProcessing}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">KAS Amount to Lock</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g., 2.5"
                      value={formData.kas_amount}
                      onChange={(e) => setFormData({...formData, kas_amount: e.target.value})}
                      className="bg-white/5 border-white/10 text-white text-lg"
                      disabled={isProcessing || !canCreateListing}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Price (USD Cash)</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g., 0.17"
                      value={formData.fiat_amount}
                      onChange={(e) => setFormData({...formData, fiat_amount: e.target.value})}
                      className="bg-white/5 border-white/10 text-white text-lg"
                      disabled={isProcessing || !canCreateListing}
                      required
                    />
                    {formData.kas_amount && formData.fiat_amount && (
                      <p className="text-xs text-cyan-400 mt-1">Rate: ${rate} per KAS</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Your Location (City or Area)
                    </label>
                    <Input
                      placeholder="e.g., Los Angeles, CA or Manhattan, NY"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="bg-white/5 border-white/10 text-white"
                      disabled={isProcessing || !canCreateListing}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Buyers near you will see your listing</p>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Meeting Notes (Optional)</label>
                    <Input
                      placeholder="e.g., Prefer coffee shops, weekends only"
                      value={formData.meeting_notes}
                      onChange={(e) => setFormData({...formData, meeting_notes: e.target.value})}
                      className="bg-white/5 border-white/10 text-white"
                      disabled={isProcessing || !canCreateListing}
                    />
                  </div>

                  <div className="backdrop-blur-xl bg-cyan-500/20 border border-cyan-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-cyan-200">
                        <p className="font-semibold mb-2">Peer-to-Peer Trading</p>
                        <ul className="space-y-1 text-xs">
                          <li>• Meet buyers in person for safe cash transactions</li>
                          <li>• Choose public places like coffee shops</li>
                          <li>• KAS locked in escrow until both parties confirm</li>
                          <li>• Build trust through successful trades</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={!wallet.connected || isProcessing || !canCreateListing}
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white disabled:opacity-50 shadow-lg shadow-cyan-500/50"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                        Processing...
                      </>
                    ) : !canCreateListing ? (
                      <>
                        <AlertCircle className="w-5 h-5 mr-3" />
                        Requirements Not Met
                      </>
                    ) : (
                      <>
                        <Shield className="w-5 h-5 mr-3" />
                        Lock KAS & Create Listing
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}