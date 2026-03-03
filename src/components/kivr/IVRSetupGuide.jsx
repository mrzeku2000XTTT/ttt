import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Hash, Lock, Zap, ChevronDown, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { base44 } from "@/api/base44Client";

const ORANGE = "#ff5a14";
const IVR_NUMBER = "+1 (555) 548-7729"; // KIV-RPAY mapped to digits: K=5 I=4 V=8 R=7 P=7 A=2 Y=9
const IVR_NUMBER_LETTERS = "+1 (555) KIV-RPAY";

const steps = [
  {
    icon: <Phone size={16} color={ORANGE} />,
    title: "Call the KivR IVR number",
    desc: `Dial +1 (555) 548-7729 from any phone — feature phone, smartphone, or landline. No internet needed.`,
  },
  {
    icon: <Lock size={16} color={ORANGE} />,
    title: "Enter your PIN",
    desc: "When prompted, dial the 4+ digit PIN you set when creating your preset, then press #.",
  },
  {
    icon: <Hash size={16} color={ORANGE} />,
    title: "Press your slot number (1–9)",
    desc: "Each preset is assigned a slot. Press that number to trigger your pre-signed Kaspa transaction.",
  },
  {
    icon: <Zap size={16} color={ORANGE} />,
    title: "Transaction broadcasts",
    desc: "KivR looks up your preset by phone + PIN + slot, broadcasts the signed tx, and plays a confirmation.",
  },
];

// ── IVR Test Panel ─────────────────────────────────────────────────────────────
function IVRTestPanel({ fromAddress }) {
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [slot, setSlot] = useState("");
  const [action, setAction] = useState("verify_pin");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!phone.trim()) return;
    setLoading(true); setResult(null);
    try {
      const res = await base44.functions.invoke("kivrIVR", { action, phone, pin, slot: parseInt(slot) || undefined });
      setResult(res.data);
    } catch (e) {
      setResult({ error: e.message });
    }
    setLoading(false);
  };

  return (
    <div className="mt-3 rounded-xl p-4 space-y-3"
      style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <p className="text-xs font-semibold" style={{ color: ORANGE }}>🧪 Test IVR API</p>

      <div className="flex gap-1.5 flex-wrap">
        {["verify_pin", "get_presets", "broadcast"].map(a => (
          <button key={a} onClick={() => setAction(a)}
            className="px-2.5 py-1 rounded-lg text-xs font-mono transition-all"
            style={{
              background: action === a ? "rgba(255,90,20,0.2)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${action === a ? ORANGE : "rgba(255,255,255,0.08)"}`,
              color: action === a ? ORANGE : "rgba(255,255,255,0.4)"
            }}>{a}</button>
        ))}
      </div>

      <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number e.g. +15550001234"
        className="w-full rounded-lg px-3 py-2 text-white text-xs outline-none font-mono"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />

      <input value={pin} onChange={e => setPin(e.target.value)} placeholder="PIN (digits)"
        type="password"
        className="w-full rounded-lg px-3 py-2 text-white text-xs outline-none font-mono"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />

      {(action === "broadcast") && (
        <input value={slot} onChange={e => setSlot(e.target.value)} placeholder="Slot (1–9)"
          type="number" min={1} max={9}
          className="w-full rounded-lg px-3 py-2 text-white text-xs outline-none font-mono"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
      )}

      <button onClick={run} disabled={loading}
        className="w-full py-2 rounded-xl text-white text-xs font-bold"
        style={{ background: ORANGE, opacity: loading ? 0.7 : 1 }}>
        {loading ? "Calling API…" : `Run ${action}`}
      </button>

      {result && (
        <div className="rounded-lg p-3 text-xs font-mono break-all"
          style={{
            background: result.error || result.valid === false || result.success === false
              ? "rgba(255,59,48,0.08)" : "rgba(52,199,89,0.08)",
            border: `1px solid ${result.error || result.valid === false || result.success === false
              ? "rgba(255,59,48,0.25)" : "rgba(52,199,89,0.25)"}`,
            color: "rgba(255,255,255,0.7)"
          }}>
          <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default function IVRSetupGuide({ connectedAddress, presetCount = 0 }) {
  const [open, setOpen] = useState(false);
  const [showTest, setShowTest] = useState(false);

  const hasPresets = presetCount > 0;

  return (
    <div className="mx-4 mt-4 space-y-3">
      {/* Balance / Requirements callout */}
      <div className="rounded-2xl p-4 space-y-3"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,90,20,0.18)" }}>

        <div className="flex items-center gap-2 mb-1">
          <Phone size={15} color={ORANGE} />
          <p className="text-white text-sm font-bold">How to use KivR</p>
        </div>

        {/* Requirements */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Balance needed?", value: "Yes — fund your wallet with KAS before calling", ok: true },
            { label: "Presets needed?", value: hasPresets ? `${presetCount} preset${presetCount > 1 ? "s" : ""} ready` : "Create at least 1 preset first", ok: hasPresets },
            { label: "IVR number", value: "+1 (555) 548-7729", ok: true },
            { label: "Works from", value: "Any phone — no internet needed", ok: true },
          ].map(({ label, value, ok }) => (
            <div key={label} className="rounded-xl p-2.5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-xs mb-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</p>
              <p className="text-xs font-semibold flex items-center gap-1"
                style={{ color: ok ? "white" : "#ff9500" }}>
                {!ok && <AlertTriangle size={10} color="#ff9500" />}
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Step-by-step */}
        <button onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between pt-2 text-xs"
          style={{ color: "rgba(255,255,255,0.4)" }}>
          <span>Step-by-step guide</span>
          <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden">
              <div className="space-y-3 pt-1">
                {steps.map((s, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(255,90,20,0.12)", border: "1px solid rgba(255,90,20,0.2)" }}>
                      {s.icon}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">{s.title}</p>
                      <p className="text-xs leading-relaxed mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Test panel toggle */}
        <button onClick={() => setShowTest(s => !s)}
          className="w-full flex items-center justify-between pt-1 text-xs"
          style={{ color: "rgba(255,255,255,0.3)" }}>
          <span>🧪 Developer: Test IVR API</span>
          <ChevronDown size={13} className={`transition-transform ${showTest ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {showTest && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden">
              <IVRTestPanel fromAddress={connectedAddress} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Asterisk integration plan */}
      <div className="rounded-2xl p-4 space-y-2"
        style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-xs font-semibold" style={{ color: ORANGE }}>Asterisk AGI Integration Architecture</p>
        {[
          "1. Asterisk PBX + SIP trunk (Twilio / VoIP.ms) receives the inbound call",
          "2. extensions.conf routes → AGI script via AGI() application",
          "3. AGI uses DTMF (GET DATA) to collect caller's PIN, then slot number",
          "4. AGI calls kivrIVR backend (action: verify_pin → get_presets → broadcast)",
          "5. Backend broadcasts pre-signed tx hex to Kaspa node RPC",
          "6. Asterisk plays TTS confirmation: 'Payment of X KAS sent successfully'",
        ].map((t, i) => (
          <div key={i} className="flex gap-2 text-xs">
            <span className="font-bold flex-shrink-0" style={{ color: ORANGE }}>{i + 1}.</span>
            <p style={{ color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>{t}</p>
          </div>
        ))}
        <p className="text-xs font-mono text-center pt-1" style={{ color: "rgba(255,90,20,0.5)" }}>
          Stack: Asterisk · FastAGI · KivR API · Kaspa node RPC
        </p>
      </div>
    </div>
  );
}