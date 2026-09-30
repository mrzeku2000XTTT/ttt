import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useEvolve } from "@/lib/evolve/useEvolve";

/**
 * TerritoryInspectorSection — the REAL territory dossier for one geographic
 * cell, read from the authoritative ownership layer and the settlement records.
 *
 * Every value shown is a stored fact: who controls the cell, how much territory
 * that controller holds, what infrastructure stands, which economic expansion
 * acquired it, where its settlement got to, how much tKAS moved and on which
 * transaction. No wallet secrets exist on these records, and none are surfaced.
 */
export default function TerritoryInspectorSection({ cellId }) {
  const { experimentId } = useEvolve();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

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
        const [cellCount, assets, claims] = await Promise.all([
          base44.entities.EvolveGeoOwnership.count({
            experiment_id: experimentId,
            owner_id: owner.owner_id,
          }),
          base44.entities.EvolveAsset.filter(
            { experiment_id: experimentId, owner_id: owner.owner_id },
            "-created_date",
            50
          ),
          base44.entities.EvolveTerritoryClaim.filter(
            { experiment_id: experimentId, target_cell_id: cellId },
            "-created_date",
            10
          ),
        ]);
        const claim =
          (claims || []).find((c) => c.id === owner.claim_id) ||
          (claims || []).find((c) => c.status === "OWNERSHIP_COMMITTED") ||
          null;
        if (!cancelled) setData({ owned: true, owner, cellCount, assets: assets || [], claim });
      } catch {
        // The dossier is supplementary — a read failure must not break the panel.
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
        <div className="ev-label" style={{ marginBottom: 5 }}>Territory</div>
        <Row label="Loading" value="…" />
      </div>
    );
  }

  if (!data) return null;

  if (!data.owned) {
    return (
      <div className="ev-section" style={{ padding: "8px 9px" }}>
        <div className="ev-label" style={{ marginBottom: 5 }}>Territory</div>
        <Row label="Controller" value="UNCLAIMED" />
      </div>
    );
  }

  const { owner, cellCount, assets, claim } = data;
  const infra = (assets || []).filter((a) =>
    ["energy", "compute", "server", "storage", "city", "deposit"].includes(a.kind)
  );
  const paid = owner.claim_amount_sompi ? (owner.claim_amount_sompi / 1e8).toFixed(4) : null;
  const txid = owner.claim_tx_id || claim?.tx_id || "";
  const settled = claim?.status || (owner.claim_source === "SPAWN" ? "SPAWN GRANT" : "—");

  return (
    <div className="ev-section" style={{ padding: "8px 9px" }}>
      <div className="ev-label" style={{ marginBottom: 5 }}>Territory</div>
      <Row label="Controller" value={owner.owner_code || owner.owner_id} />
      <Row label="Cells Held" value={cellCount} />
      <Row label="Infrastructure" value={infra.length ? `${infra.length} · ${[...new Set(infra.map((a) => a.kind))].join(", ")}` : "NONE"} />
      <Row label="Acquired By" value={owner.claim_source || "—"} />
      <Row label="Settlement" value={settled} />
      {paid ? <Row label="tKAS Paid" value={paid} /> : null}
      {txid ? (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "2.5px 0" }}>
          <span className="ev-label">Txid</span>
          <span className="ev-value" style={{ fontSize: 9, wordBreak: "break-all", textAlign: "right", maxWidth: 128 }}>
            {txid.slice(0, 10)}…{txid.slice(-6)}
          </span>
        </div>
      ) : null}
    </div>
  );
}

const Row = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "2.5px 0" }}>
    <span className="ev-label">{label}</span>
    <span className="ev-value" style={{ fontSize: 10.5, textAlign: "right" }}>{value}</span>
  </div>
);