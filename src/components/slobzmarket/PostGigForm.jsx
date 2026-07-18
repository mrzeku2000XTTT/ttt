import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Copy, Check } from "lucide-react";

export default function PostGigForm({ wallet, network = "mainnet", onPosted }) {
  const unit = network === "testnet" ? "TKAS" : "KAS";
  const [form, setForm] = useState({ title: "", task: "", requirements: "", amount: "" });
  const [step, setStep] = useState("form"); // form | fund
  const [gig, setGig] = useState(null);
  const [txHash, setTxHash] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleCreate = async () => {
    setError("");
    if (!wallet) return setError("Enter your Kaspa wallet address above first.");
    if (!form.title.trim() || !form.task.trim() || !form.amount) return setError("Title, task and amount are required.");
    setBusy(true);
    try {
      const res = await base44.functions.invoke("slobzEscrow", {
        action: "create",
        title: form.title,
        task_description: form.task,
        requirements: form.requirements || form.task,
        amount_kas: Number(form.amount),
        poster_wallet: wallet,
        network,
      });
      setGig(res.data);
      setStep("fund");
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    if (!txHash.trim()) return setError("Paste the transaction hash of your escrow payment.");
    setBusy(true);
    try {
      await base44.functions.invoke("slobzEscrow", {
        action: "verify_funding",
        gig_id: gig.gig_id,
        tx_hash: txHash.trim(),
      });
      onPosted?.();
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  };

  const copyAddr = () => {
    navigator.clipboard.writeText(gig.escrow_address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const inputCls =
    "w-full bg-[#F3F0FA] rounded-[16px] px-4 py-3 text-sm text-[#1F1B2E] placeholder-[#8B84A3] outline-none focus:ring-2 focus:ring-[#7C5CFC]/40";

  if (step === "fund" && gig) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-[#3A3450]">
          Escrow wallet created. Send <span className="font-bold text-[#7C5CFC]">{gig.amount_kas} {unit}</span> to lock the funds:
        </div>
        <div className="flex items-center gap-2 bg-[#F3F0FA] rounded-[16px] p-3">
          <code className="text-[10px] text-[#3A3450] break-all flex-1">{gig.escrow_address}</code>
          <button onClick={copyAddr} className="p-2 rounded-full bg-[#7C5CFC] text-white flex-shrink-0">
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        <input className={inputCls} placeholder="Paste your payment transaction hash" value={txHash} onChange={(e) => setTxHash(e.target.value)} />
        {error && <div className="text-xs text-[#F96B4C]">{error}</div>}
        <button
          onClick={handleVerify}
          disabled={busy}
          className="w-full py-3.5 rounded-full bg-gradient-to-b from-[#FF8A6B] to-[#F96B4C] text-white text-xs font-display font-extrabold shadow-[0_8px_20px_rgba(249,107,76,0.4)] disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} VERIFY FUNDING & OPEN GIG
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input className={inputCls} placeholder="Gig title (e.g. Tag 50 product images)" value={form.title} onChange={set("title")} />
      <textarea className={`${inputCls} min-h-[80px] resize-none`} placeholder="What must the worker do?" value={form.task} onChange={set("task")} />
      <textarea
        className={`${inputCls} min-h-[60px] resize-none`}
        placeholder="Acceptance criteria — what must the proof screenshot show? (the escrow agent checks against this)"
        value={form.requirements}
        onChange={set("requirements")}
      />
      <input className={inputCls} type="number" min="1" placeholder={`Escrow amount in ${unit} (min 1)`} value={form.amount} onChange={set("amount")} />
      {error && <div className="text-xs text-[#F96B4C]">{error}</div>}
      <button
        onClick={handleCreate}
        disabled={busy}
        className="w-full py-3.5 rounded-full bg-[#7C5CFC] hover:bg-[#6B4BEB] text-white text-xs font-display font-extrabold shadow-[0_8px_20px_rgba(124,92,252,0.4)] disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
      >
        {busy && <Loader2 className="w-4 h-4 animate-spin" />} CREATE COVENANT ESCROW
      </button>
    </div>
  );
}