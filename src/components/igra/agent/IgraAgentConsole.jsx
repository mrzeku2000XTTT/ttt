import React, { useEffect, useRef, useState } from "react";
import { Send, Loader2, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getLocalAgent, saveLocalAgent, listLocalAgents } from "@/components/igra/agent/localAgentWallet";
import { getSavedKaspaAddress } from "@/components/igra/agent/KaspaAddressCard";
import { IGRA_AGENT_LOGO, IOS_FONT } from "@/components/igra/agent/igraAgentLogo";

// Natural-language console — the agent parses your command, forges local wallets, and transacts iKAS on Igra
export default function IgraAgentConsole({ agents, onTxComplete, onForged, fullHeight }) {
  const [messages, setMessages] = useState([{
    role: "agent",
    text: "IGRA AGENT ONLINE. I transact iKAS on Igra mainnet (chain 38833), run an instant 1:1 KAS ↔ iKAS bridge desk, and speak INS — send straight to .igra names. Try: \"forge a wallet called scout\", \"alpha send 0.01 iKAS to insdomains.igra\", \"resolve alice.igra\", \"my names\", \"show the desk\", \"bridge info\", or \"swap 1 iKAS from beta to kaspa:...\". Local wallets keep their keys in THIS browser only.",
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
      const savedKaspa = getSavedKaspaAddress();
      const intent = await base44.integrations.Core.InvokeLLM({
        prompt: `You control AI agent wallets on the Igra EVM L2 (Kaspa). Native token: iKAS.
Server agents: alpha=${agents?.alpha?.address || "?"} (${agents?.alpha?.balance_ikas || "?"} iKAS), beta=${agents?.beta?.address || "?"} (${agents?.beta?.balance_ikas || "?"} iKAS).
Local agents (keys stored in the user's browser): ${locals.length ? locals.map((a) => `${a.name}=${a.address}`).join(", ") : "none yet"}.
User's saved Kaspa L1 payout address: ${savedKaspa || "none saved"}.

Parse the user's command into an action:
- "forge": generate a NEW local agent wallet in the browser. name = the wallet/agent name the user wants (invent a short lowercase one like "agent-${locals.length + 1}" if not given).
- "send": transfer iKAS. from = "alpha", "beta", or a local agent name (default alpha). to = "alpha", "beta", a local agent name, a 0x address, or an INS name ending in .igra/.ins/.ikas (pass the name as-is, e.g. "alice.igra" — I resolve it on-chain). amount = number in iKAS.
- "resolve_name": user asks what address an INS name (.igra/.ins/.ikas) points to. name = the INS name.
- "names": user asks to see registered INS/.igra names ("my names", "what names does alpha own", "names for 0x..."). to = the agent name or 0x address to look up (default alpha).
- "status": check balances/addresses.
- "desk": user asks about the desk, desk wallet, funding wallet, desk balance, or how to fund the desk.
- "bridge_info": user asks about the bridge/marketplace, swap rates, deposit addresses, or bridge liquidity.
- "bridge_kas_to_ikas": user wants to swap KAS (Kaspa L1) into iKAS, OR claims a KAS deposit. l1_tx_id = the Kaspa L1 transaction id if the user provided one (64 hex chars, no 0x). to = destination agent name or 0x address for the iKAS. amount = KAS amount if the user states one (e.g. "swap 10 KAS to beta").
- "bridge_ikas_to_kas": user wants to swap iKAS into KAS on Kaspa L1. amount = iKAS amount (omit if not stated). from = EXACTLY the wallet the user names ("alpha", "beta", or a local agent name) — OMIT "from" entirely if the user does not name a wallet, do NOT guess. kaspa_address = the kaspa: payout address; if not given, use the user's saved Kaspa L1 address. l2_tx_hash = only if the user already sent iKAS to the pool and gives a 0x… tx hash.
- "chat": anything else — answer helpfully about the Igra agents (account abstraction, EIP-7702, ERC-4337 are live on Igra). The bridge desk swaps 1 KAS = 1 iKAS instantly.

reply = one short in-character agent sentence confirming what you're doing (or the answer for chat).

User command: ${text}`,
        response_json_schema: {
          type: "object",
          properties: {
            action: { type: "string", enum: ["forge", "send", "status", "chat", "desk", "bridge_info", "bridge_kas_to_ikas", "bridge_ikas_to_kas", "resolve_name", "names"] },
            name: { type: "string" },
            from: { type: "string" },
            to: { type: "string" },
            amount: { type: "number" },
            l1_tx_id: { type: "string" },
            l2_tx_hash: { type: "string" },
            kaspa_address: { type: "string" },
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
      } else if (intent.action === "resolve_name") {
        const res = await base44.functions.invoke("igraAgent", { action: "resolve_name", extra: { name: intent.name || intent.to } });
        push({ role: "system", text: `🏷 INS RESOLVED\n${res.data.name}\n→ ${res.data.address}` });
      } else if (intent.action === "names") {
        const target = (intent.to || "alpha").toLowerCase();
        const local = getLocalAgent(target);
        const addr = local ? local.address
          : (target === "alpha" || target === "beta") ? agents?.[target]?.address
          : target;
        if (!addr || !addr.startsWith("0x")) {
          push({ role: "error", text: `I need an agent name or 0x address to look up names for — got "${target}".` });
        } else {
          const res = await base44.functions.invoke("igraAgent", { action: "names", extra: { address: addr } });
          const d = res.data;
          push({ role: "system", text: `📋 INS NAMES · ${addr.slice(0, 12)}…\nPRIMARY: ${d.primary || "none set"}\nOWNED: ${d.names?.length ? d.names.join(" · ") : "none registered"}\n\nREGISTER AT insdomains.org — SEND iKAS TO ANY .igra NAME VIA "send <amount> iKAS to <name>.igra".` });
        }
      } else if (intent.action === "status") {
        const res = await base44.functions.invoke("igraAgent", {
          action: "status",
          extra: locals.map((a) => ({ name: a.name, address: a.address })),
        });
        const lines = Object.entries(res.data.agents)
          .map(([n, a]) => `${n.toUpperCase()} ${Number(a.balance_ikas).toFixed(4)} iKAS${a.local ? " (LOCAL)" : ""}`);
        push({ role: "system", text: `${lines.join(" · ")} · CHAIN ${res.data.chain_id}` });
        onTxComplete?.();
      } else if (intent.action === "desk") {
        const res = await base44.functions.invoke("igraBridge", { action: "info" });
        const addr = res.data.kas_deposit_address;
        let kasBal = null;
        try {
          const b = await fetch(`https://api.kaspa.org/addresses/${encodeURIComponent(addr)}/balance`).then((r) => r.json());
          kasBal = (b.balance || 0) / 1e8;
        } catch { /* show address without balance */ }
        push({ role: "system", text: `🏛 DESK KAS FUNDING WALLET\n${addr}\n\nKAS BALANCE · ${kasBal !== null ? kasBal.toFixed(4) : "?"} KAS\niKAS POOL · ${Number(res.data.ikas_liquidity).toFixed(4)} iKAS\n\nADMIN FUNDS THIS WALLET — POWERS NATIVE KAS → iKAS SWAPS (MIN 10 KAS) AND INSTANT iKAS → KAS PAYOUTS.\nEVERY DESK SWAP RETAINS A 0.5% FEE IN THE POOLS — THE DESK REFILLS ITSELF AS PEOPLE TRADE.` });
      } else if (intent.action === "bridge_info") {
        const res = await base44.functions.invoke("igraBridge", { action: "info" });
        const d = res.data;
        push({ role: "system", text: `⇄ IGRA BRIDGE DESK · 1 KAS = 1 iKAS\n\nKAS → iKAS: send KAS on Kaspa L1 to\n${d.kas_deposit_address}\nthen say "claim <kaspa tx id> to <0x address or agent name>" — instant iKAS payout.\n\niKAS → KAS: say "swap <amount> iKAS from <agent> to <kaspa: address>" — I burn via Igra's NATIVE KasExitBridge${d.exit_min_kas ? ` (min ${d.exit_min_kas} KAS)` : ""}; KAS is released on L1 by the Igra multi-sig committee.\n\niKAS POOL · ${Number(d.ikas_liquidity).toFixed(4)} iKAS · DESK FEE ${d.desk_fee_pct ?? 0.5}% (RETAINED IN POOLS)` });
      } else if (intent.action === "bridge_kas_to_ikas") {
        const localDest = getLocalAgent(intent.to);
        const dest = localDest ? localDest.address
          : (intent.to === "alpha" || intent.to === "beta") ? agents?.[intent.to]?.address
          : intent.to;
        if (!intent.l1_tx_id && intent.amount >= 10 && dest) {
          // Desk KAS wallet is funded — mint iKAS NATIVELY via the Igra Entry bridge
          push({ role: "system", text: `⛏ NATIVE IGRA ENTRY · MINING 97b1 TX ID · ${intent.amount} KAS → ${dest.slice(0, 12)}…` });
          const res = await base44.functions.invoke("igraNativeEntry", { action: "entry", amount_kas: intent.amount, l2_address: dest });
          push({ role: "system", text: `✓ NATIVE ENTRY SUBMITTED ON KASPA L1\n${res.data.amount_kas} KAS → iKAS MINTS TO ${res.data.l2_address}\nMINED NONCE ${res.data.nonce} (${res.data.iterations} ITERATIONS)\nTX: ${res.data.tx_id}\nIGRA'S VIADUCT MINTS THE iKAS ON L2 — REAL NATIVE BRIDGE, NO DESK LIQUIDITY USED.` });
          onTxComplete?.();
        } else if (!intent.l1_tx_id) {
          const res = await base44.functions.invoke("igraBridge", { action: "info" });
          push({ role: "system", text: `STEP 1 · SEND KAS ON KASPA L1 TO THE BRIDGE ADDRESS:\n${res.data.kas_deposit_address}\n\nSTEP 2 · SAY: "claim <kaspa tx id> to <0x address or agent name>" — I verify the deposit and pay out iKAS 1:1 instantly.\n\nOR: "swap 10 KAS to <0x/agent>" mints iKAS NATIVELY from the desk wallet (min 10 KAS).` });
        } else {
          push({ role: "system", text: `VERIFYING KAS DEPOSIT ON KASPA L1 · ${intent.l1_tx_id.slice(0, 16)}…` });
          const res = await base44.functions.invoke("igraBridge", { action: "kas_to_ikas", l1_tx_id: intent.l1_tx_id, evm_address: dest });
          push({ role: "tx", tx: { amount_ikas: res.data.amount, from_agent: "bridge", to: res.data.recipient, block: null, tx_hash: res.data.tx_out, explorer_url: res.data.explorer_url } });
          onTxComplete?.();
        }
      } else if (intent.action === "bridge_ikas_to_kas") {
        const payoutAddr = intent.kaspa_address || getSavedKaspaAddress();
        if (!payoutAddr) {
          push({ role: "error", text: "I need a kaspa: payout address — say it in the command, or save yours in \"MY KASPA L1 ADDRESS\" above the chat." });
        } else if (intent.l2_tx_hash) {
          push({ role: "system", text: `SWAPPING TO KAS ON L1…` });
          const res = await base44.functions.invoke("igraBridge", { action: "ikas_to_kas", l2_tx_hash: intent.l2_tx_hash, kaspa_address: payoutAddr });
          push({ role: "system", text: `✓ SWAP EXECUTED · ${res.data.amount} KAS → ${res.data.recipient}\n${res.data.note || ""}\nTX: ${res.data.tx_out}` });
          onTxComplete?.();
        } else {
          // Resolve the sending wallet: exactly what the user named, or auto-pick the funded one
          const bal = (n) => Number(agents?.[n]?.balance_ikas || 0);
          let fromAgent = intent.from?.toLowerCase();
          const amount = intent.amount || (fromAgent ? bal(fromAgent) : 0);
          if (!amount || amount <= 0) {
            push({ role: "error", text: "How much iKAS should I swap? e.g. \"swap 0.05 iKAS from alpha to KAS\"" });
          } else {
            if (!fromAgent) {
              fromAgent = Object.keys(agents || {}).find((n) => bal(n) >= amount);
              if (fromAgent) push({ role: "system", text: `NO WALLET SPECIFIED · USING AGENT ${fromAgent.toUpperCase()} (${bal(fromAgent).toFixed(4)} iKAS)` });
            }
            if (!fromAgent) {
              push({ role: "error", text: `No agent wallet holds ${amount} iKAS. Balances: ${Object.entries(agents || {}).map(([n, a]) => `${n} ${Number(a.balance_ikas).toFixed(4)}`).join(" · ")}` });
            } else if (bal(fromAgent) < amount) {
              push({ role: "error", text: `AGENT ${fromAgent.toUpperCase()} only holds ${bal(fromAgent).toFixed(4)} iKAS — not enough for ${amount}.` });
            } else if (fromAgent === "alpha") {
              // Alpha IS the bridge pool — pay out directly, no deposit leg
              push({ role: "system", text: `SWAPPING ${amount} iKAS FROM ALPHA → NATIVE KASEXITBRIDGE…` });
              const res = await base44.functions.invoke("igraBridge", { action: "ikas_to_kas", from_pool: true, amount, kaspa_address: payoutAddr });
              push({ role: "system", text: `✓ EXIT REQUESTED · ${res.data.amount} KAS → ${res.data.recipient}\nKAS IS RELEASED ON L1 BY THE IGRA MULTI-SIG COMMITTEE (NOT INSTANT)\nBURN TX: ${res.data.tx_out}` });
              onTxComplete?.();
            } else {
              const localSender = getLocalAgent(fromAgent);
              push({ role: "system", text: `STEP 1/2 · MOVING ${amount} iKAS · ${fromAgent.toUpperCase()} → BRIDGE POOL…` });
              const dep = await base44.functions.invoke("igraAgent", {
                action: "send", from: fromAgent, to: "alpha", amount,
                ...(localSender ? { private_key: localSender.private_key } : {}),
              });
              push({ role: "system", text: `STEP 2/2 · BURNING iKAS VIA NATIVE KASEXITBRIDGE…` });
              const res = await base44.functions.invoke("igraBridge", { action: "ikas_to_kas", l2_tx_hash: dep.data.tx_hash, kaspa_address: payoutAddr });
              push({ role: "system", text: `✓ EXIT REQUESTED · ${res.data.amount} KAS → ${res.data.recipient}\nKAS IS RELEASED ON L1 BY THE IGRA MULTI-SIG COMMITTEE (NOT INSTANT)\nBURN TX: ${res.data.tx_out}` });
              onTxComplete?.();
            }
          }
        }
      }
    } catch (err) {
      push({ role: "error", text: err?.response?.data?.error || err.message || "Transaction failed" });
    }
    setBusy(false);
  };

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col"
      style={{ border: "1px solid rgba(201,162,75,0.25)", background: "rgba(8,7,4,0.75)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        height: fullHeight ? "100%" : "50vh", minHeight: fullHeight ? 0 : "380px" }}>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => {
          if (m.role === "tx") return (
            <div key={i} className="rounded-xl p-3 text-[10px] space-y-1"
              style={{ border: "1px solid rgba(110,231,183,0.35)", background: "rgba(6,24,17,0.45)", fontFamily: "monospace" }}>
              <div className="font-black tracking-[0.2em]" style={{ color: "#6EE7B7" }}>✓ TRANSACTION CONFIRMED ON IGRA</div>
              <div style={{ color: "rgba(180,240,215,0.7)" }}>{m.tx.amount_ikas} iKAS · agent {m.tx.from_agent} → {m.tx.to_name ? `🏷 ${m.tx.to_name} (${m.tx.to.slice(0, 10)}…)` : `${m.tx.to.slice(0, 10)}…`} · block {m.tx.block ?? "pending"}</div>
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
          const chatFont = m.role === "user" || m.role === "agent" ? IOS_FONT : "monospace";
          return (
            <div key={i} className={`flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "agent" && (
                <img src={IGRA_AGENT_LOGO} alt="Igra Agent"
                  className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                  style={{ border: "1px solid rgba(201,162,75,0.35)" }} />
              )}
              <div className="max-w-[85%] px-3 py-2 rounded-xl text-[12px] leading-relaxed whitespace-pre-wrap break-words"
                style={{ color: colors.color, border: `1px solid ${colors.border}`, background: colors.bg, fontFamily: chatFont }}>
                {m.text}
              </div>
            </div>
          );
        })}
        {busy && (
          <div className="flex items-center gap-2">
            <img src={IGRA_AGENT_LOGO} alt="" className="w-7 h-7 rounded-full object-cover"
              style={{ border: "1px solid rgba(201,162,75,0.35)" }} />
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#C9A24B" }} />
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form className="flex gap-2 p-3" style={{ borderTop: "1px solid rgba(201,162,75,0.18)" }}
        onSubmit={(e) => { e.preventDefault(); run(); }}>
        <input value={input} onChange={(e) => setInput(e.target.value)}
          placeholder='e.g. "forge a wallet called scout" or "alpha send 0.01 iKAS to beta"'
          className="flex-1 bg-transparent px-3 py-2 rounded-xl text-xs focus:outline-none"
          style={{ border: "1px solid rgba(201,162,75,0.25)", color: "#f5efe0", fontFamily: IOS_FONT }} />
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