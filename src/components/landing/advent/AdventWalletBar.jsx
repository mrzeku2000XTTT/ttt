import React, { useState } from "react";
import { Key, ChevronDown, Check, Wallet, Pencil } from "lucide-react";

const GOLD = "rgba(200,160,70,0.9)";

export default function AdventWalletBar({ wallet, detectedWallets = [], onChange, keys }) {
  const [open, setOpen] = useState(false);
  const [manual, setManual] = useState(false);
  const [value, setValue] = useState("");

  const saveManual = () => {
    const v = value.trim();
    if (!v) return;
    onChange(v.startsWith("kaspa:") ? v : `kaspa:${v}`);
    setManual(false);
    setOpen(false);
    setValue("");
  };

  const pick = (addr) => {
    onChange(addr);
    setOpen(false);
    setManual(false);
  };

  const current = detectedWallets.find((w) => w.address === wallet);

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 px-3 py-2" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(200,150,40,0.25)" }}>
        <button onClick={() => { setOpen(!open); setManual(false); }}
          className="flex-1 flex items-center gap-2 min-w-0 text-left touch-manipulation">
          <Wallet className="w-3.5 h-3.5 flex-shrink-0" style={{ color: GOLD }} />
          {wallet ? (
            <span className="flex-1 truncate text-[10px] font-bold" style={{ color: GOLD, fontFamily: "monospace" }}>
              {current?.label ? `${current.label.toUpperCase()} · ` : ""}{wallet.slice(6, 16)}…{wallet.slice(-6)}
            </span>
          ) : (
            <span className="flex-1 text-[10px] font-bold" style={{ color: "rgba(200,150,40,0.5)", fontFamily: "monospace" }}>
              SELECT YOUR WALLET...
            </span>
          )}
          <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 transition-transform" style={{ color: "rgba(200,150,40,0.6)", transform: open ? "rotate(180deg)" : "none" }} />
        </button>
        {/* Advent key balance — reputation, never private keys */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 flex-shrink-0" title="Advent Keys (reputation)"
          style={{ background: "rgba(200,150,40,0.12)", border: "1px solid rgba(240,200,60,0.5)" }}>
          <Key className="w-3.5 h-3.5" style={{ color: "#f5d050" }} />
          <span className="text-[13px] font-black leading-none" style={{ color: "#f5d050", fontFamily: "monospace" }}>{keys}</span>
        </div>
      </div>

      {open && (
        <div className="mt-1 p-1" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(200,150,40,0.25)" }}>
          {detectedWallets.length > 0 && (
            <div className="px-2 pt-1 pb-0.5 text-[7px] tracking-[0.3em] uppercase" style={{ color: "rgba(200,150,40,0.4)", fontFamily: "monospace" }}>
              ◆ DETECTED WALLETS ◆
            </div>
          )}
          {detectedWallets.map((w) => (
            <button key={w.address} onClick={() => pick(w.address)}
              className="w-full flex items-center gap-2 px-2 py-2 text-left touch-manipulation hover:bg-white/5">
              <span className="flex-1 truncate text-[9px] font-bold" style={{ color: w.address === wallet ? "#f5d050" : GOLD, fontFamily: "monospace" }}>
                {w.label ? `${w.label.toUpperCase()} · ` : ""}{w.address.slice(6, 18)}…{w.address.slice(-6)}
              </span>
              {w.address === wallet && <Check className="w-3 h-3 flex-shrink-0" style={{ color: "#f5d050" }} />}
            </button>
          ))}
          {detectedWallets.length === 0 && (
            <div className="px-2 py-2 text-[8px]" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>
              NO TTT WALLET DETECTED — ENTER AN ADDRESS MANUALLY
            </div>
          )}
          {!manual ? (
            <button onClick={() => setManual(true)}
              className="w-full flex items-center gap-2 px-2 py-2 text-left touch-manipulation hover:bg-white/5"
              style={{ borderTop: detectedWallets.length > 0 ? "1px solid rgba(200,150,40,0.15)" : "none" }}>
              <Pencil className="w-3 h-3 flex-shrink-0" style={{ color: "rgba(200,150,40,0.6)" }} />
              <span className="text-[9px] font-bold" style={{ color: "rgba(200,150,40,0.6)", fontFamily: "monospace" }}>
                USE A MANUAL KASPA ADDRESS...
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-2 py-2" style={{ borderTop: "1px solid rgba(200,150,40,0.15)" }}>
              <input value={value} onChange={(e) => setValue(e.target.value)} autoFocus
                onKeyDown={(e) => e.key === "Enter" && saveManual()}
                placeholder="kaspa:..."
                className="flex-1 bg-transparent outline-none text-[10px] font-bold min-w-0"
                style={{ color: GOLD, caretColor: GOLD, fontFamily: "monospace" }} />
              <button onClick={saveManual} className="flex-shrink-0 p-1">
                <Check className="w-4 h-4" style={{ color: "#f5d050" }} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}