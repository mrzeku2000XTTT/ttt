import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, Wallet, Loader2, X, Sparkles, AlertCircle, Smartphone, Globe, Castle } from "lucide-react";

const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  const isTouchDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isIPadPro = /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
  const isNarrowScreen = window.innerWidth < 1024;
  return isTouchDevice || isIPadPro || isNarrowScreen;
};

function loadTerraWallets() {
  try {
    const raw = JSON.parse(localStorage.getItem('terra_wallets') || '[]');
    return raw.filter(w => w.address && w.mnemonic);
  } catch { return []; }
}

export default function FeedTipModal({ tippingPost, user, kaswareWallet, onClose, onSuccess }) {
  const [tipAmount, setTipAmount] = useState('');
  const [tipTokenType, setTipTokenType] = useState('KAS');
  const [tipKrc20Ticker, setTipKrc20Ticker] = useState('');
  const [isSendingTip, setIsSendingTip] = useState(false);
  const [tipError, setTipError] = useState('');
  const mobile = isMobileDevice();

  // Detect Kasware availability + TTT wallet + Terra wallets
  const tttWalletAddress = user?.created_wallet_address || localStorage.getItem('ttt_wallet_address');
  const tttPrivateKey = localStorage.getItem('ttt_wallet_pk');
  const hasKasware = typeof window !== 'undefined' && !!window.kasware;
  const hasKastle = typeof window !== 'undefined' && !!window.kastle;
  const terraWallets = loadTerraWallets();
  const hasTerra = terraWallets.length > 0;
  const [selectedTerraIdx, setSelectedTerraIdx] = useState(0);

  // Auto-default priority: Terra > TTT > Kasware > Kastle
  const defaultMethod = hasTerra ? 'terra' : (!hasKasware && !hasKastle && tttWalletAddress) ? 'ttt' : hasKasware ? 'kasware' : hasKastle ? 'kastle' : 'ttt';
  const [sendMethod, setSendMethod] = useState(defaultMethod);
  const [tipPin, setTipPin] = useState('');
  const [pinVerified, setPinVerified] = useState(false);
  const [pinError, setPinError] = useState('');
  const [tipMnemonic, setTipMnemonic] = useState('');
  const [showMnemonicFallback, setShowMnemonicFallback] = useState(false);
  const pinHash = localStorage.getItem('ttt_wallet_pin_hash');
  const hasPinSet = !!pinHash;
  const tttPrivateKeyMissing = !tttPrivateKey && sendMethod === 'ttt';

  const verifyPin = async () => {
    if (tipPin.length !== 6) { setPinError('Enter 6-digit PIN'); return; }
    const res = await base44.functions.invoke('hashPin', { pin: tipPin });
    if (res.data?.hash === pinHash) {
      setPinVerified(true);
      setPinError('');
    } else {
      setPinError('Incorrect PIN');
    }
  };

  const handleSend = async () => {
    if (!tipAmount || isNaN(parseFloat(tipAmount)) || parseFloat(tipAmount) <= 0) {
      setTipError('Enter a valid amount');
      return;
    }
    if (tipTokenType === 'KRC20' && !tipKrc20Ticker.trim()) {
      setTipError('Enter a token ticker');
      return;
    }

    // Terra wallet validation
    if (sendMethod === 'terra' && (!terraWallets[selectedTerraIdx]?.mnemonic)) {
      setTipError('Selected Terra wallet has no seed phrase. Import it in Terra first.');
      return;
    }

    // TTT wallet: need either cached PK or mnemonic as fallback
    if (sendMethod === 'ttt' && !tttPrivateKey && !tipMnemonic.trim()) {
      setTipError('Enter your seed phrase to authorize on this device.');
      return;
    }
    if (sendMethod === 'ttt' && tttPrivateKey && hasPinSet && !pinVerified) {
      setTipError('Please verify your PIN first.');
      return;
    }

    setIsSendingTip(true);
    setTipError('');

    try {
      const tipAmountValue = parseFloat(tipAmount);
      let txId;

      if (sendMethod === 'terra') {
        // Terra wallet — use mnemonic from terra_wallets
        const terraWallet = terraWallets[selectedTerraIdx];
        if (!terraWallet?.mnemonic) throw new Error('Terra wallet has no seed phrase');
        if (tipTokenType === 'KRC20') {
          const krcRes = await base44.functions.invoke('krc20Transfer', {
            action: 'transfer',
            fromAddress: terraWallet.address,
            toAddress: tippingPost.author_wallet_address,
            amount: String(tipAmountValue),
            ticker: tipKrc20Ticker.toUpperCase(),
            decimals: 8,
            mnemonic: terraWallet.mnemonic,
          });
          if (!krcRes.data?.success || krcRes.data?.error) throw new Error(krcRes.data?.error || 'KRC-20 transfer failed');
          txId = krcRes.data?.commitTxId || 'krc20-tx';
        } else {
          const res = await base44.functions.invoke('sendKaspaTransaction', {
            fromAddress: terraWallet.address,
            toAddress: tippingPost.author_wallet_address,
            amountKas: tipAmountValue,
            mnemonic: terraWallet.mnemonic,
          });
          if (!res.data?.success || res.data?.error) throw new Error(res.data?.error || 'Transaction failed');
          txId = res.data?.txId || 'terra-tx';
        }
      } else if (sendMethod === 'ttt') {
        if (tipTokenType === 'KRC20') {
          const krc20Payload = {
            action: 'transfer',
            fromAddress: tttWalletAddress,
            toAddress: tippingPost.author_wallet_address,
            amount: String(tipAmountValue),
            ticker: tipKrc20Ticker.toUpperCase(),
            decimals: 8,
          };
          if (tttPrivateKey) {
            krc20Payload.privateKey = tttPrivateKey;
          } else {
            krc20Payload.mnemonic = tipMnemonic.trim();
          }
          const krcRes = await base44.functions.invoke('krc20Transfer', krc20Payload);
          if (!krcRes.data?.success || krcRes.data?.error) throw new Error(krcRes.data?.error || 'KRC-20 transfer failed');
          txId = krcRes.data?.commitTxId || 'krc20-tx';
        } else {
          const txPayload = {
            fromAddress: tttWalletAddress,
            toAddress: tippingPost.author_wallet_address,
            amountKas: tipAmountValue,
          };
          if (tttPrivateKey) {
            txPayload.privateKey = tttPrivateKey;
          } else {
            txPayload.mnemonic = tipMnemonic.trim();
          }
          const res = await base44.functions.invoke('sendKaspaTransaction', txPayload);
          if (!res.data?.success || res.data?.error) throw new Error(res.data?.error || 'Transaction failed');
          txId = res.data?.txId || 'ttt-tx';
        }
      } else if (sendMethod === 'kastle') {
        // Kastle wallet extension (KAS only — KRC-20 needs a backend commit/reveal flow)
        if (tipTokenType === 'KRC20') {
          throw new Error('Kastle does not support KRC-20 tipping yet. Use Kasware, Terra, or TTT Wallet for KRC-20.');
        }
        if (!window.kastle) throw new Error('Kastle wallet extension not detected');
        try {
          await window.kastle.request?.('kas:connect');
        } catch { /* may already be connected */ }
        txId = await window.kastle.sendKaspa(
          tippingPost.author_wallet_address,
          Math.floor(tipAmountValue * 1e8)
        );
      } else {
        // Kasware
        if (tipTokenType === 'KRC20') {
          const krc20Data = {
            p: 'krc-20', op: 'transfer',
            tick: tipKrc20Ticker.toUpperCase(),
            amt: (tipAmountValue * 1e8).toString(),
            to: tippingPost.author_wallet_address
          };
          txId = await window.kasware.signKRC20Transaction(
            JSON.stringify(krc20Data), 4, tippingPost.author_wallet_address, 0.0002
          );
        } else {
          txId = await window.kasware.sendKaspa(
            tippingPost.author_wallet_address,
            Math.floor(tipAmountValue * 1e8)
          );
        }
      }

      const senderWallet = sendMethod === 'terra' ? terraWallets[selectedTerraIdx]?.address : sendMethod === 'ttt' ? tttWalletAddress : sendMethod === 'kastle' ? (kaswareWallet?.address || user?.created_wallet_address || 'kastle') : (kaswareWallet?.address || user?.created_wallet_address);
      const senderName = user?.username || (senderWallet ? `${senderWallet.slice(0, 8)}...` : 'Anonymous');
      const ticker = tipTokenType === 'KRC20' ? tipKrc20Ticker.toUpperCase() : 'KAS';

      // Bookkeeping below must NEVER fail the tip — the KAS is already sent.
      // Guests (no email login) may not have permission for some of these.
      try {
      // Record tip transaction
      await base44.entities.TipTransaction.create({
        sender_wallet: senderWallet,
        sender_email: user?.email || null,
        sender_name: senderName,
        recipient_wallet: tippingPost.author_wallet_address,
        recipient_email: tippingPost.created_by || null,
        recipient_name: tippingPost.author_name,
        amount: tipAmountValue,
        token_type: tipTokenType,
        krc20_ticker: tipTokenType === 'KRC20' ? tipKrc20Ticker.toUpperCase() : null,
        tx_hash: txId,
        post_id: tippingPost.id,
        source: 'feed'
      });

      // Update post tips via service-role function (tipper isn't the post author,
      // so a direct Post.update is blocked by RLS — "Permission denied").
      await base44.functions.invoke('incrementPostTips', {
        postId: tippingPost.id,
        amount: tipAmountValue,
        tokenType: tipTokenType,
        ticker: tipTokenType === 'KRC20' ? tipKrc20Ticker.toUpperCase() : null,
      });

      // Track tip stats
      if (tipTokenType === 'KAS') {
        const senderId = user?.email || senderWallet;
        if (senderId) {
          const sStats = user?.email
            ? await base44.entities.UserTipStats.filter({ user_email: user.email })
            : await base44.entities.UserTipStats.filter({ wallet_address: senderWallet });
          if (sStats.length > 0) {
            await base44.entities.UserTipStats.update(sStats[0].id, { feed_tips_sent: (sStats[0].feed_tips_sent || 0) + tipAmountValue });
          } else {
            await base44.entities.UserTipStats.create({ user_email: user?.email || null, wallet_address: senderWallet, username: senderName, feed_tips_sent: tipAmountValue, feed_tips_received: 0, bull_tips_sent: 0, bull_tips_received: 0 });
          }
        }
        const recipientId = tippingPost.created_by || tippingPost.author_wallet_address;
        if (recipientId) {
          const rStats = tippingPost.created_by
            ? await base44.entities.UserTipStats.filter({ user_email: tippingPost.created_by })
            : await base44.entities.UserTipStats.filter({ wallet_address: tippingPost.author_wallet_address });
          if (rStats.length > 0) {
            await base44.entities.UserTipStats.update(rStats[0].id, { feed_tips_received: (rStats[0].feed_tips_received || 0) + tipAmountValue });
          } else {
            await base44.entities.UserTipStats.create({ user_email: tippingPost.created_by || null, wallet_address: tippingPost.author_wallet_address, username: tippingPost.author_name, feed_tips_sent: 0, feed_tips_received: tipAmountValue, bull_tips_sent: 0, bull_tips_received: 0 });
          }
        }
      }
      } catch (bookkeepingErr) {
        console.warn('Tip sent OK, but recording stats failed (guest?):', bookkeepingErr);
      }

      onSuccess({ tipAmountValue, txId, ticker, tippingPost, tipTokenType, tipKrc20Ticker });
      onClose();

    } catch (err) {
      console.error('Tip failed:', err);
      const status = err.response?.status;
      const errMsg = err.response?.data?.error || err.message || 'Unknown error';
      if (status === 404 || errMsg.includes('status code 404') || errMsg.includes('Deployment does not exist')) {
        setTipError('⚠️ Tip service is temporarily offline. Please try again in a moment.');
      } else if (errMsg.includes('User reject') || errMsg.includes('user rejected')) {
        setTipError('Transaction cancelled by user.');
      } else if (errMsg.includes('storage mass')) {
        // Only show compound advice for actual storage-mass (UTXO fragmentation) errors.
        // Fee-rejection errors from KRC-20 commit/reveal are NOT this — show the real error.
        const fixPath = sendMethod === 'terra'
          ? 'Terra → Manage → Compound UTXOs'
          : sendMethod === 'ttt'
          ? 'import your TTT seed phrase in Terra → Manage → Compound UTXOs'
          : 'your Kasware wallet';
        setTipError(`⚠️ Too many small UTXOs causing high fees. Go to ${fixPath}, then try again.`);
      } else if (errMsg.includes('false stack') || errMsg.includes('signature') || errMsg.includes('script execution')) {
        // Source-aware: never let a TTT Wallet failure point the user at Terra.
        if (sendMethod === 'terra') {
          setTipError("⚠️ Terra wallet key mismatch — the stored seed phrase doesn't match this address. Re-import it in Terra → Manage → Import Another Wallet.");
        } else if (sendMethod === 'ttt') {
          setTipError("⚠️ TTT Wallet key mismatch — your stored key doesn't match this address. Re-create or re-import your TTT wallet (Settings → Wallet) to fix this.");
        } else {
          setTipError("⚠️ Kasware key mismatch — reconnect your Kasware extension and try again.");
        }
      } else if (errMsg.includes('Insufficient balance') || errMsg.includes('insufficient')) {
        setTipError(`⚠️ ${errMsg}`);
      } else if (errMsg.includes('confirming') || errMsg.includes('already spent')) {
        setTipError('⚠️ Previous transaction still confirming. Please wait 10–15 seconds and try again.');
      } else if (errMsg.includes('No UTXOs') || errMsg.includes('balance may be 0')) {
        setTipError('⚠️ Wallet balance appears to be 0 or is still syncing. Check your balance in Terra and try again.');
      } else {
        setTipError(`Transaction failed: ${errMsg}`);
      }
    } finally {
      setIsSendingTip(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-black border border-white/20 rounded-xl w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Send Tip</h3>
              <p className="text-white/60 text-sm">to {tippingPost.author_name}</p>
            </div>
          </div>
          <Button onClick={onClose} variant="ghost" size="sm" className="text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <div className="text-xs text-white/60 mb-1">Recipient Wallet</div>
            <div className="text-white font-mono text-sm break-all">{tippingPost.author_wallet_address}</div>
          </div>

          {/* Send Method — show wallet choices */}
          {(tttWalletAddress || hasKasware || hasKastle || hasTerra) && (
            <div>
              <div className="text-xs text-white/50 mb-2">Send from</div>
              <div className="flex gap-2 flex-wrap">
                {hasTerra && (
                  <Button
                    onClick={() => setSendMethod('terra')}
                    size="sm"
                    className={`flex-1 flex items-center gap-1 ${sendMethod === 'terra' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'}`}
                  >
                    <Globe className="w-3 h-3" />
                    Terra
                  </Button>
                )}
                {tttWalletAddress && (
                  <Button
                    onClick={() => setSendMethod('ttt')}
                    size="sm"
                    className={`flex-1 flex items-center gap-1 ${sendMethod === 'ttt' ? 'bg-cyan-600 hover:bg-cyan-700 text-white' : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'}`}
                  >
                    <Smartphone className="w-3 h-3" />
                    TTT Wallet
                  </Button>
                )}
                {hasKasware && (
                  <Button
                    onClick={() => setSendMethod('kasware')}
                    size="sm"
                    className={`flex-1 ${sendMethod === 'kasware' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'}`}
                  >
                    Kasware
                  </Button>
                )}
                {hasKastle && (
                  <Button
                    onClick={() => setSendMethod('kastle')}
                    size="sm"
                    className={`flex-1 flex items-center gap-1 ${sendMethod === 'kastle' ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'}`}
                  >
                    <Castle className="w-3 h-3" />
                    Kastle
                  </Button>
                )}
              </div>
              {/* Terra wallet selector when multiple wallets exist */}
              {sendMethod === 'terra' && terraWallets.length > 1 && (
                <div className="mt-2 space-y-1">
                  {terraWallets.map((tw, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedTerraIdx(i)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-all ${
                        i === selectedTerraIdx
                          ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300'
                          : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10'
                      }`}
                    >
                      {tw.label || `Wallet ${i + 1}`}: {tw.address?.slice(0, 12)}...{tw.address?.slice(-6)}
                    </button>
                  ))}
                </div>
              )}
              {sendMethod === 'terra' && terraWallets.length === 1 && (
                <div className="mt-2 bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2">
                  <div className="text-[10px] text-blue-400 mb-0.5">{terraWallets[0].label || 'Terra Wallet'}</div>
                  <div className="text-xs text-white/60 font-mono">{terraWallets[0].address?.slice(0, 14)}...{terraWallets[0].address?.slice(-6)}</div>
                </div>
              )}
              {!hasKasware && !hasKastle && !tttWalletAddress && !hasTerra && (
                <p className="text-xs text-amber-400 mt-2">No wallet detected. Set up a wallet in Terra or install the Kasware/Kastle extension.</p>
              )}
            </div>
          )}

          {/* Token Type: KAS or KRC-20 */}
          <div className="flex gap-2">
            <Button
              onClick={() => { setTipTokenType('KAS'); setTipKrc20Ticker(''); }}
              size="sm"
              className={`flex-1 ${tipTokenType === 'KAS' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white'}`}
            >KAS</Button>
            <Button
              onClick={() => setTipTokenType('KRC20')}
              size="sm"
              className={`flex-1 ${tipTokenType === 'KRC20' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white'}`}
            >KRC-20</Button>
          </div>

          {tipTokenType === 'KRC20' && (
            <div>
              <label className="text-sm text-white/60 mb-2 block">Token Ticker</label>
              <Input
                value={tipKrc20Ticker}
                onChange={e => setTipKrc20Ticker(e.target.value.toUpperCase())}
                placeholder="e.g., PACMAN, NACHO"
                className="bg-white/5 border-white/10 text-white text-center h-10 font-semibold"
              />
            </div>
          )}

          <div>
            <label className="text-sm text-white/60 mb-2 block">
              Amount ({tipTokenType === 'KRC20' ? tipKrc20Ticker || 'Tokens' : 'KAS'})
            </label>
            <Input
              type="number" step="0.01" min="0.01"
              value={tipAmount}
              onChange={e => setTipAmount(e.target.value)}
              placeholder="0.5"
              className="bg-white/5 border-white/10 text-white text-lg text-center h-14"
              autoFocus={false}
            />
            {tipTokenType === 'KAS' && (
              <div className="flex gap-2 mt-2">
                {['0.5', '1', '5', '10'].map(a => (
                  <Button key={a} onClick={() => setTipAmount(a)} size="sm"
                    className="flex-1 bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white">
                    {a} KAS
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Case 1: PK exists on this device — verify with PIN */}
          {sendMethod === 'ttt' && tttPrivateKey && hasPinSet && !pinVerified && (
            <div>
              <label className="text-xs text-white/60 mb-1.5 block">Enter your wallet PIN to authorize</label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={tipPin}
                  onChange={e => { setTipPin(e.target.value.replace(/\D/g, '')); setPinError(''); }}
                  placeholder="6-digit PIN"
                  className="bg-white/5 border-white/10 text-white text-center tracking-widest"
                  autoFocus={false}
                />
                <Button onClick={verifyPin} size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white px-4">Verify</Button>
              </div>
              {pinError && <p className="text-xs text-red-400 mt-1">{pinError}</p>}
            </div>
          )}
          {sendMethod === 'ttt' && tttPrivateKey && hasPinSet && pinVerified && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 text-xs text-green-400 flex items-center gap-2">
              <span>✓</span> PIN verified — ready to send
            </div>
          )}

          {/* Case 2: No PK on this device — require seed phrase */}
          {sendMethod === 'ttt' && !tttPrivateKey && (
            <div className="space-y-2">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-xs text-yellow-300">
                ⚠️ Wallet key not found on this device. Enter your seed phrase to authorize.
              </div>
              <textarea
                value={tipMnemonic}
                onChange={e => setTipMnemonic(e.target.value)}
                placeholder="word1 word2 word3 ..."
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white font-mono text-sm min-h-[70px] resize-none outline-none focus:border-cyan-500/50"
                rows={3}
                autoFocus={false}
              />
            </div>
          )}

          {tipError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-xs text-red-400">{tipError}</p>
            </div>
          )}

          <Button
            onClick={handleSend}
            disabled={isSendingTip || !tipAmount || parseFloat(tipAmount) <= 0 || (tipTokenType === 'KRC20' && !tipKrc20Ticker.trim())}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 h-12 text-white font-bold"
          >
            {isSendingTip ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Sending...</>
            ) : (
              <><Wallet className="w-5 h-5 mr-2" />Send {tipAmount || ''} {tipTokenType === 'KRC20' ? tipKrc20Ticker : 'KAS'}</>
            )}
          </Button>

          <div className="space-y-2">
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-white/60">
                {sendMethod === 'terra'
                  ? 'Sent natively via your Terra wallet — no extensions needed.'
                  : sendMethod === 'ttt'
                  ? (tipTokenType === 'KRC20'
                    ? `Native KRC-20 transfer via TTT Wallet — no Kasware needed.`
                    : 'Sent natively via your TTT Wallet — no Kasware needed.')
                  : sendMethod === 'kastle'
                  ? 'Sent directly from your Kastle wallet extension instantly.'
                  : 'Tips are sent directly from your Kasware wallet instantly.'}
              </p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-300">Keep at least 5 KAS in your wallet to prevent storage mass errors.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}