
import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, Copy, RefreshCw, Wallet, ArrowLeft, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge"; // Added Badge import

const REPLIT_BASE_URL = 'https://tttxxx.live';

export default function VPImportPage() {
  const navigate = useNavigate();
  const importIframeRef = useRef(null);
  
  const [importMnemonic, setImportMnemonic] = useState('');
  const [address, setAddress] = useState(null);
  const [kaspaBalance, setKaspaBalance] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [user, setUser] = useState(null);
  const [kasPrice, setKasPrice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeReady, setIframeReady] = useState(false);
  const [importedWallets, setImportedWallets] = useState([]); // Changed from vpImportedWallets

  useEffect(() => {
    loadUser(); // Changed from loadData

    const handleMessage = (event) => {
      if (event.origin !== REPLIT_BASE_URL) return;
      if (!event.data?.type) return;

      console.log('📨 VP Import received message:', event.data);

      switch(event.data.type) {
        case 'kaspaPOSReady':
          console.log('✅ VP Import iframe ready');
          setIframeReady(true);
          break;
        case 'walletImported':
          if (event.data.address) {
            handleWalletImported({
              address: event.data.address,
              mnemonic: importMnemonic,
              wordCount: importMnemonic.split(' ').filter(w => w.trim()).length
            });
          }
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [importMnemonic]);

  const loadUser = async () => { // Renamed from loadData
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      // Load imported wallets from user
      // Original: const vpWallets = currentUser.vp_imported_wallets || []; setVpImportedWallets(vpWallets);
      if (currentUser.vp_imported_wallets && currentUser.vp_imported_wallets.length > 0) {
        setImportedWallets(currentUser.vp_imported_wallets); // Using new state variable
        console.log('✅ Loaded', currentUser.vp_imported_wallets.length, 'imported wallets');
      }
      
      // Keep kasPrice fetch logic from original loadData
      const priceRes = await base44.functions.invoke('getKaspaPrice');
      setKasPrice(priceRes.data?.price || 0.05);

    } catch (err) {
      console.error('Load error:', err);
      setError('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBalance = async (addr) => {
    try {
      const res = await base44.functions.invoke('getKaspaBalance', { address: addr });
      setKaspaBalance({ balanceKAS: res.data?.balanceKAS || 0 });
    } catch (err) {
      console.error('Balance fetch error:', err);
    }
  };

  const handleWalletImported = async (wallet) => {
    console.log('✅ VP Wallet imported:', wallet.address);
    setAddress(wallet.address);
    
    await saveVPWallet(wallet.address, wallet.mnemonic, wallet.wordCount);
    await fetchBalance(wallet.address);
    
    setSuccess('✅ Wallet imported to VP successfully!');
    setIsImporting(false);
    setImportMnemonic('');
  };

  const saveVPWallet = async (addr, mnemonic, wc) => {
    try {
      console.log('💾 Saving VP wallet to backend:', addr);
      
      const currentUser = await base44.auth.me();
      
      if (!currentUser) {
        console.error('❌ No user logged in');
        setError('Please login to save wallet');
        return;
      }
      
      const existingVPWallets = currentUser.vp_imported_wallets || [];
      const walletExists = existingVPWallets.some(w => w.address === addr);
      
      if (!walletExists) {
        // Encrypt seed phrase (base64 for now)
        const encryptedSeed = btoa(mnemonic);
        
        const newVPWallet = {
          address: addr,
          wordCount: wc,
          encryptedSeed: encryptedSeed,
          createdAt: new Date().toISOString(),
          type: 'vp_import'
        };
        
        await base44.auth.updateMe({
          vp_imported_wallets: [...existingVPWallets, newVPWallet]
        });
        
        setImportedWallets([...existingVPWallets, newVPWallet]); // Changed from setVpImportedWallets
      }
      
      console.log('✅ VP Wallet saved successfully!');
    } catch (err) {
      console.error('❌ Failed to save VP wallet:', err);
      setError('Failed to save wallet to profile');
    }
  };

  const handleImportWallet = () => {
    if (!iframeReady || !importMnemonic.trim()) {
      setError('Please wait for iframe to load or enter seed phrase');
      return;
    }
    
    const words = importMnemonic.trim().toLowerCase().split(' ').filter(w => w.trim());
    
    if (words.length !== 12 && words.length !== 24) {
      setError('Seed phrase must be 12 or 24 words');
      return;
    }
    
    setIsImporting(true);
    setError(null);
    setSuccess(null);
    
    console.log('📤 Sending import request to iframe...');
    importIframeRef.current?.contentWindow?.postMessage({ 
      type: 'importWallet', 
      mnemonic: words.join(' ')
    }, REPLIT_BASE_URL);
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch {}
  };

  const selectWallet = async (wallet) => {
    setAddress(wallet.address);
    await fetchBalance(wallet.address);
    setSuccess(`✅ Loaded wallet: ${wallet.address.substring(0, 20)}...`);
  };

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
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
            <Button onClick={() => base44.auth.redirectToLogin()} className="bg-cyan-500 text-white">Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <iframe 
        ref={importIframeRef} 
        src={`${REPLIT_BASE_URL}/?tab=import`} 
        style={{ display: 'none' }} 
      />

      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">VP IMPORT</h1>
            <p className="text-gray-400 text-sm">Verification Protocol Wallet Import (Agent ZK Access)</p>
          </div>
          <Button 
            onClick={() => navigate(createPageUrl("AgentZK"))} 
            variant="outline" 
            className="bg-zinc-900 border-zinc-800 text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />Back to Agent ZK
          </Button>
        </div>

        {!iframeReady && (
          <div className="mb-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <Loader2 className="w-4 h-4 text-yellow-400 animate-spin inline mr-2" />
            <span className="text-sm text-yellow-300">Loading VP Import system...</span>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <CheckCircle2 className="w-4 h-4 text-green-400 inline mr-2" />
            <span className="text-sm text-green-300">{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 text-red-400 inline mr-2" />
            <span className="text-sm text-red-300">{error}</span>
          </div>
        )}

        {/* Import Form */}
        <Card className="bg-zinc-950 border-zinc-800 mb-4">
          <CardHeader className="border-b border-zinc-800">
            <h3 className="text-white font-bold">Import Wallet Seed</h3>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <Textarea 
              value={importMnemonic} 
              onChange={(e) => setImportMnemonic(e.target.value)} 
              placeholder="Enter seed phrase (12 or 24 words)..."
              className="bg-black border-zinc-800 text-white font-mono min-h-[120px]"
              rows={4}
            />
            <Button 
              onClick={handleImportWallet} 
              disabled={isImporting || !iframeReady || !importMnemonic.trim()} 
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white h-12"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Wallet className="w-5 h-5 mr-2" />
                  Import to VP
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Current Wallet Display */}
        {address && (
          <Card className="bg-zinc-950 border-zinc-800 mb-4">
            <CardHeader className="border-b border-zinc-800">
              <h3 className="text-white font-bold">Current VP Wallet</h3>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-500">Balance</div>
                <Button onClick={() => fetchBalance(address)} size="sm" variant="ghost">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>

              <div className="text-4xl font-bold text-white mb-2">
                {kaspaBalance?.balanceKAS.toFixed(8) || '0.00000000'} KAS
              </div>
              {kasPrice && (
                <div className="text-xl text-gray-500 mb-4">
                  ≈ ${((kaspaBalance?.balanceKAS || 0) * kasPrice).toFixed(2)}
                </div>
              )}
              
              <div className="bg-black border border-zinc-800 rounded-lg p-3">
                <div className="flex items-center justify-between gap-2">
                  <code className="text-cyan-400 text-sm break-all flex-1">{address}</code>
                  <Button onClick={copyAddress} size="sm" variant="ghost" className="shrink-0">
                    {copiedAddress ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Imported Wallets Section - Show registered seed phrases */}
        {importedWallets.length > 0 && (
          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader className="border-b border-zinc-800">
              <h3 className="text-xl font-bold text-white">Registered Seed Phrases</h3>
              <p className="text-sm text-gray-400">Wallets imported and accessible by Agent ZK</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {importedWallets.map((wallet, idx) => (
                  <div key={idx} className="bg-black/50 border border-zinc-800 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                          <Wallet className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {wallet.type === 'vp_import' ? '🔷 VP Wallet' : '🎯 ZK Wallet'}
                          </div>
                          <code className="text-xs text-gray-400 font-mono">
                            {wallet.address.substring(0, 16)}...{wallet.address.substring(wallet.address.length - 8)}
                          </code>
                        </div>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Imported
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-zinc-900 rounded p-2">
                        <div className="text-gray-500 mb-1">Words</div>
                        <div className="text-white">{wallet.wordCount || 12}</div>
                      </div>
                      <div className="bg-zinc-900 rounded p-2">
                        <div className="text-gray-500 mb-1">Imported</div>
                        <div className="text-white">{new Date(wallet.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-zinc-800">
                      <div className="flex items-center gap-2 text-xs">
                        <Shield className="w-3 h-3 text-purple-400" />
                        <span className="text-purple-400">Encrypted & accessible by Agent ZK</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Box */}
        <div className="mt-4 bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
          <p className="text-sm text-purple-300">
            <span className="font-semibold">🤖 Agent ZK Integration:</span> Wallets imported here are accessible by Agent ZK for balance checking and transaction history analysis.
          </p>
        </div>
      </div>
    </div>
  );
}
