import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User as UserIcon, Loader2, Copy, Check, Zap, Wallet, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { getAnyWallet } from "@/lib/localKaspaWallet";
import { getAllOwnedAddresses, getPrivateKeyFor } from "@/lib/kachingVault";
import { parseProductivityTools, stripToolBlocks } from "@/lib/productivityTools";
import { getStoredPinHash } from "@/components/wallet/walletLock";
import ProductivityToolWidget from "./ProductivityToolWidget";
import ProductivityPinModal from "./ProductivityPinModal";

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
  const [loadingBal, setLoadingBal] = useState(false);
  const [walletSource, setWalletSource] = useState("ttt");
  const [mainWallet, setMainWallet] = useState(null);
  const [kachingWallets, setKachingWallets] = useState([]);
  const [kachingIdx, setKachingIdx] = useState(0);
  const [tttInfo, setTttInfo] = useState({ balance: null, utxos: 0, pending: 0 });
  const [kachingInfo, setKachingInfo] = useState({ balance: null, utxos: 0, pending: 0 });
  const [pinAuth, setPinAuth] = useState(false);
  const [resolvedPay, setResolvedPay] = useState(null);
  const scrollRef = useRef(null);

  const info = walletSource === "ttt" ? tttInfo : kachingInfo;
  const balance = info.balance;

  const fetchSpendable = async (addr) => {
    try {
      const r = await base44.functions.invoke("getKaspaSpendable", { address: addr }).catch(() => null);
      const d = r?.data || r;
      if (d && d.success !== false && d.spendableKAS != null) {
        return { balance: Number(d.spendableKAS) || 0, utxos: Number(d.matureUtxoCount ?? d.utxoCount ?? 0), pending: Number(d.pendingUtxoCount ?? 0) };
      }
      const rb = await base44.functions.invoke("getKaspaBalance", { address: addr }).catch(() => null);
      const db = rb?.data || rb;
      return { balance: db && (db.balanceKAS ?? db.balance) != null ? Number(db.balanceKAS ?? db.balance) : 0, utxos: 0, pending: 0 };
    } catch { return { balance: 0, utxos: 0, pending: 0 }; }
  };

  const loadBalance = async () => {
    const w = getAnyWallet();
    setMainWallet(w);
    const kaching = (getAllOwnedAddresses() || []).filter(Boolean);
    setKachingWallets(kaching);
    setLoadingBal(true);
    await Promise.all([
      (async () => {
        if (!w?.address) { setTttInfo({ balance: 0, utxos: 0, pending: 0 }); return; }
        setTttInfo(await fetchSpendable(w.address));
      })(),
      (async () => {
        if (kaching.length === 0) { setKachingInfo({ balance: 0, utxos: 0, pending: 0 }); return; }
        const results = await Promise.all(kaching.map((k) => fetchSpendable(k.address)));
        const merged = results.reduce((acc, r) => ({ balance: acc.balance + r.balance, utxos: acc.utxos + r.utxos, pending: acc.pending + r.pending }), { balance: 0, utxos: 0, pending: 0 });
        setKachingInfo(merged);
      })(),
    ]);
    setLoadingBal(false);
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
        loadBalance();
      } else if (status === 401) {
        setError("Please log in to use the coach.");
      } else if (status === 500) {
        setError(data?.error ? `Service error: ${data.error}` : "Service is temporarily unavailable. Please try again.");
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
      const status = err?.response?.status;
      const data = err?.response?.data;
      if (status === 500) {
        setError(data?.error ? `Service error: ${data.error}` : "Settlement failed. Your payment may still be on-chain — wait a few seconds and retry Settle.");
      } else {
        setError(data?.error || err?.message || "Settle failed");
      }
    } finally {
      setPaying(false);
    }
  };

  const beginPay = async () => {
    setError("");
    const srcLabel = walletSource === "ttt" ? "TTT" : "KaChing";
    if (balance != null && balance < pending.amount_kas) {
      setError(`Not enough spendable KAS in your ${srcLabel} wallet (need ${pending.amount_kas} KAS, have ${balance.toFixed(4)} KAS confirmed). Top up, wait for pending UTXOs to confirm, switch source, or paste a manual tx below.`);
      return;
    }
    let fromAddress, privateKey;
    if (walletSource === "ttt") {
      if (!mainWallet?.address || !mainWallet?.privateKey) {
        setError("No TTT main wallet found — create or import one in the Wallet page, or pay manually.");
        return;
      }
      fromAddress = mainWallet.address;
      privateKey = mainWallet.privateKey;
    } else {
      const kw = kachingWallets[kachingIdx];
      if (!kw?.address) {
        setError("No KaChing wallet found — import one in KaChing Wallet, or pay manually.");
        return;
      }
      fromAddress = kw.address;
      privateKey = getPrivateKeyFor(kw.address);
    }
    // PIN gate — require unlock if a wallet PIN is set
    if (getStoredPinHash()) {
      setResolvedPay({ fromAddress, privateKey });
      setPinAuth(true);
      return;
    }
    await doPay(fromAddress, privateKey);
  };

  const onPinVerified = async () => {
    setPinAuth(false);
    const r = resolvedPay;
    setResolvedPay(null);
    if (r) await doPay(r.fromAddress, r.privateKey);
  };

  const doPay = async (fromAddress, privateKey) => {
    const srcLabel = walletSource === "ttt" ? "TTT" : "KaChing";
    setPaying(true);
    try {
      const res = await base44.functions.invoke("sendKaspaTransaction", {
        privateKey,
        fromAddress,
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
      const msg = String(e?.message || "Wallet payment failed").toLowerCase();
      if (msg.includes("insufficient") || msg.includes("balance") || msg.includes("funds") || msg.includes("not enough") || msg.includes("enough") || msg.includes("no utxo") || msg.includes("unconfirmed")) {
        setError(`Not enough spendable KAS in your ${srcLabel} wallet to cover ${pending.amount_kas} KAS. Top up, wait for pending UTXOs to confirm, switch source, or paste a manual tx below.`);
      } else if (msg.includes("still confirming") || msg.includes("orphan") || msg.includes("already spent")) {
        setError("A previous transaction is still confirming. Wait ~10 seconds and try again.");
      } else {
        setError(e?.message || "Wallet payment failed");
      }
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
          <div className="flex items-center gap-1 bg-[#2a2b30] border border-[#44464c] rounded-lg p-1">
            <button onClick={() => setWalletSource("ttt")} className={`flex-1 h-7 rounded-md text-[11px] font-medium transition ${walletSource === "ttt" ? "bg-[#ff9d7d] text-white" : "text-[#a0a0a0] hover:text-white"}`}>TTT Wallet</button>
            <button onClick={() => setWalletSource("kaching")} disabled={kachingWallets.length === 0} className={`flex-1 h-7 rounded-md text-[11px] font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${walletSource === "kaching" ? "bg-[#ff9d7d] text-white" : "text-[#a0a0a0] hover:text-white"}`}>KaChing</button>
          </div>
          <div className="flex items-center justify-between bg-[#2a2b30] border border-[#44464c] rounded-lg px-2.5 py-1.5">
            <span className="text-[11px] text-[#a0a0a0] flex items-center gap-1"><Wallet className="w-3 h-3" /> {walletSource === "ttt" ? "TTT Wallet" : "KaChing"}</span>
            {loadingBal ? (
              <Loader2 className="w-3.5 h-3.5 text-[#a0a0a0] animate-spin" />
            ) : balance === null ? (
              <span className="text-[11px] text-[#a0a0a0]">—</span>
            ) : (
              <span className={`text-[12px] font-bold ${balance >= pending.amount_kas ? "text-emerald-400" : "text-red-400"}`}>
                {balance.toFixed(4)} KAS {balance >= pending.amount_kas ? "" : "· insufficient"}
              </span>
            )}
          </div>
          {balance !== null && !loadingBal && (
            <div className="flex items-center justify-between px-1 -mt-1.5">
              <span className="text-[10px] text-[#a0a0a0]">{info.utxos} spendable UTXO{info.utxos === 1 ? "" : "s"}{info.pending > 0 ? ` · ${info.pending} pending` : ""}</span>
              {info.pending > 0 && <span className="text-[10px] text-amber-400">confirming…</span>}
            </div>
          )}
          {walletSource === "kaching" && kachingWallets.length > 1 && (
            <select value={kachingIdx} onChange={(e) => setKachingIdx(Number(e.target.value))} className="w-full h-9 px-2 rounded-lg bg-[#2a2b30] border border-[#44464c] text-[#f0f0f0] text-xs outline-none">
              {kachingWallets.map((k, i) => (
                <option key={k.address} value={i}>{k.label || "Wallet"} — {k.address.slice(0, 10)}…{k.address.slice(-4)}</option>
              ))}
            </select>
          )}
          <button onClick={copyAddr} className="w-full flex items-center gap-2 bg-[#2a2b30] border border-[#44464c] hover:border-[#ff9d7d]/60 rounded-lg px-2.5 py-2 text-left">
            <span className="flex-1 text-[#ff9d7d] font-mono text-[10px] break-all">{pending.pay_to}</span>
            {copied ? <Check className="w-4 h-4 text-[#ff9d7d] flex-shrink-0" /> : <Copy className="w-4 h-4 text-[#a0a0a0] flex-shrink-0" />}
          </button>
          {((walletSource === "ttt" && mainWallet?.privateKey) || (walletSource === "kaching" && kachingWallets.length > 0)) && (
            <Button onClick={beginPay} disabled={paying} className="w-full bg-[#ff9d7d] hover:bg-[#ff8c66] text-white h-9">
              {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Wallet className="w-4 h-4 mr-1" /> Pay with {walletSource === "ttt" ? "TTT Wallet" : "KaChing"}</>}
            </Button>
          )}
          {walletSource === "ttt" && !mainWallet?.privateKey && (
            <p className="text-[11px] text-[#a0a0a0] text-center">No TTT wallet found — create/import one in the Wallet page, switch to KaChing, or paste a tx below.</p>
          )}
          {walletSource === "kaching" && kachingWallets.length === 0 && (
            <p className="text-[11px] text-[#a0a0a0] text-center">No KaChing wallet found — import one in KaChing Wallet, switch to TTT, or paste a tx below.</p>
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

      {pinAuth && (
        <ProductivityPinModal amount={pending?.amount_kas} onVerified={onPinVerified} onClose={() => { setPinAuth(false); setResolvedPay(null); }} />
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