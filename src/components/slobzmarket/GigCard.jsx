import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Upload, ExternalLink, ShieldCheck } from "lucide-react";

const statusStyle = {
  open: "bg-[#E4F7EC] text-[#1E9E5A]",
  claimed: "bg-[#FFF1E9] text-[#F96B4C]",
  pending_review: "bg-[#F3F0FA] text-[#7C5CFC]",
  paid: "bg-[#E9E4F5] text-[#4A2FA8]",
  cancelled: "bg-[#F3F0FA] text-[#8B84A3]",
};

export default function GigCard({ gig, wallet, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState(null); // {type, text}
  const [showSubmit, setShowSubmit] = useState(false);

  const isWorker = wallet && gig.worker_wallet === wallet;
  const isPoster = wallet && gig.poster_wallet === wallet;
  const isTestnet = gig.network === "testnet";
  const unit = isTestnet ? "TKAS" : "KAS";
  const explorer = isTestnet ? "https://explorer-tn10.kaspa.org" : "https://explorer.kaspa.org";

  const run = async (fn) => {
    setBusy(true);
    setMessage(null);
    try {
      await fn();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.error || err?.response?.data?.reason || err.message });
    } finally {
      setBusy(false);
    }
  };

  const handleClaim = () =>
    run(async () => {
      if (!wallet) throw new Error("Enter your Kaspa wallet address above first.");
      await base44.functions.invoke("slobzEscrow", { action: "claim", gig_id: gig.id, worker_wallet: wallet });
      onChanged?.();
    });

  const handleProofFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    run(async () => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const res = await base44.functions.invoke("slobzEscrow", {
        action: "submit_proof",
        gig_id: gig.id,
        worker_wallet: wallet,
        proof_url: file_url,
        notes,
      });
      const d = res.data;
      if (d.status === "paid") {
        setMessage({ type: "success", text: `Escrow released! ${d.amount_kas} KAS sent to your wallet.` });
      } else {
        setMessage({ type: d.status === "rejected" ? "error" : "info", text: d.reason });
      }
      onChanged?.();
    });
  };

  return (
    <div className="bg-[#FDFBF7] rounded-[28px] shadow-[0_16px_40px_rgba(124,92,252,0.14)] p-6">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-heading text-lg font-semibold text-[#1F1B2E] leading-snug">{gig.title}</h3>
        <span className={`px-3 py-1 rounded-full text-[10px] font-display font-extrabold uppercase flex-shrink-0 ${statusStyle[gig.status] || statusStyle.cancelled}`}>
          {gig.status.replace("_", " ")}
        </span>
      </div>

      <p className="text-xs text-[#7A7290] leading-relaxed mb-3">{gig.task_description}</p>

      <div className="flex items-center gap-2 bg-[#F3F0FA] rounded-[14px] px-3 py-2 mb-4">
        <ShieldCheck className="w-4 h-4 text-[#7C5CFC] flex-shrink-0" />
        <span className="text-[11px] text-[#5A4B8A]">
          <span className="font-bold text-[#7C5CFC]">{gig.amount_kas} {unit}</span> locked in on-chain escrow{isTestnet ? " (testnet)" : ""}
        </span>
        {gig.funding_tx && (
          <a
            href={`${explorer}/txs/${gig.funding_tx}`}
            target="_blank"
            rel="noreferrer"
            className="ml-auto text-[#7C5CFC]"
            title="View escrow funding on-chain"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {message && (
        <div
          className={`text-xs rounded-[14px] px-3 py-2 mb-3 ${
            message.type === "success" ? "bg-[#E4F7EC] text-[#1E9E5A]" : message.type === "error" ? "bg-[#FFF1E9] text-[#F96B4C]" : "bg-[#F3F0FA] text-[#5A4B8A]"
          }`}
        >
          {message.text}
        </div>
      )}

      {gig.status === "open" && !isPoster && (
        <button
          onClick={handleClaim}
          disabled={busy}
          className="w-full py-3 rounded-full bg-gradient-to-b from-[#FF8A6B] to-[#F96B4C] text-white text-xs font-display font-extrabold shadow-[0_8px_20px_rgba(249,107,76,0.4)] disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} CLAIM GIG
        </button>
      )}

      {gig.status === "claimed" && isWorker && !showSubmit && (
        <button
          onClick={() => setShowSubmit(true)}
          className="w-full py-3 rounded-full bg-[#7C5CFC] hover:bg-[#6B4BEB] text-white text-xs font-display font-extrabold shadow-[0_8px_20px_rgba(124,92,252,0.4)] transition-colors"
        >
          SUBMIT PROOF OF WORK
        </button>
      )}

      {gig.status === "claimed" && isWorker && showSubmit && (
        <div className="space-y-2">
          <textarea
            className="w-full bg-[#F3F0FA] rounded-[16px] px-4 py-3 text-xs text-[#1F1B2E] placeholder-[#8B84A3] outline-none focus:ring-2 focus:ring-[#7C5CFC]/40 min-h-[60px] resize-none"
            placeholder="Notes for the escrow agent (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <label className="w-full py-3 rounded-full bg-[#7C5CFC] hover:bg-[#6B4BEB] text-white text-xs font-display font-extrabold shadow-[0_8px_20px_rgba(124,92,252,0.4)] flex items-center justify-center gap-2 cursor-pointer transition-colors">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {busy ? "ESCROW AGENT CHECKING…" : "UPLOAD PROOF & RELEASE ESCROW"}
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleProofFile} disabled={busy} />
          </label>
        </div>
      )}

      {gig.status === "claimed" && !isWorker && (
        <div className="text-[11px] text-[#8B84A3] text-center">Claimed — worker is on it.</div>
      )}

      {gig.status === "pending_review" && (
        <div className="text-[11px] text-[#8B84A3] text-center">Proof under manual review before escrow release.</div>
      )}

      {gig.status === "paid" && (
        <a
          href={`${explorer}/txs/${gig.payout_tx}`}
          target="_blank"
          rel="noreferrer"
          className="w-full py-3 rounded-full bg-[#E9E4F5] text-[#4A2FA8] text-xs font-display font-extrabold flex items-center justify-center gap-2"
        >
          PAID — VIEW PAYOUT ON-CHAIN <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}