import React, { useState } from "react";
import { Trash2, Zap, Loader2, Send, Search, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * AgentTrainer — generic skill training.
 *
 * The user writes any input (a question, a txid, code, a prompt — anything
 * matching the agent's task). We auto-draft an expected output using the
 * agent's task + system prompt, so the agent learns the SKILL the user
 * defined — not a hardcoded behaviour. Each epoch is anchored by a real
 * Kaspa self-send.
 *
 * For transaction-analyst agents, an optional "fetch live tx" helper pulls
 * real on-chain data into the input.
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

export default function AgentTrainer({ agent, wallet, onChanged, task, systemPrompt }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [txid, setTxid] = useState("");
  const [training, setTraining] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState("");
  const [showTxHelper, setShowTxHelper] = useState(false);

  const examples = agent?.training_examples || [];
  const skill = task || agent?.task || "";
  const persona = systemPrompt || agent?.system_prompt || "";

  const autoDraft = async () => {
    if (!input.trim()) return;
    setDrafting(true);
    setError("");
    try {
      const prompt = `You are training an AI agent. Its skill/task is: "${skill}"\nIts system prompt is: "${persona}"\n\nGiven this input, write the ideal output the agent should produce. Match the skill exactly. Output ONLY the answer, no preamble.\n\nINPUT:\n${input}`;
      const res = await base44.integrations.Core.InvokeLLM({ prompt, model: "claude_sonnet_4_6" });
      setOutput(typeof res === "string" ? res : res?.response || res?.text || "");
    } catch (e) {
      setError(e?.message || "Auto-draft failed");
    }
    setDrafting(false);
  };

  const fetchTx = async () => {
    const id = txid.trim();
    if (!id) return;
    setFetching(true);
    setError("");
    try {
      const res = await base44.functions.invoke("getKaspaTransactionDetails", { txId: id });
      const tx = res?.data || res;
      if (tx?.error) throw new Error(tx.error);
      setInput(formatTxInput(tx));
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
      const balRes = await base44.functions.invoke("getKaspaBalance", { address: wallet.address });
      const bal = balRes?.data || balRes;
      const kas = bal?.balanceKAS ?? bal?.balance ?? 0;
      if (!kas || Number(kas) <= 0) {
        throw new Error("Insufficient balance — send KAS to your AgentInternet wallet address above to fund a training epoch. Each epoch is a real self-send transaction and needs funds to cover it.");
      }

      const txRes = await base44.functions.invoke("sendKaspaTransaction", {
        privateKey: wallet.privateKey,
        fromAddress: wallet.address,
        toAddress: wallet.address,
        amountKas: "0.2",
      });
      const tx = txRes?.data || txRes;
      if (tx?.error) throw new Error(tx.error);
      const anchorTxId = typeof tx.txId === "string" ? tx.txId : String(tx.txId || "");

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
      <p className="text-sm text-zinc-500 leading-relaxed mb-3">
        Train this agent on its skill: <span className="font-semibold text-zinc-700">{skill || "any task you defined"}</span>. Write an input, auto-draft the ideal output, then run an epoch — each one is anchored by a real self-send.
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

      {/* Optional live-tx helper for transaction agents */}
      <button onClick={() => setShowTxHelper((s) => !s)} className="text-[11px] text-zinc-400 hover:text-zinc-700 font-semibold flex items-center gap-1 mb-2">
        {showTxHelper ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        Fetch live Kaspa transaction
      </button>
      {showTxHelper && (
        <div className="rounded-xl bg-zinc-50 border border-zinc-200/70 p-3 mb-3">
          <div className="flex gap-2">
            <input
              value={txid}
              onChange={(e) => setTxid(e.target.value)}
              placeholder="e.g. b560adf6ecd20e11c819d82d..."
              className="flex-1 h-10 px-3 rounded-lg border border-zinc-200 text-xs font-mono outline-none focus:border-zinc-400"
            />
            <button onClick={fetchTx} disabled={!txid.trim() || fetching} className="h-10 px-3 rounded-lg bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 disabled:opacity-40 flex items-center gap-1.5">
              {fetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              {fetching ? "Fetching" : "Fetch"}
            </button>
          </div>
        </div>
      )}

      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Example input</label>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={4}
        placeholder={skill ? `An input for: ${skill}` : "Any input your agent should handle…"}
        className="w-full px-3 py-2 mt-1 mb-2 rounded-xl border border-zinc-200 text-sm outline-none focus:border-zinc-400 resize-y"
      />
      <div className="flex items-center justify-between mb-1">
        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Expected output {drafting && "(auto-drafting…)"}</label>
        <button onClick={autoDraft} disabled={!input.trim() || drafting} className="text-[10px] text-cyan-600 font-bold flex items-center gap-1 hover:underline disabled:opacity-40">
          {drafting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          Auto-draft from skill
        </button>
      </div>
      <textarea
        value={output}
        onChange={(e) => setOutput(e.target.value)}
        rows={3}
        placeholder="The ideal answer — auto-drafted from the agent's task, then editable."
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