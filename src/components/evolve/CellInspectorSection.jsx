import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { getCellHistory } from "@/lib/evolve/geoTerritoryService";
import { getControllerColor } from "@/lib/evolve/controllerColor";
import { cellResourcePotential, potentialWord } from "@/lib/evolve/cellPotential";

/**
 * CellInspectorSection — the full answer to "WHY does this actor control this
 * cell?" for one geographic cell.
 *
 * A cell is EVOLVE WORLD STATE. A Kaspa TN-10 transaction is the SETTLEMENT
 * EVIDENCE that caused an ownership event. Kaspa does not know the transaction
 * means land — EVOLVE interprets the verified transaction under its own rules.
 * The panel keeps that distinction explicit.
 *
 * Everything shown is stored fact. No wallet secrets exist on these records and
 * none are surfaced.
 */
export default function CellInspectorSection({ cellId, onViewAgent }) {
  const { experimentId, engine } = useEvolve();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!cellId || !experimentId) {
      setData(null);
      return undefined;
    }
    setLoading(true);
    (async () => {
      try {
        const [owner] = await base44.entities.EvolveGeoOwnership.filter(
          { experiment_id: experimentId, cell_id: cellId },
          "-claimed_at",
          1
        );
        if (!owner) {
          if (!cancelled) setData({ owned: false });
          return;
        }
        const [assets, history] = await Promise.all([
          base44.entities.EvolveAsset.filter(
            { experiment_id: experimentId, owner_id: owner.owner_id },
            "-created_date",
            50
          ),
          getCellHistory({ experimentId, cellId }),
        ]);
        if (!cancelled) {
          setData({ owned: true, owner, assets: assets || [], events: history?.events || [] });
        }
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cellId, experimentId]);

  if (loading) {
    return (
      <div className="ev-section" style={{ padding: "8px 9px" }}>
        <div className="ev-label" style={{ marginBottom: 5 }}>Cell</div>
        <Row label="Loading" value="…" />
      </div>
    );
  }

  if (!data) return null;

  const potential = cellResourcePotential(cellId);

  if (!data.owned) {
    return (
      <div className="ev-section" style={{ padding: "8px 9px" }}>
        <div className="ev-label" style={{ marginBottom: 5 }}>Controller</div>
        <Row label="Status" value="UNCLAIMED — neutral" />
        <div className="ev-label" style={{ marginBottom: 5, marginTop: 7 }}>Resource Potential</div>
        {potential ? (
          <>
            <Row label="Energy" value={potentialWord(potential.energy)} />
            <Row label="Compute" value={potentialWord(potential.compute)} />
            <Row label="Materials" value={potentialWord(potential.wood)} />
            <Row label="Buildable" value={potential.buildable ? "YES" : "NO"} />
          </>
        ) : null}
      </div>
    );
  }

  const { owner, assets, events } = data;
  const color = getControllerColor(owner.organization_id || owner.owner_id);
  const isEconomic = owner.claim_source === "ECONOMIC_EXPANSION";
  const currentEvent = events.find((e) => e.id === owner.current_ownership_event_id) || events[events.length - 1] || null;
  const infra = (assets || []).filter((a) =>
    ["energy", "compute", "server", "storage", "city", "deposit"].includes(a.kind)
  );
  const txid = owner.claim_tx_id || currentEvent?.settlement_tx_id || "";
  const amount = Number(owner.claim_amount_sompi || currentEvent?.settlement_amount_sompi || 0);
  const agent = engine?.agentById?.get(owner.owner_id);
  const level = currentEvent?.verification_level || (isEconomic ? "RECIPIENT_AMOUNT_VERIFIED" : "NOT_REQUIRED");
  const levelLabel =
    level === "FULL_SETTLEMENT_VERIFIED"
      ? "FULLY VERIFIED"
      : level === "RECIPIENT_AMOUNT_VERIFIED"
        ? "RECIPIENT + AMOUNT VERIFIED"
        : level === "NOT_REQUIRED"
          ? "NOT REQUIRED (SPAWN)"
          : level.replace(/_/g, " ");

  const copyTx = () => {
    if (!txid) return;
    navigator.clipboard?.writeText(txid).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  };

  return (
    <>
      {/* ---------------- controller identity: whose land is this? ------- */}
      <div className="ev-section" style={{ padding: "8px 9px" }}>
        <div className="ev-label" style={{ marginBottom: 5 }}>Controlled By</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: color, boxShadow: `0 0 7px ${color}`, flex: "0 0 auto" }} />
          <span style={{ fontSize: 12, fontWeight: 800, color: "#eef3f9" }}>{owner.owner_code || owner.owner_id}</span>
        </div>
        {agent?.name ? <div style={{ fontSize: 9.5, color: "#7d90a8", marginTop: 2 }}>{agent.name}</div> : null}
        <div style={{ fontSize: 8.5, color: "#54657c", marginTop: 3, letterSpacing: "0.08em" }}>
          {owner.owner_type === "AI" ? "AUTONOMOUS AI" : owner.owner_type}
          {owner.organization_id ? " · ORGANIZATION" : " · INDEPENDENT"}
        </div>
        {onViewAgent ? (
          <button
            className="ev-btn ev-btn-ghost"
            style={{ marginTop: 7, width: "100%", padding: "5px", fontSize: 9 }}
            onClick={() => onViewAgent(owner.owner_id, owner.owner_type)}
          >
            VIEW AGENT · HIGHLIGHT ALL ITS LAND
          </button>
        ) : null}
      </div>

      {/* ---------------- cell facts ------------------------------------ */}
      <div className="ev-section" style={{ padding: "8px 9px" }}>
        <div className="ev-label" style={{ marginBottom: 5 }}>Cell</div>
        <Row label="Cell" value={cellId} />
        <Row label="Status" value={infra.length ? "CONTROLLED · DEVELOPED" : "CONTROLLED"} />
        <Row label="Acquired" value={isEconomic ? "Economic Expansion" : "Spawn"} />
        <Row label="Controlled Since" value={owner.claimed_at ? new Date(owner.claimed_at).toLocaleString() : "—"} />
      </div>

      {/* ---------------- deterministic potential ------------------------ */}
      <div className="ev-section" style={{ padding: "8px 9px" }}>
        <div className="ev-label" style={{ marginBottom: 5 }}>Resource Potential</div>
        {potential ? (
          <>
            <Row label="Energy" value={potentialWord(potential.energy)} />
            <Row label="Compute" value={potentialWord(potential.compute)} />
            <Row label="Materials" value={potentialWord(potential.wood)} />
            <Row label="Buildable" value={potential.buildable ? "YES" : "NO"} />
          </>
        ) : (
          <Row label="—" value="—" />
        )}
      </div>

      {/* ---------------- real infrastructure only ----------------------- */}
      {infra.length ? (
        <div className="ev-section" style={{ padding: "8px 9px" }}>
          <div className="ev-label" style={{ marginBottom: 5 }}>Infrastructure</div>
          {infra.map((a) => (
            <Row key={a.sim_id} label={a.kind.toUpperCase()} value={`Output ${a.output ?? "—"}`} />
          ))}
        </div>
      ) : null}

      {/* ---------------- settlement proof ------------------------------- */}
      {isEconomic ? (
        <div className="ev-section" style={{ padding: "8px 9px" }}>
          <div className="ev-label" style={{ marginBottom: 5 }}>Settlement Proof</div>
          <Row label="Status" value={levelLabel} color={level === "FULL_SETTLEMENT_VERIFIED" ? "#34d399" : "#fbbf24"} />
          <Row label="Sender" value={currentEvent?.settlement_sender_address ? short(currentEvent.settlement_sender_address) : "—"} />
          <Row label="Recipient" value="EVOLVE Territory Treasury" />
          <Row label="Amount" value={`${(amount / 1e8).toFixed(4)} tKAS`} />
          {txid ? (
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "2.5px 0" }}>
              <span className="ev-label">Kaspa TX</span>
              <button
                onClick={copyTx}
                title="Copy txid"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "right", maxWidth: 150 }}
              >
                <span className="ev-value" style={{ fontSize: 9, wordBreak: "break-all", color: "#22d3ee" }}>
                  {short(txid, 10, 6)} {copied ? "· COPIED" : "· COPY"}
                </span>
              </button>
            </div>
          ) : null}
          <Row
            label="Verified"
            value={currentEvent?.verification_timestamp ? new Date(currentEvent.verification_timestamp).toLocaleString() : "—"}
          />
          <Row label="Evidence" value={(currentEvent?.evidence_source || "—").replace(/_/g, " ")} />
          {!currentEvent?.sender_verified ? (
            <div style={{ fontSize: 8.5, color: "#7d90a8", marginTop: 5, lineHeight: 1.5 }}>
              Sender inputs are not published by the TN-10 node, so the sender is not claimed as
              verified. Recipient and amount are proven directly from the chain.
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ---------------- ownership history ------------------------------ */}
      <div className="ev-section" style={{ padding: "8px 9px" }}>
        <div className="ev-label" style={{ marginBottom: 6 }}>Ownership History</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 0" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#54657c", flex: "0 0 auto" }} />
          <span style={{ fontSize: 9.5, color: "#7d90a8" }}>GENESIS · Neutral</span>
        </div>
        {(events.length ? events : []).map((e) => (
          <div key={e.id} style={{ paddingLeft: 3 }}>
            <div style={{ fontSize: 9, color: "#54657c", lineHeight: 1 }}>↓</div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 6, padding: "2px 0" }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: getControllerColor(e.controller_id || e.new_owner_id),
                  flex: "0 0 auto",
                  marginTop: 3,
                }}
              />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 9.5, color: "#eef3f9", fontWeight: 600 }}>
                  {e.event_type.replace(/_/g, " ")} · {e.new_owner_code || e.new_owner_id}
                </span>
                <span style={{ display: "block", fontSize: 8, color: "#7d90a8" }}>
                  {e.settlement_amount_sompi
                    ? `${(Number(e.settlement_amount_sompi) / 1e8).toFixed(4)} tKAS`
                    : "No settlement required"}
                  {e.settlement_tx_id ? ` · TX ${short(e.settlement_tx_id, 8, 5)}` : ""}
                </span>
                <span style={{ display: "block", fontSize: 8, color: e.sender_verified || e.recipient_verified ? "#34d399" : "#7d90a8" }}>
                  {e.verification_level === "NOT_REQUIRED" ? "SPAWN" : (e.verification_level || "").replace(/_/g, " ")}
                </span>
                <span style={{ display: "block", fontSize: 7.5, color: "#54657c" }}>
                  {e.created_at ? new Date(e.created_at).toLocaleString() : ""}
                </span>
              </span>
            </div>
          </div>
        ))}
        {!events.length ? (
          <div style={{ fontSize: 8.5, color: "#54657c", marginTop: 5 }}>
            No provenance event recorded yet.
          </div>
        ) : null}
      </div>
    </>
  );
}

const short = (s, head = 8, tail = 6) => {
  const v = String(s || "");
  if (v.length <= head + tail + 2) return v;
  return `${v.slice(0, head)}…${v.slice(-tail)}`;
};

const Row = ({ label, value, color }) => (
  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "2.5px 0" }}>
    <span className="ev-label">{label}</span>
    <span className="ev-value" style={{ fontSize: 10.5, textAlign: "right", color: color || undefined }}>
      {value}
    </span>
  </div>
);