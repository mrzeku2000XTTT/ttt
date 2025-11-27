import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Copy, Eye, EyeOff, Loader2, CheckCircle2, Lock, ArrowLeft, Shield, RefreshCw, X, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

const REPLIT_BASE_URL = 'https://3997eddf-54b0-4dd7-bd11-b6322df14705-00-2nohbenfxyfz4.spock.replit.dev';

const Toast = ({ message, type, onClose }) => {
  const bgColor = type === 'success' ? 'bg-black/95' : 'bg-black/95';
  const borderColor = type === 'success' ? 'border-green-500/30' : 'border-red-500/30';
  const icon = type === 'success' ? '✅' : '❌';
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      className="fixed bottom-6 right-6 z-[9999] max-w-xs"
    >
      <div className={`${bgColor} backdrop-blur-xl border ${borderColor} rounded-lg p-3 shadow-2xl`}>
        <div className="flex items-start gap-2">
          <span className="text-lg flex-shrink-0">{icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs leading-relaxed">
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const ConfirmModal = ({ title, message, onConfirm, onCancel }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-black border border-red-500/30 rounded-xl p-6 max-w-md w-full shadow-2xl"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg mb-1">{title}</h3>
            <p className="text-gray-400 text-sm">{message}</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={onCancel}
            className="flex-1 bg-white/5 border border-white/10 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white"
          >
            Clear Wallet
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function WalletPage() {
  const navigate = useNavigate();
  const iframeRef = useRef(null);
  
  const [mode, setMode] = useState('create');
  const [wordCount, setWordCount] = useState(12);
  const [importMnemonic, setImportMnemonic] = useState('');
  const [mnemonic, setMnemonic] = useState(null);
  const [address, setAddress] = useState(null);
  const [kaspaBalance, setKaspaBalance] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedPhrase, setCopiedPhrase] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); // This state will eventually be removed/replaced by toast
  const [user, setUser] = useState(null);
  const [kasPrice, setKasPrice] = useState(null);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [pinSet, setPinSet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeReady, setIframeReady] = useState(false);
  const [isSealing, setIsSealing] = useState(false);
  const [isSealed, setIsSealed] = useState(false);
  const [isFetchingBalance, setIsFetchingBalance] = useState(false);
  const [needsIframe, setNeedsIframe] = useState(false);
  const [toast, setToast] = useState(null); // New toast state
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const showToast = (message, type = 'success', duration = 3000) => {
    setToast({ message, type });
    if (duration > 0) {
      setTimeout(() => setToast(null), duration);
    }
  };

  const loadData = async () => {
    try {
      // Try to get user, but don't require login
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        if (currentUser.created_wallet_address) {
          setAddress(currentUser.created_wallet_address);
          setPinSet(!!currentUser.wallet_pin_hash);
          checkIfSealed(currentUser.created_wallet_address, currentUser);
        }
      } catch (err) {
        // User not logged in - check for local wallet
        const localWallet = localStorage.getItem('ttt_wallet_address');
        if (localWallet) {
          setAddress(localWallet);
          setUser({ created_wallet_address: localWallet });
        }
      }
      
      try {
        const priceRes = await base44.functions.invoke('getKaspaPrice');
        setKasPrice(priceRes.data?.price || 0.05);
      } catch (err) {
        setKasPrice(0.05);
      }
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfSealed = async (walletAddress, currentUser) => {
    if (!currentUser?.email) {
      setIsSealed(false);
      return;
    }
    
    try {
      const sealed = await base44.entities.SealedWallet.filter({
        wallet_address: walletAddress,
        is_active: true,
        created_by: currentUser.email
      });
      setIsSealed(sealed.length > 0);
    } catch (err) {
      setIsSealed(false);
    }
  };

  const fetchBalanceDirectly = async (addr) => {
    if (!addr) return;

    console.log('💰 Fetching balance');
    setIsFetchingBalance(true);

    try {
      const response = await fetch(`${REPLIT_BASE_URL}/balance/${encodeURIComponent(addr)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      if (data.success && data.balanceKAS !== undefined) {
        setKaspaBalance({ balanceKAS: Number(data.balanceKAS) });
        setShowBalance(true);
      } else {
        setKaspaBalance({ balanceKAS: 0 });
        setShowBalance(true);
      }
    } catch (err) {
      console.error('Balance fetch failed:', err);
      setKaspaBalance({ balanceKAS: 0 });
      setShowBalance(true);
    } finally {
      setIsFetchingBalance(false);
    }
  };

  const toggleBalanceVisibility = () => {
    if (!showBalance && kaspaBalance === null) {
      fetchBalanceDirectly(address);
    } else {
      setShowBalance(!showBalance);
    }
  };

  const handleWalletCreated = async (wallet) => {
    console.log('✅ Wallet created');
    setMnemonic(wallet.mnemonic);
    setAddress(wallet.address);
    setShowMnemonic(true);
    
    const wc = wallet.mnemonic.split(' ').filter(w => w).length;
    await saveWallet(wallet.address, wc);
    await fetchBalanceDirectly(wallet.address);
    
    setShowPinSetup(true);
    showToast('Wallet and profile created!', 'success'); // Replaced setSuccess
    setIsCreating(false);
  };

  const handleWalletImported = async (wallet) => {
    console.log('✅ Wallet imported');
    setMnemonic(wallet.mnemonic);
    setAddress(wallet.address);
    setShowMnemonic(true);
    
    await saveWallet(wallet.address, wallet.wordCount);
    await fetchBalanceDirectly(wallet.address);
    
    setShowPinSetup(true);
    showToast('Wallet and profile imported!', 'success'); // Replaced setSuccess
    setIsImporting(false);
    setImportMnemonic('');
  };

  const saveWallet = async (addr, wc) => {
    try {
      // Save to localStorage for non-logged-in users
      localStorage.setItem('ttt_wallet_address', addr);
      
      // Try to save to user profile if logged in
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser) {
          console.log('Wallet saved locally only');
          return;
        }
      
      console.log('💾 [Wallet] Saving wallet for:', currentUser.email);
      
      const existingWallets = currentUser.created_wallets || [];
      const walletExists = existingWallets.some(w => w.address === addr);
      
      const updates = { created_wallet_address: addr };
      
      if (!walletExists) {
        updates.created_wallets = [...existingWallets, { 
          address: addr, 
          wordCount: wc,
          createdAt: new Date().toISOString(),
          balance: 0,
          userId: currentUser.email
        }];
      }
      
      await base44.auth.updateMe(updates);
      setUser({ ...currentUser, ...updates });
      console.log('✅ [Wallet] User data updated successfully');

      // Only create profile if user is logged in
      if (currentUser.email) {
        const zkId = addr.slice(-10).toUpperCase();
        const agentZKId = `ZK-${zkId}`;
        const truncatedUsername = `Agent-${addr.substring(0, 10)}`;
        
        console.log('🤖 [Wallet] Checking Agent ZK Profile...');
        
        try {
          const existingProfiles = await base44.entities.AgentZKProfile.filter({
            wallet_address: addr
          });

          const profileData = {
            user_email: currentUser.email,
            wallet_address: addr,
            ttt_wallet_address: addr,
            agent_zk_id: agentZKId,
            username: truncatedUsername,
            bio: 'TTT Wallet User - Kaspa Network',
            role: 'Other',
            skills: ['Kaspa', 'Web3', 'TTT Wallet'],
            agent_zk_photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(truncatedUsername)}&size=400&background=0ea5e9&color=fff&bold=true`,
            is_public: true,
            is_hireable: true,
            availability: 'available',
            verification_count: 0,
            last_active: new Date().toISOString(),
            social_links: {},
            portfolio: [],
            work_type: ['worker']
          };

          if (existingProfiles.length > 0) {
            await base44.entities.AgentZKProfile.update(existingProfiles[0].id, {
              user_email: currentUser.email,
              ttt_wallet_address: addr,
              last_active: new Date().toISOString()
            });
            console.log(`✅ [Wallet] Profile updated`);
          } else {
            await base44.entities.AgentZKProfile.create(profileData);
            console.log(`✅ [Wallet] Profile created`);
          }

        } catch (err) {
          console.error(`❌ [Wallet] Profile error:`, err);
        }
      }

      } catch (authErr) {
        console.log('User not logged in, wallet saved locally only');
      }

    } catch (err) {
      console.error('💥 [Wallet] Save Error:', err);
      setError('Failed to save wallet');
    }
  };

  const handleCreateWallet = () => {
    setNeedsIframe(true);
    setIsCreating(true);
    setError(null);
    
    if (iframeReady && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ 
        type: 'createWallet', 
        wordCount: wordCount,
        userId: user?.email || 'anonymous_' + Date.now()
      }, '*');
    }
  };

  const handleImportWallet = () => {
    if (!importMnemonic.trim()) {
      setError('Enter seed phrase');
      return;
    }

    const words = importMnemonic.trim().toLowerCase().split(/\s+/).filter(w => w);
    
    if (words.length !== 12 && words.length !== 24) {
      setError('Must be 12 or 24 words');
      return;
    }

    setNeedsIframe(true);
    setIsImporting(true);
    setError(null);
    
    if (iframeReady && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ 
        type: 'importWallet', 
        mnemonic: words.join(' '),
        userId: user?.email || 'anonymous_' + Date.now()
      }, '*');
    }
  };

  const handleSetPin = async () => {
    if (pin.length !== 6 || pin !== confirmPin) {
      setError('PINs must match');
      return;
    }

    setIsSettingPin(true);
    setError(null);

    try {
      const res = await base44.functions.invoke('hashPin', { pin });
      if (res.data?.success) {
        await base44.auth.updateMe({ wallet_pin_hash: res.data.hash });
        setPinSet(true);
        setShowPinSetup(false);
        setUser({ ...user, wallet_pin_hash: res.data.hash });
        showToast('PIN set successfully!', 'success'); // Replaced setSuccess
        setPin('');
        setConfirmPin('');
      }
    } catch (err) {
      setError('Failed to set PIN');
    } finally {
      setIsSettingPin(false);
    }
  };

  const handleSealWallet = async () => {
    if (!address || !mnemonic || !pinSet || !user) {
      setError('Missing requirements');
      return;
    }

    setIsSealing(true);
    setError(null);

    try {
      const message = `I am sealing my TTT Wallet.\n\nAddress: ${address}\nBalance: ${kaspaBalance?.balanceKAS || 0} KAS\nTimestamp: ${Date.now()}\nWord Count: ${wordCount} words\n\nThis is my TTT Wallet Seal.`;

      const encoder = new TextEncoder();
      const data = encoder.encode(message + mnemonic);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      await base44.entities.SealedWallet.create({
        wallet_address: address,
        seal_signature: signature,
        seal_message: message,
        sealed_date: new Date().toISOString(),
        balance_at_seal: kaspaBalance?.balanceKAS || 0,
        mnemonic_word_count: wordCount,
        is_active: true
      });

      setIsSealed(true);
      showToast('Wallet sealed successfully!', 'success'); // Replaced setSuccess
    } catch (err) {
      setError('Seal failed');
    } finally {
      setIsSealing(false);
    }
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (err) {
      console.error('Copy failed');
    }
  };

  const copyPhrase = async () => {
    try {
      await navigator.clipboard.writeText(mnemonic);
      setCopiedPhrase(true);
      setTimeout(() => setCopiedPhrase(false), 2000);
    } catch (err) {
      console.error('Copy failed');
    }
  };

  const clearWallet = async () => {
    try {
      // Try to clear from user profile if logged in
      try {
        await base44.auth.updateMe({ 
          created_wallet_address: null, 
          wallet_pin_hash: null 
        });
      } catch (err) {
        // User not logged in, skip profile update
      }
      
      // Clear localStorage regardless of login status
      localStorage.removeItem('ttt_wallet_address');
      localStorage.removeItem('vibe_address');
      localStorage.removeItem('vibe_connection_id');
      localStorage.removeItem('vibe_connection_code');
      
      // Reset state
      setAddress(null);
      setMnemonic(null);
      setIsSealed(false);
      setPinSet(false);
      setKaspaBalance(null);
      setShowBalance(false);
      setShowClearConfirm(false);
      showToast('Wallet cleared', 'success');
    } catch (err) {
      setError('Clear failed');
      setShowClearConfirm(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      if (!event.data?.type) return;
      if (event.data.userId && event.data.userId.includes('_zk')) return;

      if (event.data.type === 'kaspaPOSReady') {
        console.log('✅ Iframe ready');
        setIframeReady(true);
        
        if (isCreating && iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage({ 
            type: 'createWallet', 
            wordCount: wordCount,
            userId: user?.email
          }, '*');
        } else if (isImporting && iframeRef.current?.contentWindow) {
          const words = importMnemonic.trim().toLowerCase().split(/\s+/).filter(w => w);
          iframeRef.current.contentWindow.postMessage({ 
            type: 'importWallet', 
            mnemonic: words.join(' '),
            userId: user?.email
          }, '*');
        }
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
  }, [importMnemonic, isCreating, isImporting, wordCount, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-black p-4">
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showClearConfirm && (
          <ConfirmModal
            title="Clear Wallet?"
            message="⚠️ Make sure you've backed up your seed phrase! This action cannot be undone."
            onConfirm={clearWallet}
            onCancel={() => setShowClearConfirm(false)}
          />
        )}
      </AnimatePresence>

      {needsIframe && (
        <iframe 
          ref={iframeRef} 
          src={REPLIT_BASE_URL} 
          style={{ display: 'none' }}
          title="Wallet"
        />
      )}

      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">TTT WALLET</h1>
            <p className="text-gray-400 text-sm">{user?.username || user?.email || 'Anonymous User'}</p>
          </div>
          {address && (
            <Button onClick={() => setShowClearConfirm(true)} variant="outline" className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <span className="text-sm text-red-300">{error}</span>
          </div>
        )}

        {!address ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={() => setMode('create')} 
                className={mode === 'create' ? 'bg-white text-black' : 'bg-zinc-900 text-gray-400 border border-zinc-800'}
              >
                Create New
              </Button>
              <Button 
                onClick={() => setMode('import')} 
                className={mode === 'import' ? 'bg-white text-black' : 'bg-zinc-900 text-gray-400 border border-zinc-800'}
              >
                Import Existing
              </Button>
            </div>

            {mode === 'create' && (
              <>
                <Card className="bg-zinc-950 border-zinc-800">
                  <CardContent className="p-6">
                    <label className="text-sm text-gray-400 mb-2 block">Seed Phrase Length</label>
                    <Select value={wordCount.toString()} onValueChange={(v) => setWordCount(parseInt(v))}>
                      <SelectTrigger className="bg-black border-zinc-800 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        <SelectItem value="12">12 words</SelectItem>
                        <SelectItem value="24">24 words</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
                <Button 
                  onClick={handleCreateWallet} 
                  disabled={isCreating} 
                  className="w-full bg-white text-black hover:bg-gray-200 h-12"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Wallet'
                  )}
                </Button>
              </>
            )}

            {mode === 'import' && (
              <>
                <Textarea 
                  value={importMnemonic} 
                  onChange={(e) => setImportMnemonic(e.target.value)} 
                  placeholder="Enter seed phrase (12 or 24 words)..."
                  className="bg-zinc-950 border-zinc-800 text-white font-mono min-h-[120px]"
                  rows={4}
                />
                <Button 
                  onClick={handleImportWallet} 
                  disabled={isImporting || !importMnemonic.trim()} 
                  className="w-full bg-white text-black hover:bg-gray-200 h-12"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    'Import Wallet'
                  )}
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Card className="bg-zinc-950 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-500">Balance</div>
                  <button 
                    onClick={toggleBalanceVisibility}
                    disabled={isFetchingBalance}
                    className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                    title={showBalance ? "Hide balance" : "Show balance"}
                  >
                    {isFetchingBalance ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : showBalance ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>

                <div className="text-4xl font-bold text-white mb-2">
                  {showBalance && kaspaBalance?.balanceKAS !== null && kaspaBalance?.balanceKAS !== undefined ? (
                    <>{kaspaBalance.balanceKAS.toFixed(8)} KAS</>
                  ) : (
                    <span className="text-gray-700">••••••••</span>
                  )}
                </div>
                {showBalance && kasPrice && kaspaBalance && (
                  <div className="text-xl text-gray-500 mb-4">
                    ≈ ${((kaspaBalance?.balanceKAS || 0) * kasPrice).toFixed(2)} USD
                  </div>
                )}
                
                <div className="bg-black border border-zinc-800 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-cyan-400 text-sm break-all flex-1">{address}</code>
                    <Button onClick={copyAddress} size="sm" variant="ghost" className="shrink-0">
                      {copiedAddress ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Button 
                    onClick={() => navigate(createPageUrl("Receive"))} 
                    className="bg-zinc-950 border border-zinc-800 text-white hover:bg-zinc-900"
                  >
                    Receive
                  </Button>
                  <Button 
                    onClick={() => navigate(createPageUrl("Bridge"))} 
                    className="bg-white text-black hover:bg-gray-200"
                  >
                    Send
                  </Button>
                </div>

                {pinSet && !isSealed && mnemonic && (
                  <Button 
                    onClick={handleSealWallet} 
                    disabled={isSealing} 
                    className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
                  >
                    {isSealing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Sealing...
                      </>
                    ) : (
                      <>
                        <Shield className="w-5 h-5 mr-2" />
                        Seal Wallet
                      </>
                    )}
                  </Button>
                )}

                {isSealed && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-400" />
                      <div>
                        <div className="text-sm font-semibold text-green-300">✅ Sealed!</div>
                        <div className="text-xs text-green-400 mt-1">Stamped</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {showPinSetup && !pinSet && (
              <Card className="bg-yellow-500/10 border-yellow-500/30">
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-white font-bold">Set PIN</h3>
                  <Input 
                    type="password" 
                    inputMode="numeric"
                    maxLength={6} 
                    value={pin} 
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} 
                    placeholder="6 digits" 
                    className="bg-black border-zinc-800 text-white text-center text-lg"
                  />
                  <Input 
                    type="password" 
                    inputMode="numeric"
                    maxLength={6} 
                    value={confirmPin} 
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))} 
                    placeholder="Confirm" 
                    className="bg-black border-zinc-800 text-white text-center text-lg"
                  />
                  <Button 
                    onClick={handleSetPin} 
                    disabled={isSettingPin || pin.length !== 6 || pin !== confirmPin} 
                    className="w-full bg-yellow-500 text-black hover:bg-yellow-600"
                  >
                    {isSettingPin ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Setting...
                      </>
                    ) : (
                      'Set PIN'
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {mnemonic && (
              <Card className="bg-zinc-950 border-zinc-800">
                <CardHeader className="border-b border-zinc-800">
                  <div className="flex justify-between items-center">
                    <h3 className="text-white font-bold">Seed Phrase</h3>
                    <div className="flex gap-2">
                      {showMnemonic && (
                        <Button onClick={copyPhrase} size="sm" variant="ghost">
                          {copiedPhrase ? (
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                      <Button onClick={() => setShowMnemonic(!showMnemonic)} size="sm" variant="ghost">
                        {showMnemonic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {showMnemonic ? (
                    <>
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {mnemonic.split(' ').filter(w => w).map((word, i) => (
                          <div key={i} className="bg-black border border-zinc-800 rounded px-2 py-1 text-white text-sm font-mono">
                            {i + 1}. {word}
                          </div>
                        ))}
                      </div>
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                        <p className="text-xs text-red-300">
                          ⚠️ Save securely. Never share.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <EyeOff className="w-12 h-12 text-gray-700 mx-auto mb-2" />
                      <p className="text-gray-600">Tap eye to reveal</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}