import React, { useMemo, useState } from "react";
import { Wallet, Sparkles, RefreshCw, Copy, Check, ExternalLink } from "lucide-react";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { C } from "@/lib/evolve/constants";
import { ScorpionConnectionState as State } from "@/lib/evolve/scorpionAdapter";

/**
 * HumanDashboard — the player's own control surface.
 * Replaces the old ActorInspector popup for human actors.
 *
 * Shows:
 *  - Real Scorpion wallet balance + connection state
 *  - AI Agent Generator (mints a fresh Kaspa TN-10 wallet, adds an agent)
 *  - Roster of AI agents the player has generated, each with its real
 *    kaspatest: address as evidence of TN-10 connection
 */
export default function HumanDashboard({ onClose, onInspectAgent }) {
  const { engine, currentPlayer: player, wallet, generateAgent } = useEvolve();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState("");

  const myAgents = useMemo(() => {
    if (!engine || !player) return [];
    return engine.agents.filter(
      (a) => a.status !== "archived" && (a.owner_player_id === player.id || a.owner_user_id === player.user_id)
    );
  }, [engine, player, engine?.tickCount]);

  if (!engine || !player) return null;

  const handleGenerate = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await generateAgent({});
    } finally {
      setBusy(false);
    }
  };

  const copy = (addr) => {
    try {
      navigator.clipboard?.writeText(addr);
      setCopied(addr);
      setTimeout(() => setCopied(""), 1200);
    } catch {}
  };

  const walletConnected = wallet?.isTN10 && wallet?.address;
  const balSompi = wallet?.balance?.confirmed ?? 0n;
  const balanceLabel = walletConnected ? `${(Number(balSompi) / 1e8).toFixed(4)} KAS` : "—";

  return (
    <div className="ev-sheet ev-sheet-sm" style={{ top: 50, right: 12, width: 320, maxHeight: "78vh" }}>
      <div className="ev-panel-head">
        <span className="ev-panel-title">Human Dashboard</span>
        <span style={{ fontSize: 10, color: C.cyan, fontWeight: 700, marginLeft: 6 }}>{player.code}</span>
        <button className="ev-btn ev-btn-ghost" style={{ marginLeft: "auto", padding: "3px 8px" }} onClick={onClose}>CLOSE</button>
      </div>

      <div className="ev-panel-body ev-scroll">
        {/* --- Real Scorpion wallet --- */}
        <div className="ev-section">
          <div style={{ fontSize: 8, letterSpacing: "0.13em", color: C.textFaint, marginBottom: 6 }}>SCORPION WALLET</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Wallet className="h-4 w-4" style={{ color: walletConnected ? C.cyan : C.textFaint }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: walletConnected ? C.green : C.text, fontVariantNumeric: "tabular-nums" }}>
                {balanceLabel}
              </div>
              <div style={{ fontSize: 9, color: walletConnected ? C.cyan : C.textDim, wordBreak: "break-all" }}>
                {walletConnected ? wallet.address : "Not connected to TN-10"}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <span className={`ev-chip ${walletConnected ? "is-on" : ""}`} style={{ fontSize: 8 }}>
              {walletConnected ? "TN-10 LIVE" : "DISCONNECTED"}
            </span>
            <span style={{ fontSize: 9, color: C.textDim }}>{player.country || "World"}</span>
          </div>
          {!walletConnected && (
            <button
              className="ev-btn"
              style={{ width: "100%", marginTop: 8, padding: "8px 12px", justifyContent: "center", fontSize: 10 }}
              onClick={() => {
                if (wallet.isWrongNetwork) wallet.switchToTN10();
                else wallet.connect();
              }}
              disabled={wallet.busy}
            >
              {wallet.busy ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Wallet className="h-3.5 w-3.5" />}
              <span>{wallet.isWrongNetwork ? "SWITCH TO TN-10" : wallet.busy ? "CONNECTING…" : "CONNECT SCORPION"}</span>
            </button>
          )}
          {wallet.error && !walletConnected && (
            <div style={{ fontSize: 8.5, color: C.red, marginTop: 5, wordBreak: "break-word" }}>{wallet.error}</div>
          )}
        </div>

        {/* --- AI Agent Generator --- */}
        <div className="ev-section">
          <div style={{ fontSize: 8, letterSpacing: "0.13em", color: C.textFaint, marginBottom: 6 }}>AI AGENT GENERATOR</div>
          <div style={{ fontSize: 10, color: C.textDim, marginBottom: 8, lineHeight: 1.4 }}>
            Mints a fresh autonomous AI agent with its own Kaspa testnet wallet. The agent signs its own transactions and competes in the economy.
          </div>
          <button
            className="ev-btn"
            style={{ width: "100%", padding: "9px 12px", justifyContent: "center" }}
            onClick={handleGenerate}
            disabled={busy || !walletConnected}
            title={walletConnected ? "Generate a new AI agent on Kaspa TN-10" : "Connect Scorpion first"}
          >
            {busy ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            <span>{busy ? "MINTING…" : "GENERATE AI AGENT"}</span>
          </button>
          {!walletConnected && (
            <div style={{ fontSize: 8.5, color: C.red, marginTop: 5 }}>Connect Scorpion to generate agents.</div>
          )}
        </div>

        {/* --- My AI agents --- */}
        <div className="ev-section">
          <div style={{ fontSize: 8, letterSpacing: "0.13em", color: C.textFaint, marginBottom: 6 }}>
            MY AI AGENTS · {myAgents.length}
          </div>
          {myAgents.length === 0 ? (
            <div style={{ fontSize: 10, color: C.textFaint, fontStyle: "italic" }}>
              No agents yet. Generate one above to start your lineage on Kaspa TN-10.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {myAgents.map((a) => (
                <div
                  key={a.id}
                  style={{ border: "1px solid rgba(120,160,200,0.16)", borderRadius: 5, padding: 7, cursor: "pointer" }}
                  onClick={() => onInspectAgent?.(a.id)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{a.code}</span>
                    <span style={{ fontSize: 9, color: a.status === "working" ? C.cyan : C.textDim }}>{a.status}</span>
                  </div>
                  <div style={{ fontSize: 9, color: C.textDim, marginTop: 2 }}>{a.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                    <span className="ev-chip is-on" style={{ fontSize: 7.5, padding: "2px 5px" }}>kaspatest:</span>
                    <span style={{ fontSize: 8.5, color: C.textDim, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}>
                      {a.address}
                    </span>
                    <button
                      className="ev-btn ev-btn-ghost"
                      style={{ padding: "2px 5px", flex: "none" }}
                      onClick={(e) => { e.stopPropagation(); copy(a.address); }}
                      title="Copy address"
                    >
                      {copied === a.address ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 9 }}>
                    <span style={{ color: C.textFaint }}>BAL</span>
                    <span style={{ color: C.green, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{Number(a.balance || 0).toFixed(2)} tKAS</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- Player stats --- */}
        <div className="ev-section">
          <div style={{ fontSize: 8, letterSpacing: "0.13em", color: C.textFaint, marginBottom: 6 }}>PLAYER</div>
          <Row label="REPUTATION" value={player.reputation?.toFixed(0) || 50} />
          <Row label="JOBS COMPLETED" value={player.jobs_completed || 0} />
          <Row label="LIFETIME EARN" value={`${Number(player.lifetime_earnings || 0).toFixed(2)} tKAS`} color={C.green} />
          <Row label="POSITION" value={`${player.position?.x},${player.position?.y}`} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
      <span style={{ fontSize: 9, color: C.textFaint }}>{label}</span>
      <span style={{ fontSize: 11, color: color || C.text, fontWeight: 600 }}>{value}</span>
    </div>
  );
}