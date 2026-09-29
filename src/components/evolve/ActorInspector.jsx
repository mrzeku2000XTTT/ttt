import React from "react";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { C, orgColor } from "@/lib/evolve/constants";

/**
 * ActorInspector — supports both AI and HUMAN actors.
 * AI: ID, generation, lineage, org, balance, specialization, reputation, activity, assets, history.
 * HUMAN: username/ID, org, reputation, activity, assets, history.
 * Actions: OFFER JOB, TRADE, PROPOSE COOPERATION, VIEW LINEAGE, FOLLOW (AI)
 *          TRADE, CONTRACT, COOPERATE, ORG INVITE, FOLLOW (HUMAN)
 * Never exposes private user information.
 */
export default function ActorInspector({ actorId, actorType, onClose, onAction }) {
  const { engine } = useEvolve();
  if (!engine) return null;

  const actor = actorType === "agent"
    ? engine.agentById.get(actorId)
    : engine.playerById.get(actorId);
  if (!actor) return null;

  const org = engine.orgs.find((o) => o.id === actor.organization_id);
  const isAI = actorType === "agent";
  const orgClr = org ? orgColor(org.id) : C.textFaint;

  return (
    <div className="ev-sheet" style={{ top: 50, right: 12, width: 280, maxHeight: "75vh" }}>
      <div className="ev-panel-head">
        <span className="ev-panel-title">{isAI ? "AI AGENT" : "HUMAN PLAYER"}</span>
        <button className="ev-btn ev-btn-ghost" style={{ marginLeft: "auto", padding: "3px 8px" }} onClick={onClose}>CLOSE</button>
      </div>
      <div className="ev-panel-body ev-scroll">
        <div className="ev-section">
          <div style={{ fontSize: 14, fontWeight: 800, color: isAI ? C.cyan : C.text }}>{actor.code}</div>
          <div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>{actor.name || (isAI ? "AI Agent" : "Human Player")}</div>
          {org && <div style={{ fontSize: 9, color: orgClr, marginTop: 4 }}>● {org.name}</div>}
        </div>
        <div className="ev-section">
          <Row label="BALANCE" value={`${actor.balance?.toFixed(2) || 0} tKAS`} color={C.green} />
          <Row label="REPUTATION" value={actor.reputation?.toFixed(0) || 50} />
          <Row label="STATUS" value={actor.status?.toUpperCase() || "IDLE"} />
          {isAI && <Row label="GENERATION" value={actor.generation || 0} />}
          {isAI && <Row label="FITNESS" value={actor.fitness?.toFixed(1) || 0} />}
          {isAI && actor.lineage_root && <Row label="LINEAGE" value={actor.lineage_root} />}
          <Row label="POSITION" value={`${actor.position?.x},${actor.position?.y}`} />
        </div>
        <div className="ev-section">
          <div style={{ fontSize: 8, letterSpacing: "0.12em", color: C.textFaint, marginBottom: 6 }}>ASSETS</div>
          {["compute", "energy", "storage", "information"].map((r) => (
            <Row key={r} label={r.toUpperCase()} value={actor.assets?.[r]?.toFixed(0) || 0} />
          ))}
        </div>
        <div className="ev-section">
          <div style={{ fontSize: 8, letterSpacing: "0.12em", color: C.textFaint, marginBottom: 6 }}>ECONOMIC HISTORY</div>
          <Row label="LIFETIME EARN" value={`${actor.lifetime_earnings?.toFixed(2) || 0} tKAS`} color={C.green} />
          <Row label="LIFETIME SPEND" value={`${actor.lifetime_expenses?.toFixed(2) || 0} tKAS`} color={C.red} />
          {isAI && <Row label="REPRODUCTIONS" value={actor.reproductions || 0} />}
          {!isAI && <Row label="JOBS DONE" value={actor.jobs_completed || 0} />}
        </div>
        <div className="ev-section">
          <div style={{ fontSize: 8, letterSpacing: "0.12em", color: C.textFaint, marginBottom: 6 }}>ACTIONS</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {isAI ? (
              <>
                <ActBtn label="OFFER JOB" onClick={() => onAction?.("OFFER_JOB", actor)} />
                <ActBtn label="TRADE" onClick={() => onAction?.("TRADE", actor)} />
                <ActBtn label="COOPERATE" onClick={() => onAction?.("COOPERATE", actor)} />
                <ActBtn label="LINEAGE" onClick={() => onAction?.("LINEAGE", actor)} />
                <ActBtn label="FOLLOW" onClick={() => onAction?.("FOLLOW", actor)} />
              </>
            ) : (
              <>
                <ActBtn label="TRADE" onClick={() => onAction?.("TRADE", actor)} />
                <ActBtn label="CONTRACT" onClick={() => onAction?.("CONTRACT", actor)} />
                <ActBtn label="COOPERATE" onClick={() => onAction?.("COOPERATE", actor)} />
                <ActBtn label="ORG INVITE" onClick={() => onAction?.("ORG_INVITE", actor)} />
                <ActBtn label="FOLLOW" onClick={() => onAction?.("FOLLOW", actor)} />
              </>
            )}
          </div>
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

function ActBtn({ label, onClick }) {
  return <button className="ev-btn ev-btn-ghost" style={{ padding: "4px 8px", fontSize: 9 }} onClick={onClick}>{label}</button>;
}