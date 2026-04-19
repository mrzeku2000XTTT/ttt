import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Loader2, Wallet, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

const KASPA_ADDRESS_REGEX = /^kaspa:[a-z0-9]{60,}$/i;

export default function HaruAccessGate({ onClose, onGranted }) {
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!KASPA_ADDRESS_REGEX.test(address.trim())) {
      setError("Please enter a valid Kaspa address (starts with 'kaspa:' ~63 chars)");
      return;
    }

    setLoading(true);
    try {
      // Persist locally so user isn't re-prompted
      localStorage.setItem("haru_access_address", address.trim());
      if (email.trim()) localStorage.setItem("haru_access_email", email.trim());

      // Try to record a waitlist entry (best-effort; don't block UX)
      try {
        await base44.entities.AppProposal.create({
          app_name: "Haru Access Request",
          app_link: `kaspa-address:${address.trim()}`,
          description: `Kaspa address: ${address.trim()}${email ? ` · Email: ${email}` : ""}`,
          category: "Creative",
          submitter_email: email.trim() || "anonymous@haru.app",
          submitter_name: address.trim().slice(0, 20),
          status: "pending",
        });
      } catch {
        // silent — local access still works
      }

      setSuccess(true);
      setTimeout(() => {
        onGranted(address.trim());
      }, 900);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
        >
          <div className="relative p-8 text-center bg-gradient-to-br from-pink-50 via-rose-50 to-amber-50 border-b border-pink-200/40">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-white/60 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-zinc-500" />
            </button>
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/25">
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-[900] tracking-tight text-zinc-900 mb-1">
              Get Access to Haru
            </h2>
            <p className="text-[13px] text-zinc-500">
              Enter your Kaspa address to unlock the Studio
            </p>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6"
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-[800] text-zinc-900 mb-1">Access Granted</h3>
                  <p className="text-[13px] text-zinc-500">Opening Haru Studio…</p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-zinc-500 uppercase mb-2">
                      Kaspa Address <span className="text-pink-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="kaspa:qz..."
                      required
                      className="w-full h-11 px-4 rounded-xl bg-zinc-50 ring-1 ring-zinc-200 text-[13px] font-mono outline-none focus:ring-pink-400 transition-all"
                    />
                    <p className="text-[10px] text-zinc-400 mt-1.5">
                      Used to verify your access. Never stored on-chain.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-zinc-500 uppercase mb-2">
                      Email <span className="text-zinc-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@brand.com"
                      className="w-full h-11 px-4 rounded-xl bg-zinc-50 ring-1 ring-zinc-200 text-[13px] outline-none focus:ring-pink-400 transition-all"
                    />
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[12px] text-red-600 bg-red-50 ring-1 ring-red-200 rounded-lg px-3 py-2"
                    >
                      {error}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-full bg-zinc-900 text-white text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Verifying…
                      </>
                    ) : (
                      <>
                        Enter Studio <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="relative my-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-zinc-200" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-3 bg-white text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">or</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      const guestId = `guest-${Date.now()}`;
                      localStorage.setItem("haru_access_address", guestId);
                      setSuccess(true);
                      setTimeout(() => onGranted(guestId), 600);
                    }}
                    className="w-full h-11 rounded-full bg-zinc-50 ring-1 ring-zinc-200 text-zinc-700 text-[13px] font-semibold hover:bg-zinc-100 transition-colors disabled:opacity-50"
                  >
                    Skip — I don't have a Kaspa wallet
                  </button>

                  <p className="text-[10px] text-zinc-400 text-center leading-relaxed">
                    By continuing, you agree to use Hiro for legitimate creative work.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}