import React, { useEffect, useRef, useState } from "react";
import { Send, Loader2, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Natural-language console — the agent parses your command and transacts iKAS on Igra
export default function IgraAgentConsole({ agents, onTxComplete }) {
  const [messages, setMessages] = useState([{
    role: "agent",
    text: "IGRA AGENT ONLINE. I hold two wallets on Igra mainnet (chain 38833) and transact iKAS through Igra nodes. Try: \"alpha send 0.01 iKAS to beta\" or \"check balances\".",
  }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  const push = (msg) => setMessages((m) => [...m, msg]);

  const run = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    push({ role: "user", text });
    setBusy(true);
    try {
      const intent = await base44.integrations.Core.InvokeLLM({
        prompt: `You control two AI agent wallets ("alpha" and "beta") on the Igra EVM L2 (Kaspa). Native token: iKAS.
Agent addresses: alpha=${agents?.alpha?.address || "?"}, beta=${agents?.beta?.address || "?"}.
Balances: alpha=${agents?.alpha?.balance_ikas || "?"} iKAS, beta=${agents?.beta?.balance_ikas || "?"} iKAS.

Parse the user's command into an action:
- "send": transfer iKAS. from = "alpha" or "beta" (default alpha). to = "alpha", "beta", or a 0x address. amount = number in iKAS.
- "status": check balances/addresses.
- "chat": anything else — answer helpfully about the Igra agents (account abstraction, EIP-7702, ERC-4337 are live on Igra).

reply = one short in-character agent sentence confirming what you're doing (or the answer for chat).

User command: ${text}`,
        response_json_schema: {
          type: "object",
          properties: {
            action: { type: "string", enum: ["send", "status", "chat"] },
            from: { type: "string" },
            to: { type: "string" },
            amount: { type: "number" },
            reply: { type: "string" },
          },
          required: ["action", "reply"],
        },
      });

      push({ role: "agent", text: intent.reply });

      if (intent.action === "send") {
        push({ role: "system", text: `BROADCASTING VIA IGRA NODE · ${intent.from || "alpha"} → ${intent.to} · ${intent.amount} iKAS…` });
        const res = await base44.functions.invoke("igraAgent", {
          action: "send", from: intent.from || "alpha", to: intent.to, amount: intent.amount,
        });
        push({ role: "tx", tx: res.data });
        onTxComplete?.();
      } else if (intent.action === "status") {
        const res = await base44.functions.invoke("igraAgent", { action: "status" });
        const a = res.data.agents;
        push({ role: "system", text: `ALPHA ${Number(a.alpha.balance_ikas).toFixed(4)} iKAS · BETA ${Number(a.beta.balance_ikas).toFixed(4)} iKAS · CHAIN ${res.data.chain_id}` });
        onTxComplete?.();
      }
    } catch (err) {
      push({ role: "error", text: err?.response?.data?.error || err.message || "Transaction failed" });
    }
    setBusy(false);
  };

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col"
      style={{ border: "1px solid rgba(255,140,90,0.2)", background: "rgba(12,5,2,0.7)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", height: "50vh", minHeight: "380px" }}>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => {
          if (m.role === "tx") return (
            <div key={i} className="rounded-xl p-3 text-[10px] space-y-1"
              style={{ border: "1px solid rgba(74,222,128,0.35)", background: "rgba(20,60,30,0.3)", fontFamily: "monospace" }}>
              <div className="font-black tracking-[0.2em]" style={{ color: "#4ade80" }}>✓ TRANSACTION CONFIRMED ON IGRA</div>
              <div style={{ color: "rgba(200,255,220,0.7)" }}>{m.tx.amount_ikas} iKAS · agent {m.tx.from_agent} → {m.tx.to.slice(0, 10)}… · block {m.tx.block ?? "pending"}</div>
              <a href={m.tx.explorer_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 underline" style={{ color: "#86efac" }}>
                {m.tx.tx_hash.slice(0, 22)}… <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          );
          const colors = {
            user: { color: "#ffedd5", border: "rgba(255,180,120,0.3)", bg: "rgba(80,35,10,0.4)" },
            agent: { color: "#fdba74", border: "rgba(249,115,22,0.25)", bg: "rgba(40,16,4,0.5)" },
            system: { color: "rgba(255,200,160,0.6)", border: "rgba(255,140,90,0.15)", bg: "transparent" },
            error: { color: "#fca5a5", border: "rgba(248,113,113,0.35)", bg: "rgba(60,15,10,0.4)" },
          }[m.role];
          return (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[85%] px-3 py-2 rounded-xl text-[11px] leading-relaxed whitespace-pre-wrap"
                style={{ color: colors.color, border: `1px solid ${colors.border}`, background: colors.bg, fontFamily: "monospace" }}>
                {m.text}
              </div>
            </div>
          );
        })}
        {busy && <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#fb923c" }} />}
        <div ref={bottomRef} />
      </div>
      <form className="flex gap-2 p-3" style={{ borderTop: "1px solid rgba(255,140,90,0.15)" }}
        onSubmit={(e) => { e.preventDefault(); run(); }}>
        <input value={input} onChange={(e) => setInput(e.target.value)}
          placeholder='e.g. "alpha send 0.01 iKAS to beta"'
          className="flex-1 bg-transparent px-3 py-2 rounded-xl text-xs focus:outline-none"
          style={{ border: "1px solid rgba(255,140,90,0.2)", color: "#ffedd5", fontFamily: "monospace" }} />
        <button type="submit" disabled={busy || !input.trim()}
          className="px-4 rounded-xl focus:outline-none"
          style={{ border: "1px solid rgba(249,115,22,0.4)", background: "rgba(249,115,22,0.15)",
            opacity: busy || !input.trim() ? 0.4 : 1 }}>
          <Send className="w-4 h-4" style={{ color: "#fb923c" }} />
        </button>
      </form>
    </div>
  );
}