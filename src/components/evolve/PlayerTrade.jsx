import React, { useState } from "react";
import LiveBalance from '@/components/evolve/LiveBalance';
import { useEvolve } from "@/lib/evolve/useEvolve";
import { RESOURCES, C } from "@/lib/evolve/constants";
import { priceOf } from "@/lib/evolve/economyService";

/**
 * PlayerTrade — BUY / SELL / CREATE OFFER.
 * View nearby offers, global market, AI offers, human offers.
 * AI evaluates human offers through existing playerActions logic — no auto-accept.
 */
export default function PlayerTrade({ onClose }) {
  const { engine, currentPlayer, createTradeOffer, acceptTradeOffer } = useEvolve();
  const [tab, setTab] = useState("MARKET");
  const [resource, setResource] = useState("compute");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);

  if (!engine || !currentPlayer) return null;

  const marketPrice = priceOf(engine.world, resource);
  const offers = engine.tradeOffers.filter((o) => o.playerId !== currentPlayer.id);
  const myOffers = engine.tradeOffers.filter((o) => o.playerId === currentPlayer.id);

  const buy = () => {
    const res = engine.playerTrade(currentPlayer.id, { resource, qty, direction: "buy" });
    if (res?.ok) setQty(1);
  };
  const sell = () => {
    const res = engine.playerTrade(currentPlayer.id, { resource, qty, direction: "sell" });
  };
  const postOffer = () => {
    createTradeOffer({ resource, qty, direction: "sell", pricePerUnit: price || marketPrice });
  };

  return (
    <div className="ev-sheet" style={{ bottom: 56, left: 60, right: 12, maxHeight: "55vh" }}>
      <div className="ev-panel-head">
        <span className="ev-panel-title">TRADE</span>
        <div style={{ display: "flex", gap: 4, marginLeft: 12 }}>
          {["MARKET", "OFFERS", "CREATE"].map((t) => (
            <button key={t} className={tab === t ? "ev-chip is-on" : "ev-chip"} onClick={() => setTab(t)} style={{ border: "none", cursor: "pointer" }}>{t}</button>
          ))}
        </div>
        <button className="ev-btn ev-btn-ghost" style={{ marginLeft: "auto", padding: "3px 8px" }} onClick={onClose}>CLOSE</button>
      </div>
      <div className="ev-panel-body ev-scroll" style={{ padding: 12 }}>
        {tab === "MARKET" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <select className="ev-input" value={resource} onChange={(e) => setResource(e.target.value)} style={{ flex: 1 }}>
                {RESOURCES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
              <input className="ev-input" type="number" min="1" value={qty} onChange={(e) => setQty(Number(e.target.value))} style={{ width: 60 }} />
              <span style={{ fontSize: 10, color: C.textDim, alignSelf: "center" }}>@ {marketPrice.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="ev-btn" onClick={buy}>BUY</button>
              <button className="ev-btn ev-btn-ghost" onClick={sell}>SELL</button>
            </div>
            <div style={{ marginTop: 12, fontSize: 9, color: C.textFaint }}>BALANCE: <LiveBalance actor={currentPlayer} unit /> · {resource.toUpperCase()}: {currentPlayer.assets[resource]?.toFixed(0) || 0}</div>
          </div>
        )}
        {tab === "OFFERS" && (
          <div>
            {offers.length === 0 && myOffers.length === 0 && <div style={{ color: C.textFaint, fontSize: 11 }}>No active offers.</div>}
            {offers.map((o) => (
              <div key={o.id} style={{ padding: "7px 0", borderBottom: `1px solid ${C.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: 10, color: C.textDim }}>{o.playerCode}</span>
                  <span style={{ fontSize: 11, color: C.text, marginLeft: 8 }}>{o.direction === "sell" ? "SELL" : "BUY"} {o.qty} {o.resource}</span>
                  <span style={{ fontSize: 10, color: C.green, marginLeft: 8 }}>@ {o.pricePerUnit.toFixed(2)}</span>
                </div>
                <button className="ev-btn ev-btn-ghost" style={{ padding: "3px 8px" }} onClick={() => acceptTradeOffer(o.id)}>ACCEPT</button>
              </div>
            ))}
            {myOffers.length > 0 && <div style={{ marginTop: 8, fontSize: 8, color: C.textFaint, letterSpacing: "0.1em" }}>MY OFFERS</div>}
            {myOffers.map((o) => (
              <div key={o.id} style={{ padding: "5px 0", borderBottom: `1px solid ${C.line}`, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10, color: C.cyan }}>{o.direction === "sell" ? "SELL" : "BUY"} {o.qty} {o.resource}</span>
                <span style={{ fontSize: 10, color: C.textDim }}>@ {o.pricePerUnit.toFixed(2)} · pending</span>
              </div>
            ))}
          </div>
        )}
        {tab === "CREATE" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <select className="ev-input" value={resource} onChange={(e) => setResource(e.target.value)} style={{ flex: 1 }}>
                {RESOURCES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
              <input className="ev-input" type="number" min="1" placeholder="QTY" value={qty} onChange={(e) => setQty(Number(e.target.value))} style={{ width: 60 }} />
              <input className="ev-input" type="number" step="0.1" placeholder="PRICE" value={price} onChange={(e) => setPrice(Number(e.target.value))} style={{ width: 70 }} />
            </div>
            <div style={{ fontSize: 9, color: C.textFaint }}>Market price: {marketPrice.toFixed(2)} · AI buys if your price is below market.</div>
            <button className="ev-btn" onClick={postOffer} style={{ alignSelf: "flex-start" }}>POST SELL OFFER</button>
          </div>
        )}
      </div>
    </div>
  );
}