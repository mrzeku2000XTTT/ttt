
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, Loader2, Copy, CheckCircle2, Eye, EyeOff, Plus, Upload, RefreshCw, ArrowLeft, Shield, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const REPLIT_ZK_BASE = 'https://tttxxx.live';

export default function ZKWalletPage() {
  const iframeRef = useRef(null);
  
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState('list'); // list, create, import, view
  const [wordCount, setWordCount] = useState(24);
  const [importMnemonic, setImportMnemonic] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [currentWallet, setCurrentWallet] = useState(null);
  const [showSeed, setShowSeed] = useState({});
  const [iframeReady, setIframeReady] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [balance, setBalance] = useState(null);
  const [isFetchingBalance, setIsFetchingBalance] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== REPLIT_ZK_BASE) return;
      if (!event.data?.type) return;
      
      // Filter TTT wallet messages
      if (event.data.userId && !event.data.userId.includes('_zk')) {
        return;
      }

      console.log('📨 ZK Wallet iframe message:', event.data);

      if (event.data.type === 'kaspaPOSReady') {
        console.log('✅ ZK iframe ready');
        setIframeReady(true);
      } else if (event.data.type === 'walletCreated' && event.data.wallet) {
        handleWalletCreated(event.data.wallet);
      } else if (event.data.type === 'walletImported' && event.data.address) {
        handleWalletImported({
          address: event.data.address,
          mnemonic: importMnemonic,
          wordCount: importMnemonic.trim().split(/\s+/).filter(w => w).length
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [importMnemonic]);

  const loadUser = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setWallets(currentUser.agent_zk_wallets || []);
      
      // Auto-select last wallet if available
      const zkWallets = currentUser.agent_zk_wallets || [];
      if (zkWallets.length > 0) {
        setCurrentWallet(zkWallets[zkWallets.length - 1]);
      }
    } catch (err) {
      console.error('Failed to load user:', err);
      setError('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletCreated = async (wallet) => {
    console.log('🎉 Wallet created:', wallet);
    setIsProcessing(true);
    setError(null);

    try {
      const currentUser = await base44.auth.me();
      const existingWallets = currentUser.agent_zk_wallets || [];

      const encryptedSeed = btoa(wallet.mnemonic);

      const newWallet = {
        address: wallet.address,
        wordCount: wallet.mnemonic.split(' ').filter(w => w).length,
        createdAt: new Date().toISOString(),
        type: 'zk_wallet',
        encryptedSeed: encryptedSeed
      };

      await base44.auth.updateMe({
        agent_zk_wallets: [...existingWallets, newWallet]
      });

      setWallets([...existingWallets, newWallet]);
      setCurrentWallet(newWallet);
      setSuccess('✅ ZK Wallet created successfully!');
      setMode('view');
    } catch (err) {
      console.error('Failed to save wallet:', err);
      setError('Failed to save wallet');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWalletImported = async (wallet) => {
    console.log('🎉 Wallet imported:', wallet);
    setIsProcessing(true);
    setError(null);

    try {
      const currentUser = await base44.auth.me();
      const existingWallets = currentUser.agent_zk_wallets || [];

      const encryptedSeed = btoa(wallet.mnemonic);

      const newWallet = {
        address: wallet.address,
        wordCount: wallet.wordCount,
        createdAt: new Date().toISOString(),
        type: 'zk_wallet',
        encryptedSeed: encryptedSeed
      };

      await base44.auth.updateMe({
        agent_zk_wallets: [...existingWallets, newWallet]
      });

      setWallets([...existingWallets, newWallet]);
      setCurrentWallet(newWallet);
      setSuccess('✅ ZK Wallet imported successfully!');
      setMode('view');
      setImportMnemonic('');
    } catch (err) {
      console.error('Failed to save wallet:', err);
      setError('Failed to save wallet');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateViaIframe = () => {
    if (!iframeReady) {
      setError('ZK system not ready. Please wait...');
      return;
    }

    setMode('create');
    setError(null);
    setSuccess(null);
    setIsProcessing(true);
    
    setTimeout(() => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'createWallet',
          wordCount: wordCount,
          userId: 'zk_' + (user?.email || 'user')
        }, '*');
        console.log('✅ Create wallet message sent');
      } else {
        setError('Failed to communicate with ZK system');
        setIsProcessing(false);
      }
    }, 500);
  };

  const handleImportViaIframe = () => {
    if (!importMnemonic.trim()) {
      setError('Please enter seed phrase');
      return;
    }

    if (!iframeReady) {
      setError('ZK system not ready. Please wait...');
      return;
    }

    const words = importMnemonic.trim().toLowerCase().split(/\s+/).filter(w => w);
    if (words.length !== 12 && words.length !== 24) {
      setError('Seed phrase must be 12 or 24 words');
      return;
    }

    setMode('import');
    setError(null);
    setSuccess(null);
    setIsProcessing(true);
    
    setTimeout(() => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'importWallet',
          mnemonic: words.join(' '),
          userId: 'zk_' + (user?.email || 'user')
        }, '*');
        console.log('✅ Import wallet message sent');
      } else {
        setError('Failed to communicate with ZK system');
        setIsProcessing(false);
      }
    }, 500);
  };

  const fetchBalance = async (address) => {
    if (!address) return;
    
    setIsFetchingBalance(true);
    try {
      const response = await base44.functions.invoke('getKaspaBalance', { address });
      setBalance(response.data);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    } finally {
      setIsFetchingBalance(false);
    }
  };

  const copyAddress = async () => {
    if (!currentWallet?.address) return;
    try {
      await navigator.clipboard.writeText(currentWallet.address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (err) {
      console.error('Copy failed');
    }
  };

  const toggleShowSeed = (address) => {
    setShowSeed(prev => ({ ...prev, [address]: !prev[address] }));
  };

  const getTruncatedAddress = (address) => {
    if (!address) return '';
    const parts = address.split(':');
    const addr = parts[1] || address;
    return `ZKWALLET-${addr.substring(0, 8).toUpperCase()}`;
  };

  useEffect(() => {
    if (currentWallet?.address && !balance) {
      fetchBalance(currentWallet.address);
    }
  }, [currentWallet]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
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
            <Button onClick={() => base44.auth.redirectToLogin()} className="bg-cyan-500 text-white">
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'url(https://i.imgur.com/O35kqPE.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
      </div>

      {/* Hidden iframe for wallet operations */}
      <iframe 
        ref={iframeRef} 
        src={REPLIT_ZK_BASE} 
        style={{ display: 'none' }}
        title="ZK Wallet System"
      />

      <div className="relative z-10 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/50">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">ZK Wallet</h1>
                <p className="text-sm text-cyan-400">Agent ZK Wallet System</p>
              </div>
            </div>
            <Link to={createPageUrl("AgentZK")}>
              <Button variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Agent ZK
              </Button>
            </Link>
          </div>

          {/* System Status */}
          <div className="mb-6 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${iframeReady ? 'bg-green-400' : 'bg-yellow-400'}`} />
            <span className="text-sm text-gray-400">
              {iframeReady ? 'ZK System Ready' : 'Initializing ZK System...'}
            </span>
          </div>

          {/* Messages */}
          {success && (
            <div className="mb-4 bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-sm text-green-300">{success}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <span className="text-sm text-red-300">{error}</span>
            </div>
          )}

          {/* Main Content */}
          {!currentWallet && mode === 'list' && (
            <div className="space-y-4">
              <Card className="bg-black/50 border-cyan-500/30">
                <CardContent className="p-12 text-center">
                  <Wallet className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-2">No ZK Wallet Connected</h2>
                  <p className="text-gray-400 mb-6">
                    Create a new ZK wallet or import an existing one using your seed phrase.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                    <Button
                      onClick={handleCreateViaIframe}
                      disabled={!iframeReady || isProcessing}
                      className="h-20 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    >
                      {isProcessing && mode === 'create' ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="w-5 h-5 mr-2" />
                          Create Wallet
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={() => setMode('import')}
                      disabled={!iframeReady}
                      className="h-20 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      Import Wallet
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {mode === 'import' && !currentWallet && (
            <Card className="bg-black/50 border-cyan-500/30">
              <CardHeader className="border-b border-cyan-500/30">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Import ZK Wallet</h2>
                  <Button
                    onClick={() => setMode('list')}
                    variant="ghost"
                    size="sm"
                    className="text-cyan-400"
                  >
                    Cancel
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Seed Phrase (12 or 24 words)
                  </label>
                  <Textarea
                    value={importMnemonic}
                    onChange={(e) => setImportMnemonic(e.target.value)}
                    placeholder="Enter your seed phrase..."
                    className="bg-black/50 border-cyan-500/30 text-white font-mono min-h-[120px]"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Words: {importMnemonic.trim() ? importMnemonic.trim().split(/\s+/).filter(w => w).length : 0}
                  </p>
                </div>

                <Button
                  onClick={handleImportViaIframe}
                  disabled={!importMnemonic.trim() || isProcessing}
                  className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Importing Wallet...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      Import ZK Wallet
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {currentWallet && (
            <div className="space-y-4">
              {/* Wallet Info Card */}
              <Card className="bg-black/50 border-cyan-500/30">
                <CardHeader className="border-b border-cyan-500/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {getTruncatedAddress(currentWallet.address)}
                      </h2>
                      <p className="text-xs text-gray-400 mt-1">
                        Created: {new Date(currentWallet.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {/* Balance */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-400">Balance</div>
                      <Button
                        onClick={() => fetchBalance(currentWallet.address)}
                        variant="ghost"
                        size="sm"
                        disabled={isFetchingBalance}
                      >
                        <RefreshCw className={`w-4 h-4 ${isFetchingBalance ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                    <div className="text-3xl font-bold text-white font-mono">
                      {isFetchingBalance ? (
                        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin inline" />
                      ) : balance?.balanceKAS !== null && balance?.balanceKAS !== undefined ? (
                        <>{balance.balanceKAS.toFixed(8)} KAS</>
                      ) : (
                        '0.00000000 KAS'
                      )}
                    </div>
                  </div>

                  {/* Address */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-2">Wallet Address</div>
                    <div className="flex items-center gap-2">
                      <code className="text-cyan-400 text-xs break-all flex-1 font-mono">
                        {currentWallet.address}
                      </code>
                      <Button onClick={copyAddress} size="sm" variant="ghost">
                        {copiedAddress ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Wallet Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-1">Word Count</div>
                      <div className="text-lg font-semibold text-white">
                        {currentWallet.wordCount} words
                      </div>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-1">Type</div>
                      <div className="text-lg font-semibold text-white">ZK Wallet</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Seed Phrase Card */}
              {currentWallet.encryptedSeed && (
                <Card className="bg-black/50 border-purple-500/30">
                  <CardHeader className="border-b border-purple-500/30">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-semibold">Seed Phrase</h3>
                      <Button
                        onClick={() => toggleShowSeed(currentWallet.address)}
                        size="sm"
                        variant="ghost"
                        className="text-purple-400"
                      >
                        {showSeed[currentWallet.address] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {showSeed[currentWallet.address] ? (
                      <>
                        <div className="bg-black border border-purple-500/30 rounded-lg p-4 mb-4">
                          <code className="text-white text-sm font-mono break-all">
                            {atob(currentWallet.encryptedSeed)}
                          </code>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                          <p className="text-xs text-red-300">
                            ⚠️ Keep this safe. Never share your seed phrase with anyone.
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <EyeOff className="w-12 h-12 text-gray-700 mx-auto mb-2" />
                        <p className="text-gray-600">Tap eye to reveal seed phrase</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => {
                    setCurrentWallet(null);
                    setBalance(null);
                    setMode('list');
                  }}
                  variant="outline"
                  className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Switch Wallet
                </Button>
                <Button
                  onClick={handleCreateViaIframe}
                  disabled={!iframeReady || isProcessing}
                  variant="outline"
                  className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Another
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
