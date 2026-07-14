import React, { useState } from "react";
import { X, Loader2, Copy, Check, ShieldCheck } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { base44 } from "@/api/base44Client";

// The x402 flow: request → 402 quote → pay on L1 → settle with tx id → service delivered
export default function AWAInvoiceModal({ service, onClose }) {
  const [step, setStep] = useState("input"); // input | quote | delivered
  const [input, setInput] = useState("");
  const [quote, setQuote] = useState(null);
  const [txId, setTxId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [delivery, setDelivery] = useState(null);
  const [copied, setCopied] = useState(false);

  const requestService = async () => {
    if (!input.trim()) return;
    setBusy(true); setError("");
    try {
      await base44.functions.invoke("awaX402", { action: "request", service_id: service.id, input: input.trim() });
    } catch (err) {
      const data = err?.response?.data;
      if (err?.response?.status === 402 && data?.accepts?.[0]) {
        setQuote(data.accepts[0]);
        setStep("quote");
      } else {
        setError(data?.error || err.message);
      }
    }
    setBusy(false);
  };

  const settle = async () => {
    const tx = txId.trim().toLowerCase().replace(/^0x/, "");
    if (!/^[0-9a-f]{64}$/.test(tx)) { setError("Paste the 64-character Kaspa transaction id"); return; }
    setBusy(true); setError("");
    try {
      const res = await base44.functions.invoke("awaX402", { action: "settle", invoice_id: quote.invoice_id, tx_id: tx });
      setDelivery(res.data);
      setStep("delivered");
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    }
    setBusy(false);
  };

  const copyAddr = () => {
    navigator.clipboard.writeText(quote.pay_to).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-zinc-950 border border-emerald-500/30 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-emerald-500/10">
          <span className="text-white font-bold text-sm">{service.name}</span>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {step === "input" && (
            <>
              <p className="text-white/50 text-xs">Describe what you want the agent to deliver. You'll get an x402 quote next.</p>
              <textarea autoFocus value={input} onChange={(e) => setInput(e.target.value)} rows={4}
                placeholder={service.id === "forge-image" ? "e.g. A cyberpunk Kaspa vault glowing in teal, cinematic" : "e.g. Current state of x402 agent payments across chains"}
                className="w-full bg-black/50 border border-white/10 focus:border-emerald-400/50 rounded-xl px-3 py-2.5 text-white text-sm outline-none resize-none" />
              <button onClick={requestService} disabled={busy || !input.trim()}
                className="w-full py-2.5 rounded-xl bg-emerald-500 text-black font-black text-sm hover:bg-emerald-400 disabled:opacity-40 flex items-center justify-center gap-2">
                {busy && <Loader2 className="w-4 h-4 animate-spin" />} REQUEST SERVICE
              </button>
            </>
          )}

          {step === "quote" && quote && (
            <>
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
                <div className="text-amber-300 font-mono font-black text-xs tracking-widest">HTTP 402 · PAYMENT REQUIRED</div>
                <div className="text-white font-black text-2xl mt-1">{quote.amount_kas} KAS</div>
                <div className="text-white/40 text-[10px] font-mono mt-1">invoice {quote.invoice_id}</div>
              </div>
              <div>
                <div className="text-white/40 text-[10px] font-bold tracking-widest mb-1">STEP 1 · SEND EXACTLY {quote.amount_kas} KAS (OR MORE) TO</div>
                <button onClick={copyAddr}
                  className="w-full flex items-center gap-2 bg-black/50 border border-white/10 hover:border-emerald-400/40 rounded-xl px-3 py-2.5 text-left">
                  <span className="flex-1 text-emerald-300 font-mono text-[10px] break-all">{quote.pay_to}</span>
                  {copied ? <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <Copy className="w-4 h-4 text-white/40 flex-shrink-0" />}
                </button>
              </div>
              <div>
                <div className="text-white/40 text-[10px] font-bold tracking-widest mb-1">STEP 2 · PASTE YOUR TRANSACTION ID</div>
                <input value={txId} onChange={(e) => setTxId(e.target.value)} placeholder="64-hex Kaspa tx id"
                  className="w-full bg-black/50 border border-white/10 focus:border-emerald-400/50 rounded-xl px-3 py-2.5 text-white font-mono text-xs outline-none" />
              </div>
              <button onClick={settle} disabled={busy || !txId.trim()}
                className="w-full py-2.5 rounded-xl bg-emerald-500 text-black font-black text-sm hover:bg-emerald-400 disabled:opacity-40 flex items-center justify-center gap-2">
                {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> VERIFYING ON L1 & DELIVERING…</> : "SETTLE & DELIVER"}
              </button>
              <p className="text-white/30 text-[10px] text-center">Payment is verified against Kaspa consensus — one tx settles one invoice, ever.</p>
            </>
          )}

          {step === "delivered" && delivery && (
            <>
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                <ShieldCheck className="w-4 h-4" /> PAID {delivery.paid_kas ?? quote?.amount_kas} KAS · SERVICE DELIVERED
              </div>
              {delivery.result_type === "image_url" ? (
                <img src={delivery.result} alt="Delivered artwork" className="w-full rounded-xl border border-white/10" />
              ) : (
                <div className="prose prose-invert prose-sm max-w-none bg-black/40 border border-white/10 rounded-xl p-4 text-white/80 text-xs">
                  <ReactMarkdown>{delivery.result}</ReactMarkdown>
                </div>
              )}
              <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-white/10 text-white font-bold text-sm hover:bg-white/20">Done</button>
            </>
          )}

          {error && <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-xs">{error}</div>}
        </div>
      </div>
    </div>
  );
}