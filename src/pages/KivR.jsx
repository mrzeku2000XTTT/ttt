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
import InAppIVRCall from "@/components/kivr/InAppIVRCall";
import ContactsList from "@/components/kivr/ContactsList";
import AddContactModal from "@/components/kivr/AddContactModal";

const ORANGE = "#ff5a14";

export default function KivRPage() {
  const navigate = useNavigate();
  const [connectedAddress, setConnectedAddress] = useState(() => {
    return localStorage.getItem("kivr_wallet") || null;
  });
  const [presets, setPresets] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);

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
      const [all, allContacts] = await Promise.all([
        base44.entities.KivRTransaction.filter({ from_address: connectedAddress }),
        base44.entities.KivRContact.filter({ from_address: connectedAddress }),
      ]);
      setPresets(all.sort((a, b) => (a.slot_number || 9) - (b.slot_number || 9)));
      setContacts(allContacts);
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
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse, rgba(255,90,20,0.5) 0%, transparent 65%)" }} />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, rgba(255,90,20,0.4) 0%, transparent 70%)" }} />
      </div>

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

      <div className="relative z-10 max-w-lg mx-auto pb-32">
        <KivRHero />

        <WalletConnectPanel
          connectedAddress={connectedAddress}
          onConnect={setConnectedAddress}
          refreshKey={presets.length}
        />

        {!connectedAddress && <HowItWorksSection />}

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

        {connectedAddress && (
          <ContactsList
            contacts={contacts}
            onAdd={() => setShowAddContact(true)}
            onDelete={async (id) => {
              await base44.entities.KivRContact.delete(id);
              loadPresets();
            }}
          />
        )}

        <IVRSetupGuide connectedAddress={connectedAddress} presetCount={activePresets.length} />
      </div>

      <AnimatePresence>
        {connectedAddress && activePresets.length > 0 && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setShowCall(true)}
            className="fixed left-5 z-40 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl"
            style={{
              bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)',
              background: `linear-gradient(135deg, #1a6e2e, #0f4a1e)`,
              boxShadow: `0 8px 32px rgba(52,199,89,0.4)`,
            }}
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.95 }}
          >
            <Phone size={22} color="white" />
          </motion.button>
        )}
      </AnimatePresence>

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

      <AnimatePresence>
        {showCall && (
          <InAppIVRCall
            connectedAddress={connectedAddress}
            presets={presets}
            contacts={contacts}
            onClose={() => setShowCall(false)}
          />
        )}
      </AnimatePresence>

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