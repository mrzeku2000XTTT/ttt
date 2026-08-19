import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Copy, Check, Plus, RefreshCw, Eye, EyeOff } from "lucide-react";
import { deriveFreshReceiveAddress, getAllOwnedAddresses, markAddressUsed } from "@/lib/kachingVault";

export default function KaChingReceive({ refreshKey, onActivity }) {
  const [addresses, setAddresses] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);
  const [label, setLabel] = useState("");
  const [showIdx, setShowIdx] = useState(null);

  useEffect(() => {
    const all = getAllOwnedAddresses();
    setAddresses(all);
    setActiveIdx(0);
  }, [refreshKey]);

  useEffect(() => {
    const a = addresses[activeIdx];
    if (!a) { setQr(""); return; }
    QRCode.toDataURL(a.address, { margin: 1, width: 240, color: { dark: "#0b1b18", light: "#ffffff" } })
      .then(setQr).catch(() => setQr(""));
  }, [activeIdx, addresses]);

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const genFresh = () => {
    const e = deriveFreshReceiveAddress(label);
    if (e) {
      setAddresses(getAllOwnedAddresses());
      setActiveIdx(addresses.length);
      setLabel("");
      onActivity?.();
    }
  };

  const active = addresses[activeIdx];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Receive</h2>
        <p className="text-xs text-white/50 mb-4">
          One click = a fresh address. Use a new address for every DCA so on-chain analysis can't cluster your history.
        </p>
      </div>

      {active && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
          <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2">{active.label}</div>
          {qr && <img src={qr} alt="QR" className="w-48 h-48 mx-auto rounded-xl bg-white p-2 mb-3" />}
          <div className="flex items-center gap-2 justify-center max-w-full">
            <code className="text-[11px] text-cyan-200 break-all font-mono">{active.address}</code>
            <button onClick={() => copy(active.address)} className="flex-shrink-0 text-white/60 hover:text-white">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="mt-3 flex gap-2 justify-center">
            <button
              onClick={() => markAddressUsed(active.address)}
              className="text-[10px] font-mono uppercase tracking-widest text-white/50 hover:text-white border border-white/10 rounded-lg px-3 py-1.5"
            >
              Mark used
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Plus className="w-4 h-4 text-cyan-300" />
          <span className="text-sm font-semibold text-white">Derive fresh address</span>
        </div>
        <div className="flex gap-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (optional)"
            className="flex-1 h-10 px-3 rounded-lg bg-black/40 border border-white/10 text-sm text-white outline-none focus:border-cyan-400/50"
          />
          <button
            onClick={genFresh}
            className="h-10 px-4 rounded-lg bg-cyan-500 text-black text-sm font-semibold flex items-center gap-1.5 hover:bg-cyan-400"
          >
            <RefreshCw className="w-3.5 h-3.5" /> New
          </button>
        </div>
      </div>

      <div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2">Address book ({addresses.length})</div>
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {addresses.map((a, i) => (
            <button
              key={a.address}
              onClick={() => setActiveIdx(i)}
              className={`w-full flex items-center gap-2 p-2.5 rounded-xl border text-left transition-colors ${
                i === activeIdx ? "border-cyan-400/50 bg-cyan-500/5" : "border-white/10 bg-white/[0.02] hover:border-white/20"
              }`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${a.used ? "bg-amber-400" : "bg-emerald-400"}`} />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white truncate">{a.label}</div>
                <div className="text-[10px] text-white/40 font-mono truncate">
                  {showIdx === i ? a.address : `${a.address.slice(0, 14)}…${a.address.slice(-8)}`}
                </div>
              </div>
              <span
                onClick={(e) => { e.stopPropagation(); setShowIdx(showIdx === i ? null : i); }}
                className="text-white/40 hover:text-white"
              >
                {showIdx === i ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}