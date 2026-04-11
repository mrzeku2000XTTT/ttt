import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Loader2, Zap, CheckCircle, ExternalLink, Wallet, AlertTriangle, Coins } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

const PACMAN_LOGO = "https://assets.coingecko.com/coins/images/39498/small/PACMAN_LOGO.png";

export default function BetModal({ game, side, walletAddress, onClose, onSuccess }) {
  const [step, setStep] = useState('amount');
  const [kasAmount, setKasAmount] = useState("");
  const [pacmanAmount, setPacmanAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifiedData, setVerifiedData] = useState(null);
  const [activeWallet, setActiveWallet] = useState(null);
  const [walletBalance, setWalletBalance] = useState(null);
  const [pacmanBalance, setPacmanBalance] = useState(null);
  const [sendStatus, setSendStatus] = useState("");

  useEffect(() => {
    try {
      const wallets = JSON.parse(localStorage.getItem('terra_wallets') || '[]');
      const linked = localStorage.getItem('kaching_linked_wallet');
      const w = linked
        ? wallets.find(w => w.address === linked && w.mnemonic)
        : wallets.find(w => w.mnemonic);
      
      if (w) {
        setActiveWallet(w);
        fetchBalance(w.address);
        fetchPacmanBalance(w.address);
      } else {
        const tttAddr = localStorage.getItem('ttt_wallet_address');
        const tttPk = localStorage.getItem('ttt_wallet_pk');
        if (tttAddr && tttPk) {
          setActiveWallet({ address: tttAddr, privateKey: tttPk });
          fetchBalance(tttAddr);
          fetchPacmanBalance(tttAddr);
        }
      }
    } catch {}
  }, []);

  const fetchBalance = async (addr) => {
    try {
      const clean = addr.replace('kaspa:', '');
      const res = await fetch(`https://api.kaspa.org/addresses/kaspa:${clean}/balance`);
      if (res.ok) {
        const data = await res.json();
        setWalletBalance((data.balance || 0) / 1e8);
      }
    } catch {}
  };

  const fetchPacmanBalance = async (addr) => {
    try {
      const clean = addr.startsWith('kaspa:') ? addr : `kaspa:${addr}`;
      const res = await fetch(`https://api.kasplex.org/v1/krc20/address/${clean}/token/PACMAN`);
      if (res.ok) {
        const data = await res.json();
        const result = data?.result?.[0];
        if (result?.balance) {
          setPacmanBalance(parseInt(result.balance) / (10 ** (parseInt(result.dec) || 8)));
        } else {
          setPacmanBalance(0);
        }
      }
    } catch { setPacmanBalance(0); }
  };

  const escrowFull = game.escrow_address?.startsWith('kaspa:')
    ? game.escrow_address
    : `kaspa:${game.escrow_address}`;

  const handlePlaceBet = async () => {
    const kasAmt = parseFloat(kasAmount) || 0;
    const pacAmt = parseFloat(pacmanAmount) || 0;
    if (kasAmt < 0.1) { toast.error('Min KAS bet: 0.1'); return; }
    if (!activeWallet) { toast.error('No wallet found — import in Terra first'); return; }
    if (walletBalance !== null && kasAmt > walletBalance) { toast.error('Insufficient KAS balance'); return; }
    if (pacAmt > 0 && pacmanBalance !== null && pacAmt > pacmanBalance) { toast.error('Insufficient PACMAN balance'); return; }

    setLoading(true);
    setStep('sending');

    try {
      // Step 1: Send KAS to escrow
      setSendStatus('Sending KAS...');
      const txPayload = {
        fromAddress: activeWallet.address,
        toAddress: escrowFull,
        amountKas: kasAmt,
      };
      if (activeWallet.mnemonic) txPayload.mnemonic = activeWallet.mnemonic;
      else if (activeWallet.privateKey) txPayload.privateKey = activeWallet.privateKey;
      else throw new Error('No signing key available');

      const txRes = await base44.functions.invoke('sendKaspaTransaction', txPayload);
      if (txRes.data?.error) throw new Error(txRes.data.error);
      const kasTxHash = txRes.data.txId || '';
      if (!kasTxHash) throw new Error('No KAS transaction ID returned');
      toast.success('KAS sent!');

      // Step 2: Send PACMAN KRC-20 to escrow (if any)
      let pacmanTxHash = '';
      if (pacAmt > 0) {
        setSendStatus('Sending PACMAN tokens...');
        try {
          const krc20Payload = {
            action: 'transfer',
            fromAddress: activeWallet.address,
            toAddress: escrowFull,
            amount: pacAmt.toString(),
            ticker: 'PACMAN',
            decimals: 8,
          };
          if (activeWallet.mnemonic) krc20Payload.mnemonic = activeWallet.mnemonic;
          else if (activeWallet.privateKey) krc20Payload.privateKey = activeWallet.privateKey;

          const krc20Res = await base44.functions.invoke('krc20Transfer', krc20Payload);
          const krc20Data = krc20Res.data || krc20Res;
          if (krc20Data?.success) {
            pacmanTxHash = krc20Data.commitTxId || '';
            toast.success('PACMAN sent!');
          } else {
            console.warn('KRC20 transfer issue:', krc20Data?.error);
            toast.warning('PACMAN transfer failed — KAS bet still placed');
          }
        } catch (krc20Err) {
          console.warn('KRC20 transfer error:', krc20Err.message);
          toast.warning('PACMAN transfer failed — KAS bet still placed');
        }
      }

      // Step 3: Verify on-chain
      setSendStatus('Verifying on blockchain...');
      setStep('verifying');

      let verifyRes = null;
      let lastErr = '';
      for (let attempt = 0; attempt < 5; attempt++) {
        const waitMs = 5000 + attempt * 3000;
        await new Promise(r => setTimeout(r, waitMs));
        try {
          const res = await base44.functions.invoke('kachingPlaceBet', {
            game_id: game.id,
            side,
            tx_hash_in: kasTxHash,
            pacman_amount: pacAmt > 0 ? pacAmt : undefined,
            tx_hash_pacman_in: pacmanTxHash || undefined,
          });
          if (res.data?.success) { verifyRes = res; break; }
          lastErr = res.data?.error || 'Verification failed';
          if (lastErr.includes('already been used')) break;
        } catch (e) {
          lastErr = e.message || 'Verification request failed';
        }
      }

      if (!verifyRes?.data?.success) throw new Error(lastErr || 'TX not confirmed after retries');

      setVerifiedData({ ...verifyRes.data, tx_hash_in: kasTxHash, tx_hash_pacman_in: pacmanTxHash });
      setStep('done');
      toast.success('Bet placed & verified!');
      fetchBalance(activeWallet.address);
      if (pacAmt > 0) fetchPacmanBalance(activeWallet.address);

      setTimeout(() => { onSuccess?.(); onClose(); }, 2500);
    } catch (err) {
      const msg = err.message || 'Transaction failed';
      if (msg.includes('storage mass')) toast.error('Storage mass error — consolidate UTXOs');
      else if (msg.includes('false stack') || msg.includes('signature')) toast.error('Key expired — reimport wallet');
      else toast.error(msg);
      setStep('amount');
    } finally {
      setLoading(false);
      setSendStatus('');
    }
  };

  const isYes = side === 'yes';
  const kasPool = (game.yes_pool_kas || 0) + (game.no_pool_kas || 0);
  const kasSidePool = side === 'yes' ? (game.yes_pool_kas || 0) : (game.no_pool_kas || 0);
  const pacPool = (game.yes_pool_pacman || 0) + (game.no_pool_pacman || 0);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90] flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-zinc-950 border border-white/10 rounded-2xl p-5 w-full max-w-sm"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`px-2.5 py-1 rounded-lg text-xs font-black ${
              isYes ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'bg-red-500/15 text-red-400 border border-red-500/25'
            }`}>{side.toUpperCase()}</div>
            <span className="text-white/30 text-[10px] font-mono">#{game.game_number}</span>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <p className="text-white text-sm font-bold mb-1">{game.question}</p>
        <p className="text-white/30 text-[10px] mb-4">{isYes ? game.yes_label : game.no_label}</p>

        {/* No wallet */}
        {!activeWallet && step === 'amount' && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-xs font-bold">No Wallet Found</span>
            </div>
            <p className="text-amber-300/60 text-[10px]">Import or create a wallet in Terra first.</p>
          </div>
        )}

        {/* STEP: Enter amount */}
        {step === 'amount' && activeWallet && (
          <div className="space-y-3">
            {/* Wallet info */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl">
              <Wallet className="w-3.5 h-3.5 text-emerald-400/60" />
              <span className="text-white/40 text-[10px] font-mono truncate flex-1">{activeWallet.address?.slice(0, 24)}...</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                {walletBalance !== null && (
                  <span className="text-emerald-400 text-[10px] font-bold">{walletBalance.toFixed(2)} KAS</span>
                )}
              </div>
            </div>

            {/* KAS Amount */}
            <div>
              <div className="relative">
                <input
                  type="number"
                  value={kasAmount}
                  onChange={e => setKasAmount(e.target.value)}
                  placeholder="Amount in KAS (min 0.1)"
                  className="w-full bg-black/30 border border-white/[0.08] focus:border-emerald-500/40 rounded-xl px-4 py-3 text-white text-lg font-bold pr-16 focus:outline-none transition-colors"
                  autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-sm font-bold">KAS</span>
              </div>
              <div className="flex gap-1.5 mt-2">
                {[1, 5, 10, 25, 50, 100].map(v => (
                  <button key={v} onClick={() => setKasAmount(v.toString())}
                    className="flex-1 py-2 bg-white/[0.03] hover:bg-emerald-500/10 border border-white/[0.06] hover:border-emerald-500/20 rounded-lg text-xs text-white/40 hover:text-emerald-300 font-bold transition-all"
                  >{v}</button>
                ))}
              </div>
            </div>

            {/* PACMAN Amount */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <img src={PACMAN_LOGO} alt="PACMAN" className="w-4 h-4 rounded-full" onError={e => e.target.style.display = 'none'} />
                <span className="text-yellow-400/80 text-[10px] font-bold uppercase tracking-wider">PACMAN (Optional)</span>
                {pacmanBalance !== null && (
                  <span className="text-yellow-400/50 text-[10px] ml-auto">Balance: {pacmanBalance.toLocaleString()}</span>
                )}
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={pacmanAmount}
                  onChange={e => setPacmanAmount(e.target.value)}
                  placeholder="PACMAN amount (optional)"
                  className="w-full bg-black/30 border border-yellow-500/10 focus:border-yellow-500/40 rounded-xl px-4 py-2.5 text-white text-sm font-bold pr-24 focus:outline-none transition-colors"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-yellow-400/30 text-xs font-bold">PACMAN</span>
              </div>
              <div className="flex gap-1.5 mt-1.5">
                {[10, 50, 100, 500, 1000].map(v => (
                  <button key={v} onClick={() => setPacmanAmount(v.toString())}
                    className="flex-1 py-1.5 bg-white/[0.02] hover:bg-yellow-500/10 border border-white/[0.04] hover:border-yellow-500/20 rounded-lg text-[10px] text-white/30 hover:text-yellow-300 font-bold transition-all"
                  >{v >= 1000 ? `${v/1000}K` : v}</button>
                ))}
              </div>
            </div>

            {/* Potential payout */}
            {parseFloat(kasAmount) > 0 && (
              <div className="px-3 py-2 bg-white/[0.02] border border-white/[0.05] rounded-xl space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-white/30">KAS payout if win:</span>
                  <span className="text-emerald-400 font-bold">
                    {(() => {
                      const newPool = kasPool + parseFloat(kasAmount);
                      const newSidePool = kasSidePool + parseFloat(kasAmount);
                      const share = newSidePool > 0 ? (parseFloat(kasAmount) / newSidePool) * newPool : 0;
                      return share.toFixed(2);
                    })()} KAS
                  </span>
                </div>
                {parseFloat(pacmanAmount) > 0 && (
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-white/30">PACMAN payout if win:</span>
                    <span className="text-yellow-400 font-bold">
                      {(() => {
                        const pacSidePool = (side === 'yes' ? (game.yes_pool_pacman || 0) : (game.no_pool_pacman || 0)) + parseFloat(pacmanAmount);
                        const newPacPool = pacPool + parseFloat(pacmanAmount);
                        const share = pacSidePool > 0 ? (parseFloat(pacmanAmount) / pacSidePool) * newPacPool : 0;
                        return Math.round(share).toLocaleString();
                      })()} PACMAN
                    </span>
                  </div>
                )}
                <p className="text-white/15 text-[8px]">0% fee · Peer-to-peer · Losers pay winners</p>
              </div>
            )}

            <button
              onClick={handlePlaceBet}
              disabled={loading || !parseFloat(kasAmount) || parseFloat(kasAmount) < 0.1}
              className={`w-full py-3.5 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
                isYes
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/20'
              } disabled:opacity-30`}
            >
              <Zap className="w-4 h-4" />
              Place {kasAmount || '0'} KAS{parseFloat(pacmanAmount) > 0 ? ` + ${pacmanAmount} PACMAN` : ''} on {side.toUpperCase()}
            </button>

            <p className="text-white/15 text-[8px] text-center">
              Sends KAS + PACMAN natively from your wallet · Verified on Kaspa blockchain
            </p>
          </div>
        )}

        {/* Sending */}
        {step === 'sending' && (
          <div className="flex flex-col items-center py-8 gap-3">
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
            <p className="text-white font-bold text-sm">{sendStatus || 'Sending...'}</p>
            <p className="text-white/30 text-[10px]">Signing from your native wallet</p>
          </div>
        )}

        {/* Verifying */}
        {step === 'verifying' && (
          <div className="flex flex-col items-center py-8 gap-3">
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
            <p className="text-white font-bold text-sm">Verifying on-chain...</p>
            <p className="text-white/30 text-[10px]">Confirming on Kaspa blockchain</p>
          </div>
        )}

        {/* Done */}
        {step === 'done' && verifiedData && (
          <div className="space-y-3">
            <div className="flex flex-col items-center py-4 gap-2">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
              <p className="text-white font-bold text-sm">Bet Placed!</p>
            </div>
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/30 text-[8px] uppercase tracking-wider">KAS Amount</p>
                  <p className="text-white font-bold text-sm">{verifiedData.amount_kas} KAS</p>
                </div>
                <div className="text-right">
                  <p className="text-white/30 text-[8px] uppercase tracking-wider">Side</p>
                  <p className={`font-black text-sm ${isYes ? 'text-emerald-400' : 'text-red-400'}`}>{side.toUpperCase()}</p>
                </div>
              </div>
              {(verifiedData.pacman_amount || parseFloat(pacmanAmount)) > 0 && (
                <div className="flex items-center gap-2 pt-1 border-t border-white/[0.04]">
                  <Coins className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-yellow-400 text-xs font-bold">{verifiedData.pacman_amount || pacmanAmount} PACMAN</span>
                </div>
              )}
              {verifiedData.tx_hash_in && (
                <div>
                  <p className="text-white/30 text-[8px] uppercase tracking-wider">KAS TX</p>
                  <a href={`https://explorer.kaspa.org/txs/${verifiedData.tx_hash_in}`} target="_blank" rel="noopener noreferrer"
                    className="text-blue-400/60 text-[9px] font-mono truncate flex items-center gap-1 hover:text-blue-400">
                    {verifiedData.tx_hash_in}
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}