import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Users, Zap, ExternalLink, Eye, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import BetLedgerModal from "@/components/kaching/BetLedgerModal";

// Crypto icons mapping — using CoinGecko CDN (no hotlink protection)
const CRYPTO_ICONS = {
  KAS: "https://assets.coingecko.com/coins/images/25751/small/kaspa-icon-exchanges.png",
  BTC: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  ETH: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  SOL: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
  BNB: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
  DOGE: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png",
  XRP: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png",
  HYPE: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/f10374e85_generated_image.png",
};

function CryptoIcon({ ticker, icon }) {
  const [failed, setFailed] = useState(false);
  if (icon && !failed) {
    return <img src={icon} alt={ticker} className="w-8 h-8 rounded-full ring-2 ring-white/10 bg-black object-contain" onError={() => setFailed(true)} />;
  }
  return <div className="w-8 h-8 rounded-full bg-violet-500/20 ring-2 ring-violet-500/20 flex items-center justify-center text-xs font-black text-violet-300">{(ticker || '?')[0]}</div>;
}

export default function LiveGameCard({ game, userBets, onBet }) {
  const [copied, setCopied] = useState(false);
  const [allBets, setAllBets] = useState([]);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const isOpen = game.status === 'open' && new Date(game.end_time) > new Date();
  const isSettled = game.status === 'settled';
  const myBets = userBets?.filter(b => b.game_id === game.id) || [];

  useEffect(() => {
    if (showLedgerModal || isSettled) {
      base44.entities.GameBet.filter({ game_id: game.id }, '-created_date', 50)
        .then(setAllBets).catch(() => {});
    }
  }, [game.id, showLedgerModal, isSettled, game.total_pool_kas]);

  const copyEscrow = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`kaspa:${game.escrow_address}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Escrow address copied');
  };

  const yesTotal = game.yes_pool_kas || 0;
  const noTotal = game.no_pool_kas || 0;
  const total = yesTotal + noTotal;
  const yesPct = total > 0 ? Math.round((yesTotal / total) * 100) : 50;

  const yesPacman = game.yes_pool_pacman || 0;
  const noPacman = game.no_pool_pacman || 0;
  const totalPacman = yesPacman + noPacman;

  // Extract price target from question
  const priceMatch = game.question?.match(/\$([0-9,.]+)/);
  const priceTarget = priceMatch ? priceMatch[1] : null;
  const ticker = game.subcategory || '?';
  const icon = CRYPTO_ICONS[ticker];

  const totalBettors = (game.yes_count || 0) + (game.no_count || 0);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="group relative rounded-2xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.08] hover:border-white/[0.14] transition-all duration-300 overflow-hidden"
      >
        {/* Subtle top accent */}
        {isOpen && <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />}

        <div className="p-4 space-y-3">
          {/* Top row: ticker + price target */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CryptoIcon ticker={ticker} icon={icon} />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-bold text-sm">{ticker}</span>
                  {priceTarget && <span className="text-white/30 text-xs">/ ${priceTarget}</span>}
                </div>
                <span className="text-white/20 text-[10px] font-mono">#{game.game_number}</span>
              </div>
            </div>

            {/* Pool info */}
            <div className="text-right">
              <div className="text-white/60 text-xs font-bold">{total.toFixed(2)} <span className="text-white/25">KAS</span></div>
              {totalPacman > 0 && (
                <div className="text-yellow-400/60 text-[10px] font-bold">{totalPacman.toLocaleString()} <span className="text-yellow-400/25">PACMAN</span></div>
              )}
              <div className="text-white/20 text-[10px]">{totalBettors} bet{totalBettors !== 1 ? 's' : ''}</div>
            </div>
          </div>

          {/* Question */}
          <p className="text-white/80 text-[13px] leading-relaxed font-medium">{game.question}</p>

          {/* Result banner for settled */}
          {isSettled && game.result && (
            <div className={`px-3 py-2 rounded-xl text-center text-xs font-black ${
              game.result === 'yes' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
              game.result === 'no' ? 'bg-red-500/15 text-red-400 border border-red-500/20' :
              'bg-white/5 text-white/40 border border-white/10'
            }`}>
              {game.result === 'yes' ? `✓ YES — ${game.yes_label}` : game.result === 'no' ? `✓ NO — ${game.no_label}` : 'PUSH — All Refunded'}
            </div>
          )}

          {/* Odds bar */}
          <div>
            <div className="flex items-center gap-0.5 h-2 rounded-full overflow-hidden bg-white/[0.04]">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-l-full transition-all duration-700" style={{ width: `${yesPct}%` }} />
              <div className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-r-full transition-all duration-700" style={{ width: `${100 - yesPct}%` }} />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-emerald-400 text-[11px] font-bold">YES {yesPct}¢ <span className="text-white/15 font-normal">· {yesTotal.toFixed(1)} KAS{yesPacman > 0 ? ` · ${yesPacman.toLocaleString()} PAC` : ''}</span></span>
              <span className="text-rose-400 text-[11px] font-bold">NO {100 - yesPct}¢ <span className="text-white/15 font-normal">· {noTotal.toFixed(1)} KAS{noPacman > 0 ? ` · ${noPacman.toLocaleString()} PAC` : ''}</span></span>
            </div>
          </div>

          {/* My bets */}
          {myBets.length > 0 && (
            <div className="space-y-1">
              {myBets.map(bet => (
                <div key={bet.id} className={`px-3 py-1.5 rounded-lg flex items-center justify-between text-[11px] ${
                  bet.status === 'won' ? 'bg-emerald-500/10 border border-emerald-500/15' :
                  bet.status === 'lost' ? 'bg-red-500/10 border border-red-500/15' :
                  'bg-white/[0.04] border border-white/[0.06]'
                }`}>
                  <span>
                    <span className="text-white/40">You: </span>
                    <span className={bet.side === 'yes' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {bet.side.toUpperCase()} · {bet.amount_kas} KAS{(bet.amount_pacman || 0) > 0 ? ` + ${bet.amount_pacman} PAC` : ''}
                    </span>
                  </span>
                  <span className={
                    bet.status === 'won' ? 'text-emerald-400 font-bold' :
                    bet.status === 'lost' ? 'text-red-400 font-bold' :
                    bet.status === 'confirmed' ? 'text-blue-400' : 'text-amber-400'
                  }>
                    {bet.status === 'won' ? `+${bet.payout_kas?.toFixed(2)}` : bet.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Bet buttons */}
          {isOpen && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => onBet(game, 'yes')}
                className="group/btn relative py-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-200 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                <span className="relative text-emerald-400 text-base font-black block">YES</span>
                <span className="relative text-emerald-400/40 text-[10px] block mt-0.5">{game.yes_label}</span>
              </button>
              <button
                onClick={() => onBet(game, 'no')}
                className="group/btn relative py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 transition-all duration-200 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-rose-500/5 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                <span className="relative text-rose-400 text-base font-black block">NO</span>
                <span className="relative text-rose-400/40 text-[10px] block mt-0.5">{game.no_label}</span>
              </button>
            </div>
          )}

          {/* Footer: escrow + ledger */}
          <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
            <button onClick={copyEscrow} className="flex items-center gap-1 text-white/15 hover:text-white/30 transition-colors text-[9px] font-mono">
              Escrow: {game.escrow_address?.slice(0, 8)}...
              {copied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
            </button>
            <button
              onClick={() => setShowLedgerModal(true)}
              className="flex items-center gap-1 text-white/20 hover:text-white/40 transition-colors text-[10px]"
            >
              <Eye className="w-3 h-3" />
              Ledger
            </button>
          </div>
        </div>
      </motion.div>

      <BetLedgerModal
        show={showLedgerModal}
        onClose={() => setShowLedgerModal(false)}
        game={game}
        bets={allBets}
      />
    </>
  );
}