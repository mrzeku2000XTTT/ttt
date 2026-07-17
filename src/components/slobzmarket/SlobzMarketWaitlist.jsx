import React, { useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Loader2, Lock, Check } from "lucide-react";

export default function SlobzMarketWaitlist({ user }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState(() => localStorage.getItem("slobz_wallet") || "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [joined, setJoined] = useState(() => localStorage.getItem("slobz_market_waitlist") === "1");

  const submit = async () => {
    const addr = address.trim();
    if (!addr || !addr.startsWith("kaspa:") || addr.length < 20) {
      setError("Enter a valid Kaspa address (kaspa:…)");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await base44.entities.SlobzWaitlist.create({
        name: name.trim() || null,
        kaspa_address: addr,
        user_email: user?.email || null,
        message: message.trim() || null,
        status: "pending",
      });
      localStorage.setItem("slobz_market_waitlist", "1");
      setJoined(true);
    } catch {
      setError("Could not join the waitlist right now — try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  if (joined) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#FDFBF7] rounded-[28px] shadow-[0_16px_40px_rgba(124,92,252,0.14)] p-10 text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-full bg-[#E4F7EC] flex items-center justify-center mx-auto mb-4">
          <Check className="w-7 h-7 text-[#1E9E5A]" />
        </div>
        <h2 className="font-display text-xl font-black text-[#3D2E7C] mb-2">You're on the list!</h2>
        <p className="text-xs text-[#8B84A3]">
          We've got your Kaspa address. When your invite drops, the Covenant Escrow Market opens up for you. Keep slobbing.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#FDFBF7] rounded-[28px] shadow-[0_16px_40px_rgba(124,92,252,0.14)] p-6 md:p-8 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#EBE6F8] flex items-center justify-center">
          <Lock className="w-5 h-5 text-[#7C5CFC]" />
        </div>
        <div>
          <h2 className="font-display text-lg font-black text-[#3D2E7C]">Invite Only</h2>
          <p className="text-[11px] text-[#8B84A3]">The escrow market is currently admin & invite only. Join the waitlist below.</p>
        </div>
      </div>

      <div className="space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name (optional)"
          className="w-full bg-[#F3F0FA] rounded-[16px] px-4 py-3 text-xs text-[#1F1B2E] placeholder-[#8B84A3] outline-none focus:ring-2 focus:ring-[#7C5CFC]/40"
        />
        <input
          value={address}
          onChange={(e) => { setAddress(e.target.value); setError(""); }}
          placeholder="Your Kaspa wallet address (kaspa:…)"
          className="w-full bg-[#F3F0FA] rounded-[16px] px-4 py-3 text-xs font-mono text-[#1F1B2E] placeholder-[#8B84A3] outline-none focus:ring-2 focus:ring-[#7C5CFC]/40"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What would you post or work on? (optional)"
          rows={3}
          className="w-full bg-[#F3F0FA] rounded-[16px] px-4 py-3 text-xs text-[#1F1B2E] placeholder-[#8B84A3] resize-none outline-none focus:ring-2 focus:ring-[#7C5CFC]/40"
        />
        {error && <p className="text-[11px] text-[#F96B4C]">{error}</p>}
        <button
          onClick={submit}
          disabled={busy}
          className="w-full py-3.5 rounded-full bg-[#7C5CFC] hover:bg-[#6B4BEB] text-white text-xs font-display font-extrabold shadow-[0_8px_20px_rgba(124,92,252,0.4)] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
        >
          {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> JOINING…</> : "JOIN THE WAITLIST"}
        </button>
      </div>
    </motion.div>
  );
}