import React, { useState } from "react";
import LiveBalance from '@/components/evolve/LiveBalance';
import { ArrowLeftRight } from "lucide-react";
import PanelShell from "./PanelShell";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { priceOf } from "@/lib/evolve/economyService";
import { RESOURCES, fmt } from "@/lib/evolve/constants";

/** TradePanel — simulated resources bought and sold for test KAS. */
export default function TradePanel({ simId, onClose }) {
  const { engine, say, chainBalances } = useEvolve();
  const [agentId, setAgentId] = useState("");
  const [resource, setResource] = useState("compute");
  const [qty, setQty] = useState(10);
  const [direction, setDirection] = useState("buy");

  const asset = simId ? engine?.world.findAsset(simId) : null;
  const candidates = engine ? [...engine.agents.filter((a) => a.status !== "archived")].sort((a, b) => (chainBalances.balanceFor(b) ?? -1) - (chainBalances.balanceFor(a) ?? -1)) : [];
  const agent = engine?.agentById.get(agentId) || candidates[0];
  if (!agent) return null;

  const price = priceOf(engine.world, resource);
  const value = price * qty;

  return (
    <PanelShell
      title="Trade"
      subtitle={asset ? `at ${asset.sim_id}` : "world resource market"}
      onClose={onClose}
      width={330}
    >
      <div className="ev-section">
        <div className="ev-label" style={{ marginBottom: 4 }}>Agent</div>
        <select
          value={agent.id}
          onChange={(e) => setAgentId(e.target.value)}
          style={{ width: "100%", background: "#0b1220", border: "1px solid rgba(120,160,200,0.2)", borderRadius: 4, color: "#c9d6e4", fontSize: 10.5, padding: "6px" }}
        >
          {candidates.slice(0, 80).map((a) => (
            <option key={a.id} value={a.id}>{a.code} · {chainBalances.balanceFor(a) === undefined ? 'N/A' : `${chainBalances.balanceFor(a).toFixed(4)} tKAS`}</option>
          ))}
        </select>
        <div className="ev-row" style={{ marginTop: 6 }}>
          <span className="ev-label">Balance</span>
          <span className="ev-value" style={{ color: "#34d399" }}><LiveBalance actor={agent} unit /></span>
        </div>
      </div>

      <div className="ev-section">
        <div className="ev-label" style={{ marginBottom: 4 }}>Resource</div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {RESOURCES.map((r) => (
            <button key={r.id} className={`ev-chip ${resource === r.id ? "is-on" : ""}`} onClick={() => setResource(r.id)}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: r.color }} />
              {r.label}
            </button>
          ))}
        </div>
        <div className="ev-row" style={{ marginTop: 7 }}>
          <span className="ev-label">Pool</span>
          <span className="ev-value" style={{ fontSize: 10.5 }}>{(engine.world.resources[resource] || 0).toFixed(0)}</span>
        </div>
        <div className="ev-row">
          <span className="ev-label">Price</span>
          <span className="ev-value" style={{ fontSize: 10.5 }}>{price.toFixed(3)}</span>
        </div>
      </div>

      <div className="ev-section">
        <div className="ev-row" style={{ marginBottom: 4 }}>
          <span className="ev-label">Quantity</span>
          <span className="ev-value" style={{ fontSize: 10.5 }}>{qty}</span>
        </div>
        <input type="range" min="1" max="120" value={qty} onChange={(e) => setQty(Number(e.target.value))} style={{ width: "100%", accentColor: "#22d3ee" }} />
        <div className="ev-row" style={{ marginTop: 6 }}>
          <span className="ev-label">Value</span>
          <span className="ev-value" style={{ color: "#34d399", fontWeight: 700 }}>{fmt(value)} tKAS</span>
        </div>
      </div>

      <div className="ev-section" style={{ display: "flex", gap: 5 }}>
        <button
          className={`ev-btn ${direction === "buy" ? "" : "ev-btn-ghost"}`}
          style={{ flex: 1 }}
          onClick={() => setDirection("buy")}
        >
          Buy
        </button>
        <button
          className={`ev-btn ${direction === "sell" ? "" : "ev-btn-ghost"}`}
          style={{ flex: 1 }}
          onClick={() => setDirection("sell")}
        >
          Sell
        </button>
        <button
          className="ev-btn"
          style={{ flex: 1.2 }}
          onClick={() => {
            const r = engine.trade({ assetId: asset?.sim_id, resource, qty, direction, agentId: agent.id });
            say(r.message, r.ok);
          }}
        >
          <ArrowLeftRight className="h-3.5 w-3.5" /> Confirm
        </button>
      </div>
    </PanelShell>
  );
}