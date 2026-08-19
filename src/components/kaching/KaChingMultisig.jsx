import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, Plus, Trash2, KeyRound, Check, Loader2, Lock, Info, Users, ChevronRight } from "lucide-react";
import {
  getVaults, createVault, deleteVault, newCosignerKeypair,
  getProposals, createProposal, signProposal, proposalReady,
  markProposalExecuted, deleteProposal, getAllOwnedAddresses,
  getPrivateKeyFor, isValidKaspaAddress,
} from "@/lib/kachingVault";

export default function KaChingMultisig({ onActivity }) {
  const [tab, setTab] = useState("vaults"); // vaults | proposals
  const [vaults, setVaults] = useState(getVaults());
  const [proposals, setProposals] = useState(getProposals());
  const [addresses] = useState(getAllOwnedAddresses());
  const refresh = () => { setVaults(getVaults()); setProposals(getProposals()); };

  const [showCreate, setShowCreate] = useState(false);
  const [vName, setVName] = useState("");
  const [threshold, setThreshold] = useState(2);
  const [cosigners, setCosigners] = useState([]);
  const [error, setError] = useState("");

  const addCosigner = () => {
    const kp = newCosignerKeypair(`Cosigner ${cosigners.length + 1}`);
    setCosigners([...cosigners, { ...kp, label: kp.label }]);
  };
  const addExternal = () => setCosigners([...cosigners, { label: `External ${cosigners.length + 1}`, pubKey: "", privateKey: "", address: "" }]);

  const saveVault = () => {
    setError("");
    if (cosigners.length < 2) return setError("Add at least 2 cosigners");
    if (threshold < 1 || threshold > cosigners.length) return setError(`Threshold must be 1–${cosigners.length}`);
    for (const c of cosigners) {
      if (!c.pubKey || !/^[0-9a-f]{64}$/.test(c.pubKey)) return setError(`Cosigner "${c.label}" needs a valid 64-hex x-only pubkey`);
    }
    createVault(vName || "Vault", threshold, cosigners.map((c) => ({ label: c.label, pubKey: c.pubKey, address: c.address })));
    // store cosigner private keys alongside (client-side only) so the user can sign
    const all = getVaults();
    all[all.length - 1].cosignerKeys = cosigners.map((c) => ({ pubKey: c.pubKey, privateKey: c.privateKey || "" }));
    localStorage.setItem("kaching_vaults", JSON.stringify(all));
    setVName(""); setThreshold(2); setCosigners([]); setShowCreate(false); refresh();
  };

  return (
    <div className="space-y-5">
      {/* Honest, plain-English header */}
      <div>
        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2"><Shield className="w-4 h-4 text-cyan-300" /> Co-signer Approval</h2>
        <p className="text-xs text-white/50 mb-3">
          A spend gets proposed, then needs <span className="text-cyan-200 font-semibold">m of n co-signers to approve it</span> before the owner broadcasts it on-chain.
        </p>
      </div>

      {/* Honesty banner — the one thing a non-expert must understand */}
      <div className="rounded-2xl border border-amber-400/25 bg-amber-500/5 p-3 flex gap-2">
        <Info className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed text-amber-100/80">
          <span className="font-semibold text-amber-200">Good to know:</span> approvals live off-chain on this device. The wallet owner's key still signs the real on-chain spend — so this is an <span className="font-semibold">approval gate</span> (great for shared treasuries, second-device confirmation, escrow), not a lock that removes the owner's control. True on-chain m-of-n Kaspa multisig needs covenant scripts this wallet doesn't build yet.
        </p>
      </div>

      {/* Step rail so the flow is obvious */}
      <div className="flex items-center gap-1 text-[10px] font-mono text-white/50">
        {[
          { n: 1, label: "Create vault", tab: "vaults" },
          { n: 2, label: "New proposal", tab: "proposals" },
          { n: 3, label: "Approve × m", tab: "proposals" },
          { n: 4, label: "Execute", tab: "proposals" },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <button onClick={() => setTab(s.tab)} className={`flex items-center gap-1 ${tab === s.tab ? "text-cyan-300" : ""}`}>
              <span className="w-4 h-4 rounded-full bg-white/10 text-white/70 flex items-center justify-center text-[9px] font-bold">{s.n}</span>
              <span>{s.label}</span>
            </button>
            {i < 3 && <ChevronRight className="w-3 h-3 text-white/20" />}
          </React.Fragment>
        ))}
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-black/40 border border-white/10">
        <button onClick={() => setTab("vaults")} className={`flex-1 h-9 rounded-lg text-xs font-semibold ${tab === "vaults" ? "bg-white/10 text-white" : "text-white/50"}`}>Vaults</button>
        <button onClick={() => setTab("proposals")} className={`flex-1 h-9 rounded-lg text-xs font-semibold ${tab === "proposals" ? "bg-white/10 text-white" : "text-white/50"}`}>Proposals</button>
      </div>

      {tab === "vaults" ? (
        <div className="space-y-3">
          {!showCreate && (
            <button onClick={() => { setShowCreate(true); setCosigners([]); }} className="w-full h-11 rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-200 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-cyan-500/20">
              <Plus className="w-4 h-4" /> New vault
            </button>
          )}
          {showCreate && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-[11px] text-cyan-200/80">
                <Users className="w-3.5 h-3.5" /> Step 1 — define who can approve
              </div>
              <input value={vName} onChange={(e) => setVName(e.target.value)} placeholder="Vault name (e.g. Team Treasury)" className="w-full h-10 px-3 rounded-lg bg-black/40 border border-white/10 text-sm text-white outline-none focus:border-cyan-400/50" />
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Approvals needed (m of n)</label>
                <input type="number" min={1} max={cosigners.length || 1} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-full h-10 mt-1 px-3 rounded-lg bg-black/40 border border-white/10 text-sm text-white outline-none focus:border-cyan-400/50" />
                <p className="text-[10px] text-white/40 mt-1">Example: 2 means any 2 of the cosigners below must approve each spend.</p>
              </div>
              <div className="space-y-1.5">
                {cosigners.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-black/40 border border-white/10">
                    <KeyRound className="w-3.5 h-3.5 text-cyan-300 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-white">{c.label}</div>
                      <div className="text-[10px] text-white/40 font-mono truncate">{c.pubKey ? `${c.pubKey.slice(0, 16)}…` : "external — paste pubkey"}</div>
                    </div>
                    <button onClick={() => setCosigners(cosigners.filter((_, j) => j !== i))} className="text-white/40 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={addCosigner} className="flex-1 h-9 rounded-lg border border-white/10 text-xs text-white/70 hover:bg-white/5 flex items-center justify-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Generate key</button>
                <button onClick={addExternal} className="flex-1 h-9 rounded-lg border border-white/10 text-xs text-white/70 hover:bg-white/5 flex items-center justify-center gap-1.5"><Plus className="w-3.5 h-3.5" /> External</button>
              </div>
              {error && <div className="text-xs text-red-400">{error}</div>}
              <div className="flex gap-2">
                <button onClick={saveVault} className="flex-1 h-10 rounded-lg bg-cyan-500 text-black text-sm font-semibold">Create vault</button>
                <button onClick={() => setShowCreate(false)} className="h-10 px-4 rounded-lg border border-white/10 text-sm text-white/60">Cancel</button>
              </div>
            </div>
          )}

          {vaults.length === 0 && !showCreate && (
            <div className="text-xs text-white/40 text-center py-6">No vaults yet. A vault is just a named list of co-signers + how many approvals are required.</div>
          )}
          {vaults.map((v) => (
            <div key={v.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-bold text-white">{v.name}</div>
                <button onClick={() => { deleteVault(v.id); refresh(); }} className="text-white/40 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <div className="text-[11px] text-cyan-200 font-mono mb-2">{v.threshold}-of-{v.cosigners.length} approvals</div>
              <div className="space-y-1">
                {v.cosigners.map((c, i) => (
                  <div key={i} className="text-[10px] text-white/50 font-mono truncate">{c.label}: {c.pubKey.slice(0, 20)}…</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ProposalsTab vaults={vaults} proposals={proposals} addresses={addresses} refresh={refresh} onActivity={onActivity} />
      )}
    </div>
  );
}

function ProposalsTab({ vaults, proposals, addresses, refresh, onActivity }) {
  const [showCreate, setShowCreate] = useState(false);
  const [vaultId, setVaultId] = useState(vaults[0]?.id || "");
  const [fromIdx, setFromIdx] = useState(0);
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const vault = vaults.find((v) => v.id === vaultId);
  const from = addresses[fromIdx];

  const submit = () => {
    setError("");
    if (!vault) return setError("Create a vault first (Step 1)");
    if (!from) return setError("No wallet address — create a wallet first");
    if (!isValidKaspaAddress(to.startsWith("kaspa:") ? to : `kaspa:${to}`)) return setError("Invalid recipient");
    if (!amount || parseFloat(amount) <= 0) return setError("Enter an amount");
    createProposal(vault.id, from.address, to, amount, []);
    setShowCreate(false); setTo(""); setAmount(""); refresh();
  };

  const signAll = (p) => {
    const v = vaults.find((x) => x.id === p.vaultId);
    if (!v) return;
    const keys = v.cosignerKeys || [];
    for (const c of v.cosigners) {
      const k = keys.find((x) => x.pubKey === c.pubKey);
      if (k?.privateKey) {
        try { signProposal(p.id, k.privateKey); } catch (e) { setError(e.message); }
      }
    }
    refresh();
  };

  const execute = async (p) => {
    setError("");
    if (!proposalReady(p)) return setError("Not enough signatures");
    setBusy(true);
    try {
      const res = await base44.functions.invoke("sendKaspaTransaction", {
        privateKey: getPrivateKeyFor(p.fromAddress),
        fromAddress: p.fromAddress,
        toAddress: p.toAddress,
        amountKas: p.amountKas,
      });
      const d = res?.data || res;
      if (d?.error) throw new Error(d.error);
      markProposalExecuted(p.id, d.txId);
      refresh();
      onActivity?.();
    } catch (e) {
      setError(e?.message || "Execute failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      {vaults.length === 0 && !showCreate && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">
          <div className="text-xs text-white/50 mb-3">You need a vault before you can propose a spend.</div>
          <div className="text-[10px] text-white/40">Go to the <span className="text-cyan-300">Vaults</span> tab → New vault first.</div>
        </div>
      )}
      {!showCreate && vaults.length > 0 && (
        <button onClick={() => setShowCreate(true)} className="w-full h-11 rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-200 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-cyan-500/20">
          <Plus className="w-4 h-4" /> New proposal
        </button>
      )}
      {showCreate && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
          <div className="flex items-center gap-1.5 text-[11px] text-cyan-200/80">
            <KeyRound className="w-3.5 h-3.5" /> Step 2 — propose a spend (no funds move yet)
          </div>
          <select value={vaultId} onChange={(e) => setVaultId(e.target.value)} className="w-full h-10 px-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white outline-none">
            {vaults.map((v) => <option key={v.id} value={v.id} className="bg-black">{v.name} ({v.threshold}-of-{v.cosigners.length})</option>)}
          </select>
          <select value={fromIdx} onChange={(e) => setFromIdx(Number(e.target.value))} className="w-full h-10 px-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white outline-none">
            {addresses.map((a, i) => <option key={a.address} value={i} className="bg-black">{a.label} — {a.address.slice(0, 12)}…</option>)}
          </select>
          <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Recipient kaspa:…" className="w-full h-10 px-3 rounded-lg bg-black/40 border border-white/10 text-sm text-white font-mono outline-none focus:border-cyan-400/50" />
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount KAS" className="w-full h-10 px-3 rounded-lg bg-black/40 border border-white/10 text-sm text-white outline-none focus:border-cyan-400/50" />
          {error && <div className="text-xs text-red-400">{error}</div>}
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 h-10 rounded-lg bg-cyan-500 text-black text-sm font-semibold">Create</button>
            <button onClick={() => setShowCreate(false)} className="h-10 px-4 rounded-lg border border-white/10 text-sm text-white/60">Cancel</button>
          </div>
        </div>
      )}

      {proposals.length === 0 && !showCreate && vaults.length > 0 && <div className="text-xs text-white/40 text-center py-6">No proposals yet. Tap "New proposal" to start a spend that needs approval.</div>}
      {proposals.map((p) => {
        const v = vaults.find((x) => x.id === p.vaultId);
        const ready = proposalReady(p);
        const needed = (v?.threshold || 0) - (p.signatures?.length || 0);
        return (
          <div key={p.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono text-white/70">{(p.amountKas)} KAS → {p.toAddress.slice(0, 16)}…</div>
              <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded ${p.status === "executed" ? "bg-emerald-500/20 text-emerald-300" : ready ? "bg-cyan-500/20 text-cyan-200" : "bg-amber-500/20 text-amber-300"}`}>
                {p.status === "executed" ? "executed" : ready ? "ready" : `${p.signatures.length}/${v?.threshold || 0}`}
              </span>
            </div>
            <div className="text-[10px] text-white/40 font-mono">from {p.fromAddress.slice(0, 20)}…</div>
            {p.status !== "executed" && !ready && (
              <div className="text-[10px] text-amber-300/80">Step 3 — needs {needed} more approval{needed === 1 ? "" : "s"} to unlock.</div>
            )}
            {p.status !== "executed" && (
              <div className="flex gap-2 pt-1">
                {!ready && <button onClick={() => signAll(p)} className="flex-1 h-9 rounded-lg border border-white/10 text-xs text-white/70 hover:bg-white/5 flex items-center justify-center gap-1.5"><KeyRound className="w-3.5 h-3.5" /> Approve</button>}
                {ready && <button onClick={() => execute(p)} disabled={busy} className="flex-1 h-9 rounded-lg bg-cyan-500 text-black text-xs font-semibold flex items-center justify-center gap-1.5">{busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />} Step 4 · Execute</button>}
                <button onClick={() => { deleteProposal(p.id); refresh(); }} className="h-9 px-3 rounded-lg border border-white/10 text-white/40 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            )}
            {p.txId && <div className="text-[10px] text-emerald-300 font-mono break-all">tx: {p.txId}</div>}
          </div>
        );
      })}
      {error && !showCreate && <div className="text-xs text-red-400">{error}</div>}
    </div>
  );
}