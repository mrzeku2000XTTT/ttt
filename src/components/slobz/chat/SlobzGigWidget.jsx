import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, X } from "lucide-react";

// Inline "post a demo gig" widget shown inside the chat — native for mobile.
export default function SlobzGigWidget({ onPosted, onClose }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [payout, setPayout] = useState("5");
  const [minutes, setMinutes] = useState("30");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const post = async () => {
    if (!title.trim() || !description.trim()) return setError("Title and a verifiable description are required.");
    setBusy(true);
    setError("");
    try {
      const res = await base44.functions.invoke("slobzPostDemoGig", {
        title: title.trim(),
        description: description.trim(),
        payout_tkas: parseFloat(payout) || 5,
        estimated_minutes: parseInt(minutes) || 30,
      });
      if (!res.data?.success) throw new Error(res.data?.error || "Failed to post gig");
      onPosted(res.data.gig);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Could not post the gig.");
    } finally {
      setBusy(false);
    }
  };

  const input = "w-full bg-[#F3F0FA] rounded-[12px] px-3 py-2 text-[11px] text-[#1F1B2E] placeholder-[#8B84A3] outline-none focus:ring-2 focus:ring-[#7C5CFC]/40";

  return (
    <div className="bg-white rounded-[18px] shadow-[0_8px_24px_rgba(90,70,160,0.15)] p-3.5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-display font-extrabold text-[#7C5CFC] uppercase tracking-wide">Post a Testnet Demo Gig</span>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-[#F3F0FA] text-[#8B84A3]"><X className="w-3.5 h-3.5" /></button>
      </div>
      <input className={input} placeholder="Gig title" value={title} onChange={(e) => { setTitle(e.target.value); setError(""); }} />
      <textarea className={`${input} resize-none`} rows={2} placeholder="What to do + what proof completes it (make it verifiable!)" value={description} onChange={(e) => { setDescription(e.target.value); setError(""); }} />
      <div className="flex gap-2">
        <input className={input} type="number" min="1" placeholder="TKAS" value={payout} onChange={(e) => setPayout(e.target.value)} />
        <input className={input} type="number" min="5" placeholder="Minutes" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
      </div>
      {error && <p className="text-[10px] text-[#F96B4C]">{error}</p>}
      <button
        onClick={post}
        disabled={busy}
        className="w-full py-2.5 rounded-full bg-[#7C5CFC] hover:bg-[#6B4BEB] text-white text-[10px] font-display font-extrabold disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
      >
        {busy ? <><Loader2 className="w-3 h-3 animate-spin" /> POSTING…</> : "POST DEMO GIG (TKAS)"}
      </button>
    </div>
  );
}