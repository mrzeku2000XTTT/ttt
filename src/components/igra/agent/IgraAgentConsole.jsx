import React, { useEffect, useRef, useState } from "react";
import { Send, Loader2, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getLocalAgent, saveLocalAgent, listLocalAgents } from "@/components/igra/agent/localAgentWallet";

// Natural-language console — the agent parses your command, forges local wallets, and transacts iKAS on Igra
export default function IgraAgentConsole({ agents, onTxComplete, onForged }) {
  const [messages, setMessages] = useState([{
    role: "agent",
    text: "IGRA AGENT ONLINE. I transact iKAS on Igra mainnet (chain 38833) via Igra nodes. Try: \"forge a wallet called scout\", \"alpha send 0.01 iKAS to beta\", or \"check balances\". Local wallets keep their keys in THIS browser only.",
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
      const locals = listLocalAgents();
      const intent = await base44.integrations.Core.InvokeLLM({
        prompt: `You control AI agent wallets on the Igra EVM L2 (Kaspa). Native token: iKAS.
Server agents: alpha=${agents?.alpha?.address || "?"} (${agents?.alpha?.balance_ikas || "?"} iKAS), beta=${agents?.beta?.address || "?"} (${agents?.beta?.balance_ikas || "?"} iKAS).
Local agents (keys stored in the user's browser): ${locals.length ? locals.map((a) => `${a.name}=${a.address}`).join(", ") : "none yet"}.

Parse the user's command into an action:
- "forge": generate a NEW local agent wallet in the browser. name = the wallet/agent name the user wants (invent a short lowercase one like "agent-${locals.length + 1}" if not given).
- "send": transfer iKAS. from = "alpha", "beta", or a local agent name (default alpha). to = "alpha", "beta", a local agent name, or a 0x address. amount = number in iKAS.
- "status": check balances/addresses.
- "chat": anything else — answer helpfully about the Igra agents (account abstraction, EIP-7702, ERC-4337 are live on Igra).

reply = one short in-character agent sentence confirming what you're doing (or the answer for chat).

User command: ${text}`,
        response_json_schema: {
          type: "object",
          properties: {
            action: { type: "string", enum: ["forge", "send", "status", "chat"] },
            name: { type: "string" },
            from: { type: "string" },
            to: { type: "string" },
            amount: { type: "number" },
            reply: { type: "string" },
          },
          required: ["action", "reply"],
        },
      });

      push({ role: "agent", text: intent.reply });

      if (intent.action === "forge") {
        const wname = (intent.name || `agent-${locals.length + 1}`).toLowerCase();
        if (getLocalAgent(wname)) {
          push({ role: "error", text: `A local agent named "${wname}" already exists at ${getLocalAgent(wname).address}` });
        } else {
          const res = await base44.functions.invoke("igraAgent", { action: "forge" });
          saveLocalAgent({ name: wname, address: res.data.address, private_key: res.data.private_key });
          push({ role: "system", text: `⚒ WALLET FORGED · AGENT ${wname.toUpperCase()}\n${res.data.address}\nPRIVATE KEY SAVED IN THIS BROWSER ONLY · SURVIVES REFRESH · FUND IT WITH iKAS TO ACTIVATE` });
          onForged?.();
        }
      } else if (intent.action === "send") {
        const localSender = getLocalAgent(intent.from);
        const localDest = getLocalAgent(intent.to);
        const payload = {
          action: "send",
          from: intent.from || "alpha",
          to: localDest ? localDest.address : intent.to,
          amount: intent.amount,
          ...(localSender ? { private_key: localSender.private_key } : {}),
        };
        push({ role: "system", text: `BROADCASTING VIA IGRA NODE · ${payload.from} → ${intent.to} · ${intent.amount} iKAS…` });
        const res = await base44.functions.invoke("igraAgent", payload);
        push({ role: "tx", tx: res.data });
        onTxComplete?.();
      } else if (intent.action === "status") {
        const res = await base44.functions.invoke("igraAgent", {
          action: "status",
          extra: locals.map((a) => ({ name: a.name, address: a.address })),
        });
        const lines = Object.entries(res.data.agents)
          .map(([n, a]) => `${n.toUpperCase()} ${Number(a.balance_ikas).toFixed(4)} iKAS${a.local ? " (LOCAL)" : ""}`);
        push({ role: "system", text: `${lines.join(" · ")} · CHAIN ${res.data.chain_id}` });
        onTxComplete?.();
      }
    } catch (err) {
      push({ role: "error", text: err?.response?.data?.error || err.message || "Transaction failed" });
    }
    setBusy(false);
  };

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col"
      style={{ border: "1px solid rgba(201,162,75,0.25)", background: "rgba(8,7,4,0.75)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", height: "50vh", minHeight: "380px" }}>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => {
          if (m.role === "tx") return (
            <div key={i} className="rounded-xl p-3 text-[10px] space-y-1"
              style={{ border: "1px solid rgba(110,231,183,0.35)", background: "rgba(6,24,17,0.45)", fontFamily: "monospace" }}>
              <div className="font-black tracking-[0.2em]" style={{ color: "#6EE7B7" }}>✓ TRANSACTION CONFIRMED ON IGRA</div>
              <div style={{ color: "rgba(180,240,215,0.7)" }}>{m.tx.amount_ikas} iKAS · agent {m.tx.from_agent} → {m.tx.to.slice(0, 10)}… · block {m.tx.block ?? "pending"}</div>
              <a href={m.tx.explorer_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 underline" style={{ color: "#6EE7B7" }}>
                {m.tx.tx_hash.slice(0, 22)}… <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          );
          const colors = {
            user: { color: "#f5efe0", border: "rgba(201,162,75,0.35)", bg: "rgba(201,162,75,0.1)" },
            agent: { color: "#C9A24B", border: "rgba(201,162,75,0.3)", bg: "rgba(15,12,7,0.6)" },
            system: { color: "rgba(201,162,75,0.65)", border: "rgba(201,162,75,0.18)", bg: "transparent" },
            error: { color: "#fca5a5", border: "rgba(248,113,113,0.35)", bg: "rgba(60,15,10,0.4)" },
          }[m.role];
          return (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[85%] px-3 py-2 rounded-xl text-[11px] leading-relaxed whitespace-pre-wrap break-all"
                style={{ color: colors.color, border: `1px solid ${colors.border}`, background: colors.bg, fontFamily: "monospace" }}>
                {m.text}
              </div>
            </div>
          );
        })}
        {busy && <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#C9A24B" }} />}
        <div ref={bottomRef} />
      </div>
      <form className="flex gap-2 p-3" style={{ borderTop: "1px solid rgba(201,162,75,0.18)" }}
        onSubmit={(e) => { e.preventDefault(); run(); }}>
        <input value={input} onChange={(e) => setInput(e.target.value)}
          placeholder='e.g. "forge a wallet called scout" or "alpha send 0.01 iKAS to beta"'
          className="flex-1 bg-transparent px-3 py-2 rounded-xl text-xs focus:outline-none"
          style={{ border: "1px solid rgba(201,162,75,0.25)", color: "#f5efe0", fontFamily: "monospace" }} />
        <button type="submit" disabled={busy || !input.trim()}
          className="px-4 rounded-xl focus:outline-none"
          style={{ border: "1px solid rgba(201,162,75,0.45)", background: "rgba(201,162,75,0.12)",
            opacity: busy || !input.trim() ? 0.4 : 1 }}>
          <Send className="w-4 h-4" style={{ color: "#C9A24B" }} />
        </button>
      </form>
    </div>
  );
}