import React, { useState } from "react";
import KasSignerSignTab from "@/components/kassigner/KasSignerSignTab";
import KasSignerKeysTab from "@/components/kassigner/KasSignerKeysTab";

export default function KasSigner() {
  const [tab, setTab] = useState("sign");

  return (
    <div className="min-h-screen text-white" style={{ background: "#0a0a0e" }}>
      <div className="max-w-md mx-auto px-4 py-8 pb-16">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black tracking-tight">KasSigner</h1>
          <p className="text-white/40 text-xs mt-1">Air-gapped Kaspa transaction signer</p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-2xl bg-[#16161d] border border-white/10 p-1 mb-6">
          {[
            { id: "sign", label: "Sign" },
            { id: "keys", label: "Keys" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 h-10 rounded-xl text-sm font-bold transition-colors ${
                tab === t.id ? "bg-[#6366f1] text-white" : "text-white/50 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "sign" ? <KasSignerSignTab /> : <KasSignerKeysTab />}
      </div>
    </div>
  );
}