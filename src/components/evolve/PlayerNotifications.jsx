import React from "react";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { C } from "@/lib/evolve/constants";

/**
 * PlayerNotifications — only relevant notifications for the player.
 * JOB_CLAIMED, JOB_COMPLETED, JOB_FAILED, PAYMENT, TRADE_OFFER,
 * TRADE_ACCEPTED, CONTRACT, ORG_INVITE, ASSET_COMPLETE, RESOURCE_SHORTAGE,
 * ASSET_DAMAGED. Does not send every global event.
 */
const RELEVANT = new Set([
  "JOB_POSTED", "JOB_CLAIMED", "JOB_COMPLETED", "JOB_FAILED",
  "TRADE_ACCEPTED", "TRADE_OFFER", "CONTRACT_COMPLETED", "CONTRACT_PROPOSED",
  "ORG_FORMED", "ORG_INVITE", "ASSET_BUILT", "ASSET_COMPLETE",
  "RESOURCE_SHORTAGE", "ASSET_DAMAGED", "INSOLVENT", "PAYMENT",
]);

const TYPE_COLOR = {
  JOB_COMPLETED: C.green, JOB_FAILED: C.red, TRADE_ACCEPTED: C.green,
  CONTRACT_COMPLETED: C.cyan, ORG_FORMED: C.purple, ASSET_BUILT: C.blue,
  INSOLVENT: C.red, PAYMENT: C.green,
};

export default function PlayerNotifications({ onClose }) {
  const { currentPlayer, engine } = useEvolve();
  if (!currentPlayer) return null;

  const notes = (currentPlayer.notifications || []).filter((n) => RELEVANT.has(n.type));

  const dismiss = (id) => {
    engine.playerDismissNotification?.(currentPlayer.id, id);
  };
  const markAll = () => {
    engine.playerMarkNotificationsRead?.(currentPlayer.id);
  };

  return (
    <div className="ev-sheet" style={{ top: 50, right: 12, width: 280, bottom: 64, maxHeight: "65vh" }}>
      <div className="ev-panel-head">
        <span className="ev-panel-title">NOTIFICATIONS</span>
        <button className="ev-btn ev-btn-ghost" style={{ marginLeft: "auto", padding: "3px 8px" }} onClick={markAll}>READ ALL</button>
        <button className="ev-btn ev-btn-ghost" style={{ padding: "3px 8px" }} onClick={onClose}>CLOSE</button>
      </div>
      <div className="ev-panel-body ev-scroll">
        {notes.length === 0 ? (
          <div style={{ padding: 16, color: C.textFaint, fontSize: 11 }}>No relevant notifications.</div>
        ) : (
          notes.map((n) => (
            <div key={n.id} style={{ padding: "7px 12px", borderBottom: `1px solid ${C.line}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, opacity: n.read ? 0.5 : 1 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 8, letterSpacing: "0.08em", color: TYPE_COLOR[n.type] || C.textDim, fontWeight: 700 }}>{n.type.replace(/_/g, " ")}</div>
                <div style={{ fontSize: 10, color: C.text, marginTop: 2 }}>{n.message}</div>
              </div>
              <button onClick={() => dismiss(n.id)} style={{ background: "none", border: "none", color: C.textFaint, cursor: "pointer", fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}