import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, BadgeCheck, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * Claim a site / X profile by proving KNS domain ownership:
 * KNS registry says who owns the domain → that same wallet signs a challenge.
 */
export default function ClaimOwnerModal({ open, app, onClose, onClaimed }) {
  const [domain, setDomain] = useState("");
  const [display, setDisplay] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState("");
  const [error, setError] = useState("");

  const call = async (payload) => {
    const raw = await base44.functions.invoke("claimKnsOwnership", payload);
    return raw?.data ?? raw;
  };

  const claim = async (e) => {
    e?.preventDefault();
    if (!domain.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      if (!window.kasware) throw new Error("Kasware wallet not found — install it to sign the proof.");

      setStep("Looking up the KNS owner…");
      const ch = await call({ action: "challenge", site_url: app.url, kns_domain: domain.trim() });
      if (!ch?.success) throw new Error(ch?.error || "KNS lookup failed");

      setStep("Connecting your wallet…");
      const accounts = await window.kasware.requestAccounts();
      const address = accounts?.[0];
      if (!address) throw new Error("No wallet account returned");
      if (address.toLowerCase() !== String(ch.owner).toLowerCase()) {
        throw new Error(`This wallet doesn't own ${domain.trim()}. Switch to the owner wallet and retry.`);
      }

      setStep("Sign the proof in Kasware…");
      const signature = await window.kasware.signMessage(ch.challenge);

      setStep("Verifying signature…");
      const res = await call({
        site_url: app.url,
        site_name: app.name,
        kns_domain: domain.trim(),
        address,
        signature,
        challenge: ch.challenge,
        owner_display: display.trim() || domain.trim(),
      });
      if (!res?.success) throw new Error(res?.error || "Verification failed");

      onClaimed?.(res.claim);
      onClose?.();
    } catch (err) {
      setError(err?.message || "Claim failed");
    } finally {
      setBusy(false);
      setStep("");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[260] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 12 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#080808] p-5"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-4 h-4 text-cyan-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold">Claim this profile</p>
                <p className="text-[11px] text-white/40 truncate">{app?.name}</p>
              </div>
              <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[12px] text-white/50 leading-relaxed mb-4">
              Enter the KNS domain you own. We check the registry, then your wallet signs a one-time proof — no keys leave your device.
            </p>

            <form onSubmit={claim} className="space-y-3">
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="yourname.kas"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="w-full h-11 px-4 rounded-xl bg-white/[0.06] border border-white/15 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50"
              />
              <input
                value={display}
                onChange={(e) => setDisplay(e.target.value)}
                placeholder="Name shown in KACHAT (optional)"
                className="w-full h-11 px-4 rounded-xl bg-white/[0.06] border border-white/15 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50"
              />

              {error && (
                <p className="text-[11px] text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</p>
              )}
              {step && (
                <p className="text-[11px] text-cyan-300 flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" /> {step}
                </p>
              )}

              <button
                type="submit"
                disabled={busy || !domain.trim()}
                className="w-full h-11 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-cyan-500/30 transition-colors"
              >
                <BadgeCheck className="w-4 h-4" /> Verify with Kasware
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}