import React, { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { C } from "@/lib/evolve/constants";
import { loadLand50, loadCountries110, loadCountries50, gridToLatLng, toValidLngLat } from "@/lib/evolve/geoService";
import { initialStyle, EVOLVE_COLORS, registerPmtilesProtocol, addLandLayer, addCountryBorders } from "@/lib/evolve/evolveMapStyle";
import {
  CELL_MIN_ZOOM,
  setLandIndex,
  cellsInViewport,
  geoCellToEnginePos,
  latLngToGeoCell,
  isLand,
} from "@/lib/evolve/geoCells";

const HERE_COLOR = "#22d3ee";
const DEST_COLOR = "#34d399";

/**
 * PlayerMove — pick a destination on the REAL Earth map.
 *
 * The map opens centred on the cell the player is standing in right now (its
 * geographic cell is derived from the player's own engine position, so the
 * cyan marker is always the true current cell). Zoom in to reveal cells, click
 * a land cell to set the destination. Ocean cells are never valid.
 */
export default function PlayerMove({ onClose, onMoved }) {
  const { engine, currentPlayer, movePlayer } = useEvolve();
  const [dest, setDest] = useState(null);
  const wrapRef = useRef(null);
  const mapRef = useRef(null);

  const world = engine?.world;
  const p = currentPlayer;

  /* the player's real current geographic cell */
  const here = useMemo(() => {
    if (!world || !p?.position) return null;
    const ll = gridToLatLng(p.position.x + 0.5, p.position.y + 0.5, world.width, world.height);
    return latLngToGeoCell(ll.lat, ll.lng);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world, p?.position?.x, p?.position?.y]);

  /* build the map once, centred on the player's current cell */
  useEffect(() => {
    if (!world || !here || !wrapRef.current || mapRef.current) return undefined;
    registerPmtilesProtocol();
    const center = toValidLngLat(here.centerLng, here.centerLat) || [0, 20];
    const map = new maplibregl.Map({
      container: wrapRef.current,
      style: initialStyle(),
      center,
      zoom: 11, // city level — local cells appear here
      minZoom: 2,
      maxZoom: 13,
      attributionControl: false,
      antialias: true,
    });
    mapRef.current = map;

    map.on("load", async () => {
      const [land, c110] = await Promise.all([loadLand50(), loadCountries110()]);
      addLandLayer(map, land);
      setLandIndex(land);
      addCountryBorders(map, c110, { id: "ev-move-countries-110", minzoom: 0, maxzoom: 4, color: EVOLVE_COLORS.borderStrong, width: 0.8 });
      loadCountries50().then((c50) => addCountryBorders(map, c50, { id: "ev-move-countries-50", minzoom: 4, color: EVOLVE_COLORS.border, width: 0.6 }));
      map.addSource("ev-move-cells", { type: "geojson", data: { type: "FeatureCollection", features: [] }, maxzoom: 13 });
      map.addLayer({
        id: "ev-move-cells-fill",
        type: "fill",
        source: "ev-move-cells",
        minzoom: CELL_MIN_ZOOM,
        paint: { "fill-color": ["coalesce", ["get", "color"], "#16323a"], "fill-opacity": ["coalesce", ["get", "opacity"], 0.25] },
      });
      map.addLayer({
        id: "ev-move-cells-sel",
        type: "line",
        source: "ev-move-cells",
        minzoom: CELL_MIN_ZOOM,
        filter: ["==", ["get", "sel"], 1],
        paint: { "line-color": EVOLVE_COLORS.cell, "line-width": 2 },
      });
      drawCells(map);
    });

    map.on("moveend", () => drawCells(map));
    map.on("zoomend", () => drawCells(map));
    map.on("click", (e) => {
      const cell = latLngToGeoCell(e.lngLat.lat, e.lngLat.lng);
      if (!isLand(cell.centerLat, cell.centerLng)) return; // ocean is never a destination
      setDest(cell);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world, here?.cellId]);

  /* repaint the highlight when the destination changes */
  useEffect(() => {
    const map = mapRef.current;
    if (map && map.getSource("ev-move-cells")) drawCells(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dest, here?.cellId]);

  function drawCells(map) {
    if (!world || !map.getSource("ev-move-cells")) return;
    if (map.getZoom() < CELL_MIN_ZOOM) {
      map.getSource("ev-move-cells").setData({ type: "FeatureCollection", features: [] });
      return;
    }
    const feats = cellsInViewport(map.getBounds()).map((c) => {
      const isHere = here && c.cellId === here.cellId;
      const isDest = dest && c.cellId === dest.cellId;
      return {
        type: "Feature",
        properties: {
          color: isHere ? HERE_COLOR : isDest ? DEST_COLOR : "#16323a",
          opacity: isHere || isDest ? 0.55 : 0.22,
          sel: isDest ? 1 : 0,
        },
        geometry: {
          type: "Polygon",
          coordinates: [[[c.west, c.south], [c.east, c.south], [c.east, c.north], [c.west, c.north], [c.west, c.south]]],
        },
      };
    });
    map.getSource("ev-move-cells").setData({ type: "FeatureCollection", features: feats });
  }

  if (!engine || !currentPlayer) return null;

  const destEp = dest ? geoCellToEnginePos(dest, world) : null;
  const dist = destEp ? Math.abs(p.position.x - destEp.x) + Math.abs(p.position.y - destEp.y) : 0;
  const energyCost = dist * 0.05;
  const kasCost = energyCost * 0.5;
  const canMove = Boolean(dest && dist > 0 && p.assets.energy >= energyCost && world.isBuildable(destEp.x, destEp.y));

  const handleMove = () => {
    if (!destEp) return;
    const res = movePlayer(destEp.x, destEp.y);
    if (res?.ok) {
      setDest(null);
      onMoved?.();
    }
  };

  return (
    <div className="ev-sheet ev-sheet-sm" style={{ bottom: 56, left: 60, right: 12, height: "60vh" }}>
      <div className="ev-panel-head">
        <span className="ev-panel-title">Move · Current {here ? here.cellId : "—"}</span>
        <button className="ev-btn ev-btn-ghost" style={{ marginLeft: "auto", padding: "3px 8px" }} onClick={onClose}>Close</button>
      </div>

      <div className="ev-panel-body ev-scroll ev-stack-sm" style={{ display: "flex" }}>
        <div style={{ flex: 1, minWidth: 0, position: "relative", minHeight: 240 }}>
          <div ref={wrapRef} style={{ position: "absolute", inset: 0, background: EVOLVE_COLORS.ocean }} />
          <div
            style={{
              position: "absolute", top: 8, left: 8, pointerEvents: "none",
              background: "rgba(3,6,11,0.85)", border: `1px solid ${C.line}`,
              borderRadius: 6, padding: "5px 9px", fontSize: 9, letterSpacing: "0.08em", color: C.textDim,
            }}
          >
            <span style={{ color: HERE_COLOR, fontWeight: 700 }}>■</span> your cell ·{" "}
            <span style={{ color: DEST_COLOR, fontWeight: 700 }}>■</span> destination
          </div>
        </div>

        <div className="ev-side-sm" style={{ width: 210, padding: 12, borderLeft: `1px solid ${C.line}` }}>
          {dest ? (
            <>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: C.text, marginBottom: 2, wordBreak: "break-all" }}>{dest.cellId}</div>
              <div style={{ fontSize: 8.5, color: C.textFaint, marginBottom: 10 }}>
                {dest.centerLat.toFixed(3)}°, {dest.centerLng.toFixed(3)}°
              </div>
              <Row label="Distance" value={`${dist} cells`} />
              <Row label="Energy cost" value={energyCost.toFixed(2)} color={p.assets.energy >= energyCost ? C.green : C.red} />
              <Row label="tKAS cost" value={kasCost.toFixed(2)} />
              <button className="ev-btn" disabled={!canMove} onClick={handleMove} style={{ marginTop: 12, width: "100%" }}>
                Move
              </button>
            </>
          ) : (
            <div style={{ color: C.textFaint, fontSize: 10.5, lineHeight: 1.6 }}>
              Click a land cell on the map to set your destination. Ocean cells are not reachable.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, color }) {
  return (
    <div className="ev-row" style={{ padding: "4px 0", borderBottom: `1px solid ${C.line}` }}>
      <span className="ev-label">{label}</span>
      <span className="ev-value" style={{ fontSize: 10.5, fontWeight: 600, color: color || C.text }}>{value}</span>
    </div>
  );
}