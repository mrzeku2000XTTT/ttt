import React, { useState } from "react";
import { Key, Pencil, Check } from "lucide-react";

const GOLD = "rgba(200,160,70,0.9)";

export default function AdventWalletBar({ wallet, onChange, keys }) {
  const [editing, setEditing] = useState(!wallet);
  const [value, setValue] = useState(wallet || "");

  const save = () => {
    const v = value.trim();
    if (!v) return;
    onChange(v.startsWith("kaspa:") ? v : `kaspa:${v}`);
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-2 mb-4 px-3 py-2" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(200,150,40,0.25)" }}>
      {editing ? (
        <>
          <input value={value} onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="PASTE YOUR KASPA ADDRESS (YOUR IDENTITY)..."
            className="flex-1 bg-transparent outline-none text-[10px] font-bold min-w-0"
            style={{ color: GOLD, caretColor: GOLD, fontFamily: "monospace" }} />
          <button onClick={save} className="flex-shrink-0 p-1">
            <Check className="w-4 h-4" style={{ color: "#f5d050" }} />
          </button>
        </>
      ) : (
        <>
          <span className="flex-1 truncate text-[10px] font-bold min-w-0" style={{ color: GOLD, fontFamily: "monospace" }}>
            {wallet.slice(0, 16)}…{wallet.slice(-6)}
          </span>
          <button onClick={() => { setValue(wallet); setEditing(true); }} className="flex-shrink-0 p-1" title="Switch wallet address">
            <Pencil className="w-3 h-3" style={{ color: "rgba(200,150,40,0.5)" }} />
          </button>
        </>
      )}
      {/* Advent key balance — reputation, never private keys */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 flex-shrink-0" title="Advent Keys (reputation)"
        style={{ background: "rgba(200,150,40,0.12)", border: "1px solid rgba(240,200,60,0.5)" }}>
        <Key className="w-3.5 h-3.5" style={{ color: "#f5d050" }} />
        <span className="text-[13px] font-black leading-none" style={{ color: "#f5d050", fontFamily: "monospace" }}>{keys}</span>
      </div>
    </div>
  );
}