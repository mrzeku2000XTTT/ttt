import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, X, Loader2, TrendingUp } from "lucide-react";
import { base44 } from "@/api/base44Client";

const TOKENS = [
  { sym: "BTC", name: "Bitcoin", emoji: "₿", color: "#f7931a" },
  { sym: "ETH", name: "Ethereum", emoji: "Ξ", color: "#627eea" },
  { sym: "SOL", name: "Solana", emoji: "◎", color: "#14f195" },
  { sym: "XRP", name: "Ripple", emoji: "✕", color: "#23292f" },
  { sym: "DOGE", name: "Dogecoin", emoji: "Ð", color: "#c2a633" },
  { sym: "BNB", name: "BNB", emoji: "⬡", color: "#f3ba2f" },
  { sym: "ADA", name: "Cardano", emoji: "₳", color: "#0033ad" },
  { sym: "AVAX", name: "Avalanche", emoji: "△", color: "#e84142" },
  { sym: "LINK", name: "Chainlink", emoji: "⬡", color: "#2a5ada" },
  { sym: "DOT", name: "Polkadot", emoji: "●", color: "#e6007a" },
  { sym: "TON", name: "Toncoin", emoji: "💎", color: "#0098ea" },
  { sym: "LTC", name: "Litecoin", emoji: "Ł", color: "#345d9d" },
  { sym: "ATOM", name: "Cosmos", emoji: "⚛", color: "#2e3148" },
  { sym: "NEAR", name: "NEAR", emoji: "Ⓝ", color: "#00ec97" },
  { sym: "PEPE", name: "Pepe", emoji: "🐸", color: "#3d8c40" },
  { sym: "SHIB", name: "Shiba Inu", emoji: "🐕", color: "#f00500" },
];

export default function TokenExplorer() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const research = async (token) => {
    setActive(token);
    setReport(null);
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Give a fresh, friendly briefing on the cryptocurrency ${token.name} (${token.sym}) for someone taking a break from Kaspa. Include: 1) one-sentence what it is, 2) current approximate price in USD, 3) one notable recent development or narrative, 4) why it might be interesting right now. Keep it under 120 words, punchy and non-technical. No financial advice disclaimer needed.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            what: { type: "string" },
            price: { type: "string" },
            narrative: { type: "string" },
            why_now: { type: "string" },
          },
        },
      });
      setReport(res);
    } catch (e) {
      setReport({ what: "Couldn't fetch a briefing right now. Try another token.", price: "", narrative: "", why_now: "" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Right-side vertical button */}
      <button
        onClick={() => setOpen(true)}
        className="absolute z-50 flex flex-col items-center justify-center gap-1 px-2 py-4 rounded-l-xl border border-white/15 bg-black/50 backdrop-blur-md text-white/70 hover:text-white hover:border-cyan-400/50 transition-colors"
        style={{ right: 0, top: "50%", transform: "translateY(-50%)" }}
        title="Take a break from Kaspa · explore other tokens"
      >
        <Coins className="w-4 h-4 text-cyan-300" />
        <span className="text-[9px] font-mono tracking-[0.2em] uppercase writing-vertical">Tokens</span>
        <style>{`.writing-vertical{writing-mode:vertical-rl;text-orientation:mixed;}`}</style>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(12px)" }}
            onClick={() => { setOpen(false); setActive(null); setReport(null); }}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl overflow-hidden"
              style={{ background: "#05070a", border: "1px solid rgba(34,211,238,0.3)", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
            >
              <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid rgba(34,211,238,0.2)" }}>
                <Coins className="w-4 h-4" style={{ color: "#22d3ee" }} />
                <span className="text-[11px] tracking-[0.25em] uppercase flex-1" style={{ color: "#22d3ee" }}>
                  Take a break from Kaspa
                </span>
                <button onClick={() => { setOpen(false); setActive(null); setReport(null); }} className="p-1.5 rounded-md hover:bg-white/5 text-white/40">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-4 py-4 max-h-[70vh] overflow-y-auto">
                {!active && (
                  <>
                    <p className="text-white/40 text-[10px] uppercase tracking-widest mb-3">Pick a token to explore</p>
                    <div className="grid grid-cols-4 gap-2">
                      {TOKENS.map((t) => (
                        <button
                          key={t.sym}
                          onClick={() => research(t)}
                          className="flex flex-col items-center gap-1 py-3 rounded-lg border border-white/10 hover:border-white/30 hover:bg-white/5 transition-colors"
                        >
                          <span className="text-xl" style={{ color: t.color }}>{t.emoji}</span>
                          <span className="text-[10px] font-bold text-white">{t.sym}</span>
                          <span className="text-[8px] text-white/40 truncate w-full text-center px-1">{t.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {active && (
                  <div>
                    <button
                      onClick={() => { setActive(null); setReport(null); }}
                      className="text-[10px] uppercase tracking-widest text-cyan-300 hover:text-cyan-100 mb-3"
                    >
                      ← Back to tokens
                    </button>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl" style={{ color: active.color }}>{active.emoji}</span>
                      <div>
                        <div className="text-white font-bold text-base">{active.name}</div>
                        <div className="text-white/40 text-[10px] uppercase tracking-widest">${active.sym}</div>
                      </div>
                    </div>

                    {loading && (
                      <div className="flex items-center gap-2 text-white/50 text-xs py-8 justify-center">
                        <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
                        Researching {active.sym}…
                      </div>
                    )}

                    {!loading && report && (
                      <div className="space-y-3 text-[11px] leading-relaxed">
                        {report.price && (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.2)" }}>
                            <TrendingUp className="w-3 h-3 text-cyan-300" />
                            <span className="text-white/60 uppercase tracking-widest text-[9px]">Price</span>
                            <span className="text-white font-bold ml-auto">{report.price}</span>
                          </div>
                        )}
                        {report.what && <div className="text-white/80"><span className="text-cyan-300 uppercase text-[9px] tracking-widest block mb-1">What</span>{report.what}</div>}
                        {report.narrative && <div className="text-white/80"><span className="text-cyan-300 uppercase text-[9px] tracking-widest block mb-1">Narrative</span>{report.narrative}</div>}
                        {report.why_now && <div className="text-white/80"><span className="text-cyan-300 uppercase text-[9px] tracking-widest block mb-1">Why now</span>{report.why_now}</div>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}