import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Key } from "lucide-react";

const SERVICES = [
  { name: "3D generation", kas: 0.035 },
  { name: "Image gen", kas: 0.12 },
  { name: "Video gen", kas: 2.5 },
  { name: "Code analysis", kas: 0.08 },
];
const KAS_USD = 0.085;

export default function KasComputePayBar() {
  const [payWith, setPayWith] = useState("KAS");

  return (
    <div className="absolute top-16 left-4 right-4 z-50 flex justify-center pointer-events-none">
      <div className="pointer-events-auto bg-black/85 backdrop-blur-xl border border-white/15 rounded-3xl px-4 py-3 max-w-2xl w-full">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-semibold">Pay with:</span>
            <div className="flex rounded-full overflow-hidden border border-white/15">
              {["KAS", "kUSD"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setPayWith(opt)}
                  className={`px-4 py-1.5 text-xs font-bold transition-all ${
                    payWith === opt ? "bg-cyan-500 text-black" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* KCC NFT link */}
          <Link to={createPageUrl("KCCNft")}>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold hover:bg-purple-500/30 transition-all">
              <Key className="w-3 h-3" /> Get KCC NFT Identity
            </button>
          </Link>
        </div>

        {/* Prices */}
        <div className="flex flex-wrap gap-2 mt-3">
          {SERVICES.map((s) => (
            <span key={s.name} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-zinc-300">
              {payWith === "KAS"
                ? `${s.kas} KAS per ${s.name}`
                : `$${(s.kas * KAS_USD).toFixed(4)} per ${s.name}`}
            </span>
          ))}
        </div>

        {payWith === "kUSD" && (
          <p className="text-[10px] text-purple-300/80 mt-2">
            kUSD payments require a KCC NFT identity. Mint one at /KCCNft
          </p>
        )}
      </div>
    </div>
  );
}