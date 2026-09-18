import React, { useState } from "react";
import { Loader2, ShieldCheck, AtSign, Globe, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";
import invokeProtectedOperation from '@/components/integrations/invokeProtectedOperation';
import XProfileVerifyPanel from "@/components/searchkaspa/XProfileVerifyPanel";

export default function XProfileForm({ onListed }) {
  const [handle, setHandle] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  // null | 'sending' | 'sent' | 'error'
  const [proofState, setProofState] = useState(null);

  // Upload the Kaspa-meme proof image and file it against the handle for review.
  const sendProof = async (h, file) => {
    setProofState("sending");
    try {
      const up = await base44.integrations.Core.UploadPublicFile({ file });
      const url = up?.file_url ?? up?.data?.file_url;
      if (!url) throw new Error("Upload failed");
      await base44.entities.XProfileProof.create({ handle: h, website: website.trim(), proof_url: url });
      setProofState("sent");
    } catch {
      setProofState("error");
    }
  };

  const submit = async (e) => {
    e?.preventDefault();
    const h = handle.trim();
    if (!h || busy) return;
    setBusy(true); setError(null); setResult(null); setProofState(null);
    try {
      const res = await invokeProtectedOperation('submitXProfile', { handle: h, website: website.trim() });
      if (!res?.success) { setError(res?.error || "Could not list this profile"); return; }
      setResult(res);
      onListed?.(res);
      if (proofFile) sendProof(h, proofFile);
    } catch (e2) {
      setError(e2?.message || "Could not list this profile");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <form onSubmit={submit} className="space-y-2">
        <div className="flex items-center gap-2 px-3 h-9 rounded-xl bg-white/[0.06] border border-white/15 focus-within:border-cyan-500/50">
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

        <div className="flex items-center gap-2 px-3 h-9 rounded-xl bg-white/[0.06] border border-white/15 focus-within:border-cyan-500/50">
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
          className="w-full h-9 rounded-xl bg-cyan-500 text-black font-bold text-[13px] disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Researching…</> : "Add my X profile"}
        </button>
        <p className="text-[11px] text-white/35 text-center leading-relaxed">
          AI researches the account and gives it its own agent, so anyone can ask questions about you.
        </p>
      </form>

      {(busy || (result?.success && !proofState)) && (
        <XProfileVerifyPanel
          handle={handle.trim()}
          busy={busy}
          proofFile={proofFile}
          onProofFile={setProofFile}
          onSendProof={() => proofFile && sendProof(handle.trim(), proofFile)}
        />
      )}

      {error && <p className="text-[12px] text-red-400 text-center">{error}</p>}

      {proofState === "sending" && (
        <p className="flex items-center justify-center gap-1.5 text-[11px] text-cyan-300">
          <Loader2 className="h-3 w-3 animate-spin" /> Sending your proof image…
        </p>
      )}
      {proofState === "sent" && (
        <p className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-300">
          <Upload className="h-3 w-3" /> Proof sent — your Kaspa meme post will be reviewed.
        </p>
      )}
      {proofState === "error" && (
        <p className="text-[11px] text-red-400 text-center">Could not send the proof image — please try again.</p>
      )}

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