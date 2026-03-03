import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, RefreshCw, ArrowLeft, Phone, Mic } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

import KivRHero from "@/components/kivr/KivRHero";
import WalletConnectPanel from "@/components/kivr/WalletConnectPanel";
import PresetCard from "@/components/kivr/PresetCard";
import CreatePresetModal from "@/components/kivr/CreatePresetModal";
import HowItWorksSection from "@/components/kivr/HowItWorksSection";
import IVRSetupGuide from "@/components/kivr/IVRSetupGuide";

const ORANGE = "#ff5a14";

export default function KivRPage() {
  const navigate = useNavigate();
  const [connectedAddress, setConnectedAddress] = useState(() => {
    return localStorage.getItem("kivr_wallet") || null;
  });
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (connectedAddress) {
      localStorage.setItem("kivr_wallet", connectedAddress);
      loadPresets();
    } else {
      localStorage.removeItem("kivr_wallet");
      setPresets([]);
    }
  }, [connectedAddress]);

  const loadPresets = async () => {
    if (!connectedAddress) return;
    setLoading(true);
    try {
      const all = await base44.entities.KivRTransaction.filter({
        from_address: connectedAddress,
      });
      setPresets(all.sort((a, b) => (a.slot_number || 9) - (b.slot_number || 9)));
    } catch (err) {
      console.error("Failed to load presets:", err);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.KivRTransaction.update(id, { status: "cancelled" });
      loadPresets();
    } catch {}
  };

  const activePresets = presets.filter(p => p.status === "active");
  const pastPresets = presets.filter(p => p.status !== "active");

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: "#000",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
      }}
    >
      {/* Background ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse, rgba(255,90,20,0.5) 0%, transparent 65%)" }} />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, rgba(255,90,20,0.4) 0%, transparent 70%)" }} />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-4 py-3"
        style={{
          background: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)"
        }}>
        <button
          onClick={() => navigate(createPageUrl("Categories"))}
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <ArrowLeft size={18} color="white" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(255,90,20,0.2)", border: "1px solid rgba(255,90,20,0.4)" }}>
            <Mic size={13} color={ORANGE} />
          </div>
          <span className="text-white font-black text-lg tracking-tight">
            Kiv<span style={{ color: ORANGE }}>R</span>
          </span>
        </div>

        <button
          onClick={loadPresets}
          disabled={loading || !connectedAddress}
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
          style={{ background: "rgba(255,255,255,0.06)", opacity: !connectedAddress ? 0.3 : 1 }}
        >
          <RefreshCw size={15} color="white" className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="relative z-10 max-w-lg mx-auto pb-32">
        {/* Hero */}
        <KivRHero />

        {/* Wallet connect */}
        <WalletConnectPanel
          connectedAddress={connectedAddress}
          onConnect={setConnectedAddress}
        />

        {/* How it works */}
        <HowItWorksSection />

        {/* Presets section */}
        {connectedAddress && (
          <div className="mx-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-bold text-base">IVR Presets</h2>
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "rgba(255,90,20,0.1)", color: ORANGE, border: "1px solid rgba(255,90,20,0.2)" }}>
                {activePresets.length} active
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw size={24} color={ORANGE} className="animate-spin" />
              </div>
            ) : activePresets.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="rounded-2xl p-8 text-center mb-4"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)" }}
              >
                <Phone size={32} color="rgba(255,255,255,0.15)" className="mx-auto mb-3" />
                <p className="text-sm font-semibold mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>No presets yet</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
                  Create a preset to enable IVR payments from any phone
                </p>
              </motion.div>
            ) : (
              <div className="space-y-3 mb-4">
                {activePresets.map((p, i) => (
                  <PresetCard key={p.id} preset={p} index={i} onDelete={handleDelete} />
                ))}
              </div>
            )}

            {pastPresets.length > 0 && (
              <div className="mt-4">
                <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Past Presets</p>
                <div className="space-y-2">
                  {pastPresets.map((p, i) => (
                    <PresetCard key={p.id} preset={p} index={i} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* IVR info card */}
        <div className="mx-4 mt-4 rounded-2xl p-4 space-y-3"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,90,20,0.2)",
            backdropFilter: "blur(16px)"
          }}>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,90,20,0.15)" }}>
              <Phone size={16} color={ORANGE} />
            </div>
            <div>
              <p className="text-white text-sm font-semibold mb-1">IVR Phone Number</p>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                Powered by Asterisk AGI. Call the KivR number from any phone — feature phone, smartphone, or landline. Enter your PIN, press your slot (1–9) to broadcast your pre-signed Kaspa transaction. Non-custodial: your keys never leave your device.
              </p>
            </div>
          </div>
          <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs font-semibold" style={{ color: ORANGE }}>Asterisk AGI Integration Plan</p>
            {[
              { step: "1", text: "Self-hosted Asterisk PBX with a SIP trunk (e.g. Twilio, VoIP.ms) receives the inbound call" },
              { step: "2", text: "extensions.conf routes call → AGI script (Python/Node) via AGI() application" },
              { step: "3", text: "AGI reads DTMF: GET DATA prompt to collect PIN digits, then slot number" },
              { step: "4", text: "AGI calls KivR backend API → looks up preset by phone number + PIN hash + slot" },
              { step: "5", text: "If matched, AGI calls Kaspa broadcast endpoint with pre-stored signed tx hex" },
              { step: "6", text: "Asterisk plays confirmation (text-to-speech: 'Payment of X KAS sent')" },
            ].map(({ step, text }) => (
              <div key={step} className="flex gap-2 items-start">
                <span className="text-xs font-bold flex-shrink-0 w-4" style={{ color: ORANGE }}>{step}.</span>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{text}</p>
              </div>
            ))}
          </div>
          <p className="text-xs font-mono text-center" style={{ color: "rgba(255,90,20,0.6)" }}>
            Backend: Asterisk AGI + FastAGI · Kaspa node RPC · KivR API
          </p>
        </div>
      </div>

      {/* FAB — Create Preset */}
      <AnimatePresence>
        {connectedAddress && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setShowCreate(true)}
            className="fixed right-5 z-40 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl"
            style={{
              bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)',
              background: `linear-gradient(135deg, ${ORANGE}, #e04000)`,
              boxShadow: `0 8px 32px rgba(255,90,20,0.5)`,
            }}
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus size={24} color="white" strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Create preset modal */}
      <AnimatePresence>
        {showCreate && (
          <CreatePresetModal
            fromAddress={connectedAddress}
            onClose={() => setShowCreate(false)}
            onCreated={() => {
              setShowCreate(false);
              loadPresets();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}