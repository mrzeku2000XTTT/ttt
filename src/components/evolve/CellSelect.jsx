import React, { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { countryGridBounds, randomCellInCountry, cellStats } from "@/lib/evolve/countryMap";
import { cellBox, loadLand50, loadCountries110, loadCountries50, loadStates50, toValidLngLat } from "@/lib/evolve/geoService";
import { BIOMES, C } from "@/lib/evolve/constants";
import {
  initialStyle,
  EVOLVE_COLORS,
  registerPmtilesProtocol,
  addLandLayer,
  addCountryBorders,
  addStateBorders,
} from "@/lib/evolve/evolveMapStyle";

/**
 * CellSelect — REAL EARTH map of the chosen region (MapLibre GL).
 * The map is fit to the selected country/place bounds. The user zooms into
 * real geography and clicks a buildable cell to spawn. No fake grid, no
 * CARTO, no API key.
 */
export default function CellSelect({ onClose }) {
  const { engine, selectedCountry, selectSpawnCell, selectedSpawnCell, spawnPlayer } = useEvolve();
  const wrapRef = useRef(null);
  const mapRef = useRef(null);
  const [hover, setHover] = useState(null);

  const bounds = useMemo(() => {
    if (!engine || !selectedCountry) return null;
    return countryGridBounds(engine.world, selectedCountry);
  }, [engine, selectedCountry]);

  useEffect(() => {
    if (!engine || !selectedCountry || !bounds || mapRef.current) return undefined;
    registerPmtilesProtocol();
    const world = engine.world;
    const rawCenter = [(selectedCountry.lng0 + selectedCountry.lng1) / 2, (selectedCountry.lat0 + selectedCountry.lat1) / 2];
    const center = toValidLngLat(rawCenter[0], rawCenter[1]) || [0, 20];
    const map = new maplibregl.Map({
      container: wrapRef.current,
      style: initialStyle(),
      center,
      zoom: 6,
      minZoom: 2,
      maxZoom: 11,
      attributionControl: false,
      antialias: true,
    });
    mapRef.current = map;
    map.on("load", async () => {
      const [land, c110] = await Promise.all([loadLand50(), loadCountries110()]);
      addLandLayer(map, land);
      addCountryBorders(map, c110, { id: "ev-countries-110", minzoom: 0, maxzoom: 4, color: EVOLVE_COLORS.borderStrong, width: 0.8 });
      loadCountries50().then((c50) => addCountryBorders(map, c50, { id: "ev-countries-50", minzoom: 4, color: EVOLVE_COLORS.border, width: 0.6 }));
      loadStates50().then((s50) => addStateBorders(map, s50, { minzoom: 5 }));
      map.addSource("ev-spawn-cells", { type: "geojson", data: { type: "FeatureCollection", features: [] }, maxzoom: 11 });
      map.addLayer({
        id: "ev-spawn-cells-fill",
        type: "fill",
        source: "ev-spawn-cells",
        paint: {
          "fill-color": ["coalesce", ["get", "color"], "#1a2a1a"],
          "fill-opacity": ["coalesce", ["get", "opacity"], 0.28],
        },
      });
      map.addLayer({
        id: "ev-spawn-cells-sel",
        type: "line",
        source: "ev-spawn-cells",
        filter: ["==", ["get", "sel"], 1],
        paint: { "line-color": EVOLVE_COLORS.cell, "line-width": 2 },
      });
      drawCells(map);
      map.fitBounds(
        [[selectedCountry.lng0, selectedCountry.lat0], [selectedCountry.lng1, selectedCountry.lat1]],
        { padding: 24 }
      );
    });
    map.on("click", (e) => {
      const { lat, lng } = e.lngLat;
      const x = Math.floor(((lng + 180) / 360) * world.width);
      const y = Math.floor(((90 - lat) / 180) * world.height);
      if (!world.inBounds(x, y) || !world.isBuildable(x, y)) return;
      selectSpawnCell({ x, y });
      setHover({ x, y });
    });
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, selectedCountry, bounds]);

  // redraw cells when selection changes
  useEffect(() => {
    const map = mapRef.current;
    if (map && map.getSource("ev-spawn-cells")) drawCells(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSpawnCell]);

  function drawCells(map) {
    if (!engine || !bounds) return;
    const world = engine.world;
    const total = (bounds.x1 - bounds.x0 + 1) * (bounds.y1 - bounds.y0 + 1);
    const maxCells = 3000;
    const feats = [];
    if (total <= maxCells) {
      for (let y = bounds.y0; y <= bounds.y1; y += 1) {
        for (let x = bounds.x0; x <= bounds.x1; x += 1) {
          if (!world.isBuildable(x, y)) continue;
          const isSel = selectedSpawnCell?.x === x && selectedSpawnCell?.y === y;
          const i = y * world.width + x;
          const biome = world.biome[i];
          const b = cellBox(x, y, world);
          feats.push({
            type: "Feature",
            properties: {
              color: isSel ? "#22d3ee" : BIOMES[biome] ? BIOMES[biome].color : "#1a2a1a",
              opacity: isSel ? 0.5 : 0.28,
              sel: isSel ? 1 : 0,
            },
            geometry: { type: "Polygon", coordinates: [[[b.west, b.south], [b.east, b.south], [b.east, b.north], [b.west, b.north], [b.west, b.south]]] },
          });
        }
      }
    }
    map.getSource("ev-spawn-cells").setData({ type: "FeatureCollection", features: feats });
  }

  const stats = useMemo(() => {
    if (!engine || !hover) return null;
    return cellStats(engine.world, engine.agents, engine.players, engine.world.assets, hover.x, hover.y);
  }, [engine, hover]);

  const pickRandom = () => {
    if (!engine || !selectedCountry) return;
    const cell = randomCellInCountry(engine.world, engine.rng, selectedCountry);
    selectSpawnCell(cell);
    setHover(cell);
    mapRef.current?.flyTo({ center: toValidLngLat(((cell.x + 0.5) / engine.world.width) * 360 - 180, 90 - ((cell.y + 0.5) / engine.world.height) * 180) || [0, 20], zoom: 9 });
  };

  const handleSpawn = async () => {
    if (!selectedSpawnCell) return;
    await spawnPlayer({ country: selectedCountry.name, position: selectedSpawnCell });
  };

  if (!engine || !selectedCountry || !bounds) return null;

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 37, display: "flex", background: "rgba(3,6,11,0.96)" }}>
      <div className="ev-panel" style={{ flex: 1, borderRight: `1px solid ${C.line}`, minWidth: 0 }}>
        <div className="ev-panel-head">
          <span className="ev-panel-title">{selectedCountry.name.toUpperCase()} · CELL SELECT</span>
          <button className="ev-btn ev-btn-ghost" style={{ marginLeft: "auto", padding: "4px 10px" }} onClick={onClose}>BACK</button>
        </div>
        <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
          <div ref={wrapRef} style={{ width: "100%", height: "100%", background: EVOLVE_COLORS.ocean }} />
        </div>
        <div style={{ padding: "8px 12px", borderTop: `1px solid ${C.line}`, display: "flex", gap: 8 }}>
          <button className="ev-btn ev-btn-ghost" onClick={pickRandom}>RANDOM CELL</button>
          <button className="ev-btn" disabled={!selectedSpawnCell} onClick={handleSpawn} style={{ marginLeft: "auto" }}>
            SPAWN HERE
          </button>
        </div>
      </div>

      <div style={{ width: 260, padding: 14, overflowY: "auto" }}>
        {stats ? (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>CELL {stats.label}</div>
            <div style={{ fontSize: 9, color: C.textFaint, marginBottom: 12 }}>{selectedCountry.name} · {stats.biome}</div>
            <Row label="AI" value={stats.independentAI + " ind."} />
            <Row label="HUMANS" value={stats.humans} />
            <Row label="ORGANIZATIONS" value={stats.organizations} />
            <Row label="OPEN JOBS" value={stats.openJobs} />
            <Row label="COMPUTE" value={stats.compute} />
            <Row label="ENERGY" value={stats.energy} />
            <Row label="CONTROL" value={stats.control} />
            <Row label="ECON. ACTIVITY" value={stats.economicActivity} />
            <Row label="BUILDABLE" value={stats.buildable ? "YES" : "NO"} color={stats.buildable ? C.green : C.red} />
          </>
        ) : (
          <div style={{ color: C.textFaint, fontSize: 11 }}>Click a buildable cell on the map to inspect.</div>
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