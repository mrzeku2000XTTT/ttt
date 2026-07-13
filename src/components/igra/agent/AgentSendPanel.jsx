import React, { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getLocalAgent } from "@/components/igra/agent/localAgentWallet";

// Manual iKAS send form inside an agent wallet card — signs via igraAgent backend
// (server agents) or with the browser-local key (local agents, key sent transiently)
export default function AgentSendPanel({ name, local, onTxComplete }) {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const send = async (e) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setResult(null);
    try {
      const payload = { action: "send", from: name, to: to.trim(), amount: Number(amount) };
      if (local) {
        const agent = getLocalAgent(name);
        if (!agent?.private_key && !agent?.privateKey) throw new Error("Local key not found in this browser");
        payload.private_key = agent.private_key || agent.privateKey;
      }
      const res = await base44.functions.invoke("igraAgent", payload);
      setResult({ ok: true, text: `SENT ${amount} iKAS`, url: res.data.explorer_url });
      setTo(""); setAmount("");
      onTxComplete?.();
    } catch (err) {
      setResult({ ok: false, text: err?.response?.data?.error || err.message });
    }
    setSending(false);
  };

  const mono = { fontFamily: "monospace" };
  const inputStyle = {
    border: "1px solid rgba(201,162,75,0.25)", background: "rgba(0,0,0,0.4)",
    color: "#f5efe0", ...mono,
  };

  return (
    <form onSubmit={send} className="mt-3 pt-3 space-y-2" style={{ borderTop: "1px solid rgba(201,162,75,0.15)" }}>
      <input value={to} onChange={(e) => setTo(e.target.value)} required
        placeholder="0x DESTINATION OR alpha / beta"
        className="w-full px-3 py-2 rounded-lg text-[9px] uppercase tracking-wider focus:outline-none"
        style={inputStyle} />
      <div className="flex gap-2">
        <input value={amount} onChange={(e) => setAmount(e.target.value)} required
          type="number" step="any" min="0" placeholder="AMOUNT iKAS"
          className="flex-1 min-w-0 px-3 py-2 rounded-lg text-[9px] uppercase tracking-wider focus:outline-none"
          style={inputStyle} />
        <button type="submit" disabled={sending}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[9px] font-black tracking-[0.2em] uppercase focus:outline-none"
          style={{ border: "1px solid rgba(201,162,75,0.5)", background: "rgba(201,162,75,0.15)",
            color: "#C9A24B", ...mono, opacity: sending ? 0.5 : 1 }}>
          {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
          SEND
        </button>
      </div>
      {result && (
        <div className="text-[8px] tracking-[0.15em] uppercase break-all flex items-center gap-2"
          style={{ color: result.ok ? "#6EE7B7" : "#fca5a5", ...mono }}>
          <span className="flex-1">{result.text}</span>
          {result.url && (
            <a href={result.url} target="_blank" rel="noopener noreferrer" className="underline flex-shrink-0">VIEW</a>
          )}
        </div>
      )}
    </form>
  );
}