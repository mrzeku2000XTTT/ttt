import React, { useState } from "react";
import { Loader2, ShieldCheck, AtSign, Globe } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function XProfileForm({ onListed }) {
  const [handle, setHandle] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e?.preventDefault();
    if (!handle.trim() || busy) return;
    setBusy(true); setError(null); setResult(null);
    try {
      const raw = await base44.functions.invoke("submitXProfile", {
        handle: handle.trim(),
        website: website.trim(),
      });
      const res = raw?.data ?? raw;
      if (!res?.success) { setError(res?.error || "Could not list this profile"); return; }
      setResult(res);
      onListed?.(res);
    } catch (e2) {
      setError(e2?.message || "Could not list this profile");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-3">
        <div className="flex items-center gap-2 px-3 h-11 rounded-xl bg-white/[0.06] border border-white/15 focus-within:border-cyan-500/50">
          <AtSign className="w-4 h-4 text-white/40 flex-shrink-0" />
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="yourhandle"
            disabled={busy}
            autoCapitalize="none" autoCorrect="off" spellCheck={false}
            className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 focus:outline-none min-w-0"
          />
        </div>

        <div className="flex items-center gap-2 px-3 h-11 rounded-xl bg-white/[0.06] border border-white/15 focus-within:border-cyan-500/50">
          <Globe className="w-4 h-4 text-white/40 flex-shrink-0" />
          <input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="website (optional)"
            disabled={busy}
            autoCapitalize="none" autoCorrect="off" spellCheck={false}
            className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 focus:outline-none min-w-0"
          />
        </div>

        <button
          type="submit"
          disabled={busy || !handle.trim()}
          className="w-full h-11 rounded-xl bg-cyan-500 text-black font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Researching…</> : "Add my X profile"}
        </button>
        <p className="text-[11px] text-white/35 text-center leading-relaxed">
          AI researches the account and gives it its own agent, so anyone can ask questions about you.
        </p>
      </form>

      {error && <p className="text-[12px] text-red-400 text-center">{error}</p>}

      {result?.app && (
        <div className="rounded-xl p-3.5 border bg-emerald-500/[0.07] border-emerald-500/25">
          <div className="flex items-center gap-2 mb-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-[12px] font-bold text-emerald-300">
              {result.already_listed ? "Already listed" : "Added to X Profiles"}
            </span>
          </div>
          <p className="text-[13px] text-cyan-300 font-medium">{result.app.name}</p>
          {result.app.description && (
            <p className="text-[12px] text-white/65 leading-relaxed mt-1">{result.app.description}</p>
          )}
        </div>
      )}
    </div>
  );
}