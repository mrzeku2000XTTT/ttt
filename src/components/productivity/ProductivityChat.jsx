import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User as UserIcon, Loader2, Copy, Check, Zap, Wallet, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { getAllOwnedAddresses, getPrivateKeyFor } from "@/lib/kachingVault";
import { parseProductivityTools, stripToolBlocks } from "@/lib/productivityTools";
import ProductivityToolWidget from "./ProductivityToolWidget";

const PRICE_KAS = 0.05;
const SERVICE_ID = "productivity-coach";

const STARTER = [
  {
    role: "assistant",
    content:
      "Hey — I'm Better Ideas AI, trained on Joey Schweitzer's channel. Tell me what you're avoiding or what you want to build, and I'll coach you and drop a tool to start now. Each reply is 0.05 KAS, pay-as-you-go on Kaspa L1.",
  },
];

export default function ProductivityChat() {
  const [messages, setMessages] = useState(STARTER);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(null); // { invoice_id, pay_to, amount_kas }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [txId, setTxId] = useState("");
  const [copied, setCopied] = useState(false);
  const [wallets, setWallets] = useState([]);
  const [walletIdx, setWalletIdx] = useState(0);
  const [paying, setPaying] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    try {
      setWallets(getAllOwnedAddresses() || []);
    } catch {
      setWallets([]);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, pending, busy]);

  const buildConversation = (newText) => {
    const recent = messages.slice(-6).map((m) => ({ role: m.role, content: stripToolBlocks(m.content) }));
    recent.push({ role: "user", content: newText });
    return JSON.stringify(recent).slice(0, 1900);
  };

  const handleSend = async (text) => {
    if (!text.trim() || busy) return;
    setError("");
    setTxId("");
    setMessages((prev) => [...prev, { role: "user", content: text.trim() }]);
    setBusy(true);
    try {
      await base44.functions.invoke("awaX402", {
        action: "request",
        service_id: SERVICE_ID,
        input: buildConversation(text.trim()),
      });
      setError("No payment required — unexpected response.");
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      if (status === 402 && data?.accepts?.[0]) {
        setPending(data.accepts[0]);
      } else if (status === 401) {
        setError("Please log in to use the coach.");
      } else {
        setError(data?.error || err?.message || "Request failed");
      }
    } finally {
      setBusy(false);
    }
  };

  const settle = async (invoiceId, tx) => {
    setPaying(true);
    setError("");
    try {
      const res = await base44.functions.invoke("awaX402", { action: "settle", invoice_id: invoiceId, tx_id: tx });
      const d = res?.data || res;
      const tools = parseProductivityTools(d.result || "");
      const content = stripToolBlocks(d.result || "");
      setMessages((prev) => [...prev, { role: "assistant", content, tools }]);
      setPending(null);
      setTxId("");
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Settle failed");
    } finally {
      setPaying(false);
    }
  };

  const payWithWallet = async () => {
    const w = wallets[walletIdx];
    if (!w) {
      setError("No KaChing wallet found — import one in KaChing Wallet, or pay manually.");
      return;
    }
    setPaying(true);
    setError("");
    try {
      const res = await base44.functions.invoke("sendKaspaTransaction", {
        privateKey: getPrivateKeyFor(w.address),
        fromAddress: w.address,
        toAddress: pending.pay_to,
        amountKas: String(pending.amount_kas),
      });
      const d = res?.data || res;
      if (d?.error) throw new Error(d.error);
      const tx = (d?.txId || "").toLowerCase().replace(/^0x/, "");
      if (!/^[0-9a-f]{64}$/.test(tx)) throw new Error("Send succeeded but no valid tx id returned");
      await settle(pending.invoice_id, tx);
    } catch (e) {
      setError(e?.message || "Wallet payment failed");
      setPaying(false);
    }
  };

  const payManual = async () => {
    const tx = txId.trim().toLowerCase().replace(/^0x/, "");
    if (!/^[0-9a-f]{64}$/.test(tx)) {
      setError("Paste the 64-character Kaspa transaction id");
      return;
    }
    await settle(pending.invoice_id, tx);
  };

  const copyAddr = () => {
    navigator.clipboard.writeText(pending.pay_to).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || busy) return;
    handleSend(input);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full min-h-[460px]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-cyan-300" />
              </div>
            )}
            <div className={`max-w-[88%] rounded-xl px-3 py-2 text-sm ${m.role === "user" ? "bg-cyan-500 text-black" : "bg-white/5 text-white/90 border border-white/10"}`}>
              <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
              {m.tools?.map((t, j) => (
                <ProductivityToolWidget key={j} tool={t} storageId={`msg-${i}-${j}`} />
              ))}
            </div>
            {m.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <UserIcon className="w-4 h-4 text-white/80" />
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-cyan-300 animate-pulse" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/60">Preparing x402 quote…</div>
          </div>
        )}
      </div>

      {pending && (
        <div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/[0.06] p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-amber-300 font-mono font-black text-[10px] tracking-widest">HTTP 402 · PAYMENT REQUIRED</span>
            <span className="text-white font-black text-lg">{pending.amount_kas} KAS</span>
          </div>
          <button onClick={copyAddr} className="w-full flex items-center gap-2 bg-black/50 border border-white/10 hover:border-amber-400/40 rounded-lg px-2.5 py-2 text-left">
            <span className="flex-1 text-amber-300 font-mono text-[10px] break-all">{pending.pay_to}</span>
            {copied ? <Check className="w-4 h-4 text-amber-400 flex-shrink-0" /> : <Copy className="w-4 h-4 text-white/40 flex-shrink-0" />}
          </button>
          {wallets.length > 0 && (
            <div className="flex items-center gap-2">
              <select value={walletIdx} onChange={(e) => setWalletIdx(Number(e.target.value))} className="flex-1 h-9 px-2 rounded-lg bg-black/50 border border-white/10 text-xs text-white outline-none">
                {wallets.map((w, i) => (
                  <option key={w.address} value={i} className="bg-black">
                    {w.label || "Wallet"} — {w.address.slice(0, 10)}…{w.address.slice(-4)}
                  </option>
                ))}
              </select>
              <Button onClick={payWithWallet} disabled={paying} className="bg-emerald-500 hover:bg-emerald-400 text-black h-9">
                {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Wallet className="w-4 h-4 mr-1" /> Pay</>}
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input value={txId} onChange={(e) => setTxId(e.target.value)} placeholder="…or paste Kaspa tx id" className="flex-1 h-9 px-2.5 rounded-lg bg-black/50 border border-white/10 text-white font-mono text-xs outline-none" />
            <Button onClick={payManual} disabled={paying || !txId.trim()} className="bg-amber-500 hover:bg-amber-400 text-black h-9">
              {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Settle"}
            </Button>
          </div>
          <p className="text-white/30 text-[10px] text-center">Verified on Kaspa consensus — one tx settles one invoice.</p>
        </div>
      )}

      {error && (
        <div className="mt-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What are you avoiding right now?"
          rows={2}
          className="resize-none text-sm bg-black/40 border-white/10 text-white placeholder:text-white/40"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <Button type="submit" disabled={busy || !input.trim() || paying} className="bg-cyan-500 hover:bg-cyan-400 text-black">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </form>
      <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[10px] text-white/40">
        <Zap className="w-3 h-3" /> {PRICE_KAS} KAS per reply · pay-as-you-go · powered by Argent + AWA x402
      </div>
    </div>
  );
}