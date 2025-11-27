
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { X, Loader2, CheckCircle2, AlertCircle, Copy, Eye, EyeOff, Wallet, Plus, Upload, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";

const REPLIT_ZK_BASE = 'https://tttxxx.live';

export default function ZKWalletModal({ isOpen, onClose, onWalletCreated }) {
  const iframeRef = useRef(null);
  const [mode, setMode] = useState('list'); // list, create, import, iframe
  const [wordCount, setWordCount] = useState(24);
  const [importMnemonic, setImportMnemonic] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [user, setUser] = useState(null);
  const [showSeed, setShowSeed] = useState({});
  const [iframeReady, setIframeReady] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadWallets();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== REPLIT_ZK_BASE) return;
      if (!event.data?.type) return;
      
      if (event.data.userId && !event.data.userId.includes('_zk')) {
        return;
      }

      console.log('📨 ZK Wallet iframe message:', event.data);

      if (event.data.type === 'kaspaPOSReady') {
        setIframeReady(true);
      } else if (event.data.type === 'walletCreated' && event.data.wallet) {
        handleWalletCreated(event.data.wallet);
      } else if (event.data.type === 'walletImported' && event.data.address) {
        handleWalletImported({
          address: event.data.address,
          mnemonic: importMnemonic,
          wordCount: importMnemonic.trim().split(/\s+/).filter(w => w).length
        });
      } else if (event.data.type === 'balanceResponse') {
        console.log('💰 Balance response:', event.data);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [importMnemonic]);

  const loadWallets = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setWallets(currentUser.agent_zk_wallets || []);
    } catch (err) {
      console.error('Failed to load wallets:', err);
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
      setSuccess('✅ ZK Wallet created successfully!');
      setMode('list');

      if (onWalletCreated) {
        onWalletCreated(newWallet);
      }
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
      setSuccess('✅ ZK Wallet imported successfully!');
      setMode('list');
      setImportMnemonic('');

      if (onWalletCreated) {
        onWalletCreated(newWallet);
      }
    } catch (err) {
      console.error('Failed to save wallet:', err);
      setError('Failed to save wallet');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateViaIframe = () => {
    setMode('iframe');
    setError(null);
    setSuccess(null);
    
    setTimeout(() => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'createWallet',
          wordCount: wordCount,
          userId: 'zk_' + (user?.email || 'user')
        }, '*');
      }
    }, 1000);
  };

  const handleImportViaIframe = () => {
    if (!importMnemonic.trim()) {
      setError('Please enter seed phrase');
      return;
    }

    const words = importMnemonic.trim().toLowerCase().split(/\s+/).filter(w => w);
    if (words.length !== 12 && words.length !== 24) {
      setError('Seed phrase must be 12 or 24 words');
      return;
    }

    setMode('iframe');
    setError(null);
    setSuccess(null);
    
    setTimeout(() => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'importWallet',
          mnemonic: words.join(' '),
          userId: 'zk_' + (user?.email || 'user')
        }, '*');
      }
    }, 1000);
  };

  const toggleShowSeed = (address) => {
    setShowSeed(prev => ({ ...prev, [address]: !prev[address] }));
  };

  const copyAddress = async (address) => {
    try {
      await navigator.clipboard.writeText(address);
      setSuccess('✅ Address copied!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError('Failed to copy');
    }
  };

  const deleteWallet = async (address) => {
    if (!confirm('⚠️ Delete this wallet? This cannot be undone.')) return;

    try {
      const currentUser = await base44.auth.me();
      const updatedWallets = (currentUser.agent_zk_wallets || []).filter(
        w => w.address !== address
      );

      await base44.auth.updateMe({
        agent_zk_wallets: updatedWallets
      });

      setWallets(updatedWallets);
      setSuccess('Wallet deleted');
    } catch (err) {
      setError('Failed to delete wallet');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-black border border-cyan-500/30 rounded-2xl relative"
          style={{
            backgroundImage: 'url(https://i.imgur.com/O35kqPE.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* Overlay for readability */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl rounded-2xl" />

          <div className="relative z-10">
            {/* Header */}
            <div className="sticky top-0 bg-black/50 backdrop-blur-xl border-b border-cyan-500/30 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/50">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">ZK Wallet</h2>
                    <p className="text-sm text-cyan-400">Agent ZK Wallet System</p>
                  </div>
                </div>
                <Button onClick={onClose} variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10">
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Mode Selector */}
              {mode === 'list' && (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => setMode('create')}
                    className="h-20 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-white"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create New Wallet
                  </Button>
                  <Button
                    onClick={() => setMode('import')}
                    className="h-20 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-white"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Import Wallet
                  </Button>
                </div>
              )}

              {/* Messages */}
              {success && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-green-300">{success}</span>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-sm text-red-300">{error}</span>
                </div>
              )}

              {/* Create Mode */}
              {mode === 'create' && (
                <div className="space-y-4">
                  <Button
                    onClick={() => setMode('list')}
                    variant="ghost"
                    className="text-cyan-400 hover:text-cyan-300"
                  >
                    ← Back
                  </Button>

                  <Card className="bg-black/50 border-cyan-500/30">
                    <CardContent className="p-6 space-y-4">
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Seed Phrase Length</label>
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            onClick={() => setWordCount(12)}
                            className={wordCount === 12 ? 'bg-cyan-500 text-white' : 'bg-white/5 text-gray-400 border border-white/10'}
                          >
                            12 Words
                          </Button>
                          <Button
                            onClick={() => setWordCount(24)}
                            className={wordCount === 24 ? 'bg-cyan-500 text-white' : 'bg-white/5 text-gray-400 border border-white/10'}
                          >
                            24 Words
                          </Button>
                        </div>
                      </div>

                      <Button
                        onClick={handleCreateViaIframe}
                        disabled={isProcessing}
                        className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Creating Wallet...
                          </>
                        ) : (
                          'Create ZK Wallet'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Import Mode */}
              {mode === 'import' && (
                <div className="space-y-4">
                  <Button
                    onClick={() => setMode('list')}
                    variant="ghost"
                    className="text-cyan-400 hover:text-cyan-300"
                  >
                    ← Back
                  </Button>

                  <Card className="bg-black/50 border-cyan-500/30">
                    <CardContent className="p-6 space-y-4">
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Seed Phrase (12 or 24 words)</label>
                        <Textarea
                          value={importMnemonic}
                          onChange={(e) => setImportMnemonic(e.target.value)}
                          placeholder="Enter your seed phrase..."
                          className="bg-black/50 border-cyan-500/30 text-white font-mono min-h-[120px]"
                          rows={4}
                        />
                      </div>

                      <Button
                        onClick={handleImportViaIframe}
                        disabled={isProcessing || !importMnemonic.trim()}
                        className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Importing Wallet...
                          </>
                        ) : (
                          'Import ZK Wallet'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Iframe Mode */}
              {mode === 'iframe' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Button
                      onClick={() => setMode('list')}
                      variant="ghost"
                      className="text-cyan-400 hover:text-cyan-300"
                    >
                      ← Back
                    </Button>
                    {!iframeReady && (
                      <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Loading...
                      </Badge>
                    )}
                  </div>

                  <div className="bg-black/50 border border-cyan-500/30 rounded-xl overflow-hidden" style={{ height: '600px' }}>
                    <iframe
                      ref={iframeRef}
                      src={REPLIT_ZK_BASE}
                      className="w-full h-full"
                      title="ZK Wallet Creator"
                    />
                  </div>
                </div>
              )}

              {/* Wallet List */}
              {mode === 'list' && wallets.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white">Your ZK Wallets</h3>
                  {wallets.map((wallet, idx) => (
                    <Card key={idx} className="bg-black/50 border-cyan-500/30">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                            {wallet.wordCount} words
                          </Badge>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => copyAddress(wallet.address)}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-cyan-400 hover:text-cyan-300"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => toggleShowSeed(wallet.address)}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-cyan-400 hover:text-cyan-300"
                            >
                              {showSeed[wallet.address] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            <Button
                              onClick={() => deleteWallet(wallet.address)}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <code className="text-xs text-cyan-400 font-mono block break-all">
                          {wallet.address}
                        </code>

                        {showSeed[wallet.address] && wallet.encryptedSeed && (
                          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <p className="text-xs text-red-400 mb-2">⚠️ Keep this safe. Never share.</p>
                            <code className="text-xs text-white font-mono block break-all">
                              {atob(wallet.encryptedSeed)}
                            </code>
                          </div>
                        )}

                        <div className="mt-3 text-xs text-gray-500">
                          Created: {new Date(wallet.createdAt).toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {mode === 'list' && wallets.length === 0 && (
                <div className="text-center py-12">
                  <Wallet className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-2">No ZK wallets yet</p>
                  <p className="text-sm text-gray-600">Create or import a wallet to get started</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
