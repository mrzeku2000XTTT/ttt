import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User as UserIcon, Loader2, Copy, Check, Zap, Wallet, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { getAnyWallet } from "@/lib/localKaspaWallet";
import { parseProductivityTools, stripToolBlocks } from "@/lib/productivityTools";
import ProductivityToolWidget from "./ProductivityToolWidget";

const PRICE_KAS = 0.05;
const SERVICE_ID = "productivity-coach";

const STARTER = [
  {
    role: "assistant",
    content:
      "Hey — I'm Better Ideas AI. Tell me what you're avoiding or what you want to build, and I'll coach you and drop a tool to start now. Each reply is 0.05 KAS, pay-as-you-go on Kaspa L1.",
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
  const [paying, setPaying] = useState(false);
  const [balance, setBalance] = useState(null);
  const [loadingBal, setLoadingBal] = useState(false);
  const [mainWallet, setMainWallet] = useState(null);
  const scrollRef = useRef(null);

  const loadBalance = async () => {
    const w = getAnyWallet();
    setMainWallet(w);
    if (!w?.address) { setBalance(0); return; }
    setLoadingBal(true);
    try {
      const r = await base44.functions.invoke("getKaspaBalance", { address: w.address }).catch(() => null);
      const d = r?.data || r;
      setBalance(d && (d.balanceKAS ?? d.balance) != null ? Number(d.balanceKAS ?? d.balance) : 0);
    } catch { setBalance(0); }
    finally { setLoadingBal(false); }
  };

  useEffect(() => {
    loadBalance();
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
    const w = mainWallet;
    if (!w?.address || !w?.privateKey) {
      setError("No TTT main wallet found — create or import one in the Wallet page, or pay manually.");
      return;
    }
    setPaying(true);
    setError("");
    try {
      const res = await base44.functions.invoke("sendKaspaTransaction", {
        privateKey: w.privateKey,
        fromAddress: w.address,
        toAddress: pending.pay_to,
        amountKas: String(pending.amount_kas),
      });
      const d = res?.data || res;
      if (d?.error) throw new Error(d.error);
      const tx = (d?.txId || "").toLowerCase().replace(/^0x/, "");
      if (!/^[0-9a-f]{64}$/.test(tx)) throw new Error("Send succeeded but no valid tx id returned");
      await settle(pending.invoice_id, tx);
      loadBalance();
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
    <div className="flex flex-col h-full min-h-[460px] text-[#f0f0f0]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-[#ff9d7d]/10 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_0_12px_rgba(255,157,125,0.4)]">
                <Bot className="w-4 h-4 text-[#ff9d7d]" />
              </div>
            )}
            <div className={`max-w-[88%] rounded-xl px-3 py-2 text-sm ${m.role === "user" ? "bg-[#ff9d7d] text-white" : "bg-[#1f2024] text-[#f0f0f0] border border-[#44464c]"}`}>
              <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
              {m.tools?.map((t, j) => (
                <ProductivityToolWidget key={j} tool={t} storageId={`msg-${i}-${j}`} />
              ))}
            </div>
            {m.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-[#2a2b30] flex items-center justify-center flex-shrink-0 mt-0.5">
                <UserIcon className="w-4 h-4 text-[#a0a0a0]" />
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 rounded-full bg-[#ff9d7d]/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-[#ff9d7d] animate-pulse" />
            </div>
            <div className="bg-[#1f2024] border border-[#44464c] rounded-xl px-3 py-2 text-sm text-[#a0a0a0]">Preparing x402 quote…</div>
          </div>
        )}
      </div>

      {pending && (
        <div className="mt-3 rounded-xl border border-[#ff9d7d]/40 bg-[#1f2024] p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[#ff9d7d] font-mono font-black text-[10px] tracking-widest">HTTP 402 · PAYMENT REQUIRED</span>
            <span className="text-white font-black text-lg">{pending.amount_kas} KAS</span>
          </div>
          <div className="flex items-center justify-between bg-[#2a2b30] border border-[#44464c] rounded-lg px-2.5 py-1.5">
            <span className="text-[11px] text-[#a0a0a0] flex items-center gap-1"><Wallet className="w-3 h-3" /> TTT Wallet balance</span>
            {loadingBal ? (
              <Loader2 className="w-3.5 h-3.5 text-[#a0a0a0] animate-spin" />
            ) : balance === null ? (
              <span className="text-[11px] text-[#a0a0a0]">—</span>
            ) : (
              <span className={`text-[12px] font-bold ${balance >= pending.amount_kas ? "text-emerald-600" : "text-red-500"}`}>
                {balance.toFixed(4)} KAS {balance >= pending.amount_kas ? "" : "· insufficient"}
              </span>
            )}
          </div>
          <button onClick={copyAddr} className="w-full flex items-center gap-2 bg-[#2a2b30] border border-[#44464c] hover:border-[#ff9d7d]/60 rounded-lg px-2.5 py-2 text-left">
            <span className="flex-1 text-[#ff9d7d] font-mono text-[10px] break-all">{pending.pay_to}</span>
            {copied ? <Check className="w-4 h-4 text-[#ff9d7d] flex-shrink-0" /> : <Copy className="w-4 h-4 text-[#a0a0a0] flex-shrink-0" />}
          </button>
          {mainWallet && mainWallet.privateKey && (
            <Button onClick={payWithWallet} disabled={paying} className="w-full bg-[#ff9d7d] hover:bg-[#ff8c66] text-white h-9">
              {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Wallet className="w-4 h-4 mr-1" /> Pay with TTT Wallet</>}
            </Button>
          )}
          <div className="flex items-center gap-2">
            <input value={txId} onChange={(e) => setTxId(e.target.value)} placeholder="…or paste Kaspa tx id" className="flex-1 h-9 px-2.5 rounded-lg bg-[#2a2b30] border border-[#44464c] text-[#f0f0f0] font-mono text-xs outline-none focus:border-[#ff9d7d]/60" />
            <Button onClick={payManual} disabled={paying || !txId.trim()} className="bg-transparent border border-[#ff9d7d] text-[#ff9d7d] hover:bg-[#ff9d7d]/10 h-9">
              {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Settle"}
            </Button>
          </div>
          <p className="text-[#a0a0a0] text-[10px] text-center">Verified on Kaspa consensus — one tx settles one invoice.</p>
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
          className="resize-none text-sm bg-[#25262a] border-[#44464c] text-[#f0f0f0] placeholder:text-[#a0a0a0] focus:border-[#ff9d7d]/60"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <Button type="submit" disabled={busy || !input.trim() || paying} className="bg-[#ff9d7d] hover:bg-[#ff8c66] text-white">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </form>
      <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[10px] text-[#ff9d7d]">
        <Zap className="w-3 h-3" /> {PRICE_KAS} KAS per reply · pay-as-you-go · powered by Argent + AWA x402
      </div>
    </div>
  );
}