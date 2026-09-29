import React, { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { ZoomIn, ZoomOut, Maximize2, Layers } from "lucide-react";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { BIOMES, orgColor, C } from "@/lib/evolve/constants";
import {
  loadLand50,
  loadCountries110,
  loadCountries50,
  loadStates50,
  loadPlaces110,
  loadPlaces50,
  camToView,
  viewToCam,
  gridToLatLng,
} from "@/lib/evolve/geoService";
import {
  initialStyle,
  EVOLVE_COLORS,
  registerPmtilesProtocol,
  addLandLayer,
  addCountryBorders,
  addStateBorders,
  ensureCellsLayer,
  ensureActorsLayer,
} from "@/lib/evolve/evolveMapStyle";
import { toValidLngLat } from "@/lib/evolve/geoService";
import {
  CELL_MIN_ZOOM,
  setLandIndex,
  cellsInViewport,
  geoCellToEnginePos,
  latLngToGeoCell,
} from "@/lib/evolve/geoCells";

const ASSET_COLOR = {
  server: "#60a5fa",
  city: "#22d3ee",
  energy: "#fbbf24",
  compute: "#a78bfa",
  storage: "#94a3b8",
  deposit: "#34d399",
};

/**
 * EarthViewport — REAL EARTH map (MapLibre GL) that replaces the canvas/Leaflet
 * viewport. Same props contract: { cam, setCam, onSize }.
 *
 * The engine grid-cam stays the single source of truth (minimap + panels still
 * work); this component converts to/from a MapLibre { center:[lng,lat], zoom }
 * view. Real coastlines + borders come from SELF-HOSTED Natural Earth vector
 * data (no CARTO, no API key). EVOLVE cells, agents, players and assets overlay
 * the geography at their real lat/lng positions. Geographic labels are
 * DOM-projected (no external glyph server).
 */
export default function EarthViewport({ cam, setCam, onSize }) {
  const { engine, say } = useEvolve();
  const wrapRef = useRef(null);
  const mapRef = useRef(null);
  const places110Ref = useRef(null);
  const places50Ref = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [mapReady, setMapReady] = useState(false);
  const [labels, setLabels] = useState([]);
  const [showCells, setShowCells] = useState(true);

  /* measure container */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const apply = () => {
      const s = { w: el.clientWidth, h: el.clientHeight };
      setSize(s);
      onSize?.(s);
    };
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    apply();
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* create the map once the engine + size are ready */
  useEffect(() => {
    if (!engine || !size.w || mapRef.current) return undefined;
    registerPmtilesProtocol();
    const world = engine.world;
    const view = camToView(cam, world, size);
    // Validate the initial center through the boundary; fall back to a safe
    // world center if the projected coordinate is invalid rather than crashing.
    const initialCenter = toValidLngLat(view.center[1], view.center[0]) || [0, 20];
    const map = new maplibregl.Map({
      container: wrapRef.current,
      style: initialStyle(),
      center: initialCenter,
      zoom: view.zoom,
      minZoom: 2,
      maxZoom: 13,
      attributionControl: false,
      antialias: true,
    });
    mapRef.current = map;
    map.on("load", async () => {
      // progressive self-hosted basemap
      const [land, c110] = await Promise.all([loadLand50(), loadCountries110()]);
      addLandLayer(map, land);
      setLandIndex(land); // geographic land index for cell spawnability
      addCountryBorders(map, c110, { id: "ev-countries-110", minzoom: 0, maxzoom: 4, color: EVOLVE_COLORS.borderStrong, width: 0.8 });
      ensureCellsLayer(map);
      ensureActorsLayer(map);
      setMapReady(true);
      // detail tiers
      loadCountries50().then((c50) => addCountryBorders(map, c50, { id: "ev-countries-50", minzoom: 4, color: EVOLVE_COLORS.border, width: 0.6 }));
      loadStates50().then((s50) => addStateBorders(map, s50, { minzoom: 5 }));
      loadPlaces110().then((p) => { places110Ref.current = p; });
    });
    map.on("move", onMove);
    map.on("zoom", onMove);
    map.on("moveend", onMoveEnd);
    map.on("zoomend", onMoveEnd);
    map.on("click", onClick);
    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, size.w]);

  const world = engine?.world;

  /* cam (external) -> map */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !world || !size.w) return;
    const view = camToView(cam, world, size);
    const cur = map.getCenter();
    const curZ = map.getZoom();
    if (Math.abs(view.center[0] - cur.lat) < 0.01 && Math.abs(view.center[1] - cur.lng) < 0.01 && Math.abs(view.zoom - curZ) < 0.05) return;
    const valid = toValidLngLat(view.center[1], view.center[0]);
    if (!valid) return; // skip invalid camera coordinate rather than crash
    map.jumpTo({ center: valid, zoom: view.zoom });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cam, mapReady, size.w]);

  /* overlay + label refresh on move/zoom (cheap layers) */
  function onMove() {
    const map = mapRef.current;
    if (!map || !world) return;
    const z = map.getZoom();
    updateActors(map);
    updateLabels(map, z);
  }

  /* cell overlay refresh on moveend/zoomend (LOD + land-filtered) */
  function onMoveEnd() {
    const map = mapRef.current;
    if (!map || !world) return;
    updateCells(map, map.getZoom());
  }

  /* overlay refresh when engine state changes */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !world || !mapReady) return;
    updateCells(map, map.getZoom());
    updateActors(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, mapReady, showCells]);

  // Geographic cells: deterministic from lat/lng, land-only, LOD-gated.
  // No giant grid — cells only appear at city zoom and conform to real land.
  function updateCells(map, z) {
    if (!map.getSource("ev-cells")) return;
    if (!showCells || z < CELL_MIN_ZOOM) {
      map.getSource("ev-cells").setData({ type: "FeatureCollection", features: [] });
      return;
    }
    const cells = cellsInViewport(map.getBounds());
    if (!cells.length) {
      map.getSource("ev-cells").setData({ type: "FeatureCollection", features: [] });
      return;
    }
    const sel = engine.selection;
    const feats = cells.map((c) => {
      const ep = geoCellToEnginePos(c, world);
      const i = ep.y * world.width + ep.x;
      const ownerSlot = world.owner ? world.owner[i] : 0;
      const orgId = ownerSlot > 0 && world.orgSlots ? world.orgSlots[ownerSlot] : null;
      const biome = world.biome[i];
      const color = orgId ? orgColor(orgId) : BIOMES[biome] ? BIOMES[biome].color : "#0a121e";
      const isSel = sel && sel.x === ep.x && sel.y === ep.y;
      return {
        type: "Feature",
        properties: { color, opacity: orgId ? 0.5 : 0.3, sel: isSel ? 1 : 0, cellId: c.cellId },
        geometry: { type: "Polygon", coordinates: [[[c.west, c.south], [c.east, c.south], [c.east, c.north], [c.west, c.north], [c.west, c.south]]] },
      };
    });
    map.getSource("ev-cells").setData({ type: "FeatureCollection", features: feats });
  }

  function updateActors(map) {
    if (!map.getSource("ev-actors")) return;
    const toLngLat = (p) => {
      const ll = gridToLatLng((p.x || 0) + 0.5, (p.y || 0) + 0.5, world.width, world.height);
      return toValidLngLat(ll.lng, ll.lat);
    };
    const feats = [];
    for (const a of world.assets) {
      const coords = toLngLat(a);
      if (!coords) continue; // skip invalid asset coordinate
      feats.push({ type: "Feature", properties: { color: ASSET_COLOR[a.kind] || "#94a3b8", r: 4, kind: "asset", x: a.x, y: a.y }, geometry: { type: "Point", coordinates: coords } });
    }
    for (const ag of engine.agents.filter((a) => a.status !== "archived" && a.position)) {
      const coords = toLngLat(ag.position);
      if (!coords) continue; // skip invalid agent coordinate
      const org = ag.organization_id;
      feats.push({ type: "Feature", properties: { color: org ? orgColor(org) : "#e2e8f0", r: 3, kind: "agent", x: ag.position.x, y: ag.position.y }, geometry: { type: "Point", coordinates: coords } });
    }
    for (const pl of (engine.players || []).filter((p) => p.position)) {
      const coords = toLngLat(pl.position);
      if (!coords) continue; // skip invalid player coordinate
      const org = pl.organization_id;
      feats.push({ type: "Feature", properties: { color: "#22d3ee", r: 5, kind: "player", x: pl.position.x, y: pl.position.y }, geometry: { type: "Point", coordinates: coords } });
    }
    map.getSource("ev-actors").setData({ type: "FeatureCollection", features: feats });
  }

  function updateLabels(map, z) {
    const src = z >= 6 ? places50Ref.current || places110Ref.current : places110Ref.current;
    if (!src) { setLabels([]); return; }
    if (z >= 6 && !places50Ref.current) loadPlaces50().then((p) => { places50Ref.current = p; });
    const b = map.getBounds();
    const out = [];
    for (const f of src.features) {
      if (!f.geometry || f.geometry.type !== "Point") continue;
      const [lng, lat] = f.geometry.coordinates;
      if (lng < b.getWest() || lng > b.getEast() || lat < b.getSouth() || lat > b.getNorth()) continue;
      const p = f.properties || {};
      const pp = map.project([lng, lat]);
      out.push({ x: pp.x, y: pp.y, name: p.NAME || p.NAMEASCII || "", major: (p.FEATURECLA || "").includes("capital") || (p.POP_MAX || 0) > 500000 });
      if (out.length >= 80) break;
    }
    setLabels(out);
  }

  function onClick(e) {
    if (!world) return;
    const map = mapRef.current;
    // actor hit-test first
    const hits = map.queryRenderedFeatures(e.point, { layers: ["ev-actors-circle"] });
    if (hits.length) {
      const p = hits[0].properties || {};
      if (p.x != null && p.y != null && world.inBounds(p.x, p.y)) {
        const res = engine.applyTool(p.x, p.y);
        if (res?.message) say(res.message, res.ok !== false);
        return;
      }
    }
    const { lat, lng } = e.lngLat;
    // Ground click → geographic cell → engine position. The cell the user
    // clicked is the cell that gets selected; no offset, no projection drift.
    const cell = latLngToGeoCell(lat, lng);
    const ep = geoCellToEnginePos(cell, world);
    if (!world.inBounds(ep.x, ep.y)) return;
    const res = engine.applyTool(ep.x, ep.y);
    if (res?.message) say(res.message, res.ok !== false);
  }

  const view = useMemo(() => (world && size.w ? camToView(cam, world, size) : null), [cam, world, size]);

  return (
    <div className="ev-map" ref={wrapRef}>
      {/* geographic labels (DOM-projected, no glyph server) */}
      {mapReady && labels.map((l, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: l.x, top: l.y,
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            fontSize: l.major ? 10 : 8.5,
            color: l.major ? "#cbd5e1" : "#7c8a9a",
            textShadow: "0 0 4px #03070d, 0 0 2px #03070d",
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
            zIndex: 5,
          }}
        >
          {l.name}
        </span>
      ))}

      <div className="ev-map-overlay" style={{ top: 8, right: 8, display: "flex", flexDirection: "column", gap: 5 }}>
        <div className="ev-overlay-card" style={{ display: "flex", flexDirection: "column", padding: 3, gap: 2 }}>
          <button className="ev-btn ev-btn-ghost" style={{ padding: 6 }} onClick={() => mapRef.current?.zoomIn()} title="Zoom in"><ZoomIn className="h-3.5 w-3.5" /></button>
          <button className="ev-btn ev-btn-ghost" style={{ padding: 6 }} onClick={() => mapRef.current?.zoomOut()} title="Zoom out"><ZoomOut className="h-3.5 w-3.5" /></button>
          <button className="ev-btn ev-btn-ghost" style={{ padding: 6 }} onClick={() => mapRef.current?.flyTo({ center: [0, 20], zoom: 3 })} title="Centre the world"><Maximize2 className="h-3.5 w-3.5" /></button>
          <button className={`ev-btn ${showCells ? "" : "ev-btn-ghost"}`} style={{ padding: 6 }} onClick={() => setShowCells((s) => !s)} title="Cell overlay"><Layers className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      <div className="ev-coords">
        {world ? `${world.width}×${world.height} · ${cam.scale.toFixed(1)}× · ${view?.zoom.toFixed(1) || "—"}z` : "—"}
      </div>

      {engine?.tool && engine.tool !== "OBSERVE" && (
        <div className="ev-map-overlay" style={{ top: 8, left: 8 }}>
          <div className="ev-overlay-card" style={{ padding: "5px 9px", fontSize: 9, letterSpacing: "0.12em", color: "#22d3ee", textTransform: "uppercase" }}>
            {engine.tool} tool · tap the world
          </div>
        </div>
      )}

      <div style={{ position: "absolute", bottom: 4, left: 8, fontSize: 8, color: C.textFaint, letterSpacing: "0.08em", pointerEvents: "none" }}>
        © Natural Earth · OpenStreetMap contributors
      </div>
    </div>
  );
}