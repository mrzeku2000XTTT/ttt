import React, { useState } from "react";
import { ChevronDown, ChevronUp, Check, Trash2 } from "lucide-react";
import { IOS_FONT } from "@/components/igra/agent/igraAgentLogo";

const KASPA_L1_KEY = "igra_kaspa_l1_address";

export function getSavedKaspaAddress() {
  try { return localStorage.getItem(KASPA_L1_KEY) || ""; } catch { return ""; }
}

// Collapsible card — each user saves their own Kaspa L1 payout address in this browser
export default function KaspaAddressCard() {
  const [saved, setSaved] = useState(getSavedKaspaAddress);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(saved);
  const [error, setError] = useState("");

  const save = () => {
    const addr = value.trim().startsWith("kaspa:") ? value.trim() : `kaspa:${value.trim()}`;
    if (!/^kaspa:[a-z0-9]{61,63}$/.test(addr)) { setError("Invalid kaspa: address"); return; }
    localStorage.setItem(KASPA_L1_KEY, addr);
    setSaved(addr); setError(""); setOpen(false);
  };

  const clear = () => {
    localStorage.removeItem(KASPA_L1_KEY);
    setSaved(""); setValue("");
  };

  return (
    <div className="rounded-2xl mb-4 overflow-hidden"
      style={{ border: "1px solid rgba(201,162,75,0.25)", background: "rgba(8,7,4,0.75)" }}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 focus:outline-none">
        <div className="text-left">
          <div className="text-[9px] tracking-[0.3em] uppercase font-black"
            style={{ color: "#C9A24B", fontFamily: "monospace" }}>
            MY KASPA L1 ADDRESS
          </div>
          <div className="text-[9px] mt-1 break-all" style={{ color: "rgba(201,162,75,0.55)", fontFamily: "monospace" }}>
            {saved ? saved : "NOT SET · SAVED IN THIS BROWSER · USED FOR iKAS → KAS PAYOUTS"}
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: "#C9A24B" }} />
              : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "#C9A24B" }} />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2" style={{ borderTop: "1px solid rgba(201,162,75,0.15)" }}>
          <input value={value} onChange={(e) => { setValue(e.target.value); setError(""); }}
            placeholder="kaspa:qq..."
            className="w-full mt-3 bg-transparent px-3 py-2 rounded-xl text-xs focus:outline-none"
            style={{ border: "1px solid rgba(201,162,75,0.25)", color: "#f5efe0", fontFamily: IOS_FONT }} />
          {error && <div className="text-[10px]" style={{ color: "#fca5a5", fontFamily: "monospace" }}>{error}</div>}
          <div className="flex gap-2">
            <button onClick={save} disabled={!value.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9px] tracking-[0.2em] uppercase font-black focus:outline-none"
              style={{ border: "1px solid rgba(201,162,75,0.45)", background: "rgba(201,162,75,0.12)",
                color: "#C9A24B", fontFamily: "monospace", opacity: value.trim() ? 1 : 0.4 }}>
              <Check className="w-3 h-3" /> SAVE
            </button>
            {saved && (
              <button onClick={clear}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9px] tracking-[0.2em] uppercase focus:outline-none"
                style={{ border: "1px solid rgba(248,113,113,0.35)", color: "#fca5a5", fontFamily: "monospace" }}>
                <Trash2 className="w-3 h-3" /> REMOVE
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}