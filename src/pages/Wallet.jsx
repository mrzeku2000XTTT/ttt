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
  ArrowLeft, RefreshCw, X, AlertTriangle, Send, QrCode, Download, Globe, ArrowRight
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import QRScanner from "@/components/wallet/QRScanner";
import KRC20Tokens from "@/components/terra/KRC20Tokens";
import KRC20SendSheet from "@/components/terra/KRC20SendSheet";
import KaChingWalletToggle from "@/components/kaching/KaChingWalletToggle";

const TTT_LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/878bee477_generated_image.png";
const TTT_BG = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/252651f98_image.png";

// ── Toast ──────────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => (
  <motion.div
    initial={{ opacity: 0, x: 100, scale: 0.8 }}
    animate={{ opacity: 1, x: 0, scale: 1 }}
    exit={{ opacity: 0, x: 100, scale: 0.8 }}
    className="fixed bottom-6 right-6 z-[10050] max-w-xs"
  >
    <div className={`bg-[#0a0000]/95 backdrop-blur-xl border ${type === 'success' ? 'border-[#ff4d4d]/40' : 'border-red-700/50'} rounded-xl p-3 shadow-[0_0_25px_rgba(255,77,77,0.25)]`}>
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
    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
    onClick={onCancel}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
      onClick={e => e.stopPropagation()}
      className="bg-[#0a0000] border border-[#ff4d4d]/40 rounded-2xl p-6 max-w-md w-full shadow-[0_0_40px_rgba(255,77,77,0.3)]"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-[#ff4d4d]/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-[#ff4d4d]" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg mb-1">{title}</h3>
          <p className="text-gray-400 text-sm">{message}</p>
        </div>
      </div>
      <div className="flex gap-3">
        <Button onClick={onCancel} className="flex-1 bg-white/5 border border-white/10 text-white hover:bg-white/10">Cancel</Button>
        <Button onClick={onConfirm} className="flex-1 bg-[#ff4d4d] hover:bg-[#ff6b6b] text-white">Clear Wallet</Button>
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
  const [isCompounding, setIsCompounding] = useState(false);

  // Receive/Request QR state
  const [requestAmount, setRequestAmount] = useState('');
  const [showReceiveQR, setShowReceiveQR] = useState(false);

  // KRC-20 send state
  const [krc20SendToken, setKrc20SendToken] = useState(null);

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
  const [sendPin, setSendPin] = useState('');

  const handleSend = async () => {
    if (!sendTo.trim() || !sendAmount || parseFloat(sendAmount) <= 0) {
      showToast('Enter a valid address and amount', 'error');
      return;
    }
    const storedPK = localStorage.getItem('ttt_wallet_pk');
    const storedPinHash = localStorage.getItem('ttt_wallet_pin_hash') || user?.wallet_pin_hash;
    if (!storedPK) {
      showToast('No connected wallet key found. Re-import this wallet once to enable local PIN sending.', 'error');
      return;
    }
    if (!storedPinHash) {
      showToast('Set your wallet PIN before sending.', 'error');
      return;
    }
    if (sendPin.length !== 6) {
      showToast('Enter your 6-digit wallet PIN', 'error');
      return;
    }
    setIsSending(true);
    try {
      const pinRes = await base44.functions.invoke('hashPin', { pin: sendPin });
      if (pinRes.data?.hash !== storedPinHash) throw new Error('Incorrect PIN');
      // If sending (nearly) the entire balance, use sendAll so the network fee
      // is deducted from the amount instead of failing with insufficient balance.
      const amt = parseFloat(sendAmount);
      const isMaxSend = kaspaBalance && amt >= kaspaBalance.balanceKAS - 0.005;
      const res = await base44.functions.invoke('sendKaspaTransaction', {
        privateKey: storedPK,
        fromAddress: address,
        toAddress: sendTo.trim(),
        ...(isMaxSend ? { sendAll: true } : { amountKas: amt }),
      });
      if (res.data?.error) throw new Error(res.data.error);
      const feeNote = res.data?.note ? ` ⚠️ ${res.data.note}` : '';
      showToast(`Sent ${res.data.amountKas?.toFixed(4) || sendAmount} KAS! TX: ${String(res.data.txId).slice(0, 16)}...${feeNote}`, 'success', 6000);
      setShowSend(false);
      setSendTo('');
      setSendAmount('');
      setSendPin('');
      setTimeout(() => fetchBalance(address), 3000);
    } catch (e) {
      showToast(e?.response?.data?.error || e?.message || 'Send failed', 'error');
    } finally {
      setIsSending(false);
    }
  };

  // ── Compound / Combine UTXOs (self-send entire balance into one UTXO) ──────
  const handleCompound = async () => {
    const storedPK = localStorage.getItem('ttt_wallet_pk');
    if (!storedPK) {
      showToast('Re-import this wallet once to enable compounding.', 'error');
      return;
    }
    setIsCompounding(true);
    try {
      // First check how many UTXOs the wallet has (live, from Kaspa API).
      // If 0 or 1, there's nothing to merge.
      const apiAddr = address.startsWith('kaspa:') ? address : `kaspa:${address}`;
      const utxoResp = await fetch(`https://api.kaspa.org/addresses/${apiAddr}/utxos`);
      const utxos = utxoResp.ok ? await utxoResp.json() : [];
      const count = Array.isArray(utxos) ? utxos.length : 0;
      const totalKas = (Array.isArray(utxos) ? utxos : []).reduce((sum, u) => sum + (Number(u.utxoEntry?.amount || 0) / 1e8), 0);

      if (count <= 1) {
        showToast(
          count === 0
            ? 'No funds to compound yet.'
            : `✅ No need to compound — your ${totalKas.toFixed(4)} KAS is already in a single UTXO.`,
          'success'
        );
        setIsCompounding(false);
        return;
      }

      showToast(`Compounding ${count} UTXOs (${totalKas.toFixed(4)} KAS) into one...`, 'success');

      const res = await base44.functions.invoke('sendKaspaTransaction', {
        privateKey: storedPK,
        fromAddress: address,
        toAddress: address,
        sendAll: true,
      });
      if (res.data?.error) throw new Error(res.data.error);
      showToast(`Compounded ${count} UTXOs into one! TX: ${String(res.data.txId).slice(0, 12)}...`, 'success');
      setTimeout(() => fetchBalance(address), 4000);
    } catch (e) {
      showToast(e?.response?.data?.error || e?.message || 'Compound failed', 'error');
    } finally {
      setIsCompounding(false);
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
          const localAddr = localStorage.getItem('ttt_wallet_address');
          const localPK = localStorage.getItem('ttt_wallet_pk');
          const savedAddr = localPK && localAddr ? localAddr : (currentUser.created_wallet_address || localAddr);
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
      setShowMnemonic(false);
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'radial-gradient(circle at 50% 30%, #4a0a0a 0%, #1a0303 45%, #0a0000 100%)' }}>
        <Loader2 className="w-10 h-10 text-[#ff4d4d] animate-spin" />
      </div>
    );
  }

  const glassCard = "bg-[#0a0000]/70 backdrop-blur-xl border border-[#ff4d4d]/25 shadow-[0_0_30px_rgba(255,77,77,0.12)]";
  const glowBtn = "bg-[#ff4d4d] hover:bg-[#ff6b6b] text-white shadow-[0_0_20px_rgba(255,77,77,0.5)]";

  return (
    <div
      className="min-h-screen p-4 sm:p-6"
      style={{ background: 'radial-gradient(circle at 50% 20%, #4a0a0a 0%, #1a0303 45%, #0a0000 100%)' }}
    >
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
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
            onClick={() => setShowReceiveQR(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className={`${glassCard} rounded-2xl p-6 w-full max-w-sm space-y-4`}
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
                  className="rounded-xl border border-[#ff4d4d]/30 p-1 bg-black"
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
                  className="bg-black border-[#ff4d4d]/30 text-white text-center"
                />
                {requestAmount && <p className="text-xs text-center text-[#ff4d4d] mt-1">QR encodes {requestAmount} KAS request</p>}
              </div>
              <Button
                onClick={() => { navigator.clipboard.writeText(requestAmount ? `${address}?amount=${requestAmount}` : address); showToast('Copied!', 'success'); }}
                className="w-full bg-white/5 border border-[#ff4d4d]/30 text-white hover:bg-[#ff4d4d]/10"
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
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
            onClick={() => !isSending && setShowSend(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className={`${glassCard} rounded-2xl p-6 w-full max-w-md space-y-4`}
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
                    className="bg-black border-[#ff4d4d]/30 text-white font-mono text-sm flex-1"
                  />
                  <Button
                    onClick={() => setShowQRScanner(true)}
                    variant="outline"
                    className="border-[#ff4d4d]/40 bg-black text-gray-300 hover:bg-[#ff4d4d]/10 px-3"
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
                  className="bg-black border-[#ff4d4d]/30 text-white"
                />
                {kaspaBalance && (
                  <p className="text-xs text-gray-500 mt-1">
                    Available: {kaspaBalance.balanceKAS.toFixed(4)} KAS
                    <button
                      onClick={() => setSendAmount(String(kaspaBalance.balanceKAS.toFixed(8)))}
                      className="ml-2 text-[#ff4d4d] hover:text-[#ff6b6b] font-semibold"
                    >Max</button>
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs text-[#ff4d4d] mb-1.5 block">Enter your local wallet PIN to authorize</label>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={sendPin}
                  onChange={e => setSendPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="6-digit PIN"
                  className="bg-black border-[#ff4d4d]/40 text-white text-center tracking-[0.5em]"
                />
                <p className="text-[11px] text-gray-500 mt-1.5">Your seed phrase stays on this device and is never re-entered here.</p>
              </div>
              <Button
                onClick={handleSend}
                disabled={isSending}
                className={`w-full ${glowBtn} h-12`}
              >
                {isSending ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Sending...</> : <><Send className="w-4 h-4 mr-2" />Send KAS</>}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto">
        {/* Brand Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex items-center justify-between w-full mb-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/30">
              <span className="text-[10px] tracking-widest text-white font-semibold leading-tight">KASPA<br/>NATIVE</span>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">TTT (TapToTip)</h1>
          <p className="text-xs sm:text-sm tracking-[0.3em] text-gray-400 mt-2 font-semibold">KASPA-NATIVE SOFTWARE SUPER-APP</p>
          {address && (
            <Button onClick={() => setShowClearConfirm(true)} variant="outline" className="mt-4 bg-white/5 border-[#ff4d4d]/30 text-white hover:bg-[#ff4d4d]/10">
              <ArrowLeft className="w-4 h-4 mr-2" />Clear Wallet
            </Button>
          )}
          <p className="text-gray-500 text-xs mt-2">{user?.username || user?.email || 'TTT'}</p>
        </div>

        {error && (
          <div className="mb-4 bg-[#ff4d4d]/10 border border-[#ff4d4d]/40 rounded-lg p-3">
            <span className="text-sm text-[#ff8080]">{error}</span>
          </div>
        )}

        {/* No wallet — create/import */}
        {!address ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => { setMode('create'); setError(null); }}
                className={mode === 'create' ? `${glowBtn}` : 'bg-white/5 text-gray-400 border border-[#ff4d4d]/20'}
              >Create New</Button>
              <Button
                onClick={() => { setMode('import'); setError(null); }}
                className={mode === 'import' ? `${glowBtn}` : 'bg-white/5 text-gray-400 border border-[#ff4d4d]/20'}
              >Import Existing</Button>
            </div>

            {mode === 'create' && (
              <>
                <Card className={`${glassCard} border-[#ff4d4d]/25`}>
                  <CardContent className="p-6">
                    <label className="text-sm text-gray-400 mb-2 block">Seed Phrase Length</label>
                    <Select value={wordCount.toString()} onValueChange={v => setWordCount(parseInt(v))}>
                      <SelectTrigger className="bg-black border-[#ff4d4d]/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a0000] border-[#ff4d4d]/30">
                        <SelectItem value="12">12 words</SelectItem>
                        <SelectItem value="24">24 words</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
                <Button onClick={handleCreateWallet} disabled={isCreating} className={`w-full ${glowBtn} h-12`}>
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
                    className="bg-[#0a0000]/70 border-[#ff4d4d]/25 text-white font-mono min-h-[120px] pr-10 focus-visible:border-[#ff4d4d]/60"
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
                  className={`w-full ${glowBtn} h-12`}
                >
                  {isImporting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Importing...</> : 'Import Wallet'}
                </Button>
              </>
            )}
          </div>
        ) : (
          /* Wallet connected */
          <div className="space-y-4">
            <Card className={`${glassCard}`}>
              <CardContent className="p-6">
                {/* Balance row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-500">Balance</div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchBalance(address)}
                      disabled={isFetchingBalance}
                      className="text-gray-400 hover:text-[#ff4d4d] transition-colors disabled:opacity-50"
                      title="Refresh balance"
                    >
                      <RefreshCw className={`w-4 h-4 ${isFetchingBalance ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => setShowBalance(s => !s)}
                      className="text-gray-400 hover:text-[#ff4d4d] transition-colors"
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
                      className="text-gray-400 hover:text-[#ff4d4d] transition-colors"
                      title="View seed phrase"
                    >
                      <Shield className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="text-4xl font-bold text-white mb-2" style={{ textShadow: '0 0 25px rgba(255,77,77,0.35)' }}>
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
                <div className="bg-black/60 border border-[#ff4d4d]/25 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-[#ff8080] text-sm break-all flex-1">{address}</code>
                    <Button onClick={copyAddress} size="sm" variant="ghost" className="shrink-0">
                      {copiedAddress ? <CheckCircle2 className="w-4 h-4 text-[#ff4d4d]" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Button onClick={() => setShowReceiveQR(true)} className="bg-white/5 border border-[#ff4d4d]/30 text-white hover:bg-[#ff4d4d]/10">
                    <Download className="w-4 h-4 mr-2" />Receive
                  </Button>
                  <Button onClick={() => setShowSend(true)} className={glowBtn}>
                    Send
                  </Button>
                </div>

                {/* Compound / Combine UTXOs */}
                <Button
                  onClick={handleCompound}
                  disabled={isCompounding}
                  variant="outline"
                  className="w-full mb-4 bg-black/40 border-[#ff4d4d]/30 text-[#ff8080] hover:bg-[#ff4d4d]/10"
                  title="Merge all small UTXOs into one to fix send errors and reduce fees"
                >
                  {isCompounding
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Compounding...</>
                    : <><RefreshCw className="w-4 h-4 mr-2" />Compound UTXOs</>}
                </Button>

                {/* Seal */}
                {pinSet && !isSealed && mnemonic && (
                  <Button onClick={handleSealWallet} disabled={isSealing} className={`w-full h-12 ${glowBtn} font-semibold`}>
                    {isSealing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Sealing...</> : <><Shield className="w-5 h-5 mr-2" />Seal Wallet</>}
                  </Button>
                )}

                {isSealed && (
                  <div className="bg-[#ff4d4d]/10 border border-[#ff4d4d]/40 rounded-lg p-4 flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-[#ff4d4d]" />
                    <div>
                      <div className="text-sm font-semibold text-[#ff8080]">✅ Sealed!</div>
                      <div className="text-xs text-[#ff4d4d] mt-1">Stamped</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* KaChing Integration */}
            <div className="mb-4">
              <KaChingWalletToggle
                walletAddress={address}
                hasMnemonic={!!(mnemonic || localStorage.getItem('ttt_wallet_pk'))}
              />
            </div>

            {/* KRC-20 Tokens */}
            <KRC20Tokens walletAddress={address} onSendToken={(token) => setKrc20SendToken(token)} />

            {/* PIN Setup */}
            {showPinSetup && !pinSet && (
              <Card className="bg-[#ff4d4d]/10 border-[#ff4d4d]/40">
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-white font-bold">Set PIN</h3>
                  <Input
                    type="password" inputMode="numeric" maxLength={6}
                    value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="6 digits" className="bg-black border-[#ff4d4d]/30 text-white text-center text-lg"
                  />
                  <Input
                    type="password" inputMode="numeric" maxLength={6}
                    value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Confirm" className="bg-black border-[#ff4d4d]/30 text-white text-center text-lg"
                  />
                  <Button
                    onClick={handleSetPin}
                    disabled={isSettingPin || pin.length !== 6 || pin !== confirmPin}
                    className={`w-full ${glowBtn}`}
                  >
                    {isSettingPin ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Setting...</> : 'Set PIN'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Seed Phrase */}
            <div id="seed-phrase-section">
              {mnemonic ? (
                <Card className={`${glassCard}`}>
                  <CardHeader className="border-b border-[#ff4d4d]/20">
                    <div className="flex justify-between items-center">
                      <h3 className="text-white font-bold">Seed Phrase</h3>
                      <div className="flex gap-2">
                        <Button onClick={copyPhrase} size="sm" variant="ghost">
                          {copiedPhrase ? <CheckCircle2 className="w-4 h-4 text-[#ff4d4d]" /> : <Copy className="w-4 h-4" />}
                        </Button>
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
                            <div key={i} className="bg-black/60 border border-[#ff4d4d]/25 rounded px-2 py-1 text-white text-sm font-mono">
                              {i + 1}. {word}
                            </div>
                          ))}
                        </div>
                        <div className="bg-[#ff4d4d]/10 border border-[#ff4d4d]/40 rounded-lg p-3">
                          <p className="text-xs text-[#ff8080]">⚠️ Save securely. Never share.</p>
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
                <Card className={`${glassCard}`}>
                  <CardHeader className="border-b border-[#ff4d4d]/20">
                    <h3 className="text-white font-bold">Seed Phrase</h3>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="text-center py-8">
                      <Shield className="w-12 h-12 text-gray-700 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm mb-3">Seed phrase not stored in this session</p>
                      <p className="text-gray-600 text-xs mb-4">Re-import your wallet to view your seed phrase</p>
                      <div className="bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 rounded-lg p-4 mt-4 text-left">
                        <p className="text-[#ff8080] text-xs font-semibold mb-2">⚠️ Can you still send funds?</p>
                        <p className="text-gray-400 text-xs leading-relaxed">
                          {localStorage.getItem('ttt_wallet_pk') 
                            ? "✅ Yes - Private key cached. You can send transactions." 
                            : "❌ No - You need your seed phrase to send funds. Without it, funds cannot be recovered."}
                        </p>
                        {!localStorage.getItem('ttt_wallet_pk') && (
                          <div className="mt-3 pt-3 border-t border-[#ff4d4d]/20">
                            <p className="text-[#ff4d4d] text-xs font-semibold mb-1">🚨 CRITICAL</p>
                            <p className="text-gray-400 text-xs">Without the seed phrase, these funds are permanently inaccessible. Always backup your seed phrase when creating a wallet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* KRC-20 Send Sheet */}
        <AnimatePresence>
          {krc20SendToken && (() => {
            // Try terra_wallets first, then fall back to this page's own credentials
            const wallets = JSON.parse(localStorage.getItem('terra_wallets') || '[]');
            const terraW = wallets.find(w => {
              const wAddr = w.address?.replace('kaspa:', '');
              const curAddr = address?.replace('kaspa:', '');
              return wAddr === curAddr && w.mnemonic;
            });
            const storedPK = localStorage.getItem('ttt_wallet_pk');
            const activeWalletObj = terraW
              ? { address: terraW.address, mnemonic: terraW.mnemonic }
              : { address, mnemonic: mnemonic || null, privateKey: storedPK || null };
            return (
              <KRC20SendSheet
                token={krc20SendToken}
                activeWallet={activeWalletObj}
                onClose={() => setKrc20SendToken(null)}
                onBalanceUpdate={() => fetchBalance(address)}
              />
            );
          })()}
        </AnimatePresence>

        {/* Footer */}
        <div className="mt-10 flex items-center justify-between text-white/70">
          <a href="https://tttz.xyz" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
            <div className="w-8 h-8 rounded-full border border-white/40 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <div className="text-[10px] tracking-widest text-white/50">VISIT OUR WEBSITE</div>
              <div className="text-sm font-bold">tttz.xyz</div>
            </div>
          </a>
          <div className="flex items-center gap-2">
            <span className="text-[10px] tracking-widest">BUILT ON KASPA</span>
            <div className="w-8 h-8 rounded-full border border-white/40 flex items-center justify-center">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}