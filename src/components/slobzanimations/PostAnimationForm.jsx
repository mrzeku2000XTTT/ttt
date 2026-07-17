import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Upload } from "lucide-react";

export default function PostAnimationForm({ onPosted }) {
  const [form, setForm] = useState({ title: "", creator: "", wallet: "" });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async () => {
    setError("");
    if (!form.title.trim()) return setError("Give your animation a title.");
    if (!form.wallet.trim().startsWith("kaspa:")) return setError("Enter a valid Kaspa wallet address (kaspa:…) to receive tips.");
    if (!file) return setError("Choose a video file to upload.");
    setBusy(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.SlobzAnimation.create({
        title: form.title.trim(),
        creator_name: form.creator.trim() || "Anonymous Slob",
        wallet_address: form.wallet.trim(),
        video_url: file_url,
        tips_received: 0,
      });
      setForm({ title: "", creator: "", wallet: "" });
      setFile(null);
      onPosted?.();
    } catch (err) {
      setError(err?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "w-full bg-[#F3F0FA] rounded-[16px] px-4 py-3 text-sm text-[#1F1B2E] placeholder-[#8B84A3] outline-none focus:ring-2 focus:ring-[#7C5CFC]/40";

  return (
    <div className="space-y-3">
      <input className={inputCls} placeholder="Animation title" value={form.title} onChange={set("title")} />
      <input className={inputCls} placeholder="Your name (optional)" value={form.creator} onChange={set("creator")} />
      <input className={inputCls} placeholder="Your Kaspa wallet for tips (kaspa:…)" value={form.wallet} onChange={set("wallet")} />
      <label className="flex items-center justify-center gap-2 w-full py-3 rounded-[16px] bg-[#F3F0FA] hover:bg-[#EBE6F8] text-xs text-[#5A4B8A] cursor-pointer transition-colors">
        <Upload className="w-4 h-4" />
        {file ? file.name : "Choose video file (mp4, webm…)"}
        <input type="file" accept="video/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      </label>
      {error && <div className="text-xs text-[#F96B4C]">{error}</div>}
      <button
        onClick={handleSubmit}
        disabled={busy}
        className="w-full py-3.5 rounded-full bg-[#7C5CFC] hover:bg-[#6B4BEB] text-white text-xs font-display font-extrabold shadow-[0_8px_20px_rgba(124,92,252,0.4)] disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
      >
        {busy && <Loader2 className="w-4 h-4 animate-spin" />} POST ANIMATION
      </button>
    </div>
  );
}