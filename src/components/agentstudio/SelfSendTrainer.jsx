import React, { useState, useEffect, useRef, useCallback } from "react";
import { Zap, Play, Square, CircleCheck, CircleX, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { addEpoch, getEpochs, getTrainingStats } from "@/lib/agentTraining";

const INTERVAL_MS = 30000; // one epoch every 30s — leaves room for confirmation

/**
 * Self-send trainer: each epoch signs and broadcasts a real Kaspa transaction
 * from the AgentInternet wallet back to itself. The txid becomes the on-chain
 * proof of that training step. Non-custodial — the key is only sent to the
 * signing function from this device.
 */
export default function SelfSendTrainer({ wallet, agentName, onEpoch }) {
  const [auto, setAuto] = useState(false);
  const [sending, setSending] = useState(false);
  const [epochs, setEpochs] = useState(getEpochs());
  const [stats, setStats] = useState(getTrainingStats());
  const [amount, setAmount] = useState("0.2");
  const [error, setError] = useState("");
  const timer = useRef(null);

  const refresh = () => {
    setEpochs(getEpochs());
    setStats(getTrainingStats());
    onEpoch?.();
  };

  const runEpoch = useCallback(async () => {
    if (!wallet?.privateKey || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await base44.functions.invoke("sendKaspaTransaction", {
        privateKey: wallet.privateKey,
        fromAddress: wallet.address,
        toAddress: wallet.address,
        amountKas: amount,
      });
      const data = res?.data || res;
      if (data?.error) throw new Error(data.error);
      addEpoch({
        at: Date.now(),
        txId: typeof data.txId === "string" ? data.txId : String(data.txId || ""),
        amountKas: data.amountKas,
        fee: data.fee,
        agent: agentName,
      });
    } catch (e) {
      setError(e?.message || "Epoch failed");
      addEpoch({ at: Date.now(), failed: true, agent: agentName, reason: e?.message });
    }
    setSending(false);
    refresh();
  }, [wallet, sending, amount, agentName]);

  // Auto self-send loop
  useEffect(() => {
    if (!auto || !wallet?.privateKey) return;
    runEpoch();
    timer.current = setInterval(runEpoch, INTERVAL_MS);
    return () => clearInterval(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, wallet?.address]);

  return (
    <div className="bg-white rounded-2xl ring-1 ring-zinc-200 p-6">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-zinc-400" />
          <h3 className="font-bold text-zinc-900">Self-Send Training</h3>
        </div>
        <span className="text-xs font-semibold text-zinc-400">Level {stats.level}</span>
      </div>
      <p className="text-sm text-zinc-500 leading-relaxed mb-5">
        Every epoch is a real Kaspa transaction your agent sends to itself — proof-of-training written to the DAG, with your funds never leaving your wallet.
      </p>

      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { label: "Epochs", value: stats.confirmed },
          { label: "KAS cycled", value: stats.kasCycled.toFixed(2) },
          { label: "Attempts", value: stats.total },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-zinc-50 border border-zinc-200/70 p-3 text-center">
            <div className="text-lg font-[800] text-zinc-900 font-mono">{s.value}</div>
            <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Amount per epoch</label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={auto}
            className="w-full h-10 px-3 mt-1 rounded-xl border border-zinc-200 text-sm font-mono outline-none focus:border-zinc-400 disabled:bg-zinc-50"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setAuto((a) => !a)}
          disabled={!wallet}
          className={`flex-1 h-11 rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-40 ${
            auto ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-zinc-900 text-white hover:bg-zinc-800"
          }`}
        >
          {auto ? <><Square className="w-4 h-4" /> Stop auto-training</> : <><Play className="w-4 h-4" /> Start auto self-send</>}
        </button>
        <button
          onClick={runEpoch}
          disabled={!wallet || sending || auto}
          className="h-11 px-4 rounded-full bg-zinc-100 text-zinc-700 text-sm font-semibold hover:bg-zinc-200 disabled:opacity-40"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Run one"}
        </button>
      </div>

      {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

      {epochs.length > 0 && (
        <div className="mt-5 space-y-1.5 max-h-52 overflow-y-auto">
          {epochs.slice(0, 12).map((e, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px] py-1.5 border-b border-zinc-100 last:border-0">
              {e.failed
                ? <CircleX className="w-3.5 h-3.5 text-red-400 shrink-0" />
                : <CircleCheck className="w-3.5 h-3.5 text-green-500 shrink-0" />}
              <span className="text-zinc-400 shrink-0">{new Date(e.at).toLocaleTimeString()}</span>
              {e.txId ? (
                <a
                  href={`https://explorer.kaspa.org/txs/${e.txId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-zinc-600 hover:text-zinc-900 truncate"
                >
                  {e.txId.slice(0, 20)}…
                </a>
              ) : (
                <span className="text-red-400 truncate">{e.reason || "failed"}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}