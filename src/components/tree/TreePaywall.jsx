import React, { useState, useEffect } from "react";
import { Loader2, Wallet, Copy, Check, AlertCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { getAnyWallet } from "@/lib/localKaspaWallet";
import { getAllOwnedAddresses, getPrivateKeyFor } from "@/lib/kachingVault";
import { getStoredPinHash } from "@/components/wallet/walletLock";
import ProductivityPinModal from "@/components/productivity/ProductivityPinModal";

const SERVICE_ID = "tree-campaign";

export default function TreePaywall({ serviceInput, amount, onUnlocked }) {
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [txId, setTxId] = useState("");
  const [copied, setCopied] = useState(false);
  const [walletSource, setWalletSource] = useState("ttt");
  const [mainWallet, setMainWallet] = useState(null);
  const [kachingWallets, setKachingWallets] = useState([]);
  const [kachingIdx, setKachingIdx] = useState(0);
  const [tttInfo, setTttInfo] = useState({ balance: null, utxos: 0, pending: 0 });
  const [kachingInfo, setKachingInfo] = useState({ balance: null, utxos: 0, pending: 0 });
  const [pinAuth, setPinAuth] = useState(false);
  const [resolvedPay, setResolvedPay] = useState(null);

  const info = walletSource === "ttt" ? tttInfo : kachingInfo;
  const balance = info.balance;

  const fetchSpendable = async (addr) => {
    try {
      const r = await base44.functions.invoke("getKaspaSpendable", { address: addr }).catch(() => null);
      const d = r?.data || r;
      if (d && d.success !== false && d.spendableKAS != null) {
        return { balance: Number(d.spendableKAS) || 0, utxos: Number(d.matureUtxoCount ?? d.utxoCount ?? 0), pending: Number(d.pendingUtxoCount ?? 0) };
      }
      const rb = await base44.functions.invoke("getKaspaBalance", { address: addr }).catch(() => null);
      const db = rb?.data || rb;
      return { balance: db && (db.balanceKAS ?? db.balance) != null ? Number(db.balanceKAS ?? db.balance) : 0, utxos: 0, pending: 0 };
    } catch { return { balance: 0, utxos: 0, pending: 0 }; }
  };

  const loadBalance = async () => {
    const w = getAnyWallet();
    setMainWallet(w);
    const kaching = (getAllOwnedAddresses() || []).filter(Boolean);
    setKachingWallets(kaching);
    await Promise.all([
      (async () => {
        if (!w?.address) { setTttInfo({ balance: 0, utxos: 0, pending: 0 }); return; }
        setTttInfo(await fetchSpendable(w.address));
      })(),
      (async () => {
        if (kaching.length === 0) { setKachingInfo({ balance: 0, utxos: 0, pending: 0 }); return; }
        const results = await Promise.all(kaching.map((k) => fetchSpendable(k.address)));
        const merged = results.reduce((acc, r) => ({ balance: acc.balance + r.balance, utxos: acc.utxos + r.utxos, pending: acc.pending + r.pending }), { balance: 0, utxos: 0, pending: 0 });
        setKachingInfo(merged);
      })(),
    ]);
  };

  useEffect(() => { loadBalance(); }, []);

  const requestQuote = async () => {
    setError("");
    setBusy(true);
    try {
      await base44.functions.invoke("awaX402", { action: "request", service_id: SERVICE_ID, input: serviceInput || "Tree campaign unlock" });
      setError("No payment required — unexpected response.");
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      if (status === 402 && data?.accepts?.[0]) {
        setPending(data.accepts[0]);
        loadBalance();
      } else if (status === 401) {
        setError("Please log in to unlock your campaign.");
      } else {
        setError(data?.error || err?.message || "Request failed");
      }
    } finally {
      setBusy(false);
    }
  };

  const settle = async (invoiceId, tx) => {
    setPaying(true);
    setError("");
    try {
      await base44.functions.invoke("awaX402", { action: "settle", invoice_id: invoiceId, tx_id: tx });
      setPending(null);
      setTxId("");
      onUnlocked?.();
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      if (status === 500) {
        setError(data?.error ? `Service error: ${data.error}` : "Settlement failed. Your payment may still be on-chain — wait a few seconds and retry Settle.");
      } else {
        setError(data?.error || err?.message || "Settle failed");
      }
    } finally {
      setPaying(false);
    }
  };

  const beginPay = async () => {
    setError("");
    const srcLabel = walletSource === "ttt" ? "TTT" : "KaChing";
    if (balance != null && balance < pending.amount_kas) {
      setError(`Not enough spendable KAS in your ${srcLabel} wallet (need ${pending.amount_kas} KAS, have ${balance.toFixed(4)} KAS confirmed). Top up, wait for pending UTXOs to confirm, switch source, or paste a manual tx below.`);
      return;
    }
    let fromAddress, privateKey;
    if (walletSource === "ttt") {
      if (!mainWallet?.address || !mainWallet?.privateKey) {
        setError("No TTT main wallet found — create or import one in the Wallet page, or pay manually.");
        return;
      }
      fromAddress = mainWallet.address;
      privateKey = mainWallet.privateKey;
    } else {
      const kw = kachingWallets[kachingIdx];
      if (!kw?.address) {
        setError("No KaChing wallet found — import one in KaChing Wallet, or pay manually.");
        return;
      }
      fromAddress = kw.address;
      privateKey = getPrivateKeyFor(kw.address);
    }
    if (getStoredPinHash()) {
      setResolvedPay({ fromAddress, privateKey });
      setPinAuth(true);
      return;
    }
    await doPay(fromAddress, privateKey);
  };

  const onPinVerified = async () => {
    setPinAuth(false);
    const r = resolvedPay;
    setResolvedPay(null);
    if (r) await doPay(r.fromAddress, r.privateKey);
  };

  const doPay = async (fromAddress, privateKey) => {
    const srcLabel = walletSource === "ttt" ? "TTT" : "KaChing";
    setPaying(true);
    try {
      const res = await base44.functions.invoke("sendKaspaTransaction", {
        privateKey, fromAddress, toAddress: pending.pay_to, amountKas: String(pending.amount_kas),
      });
      const d = res?.data || res;
      if (d?.error) throw new Error(d.error);
      const tx = (d?.txId || "").toLowerCase().replace(/^0x/, "");
      if (!/^[0-9a-f]{64}$/.test(tx)) throw new Error("Send succeeded but no valid tx id returned");
      await settle(pending.invoice_id, tx);
      loadBalance();
    } catch (e) {
      const msg = String(e?.message || "Wallet payment failed").toLowerCase();
      if (msg.includes("insufficient") || msg.includes("balance") || msg.includes("funds") || msg.includes("not enough") || msg.includes("enough") || msg.includes("no utxo") || msg.includes("unconfirmed")) {
        setError(`Not enough spendable KAS in your ${srcLabel} wallet to cover ${pending.amount_kas} KAS. Top up, wait for pending UTXOs to confirm, switch source, or paste a manual tx below.`);
      } else if (msg.includes("still confirming") || msg.includes("orphan") || msg.includes("already spent")) {
        setError("A previous transaction is still confirming. Wait ~10 seconds and try again.");
      } else {
        setError(e?.message || "Wallet payment failed");
      }
      setPaying(false);
    }
  };

  const payManual = async () => {
    const tx = txId.trim().toLowerCase().replace(/^0x/, "");
    if (!/^[0-9a-f]{64}$/.test(tx)) {
      setError("Paste the 64-character Kaspa transaction id");
      return;
    }
    await settle(pending.invoice_id, tx);
  };

  const copyAddr = () => {
    navigator.clipboard.writeText(`kaspa:${pending.pay_to}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="relative rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/40 to-black/70 p-5 text-center overflow-hidden">
      <div className="flex items-center justify-center gap-2 mb-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
          <Lock className="w-5 h-5 text-emerald-300" />
        </div>
      </div>
      <h3 className="text-white font-black text-lg mb-1">Your campaign is ready 🔒</h3>
      <p className="text-white/50 text-sm mb-4 max-w-sm mx-auto">
        Tree built your full ad set — scripts, captions, visuals & narration. Unlock the complete campaign for{" "}
        <span className="text-emerald-300 font-bold">{amount} KAS</span> on Kaspa L1.
      </p>

      {!pending && (
        <Button onClick={requestQuote} disabled={busy} className="bg-gradient-to-r from-emerald-500 to-teal-500 text-black hover:opacity-90">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Wallet className="w-4 h-4 mr-1" /> Unlock for {amount} KAS</>}
        </Button>
      )}

      {pending && (
        <div className="text-left space-y-2.5 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-emerald-300 font-mono font-black text-[10px] tracking-widest">HTTP 402 · PAYMENT REQUIRED</span>
            <span className="text-white font-black text-lg">{pending.amount_kas} KAS</span>
          </div>
          <div className="flex items-center gap-1 bg-black/40 border border-emerald-500/20 rounded-lg p-1">
            <button onClick={() => setWalletSource("ttt")} className={`flex-1 h-7 rounded-md text-[11px] font-medium transition ${walletSource === "ttt" ? "bg-emerald-500 text-black" : "text-white/60 hover:text-white"}`}>TTT Wallet</button>
            <button onClick={() => setWalletSource("kaching")} disabled={kachingWallets.length === 0} className={`flex-1 h-7 rounded-md text-[11px] font-medium transition disabled:opacity-40 ${walletSource === "kaching" ? "bg-emerald-500 text-black" : "text-white/60 hover:text-white"}`}>KaChing</button>
          </div>
          <div className="flex items-center justify-between bg-black/40 border border-emerald-500/20 rounded-lg px-2.5 py-1.5">
            <span className="text-[11px] text-white/60 flex items-center gap-1"><Wallet className="w-3 h-3" /> {walletSource === "ttt" ? "TTT Wallet" : "KaChing"}</span>
            {balance === null ? <span className="text-[11px] text-white/60">—</span> : (
              <span className={`text-[12px] font-bold ${balance >= pending.amount_kas ? "text-emerald-400" : "text-red-400"}`}>
                {balance.toFixed(4)} KAS {balance >= pending.amount_kas ? "" : "· insufficient"}
              </span>
            )}
          </div>
          <div className="w-full flex items-center gap-2 bg-black/40 border border-emerald-500/20 hover:border-emerald-400/60 rounded-lg px-2.5 py-2">
            <a href={`kaspa:${pending.pay_to}`} title="Open in wallet" className="flex-1 text-emerald-300 font-mono text-[10px] break-all hover:underline min-w-0">{`kaspa:${pending.pay_to}`}</a>
            <button onClick={copyAddr} className="flex-shrink-0" title="Copy address">
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4 text-white/50" />}
            </button>
          </div>
          {((walletSource === "ttt" && mainWallet?.privateKey) || (walletSource === "kaching" && kachingWallets.length > 0)) && (
            <Button onClick={beginPay} disabled={paying} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black h-9">
              {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Wallet className="w-4 h-4 mr-1" /> Pay with {walletSource === "ttt" ? "TTT Wallet" : "KaChing"}</>}
            </Button>
          )}
          <div className="flex items-center gap-2">
            <input value={txId} onChange={(e) => setTxId(e.target.value)} placeholder="…or paste Kaspa tx id" className="flex-1 h-9 px-2.5 rounded-lg bg-black/40 border border-emerald-500/20 text-white font-mono text-xs outline-none focus:border-emerald-400/60" />
            <Button onClick={payManual} disabled={paying || !txId.trim()} className="bg-transparent border border-emerald-400 text-emerald-300 hover:bg-emerald-500/10 h-9">
              {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Settle"}
            </Button>
          </div>
          <p className="text-white/40 text-[10px] text-center">Verified on Kaspa consensus — one tx settles one invoice.</p>
        </div>
      )}

      {error && (
        <div className="mt-3 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-xs flex items-start gap-2 text-left">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {pinAuth && (
        <ProductivityPinModal amount={pending?.amount_kas} onVerified={onPinVerified} onClose={() => { setPinAuth(false); setResolvedPay(null); }} />
      )}
    </div>
  );
}