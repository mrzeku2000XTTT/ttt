import React, { useState, useEffect } from "react";
import { Loader2, Search, Bot, ShieldCheck, Gavel, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ConsensusLedger from "@/components/agentstudio/ConsensusLedger";

/**
 * AgentConsensus — agent-to-agent consensus, anchored on Kaspa.
 *
 * Agent A (summarizer) makes a claim about a real transaction.
 * This agent (auditor) checks the claim against live chain data.
 * If it holds up, the auditor signs off with a real self-send —
 * an on-chain certificate that one agent verified another.
 */
export default function AgentConsensus({ agent, wallet }) {
  const [agents, setAgents] = useState([]);
  const [summarizerId, setSummarizerId] = useState("");
  const [txid, setTxid] = useState("");
  const [claim, setClaim] = useState("");
  const [audit, setAudit] = useState(null);
  const [records, setRecords] = useState([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const all = await base44.entities.AgentInternetAgent.list("-created_date", 50);
        setAgents(all.filter((a) => a.id !== agent.id));
        const recs = await base44.entities.AgentAuditRecord.filter({ auditor_agent_id: agent.id }, "-created_date", 20);
        setRecords(recs);
      } catch { /* not signed in */ }
      setLoaded(true);
    })();
  }, [agent.id]);

  // Consensus needs a second agent to make the claim — stay hidden until one exists.
  if (!loaded || (!agents.length && !records.length)) return null;

  const summarizer = agents.find((a) => a.id === summarizerId);

  const pickLiveTx = async () => {
    setBusy("tx"); setError("");
    try {
      const res = await base44.functions.invoke("getLiveKaspaTransactions", {});
      const list = res?.data?.transactions || [];
      if (!list.length) throw new Error("No live transactions available right now");
      setTxid(list[Math.floor(Math.random() * Math.min(list.length, 10))].hash);
    } catch (e) { setError(e?.message || "Could not load live transactions"); }
    setBusy("");
  };

  const generateClaim = async () => {
    if (!summarizer || !txid.trim()) return;
    setBusy("claim"); setError(""); setAudit(null);
    try {
      const det = await base44.functions.invoke("getKaspaTransactionDetails", { txId: txid.trim() });
      const tx = det?.data || det;
      if (tx?.error) throw new Error(tx.error);

      const fewShot = (summarizer.training_examples || [])
        .slice(-4)
        .map((e) => `Input:\n${e.input}\n\nOutput:\n${e.output}`)
        .join("\n\n---\n\n");

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `${summarizer.system_prompt}\n\nYour task: ${summarizer.task || "summarize the data"}\n${fewShot ? `\nYour trained examples:\n${fewShot}\n` : ""}\nSummarize this Kaspa transaction in 2-4 sentences. Include the amount, the recipient address and whether it was accepted.\n\nTRANSACTION DATA:\n${JSON.stringify(tx, null, 2)}`,
      });
      setClaim(typeof res === "string" ? res : res?.response || res?.text || "");
    } catch (e) { setError(e?.message || "Claim generation failed"); }
    setBusy("");
  };

  const runAudit = async () => {
    if (!txid.trim() || !claim.trim()) return;
    setBusy("audit"); setError(""); setAudit(null);
    try {
      const res = await base44.functions.invoke("auditAgentClaim", {
        txId: txid.trim(),
        claim: claim.trim(),
        auditCriteria: agent.task || "",
      });
      const data = res?.data || res;
      if (data?.error) throw new Error(data.error);
      setAudit(data);
      if (data.verdict === "rejected") await saveRecord(data, null);
    } catch (e) { setError(e?.message || "Audit failed"); }
    setBusy("");
  };

  const saveRecord = async (data, anchorTxId) => {
    const user = await base44.auth.me();
    const rec = await base44.entities.AgentAuditRecord.create({
      user_email: user.email,
      auditor_agent_id: agent.id,
      auditor_agent_name: agent.name,
      summarizer_agent_id: summarizer?.id || "",
      summarizer_agent_name: summarizer?.name || "manual claim",
      subject_tx_id: txid.trim(),
      claim: claim.trim(),
      verdict: data.verdict,
      reasons: data.reasons || [],
      mismatches: data.mismatches || [],
      anchor_tx_id: anchorTxId || "",
      audited_at: new Date().toISOString(),
    });
    setRecords((r) => [rec, ...r]);
    return rec;
  };

  const signOff = async () => {
    if (!wallet?.privateKey || audit?.verdict !== "verified") return;
    setBusy("sign"); setError("");
    try {
      const balRes = await base44.functions.invoke("getKaspaBalance", { address: wallet.address });
      const bal = balRes?.data || balRes;
      const kas = bal?.balanceKAS ?? bal?.balance ?? 0;
      if (!kas || Number(kas) <= 0) throw new Error("Fund the auditor's wallet with KAS to broadcast a sign-off.");

      const txRes = await base44.functions.invoke("sendKaspaTransaction", {
        privateKey: wallet.privateKey,
        fromAddress: wallet.address,
        toAddress: wallet.address,
        amountKas: "0.2",
      });
      const tx = txRes?.data || txRes;
      if (tx?.error) throw new Error(tx.error);
      await saveRecord(audit, String(tx.txId || ""));
      setAudit(null);
      setClaim("");
      setTxid("");
    } catch (e) { setError(e?.message || "Sign-off failed"); }
    setBusy("");
  };

  return (
    <div className="bg-white rounded-2xl ring-1 ring-zinc-200 p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <Gavel className="w-4 h-4 text-zinc-400" />
        <h3 className="font-bold text-zinc-900">Consensus — agent audits agent</h3>
      </div>
      <p className="text-sm text-zinc-500 leading-relaxed mb-4">
        Another agent makes a claim about a real transaction. <span className="font-semibold text-zinc-700">{agent.name}</span> checks it against live chain data and signs off on-chain only if it holds up.
      </p>

      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Summarizer agent</label>
      <select
        value={summarizerId}
        onChange={(e) => setSummarizerId(e.target.value)}
        className="w-full h-10 px-3 mt-1 mb-3 rounded-xl border border-zinc-200 text-sm outline-none focus:border-zinc-400 bg-white"
      >
        <option value="">Select an agent to audit…</option>
        {agents.map((a) => (
          <option key={a.id} value={a.id}>{a.name} — level {a.level || 0}</option>
        ))}
      </select>

      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Subject transaction</label>
      <div className="flex gap-2 mt-1 mb-3">
        <input
          value={txid}
          onChange={(e) => setTxid(e.target.value)}
          placeholder="Kaspa transaction id"
          className="flex-1 h-10 px-3 rounded-xl border border-zinc-200 text-xs font-mono outline-none focus:border-zinc-400"
        />
        <button onClick={pickLiveTx} disabled={busy === "tx"} className="h-10 px-3 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-bold hover:bg-zinc-200 disabled:opacity-40 flex items-center gap-1.5">
          {busy === "tx" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />} Live tx
        </button>
      </div>

      <button
        onClick={generateClaim}
        disabled={!summarizerId || !txid.trim() || busy === "claim"}
        className="w-full h-10 rounded-full bg-zinc-100 text-zinc-800 text-xs font-bold hover:bg-zinc-200 disabled:opacity-40 flex items-center justify-center gap-2 mb-3"
      >
        {busy === "claim" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
        {busy === "claim" ? "Summarizer working…" : `Get claim from ${summarizer?.name || "summarizer"}`}
      </button>

      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Claim under audit</label>
      <textarea
        value={claim}
        onChange={(e) => setClaim(e.target.value)}
        rows={4}
        placeholder="The summarizer's claim — editable, so you can test a false claim and watch the auditor reject it."
        className="w-full px-3 py-2 mt-1 mb-3 rounded-xl border border-zinc-200 text-sm outline-none focus:border-zinc-400 resize-y"
      />

      <button
        onClick={runAudit}
        disabled={!claim.trim() || !txid.trim() || busy === "audit"}
        className="w-full h-11 rounded-full bg-zinc-900 text-white text-sm font-bold hover:bg-zinc-800 disabled:opacity-40 flex items-center justify-center gap-2"
      >
        {busy === "audit" ? <><Loader2 className="w-4 h-4 animate-spin" /> Auditing against chain…</> : <><Sparkles className="w-4 h-4" /> Run audit</>}
      </button>

      {audit && (
        <div className={`mt-3 rounded-xl border p-3 ${audit.verdict === "verified" ? "border-emerald-200 bg-emerald-50/50" : "border-red-200 bg-red-50/50"}`}>
          <p className={`text-xs font-bold uppercase tracking-wide ${audit.verdict === "verified" ? "text-emerald-600" : "text-red-500"}`}>
            {audit.verdict === "verified" ? "Claim holds up against the chain" : "Claim contradicts the chain"}
          </p>
          {(audit.mismatches || []).map((m, i) => <p key={i} className="text-[11px] text-red-500 mt-1">✕ {m}</p>)}
          {(audit.reasons || []).map((m, i) => <p key={i} className="text-[11px] text-zinc-600 mt-1">· {m}</p>)}
          {audit.verdict === "verified" && (
            <button
              onClick={signOff}
              disabled={busy === "sign" || !wallet}
              className="w-full h-10 mt-3 rounded-full bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {busy === "sign" ? <><Loader2 className="w-4 h-4 animate-spin" /> Broadcasting sign-off…</> : <><ShieldCheck className="w-4 h-4" /> Sign off on-chain (self-send)</>}
            </button>
          )}
          {audit.verdict === "verified" && !wallet && <p className="text-[11px] text-amber-500 mt-1">Generate an AgentInternet wallet to sign off.</p>}
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

      <ConsensusLedger records={records} />
    </div>
  );
}