import React, { useState } from "react";
import { Plus, Trash2, Zap, Loader2, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * AgentTrainer — the user adds input/output example pairs, then runs a training
 * epoch. Each epoch: the example is appended to the agent's training_examples,
 * a real Kaspa self-send is broadcast (txid anchors the example), and the
 * agent's epoch count + level are bumped. The "trained model" is the
 * accumulated few-shot set, served through InvokeLLM.
 */
export default function AgentTrainer({ agent, wallet, onChanged }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [training, setTraining] = useState(false);
  const [error, setError] = useState("");

  const examples = agent?.training_examples || [];

  const runEpoch = async () => {
    if (!input.trim() || !output.trim() || !wallet?.privateKey) return;
    setTraining(true);
    setError("");
    try {
      // 0. pre-flight: make sure the wallet actually has funds before we try to sign
      const balRes = await base44.functions.invoke("getKaspaBalance", { address: wallet.address });
      const bal = balRes?.data || balRes;
      const kas = bal?.balanceKAS ?? bal?.balance ?? 0;
      if (!kas || Number(kas) <= 0) {
        throw new Error("Insufficient balance — send KAS to your AgentInternet wallet address above to fund a training epoch. Each epoch is a real self-send transaction and needs funds to cover it.");
      }

      // 1. on-chain self-send anchors this epoch (automatic — one tx per example)
      const txRes = await base44.functions.invoke("sendKaspaTransaction", {
        privateKey: wallet.privateKey,
        fromAddress: wallet.address,
        toAddress: wallet.address,
        amountKas: "0.2",
      });
      const tx = txRes?.data || txRes;
      if (tx?.error) throw new Error(tx.error);
      const txId = typeof tx.txId === "string" ? tx.txId : String(tx.txId || "");

      // 2. append the example, anchored by the txid
      const newExample = {
        input: input.trim(),
        output: output.trim(),
        tx_id: txId,
        at: new Date().toISOString(),
      };
      const epochs = (agent.epochs || 0) + 1;
      const updated = await base44.entities.AgentInternetAgent.update(agent.id, {
        training_examples: [...examples, newExample],
        epochs,
        level: Math.floor(epochs / 5) + 1,
        is_trained: true,
      });
      onChanged(updated);
      setInput("");
      setOutput("");
    } catch (e) {
      setError(e?.message || "Training epoch failed");
    }
    setTraining(false);
  };

  const removeExample = async (idx) => {
    const next = examples.filter((_, i) => i !== idx);
    const updated = await base44.entities.AgentInternetAgent.update(agent.id, {
      training_examples: next,
      epochs: next.length,
      level: Math.floor(next.length / 5) + 1,
      is_trained: next.length > 0,
    });
    onChanged(updated);
  };

  return (
    <div className="bg-white rounded-2xl ring-1 ring-zinc-200 p-6">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-zinc-400" />
          <h3 className="font-bold text-zinc-900">Training</h3>
        </div>
        <span className="text-xs font-semibold text-zinc-400">Level {agent?.level || 0}</span>
      </div>
      <p className="text-sm text-zinc-500 leading-relaxed mb-4">
        Add an example of what your agent should do. Each epoch is anchored by a real Kaspa self-send — that's the on-chain proof of training.
      </p>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "Epochs", value: agent?.epochs || 0 },
          { label: "Examples", value: examples.length },
          { label: "Trained", value: agent?.is_trained ? "Yes" : "No" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-zinc-50 border border-zinc-200/70 p-3 text-center">
            <div className="text-lg font-[800] text-zinc-900 font-mono">{s.value}</div>
            <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide">{s.label}</div>
          </div>
        ))}
      </div>

      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Example input</label>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={2}
        placeholder="User: summarize this transaction…"
        className="w-full px-3 py-2 mt-1 mb-3 rounded-xl border border-zinc-200 text-sm outline-none focus:border-zinc-400 resize-none"
      />
      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Expected output</label>
      <textarea
        value={output}
        onChange={(e) => setOutput(e.target.value)}
        rows={2}
        placeholder="Agent: this transaction sent 0.2 KAS to itself as a training anchor…"
        className="w-full px-3 py-2 mt-1 mb-3 rounded-xl border border-zinc-200 text-sm outline-none focus:border-zinc-400 resize-none"
      />

      <button
        onClick={runEpoch}
        disabled={!input.trim() || !output.trim() || training || !wallet}
        className="w-full h-11 rounded-full bg-zinc-900 text-white text-sm font-bold hover:bg-zinc-800 disabled:opacity-40 flex items-center justify-center gap-2"
      >
        {training ? <><Loader2 className="w-4 h-4 animate-spin" /> Training epoch…</> : <><Send className="w-4 h-4" /> Run training epoch</>}
      </button>
      {!wallet && <p className="text-xs text-amber-500 mt-2">Generate an AgentInternet wallet first.</p>}
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

      {examples.length > 0 && (
        <div className="mt-5 space-y-2 max-h-64 overflow-y-auto">
          {examples.map((ex, i) => (
            <div key={i} className="rounded-xl border border-zinc-200 p-3">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Epoch {i + 1}</span>
                <button onClick={() => removeExample(i)} className="text-zinc-300 hover:text-red-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-zinc-700"><span className="font-semibold text-zinc-400">in:</span> {ex.input}</p>
              <p className="text-xs text-zinc-700 mt-1"><span className="font-semibold text-zinc-400">out:</span> {ex.output}</p>
              {ex.tx_id && (
                <a href={`https://explorer.kaspa.org/txs/${ex.tx_id}`} target="_blank" rel="noreferrer" className="text-[10px] font-mono text-cyan-600 hover:underline mt-1 inline-block">
                  tx: {ex.tx_id.slice(0, 24)}…
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}