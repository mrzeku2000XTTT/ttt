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
    <div>
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-2 py-1.5">
        {!wallet && <button onClick={() => setWallet(generateWallet())} className="rounded border border-border bg-background px-2 py-1 text-[9px] font-bold">Create Wallet</button>}
        {!wallet && <><input value={importKey} onChange={(e) => setImportKey(e.target.value)} placeholder="import private key" className="min-w-0 flex-1 rounded border border-border bg-background px-2 py-1 font-mono text-[9px] outline-none" /><button onClick={doImport} disabled={!importKey.trim()} className="rounded border border-border bg-background px-2 py-1 text-[9px] font-bold disabled:opacity-40">Import</button></>}
        {wallet && <span className="max-w-full truncate rounded border border-border bg-background px-2 py-1 font-mono text-[8px]">{wallet.address}</span>}
        <button onClick={() => setMode((m) => !m)} className="rounded border border-border bg-secondary px-2 py-1 text-[9px] font-bold">{mode ? "Close Campaigns" : "Open Campaigns"}</button>
      </div>
      {mode && (
        <div className="space-y-2 p-2">
          {!jobs ? <Loader2 className="h-4 w-4 animate-spin" /> : jobs.length === 0 ? (
            <div className="text-[9px] font-medium">No open campaigns. Marketers post campaigns via the chat above.</div>
          ) : jobs.map((j) => (
            <div key={j.id} className="rounded border border-border bg-background p-2">
              <div className="text-[10px] font-bold">{j.description}</div>
              <div className="text-[8px]">{j.platform} · {j.total_kas} KAS · {j.increment_kas} KAS × {j.num_epochs}</div>
              <button onClick={() => claim(j)} disabled={busy === j.id || !wallet} className="mt-1.5 rounded border border-border bg-primary px-2 py-1 text-[9px] font-black text-primary-foreground disabled:opacity-40">
                {busy === j.id ? <Loader2 className="inline h-3 w-3 animate-spin" /> : <><Check className="mr-1 inline h-3 w-3" />CLAIM &amp; BUILD COVENANT <ArrowRight className="inline h-3 w-3" /></>}
              </button>
            </div>
          ))}
          <p className="text-[8px] leading-tight text-muted-foreground">Claiming builds the real sentinel-x402 covenant with your wallet key — you sign each check-in client-side (non-custodial). The marketer funds the covenant address, then increments release to you each period the post stays up.</p>
        </div>
      )}
    </div>
  );
}