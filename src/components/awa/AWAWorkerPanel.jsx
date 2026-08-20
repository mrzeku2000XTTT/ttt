import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { secp256k1 } from "@noble/curves/secp256k1";
import { getAnyWallet, generateWallet, importFromPrivateKey } from "@/lib/localKaspaWallet";
import { Loader2, Wallet, Check, Zap, ArrowRight } from "lucide-react";

function bytesToHex(b) { return Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join(""); }
function pubKeyHexFromPriv(privHex) {
  const pub = secp256k1.getPublicKey(privHex, true);
  return bytesToHex(pub.slice(1, 33));
}

export default function AWAWorkerPanel() {
  const [wallet, setWallet] = useState(() => getAnyWallet());
  const [importKey, setImportKey] = useState("");
  const [jobs, setJobs] = useState(null);
  const [busy, setBusy] = useState(null);
  const [mode, setMode] = useState(false);

  const loadJobs = () => {
    base44.functions.invoke("awaCovenant", { action: "open_jobs" })
      .then((res) => setJobs(res.data.jobs || []))
      .catch(() => setJobs([]));
  };
  useEffect(loadJobs, []);

  const claim = async (job) => {
    if (!wallet?.privateKey) { alert("Connect your TTT wallet first"); return; }
    const pubKeyHex = pubKeyHexFromPriv(wallet.privateKey);
    setBusy(job.id);
    try {
      const res = await base44.functions.invoke("awaCovenant", {
        action: "claim", campaign_id: job.id,
        worker_wallet_address: wallet.address, worker_pubkey_hex: pubKeyHex
      });
      alert("Covenant built! Address: " + res.data.covenant_address + "\nThe marketer will now fund it.");
      loadJobs();
    } catch (e) { alert(e?.response?.data?.error || e.message); }
    setBusy(null);
  };

  const doImport = () => {
    try { setWallet(importFromPrivateKey(importKey)); setImportKey(""); }
    catch (e) { alert(e.message); }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          <h3 className="text-white font-bold text-sm tracking-wide">WORKER MODE</h3>
        </div>
        <button onClick={() => setMode((m) => !m)} className="text-[10px] text-emerald-300 hover:text-emerald-200">{mode ? "hide" : "open"}</button>
      </div>

      {!mode ? null : (
        <div className="space-y-3">
          {/* Worker wallet */}
          <div className="flex items-center gap-2 text-[11px]">
            <Wallet className="w-3.5 h-3.5 text-white/40" />
            {wallet ? (
              <span className="text-white/60 font-mono truncate">{wallet.address}</span>
            ) : (
              <>
                <button onClick={() => setWallet(generateWallet())} className="px-2 py-1 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-[10px]">Create wallet</button>
                <input value={importKey} onChange={(e) => setImportKey(e.target.value)} placeholder="import priv key" className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded px-2 py-1 text-white font-mono text-[10px] outline-none" />
                <button onClick={doImport} disabled={!importKey.trim()} className="px-2 py-1 rounded bg-white/10 text-white text-[10px] disabled:opacity-40">Import</button>
              </>
            )}
          </div>

          {/* Claimable jobs */}
          <div className="text-[10px] text-white/40 font-bold tracking-widest pt-1">OPEN CAMPAIGNS</div>
          {!jobs ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : jobs.length === 0 ? (
            <div className="text-[11px] text-white/40">No open campaigns. Marketers post campaigns via the chat above.</div>
          ) : jobs.map((j) => (
            <div key={j.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="text-white text-xs font-bold">{j.description}</div>
              <div className="text-white/40 text-[10px] mt-0.5">{j.platform} · {j.total_kas} KAS · {j.increment_kas} KAS × {j.num_epochs}</div>
              <button onClick={() => claim(j)} disabled={busy === j.id || !wallet}
                className="mt-2 w-full py-1.5 rounded-lg bg-emerald-500 text-black font-black text-[11px] hover:bg-emerald-400 disabled:opacity-40 flex items-center justify-center gap-1">
                {busy === j.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Check className="w-3 h-3" /> CLAIM & BUILD COVENANT <ArrowRight className="w-3 h-3" /></>}
              </button>
            </div>
          ))}
          <p className="text-[9px] text-white/30">Claiming builds the real sentinel-x402 covenant with your wallet key — you sign each check-in client-side (non-custodial). The marketer funds the covenant address, then increments release to you each period the post stays up.</p>
        </div>
      )}
    </div>
  );
}