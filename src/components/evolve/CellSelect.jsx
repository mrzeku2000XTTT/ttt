import React, { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { cellStats } from "@/lib/evolve/countryMap";
import { toValidLngLat, loadLand50, loadCountries110, loadCountries50, loadStates50 } from "@/lib/evolve/geoService";
import { C } from "@/lib/evolve/constants";
import {
  initialStyle,
  EVOLVE_COLORS,
  registerPmtilesProtocol,
  addLandLayer,
  addCountryBorders,
  addStateBorders,
} from "@/lib/evolve/evolveMapStyle";
import {
  CELL_MIN_ZOOM,
  setLandIndex,
  cellsInViewport,
  geoCellToEnginePos,
  latLngToGeoCell,
  isLand,
} from "@/lib/evolve/geoCells";

/**
 * CellSelect — REAL EARTH spawn-cell picker.
 *
 * Flow: search/explore → select a place → fly there → zoom to the local area →
 * geographic cells appear (land only) → click ONE cell → SPAWN HERE.
 *
 * Cells are deterministic from lat/lng (geoCells), not the old simulation grid.
 * Water-only cells are never spawnable. At low zoom no local grid is shown
 * (LOD) — the user must zoom into a city before cells appear.
 */
export default function CellSelect({ onClose }) {
  const { engine, selectedCountry, selectSpawnCell, selectedSpawnCell, spawnPlayer } = useEvolve();
  const wrapRef = useRef(null);
  const mapRef = useRef(null);
  const [hover, setHover] = useState(null);
  const [tooFar, setTooFar] = useState(true);

  // The place center we fly to — the real geographic point the user picked.
  const placeCenter = useMemo(() => {
    const p = selectedCountry?._place;
    if (p && Number.isFinite(p.lat) && Number.isFinite(p.lng)) return [p.lng, p.lat];
    if (selectedCountry) return [(selectedCountry.lng0 + selectedCountry.lng1) / 2, (selectedCountry.lat0 + selectedCountry.lat1) / 2];
    return [0, 20];
  }, [selectedCountry]);

  useEffect(() => {
    if (!engine || !selectedCountry || mapRef.current) return undefined;
    registerPmtilesProtocol();
    const world = engine.world;
    const center = toValidLngLat(placeCenter[0], placeCenter[1]) || [0, 20];
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
      addCountryBorders(map, c110, { id: "ev-countries-110", minzoom: 0, maxzoom: 4, color: EVOLVE_COLORS.borderStrong, width: 0.8 });
      loadCountries50().then((c50) => addCountryBorders(map, c50, { id: "ev-countries-50", minzoom: 4, color: EVOLVE_COLORS.border, width: 0.6 }));
      loadStates50().then((s50) => addStateBorders(map, s50, { minzoom: 5 }));
      map.addSource("ev-spawn-cells", { type: "geojson", data: { type: "FeatureCollection", features: [] }, maxzoom: 13 });
      map.addLayer({
        id: "ev-spawn-cells-fill",
        type: "fill",
        source: "ev-spawn-cells",
        minzoom: CELL_MIN_ZOOM,
        paint: {
          "fill-color": ["coalesce", ["get", "color"], "#16323a"],
          "fill-opacity": ["coalesce", ["get", "opacity"], 0.3],
        },
      });
      map.addLayer({
        id: "ev-spawn-cells-sel",
        type: "line",
        source: "ev-spawn-cells",
        minzoom: CELL_MIN_ZOOM,
        filter: ["==", ["get", "sel"], 1],
        paint: { "line-color": EVOLVE_COLORS.cell, "line-width": 2 },
      });
      drawCells(map);
    });
    map.on("moveend", () => drawCells(map));
    map.on("zoomend", () => drawCells(map));
    map.on("click", (e) => {
      const { lat, lng } = e.lngLat;
      const cell = latLngToGeoCell(lat, lng);
      if (!isLand(cell.centerLat, cell.centerLng)) return; // ocean is not spawnable
      selectSpawnCell(cell);
      setHover(cell);
    });
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, selectedCountry]);

  // redraw when selection changes (highlight)
  useEffect(() => {
    const map = mapRef.current;
    if (map && map.getSource("ev-spawn-cells")) drawCells(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSpawnCell]);

  // Generate ONLY the geographic cells intersecting the viewport, land-only.
  function drawCells(map) {
    if (!engine) return;
    const z = map.getZoom();
    if (z < CELL_MIN_ZOOM) {
      setTooFar(true);
      map.getSource("ev-spawn-cells").setData({ type: "FeatureCollection", features: [] });
      return;
    }
    const cells = cellsInViewport(map.getBounds());
    setTooFar(cells.length === 0);
    const selId = selectedSpawnCell?.cellId;
    const feats = cells.map((c) => {
      const isSel = selId && c.cellId === selId;
      return {
        type: "Feature",
        properties: {
          color: isSel ? "#22d3ee" : "#16323a",
          opacity: isSel ? 0.5 : 0.28,
          sel: isSel ? 1 : 0,
        },
        geometry: { type: "Polygon", coordinates: [[[c.west, c.south], [c.east, c.south], [c.east, c.north], [c.west, c.north], [c.west, c.south]]] },
      };
    });
    map.getSource("ev-spawn-cells").setData({ type: "FeatureCollection", features: feats });
  }

  const stats = useMemo(() => {
    if (!engine || !hover) return null;
    const ep = geoCellToEnginePos(hover, engine.world);
    return cellStats(engine.world, engine.agents, engine.players, engine.world.assets, ep.x, ep.y);
  }, [engine, hover]);

  const pickRandom = () => {
    const map = mapRef.current;
    if (!map || !engine) return;
    const z = map.getZoom();
    // Zoom in if too far out, then pick a land cell in the viewport.
    if (z < CELL_MIN_ZOOM) {
      map.flyTo({ center: toValidLngLat(placeCenter[0], placeCenter[1]) || [0, 20], zoom: 12 });
      map.once("moveend", () => pickRandom());
      return;
    }
    const cells = cellsInViewport(map.getBounds());
    const land = cells.filter((c) => isLand(c.centerLat, c.centerLng));
    const pool = land.length ? land : cells;
    if (!pool.length) return;
    const cell = pool[Math.floor(Math.random() * pool.length)];
    selectSpawnCell(cell);
    setHover(cell);
    map.panTo([cell.centerLng, cell.centerLat]);
  };

  const handleSpawn = async () => {
    if (!selectedSpawnCell) return;
    await spawnPlayer({ country: selectedCountry?.name || selectedCountry?.iso || "Earth", position: selectedSpawnCell });
  };

  if (!engine || !selectedCountry) return null;

  const placeName = selectedCountry?._place?.name || selectedCountry.name;

  return (
    <div className="ev-stack-sm" style={{ position: "absolute", inset: 0, zIndex: 37, display: "flex", background: "rgba(3,6,11,0.96)" }}>
      <div className="ev-panel" style={{ flex: 1, borderRight: `1px solid ${C.line}`, minWidth: 0 }}>
        <div className="ev-panel-head">
          <span className="ev-panel-title">{placeName.toUpperCase()} · CELL SELECT</span>
          <button className="ev-btn ev-btn-ghost" style={{ marginLeft: "auto", padding: "4px 10px" }} onClick={onClose}>BACK</button>
        </div>
        <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
          <div ref={wrapRef} style={{ width: "100%", height: "100%", background: EVOLVE_COLORS.ocean }} />
          {tooFar && (
            <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", background: "rgba(3,6,11,0.85)", border: `1px solid ${C.line}`, borderRadius: 6, padding: "8px 14px", fontSize: 10, color: C.cyan, letterSpacing: "0.1em", pointerEvents: "none", textAlign: "center" }}>
              ZOOM INTO A CITY TO REVEAL LOCAL CELLS
            </div>
          )}
        </div>
        <div style={{ padding: "8px 12px", borderTop: `1px solid ${C.line}`, display: "flex", gap: 8 }}>
          <button className="ev-btn ev-btn-ghost" onClick={pickRandom}>RANDOM CELL</button>
          <button className="ev-btn" disabled={!selectedSpawnCell} onClick={handleSpawn} style={{ marginLeft: "auto" }}>
            SPAWN HERE
          </button>
        </div>
      </div>

      <div className="ev-side-sm" style={{ width: 260, padding: 14, overflowY: "auto" }}>
        {selectedSpawnCell ? (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2, wordBreak: "break-all" }}>
              {selectedSpawnCell.cellId}
            </div>
            <div style={{ fontSize: 9, color: C.textFaint, marginBottom: 12 }}>
              {selectedSpawnCell.centerLat.toFixed(4)}°, {selectedSpawnCell.centerLng.toFixed(4)}° · {placeName}
            </div>
            {stats && (
              <>
                <Row label="COUNTRY" value={stats.country} />
                <Row label="BIOME" value={stats.biome} />
                <Row label="AI" value={stats.independentAI + " ind."} />
                <Row label="HUMANS" value={stats.humans} />
                <Row label="ORGANIZATIONS" value={stats.organizations} />
                <Row label="OPEN JOBS" value={stats.openJobs} />
                <Row label="COMPUTE" value={stats.compute} />
                <Row label="ENERGY" value={stats.energy} />
                <Row label="ECON. ACTIVITY" value={stats.economicActivity} />
                <Row label="BUILDABLE" value="YES" color={C.green} />
              </>
            )}
          </>
        ) : (
          <div style={{ color: C.textFaint, fontSize: 11, lineHeight: 1.6 }}>
            Zoom into a city and click a land cell to inspect it. Ocean cells are not spawnable.
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${C.line}` }}>
      <span style={{ fontSize: 9, letterSpacing: "0.1em", color: C.textFaint }}>{label}</span>
      <span style={{ fontSize: 11, color: color || C.text, fontWeight: 600 }}>{value}</span>
    </div>
  );
}