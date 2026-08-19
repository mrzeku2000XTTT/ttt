import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Plus, Download, KeyRound, Eye, EyeOff, Copy, Check, Trash2, LogOut, Wallet as WalletIcon, ChevronRight, Shield } from "lucide-react";
import {
  listKaChingWallets, getActiveKaChingWalletId, setActiveKaChingWallet,
  createKaChingWalletNamed, importKaChingWalletNamed,
  renameKaChingWallet, deleteKaChingWallet, exitKaChingSession,
  getAllOwnedAddresses,
} from "@/lib/kachingVault";

/**
 * KaChingWalletManager — local-only key + multi-wallet manager.
 * Keys are generated/imported/stored entirely on this device and never
 * sent to a server. Lets users open new wallets, switch between them,
 * reveal/copy their private keys, rename, delete, and exit the session.
 */
export default function KaChingWalletManager({ open, onClose, onChanged }) {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const bump = () => { setTick((t) => t + 1); onChanged?.(); };

  const [tab, setTab] = useState("wallets"); // wallets | new | import
  const [name, setName] = useState("");
  const [privKey, setPrivKey] = useState("");
  const [importName, setImportName] = useState("");
  const [err, setErr] = useState("");
  const [reveal, setReveal] = useState({});
  const [copied, setCopied] = useState("");
  const [confirmDel, setConfirmDel] = useState(null);
  const [confirmExit, setConfirmExit] = useState(false);

  if (!open) return null;
  const wallets = listKaChingWallets();
  const activeId = getActiveKaChingWalletId();

  const close = () => { setTab("wallets"); setErr(""); setPrivKey(""); setName(""); setImportName(""); setConfirmDel(null); setConfirmExit(false); onClose?.(); };

  const doCreate = () => {
    try { createKaChingWalletNamed(name.trim() || undefined); setName(""); bump(); setTab("wallets"); }
    catch (e) { setErr(String(e?.message || e)); }
  };
  const doImport = () => {
    setErr("");
    try { importKaChingWalletNamed(privKey, importName.trim() || undefined); setPrivKey(""); setImportName(""); bump(); setTab("wallets"); }
    catch (e) { setErr(String(e?.message || e)); }
  };
  const doSwitch = (id) => { setActiveKaChingWallet(id); bump(); };
  const doRename = (id, val) => { renameKaChingWallet(id, val); bump(); };
  const doDelete = (id) => { deleteKaChingWallet(id); setConfirmDel(null); bump(); if (!listKaChingWallets().length) { exitKaChingSession(); close(); navigate("/AppStoreV2"); } };
  const doExit = () => { exitKaChingSession(); setConfirmExit(false); close(); onChanged?.(); navigate("/AppStoreV2"); };

  const copy = async (text, tag) => { try { await navigator.clipboard.writeText(text); setCopied(tag); setTimeout(() => setCopied(""), 1200); } catch {} };

  const primaryOf = (w) => w.addresses[0];

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={close}>
      <div className="w-full sm:max-w-md max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#0a0a0a] border border-white/10 text-white" onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="sticky top-0 bg-[#0a0a0a]/95 backdrop-blur border-b border-white/10 px-4 h-14 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-cyan-300" />
            <span className="text-sm font-bold">Key & Wallet Manager</span>
          </div>
          <button onClick={close} className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-4 py-4 space-y-4">
          <div className="flex items-start gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.04] p-3">
            <Shield className="w-4 h-4 text-cyan-300 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-white/60 leading-relaxed">
              Everything here is <span className="text-cyan-300 font-semibold">100% local</span>. Keys are generated, imported & stored on this device only — never uploaded to any server.
            </p>
          </div>

          {/* tabs */}
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-white/[0.03] p-1">
            {[
              { id: "wallets", label: "Wallets" },
              { id: "new", label: "New" },
              { id: "import", label: "Import" },
            ].map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`h-9 rounded-lg text-xs font-semibold transition ${tab === t.id ? "bg-cyan-500 text-black" : "text-white/60 hover:text-white"}`}>{t.label}</button>
            ))}
          </div>

          {err && <div className="text-xs text-red-400 -mt-2">{err}</div>}

          {/* wallets list */}
          {tab === "wallets" && (
            <div className="space-y-3">
              {wallets.length === 0 && (
                <p className="text-center text-sm text-white/40 py-6">No wallets yet. Open the <span className="text-cyan-300">New</span> or <span className="text-cyan-300">Import</span> tab to create one.</p>
              )}
              {wallets.map((w) => {
                const p = primaryOf(w);
                const on = w.id === activeId;
                const showPk = reveal[w.id];
                return (
                  <div key={w.id} className={`rounded-2xl border p-3 ${on ? "border-cyan-400/40 bg-cyan-400/[0.05]" : "border-white/10 bg-white/[0.02]"}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${on ? "bg-cyan-500 text-black" : "bg-white/10 text-white/60"}`}><WalletIcon className="w-4 h-4" /></div>
                      <input
                        defaultValue={w.name}
                        onBlur={(e) => doRename(w.id, e.target.value)}
                        className="flex-1 bg-transparent text-sm font-bold outline-none min-w-0"
                      />
                      {w.imported && <span className="text-[9px] uppercase tracking-wider text-white/40 px-1.5 py-0.5 rounded bg-white/5">Imported</span>}
                      {on && <span className="text-[9px] uppercase tracking-wider text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-400/10">Active</span>}
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <code className="flex-1 text-[11px] text-cyan-300/90 font-mono truncate">{p?.address}</code>
                      <button onClick={() => copy(p?.address, `addr-${w.id}`)} className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white">{copied === `addr-${w.id}` ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}</button>
                    </div>

                    {/* private key reveal */}
                    <div className="mt-2 rounded-lg bg-black/40 border border-white/5 p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] uppercase tracking-widest text-white/40">Private key</span>
                        <button onClick={() => setReveal((s) => ({ ...s, [w.id]: !s[w.id] }))} className="text-[10px] text-white/50 hover:text-cyan-300 flex items-center gap-1">{showPk ? <><EyeOff className="w-3 h-3" /> Hide</> : <><Eye className="w-3 h-3" /> Reveal</>}</button>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <code className="flex-1 text-[10px] font-mono break-all text-white/70">{showPk ? p?.privateKey : "•".repeat(64)}</code>
                        <button onClick={() => copy(p?.privateKey, `pk-${w.id}`)} className="w-6 h-6 flex items-center justify-center text-white/40 hover:text-white">{copied === `pk-${w.id}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}</button>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      {!on && <button onClick={() => doSwitch(w.id)} className="flex-1 h-8 rounded-lg text-[11px] font-semibold bg-white/5 text-white/80 hover:bg-white/10 flex items-center justify-center gap-1">Switch <ChevronRight className="w-3 h-3" /></button>}
                      {confirmDel === w.id ? (
                        <div className="flex-1 flex items-center gap-1">
                          <button onClick={() => doDelete(w.id)} className="flex-1 h-8 rounded-lg text-[11px] font-semibold bg-red-500 text-white">Delete</button>
                          <button onClick={() => setConfirmDel(null)} className="flex-1 h-8 rounded-lg text-[11px] font-semibold bg-white/5 text-white/70">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDel(w.id)} className="h-8 px-3 rounded-lg text-[11px] font-semibold bg-white/5 text-red-400 hover:bg-red-500/10 flex items-center gap-1"><Trash2 className="w-3 h-3" /> Delete</button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* exit */}
              <div className="pt-1">
                {confirmExit ? (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/[0.06] p-3 space-y-2">
                    <p className="text-[11px] text-white/70">Exit wipes <span className="text-red-400 font-semibold">every wallet + key</span> from this device. Make sure your keys are backed up — this cannot be undone.</p>
                    <div className="flex items-center gap-2">
                      <button onClick={doExit} className="flex-1 h-9 rounded-lg bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-1"><LogOut className="w-3.5 h-3.5" /> Exit & Wipe</button>
                      <button onClick={() => setConfirmExit(false)} className="flex-1 h-9 rounded-lg bg-white/5 text-white/70 text-xs font-semibold">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setConfirmExit(true)} className="w-full h-10 rounded-xl border border-red-500/20 text-red-400 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-red-500/10"><LogOut className="w-4 h-4" /> Exit Wallet</button>
                )}
              </div>
            </div>
          )}

          {/* new wallet */}
          {tab === "new" && (
            <div className="space-y-3">
              <p className="text-[11px] text-white/50">Generate a brand-new Kaspa keypair on this device. Nothing leaves your browser.</p>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Wallet name (optional)" className="w-full h-11 px-3 rounded-xl bg-black/40 border border-white/10 text-sm text-white outline-none focus:border-cyan-400/50" />
              <button onClick={doCreate} className="w-full h-11 rounded-xl bg-cyan-500 text-black font-semibold text-sm flex items-center justify-center gap-2 hover:bg-cyan-400"><Plus className="w-4 h-4" /> Create Wallet</button>
            </div>
          )}

          {/* import */}
          {tab === "import" && (
            <div className="space-y-3">
              <p className="text-[11px] text-white/50">Import an existing wallet by pasting its private key. The key is read locally and stored only on this device.</p>
              <input value={importName} onChange={(e) => setImportName(e.target.value)} placeholder="Wallet name (optional)" className="w-full h-11 px-3 rounded-xl bg-black/40 border border-white/10 text-sm text-white outline-none focus:border-cyan-400/50" />
              <textarea value={privKey} onChange={(e) => setPrivKey(e.target.value)} placeholder="Private key (64 hex chars)" rows={3} className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-white font-mono outline-none focus:border-cyan-400/50 resize-none" />
              <button onClick={doImport} className="w-full h-11 rounded-xl bg-cyan-500 text-black font-semibold text-sm flex items-center justify-center gap-2 hover:bg-cyan-400"><Download className="w-4 h-4" /> Import Wallet</button>
              <p className="text-[10px] text-white/30 leading-relaxed">A Kaspa private key is 64 hexadecimal characters. Keep it secret — anyone with this key controls the funds.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}