import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, UserPlus, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";

const ORANGE = "#ff5a14";

async function hashPin(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + '_kivr_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function AddContactModal({ fromAddress, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    const trimName = name.trim();
    const trimAddress = address.trim();
    if (!trimName) { setError("Contact name is required."); return; }
    if (!trimAddress || !trimAddress.startsWith("kaspa:")) { setError("Valid kaspa: address required."); return; }
    if (!pin || pin.length < 4) { setError("PIN must be at least 4 digits."); return; }

    setSaving(true);
    setError("");
    try {
      const pinHash = await hashPin(pin);
      await base44.entities.KivRContact.create({
        from_address: fromAddress,
        contact_name: trimName,
        kaspa_address: trimAddress,
        default_amount: amount ? parseFloat(amount) : undefined,
        pin_hash: pinHash,
      });
      onCreated();
    } catch (e) {
      setError("Failed to save contact. Try again.");
    }
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm rounded-3xl p-6"
        style={{ background: "#0d0d0d", border: "1px solid rgba(255,90,20,0.3)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <UserPlus size={18} color={ORANGE} />
            <span className="text-white font-bold text-lg">Add Contact</span>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-white/40 text-xs mb-1 block">Contact Name <span className="text-orange-400">*</span></label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder='e.g. "Bills", "Mom", "Rent"'
              className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>

          <div>
            <label className="text-white/40 text-xs mb-1 block">Kaspa Address <span className="text-orange-400">*</span></label>
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="kaspa:qr..."
              className="w-full rounded-xl px-4 py-3 text-white text-sm font-mono outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
            {address.startsWith("kaspa:") && (
              <div className="flex items-center gap-1 mt-1 text-green-400 text-xs">
                <Check size={10} /> Valid
              </div>
            )}
          </div>

          <div>
            <label className="text-white/40 text-xs mb-1 block">Default Amount (KAS) <span className="text-white/20">optional</span></label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="e.g. 100"
              className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>

          <div>
            <label className="text-white/40 text-xs mb-1 block">Voice PIN <span className="text-orange-400">*</span></label>
            <p className="text-white/20 text-xs mb-1">You'll say this PIN aloud to authorize payments</p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="4+ digit PIN"
              className="w-full rounded-xl px-4 py-3 text-white text-sm font-mono tracking-widest outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-2xl py-3 text-white font-bold text-sm transition-all mt-2"
            style={{ background: saving ? "rgba(255,90,20,0.4)" : ORANGE }}
          >
            {saving ? "Saving..." : "Save Contact"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}