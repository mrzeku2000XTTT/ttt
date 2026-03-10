import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, Wallet, Loader2, X, Sparkles, AlertCircle, Smartphone } from "lucide-react";

const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
};

export default function FeedTipModal({ tippingPost, user, kaswareWallet, onClose, onSuccess }) {
  const [tipAmount, setTipAmount] = useState('');
  const [tipTokenType, setTipTokenType] = useState('KAS');
  const [tipKrc20Ticker, setTipKrc20Ticker] = useState('');
  const [isSendingTip, setIsSendingTip] = useState(false);
  const [tipError, setTipError] = useState('');
  const mobile = isMobileDevice();

  // On mobile, default to TTT wallet if available, else kasware
  const tttWalletAddress = user?.created_wallet_address || localStorage.getItem('ttt_wallet_address');
  const tttPrivateKey = localStorage.getItem('ttt_wallet_pk');
  const defaultMethod = mobile && tttWalletAddress ? 'ttt' : 'kasware';
  const [sendMethod, setSendMethod] = useState(defaultMethod);
  const [tipPin, setTipPin] = useState('');
  const [pinVerified, setPinVerified] = useState(false);
  const [pinError, setPinError] = useState('');
  const [tipMnemonic, setTipMnemonic] = useState('');
  const [showMnemonicFallback, setShowMnemonicFallback] = useState(false);
  const pinHash = localStorage.getItem('ttt_wallet_pin_hash');
  const hasPinSet = !!pinHash;
  // tttPrivateKey may be null on a different device even if wallet address exists in profile
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

    // TTT wallet KRC20 not supported natively yet
    if (sendMethod === 'ttt' && tipTokenType === 'KRC20') {
      setTipError('KRC-20 tips require Kasware on mobile. Switch to KAS or use Kasware.');
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

      if (sendMethod === 'ttt') {
        // Use Terra Protocol (TTT wallet backend)
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
        if (res.data?.error) {
          // If key mismatch detected, clear the stale cached key
          if (res.data?.key_mismatch) {
            localStorage.removeItem('ttt_wallet_pk');
          }
          throw new Error(res.data.error);
        }
        txId = res.data?.txId || 'ttt-tx';
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

      const senderWallet = sendMethod === 'ttt' ? tttWalletAddress : (kaswareWallet?.address || user?.created_wallet_address);
      const senderName = user?.username || (senderWallet ? `${senderWallet.slice(0, 8)}...` : 'Anonymous');
      const ticker = tipTokenType === 'KRC20' ? tipKrc20Ticker.toUpperCase() : 'KAS';

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

      // Update post tips
      if (tipTokenType === 'KRC20') {
        const currentKrc20 = tippingPost.krc20_tips_received || {};
        await base44.entities.Post.update(tippingPost.id, {
          krc20_tips_received: { ...currentKrc20, [tipKrc20Ticker.toUpperCase()]: (currentKrc20[tipKrc20Ticker.toUpperCase()] || 0) + tipAmountValue }
        });
      } else {
        await base44.entities.Post.update(tippingPost.id, {
          tips_received: (tippingPost.tips_received || 0) + tipAmountValue
        });
      }

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

      onSuccess({ tipAmountValue, txId, ticker, tippingPost, tipTokenType, tipKrc20Ticker });
      onClose();

    } catch (err) {
      console.error('Tip failed:', err);
      if (err.message?.includes('User reject')) setTipError('Transaction cancelled');
      else if (err.message?.includes('storage mass')) setTipError('⚠️ Storage mass error: Consolidate UTXOs in your wallet settings.');
      else setTipError('Failed to send tip: ' + err.message);
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

          {/* Send Method (mobile only) */}
          {mobile && (
            <div>
              <div className="text-xs text-white/50 mb-2">Send via</div>
              <div className="flex gap-2">
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
                {(kaswareWallet?.connected || window.kasware) && (
                  <Button
                    onClick={() => setSendMethod('kasware')}
                    size="sm"
                    className={`flex-1 ${sendMethod === 'kasware' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'}`}
                  >
                    Kasware
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Token Type (KRC20 only on kasware) */}
          <div className="flex gap-2">
            <Button
              onClick={() => { setTipTokenType('KAS'); setTipKrc20Ticker(''); }}
              size="sm"
              className={`flex-1 ${tipTokenType === 'KAS' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white'}`}
            >KAS</Button>
            {sendMethod === 'kasware' && (
              <Button
                onClick={() => setTipTokenType('KRC20')}
                size="sm"
                className={`flex-1 ${tipTokenType === 'KRC20' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white'}`}
              >KRC-20</Button>
            )}
          </div>

          {tipTokenType === 'KRC20' && (
            <div>
              <label className="text-sm text-white/60 mb-2 block">Token Ticker</label>
              <Input
                value={tipKrc20Ticker}
                onChange={e => setTipKrc20Ticker(e.target.value.toUpperCase())}
                placeholder="e.g., KSPR, LEGEND"
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
                {sendMethod === 'ttt'
                  ? 'Sent natively via your TTT Wallet (Terra Protocol) — no Kasware needed.'
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