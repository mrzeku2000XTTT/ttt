import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Copy, Eye, EyeOff, Loader2, CheckCircle2, Shield,
  ArrowLeft, RefreshCw, X, AlertTriangle, Send, QrCode, Download
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import QRScanner from "@/components/wallet/QRScanner";

// ── Toast ──────────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => (
  <motion.div
    initial={{ opacity: 0, x: 100, scale: 0.8 }}
    animate={{ opacity: 1, x: 0, scale: 1 }}
    exit={{ opacity: 0, x: 100, scale: 0.8 }}
    className="fixed bottom-6 right-6 z-[9999] max-w-xs"
  >
    <div className={`bg-black/95 backdrop-blur-xl border ${type === 'success' ? 'border-green-500/30' : 'border-red-500/30'} rounded-lg p-3 shadow-2xl`}>
      <div className="flex items-start gap-2">
        <span className="text-lg flex-shrink-0">{type === 'success' ? '✅' : '❌'}</span>
        <p className="text-white text-xs flex-1 leading-relaxed">{message}</p>
        <button onClick={onClose} className="text-white/60 hover:text-white flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  </motion.div>
);

// ── Confirm Modal ──────────────────────────────────────────────────────────────
const ConfirmModal = ({ title, message, onConfirm, onCancel }) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    onClick={onCancel}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
      onClick={e => e.stopPropagation()}
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
        <Button onClick={onCancel} className="flex-1 bg-white/5 border border-white/10 text-white hover:bg-white/10">Cancel</Button>
        <Button onClick={onConfirm} className="flex-1 bg-red-500 hover:bg-red-600 text-white">Clear Wallet</Button>
      </div>
    </motion.div>
  </motion.div>
);

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function WalletPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState('create');
  const [wordCount, setWordCount] = useState(12);
  const [importMnemonic, setImportMnemonic] = useState('');
  const [showImportPhrase, setShowImportPhrase] = useState(false);
  const [mnemonic, setMnemonic] = useState(null);
  const [privateKey, setPrivateKey] = useState(null);
  const [address, setAddress] = useState(null);
  const [kaspaBalance, setKaspaBalance] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedPhrase, setCopiedPhrase] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [kasPrice, setKasPrice] = useState(null);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [pinSet, setPinSet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSealing, setIsSealing] = useState(false);
  const [isSealed, setIsSealed] = useState(false);
  const [isFetchingBalance, setIsFetchingBalance] = useState(false);
  const [toast, setToast] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const balanceIntervalRef = useRef(null);

  // Send modal state
  const [showSend, setShowSend] = useState(false);
  const [sendTo, setSendTo] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Receive/Request QR state
  const [requestAmount, setRequestAmount] = useState('');
  const [showReceiveQR, setShowReceiveQR] = useState(false);

  const showToast = (message, type = 'success', duration = 3000) => {
    setToast({ message, type });
    if (duration > 0) setTimeout(() => setToast(null), duration);
  };

  // ── Balance fetching via Terra Protocol (getKaspaBalance) ──────────────────
  const fetchBalance = async (addr) => {
    if (!addr) return;
    setIsFetchingBalance(true);
    try {
      const res = await base44.functions.invoke('getKaspaBalance', { address: addr });
      const balKAS = res.data?.balanceKAS;
      if (typeof balKAS === 'number') {
        setKaspaBalance({ balanceKAS: balKAS });
      } else {
        setKaspaBalance({ balanceKAS: 0 });
      }
    } catch (e) {
      console.error('[Wallet] balance fetch error:', e);
      setKaspaBalance(prev => prev ?? { balanceKAS: 0 });
    } finally {
      setIsFetchingBalance(false);
    }
  };

  // ── Send KAS via Terra Protocol (sendKaspaTransaction) ────────────────────
  const [sendMnemonic, setSendMnemonic] = useState('');
  const [showMnemonicInput, setShowMnemonicInput] = useState(false);

  const handleSend = async () => {
    if (!sendTo.trim() || !sendAmount || parseFloat(sendAmount) <= 0) {
      showToast('Enter a valid address and amount', 'error');
      return;
    }
    // Retrieve stored private key
    const storedPK = localStorage.getItem('ttt_wallet_pk');
    if (!storedPK && !sendMnemonic.trim()) {
      setShowMnemonicInput(true);
      return;
    }
    setIsSending(true);
    try {
      const payload = {
        fromAddress: address,
        toAddress: sendTo.trim(),
        amountKas: parseFloat(sendAmount),
      };
      if (storedPK) {
        payload.privateKey = storedPK;
      } else {
        // Derive PK from mnemonic, also cache it
        const pkRes = await base44.functions.invoke('createKaspaWallet', {
          mnemonic: sendMnemonic.trim(),
          wordCount: sendMnemonic.trim().split(/\s+/).length,
          importMode: true,
        });
        if (pkRes.data?.error) throw new Error('Invalid seed phrase');
        payload.privateKey = pkRes.data.privateKey;
        localStorage.setItem('ttt_wallet_pk', pkRes.data.privateKey);
      }
      const res = await base44.functions.invoke('sendKaspaTransaction', payload);
      if (res.data?.error) throw new Error(res.data.error);
      showToast(`Sent! TX: ${String(res.data.txId).slice(0, 16)}...`, 'success');
      setShowSend(false);
      setSendTo('');
      setSendAmount('');
      setSendMnemonic('');
      setShowMnemonicInput(false);
      setTimeout(() => fetchBalance(address), 3000);
    } catch (e) {
      showToast(e?.message || 'Send failed', 'error');
    } finally {
      setIsSending(false);
    }
  };

  // Poll balance every 15 seconds when wallet is connected
  const startBalancePolling = (addr) => {
    if (balanceIntervalRef.current) clearInterval(balanceIntervalRef.current);
    fetchBalance(addr);
    balanceIntervalRef.current = setInterval(() => fetchBalance(addr), 15000);
  };

  const stopBalancePolling = () => {
    if (balanceIntervalRef.current) {
      clearInterval(balanceIntervalRef.current);
      balanceIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopBalancePolling();
  }, []);

  // ── Load user + price ──────────────────────────────────────────────────────
  const loadData = async () => {
    try {
      try {
        const currentUser = await base44.auth.me();
        if (currentUser) {
          setUser(currentUser);
          const savedAddr = currentUser.created_wallet_address || localStorage.getItem('ttt_wallet_address');
          if (savedAddr) {
            setAddress(savedAddr);
            setPinSet(!!(currentUser.wallet_pin_hash || localStorage.getItem('ttt_wallet_pin_hash')));
            checkIfSealed(savedAddr, currentUser);
            startBalancePolling(savedAddr);
          }
        }
      } catch {
        const localAddr = localStorage.getItem('ttt_wallet_address');
        if (localAddr) {
          setAddress(localAddr);
          setPinSet(!!localStorage.getItem('ttt_wallet_pin_hash'));
          startBalancePolling(localAddr);
        }
      }

      try {
        const priceRes = await base44.functions.invoke('getKaspaPrice');
        setKasPrice(priceRes.data?.price || 0.05);
      } catch {
        setKasPrice(0.05);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const checkIfSealed = async (walletAddress, currentUser) => {
    if (!currentUser?.email) return;
    try {
      const sealed = await base44.entities.SealedWallet.filter({
        wallet_address: walletAddress, is_active: true, created_by: currentUser.email
      });
      setIsSealed(sealed.length > 0);
    } catch { setIsSealed(false); }
  };

  // ── Create Wallet via Terra Protocol ──────────────────────────────────────
  const handleCreateWallet = async () => {
    setIsCreating(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('createKaspaWallet', { wordCount });
      if (res.data?.error) throw new Error(res.data.error);
      const { address: addr, mnemonic: phrase, privateKey: pk } = res.data;
      const fullAddr = addr.startsWith('kaspa:') ? addr : `kaspa:${addr}`;
      setMnemonic(phrase);
      setPrivateKey(pk);
      setAddress(fullAddr);
      setShowMnemonic(true);
      if (pk) localStorage.setItem('ttt_wallet_pk', pk);
      await saveWallet(fullAddr, wordCount);
      startBalancePolling(fullAddr);
      setShowPinSetup(true);
      showToast('Wallet created!', 'success');
    } catch (e) {
      setError(e?.message || 'Failed to create wallet');
    } finally {
      setIsCreating(false);
    }
  };

  // ── Import Wallet via Terra Protocol ──────────────────────────────────────
  const handleImportWallet = async () => {
    const words = importMnemonic.trim().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      setError('Must be 12 or 24 words');
      return;
    }
    setIsImporting(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('createKaspaWallet', {
        mnemonic: importMnemonic.trim(),
        wordCount: words.length,
        importMode: true,
      });
      if (res.data?.error) throw new Error(res.data.error);
      const { address: addr, mnemonic: phrase, privateKey: pk } = res.data;
      const fullAddr = addr.startsWith('kaspa:') ? addr : `kaspa:${addr}`;
      setMnemonic(phrase || importMnemonic.trim());
      setPrivateKey(pk);
      setAddress(fullAddr);
      setShowMnemonic(false);
      setImportMnemonic('');
      if (pk) localStorage.setItem('ttt_wallet_pk', pk);
      await saveWallet(fullAddr, words.length);
      startBalancePolling(fullAddr);
      setShowPinSetup(true);
      showToast('Wallet imported!', 'success');
    } catch (e) {
      setError(e?.message || 'Could not derive address. Check your phrase and try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const saveWallet = async (addr, wc) => {
    localStorage.setItem('ttt_wallet_address', addr);
    try {
      const currentUser = await base44.auth.me();
      if (!currentUser) return;
      const existingWallets = currentUser.created_wallets || [];
      const walletExists = existingWallets.some(w => w.address === addr);
      const updates = {
        created_wallet_address: addr,
        username: currentUser.username || currentUser.email.split('@')[0]
      };
      if (!walletExists) {
        updates.created_wallets = [...existingWallets, {
          address: addr, wordCount: wc, createdAt: new Date().toISOString(), balance: 0, userId: currentUser.email
        }];
      }
      await base44.auth.updateMe(updates);
      setUser(u => ({ ...u, ...updates }));
    } catch { /* not logged in */ }
  };

  const handleSetPin = async () => {
    if (pin.length !== 6 || pin !== confirmPin) { setError('PINs must match'); return; }
    setIsSettingPin(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('hashPin', { pin });
      const hash = res.data?.hash;
      if (!hash) throw new Error('Hash not returned');
      // Store PIN hash locally always (works for non-logged-in too)
      localStorage.setItem('ttt_wallet_pin_hash', hash);
      // Also save to user profile if logged in
      try {
        await base44.auth.updateMe({ wallet_pin_hash: hash });
        setUser(u => ({ ...u, wallet_pin_hash: hash }));
      } catch { /* not logged in, local storage is enough */ }
      setPinSet(true);
      setShowPinSetup(false);
      showToast('PIN set!', 'success');
      setPin(''); setConfirmPin('');
    } catch (e) {
      setError(e?.message || 'Failed to set PIN');
    } finally {
      setIsSettingPin(false);
    }
  };

  const handleSealWallet = async () => {
    if (!address || !mnemonic || !pinSet) { setError('Missing requirements'); return; }
    setIsSealing(true);
    setError(null);
    try {
      const message = `I am sealing my TTT Wallet.\n\nAddress: ${address}\nTimestamp: ${Date.now()}\n\nThis is my TTT Wallet Seal.`;
      const encoder = new TextEncoder();
      const data = encoder.encode(message + mnemonic);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const signature = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
      await base44.entities.SealedWallet.create({
        wallet_address: address, seal_signature: signature, seal_message: message,
        sealed_date: new Date().toISOString(), balance_at_seal: kaspaBalance?.balanceKAS || 0,
        mnemonic_word_count: (mnemonic?.split(' ').length || 12), is_active: true
      });
      setIsSealed(true);
      showToast('Wallet sealed!', 'success');
    } catch { setError('Seal failed'); }
    finally { setIsSealing(false); }
  };

  const copyAddress = async () => {
    await navigator.clipboard.writeText(address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const copyPhrase = async () => {
    await navigator.clipboard.writeText(mnemonic);
    setCopiedPhrase(true);
    setTimeout(() => setCopiedPhrase(false), 2000);
  };

  const clearWallet = async () => {
    try {
      try { await base44.auth.updateMe({ created_wallet_address: null, wallet_pin_hash: null }); } catch { }
      localStorage.removeItem('ttt_wallet_address');
      localStorage.removeItem('ttt_wallet_pk');
      localStorage.removeItem('ttt_wallet_pin_hash');
      stopBalancePolling();
      setAddress(null); setMnemonic(null); setPrivateKey(null);
      setIsSealed(false); setPinSet(false); setKaspaBalance(null);
      setShowBalance(true); setShowClearConfirm(false);
      showToast('Wallet cleared', 'success');
    } catch { setError('Clear failed'); setShowClearConfirm(false); }
  };

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
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showClearConfirm && (
          <ConfirmModal
            title="Clear Wallet?"
            message="⚠️ Make sure you've backed up your seed phrase! This cannot be undone."
            onConfirm={clearWallet}
            onCancel={() => setShowClearConfirm(false)}
          />
        )}
      </AnimatePresence>

      {/* QR Scanner */}
      <AnimatePresence>
        {showQRScanner && (
          <QRScanner
            onScan={({ address, amount }) => {
              setSendTo(address);
              if (amount) setSendAmount(amount);
              setShowQRScanner(false);
            }}
            onClose={() => setShowQRScanner(false)}
          />
        )}
      </AnimatePresence>

      {/* Receive / Request QR Modal */}
      <AnimatePresence>
        {showReceiveQR && address && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowReceiveQR(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-lg">Receive / Request</h3>
                <button onClick={() => setShowReceiveQR(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* QR Code display */}
              <div className="flex justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                    requestAmount ? `${address}?amount=${requestAmount}` : address
                  )}`}
                  alt="Kaspa QR"
                  className="rounded-xl border border-zinc-700"
                />
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 font-mono break-all">{address}</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Request Amount (optional)</label>
                <Input
                  type="number"
                  value={requestAmount}
                  onChange={e => setRequestAmount(e.target.value)}
                  placeholder="0.00 KAS"
                  className="bg-black border-zinc-800 text-white text-center"
                />
                {requestAmount && <p className="text-xs text-center text-cyan-400 mt-1">QR encodes {requestAmount} KAS request</p>}
              </div>
              <Button
                onClick={() => { navigator.clipboard.writeText(requestAmount ? `${address}?amount=${requestAmount}` : address); showToast('Copied!', 'success'); }}
                className="w-full bg-zinc-800 text-white hover:bg-zinc-700"
              >
                <Copy className="w-4 h-4 mr-2" /> Copy Address{requestAmount ? ' + Amount' : ''}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Send Modal */}
      <AnimatePresence>
        {showSend && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => !isSending && setShowSend(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-full max-w-md space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-lg">Send KAS</h3>
                <button onClick={() => setShowSend(false)} disabled={isSending} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Recipient Address</label>
                <div className="flex gap-2">
                  <Input
                    value={sendTo}
                    onChange={e => setSendTo(e.target.value)}
                    placeholder="kaspa:q..."
                    className="bg-black border-zinc-800 text-white font-mono text-sm flex-1"
                  />
                  <Button
                    onClick={() => setShowQRScanner(true)}
                    variant="outline"
                    className="border-zinc-700 bg-black text-gray-300 hover:bg-zinc-800 px-3"
                    title="Scan QR"
                  >
                    <QrCode className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Amount (KAS)</label>
                <Input
                  type="number"
                  value={sendAmount}
                  onChange={e => setSendAmount(e.target.value)}
                  placeholder="0.00"
                  className="bg-black border-zinc-800 text-white"
                />
                {kaspaBalance && (
                  <p className="text-xs text-gray-500 mt-1">
                    Available: {kaspaBalance.balanceKAS.toFixed(4)} KAS
                    <button
                      onClick={() => setSendAmount(String(Math.max(0, kaspaBalance.balanceKAS - 0.0001).toFixed(8)))}
                      className="ml-2 text-cyan-400 hover:text-cyan-300 font-semibold"
                    >Max</button>
                  </p>
                )}
              </div>
              {showMnemonicInput && (
                <div>
                  <label className="text-xs text-yellow-400 mb-1.5 block">⚠️ Enter your seed phrase to authorize this transaction</label>
                  <Textarea
                    value={sendMnemonic}
                    onChange={e => setSendMnemonic(e.target.value)}
                    placeholder="word1 word2 word3 ..."
                    className="bg-black border-yellow-500/40 text-white font-mono text-sm min-h-[80px]"
                    rows={3}
                  />
                </div>
              )}
              <Button
                onClick={handleSend}
                disabled={isSending || !sendTo.trim() || !sendAmount || (showMnemonicInput && !sendMnemonic.trim())}
                className="w-full bg-white text-black hover:bg-gray-200 h-12"
              >
                {isSending ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Sending...</> : <><Send className="w-4 h-4 mr-2" />Send KAS</>}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">TTT WALLET</h1>
            <p className="text-gray-400 text-sm">{user?.username || user?.email || 'TTT'}</p>
          </div>
          {address && (
            <Button onClick={() => setShowClearConfirm(true)} variant="outline" className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800">
              <ArrowLeft className="w-4 h-4 mr-2" />Clear
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <span className="text-sm text-red-300">{error}</span>
          </div>
        )}

        {/* No wallet — create/import */}
        {!address ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => { setMode('create'); setError(null); }}
                className={mode === 'create' ? 'bg-white text-black' : 'bg-zinc-900 text-gray-400 border border-zinc-800'}
              >Create New</Button>
              <Button
                onClick={() => { setMode('import'); setError(null); }}
                className={mode === 'import' ? 'bg-white text-black' : 'bg-zinc-900 text-gray-400 border border-zinc-800'}
              >Import Existing</Button>
            </div>

            {mode === 'create' && (
              <>
                <Card className="bg-zinc-950 border-zinc-800">
                  <CardContent className="p-6">
                    <label className="text-sm text-gray-400 mb-2 block">Seed Phrase Length</label>
                    <Select value={wordCount.toString()} onValueChange={v => setWordCount(parseInt(v))}>
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
                <Button onClick={handleCreateWallet} disabled={isCreating} className="w-full bg-white text-black hover:bg-gray-200 h-12">
                  {isCreating ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Creating...</> : 'Create Wallet'}
                </Button>
              </>
            )}

            {mode === 'import' && (
              <>
                <div className="relative">
                  <Textarea
                    value={importMnemonic}
                    onChange={e => setImportMnemonic(e.target.value)}
                    placeholder="Enter seed phrase (12 or 24 words)..."
                    className="bg-zinc-950 border-zinc-800 text-white font-mono min-h-[120px] pr-10"
                    style={{ WebkitTextSecurity: showImportPhrase ? 'none' : 'disc' }}
                    rows={4}
                  />
                  <button
                    onClick={() => setShowImportPhrase(s => !s)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-white"
                  >
                    {showImportPhrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button
                  onClick={handleImportWallet}
                  disabled={isImporting || !importMnemonic.trim()}
                  className="w-full bg-white text-black hover:bg-gray-200 h-12"
                >
                  {isImporting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Importing...</> : 'Import Wallet'}
                </Button>
              </>
            )}
          </div>
        ) : (
          /* Wallet connected */
          <div className="space-y-4">
            <Card className="bg-zinc-950 border-zinc-800">
              <CardContent className="p-6">
                {/* Balance row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-500">Balance</div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchBalance(address)}
                      disabled={isFetchingBalance}
                      className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                      title="Refresh balance"
                    >
                      <RefreshCw className={`w-4 h-4 ${isFetchingBalance ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => setShowBalance(s => !s)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => {
                        const seedSection = document.getElementById('seed-phrase-section');
                        if (seedSection) {
                          seedSection.scrollIntoView({ behavior: 'smooth' });
                          if (mnemonic) setShowMnemonic(true);
                        }
                      }}
                      className="text-gray-400 hover:text-white transition-colors"
                      title="View seed phrase"
                    >
                      <Shield className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="text-4xl font-bold text-white mb-2">
                  {isFetchingBalance && kaspaBalance === null ? (
                    <span className="text-gray-500 text-2xl">Loading...</span>
                  ) : showBalance && kaspaBalance !== null ? (
                    <>{kaspaBalance.balanceKAS.toFixed(8)} KAS</>
                  ) : (
                    <span className="text-gray-700">••••••••</span>
                  )}
                </div>

                {showBalance && kasPrice && kaspaBalance && (
                  <div className="text-xl text-gray-500 mb-4">
                    ≈ ${((kaspaBalance.balanceKAS || 0) * kasPrice).toFixed(2)} USD
                  </div>
                )}

                {/* Address */}
                <div className="bg-black border border-zinc-800 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-cyan-400 text-sm break-all flex-1">{address}</code>
                    <Button onClick={copyAddress} size="sm" variant="ghost" className="shrink-0">
                      {copiedAddress ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Button onClick={() => setShowReceiveQR(true)} className="bg-zinc-950 border border-zinc-800 text-white hover:bg-zinc-900">
                    <Download className="w-4 h-4 mr-2" />Receive
                  </Button>
                  <Button onClick={() => setShowSend(true)} className="bg-white text-black hover:bg-gray-200">
                    Send
                  </Button>
                </div>

                {/* Seal */}
                {pinSet && !isSealed && mnemonic && (
                  <Button onClick={handleSealWallet} disabled={isSealing} className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold">
                    {isSealing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Sealing...</> : <><Shield className="w-5 h-5 mr-2" />Seal Wallet</>}
                  </Button>
                )}

                {isSealed && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                    <div>
                      <div className="text-sm font-semibold text-green-300">✅ Sealed!</div>
                      <div className="text-xs text-green-400 mt-1">Stamped</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* PIN Setup */}
            {showPinSetup && !pinSet && (
              <Card className="bg-yellow-500/10 border-yellow-500/30">
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-white font-bold">Set PIN</h3>
                  <Input
                    type="password" inputMode="numeric" maxLength={6}
                    value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="6 digits" className="bg-black border-zinc-800 text-white text-center text-lg"
                  />
                  <Input
                    type="password" inputMode="numeric" maxLength={6}
                    value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Confirm" className="bg-black border-zinc-800 text-white text-center text-lg"
                  />
                  <Button
                    onClick={handleSetPin}
                    disabled={isSettingPin || pin.length !== 6 || pin !== confirmPin}
                    className="w-full bg-yellow-500 text-black hover:bg-yellow-600"
                  >
                    {isSettingPin ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Setting...</> : 'Set PIN'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Seed Phrase */}
            <div id="seed-phrase-section">
              {mnemonic ? (
                <Card className="bg-zinc-950 border-zinc-800">
                  <CardHeader className="border-b border-zinc-800">
                    <div className="flex justify-between items-center">
                      <h3 className="text-white font-bold">Seed Phrase</h3>
                      <div className="flex gap-2">
                        {showMnemonic && (
                          <Button onClick={copyPhrase} size="sm" variant="ghost">
                            {copiedPhrase ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        )}
                        <Button onClick={() => setShowMnemonic(s => !s)} size="sm" variant="ghost">
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
                          <p className="text-xs text-red-300">⚠️ Save securely. Never share.</p>
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
              ) : (
                <Card className="bg-zinc-950 border-zinc-800">
                  <CardHeader className="border-b border-zinc-800">
                    <h3 className="text-white font-bold">Seed Phrase</h3>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="text-center py-8">
                      <Shield className="w-12 h-12 text-gray-700 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm mb-3">Seed phrase not stored in this session</p>
                      <p className="text-gray-600 text-xs">Re-import your wallet to view your seed phrase</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}