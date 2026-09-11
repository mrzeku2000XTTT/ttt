import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, Radio, Copy, Check, UserPlus, Home } from "lucide-react";
import BackToStore from "@/components/BackToStore";
import KaspaMark from "@/components/tttbuilder/landing/KaspaMark";
import { useKcc20Wallet, shortKaspaAddress } from "@/lib/useKcc20Wallet";
import { base44 } from "@/api/base44Client";
import { fetchOnlineCollaborators } from "@/lib/collabPresence";
import "@/components/kaspacollab/landing.css";

const STATUS_META = {
  live: { label: "Online now", dot: "bg-accent", text: "text-accent" },
  recent: { label: "Recent", dot: "bg-primary", text: "text-primary" },
  offline: { label: "Offline", dot: "bg-muted-foreground", text: "text-muted-foreground" },
};

export default function CollabCollaborators() {
  const navigate = useNavigate();
  const { address } = useKcc20Wallet();
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);

  const load = useCallback(async () => {
    try {
      setCollaborators(await fetchOnlineCollaborators());
    } catch (e) {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 15000);
    let unsub;
    try { unsub = base44.entities.CollabPresence.subscribe?.(() => load()); } catch {}
    return () => { clearInterval(iv); if (unsub) unsub(); };
    // eslint-disable-next-line
  }, []);

  const copy = async (addr) => {
    try { await navigator.clipboard.writeText(`kaspa:${addr}`); setCopied(addr); setTimeout(() => setCopied(null), 1400); } catch {}
  };

  const onlineCount = collaborators.filter((c) => c.status !== "offline").length;

  return (
    <div className="kaspa-collab-landing kc-page relative min-h-screen overflow-hidden bg-background text-foreground">
      <BackToStore />
      <div className="relative mx-auto max-w-[1100px] px-5 sm:px-10">
        {/* Header */}
        <header className="relative z-30 flex min-h-[88px] items-center justify-between gap-5 pr-12 sm:pr-36">
          <button onClick={() => navigate("/KaspaCollab")} className="flex shrink-0 items-center gap-2.5 transition hover:opacity-80" title="Back to workspace">
            <KaspaMark size={25} />
            <span className="text-lg font-bold tracking-tight">Kaspa<span className="text-primary">Collab</span></span>
          </button>
          <div className="flex items-center gap-2">
            <div className="kc-glass flex items-center gap-2 rounded-full px-4 py-2 text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="font-mono text-muted-foreground">{address ? shortKaspaAddress(address) : "—"}</span>
            </div>
            <button onClick={() => navigate("/AppStoreV2")} className="kc-button" title="Exit to Store">
              <Home className="h-3.5 w-3.5" /> Exit to Store
            </button>
          </div>
        </header>

        <main className="relative z-10 pb-16">
          {/* Title band */}
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-accent">
                <Radio className="h-3 w-3" /> Live presence
              </p>
              <h1 className="kc-display text-[clamp(28px,3.6vw,44px)] leading-tight tracking-tight">
                Collaborators <span className="kc-outline">online now</span>
              </h1>
            </div>
            <span className="kc-glass rounded-full px-4 py-2 text-xs text-muted-foreground">
              {onlineCount} active
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : collaborators.length === 0 ? (
            <div className="kc-glass rounded-2xl p-10 text-center">
              <p className="text-sm font-medium">No collaborators visible yet</p>
              <p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-muted-foreground">
                Connect a wallet on KaspaCollab to broadcast your presence. Other connected collaborators will appear here in real time.
              </p>
              <button onClick={() => navigate("/KaspaCollab")} className="kc-button kc-button-primary mt-6">
                <ArrowLeft className="h-4 w-4" /> Back to workspace
              </button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {collaborators.map((c) => {
                const meta = STATUS_META[c.status];
                const isMe = c.wallet_address === address;
                return (
                  <div key={c.id} className="kc-glass rounded-2xl p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
                        <span className="text-sm font-bold text-primary">{(c.display_name || c.wallet_address).slice(0, 1).toUpperCase()}</span>
                      </div>
                      <span className={`flex items-center gap-1.5 text-[10px] ${meta.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot} ${c.status === "live" ? "animate-pulse" : ""}`} />
                        {meta.label}
                      </span>
                    </div>
                    <p className="truncate text-sm font-medium">
                      {c.display_name || "Anonymous"}
                      {isMe && <span className="ml-2 text-[9px] text-primary">YOU</span>}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="font-mono">{shortKaspaAddress(c.wallet_address)}</span>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <button onClick={() => copy(c.wallet_address)} className="kc-button flex-1" title="Copy address">
                        {copied === c.wallet_address ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied === c.wallet_address ? "Copied" : "Copy"}
                      </button>
                      {!isMe && (
                        <button
                          onClick={() => navigate(`/KaspaCollab?partner=${c.wallet_address}`)}
                          className="kc-button kc-button-primary"
                          title="Start a session"
                        >
                          <UserPlus className="h-3.5 w-3.5" /> Session
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}