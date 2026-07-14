import React, { useEffect, useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Admin-only manual KAS send from the desk funding wallet — key stays server-side
export default function DeskAdminSend() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    base44.auth.me().then((u) => setIsAdmin(u?.role === "admin")).catch(() => {});
  }, []);

  if (!isAdmin) return null;

  const send = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null); setResult(null);
    try {
      const res = await base44.functions.invoke("igraBridge", {
        action: "admin_send_kas", kaspa_address: to.trim(), amount: Number(amount),
      });
      setResult(res.data);
      setTo(""); setAmount("");
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    }
    setBusy(false);
  };

  return (
    <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(201,162,75,0.18)" }}>
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-[9px] tracking-[0.3em] uppercase focus:outline-none"
        style={{ color: "rgba(110,231,183,0.9)", fontFamily: "monospace" }}>
        <ShieldCheck className="w-3.5 h-3.5" /> ADMIN · MANUAL KAS SEND {open ? "▴" : "▾"}
      </button>
      {open && (
        <form onSubmit={send} className="mt-3 space-y-2">
          <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="kaspa:destination address"
            className="w-full bg-transparent px-3 py-2 rounded-xl text-[10px] focus:outline-none"
            style={{ border: "1px solid rgba(201,162,75,0.25)", color: "#f5efe0", fontFamily: "monospace" }} />
          <div className="flex gap-2">
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount KAS"
              type="number" step="any" min="0"
              className="flex-1 bg-transparent px-3 py-2 rounded-xl text-[10px] focus:outline-none"
              style={{ border: "1px solid rgba(201,162,75,0.25)", color: "#f5efe0", fontFamily: "monospace" }} />
            <button type="submit" disabled={busy || !to.trim() || !Number(amount)}
              className="px-4 rounded-xl text-[9px] tracking-[0.2em] uppercase font-black focus:outline-none"
              style={{ border: "1px solid rgba(110,231,183,0.45)", background: "rgba(110,231,183,0.1)",
                color: "#6EE7B7", fontFamily: "monospace", opacity: busy || !to.trim() || !Number(amount) ? 0.4 : 1 }}>
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "SEND"}
            </button>
          </div>
          {error && (
            <p className="text-[9px] leading-relaxed" style={{ color: "#fca5a5", fontFamily: "monospace" }}>{error}</p>
          )}
          {result && (
            <p className="text-[9px] leading-relaxed break-all" style={{ color: "#6EE7B7", fontFamily: "monospace" }}>
              ✓ SENT {result.amount} KAS ·{" "}
              <a href={result.explorer_url} target="_blank" rel="noopener noreferrer" className="underline">
                {String(result.tx_id).slice(0, 22)}…
              </a>
            </p>
          )}
          <p className="text-[8px] tracking-[0.15em] uppercase leading-relaxed"
            style={{ color: "rgba(201,162,75,0.45)", fontFamily: "monospace" }}>
            SIGNED SERVER-SIDE FROM THE DESK WALLET · ADMIN ONLY · KEY NEVER LEAVES THE BACKEND
          </p>
        </form>
      )}
    </div>
  );
}