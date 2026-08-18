import React, { useState } from "react";
import { Plus, Trash2, Zap, Loader2, Send, Search, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * AgentTrainer — REAL training.
 *
 * Instead of typing fake input/output, the user pastes a real Kaspa txid. We
 * fetch the live on-chain transaction, format its key details as the input,
 * and auto-draft a plain-English summary as the expected output (editable).
 * The user then runs a training epoch — a real self-send anchors it on-chain.
 *
 * The saved example contains the actual transaction data, so the agent learns
 * from real data, not placeholders.
 */
function formatTxInput(tx) {
  if (!tx) return "";
  const totalOut = (tx.outputs || []).reduce((s, o) => s + (o.amount || 0), 0);
  const from = (tx.inputs || []).map((i) => i.previous_outpoint_address).filter(Boolean)[0] || "unknown";
  const to = (tx.outputs || []).map((o) => o.script_public_key_address).filter(Boolean)[0] || "unknown";
  const lines = [
    `Transaction ID: ${tx.transaction_id || tx.id || "unknown"}`,
    `Status: ${tx.is_accepted === false ? "not accepted" : "accepted"}`,
    `Block time: ${tx.block_time ? new Date(Number(tx.block_time) * 1000).toISOString() : "unknown"}`,
    `From: ${from}`,
    `To: ${to}`,
    `Total output: ${totalOut} KAS`,
    `Inputs: ${tx.inputs?.length || 0}`,
    `Outputs: ${tx.outputs?.length || 0}`,
  ];
  if (tx.outputs?.length) {
    lines.push("Outputs:");
    tx.outputs.slice(0, 8).forEach((o, i) => {
      lines.push(`  [${i}] ${o.script_public_key_address} — ${o.amount} KAS`);
    });
  }
  return lines.join("\n");
}

export default function AgentTrainer({ agent, wallet, onChanged }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [txid, setTxid] = useState("");
  const [training, setTraining] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState("");

  const examples = agent?.training_examples || [];

  const fetchTx = async () => {
    const id = txid.trim();
    if (!id) return;
    setFetching(true);
    setError("");
    try {
      const res = await base44.functions.invoke("getKaspaTransactionDetails", { txId: id });
      const tx = res?.data || res;
      if (tx?.error) throw new Error(tx.error);
      const formatted = formatTxInput(tx);
      setInput(formatted);
      // auto-draft a real summary from the actual on-chain data
      setDrafting(true);
      try {
        const draftRes = await base44.integrations.Core.InvokeLLM({
          prompt: `You are summarizing a real Kaspa transaction for a human. Using ONLY the data below, write a concise plain-English summary with the key details: sender, receiver, amount, status, and time. No preamble.\n\n${formatted}`,
          model: "claude_sonnet_4_6",
        });
        setOutput(typeof draftRes === "string" ? draftRes : draftRes?.response || draftRes?.text || "");
      } catch {
        setOutput("");
      }
      setDrafting(false);
    } catch (e) {
      setError(e?.message || "Could not fetch transaction");
    }
    setFetching(false);
  };

  const runEpoch = async () => {
    if (!input.trim() || !output.trim() || !wallet?.privateKey) return;
    setTraining(true);
    setError("");
    try {
      // 0. pre-flight balance check
      const balRes = await base44.functions.invoke("getKaspaBalance", { address: wallet.address });
      const bal = balRes?.data || balRes;
      const kas = bal?.balanceKAS ?? bal?.balance ?? 0;
      if (!kas || Number(kas) <= 0) {
        throw new Error("Insufficient balance — send KAS to your AgentInternet wallet address above to fund a training epoch. Each epoch is a real self-send transaction and needs funds to cover it.");
      }

      // 1. on-chain self-send anchors this epoch
      const txRes = await base44.functions.invoke("sendKaspaTransaction", {
        privateKey: wallet.privateKey,
        fromAddress: wallet.address,
        toAddress: wallet.address,
        amountKas: "0.2",
      });
      const tx = txRes?.data || txRes;
      if (tx?.error) throw new Error(tx.error);
      const anchorTxId = typeof tx.txId === "string" ? tx.txId : String(tx.txId || "");

      // 2. append the example, anchored by the self-send txid
      const newExample = {
        input: input.trim(),
        output: output.trim(),
        tx_id: anchorTxId,
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
      setTxid("");
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
        Paste a real Kaspa transaction ID. We fetch the live on-chain data, format it as the input, and auto-draft a plain-English summary you can edit. Each epoch is anchored by a real self-send.
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

      {/* Live tx fetch */}
      <div className="rounded-xl bg-zinc-50 border border-zinc-200/70 p-3 mb-3">
        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Fetch live transaction</label>
        <div className="flex gap-2 mt-1">
          <input
            value={txid}
            onChange={(e) => setTxid(e.target.value)}
            placeholder="e.g. b560adf6ecd20e11c819d82d..."
            className="flex-1 h-10 px-3 rounded-lg border border-zinc-200 text-xs font-mono outline-none focus:border-zinc-400"
          />
          <button
            onClick={fetchTx}
            disabled={!txid.trim() || fetching}
            className="h-10 px-3 rounded-lg bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 disabled:opacity-40 flex items-center gap-1.5"
          >
            {fetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            {fetching ? "Fetching" : "Fetch"}
          </button>
        </div>
      </div>

      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Example input {fetching && "(fetching…)"}</label>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={4}
        placeholder="Live transaction data will appear here after you fetch a txid…"
        className="w-full px-3 py-2 mt-1 mb-3 rounded-xl border border-zinc-200 text-xs font-mono outline-none focus:border-zinc-400 resize-y"
      />
      <div className="flex items-center justify-between mb-1">
        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Expected output {drafting && "(auto-drafting…)"}</label>
        {input && !output && !drafting && (
          <button onClick={fetchTx} className="text-[10px] text-cyan-600 font-bold flex items-center gap-1 hover:underline">
            <Sparkles className="w-3 h-3" /> Re-draft
          </button>
        )}
      </div>
      <textarea
        value={output}
        onChange={(e) => setOutput(e.target.value)}
        rows={3}
        placeholder="Auto-drafted summary — edit to match how you want the agent to respond."
        className="w-full px-3 py-2 mt-1 mb-3 rounded-xl border border-zinc-200 text-sm outline-none focus:border-zinc-400 resize-y"
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
              <p className="text-xs text-zinc-700 whitespace-pre-wrap break-all"><span className="font-semibold text-zinc-400">in:</span> {ex.input}</p>
              <p className="text-xs text-zinc-700 mt-1 whitespace-pre-wrap"><span className="font-semibold text-zinc-400">out:</span> {ex.output}</p>
              {ex.tx_id && (
                <a href={`https://explorer.kaspa.org/txs/${ex.tx_id}`} target="_blank" rel="noreferrer" className="text-[10px] font-mono text-cyan-600 hover:underline mt-1 inline-block">
                  anchor tx: {ex.tx_id.slice(0, 24)}…
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}