import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, ShieldAlert, Loader2, Globe, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ScanSteps from "./ScanSteps";
import XProfileForm from "./XProfileForm";

export default function ListSiteModal({ open, onClose, onListed }) {
  const [tab, setTab] = useState("site");
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const reset = () => { setUrl(""); setResult(null); setError(null); setScanning(false); };

  const submit = async (e) => {
    e?.preventDefault();
    if (!url.trim() || scanning) return;
    setScanning(true); setError(null); setResult(null);
    try {
      const raw = await base44.functions.invoke("submitKaspaSite", { url: url.trim() });
      const res = raw?.data ?? raw;
      if (!res?.success) { setError(res?.error || "Scan failed"); return; }
      setResult(res);
      if (res.verified || res.already_listed) onListed?.(res);
    } catch (e2) {
      setError(e2?.message || "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const sec = result?.security;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-3"
          onClick={() => { if (!scanning) { reset(); onClose?.(); } }}
        >
          <motion.div
            initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-zinc-950 border border-white/15 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-bold text-sm">Get listed</span>
              </div>
              <button onClick={() => { if (!scanning) { reset(); onClose?.(); } }} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.05] border border-white/10">
                {[{ id: "site", label: "Website" }, { id: "x", label: "X Profile" }].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { if (!scanning) setTab(t.id); }}
                    className={`flex-1 h-8 rounded-lg text-[12px] font-semibold transition-colors ${
                      tab === t.id ? "bg-cyan-500 text-black" : "text-white/55 hover:text-white"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {tab === "x" ? <XProfileForm onListed={onListed} /> : (
              <>
              <form onSubmit={submit} className="space-y-3">
                <div className="flex items-center gap-2 px-3 h-11 rounded-xl bg-white/[0.06] border border-white/15 focus-within:border-cyan-500/50">
                  <Globe className="w-4 h-4 text-white/40 flex-shrink-0" />
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="yoursite.com"
                    disabled={scanning}
                    autoCapitalize="none" autoCorrect="off" spellCheck={false}
                    className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 focus:outline-none min-w-0"
                  />
                </div>
                <button
                  type="submit"
                  disabled={scanning || !url.trim()}
                  className="w-full h-11 rounded-xl bg-cyan-500 text-black font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {scanning ? <><Loader2 className="w-4 h-4 animate-spin" /> Scanning…</> : "Scan & list my site"}
                </button>
                <p className="text-[11px] text-white/35 text-center leading-relaxed">
                  We scan every submission for phishing and malware, then AI indexes it into the right category automatically.
                </p>
              </form>

              {scanning && <ScanSteps />}

              {error && <p className="text-[12px] text-red-400 text-center">{error}</p>}

              {result && (
                <div className={`rounded-xl p-3.5 border ${result.verified || result.already_listed ? "bg-emerald-500/[0.07] border-emerald-500/25" : "bg-red-500/[0.07] border-red-500/25"}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    {result.verified || result.already_listed
                      ? <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      : <ShieldAlert className="w-4 h-4 text-red-400" />}
                    <span className={`text-[12px] font-bold ${result.verified || result.already_listed ? "text-emerald-300" : "text-red-300"}`}>
                      {result.already_listed
                        ? "Already listed"
                        : result.verified
                          ? "Verified & added"
                          : `Rejected — ${sec?.risk_level || "High"} risk`}
                    </span>
                  </div>
                  {sec?.explanation && <p className="text-[12px] text-white/65 leading-relaxed">{sec.explanation}</p>}
                  {sec?.red_flags?.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {sec.red_flags.slice(0, 4).map((f, i) => (
                        <li key={i} className="text-[11px] text-red-300/80">• {f}</li>
                      ))}
                    </ul>
                  )}
                  {result.app && (
                    <div className="mt-2.5 pt-2.5 border-t border-white/10">
                      <p className="text-[13px] text-cyan-300 font-medium">{result.app.name}</p>
                      <p className="text-[11px] text-white/40">Listed under {result.app.category}</p>
                    </div>
                  )}
                </div>
              )}
              </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}