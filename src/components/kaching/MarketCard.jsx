import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, Clock, Users, Zap } from "lucide-react";
import moment from "moment";

export default function MarketCard({ market, onSelect }) {
  const isOpen = market.status === 'open';
  const isLive = market.status === 'live';
  const isClosed = market.status === 'closed';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 border border-white/[0.06] backdrop-blur-sm hover:border-emerald-500/20 transition-all duration-300 cursor-pointer"
      onClick={() => isOpen && onSelect(market, 'yes')}
    >
      {isLive && <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent" />}
      {isOpen && <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex items-center gap-1 flex-shrink-0">
            {market.isEmoji ? (
              <span className="text-2xl">{market.icon_url}</span>
            ) : market.icon_url_2 ? (
              <div className="flex -space-x-2">
                <img src={market.icon_url_2} alt="" className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 object-contain p-0.5" />
                <img src={market.icon_url} alt="" className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 object-contain p-0.5" />
              </div>
            ) : market.icon_url ? (
              <img src={market.icon_url} alt="" className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 object-contain p-0.5" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-tight">{market.question}</p>
            {market.detail && (
              <p className="text-white/30 text-[10px] mt-1 truncate">{market.detail}</p>
            )}
          </div>
          <div className="flex-shrink-0">
            {isLive ? (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-red-500/15 border border-red-500/25 rounded-full">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-400 text-[9px] font-bold">LIVE</span>
              </div>
            ) : isClosed ? (
              <span className="text-white/20 text-[9px] font-bold uppercase px-2 py-0.5 bg-white/5 rounded-full">Closed</span>
            ) : (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                <span className="text-emerald-400/80 text-[9px] font-medium">Open</span>
              </div>
            )}
          </div>
        </div>

        {/* Score if live/closed */}
        {market.score && (
          <div className="mb-3 px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-center">
            <span className="text-white text-lg font-black tracking-wide">{market.score}</span>
            {market.result && (
              <span className={`ml-2 text-xs font-bold ${market.result === 'yes' ? 'text-emerald-400' : 'text-red-400'}`}>
                → {market.result === 'yes' ? market.yes_label : market.no_label}
              </span>
            )}
          </div>
        )}

        {/* Prediction buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); isOpen && onSelect(market, 'yes'); }}
            disabled={!isOpen}
            className={`relative py-3 px-3 rounded-xl border transition-all duration-200 text-center ${
              isOpen
                ? 'bg-emerald-500/8 border-emerald-500/20 hover:bg-emerald-500/15 hover:border-emerald-500/40'
                : 'bg-white/[0.02] border-white/[0.04] opacity-50'
            }`}
          >
            <span className="text-emerald-400 text-lg font-black block">{market.yes_price}¢</span>
            <span className="text-emerald-400/60 text-[9px] font-semibold uppercase tracking-wider block mt-0.5">Yes</span>
            {isClosed && market.result === 'yes' && (
              <div className="absolute inset-0 rounded-xl border-2 border-emerald-400/50 pointer-events-none" />
            )}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); isOpen && onSelect(market, 'no'); }}
            disabled={!isOpen}
            className={`relative py-3 px-3 rounded-xl border transition-all duration-200 text-center ${
              isOpen
                ? 'bg-red-500/8 border-red-500/20 hover:bg-red-500/15 hover:border-red-500/40'
                : 'bg-white/[0.02] border-white/[0.04] opacity-50'
            }`}
          >
            <span className="text-red-400 text-lg font-black block">{market.no_price}¢</span>
            <span className="text-red-400/60 text-[9px] font-semibold uppercase tracking-wider block mt-0.5">No</span>
            {isClosed && market.result === 'no' && (
              <div className="absolute inset-0 rounded-xl border-2 border-red-400/50 pointer-events-none" />
            )}
          </button>
        </div>

        {/* Footer meta */}
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-white/15" />
              <span className="text-white/20 text-[9px] font-medium">{market.volume?.toLocaleString()} KAS</span>
            </div>
            {market.tags?.[0] && (
              <span className="text-white/15 text-[8px] px-1.5 py-0.5 bg-white/[0.03] rounded-md font-medium">{market.tags[0]}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-white/15" />
            <span className="text-white/20 text-[9px]">
              {market.expires ? moment(market.expires).fromNow() : 'Today'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}