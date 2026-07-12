import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function AdventRules() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-4" style={{ border: "1px solid rgba(200,150,40,0.15)", background: "rgba(0,0,0,0.3)" }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-3 py-2">
        <span className="text-[9px] tracking-[0.25em] uppercase" style={{ color: "rgba(200,150,40,0.6)", fontFamily: "monospace" }}>
          ◆ RULES · HOW TO GET KEYS ◆
        </span>
        <ChevronDown className="w-3.5 h-3.5 transition-transform" style={{ color: "rgba(200,150,40,0.5)", transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && (
        <ul className="px-4 pb-3 space-y-1 text-[9px] leading-relaxed text-left" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>
          <li>• Your Kaspa address is your identity — no login or email needed</li>
          <li>• Advent Keys are reputation points, NEVER private keys</li>
          <li>• Open 1 door per day → +1 key</li>
          <li>• Complete a task door with proof → +3 keys</li>
          <li>• Find &amp; complete a sponsor chest → real KAS payout + 5 keys</li>
          <li>• More keys = higher chance of finding a chest tomorrow</li>
          <li>• Proof uploads are AI-verified; borderline cases go to admin review</li>
          <li>• Sponsors donate 1 KAS to hide their ad-task inside the calendar</li>
        </ul>
      )}
    </div>
  );
}