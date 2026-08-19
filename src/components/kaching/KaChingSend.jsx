import React, { useState, useEffect } from "react";
import { ArrowUp, Loader2, Check, Layers, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getAllOwnedAddresses, getPrivateKeyFor, isValidKaspaAddress } from "@/lib/kachingVault";

const SOMPI = 1e8;

export default function KaChingSend({ onActivity }) {
  const [mode, setMode] = useState("auto"); // auto | coincontrol
  const [addresses] = useState(getAllOwnedAddresses());
  const [fromIdx, setFromIdx] = useState(0);
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [sendAll, setSendAll] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // coin-control state
  const [utxos, setUtxos] = useState([]);
  const [selected, setSelected] = useState(new Set()); // "txId:index"
  const [loadingUtxos, setLoadingUtxos] = useState(false);

  const from = addresses[fromIdx];

  useEffect(() => {
    if (mode !== "coincontrol" || !from) return;
    setUtxos([]);
    setSelected(new Set());
    setError("");
    setLoadingUtxos(true);
    base44.functions
      .invoke("sendKaspaCoinControl", { action: "list", address: from.address })
      .then((r) => {
        const data = r?.data || r;
        setUtxos(Array.isArray(data?.utxos) ? data.utxos : []);
      })
      .catch((e) => setError(e?.message || "Failed to load UTXOs"))
      .finally(() => setLoadingUtxos(false));
  }, [mode, fromIdx]);

  const selectedTotal = utxos
    .filter((u) => selected.has(`${u.txId}:${u.index}`))
    .reduce((s, u) => s + u.amount, 0);

  const toggle = (key) => {
    const n = new Set(selected);
    if (n.has(key)) n.delete(key);
    else n.add(key);
    setSelected(n);
  };

  const sendAuto = async () => {
    setError("");
    setResult(null);
    if (!from) return setError("No wallet address");
    if (!isValidKaspaAddress(to.startsWith("kaspa:") ? to : `kaspa:${to}`)) return setError("Invalid recipient address");
    if (!sendAll && (!amount || parseFloat(amount) <= 0)) return setError("Enter an amount");
    setSending(true);
    try {
      const res = await base44.functions.invoke("sendKaspaTransaction", {
        privateKey: getPrivateKeyFor(from.address),
        fromAddress: from.address,
        toAddress: to,
        amountKas: sendAll ? undefined : amount,
        sendAll: sendAll || undefined,
      });
      const d = res?.data || res;
      if (d?.error) throw new Error(d.error);
      setResult(d);
      onActivity?.();
    } catch (e) {
      setError(e?.message || "Send failed");
    } finally {
      setSending(false);
    }
  };

  const sendCoinControl = async () => {
    setError("");
    setResult(null);
    if (!isValidKaspaAddress(to.startsWith("kaspa:") ? to : `kaspa:${to}`)) return setError("Invalid recipient address");
    const chosen = utxos.filter((u) => selected.has(`${u.txId}:${u.index}`));
    if (chosen.length === 0) return setError("Select at least one UTXO");
    if (!sendAll && (!amount || parseFloat(amount) <= 0)) return setError("Enter an amount");
    const needed = sendAll ? 0 : Math.round(parseFloat(amount) * SOMPI);
    if (!sendAll && selectedTotal < needed) return setError(`Selected ${selectedTotal / SOMPI} KAS < ${amount} KAS needed`);
    setSending(true);
    try {
      const inputs = chosen.map((u) => ({
        txId: u.txId,
        index: u.index,
        address: from.address,
        privateKey: getPrivateKeyFor(from.address),
      }));
      const res = await base44.functions.invoke("sendKaspaCoinControl", {
        action: "send",
        toAddress: to,
        amountKas: sendAll ? undefined : amount,
        sendAll: sendAll || undefined,
        inputs,
      });
      const d = res?.data || res;
      if (d?.error) throw new Error(d.error);
      setResult(d);
      onActivity?.();
    } catch (e) {
      setError(e?.message || "Coin-control send failed");
    } finally {
      setSending(false);
    }
  };

  const submit = mode === "auto" ? sendAuto : sendCoinControl;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Send</h2>
        <p className="text-xs text-white/50 mb-4">
          {mode === "auto"
            ? "Standard send — the wallet auto-selects UTXOs (compounds them)."
            : "Coin control — you pick which UTXOs to spend. Unselected UTXOs stay untouched."}
        </p>
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-black/40 border border-white/10">
        <button
          onClick={() => setMode("auto")}
          className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-semibold ${mode === "auto" ? "bg-white/10 text-white" : "text-white/50"}`}
        >
          <Zap className="w-3.5 h-3.5" /> Auto
        </button>
        <button
          onClick={() => setMode("coincontrol")}
          className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-semibold ${mode === "coincontrol" ? "bg-cyan-500/20 text-cyan-200" : "text-white/50"}`}
        >
          <Layers className="w-3.5 h-3.5" /> Coin Control
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">From</label>
          <select
            value={fromIdx}
            onChange={(e) => setFromIdx(Number(e.target.value))}
            className="w-full h-10 mt-1 px-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white outline-none focus:border-cyan-400/50"
          >
            {addresses.map((a, i) => (
              <option key={a.address} value={i} className="bg-black">
                {a.label} — {a.address.slice(0, 12)}…{a.address.slice(-6)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">To address</label>
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="kaspa:…"
            className="w-full h-10 mt-1 px-3 rounded-lg bg-black/40 border border-white/10 text-sm text-white outline-none focus:border-cyan-400/50 font-mono"
          />
        </div>
        <div>
          <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Amount (KAS)</label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={sendAll}
            placeholder="0.00"
            className="w-full h-10 mt-1 px-3 rounded-lg bg-black/40 border border-white/10 text-sm text-white outline-none focus:border-cyan-400/50 disabled:opacity-40"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-white/60">
          <input type="checkbox" checked={sendAll} onChange={(e) => setSendAll(e.target.checked)} className="accent-cyan-400" />
          Send all selected (max)
        </label>
      </div>

      {mode === "coincontrol" && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">UTXOs</span>
            <span className="text-[11px] font-mono text-cyan-200">
              {selected.size} selected · {(selectedTotal / SOMPI).toFixed(4)} KAS
            </span>
          </div>
          {loadingUtxos ? (
            <div className="py-6 text-center"><Loader2 className="w-4 h-4 animate-spin text-cyan-300 mx-auto" /></div>
          ) : utxos.length === 0 ? (
            <div className="py-6 text-center text-xs text-white/40">No spendable UTXOs for this address.</div>
          ) : (
            <div className="space-y-1 max-h-56 overflow-y-auto">
              {utxos.map((u) => {
                const key = `${u.txId}:${u.index}`;
                const on = selected.has(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggle(key)}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg border text-left text-xs ${on ? "border-cyan-400/50 bg-cyan-500/10" : "border-white/10 bg-black/30 hover:border-white/20"}`}
                  >
                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${on ? "bg-cyan-400 border-cyan-400" : "border-white/30"}`}>
                      {on && <Check className="w-2.5 h-2.5 text-black" />}
                    </span>
                    <span className="font-mono text-white/70 truncate flex-1">{u.txId.slice(0, 14)}…:{u.index}</span>
                    <span className="font-mono text-white/90 flex-shrink-0">{(u.amount / SOMPI).toFixed(4)}</span>
                    <span className="text-[9px] text-white/30 flex-shrink-0">{u.confirmations}conf</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {error && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-2.5">{error}</div>}
      {result && (
        <div className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold"><Check className="w-3.5 h-3.5" /> Sent</div>
          <div>TX: <span className="font-mono break-all">{result.txId}</span></div>
          <div>Amount: {result.amountKas} KAS · Fee: {result.fee} KAS · Inputs: {result.inputsUsed || result.inputsCompounded}</div>
        </div>
      )}

      <button
        onClick={submit}
        disabled={sending}
        className="w-full h-12 rounded-xl bg-cyan-500 text-black font-semibold text-sm flex items-center justify-center gap-2 hover:bg-cyan-400 disabled:opacity-50"
      >
        {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing…</> : <><ArrowUp className="w-4 h-4" /> Send</>}
      </button>
    </div>
  );
}