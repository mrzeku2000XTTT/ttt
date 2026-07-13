import React, { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { IGRA_AGENT_LOGO } from "@/components/igra/agent/igraAgentLogo";

// Native auto-transact arm switch — our own PIN signer, no Kasware.
// PIN is hashed (SHA-256) and stored only in this browser.
const PIN_KEY = "igra_auto_pin_hash";
export const AUTO_MODE_KEY = "igra_auto_mode";

async function hashPin(pin) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("igra:" + pin));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function AutoTransactToggle({ enabled, onChange }) {
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const hasPin = !!localStorage.getItem(PIN_KEY);

  const toggle = () => {
    setError("");
    if (enabled) {
      localStorage.setItem(AUTO_MODE_KEY, "off");
      onChange(false);
      setShowPin(false);
    } else {
      setShowPin(true);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pin)) { setError("PIN MUST BE 6 DIGITS"); return; }
    const h = await hashPin(pin);
    if (!hasPin) {
      localStorage.setItem(PIN_KEY, h);
    } else if (h !== localStorage.getItem(PIN_KEY)) {
      setError("WRONG PIN"); setPin(""); return;
    }
    localStorage.setItem(AUTO_MODE_KEY, "on");
    setShowPin(false); setPin(""); setError("");
    onChange(true);
  };

  return (
    <div className="rounded-2xl p-4 mb-4"
      style={{ border: `1px solid ${enabled ? "rgba(110,231,183,0.4)" : "rgba(201,162,75,0.25)"}`,
        background: "rgba(10,9,6,0.65)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}>
      <div className="flex items-center gap-3">
        <img src={IGRA_AGENT_LOGO} alt=""
          className="w-7 h-7 rounded-full object-cover flex-shrink-0"
          style={{ border: `1px solid ${enabled ? "rgba(110,231,183,0.5)" : "rgba(201,162,75,0.35)"}`,
            boxShadow: enabled ? "0 0 12px rgba(110,231,183,0.35)" : "none" }} />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-black tracking-[0.25em] uppercase"
            style={{ color: enabled ? "#6EE7B7" : "#C9A24B", fontFamily: "monospace" }}>
            ALPHA AUTO-TRANSACT {enabled ? "· ARMED" : ""}
          </div>
          <div className="text-[8px] tracking-[0.15em] uppercase mt-0.5"
            style={{ color: "rgba(201,162,75,0.55)", fontFamily: "monospace" }}>
            NATIVE SIGNER · NO KASWARE · AUTO-FORWARDS 10% OF DETECTED DEPOSITS TO BETA
          </div>
        </div>
        <button onClick={toggle} className="relative w-12 h-6 rounded-full flex-shrink-0 focus:outline-none"
          style={{ background: enabled ? "rgba(110,231,183,0.2)" : "rgba(255,255,255,0.08)",
            border: `1px solid ${enabled ? "#6EE7B7" : "rgba(201,162,75,0.4)"}` }}>
          <span className="absolute top-[2px] w-[20px] h-[20px] rounded-full transition-all duration-200"
            style={{ left: enabled ? "26px" : "2px", background: enabled ? "#6EE7B7" : "#C9A24B" }} />
        </button>
      </div>
      {showPin && !enabled && (
        <form onSubmit={submit} className="mt-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 flex-shrink-0" style={{ color: "#C9A24B" }} />
          <input type="password" inputMode="numeric" maxLength={6} value={pin} autoFocus
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder={hasPin ? "ENTER 6-DIGIT PIN TO SIGN" : "SET A NEW 6-DIGIT PIN"}
            className="flex-1 bg-transparent px-3 py-2 rounded-xl text-xs tracking-[0.4em] focus:outline-none"
            style={{ border: "1px solid rgba(201,162,75,0.3)", color: "#f5efe0", fontFamily: "monospace" }} />
          <button type="submit" disabled={pin.length !== 6}
            className="px-4 py-2 rounded-xl text-[9px] font-black tracking-[0.2em] uppercase focus:outline-none"
            style={{ border: "1px solid rgba(201,162,75,0.45)", background: "rgba(201,162,75,0.12)",
              color: "#C9A24B", fontFamily: "monospace", opacity: pin.length === 6 ? 1 : 0.4 }}>
            {hasPin ? "SIGN" : "SET PIN"}
          </button>
        </form>
      )}
      {error && (
        <div className="mt-2 text-[8px] tracking-[0.2em] uppercase" style={{ color: "#fca5a5", fontFamily: "monospace" }}>
          {error}
        </div>
      )}
    </div>
  );
}