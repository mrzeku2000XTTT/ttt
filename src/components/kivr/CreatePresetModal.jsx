import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, AlertTriangle, CheckCircle, Loader2, Phone, Hash, Tag, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

const ORANGE = "#ff5a14";
const GLASS = {
  background: "#0f0f0f",
  border: "1px solid rgba(255,255,255,0.1)",
};

const InputField = ({ label, value, onChange, placeholder, type = "text", prefix }) => (
  <div>
    <label className="text-xs mb-1.5 block" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</label>
    <div className="flex items-center rounded-xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
      {prefix && (
        <span className="pl-3 text-xs font-mono" style={{ color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>{prefix}</span>
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent px-3 py-3 text-white text-sm outline-none"
        style={{ fontFamily: type === "text" && value.startsWith("kaspa:") ? "monospace" : "inherit" }}
      />
    </div>
  </div>
);

export default function CreatePresetModal({ fromAddress, onClose, onCreated }) {
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [slot, setSlot] = useState("1");
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const validateStep1 = () => {
    if (!toAddress.startsWith("kaspa:")) return "Recipient must be a valid kaspa: address";
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) return "Enter a valid KAS amount";
    return null;
  };

  const validateStep2 = () => {
    if (!phone.trim()) return "Enter a phone number";
    if (!pin || pin.length < 4) return "PIN must be at least 4 digits";
    return null;
  };

  const handleNext = () => {
    setError("");
    if (step === 1) {
      const err = validateStep1();
      if (err) { setError(err); return; }
      setStep(2);
    } else if (step === 2) {
      const err = validateStep2();
      if (err) { setError(err); return; }
      setStep(3);
    } else if (step === 3) {
      handleSave();
    }
  };

  const hashPin = async (p) => {
    const enc = new TextEncoder();
    const buf = await crypto.subtle.digest("SHA-256", enc.encode(p + "_kivr_salt_2024"));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const pinHash = await hashPin(pin);
      await base44.entities.KivRTransaction.create({
        from_address: fromAddress,
        to_address: toAddress,
        amount: parseFloat(amount),
        label: label || `Pay ${parseFloat(amount)} KAS`,
        phone_number: phone,
        pin_hash: pinHash,
        slot_number: parseInt(slot),
        status: "active",
        uses_remaining: 1,
      });
      onCreated();
    } catch (err) {
      setError("Failed to save preset. Try again.");
    }
    setSaving(false);
  };

  const stepLabels = ["Payment Info", "IVR Setup", "Confirm"];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl p-6 space-y-5 overflow-y-auto"
        style={{ ...GLASS, maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">New IVR Preset</h3>
          <button onClick={onClose}><X size={18} color="rgba(255,255,255,0.4)" /></button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {stepLabels.map((s, i) => (
            <React.Fragment key={i}>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background: step > i + 1 ? "#34c759" : step === i + 1 ? ORANGE : "rgba(255,255,255,0.08)",
                    color: step >= i + 1 ? "white" : "rgba(255,255,255,0.3)"
                  }}>
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span className="text-xs" style={{ color: step === i + 1 ? "white" : "rgba(255,255,255,0.3)" }}>{s}</span>
              </div>
              {i < 2 && <div className="flex-1 h-px" style={{ background: step > i + 1 ? ORANGE : "rgba(255,255,255,0.08)" }} />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Payment Info */}
        {step === 1 && (
          <div className="space-y-4">
            <InputField label="Recipient Address" value={toAddress} onChange={setToAddress} placeholder="kaspa:q..." />
            <InputField label="Amount (KAS)" value={amount} onChange={setAmount} placeholder="e.g. 100" type="number" />
            <InputField label="Label (optional)" value={label} onChange={setLabel} placeholder="e.g. Pay Merchant A" />
          </div>
        )}

        {/* Step 2: IVR Setup */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="rounded-xl p-3 text-xs space-y-1"
              style={{ background: "rgba(255,90,20,0.08)", border: "1px solid rgba(255,90,20,0.2)" }}>
              <p className="font-semibold" style={{ color: ORANGE }}>How IVR works</p>
              <p style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                Call the KivR number, enter your PIN, then press your slot number to broadcast this transaction.
              </p>
            </div>
            <InputField label="Your Phone Number" value={phone} onChange={setPhone} placeholder="+1 555 000 0000" />
            <InputField label="PIN (min 4 digits)" value={pin} onChange={setPin} placeholder="••••" type="password" />
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: "rgba(255,255,255,0.4)" }}>IVR Slot (1–9)</label>
              <div className="grid grid-cols-9 gap-1">
                {[1,2,3,4,5,6,7,8,9].map(n => (
                  <button key={n} onClick={() => setSlot(String(n))}
                    className="py-2.5 rounded-lg text-sm font-bold transition-all"
                    style={{
                      background: slot === String(n) ? ORANGE : "rgba(255,255,255,0.06)",
                      color: slot === String(n) ? "white" : "rgba(255,255,255,0.4)",
                      border: `1px solid ${slot === String(n) ? ORANGE : "rgba(255,255,255,0.08)"}`
                    }}>
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                Press slot {slot} on the IVR keypad to send this payment
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-2xl p-4 space-y-3"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="text-center mb-2">
                <div className="text-2xl font-black" style={{ color: ORANGE }}>{amount} KAS</div>
                <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                  → {toAddress.slice(0, 14)}...{toAddress.slice(-8)}
                </div>
              </div>
              {[
                { icon: <Tag size={12} />, label: "Label", value: label || "—" },
                { icon: <Phone size={12} />, label: "Phone", value: phone },
                { icon: <Hash size={12} />, label: "Slot", value: `Press ${slot} on IVR` },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {row.icon}{row.label}
                  </div>
                  <span className="text-white font-medium">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl p-3 text-xs flex items-start gap-2"
              style={{ background: "rgba(255,165,0,0.08)", border: "1px solid rgba(255,165,0,0.2)" }}>
              <AlertTriangle size={12} color="#ff9500" className="flex-shrink-0 mt-0.5" />
              <span style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                Next, we'll sign this transaction securely. Your private key never leaves your device.
              </span>
            </div>
          </div>
        )}

        {/* Step 4: Signing */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,90,20,0.15)" }}>
                <Key size={24} color={ORANGE} />
              </div>
              <div className="text-center">
                <p className="text-white font-bold mb-1">Signing Transaction</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {signingStatus || "Requesting Kasware signature..."}
                </p>
              </div>
              {signingStatus === "Signature obtained!" && (
                <div className="text-xs px-3 py-2 rounded-lg flex items-center gap-2"
                  style={{ background: "rgba(52,199,89,0.1)", border: "1px solid rgba(52,199,89,0.3)", color: "#34c759" }}>
                  <CheckCircle size={12} />
                  Signature received!
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="text-xs px-3 py-2 rounded-xl flex items-center gap-2"
            style={{ background: "rgba(255,59,48,0.1)", border: "1px solid rgba(255,59,48,0.2)", color: "#ff3b30" }}>
            <AlertTriangle size={12} />{error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {step > 1 && step < 4 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>
              Back
            </button>
          )}
          {step < 3 ? (
            <button onClick={handleNext}
              className="flex-1 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2"
              style={{ background: ORANGE }}>
              Next <ArrowRight size={14} />
            </button>
          ) : step === 3 ? (
            <button onClick={handleNext}
              className="flex-1 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2"
              style={{ background: ORANGE }}>
              Sign Transaction <Key size={14} />
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-opacity"
              style={{ background: "#34c759", opacity: saving ? 0.7 : 1 }}>
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><CheckCircle size={14} /> Complete</>}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}