import { useEffect, useMemo, useRef, useState } from "react";
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
  ensurePlayersLayer,
  ensureTerritoryLayer,
} from "@/lib/evolve/evolveMapStyle";
import { toValidLngLat } from "@/lib/evolve/geoService";
import { getTerritoryInBounds } from "@/lib/evolve/geoTerritoryService";
import {
  CELL_MIN_ZOOM,
  setLandIndex,
  cellsInViewport,
  geoCellToEnginePos,
  latLngToGeoCell,
  parseCellId,
  isLand,
} from "@/lib/evolve/geoCells";
import {
  boundarySegments,
  wipePolygon,
  territoryFeature,
} from "@/lib/evolve/territoryRender";
import { getControllerColor, controllerKeyOf } from "@/lib/evolve/controllerColor";
import { base44 } from "@/api/base44Client";

// Land cells render with a land tone so they never read as ocean.
const LAND_CELL_COLOR = "#1a2e22";

const ASSET_COLOR = {
  server: "#60a5fa",
  city: "#22d3ee",
  energy: "#fbbf24",
  compute: "#a78bfa",
  storage: "#94a3b8",
  deposit: "#34d399",
};

// Territory colour resolves from the SAME identity function as the actor's map
// dot (getControllerColor), so a controller's land always matches its dot.
// Colour is presentation only — ownership is decided by
// EvolveGeoOwnership.owner_id, never by comparing colours.

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
export default function EarthViewport({ cam, setCam, onSize, onSelectActor, selectedActorId }) {
  const { engine, say, currentPlayer, experimentId } = useEvolve();
  const wrapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const syncingRef = useRef(false);
  const latestRef = useRef(null);
  latestRef.current = { engine, size: null, cam, setCam, onSelectActor, currentPlayer, experimentId, selectedActorId };
  const places110Ref = useRef(null);
  const places50Ref = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState('');
  latestRef.current.size = size;
  const [labels, setLabels] = useState([]);
  const [playerLabels, setPlayerLabels] = useState([]);
  const [showCells, setShowCells] = useState(true);
  const didFitRef = useRef(false);
  // The view we last PUSHED into the map. Reading a view back that we caused
  // ourselves would bounce cam → map → cam forever.
  const pushedViewRef = useRef(null);
  // The cells currently drawn from the authoritative layer — the frontier wipe
  // and the border pass both need the same set the fill used.
  const territoryCellsRef = useRef([]);
  const frontierRafRef = useRef(null);
  const labelPopupRef = useRef(null);

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

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: initialStyle(),
      center: [0, 20],
      zoom: 0,
      minZoom: 0,
      renderWorldCopies: false,
      maxZoom: 13,
      // The world IS the bounds — the view can never be dragged off the top of
      // it, which is what left the map stuck against the north edge.

      attributionControl: false,
      antialias: true,
    });
    mapRef.current = map;
    let disposed = false;
    map.on('error', event => setMapError(event.error?.message || 'Earth map could not load'));
    map.on("load", async () => {
      try {
      // progressive self-hosted basemap
      const [land, c110] = await Promise.all([loadLand50(), loadCountries110()]);
      if (disposed) return;
      if (!land?.features?.length || !c110?.features?.length) throw new Error('Earth geography could not load. Please reload EVOLVE.');
      addLandLayer(map, land);
      setLandIndex(land); // geographic land index for cell spawnability
      addCountryBorders(map, c110, { id: "ev-countries-110", minzoom: 0, maxzoom: 4, color: EVOLVE_COLORS.borderStrong, width: 0.8 });
      ensureCellsLayer(map);
      // Territory sits BELOW actors/players so markers stay visible above it.
      ensureTerritoryLayer(map);
      ensureActorsLayer(map);
      ensurePlayersLayer(map);
      setMapReady(true);
      // detail tiers
      loadCountries50().then((c50) => { if (!disposed) addCountryBorders(map, c50, { id: 'ev-countries-50', minzoom: 4, color: EVOLVE_COLORS.border, width: 0.6 }); });
      loadStates50().then((s50) => { if (!disposed) addStateBorders(map, s50, { minzoom: 5 }); });
      loadPlaces110().then((p) => { places110Ref.current = p; });
      // On first load / restore, frame the ENTIRE world so the player starts
      // with a global view, not a clamped corner. Sync the engine cam to match
      // so the minimap and cam→map effect agree with the fitted view.
      if (!didFitRef.current) {
        didFitRef.current = true;
        syncingRef.current = true;
        map.fitBounds([[-180, -72], [180, 80]], { animate: false, padding: 20 });
        const c = map.getCenter();
        setCam(viewToCam([c.lat, c.lng], map.getZoom(), world, latestRef.current.size));
        syncingRef.current = false;
      }
      updateActors(map);
      } catch (error) {
        if (!disposed) setMapError(error.message);
      }
    });
    map.on("move", onMove);
    map.on("zoom", onMove);
    map.on("moveend", onMoveEnd);
    map.on("zoomend", onMoveEnd);
    map.on("click", onClick);
    return () => {
      disposed = true;
      didFitRef.current = false;
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, !!size.w]);

  useEffect(() => { mapRef.current?.resize(); }, [size.w, size.h]);

  const world = engine?.world;

  /* cam (external) -> map */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !world || !size.w || !mapReady) return;
    const view = camToView(cam, world, size);
    const cur = map.getCenter();
    const curZ = map.getZoom();
    if (Math.abs(view.center[0] - cur.lat) < 0.01 && Math.abs(view.center[1] - cur.lng) < 0.01 && Math.abs(view.zoom - curZ) < 0.05) return;
    // The fitted world owns the initial view; never push the old {0,0,6} camera.
    if (!didFitRef.current) return;
    const valid = toValidLngLat(view.center[1], view.center[0]);
    if (!valid) return; // skip invalid camera coordinate rather than crash
    syncingRef.current = true;
    map.jumpTo({ center: valid, zoom: view.zoom });
    syncingRef.current = false;
    // Record what the map ACTUALLY ended up at, not what we asked for.
    // MapLibre clamps the centre against maxBounds, and a clamped move is still
    // OUR move — comparing against the requested view let the clamp read as
    // user navigation, which walked the camera to the world edge one round trip
    // at a time until it sat over open ocean.
    const after = map.getCenter();
    pushedViewRef.current = { lng: after.lng, lat: after.lat, zoom: map.getZoom() };
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
    if (!map || !world || !size.w) return;
    updateCells(map, map.getZoom());
    updateTerritory(map);
    // Keep the engine camera in step with the real map so the minimap and the
    // viewport rectangle always describe what is actually on screen. A move we
    // pushed ourselves is not user navigation — reading it back is what let the
    // two cameras drift the view upward in a loop.
    const c = map.getCenter();
    const pushed = pushedViewRef.current;
    pushedViewRef.current = null;
    if (
      pushed &&
      Math.abs(pushed.lng - c.lng) < 0.02 &&
      Math.abs(pushed.lat - c.lat) < 0.02 &&
      Math.abs(pushed.zoom - map.getZoom()) < 0.05
    ) {
      return;
    }
    if (syncingRef.current) return;
    const next = viewToCam([c.lat, c.lng], map.getZoom(), world, latestRef.current.size);
    setCam((prev) =>
      Math.abs(prev.x - next.x) < 0.6 && Math.abs(prev.y - next.y) < 0.6 && Math.abs(prev.scale - next.scale) < 0.05 ? prev : next
    );
  }

  /* overlay refresh when engine state changes */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !world || !mapReady) return;
    updateCells(map, map.getZoom());
    updateActors(map);
    updateTerritory(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, mapReady, showCells]);

  /* territory refresh when the experiment id becomes available (after genesis)
   * or when the map becomes ready — ownership lives server-side, so the first
   * fetch happens as soon as there's an experiment to query. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !experimentId) return;
    updateTerritory(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experimentId, mapReady]);

  /* realtime: a player spawning/entering while you watch appears without a reload.
   * The engine notifies on any mutation; we refresh the human layer immediately. */
  useEffect(() => {
    if (!engine || !mapReady) return undefined;
    return engine.subscribe(() => {
      const map = mapRef.current;
      if (map) updateActors(map);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, mapReady]);

  /* realtime territory: when a claim is committed, update the affected cells in
   * place. No page reload and no whole-Earth poll — the ownership layer pushes
   * the new record and only the visible territory is re-read. A cell that lands
   * inside the current view animates as a frontier wipe; one outside it is
   * simply part of the next refresh. */
  useEffect(() => {
    if (!mapReady) return undefined;
    const unsubscribe = base44.entities.EvolveGeoOwnership.subscribe((event) => {
      const map = mapRef.current;
      if (!map || !latestRef.current.experimentId) return;
      const rec = event?.data;
      if (event?.type === "create" && rec?.cell_id) {
        const b = map.getBounds();
        const lat = Number(rec.center_lat);
        const lng = Number(rec.center_lng);
        const inView =
          Number.isFinite(lat) &&
          Number.isFinite(lng) &&
          lat <= b.getNorth() &&
          lat >= b.getSouth() &&
          lng <= b.getEast() &&
          lng >= b.getWest();
        updateTerritory(map, inView ? { animateCellId: rec.cell_id } : {});
        return;
      }
      updateTerritory(map);
    });
    return () => {
      if (frontierRafRef.current) cancelAnimationFrame(frontierRafRef.current);
      unsubscribe?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady]);

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
      const sculptedIdx = world.sculpt ? world.sculpt[i] : -1;
      const land = isLand(c.centerLat, c.centerLng);
      // A sculpted tile shows its painted biome; otherwise a real-world land
      // cell renders with the land tone so it never reads as ocean.
      const effectiveBiome = sculptedIdx >= 0 ? sculptedIdx : biome;
      const biomeColor = BIOMES[effectiveBiome] ? BIOMES[effectiveBiome].color : "#0a121e";
      const color = orgId ? orgColor(orgId) : land ? (sculptedIdx >= 0 ? biomeColor : LAND_CELL_COLOR) : biomeColor;
      const isSel = sel && sel.geo ? sel.geo.cellId === c.cellId : (sel && sel.x === ep.x && sel.y === ep.y);
      return {
        type: "Feature",
        properties: { color, opacity: orgId ? 0.4 : 0.14, sel: isSel ? 1 : 0, cellId: c.cellId },
        geometry: { type: "Polygon", coordinates: [[[c.west, c.south], [c.east, c.south], [c.east, c.north], [c.west, c.north], [c.west, c.south]]] },
      };
    });
    map.getSource("ev-cells").setData({ type: "FeatureCollection", features: feats });
  }

  // Territory: controlled geographic cells from the authoritative ownership
  // layer (EvolveGeoOwnership), never world.owner[]. Only the viewport's cells
  // are fetched. Adjacent same-controller cells share a color and so read as
  // one contiguous shape; individual ownership is preserved underneath.
  async function updateTerritory(map, opts = {}) {
    if (!map.getSource("ev-territory")) return;
    const expId = latestRef.current.experimentId;
    if (!expId) {
      map.getSource("ev-territory").setData({ type: "FeatureCollection", features: [] });
      map.getSource("ev-territory-border")?.setData({ type: "FeatureCollection", features: [] });
      return;
    }
    try {
      const res = await getTerritoryInBounds({ experimentId: expId, bounds: map.getBounds() });
      const cells = (res?.cells || [])
        .map((c) => {
          const parsed = parseCellId(c.cell_id);
          if (!parsed) return null;
          return {
            ...c,
            center_lat: Number.isFinite(c.center_lat) ? c.center_lat : parsed.centerLat,
            center_lng: Number.isFinite(c.center_lng) ? c.center_lng : parsed.centerLng,
            color: getControllerColor(controllerKeyOf(c)),
          };
        })
        .filter(Boolean);
      territoryCellsRef.current = cells;

      // The animating cell is withheld from the settled layer so the wipe is
      // actually visible; it is drawn in full once the wipe completes.
      const animating = opts.animateCellId;
      const drawn = cells.filter((c) => c.cell_id !== animating);

      // Selection state: the selected controller's cells are emphasised in its
      // own identity colour while unrelated territory stays visible but quiet.
      // Presentation only — ownership never changes here.
      const focus = latestRef.current.selectedActorId || "";
      // Owned land must read clearly ON TOP of the neutral cell grid. With both
      // near 0.3 the grid and the territory muddied into one grey mass and
      // ownership was invisible; the grid is now a faint underlay and territory
      // carries the weight.
      const opacityFor = (c) => (focus ? (c.owner_id === focus ? 0.62 : 0.1) : 0.5);
      const feats = drawn.map((c) => territoryFeature(c, c.color, opacityFor(c)));
      map.getSource("ev-territory").setData({ type: "FeatureCollection", features: feats });

      // Contiguous borders: only edges facing a DIFFERENT controller are drawn.
      const segments = boundarySegments(drawn);
      const borderSrc = map.getSource("ev-territory-border");
      if (borderSrc) {
        borderSrc.setData({ type: "FeatureCollection", features: segments });
      }
      const selSrc = map.getSource("ev-territory-selected");
      if (selSrc) {
        selSrc.setData({
          type: "FeatureCollection",
          features: focus ? segments.filter((f) => f.properties.ownerId === focus) : [],
        });
      }

      if (animating) animateFrontier(map, animating);
    } catch (e) {
      // Territory is an overlay — a query failure must never break the map.
      map.getSource("ev-territory").setData({ type: "FeatureCollection", features: [] });
      map.getSource("ev-territory-border")?.setData({ type: "FeatureCollection", features: [] });
    }
  }

  /**
   * Frontier wipe for ONE newly committed cell. The fill starts as a sliver on
   * the edge shared with the actor's existing territory and grows outward:
   *   ██████│░░░░  →  ████████▒░░  →  ████████████
   * Historical cells are drawn immediately and never animate — this only runs
   * for a cell that arrived over realtime while the map was open.
   */
  function animateFrontier(map, cellId) {
    const src = map.getSource("ev-territory-frontier");
    if (!src) return;
    const cells = territoryCellsRef.current || [];
    const cell = cells.find((c) => c.cell_id === cellId);
    if (!cell) return;
    // The neighbour the expansion grew from: same controller, one cell away.
    const fromCell = cells.find(
      (c) =>
        c.cell_id !== cell.cell_id &&
        c.owner_id === cell.owner_id &&
        Math.abs(c.center_lat - cell.center_lat) <= 0.021 &&
        Math.abs(c.center_lng - cell.center_lng) <= 0.021
    );

    if (frontierRafRef.current) cancelAnimationFrame(frontierRafRef.current);
    const started = performance.now();
    const DURATION = 700;

    const step = (now) => {
      const t = Math.min(1, (now - started) / DURATION);
      const ring = wipePolygon(cell, fromCell, t);
      src.setData({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { color: cell.color, opacity: 0.55 },
            geometry: { type: "Polygon", coordinates: [ring] },
          },
        ],
      });
      if (t < 1) {
        frontierRafRef.current = requestAnimationFrame(step);
      } else {
        frontierRafRef.current = null;
        // Settle: the cell joins the authoritative layer, the wipe clears.
        setTimeout(() => {
          src.setData({ type: "FeatureCollection", features: [] });
          const m = mapRef.current;
          if (m) updateTerritory(m);
        }, 320);
      }
    };
    frontierRafRef.current = requestAnimationFrame(step);
  }

  function updateActors(map) {
    if (!map.getSource("ev-actors")) return;
    const engine = latestRef.current.engine;
    const world = engine.world;
    const toLngLat = (p) => {
      const ll = gridToLatLng((p.x || 0) + 0.5, (p.y || 0) + 0.5, world.width, world.height);
      return toValidLngLat(ll.lng, ll.lat);
    };
    const feats = [];
    for (const a of world.assets) {
      const coords = toLngLat(a);
      if (!coords) continue; // skip invalid asset coordinate
      feats.push({ type: "Feature", properties: { color: ASSET_COLOR[a.kind] || "#94a3b8", r: 4, kind: "asset", type: "asset", id: a.sim_id, x: a.x, y: a.y }, geometry: { type: "Point", coordinates: coords } });
    }
    for (const ag of engine.agents.filter((a) => a.status !== "archived" && a.position)) {
      const coords = toLngLat(ag.position);
      if (!coords) continue; // skip invalid agent coordinate
      // The dot uses the SAME identity colour as this agent's territory.
      feats.push({ type: "Feature", properties: { color: getControllerColor(ag.organization_id || ag.id), r: 3, kind: "agent", type: "agent", id: ag.id, x: ag.position.x, y: ag.position.y }, geometry: { type: "Point", coordinates: coords } });
    }
    // HUMANS are NOT AI agents — they live only on the dedicated ev-players
    // layer. The ev-actors source carries agents + assets only.
    map.getSource("ev-actors").setData({ type: "FeatureCollection", features: feats });

    // ---- HUMAN PLAYERS (non-clustered, always individually visible) ----
    // Co-located players (same engine cell) are offset in a small ring so each
    // one renders as its own dot instead of overlapping into a single point.
    if (map.getSource("ev-players")) {
      const meId = latestRef.current.currentPlayer?.id;
      const positioned = (engine.players || []).filter((p) => p.position);
      // group by rounded coordinate so players sharing a cell get offset
      const groups = new Map();
      for (const pl of positioned) {
        const coords = toLngLat(pl.position);
        if (!coords) continue;
        const key = `${coords[0].toFixed(3)},${coords[1].toFixed(3)}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push({ pl, coords });
      }
      const pfeats = [];
      for (const [, group] of groups) {
        const n = group.length;
        group.forEach(({ pl, coords }, i) => {
          let lng = coords[0];
          let lat = coords[1];
          if (n > 1) {
            // Separate co-located players by a constant SCREEN distance so each
            // dot stays individually readable at every zoom. Offsetting in
            // DEGREES pushed markers tens of kilometres off their own cell at
            // city zoom, which read as dots detached from their territory.
            const angle = (i * 2 * Math.PI) / n;
            const pt = map.project(coords);
            const shifted = map.unproject([pt.x + 13 * Math.cos(angle), pt.y + 13 * Math.sin(angle)]);
            lng = shifted.lng;
            lat = shifted.lat;
          }
          const isYou = meId && pl.id === meId;
          pfeats.push({
            type: "Feature",
            properties: {
              code: pl.code || "P",
              id: pl.id,
              type: "player",
              x: pl.position.x,
              y: pl.position.y,
              is_you: isYou ? 1 : 0,
              color: isYou ? "#a5f3fc" : getControllerColor(pl.organization_id || pl.id),
              r: isYou ? 7 : 6,
            },
            geometry: { type: "Point", coordinates: [lng, lat] },
          });
        });
      }
      map.getSource("ev-players").setData({ type: "FeatureCollection", features: pfeats });

      // DOM-projected code labels (no glyph server) — "P#001", "P#002 YOU".
      const out = [];
      for (const f of pfeats) {
        const pp = map.project(f.geometry.coordinates);
        out.push({
          x: pp.x,
          y: pp.y,
          code: f.properties.code,
          isYou: f.properties.is_you === 1,
        });
      }
      setPlayerLabels(out);
    }
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
    // Actor hit-test first — with a small tolerance box so touch input lands
    // on the marker, not the ground under it. The actor's authoritative
    // geographic cell is derived from its OWN engine position (not the click
    // point), so the highlighted cell always contains the marker.
    const tol = 7;
    const hits = map.queryRenderedFeatures(
      [[e.point.x - tol, e.point.y - tol], [e.point.x + tol, e.point.y + tol]],
      { layers: ["ev-actors-circle", "ev-players-circle"] }
    );
    if (hits.length) {
      const p = hits[0].properties || {};
      if (p.id && p.type && p.x != null && p.y != null && world.inBounds(p.x, p.y)) {
        const ll = gridToLatLng((p.x || 0) + 0.5, (p.y || 0) + 0.5, world.width, world.height);
        const cell = latLngToGeoCell(ll.lat, ll.lng);
        engine.selectTile(p.x, p.y, cell); // highlight the actor's geographic cell
        onSelectActor?.({ id: p.id, type: p.type }); // open the AI/player inspector
        return; // do NOT fall through to the ground-click handler
      }
    }
    // Territory hit-test — clicking a controlled cell resolves its controller
    // and opens the appropriate public inspector. Uses the authoritative
    // geographic cell id, so it never desyncs from the ownership layer.
    const tHits = map.queryRenderedFeatures(e.point, { layers: ["ev-territory-fill"] });
    if (tHits.length) {
      const p = tHits[0].properties || {};
      if (p.ownerId && p.ownerType) {
        const cell = parseCellId(p.cellId);
        if (cell) {
          const ep = geoCellToEnginePos(cell, world);
          if (world.inBounds(ep.x, ep.y)) engine.selectTile(ep.x, ep.y, cell);
        }
        if (p.ownerType === "AI") {
          onSelectActor?.({ id: p.ownerId, type: "agent" });
        } else if (p.ownerType === "HUMAN") {
          onSelectActor?.({ id: p.ownerId, type: "player" });
        } else if (p.ownerType === "ORGANIZATION") {
          say(`${p.ownerCode || p.ownerId} controls this territory`, true);
        }
        return; // do not fall through to the ground-click handler
      }
    }
    const { lat, lng } = e.lngLat;
    // Ground click → geographic cell → engine position. The cell the user
    // clicked is the cell that gets selected; no offset, no projection drift.
    const cell = latLngToGeoCell(lat, lng);
    const ep = geoCellToEnginePos(cell, world);
    if (!world.inBounds(ep.x, ep.y)) return;
    const res = engine.applyTool(ep.x, ep.y, { geo: cell });
    if (res?.message) say(res.message, res.ok !== false);
  }

  /* Controller identity label over the selected cell — "whose land am I looking
   * at?" answered before any provenance detail. A MapLibre Popup is DOM based,
   * so it needs no glyph server. The accent uses the SAME identity colour as the
   * controller's map dot. Labels appear contextually (on selection), never
   * permanently inside every cell. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return undefined;
    const geo = engine?.selection?.geo;
    if (!geo) {
      labelPopupRef.current?.remove();
      labelPopupRef.current = null;
      return undefined;
    }
    const cell = parseCellId(geo.cellId);
    if (!cell) return undefined;
    const owned = (territoryCellsRef.current || []).find((c) => c.cell_id === geo.cellId);
    const color = owned ? owned.color : "#94a3b8";
    const code = owned ? owned.owner_code || owned.owner_id : "UNCLAIMED";
    const name = owned ? engine?.agentById?.get(owned.owner_id)?.name || "" : "";
    const html =
      `<div style="display:flex;align-items:center;gap:6px;font:600 10px/1.25 system-ui,sans-serif;color:#eef3f9">` +
      `<span style="width:8px;height:8px;border-radius:50%;flex:0 0 auto;background:${color};box-shadow:0 0 6px ${color}"></span>` +
      `<span>${code}${name ? `<br><span style="font-weight:400;opacity:.75">${name}</span>` : ""}</span></div>` +
      `<div style="font:600 8px/1.4 system-ui,sans-serif;letter-spacing:.1em;color:${color};margin-top:3px">` +
      `${owned ? "CONTROLLED" : "NEUTRAL"}</div>`;
    if (!labelPopupRef.current) {
      labelPopupRef.current = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 16,
        className: "ev-cell-label",
      })
        .setLngLat([cell.centerLng, cell.centerLat])
        .setHTML(html)
        .addTo(map);
    } else {
      labelPopupRef.current.setLngLat([cell.centerLng, cell.centerLat]).setHTML(html);
    }
    return undefined;
  }, [engine?.selection?.geo?.cellId, mapReady, engine?.agentById]);

  const view = useMemo(() => (world && size.w ? camToView(cam, world, size) : null), [cam, world, size]);

  return (
    <div className="ev-map" ref={wrapRef}>
      <div ref={mapContainerRef} style={{ position: 'absolute', inset: 0 }} />
      {(!mapReady || mapError) && <div className="ev-overlay-card" role="status" style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, padding: 12 }}>{mapError || 'Loading Earth geography…'}{mapError && <button className="ev-btn" onClick={() => window.location.reload()}>RELOAD</button>}</div>}
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

      {/* human player labels — every player's code, the current player marked YOU */}
      {mapReady && playerLabels.map((l, i) => (
        <span
          key={`pl-${i}`}
          style={{
            position: "absolute",
            left: l.x, top: l.y,
            transform: "translate(-50%, -150%)",
            pointerEvents: "none",
            fontSize: 10,
            fontWeight: 700,
            color: l.isYou ? "#a5f3fc" : "#e0fbff",
            textShadow: "0 0 4px #03070d, 0 0 2px #03070d",
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
            zIndex: 6,
          }}
        >
          {l.code}{l.isYou ? " · YOU" : ""}
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