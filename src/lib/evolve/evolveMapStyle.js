/**
 * evolveMapStyle — original EVOLVE dark map style for MapLibre GL.
 *
 * Aesthetic: WORLD SIMULATION + COMMAND CENTER + STRATEGY GAME.
 *   - near-black/navy ocean
 *   - dark charcoal land
 *   - subtle blue-gray geographic boundaries
 *   - white/gray geographic labels (rendered as a DOM overlay, see EarthViewport)
 *   - cyan EVOLVE activity
 *
 * No Mapbox/CARTO/Google style. No external glyphs (labels are DOM-projected).
 * The PMTiles `pmtiles://` protocol is registered so a self-hosted planet
 * archive can drop in later without changing this style's layer contract.
 */

import maplibregl from "maplibre-gl";
import { Protocol as PmtilesProtocol } from "pmtiles";

/**
 * Basemap tones. Land, coastlines and borders MUST sit clearly above the ocean
 * in brightness: at the old values (#0d1418 land on #03070d ocean) the whole
 * planet rendered as a flat black void and the map read as "nothing there".
 */
export const EVOLVE_COLORS = {
  ocean: "#050a12",
  land: "#16232d",
  landLine: "#2c4655",
  coast: "#2c4655",
  border: "#3a5670",
  borderStrong: "#4d7395",
  stateBorder: "#26384a",
  cell: "#22d3ee",
  actor: "#e2e8f0",
};

const PMTILES_URL = `${import.meta.env.BASE_URL}evolve-earth/planet.pmtiles`;
let pmtilesRegistered = false;
let pmtilesAvailable = null;

/** Register the PMTiles protocol with MapLibre (idempotent). */
export function registerPmtilesProtocol() {
  if (pmtilesRegistered) return;
  try {
    if (PmtilesProtocol) {
      const protocol = new PmtilesProtocol();
      maplibregl.addProtocol("pmtiles", protocol.tile);
    }
  } catch {
    /* pmtiles optional — GeoJSON basemap is the default path */
  }
  pmtilesRegistered = true;
}

/** HEAD the planet archive once; cache the result. */
export async function isPmtilesAvailable() {
  if (pmtilesAvailable !== null) return pmtilesAvailable;
  try {
    const r = await fetch(PMTILES_URL, { method: "HEAD" });
    pmtilesAvailable = r.ok;
  } catch {
    pmtilesAvailable = false;
  }
  return pmtilesAvailable;
}

/** Minimal initial style: just the ocean background. Layers are added progressively. */
export function initialStyle() {
  return {
    version: 8,
    name: "EVOLVE",
    sources: {},
    layers: [{ id: "ev-ocean", type: "background", paint: { "background-color": EVOLVE_COLORS.ocean } }],
  };
}

function hasLayer(map, id) {
  try {
    return !!map.getLayer(id);
  } catch {
    return false;
  }
}
function hasSource(map, id) {
  try {
    return !!map.getSource(id);
  } catch {
    return false;
  }
}

export function addLandLayer(map, geo) {
  if (!geo || hasLayer(map, "ev-land-fill")) return;
  if (!hasSource(map, "ev-land")) map.addSource("ev-land", { type: "geojson", data: geo, maxzoom: 11 });
  map.addLayer({
    id: "ev-land-fill",
    type: "fill",
    source: "ev-land",
    paint: { "fill-color": EVOLVE_COLORS.land },
  });
  map.addLayer({
    id: "ev-land-line",
    type: "line",
    source: "ev-land",
    paint: { "line-color": EVOLVE_COLORS.coast, "line-width": ["interpolate", ["linear"], ["zoom"], 2, 0.4, 8, 1] },
  });
}

export function addCountryBorders(map, geo, opts = {}) {
  const id = opts.id || "ev-countries";
  if (!geo || hasLayer(map, id)) return;
  if (!hasSource(map, id)) map.addSource(id, { type: "geojson", data: geo, maxzoom: 11 });
  map.addLayer({
    id,
    type: "line",
    source: id,
    minzoom: opts.minzoom ?? 0,
    maxzoom: opts.maxzoom ?? 24,
    paint: {
      "line-color": opts.color || EVOLVE_COLORS.border,
      "line-width": opts.width ?? 0.7,
      "line-opacity": opts.opacity ?? 0.8,
    },
  });
}

export function addStateBorders(map, geo, opts = {}) {
  if (!geo || hasLayer(map, "ev-states")) return;
  map.addSource("ev-states", { type: "geojson", data: geo, maxzoom: 11 });
  map.addLayer({
    id: "ev-states",
    type: "line",
    source: "ev-states",
    minzoom: opts.minzoom ?? 5,
    paint: {
      "line-color": EVOLVE_COLORS.stateBorder,
      "line-width": 0.4,
      "line-opacity": 0.6,
    },
  });
}

/** Cells overlay: a dynamic GeoJSON source of cell polygons + a selection outline. */
export function ensureCellsLayer(map) {
  if (hasLayer(map, "ev-cells-fill")) return;
  map.addSource("ev-cells", { type: "geojson", data: { type: "FeatureCollection", features: [] }, maxzoom: 13 });
  map.addLayer({
    id: "ev-cells-fill",
    type: "fill",
    source: "ev-cells",
    minzoom: 10,
    paint: {
      "fill-color": ["coalesce", ["get", "color"], EVOLVE_COLORS.land],
      "fill-opacity": ["coalesce", ["get", "opacity"], 0.4],
    },
  });
  map.addLayer({
    id: "ev-cells-sel",
    type: "line",
    source: "ev-cells",
    minzoom: 10,
    filter: ["==", ["get", "sel"], 1],
    paint: { "line-color": EVOLVE_COLORS.cell, "line-width": 2 },
  });
}

/** Actors overlay: clustered GeoJSON points (agents, players, assets). */
export function ensureActorsLayer(map) {
  if (hasLayer(map, "ev-actors-circle")) return;
  map.addSource("ev-actors", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
    cluster: true,
    clusterMaxZoom: 6,
    clusterRadius: 38,
    maxzoom: 11,
  });
  map.addLayer({
    id: "ev-actors-cluster",
    type: "circle",
    source: "ev-actors",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": EVOLVE_COLORS.cell,
      "circle-radius": ["interpolate", ["linear"], ["get", "point_count"], 2, 6, 20, 14, 100, 22],
      "circle-opacity": 0.35,
      "circle-stroke-color": EVOLVE_COLORS.cell,
      "circle-stroke-width": 1,
      "circle-stroke-opacity": 0.7,
    },
  });
  map.addLayer({
    id: "ev-actors-circle",
    type: "circle",
    source: "ev-actors",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": ["coalesce", ["get", "color"], EVOLVE_COLORS.actor],
      "circle-radius": ["coalesce", ["get", "r"], 3],
      "circle-opacity": 0.9,
      "circle-stroke-color": "#03070d",
      "circle-stroke-width": 1,
    },
  });
}

/**
 * Players get their own NON-clustered source + circle + text label, so every
 * human player is always individually visible on the map with their code — even
 * when several share the same cell (the actors layer would cluster them into one
 * anonymous dot). The label is the player's display code (P#001).
 */
export function ensurePlayersLayer(map) {
  if (hasLayer(map, "ev-players-circle")) return;
  map.addSource("ev-players", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });
  // Every human player — a cyan dot. Co-located players are offset by the
  // viewport so each one is individually visible even when sharing a cell.
  map.addLayer({
    id: "ev-players-circle",
    type: "circle",
    source: "ev-players",
    paint: {
      "circle-color": ["coalesce", ["get", "color"], "#22d3ee"],
      "circle-radius": ["coalesce", ["get", "r"], 6],
      "circle-opacity": 0.95,
      "circle-stroke-color": "#03070d",
      "circle-stroke-width": 1.5,
    },
  });
  // The currently logged-in player gets a brighter, larger ring + "YOU" label
  // (DOM-projected in EarthViewport — no glyph server).
  map.addLayer({
    id: "ev-players-you",
    type: "circle",
    source: "ev-players",
    filter: ["==", ["get", "is_you"], 1],
    paint: {
      "circle-color": "#a5f3fc",
      "circle-radius": 9,
      "circle-opacity": 0.25,
      "circle-stroke-color": "#a5f3fc",
      "circle-stroke-width": 2,
      "circle-stroke-opacity": 0.9,
    },
  });
}