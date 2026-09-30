import React, { useEffect, useState } from "react";
import { Store, Tag, Wallet, RefreshCw, ShieldCheck } from "lucide-react";
import PanelShell from "./PanelShell";
import { useEvolve } from "@/lib/evolve/useEvolve";
import useAgentMarket from "@/lib/evolve/useAgentMarket";
import useAgentOwnership from "@/lib/evolve/useAgentOwnership";
import { C, fmt } from "@/lib/evolve/constants";

/**
 * AgentMarketPanel — players sell the AI agents they own to each other for real
 * TN-10 tKAS.
 *
 * Only the recorded owner can list an agent, only the buyer's own payment is
 * accepted, and ownership moves server-side once the chain confirms it — so a
 * buyer cannot take an agent without paying and a seller cannot keep one that
 * was paid for.
 */
export default function AgentMarketPanel({ onClose }) {
  const { engine, experimentId, wallet, currentPlayer } = useEvolve();
  const { mine, loading: ownLoading } = useAgentOwnership(experimentId);
  const { info, step, error, busy, listAgent, cancelListing, buy, retryClaim } = useAgentMarket();

  const [payout, setPayout] = useState("");
  const [prices, setPrices] = useState({});

  // Buyers pay the seller directly, so the payout address is the seller's own.
  useEffect(() => {
    if (wallet?.address) setPayout((p) => p || wallet.address);
  }, [wallet?.address]);

  if (!engine) return null;

  const myAgents = engine.agents.filter((a) => mine.has(a.id) && a.status !== "archived");
  const listedIds = new Set((info?.mine || []).map((l) => l.agentId));
  const openListings = info?.listings || [];
  const myListings = info?.mine || [];
  const myPurchases = info?.buying || [];

  const list = (agent) => {
    const price = Number(prices[agent.id] || 0);
    listAgent(agent, price, payout.trim());
  };

  return (
    <PanelShell
      title="Agent Market"
      subtitle={`Player to player · settled in real TN-10 tKAS${info?.limits ? ` · ${info.limits.minKas}–${info.limits.maxKas} tKAS` : ""}`}
      onClose={onClose}
      width={330}
    >
      {step && (
        <div className="ev-section" style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <RefreshCw className="h-3.5 w-3.5 animate-spin" style={{ color: C.cyan }} />
          <span style={{ fontSize: 10, color: C.cyan }}>{step}</span>
        </div>
      )}
      {error && (
        <div className="ev-section">
          <div style={{ fontSize: 10, color: C.red, lineHeight: 1.5 }}>{error}</div>
        </div>
      )}

      {/* --- Sell one of mine --- */}
      <div className="ev-section">
        <div className="ev-label" style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
          <Tag className="h-3 w-3" /> MY AGENTS · FOR SALE
        </div>

        <div className="ev-label" style={{ marginBottom: 4 }}>Payout address (buyers pay this)</div>
        <input
          className="ev-input"
          style={{ width: "100%", fontSize: 11 }}
          value={payout}
          placeholder="kaspatest:…"
          onChange={(e) => setPayout(e.target.value)}
        />
        <div style={{ fontSize: 8.5, color: C.textFaint, marginTop: 4, lineHeight: 1.5 }}>
          {wallet?.address ? "Filled from your connected Scorpion wallet." : "Connect your wallet, or paste the TN-10 address you want to be paid at."}
        </div>

        {ownLoading ? (
          <div style={{ fontSize: 10, color: C.textFaint, marginTop: 8 }}>Checking what you own…</div>
        ) : myAgents.length === 0 ? (
          <div style={{ fontSize: 10, color: C.textFaint, fontStyle: "italic", marginTop: 8 }}>
            You own no agents with a TN-10 wallet yet. Birth one at the AI Factory first.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
            {myAgents.map((a) => (
              <div key={a.id} style={{ border: "1px solid rgba(120,160,200,0.16)", borderRadius: 5, padding: 7 }}>
                <div className="ev-row">
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{a.code}</span>
                  <span style={{ fontSize: 9, color: C.textDim }}>{a.name}</span>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <input
                    className="ev-input"
                    style={{ flex: 1, fontSize: 11 }}
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Price tKAS"
                    value={prices[a.id] ?? ""}
                    onChange={(e) => setPrices((p) => ({ ...p, [a.id]: e.target.value }))}
                  />
                  <button
                    className="ev-btn"
                    style={{ fontSize: 9, padding: "4px 10px" }}
                    disabled={busy || listedIds.has(a.id) || !Number(prices[a.id]) || !payout.trim()}
                    onClick={() => list(a)}
                  >
                    {listedIds.has(a.id) ? "LISTED" : "LIST"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- Buy someone else's --- */}
      <div className="ev-section">
        <div className="ev-label" style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
          <Store className="h-3 w-3" /> FOR SALE · {openListings.length}
        </div>
        {openListings.length === 0 ? (
          <div style={{ fontSize: 10, color: C.textFaint, fontStyle: "italic" }}>No agents listed right now.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {openListings.map((l) => (
              <div key={l.id} style={{ border: "1px solid rgba(120,160,200,0.16)", borderRadius: 5, padding: 7 }}>
                <div className="ev-row">
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{l.agentCode}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: C.green }}>{fmt(l.priceKas)} tKAS</span>
                </div>
                <div className="ev-row" style={{ marginTop: 3 }}>
                  <span style={{ fontSize: 9, color: C.textDim }}>{l.agentName || "AI agent"}</span>
                  <span style={{ fontSize: 9, color: C.textFaint }}>seller {l.sellerCode || "—"}</span>
                </div>
                <button
                  className="ev-btn"
                  style={{ width: "100%", marginTop: 6, justifyContent: "center", fontSize: 9, padding: "6px" }}
                  disabled={busy || !wallet?.isTN10}
                  onClick={() => buy(l)}
                >
                  <Wallet className="h-3 w-3" /> BUY FOR {fmt(l.priceKas)} tKAS
                </button>
              </div>
            ))}
          </div>
        )}
        {!wallet?.isTN10 && (
          <div style={{ fontSize: 8.5, color: C.textFaint, marginTop: 6 }}>Connect your Scorpion wallet to buy.</div>
        )}
      </div>

      {/* --- Purchases paid for but not yet verified --- */}
      {myPurchases.length > 0 && (
        <div className="ev-section">
          <div className="ev-label" style={{ marginBottom: 6 }}>AWAITING MY PAYMENT</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {myPurchases.map((l) => (
              <div key={l.id} style={{ border: "1px solid rgba(34,211,238,0.3)", borderRadius: 5, padding: 7 }}>
                <div className="ev-row">
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{l.agentCode}</span>
                  <span style={{ fontSize: 10, color: C.cyan }}>{fmt(l.priceKas)} tKAS</span>
                </div>
                <button
                  className="ev-btn ev-btn-ghost"
                  style={{ width: "100%", marginTop: 6, justifyContent: "center", fontSize: 9, padding: "6px" }}
                  disabled={busy}
                  onClick={() => retryClaim(l)}
                >
                  <RefreshCw className="h-3 w-3" /> RETRY VERIFICATION
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- My listings --- */}
      <div className="ev-section">
        <div className="ev-label" style={{ marginBottom: 6 }}>MY LISTINGS · {myListings.length}</div>
        {myListings.length === 0 ? (
          <div style={{ fontSize: 10, color: C.textFaint, fontStyle: "italic" }}>Nothing listed.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {myListings.map((l) => (
              <div key={l.id} style={{ border: "1px solid rgba(120,160,200,0.16)", borderRadius: 5, padding: 7 }}>
                <div className="ev-row">
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{l.agentCode}</span>
                  <span style={{ fontSize: 10, color: l.status === "OPEN" ? C.green : C.cyan }}>{l.status}</span>
                </div>
                <div className="ev-row" style={{ marginTop: 3 }}>
                  <span style={{ fontSize: 9, color: C.textDim }}>asking</span>
                  <span style={{ fontSize: 10, color: C.text }}>{fmt(l.priceKas)} tKAS</span>
                </div>
                {l.status === "OPEN" ? (
                  <button
                    className="ev-btn ev-btn-ghost"
                    style={{ width: "100%", marginTop: 6, justifyContent: "center", fontSize: 9, padding: "6px" }}
                    disabled={busy}
                    onClick={() => cancelListing(l.id)}
                  >
                    WITHDRAW
                  </button>
                ) : (
                  <div style={{ fontSize: 8.5, color: C.textFaint, marginTop: 5, lineHeight: 1.5 }}>
                    A buyer has reserved this agent and is paying. It cannot be withdrawn now.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="ev-section">
        <div className="ev-label" style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
          <ShieldCheck className="h-3 w-3" /> HOW THIS STAYS SAFE
        </div>
        <div style={{ fontSize: 9, color: C.textDim, lineHeight: 1.6 }}>
          Only the recorded owner of an agent can list it. A listing locks to one buyer the moment they
          reserve, so it cannot be sold twice. The buyer pays the seller's own TN-10 address, and the
          agent changes hands only after the chain confirms that exact payment — one payment buys one agent.
        </div>
      </div>

      {currentPlayer ? (
        <div className="ev-section">
          <div className="ev-row">
            <span className="ev-label">Buying as</span>
            <span className="ev-value" style={{ fontSize: 10 }}>{currentPlayer.code}</span>
          </div>
        </div>
      ) : null}
    </PanelShell>
  );
}