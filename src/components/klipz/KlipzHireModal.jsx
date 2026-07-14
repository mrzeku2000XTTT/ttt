import React, { useEffect, useState } from "react";
import { X, Loader2, CheckCircle2, Bot, Wallet, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";

const KLIPZ_ADDRESS = "kaspa:qq5yhvly6338dspa9mm24g8q6chvy6v0jww3k4dgqywh0lju5mmm5pj334ews";

function loadTTTWallets() {
  try {
    const raw = JSON.parse(localStorage.getItem("terra_wallets") || "[]");
    return raw
      .filter((w) => w.address)
      .map((w) => ({ ...w, address: w.address.startsWith("kaspa:") ? w.address : `kaspa:${w.address}` }));
  } catch (_e) {
    return [];
  }
}

// Merge in the main TTT wallet from the user profile (works logged-out too — just skips)
async function loadAllWallets() {
  const local = loadTTTWallets();
  let mainAddr = null;
  try {
    const user = await base44.auth.me();
    const raw = user?.created_wallet_address || user?.kaspa_address;
    if (raw) mainAddr = raw.startsWith("kaspa:") ? raw : `kaspa:${raw}`;
  } catch (_e) { /* not logged in — wallet-only mode */ }

  let wallets = [...local];
  if (mainAddr && !wallets.find((w) => w.address === mainAddr)) {
    wallets.push({ address: mainAddr, mnemonic: "", label: "Main TTT Wallet" });
  }
  // Main wallet first, then wallets that can actually sign (have a seed phrase)
  wallets.sort((a, b) => {
    if (a.address === mainAddr) return -1;
    if (b.address === mainAddr) return 1;
    return (b.mnemonic ? 1 : 0) - (a.mnemonic ? 1 : 0);
  });
  return wallets.map((w) => ({ ...w, isMain: w.address === mainAddr }));
}

export default function KlipzHireModal({ video, clips, onClose, onDelivered }) {
  const [status, setStatus] = useState("idle"); // idle | paying | verifying | done
  const [error, setError] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    (async () => {
      const all = await loadAllWallets();
      setWallets(all);
      // Preselect the first wallet that can sign (prefer the main wallet if it has a seed)
      const firstSignable = all.findIndex((w) => w.mnemonic);
      if (firstSignable >= 0) setSelectedIdx(firstSignable);
    })();
  }, []);

  const wallet = wallets[selectedIdx];

  const payAndHire = async () => {
    setError(null);
    try {
      if (!wallet) throw new Error("No TTT wallet found.");
      if (!wallet.mnemonic) throw new Error("This wallet has no seed phrase stored here. Open TTT Wallet and import it with its seed phrase to pay from it.");
      setStatus("paying");
      const res = await base44.functions.invoke("sendKaspaTransaction", {
        mnemonic: wallet.mnemonic,
        fromAddress: wallet.address,
        toAddress: KLIPZ_ADDRESS,
        amountKas: 1,
      });
      if (res.data?.error) throw new Error(res.data.error);
      const txHash = res.data.txId;
      if (!txHash) throw new Error("Payment did not return a transaction id");
      setStatus("verifying");
      await base44.functions.invoke("klipzHireAgent", { txHash, wallet: wallet.address, video, clips });
      setStatus("done");
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Payment failed");
      setStatus("idle");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md border border-cyan-500/40 bg-zinc-950 p-6" style={{ fontFamily: "monospace" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-cyan-400" />
            <span className="text-white font-black tracking-[0.2em] text-sm">HIRE AGENT KLIP</span>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        {status === "done" ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-white font-bold text-sm">JOB COMPLETE — CLIPS DELIVERED</p>
            <p className="text-zinc-500 text-[11px] mt-2">{clips.length} clips are now in your library.</p>
            <button onClick={onDelivered} className="mt-5 w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black text-[11px] font-bold tracking-[0.2em]">
              OPEN MY LIBRARY →
            </button>
          </div>
        ) : (
          <>
            <div className="border border-zinc-800 p-3 mb-4 text-[11px]">
              <p className="text-zinc-400 truncate">{video?.title}</p>
              <p className="text-cyan-400 mt-1">{clips.length} CLIP DRAFTS · DELIVERED TO YOUR LIBRARY</p>
            </div>

            {/* TTT Wallet picker */}
            <p className="text-[9px] text-zinc-500 tracking-[0.25em] mb-2">PAY FROM TTT WALLET</p>
            {wallets.length === 0 ? (
              <div className="border border-amber-500/40 p-3 mb-4 text-[11px] text-amber-400 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  No TTT wallet with a seed phrase found.{" "}
                  <Link to="/Terra" className="underline text-cyan-400">Open TTT Wallet</Link> to create or import one, then come back.
                </span>
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {wallets.map((w, i) => (
                  <button
                    key={w.address}
                    onClick={() => w.mnemonic && setSelectedIdx(i)}
                    disabled={!w.mnemonic}
                    className={`w-full flex items-center gap-3 p-3 border text-left transition-colors ${
                      i === selectedIdx ? "border-cyan-400 bg-cyan-500/10" : "border-zinc-800 hover:border-zinc-600"
                    } ${!w.mnemonic ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <Wallet className={`w-4 h-4 flex-shrink-0 ${i === selectedIdx ? "text-cyan-400" : "text-zinc-500"}`} />
                    <div className="min-w-0">
                      <p className="text-white text-[11px] font-bold">
                        {w.isMain ? "Main TTT Wallet" : w.label || `Wallet ${i + 1}`}
                        {w.isMain && <span className="ml-2 text-emerald-400 text-[8px] tracking-widest">● MAIN</span>}
                      </p>
                      <p className="text-zinc-500 text-[9px] truncate">{w.address.slice(0, 20)}…{w.address.slice(-6)}</p>
                      {!w.mnemonic && <p className="text-amber-500 text-[8px] tracking-widest mt-0.5">NO SEED HERE — IMPORT IN TTT WALLET TO PAY</p>}
                    </div>
                    {i === selectedIdx && <span className="ml-auto text-cyan-400 text-[9px] tracking-widest">SELECTED</span>}
                  </button>
                ))}
              </div>
            )}

            <div className="text-[10px] text-zinc-500 space-y-1.5 mb-4">
              <p>1. <span className="text-cyan-400 font-bold">1 KAS</span> is sent natively from your TTT wallet</p>
              <p>2. Agent verifies the payment on the Kaspa network</p>
              <p>3. Your clips land in your library — playable, shareable, downloadable</p>
            </div>
            <p className="text-[9px] text-zinc-600 break-all mb-4">PAY TO: {KLIPZ_ADDRESS}</p>
            {error && <p className="text-red-400 text-[11px] border border-red-500/40 p-3 mb-4">{error}</p>}
            <button
              onClick={payAndHire}
              disabled={status !== "idle" || !wallet}
              className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black text-[11px] font-bold tracking-[0.2em] flex items-center justify-center gap-2"
            >
              {status === "idle" && "PAY 1 KAS & HIRE →"}
              {status === "paying" && (<><Loader2 className="w-3.5 h-3.5 animate-spin" /> SENDING FROM TTT WALLET…</>)}
              {status === "verifying" && (<><Loader2 className="w-3.5 h-3.5 animate-spin" /> VERIFYING ON-CHAIN…</>)}
            </button>
          </>
        )}
      </div>
    </div>
  );
}