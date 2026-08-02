import React, { useState } from "react";
import { BookOpen, Check, ShieldCheck, Info } from "lucide-react";

// "All the real things a child needs to be ready to trade"
const CHECKLIST = [
  "I understand I can lose money — trading is risky",
  "I will never invest more than I can afford to lose",
  "I know what a bonding curve is",
  "I know what market sentiment means",
  "I have a trading plan and a stop-loss",
  "I understand fees and slippage",
  "I will not panic-sell or FOMO-buy",
  "I know this is practice — not real money",
];

const GLOSSARY = [
  { t: "DEX", d: "Decentralized Exchange — trade straight from your wallet, no middleman." },
  { t: "Bonding Curve", d: "A math formula that sets price. More buyers → higher price." },
  { t: "Liquidity", d: "How easy it is to buy/sell without moving the price too much." },
  { t: "Slippage", d: "The gap between the price you expect and the price you get." },
  { t: "Sentiment", d: "How the market feels — bullish (up) or bearish (down)." },
  { t: "HODL", d: "Hold On for Dear Life — keep your coins, don't panic sell." },
  { t: "FOMO", d: "Fear Of Missing Out — buying just because others are. Don't!" },
  { t: "Stop-loss", d: "An auto-sell rule that limits how much you can lose." },
];

const RULES = [
  "Start tiny. Learn before you earn.",
  "Never trade money you need for food or rent.",
  "If you're emotional, close the app.",
  "Green candles aren't always good. Red isn't always bad.",
];

export default function KidsAcademy() {
  const [done, setDone] = useState(() => {
    try { return JSON.parse(localStorage.getItem("kids_academy") || "[]"); } catch { return []; }
  });
  const [openTerm, setOpenTerm] = useState(null);

  const toggle = (i) => {
    const next = done.includes(i) ? done.filter((x) => x !== i) : [...done, i];
    setDone(next);
    try { localStorage.setItem("kids_academy", JSON.stringify(next)); } catch {}
  };
  const ready = done.length === CHECKLIST.length;

  return (
    <div className="rounded-2xl bg-[#1f1a2e] border border-[#2d2542] p-4">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="w-4 h-4 text-[#FF8A6B]" />
        <span className="font-display font-bold text-sm text-[#EDE9F7]">Trading Academy</span>
        {ready && (
          <span className="ml-auto flex items-center gap-1 text-[10px] font-display font-extrabold text-green-400 bg-green-500/15 px-2 py-1 rounded-full">
            <ShieldCheck className="w-3 h-3" /> READY
          </span>
        )}
      </div>

      <div className="space-y-1.5 mb-4">
        {CHECKLIST.map((c, i) => (
          <button key={i} onClick={() => toggle(i)} className="w-full flex items-start gap-2 text-left">
            <span className={`mt-0.5 w-4 h-4 rounded-md border flex-shrink-0 flex items-center justify-center ${done.includes(i) ? "bg-green-500 border-green-500" : "border-[#3d3258]"}`}>
              {done.includes(i) && <Check className="w-3 h-3 text-white" />}
            </span>
            <span className={`text-[11px] leading-snug ${done.includes(i) ? "text-[#7A7290] line-through" : "text-[#B9A8F5]"}`}>{c}</span>
          </button>
        ))}
      </div>

      <div className="text-[10px] text-[#7A7290] uppercase tracking-widest font-bold mb-2">Slobby's Rules</div>
      <ul className="space-y-1 mb-4">
        {RULES.map((r) => (
          <li key={r} className="text-[11px] text-[#EDE9F7] flex items-start gap-1.5">
            <span className="text-[#FF8A6B]">•</span> {r}
          </li>
        ))}
      </ul>

      <div className="text-[10px] text-[#7A7290] uppercase tracking-widest font-bold mb-2">Glossary</div>
      <div className="flex flex-wrap gap-1.5">
        {GLOSSARY.map((g, i) => (
          <div key={g.t} className="relative">
            <button
              onClick={() => setOpenTerm(openTerm === i ? null : i)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#241E33] border border-[#3d3258] text-[10px] text-[#EDE9F7] font-bold hover:border-[#8B6FF5] transition-colors"
            >
              {g.t} <Info className="w-2.5 h-2.5 text-[#7A7290]" />
            </button>
            {openTerm === i && (
              <div className="absolute z-30 top-full mt-1 left-0 w-44 p-2 rounded-lg bg-[#14101f] border border-[#8B6FF5] text-[10px] text-[#B9A8F5] shadow-xl">
                {g.d}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}