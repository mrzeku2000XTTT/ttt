import React, { useState, useEffect, useCallback } from "react";
import { Wallet, Plus, Loader2, Shield, X, Users, Link2, Copy, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useKcc20Wallet, shortKaspaAddress } from "@/lib/useKcc20Wallet";
import CollabSession from "@/components/kaspacollab/CollabSession";
import BackToStore from "@/components/BackToStore";
import CollabLanding from "@/components/kaspacollab/CollabLanding";
import CollabDashboard from "@/components/kaspacollab/CollabDashboard";

export default function KaspaCollabPage() {
  const { address, kas, loading, error, connect } = useKcc20Wallet();
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [activeSession, setActiveSession] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [walletSaved, setWalletSaved] = useState(false);

  // Load user + save wallet to profile when connected
  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (address && user && !walletSaved) {
      base44.auth.updateMe({ created_wallet_address: address }).then(() => {
        setWalletSaved(true);
      }).catch(() => {});
    }
    if (!address) setWalletSaved(false);
  }, [address, user, walletSaved]);

  // Load sessions for this wallet
  const loadSessions = useCallback(async () => {
    if (!address) { setSessions([]); setLoadingSessions(false); return; }
    setLoadingSessions(true);
    try {
      const all = await base44.entities.KaspaCollab.list("-updated_date", 50);
      // RLS already filters to only sessions where we're wallet_a or wallet_b
      setSessions(all);
    } catch (e) {
      console.error("session load failed", e);
    } finally {
      setLoadingSessions(false);
    }
  }, [address]);

  useEffect(() => {
    loadSessions();
    const unsub = base44.entities.KaspaCollab.subscribe(() => { loadSessions(); });
    return unsub;
  }, [loadSessions]);

  const handleDelete = async (session) => {
    if (!confirm(`Delete "${session.title}"? This removes it for both wallets.`)) return;
    try {
      await base44.entities.KaspaCollab.delete(session.id);
      setActiveSession(null);
      loadSessions();
    } catch (e) {
      alert("Delete failed — only the creator can delete a session.");
    }
  };

  // ── Not connected: landing with the existing wallet connection flow ──
  if (!address) {
    return <CollabLanding onConnect={() => connect().catch(() => {})} loading={loading} error={error} />;
  }

  // ── Connected: themed dashboard + active session ──
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <BackToStore />
      {activeSession ? (
        <div className="flex-1 flex flex-col" style={{ height: "calc(100vh - 49px)" }}>
          <CollabSession
            session={activeSession}
            myWallet={address}
            onBack={() => setActiveSession(null)}
            onDelete={handleDelete}
          />
        </div>
      ) : (
        <CollabDashboard
          address={address}
          sessions={sessions}
          loadingSessions={loadingSessions}
          onNew={() => setShowCreate(true)}
          onOpen={setActiveSession}
        />
      )}

      {/* Create session modal */}
      {showCreate && (
        <CreateSessionModal
          myWallet={address}
          onClose={() => setShowCreate(false)}
          onCreated={(s) => { setShowCreate(false); setActiveSession(s); loadSessions(); }}
        />
      )}
    </div>
  );
}

function CreateSessionModal({ myWallet, onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [partner, setPartner] = useState("");
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  const create = async () => {
    setErr("");
    if (!title.trim()) { setErr("Give your session a title"); return; }
    let cleanPartner = partner.trim().replace(/^kaspa:/, "");
    if (!cleanPartner) { setErr("Enter your partner's Kaspa address"); return; }
    if (cleanPartner === myWallet) { setErr("You can't collab with yourself"); return; }
    if (cleanPartner.length < 30) { setErr("That doesn't look like a valid Kaspa address"); return; }
    setCreating(true);
    try {
      const rec = await base44.entities.KaspaCollab.create({
        title: title.trim(),
        wallet_a: myWallet,
        wallet_b: cleanPartner,
        pad_content: "",
        notes: [],
        status: "active",
      });
      onCreated(rec);
    } catch (e) {
      setErr(e?.message || "Could not create session — make sure your wallet is connected");
    } finally {
      setCreating(false);
    }
  };

  const copyMyAddr = async () => {
    try { await navigator.clipboard.writeText(`kaspa:${myWallet}`); setCopied(true); setTimeout(() => setCopied(false), 1400); } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-white/10 p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-base">New Collab Session</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Kutt timeline integration"
              className="w-full mt-1 bg-white/5 text-white text-sm px-3 py-2.5 rounded-lg outline-none placeholder-white/30 border border-white/10 focus:border-[#00ff99]/40"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Partner's Kaspa Address</label>
            <input
              value={partner}
              onChange={(e) => setPartner(e.target.value)}
              placeholder="kaspa:qz…"
              className="w-full mt-1 bg-white/5 text-white text-sm px-3 py-2.5 rounded-lg outline-none placeholder-white/30 border border-white/10 focus:border-[#00ff99]/40 font-mono"
            />
            <p className="text-[10px] text-white/30 mt-1.5">Your partner must connect the Scorpion wallet matching this address to access the session.</p>
          </div>
          <button
            onClick={copyMyAddr}
            className="w-full flex items-center justify-center gap-1.5 text-[11px] text-white/50 hover:text-white/80 bg-white/5 border border-white/10 rounded-lg py-2 transition"
          >
            {copied ? <Check className="w-3 h-3 text-[#00ff99]" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied!" : "Copy my address to share"}
          </button>
        </div>

        {err && <p className="text-red-400 text-xs">{err}</p>}

        <button
          onClick={create}
          disabled={creating}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-[#00ff99] text-black font-bold hover:opacity-90 disabled:opacity-50 transition"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Create Session
        </button>
      </div>
    </div>
  );
}