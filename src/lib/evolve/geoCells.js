/**
 * geoCells — GEOGRAPHIC cell addressing for EVOLVE.
 *
 * Cells are derived deterministically from latitude/longitude at a fixed
 * local-world resolution. The same geographic location ALWAYS resolves to
 * the same cellId. Cells are NOT the old finite simulation X/Y grid stretched
 * over Earth — they are real geographic tiles that conform to the planet.
 *
 *   REAL EARTH (lat/lng)
 *     ↓  floor(lat/CELL_DEG), floor(lng/CELL_DEG)
 *   GEOGRAPHIC CELL (cellId, bounds, center)
 *     ↓  latLngToGrid(centerLat, centerLng, world.width, world.height)
 *   ENGINE POSITION (x, y)  ← simulation substrate stays intact
 *
 * LOD: local cells only render at zoom >= CELL_MIN_ZOOM (city level). Below
 * that the world shows countries/states/activity — no giant local grid.
 *
 * LAND: a cell is spawnable only if its center is over land, tested against
 * the self-hosted Natural Earth land polygons. Water-only cells are never
 * shown as buildable. The basemap is untouched.
 */

import { latLngToGrid } from "./countryMap";

/** Fixed local-cell resolution. ~0.02° ≈ 2.2 km. Deterministic + stable. */
export const CELL_DEG = 0.02;
/** Local cells appear only at/above this zoom (city level) — LOD gate. */
export const CELL_MIN_ZOOM = 10;
/** Hard cap so a wide viewport never tries to draw tens of thousands of cells. */
export const MAX_VIEWPORT_CELLS = 4000;

/* ----------------------------------------------------------- land index
 * A bounding-box index over the land GeoJSON features for fast point-in-land
 * tests. Built once from the self-hosted Natural Earth land polygons.
 */
let landFeatures = null; // [{ coords, lat0, lat1, lng0, lng1 }]

function computeBounds(coords) {
  let lat0 = 90, lat1 = -90, lng0 = 180, lng1 = -180;
  const walk = (arr) => {
    if (typeof arr[0] === "number") {
      if (arr[0] < lng0) lng0 = arr[0];
      if (arr[0] > lng1) lng1 = arr[0];
      if (arr[1] < lat0) lat0 = arr[1];
      if (arr[1] > lat1) lat1 = arr[1];
      return;
    }
    for (const x of arr) walk(x);
  };
  walk(coords);
  return { lat0, lat1, lng0, lng1 };
}

/** Index the land GeoJSON. Call once after loadLand50() resolves. */
export function setLandIndex(landGeo) {
  if (!landGeo || !landGeo.features) { landFeatures = null; return; }
  const out = [];
  for (const f of landGeo.features) {
    if (!f.geometry) continue;
    const b = computeBounds(f.geometry.coordinates);
    out.push({ coords: f.geometry.coordinates, ...b });
  }
  landFeatures = out;
}

export function hasLandIndex() {
  return !!landFeatures;
}

function pointInRing(lat, lng, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const yi = ring[i][1];
    const xi = ring[i][0];
    const yj = ring[j][1];
    const xj = ring[j][0];
    const denom = (yj - yi) || 1e-12;
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / denom + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function pointInGeometry(lat, lng, coords) {
  if (!coords) return false;
  // Polygon: coords = [ring, hole, hole, ...]
  if (typeof coords[0][0][0] === "number") {
    if (!pointInRing(lat, lng, coords[0])) return false;
    for (let h = 1; h < coords.length; h += 1) {
      if (pointInRing(lat, lng, coords[h])) return false;
    }
    return true;
  }
  // MultiPolygon: coords = [poly, poly, ...]
  for (const poly of coords) {
    if (pointInRing(lat, lng, poly[0])) {
      let inHole = false;
      for (let h = 1; h < poly.length; h += 1) {
        if (pointInRing(lat, lng, poly[h])) { inHole = true; break; }
      }
      if (!inHole) return true;
    }
  }
  return false;
}

/**
 * Is this lat/lng point over land?
 * Falls back to `true` (assume land) if no index is loaded yet, so the spawn
 * flow never hard-blocks while the land GeoJSON is still loading.
 */
export function isLand(lat, lng) {
  if (!landFeatures) return true;
  for (const e of landFeatures) {
    if (lat < e.lat0 || lat > e.lat1 || lng < e.lng0 || lng > e.lng1) continue;
    if (pointInGeometry(lat, lng, e.coords)) return true;
  }
  return false;
}

/* ------------------------------------------------------- cell addressing
 * Deterministic lat/lng → geographic cell. Same location → same cellId forever.
 */
export function latLngToGeoCell(lat, lng) {
  const cLat = Math.floor(lat / CELL_DEG) * CELL_DEG;
  const cLng = Math.floor(lng / CELL_DEG) * CELL_DEG;
  return geoCellFromOrigin(cLat, cLng);
}

function geoCellFromOrigin(cLat, cLng) {
  return {
    cellId: `G${Math.round(cLat * 1e6)}_${Math.round(cLng * 1e6)}`,
    south: cLat,
    north: cLat + CELL_DEG,
    west: cLng,
    east: cLng + CELL_DEG,
    centerLat: cLat + CELL_DEG / 2,
    centerLng: cLng + CELL_DEG / 2,
  };
}

/** Map a geographic cell to the engine's internal X/Y grid (simulation substrate). */
export function geoCellToEnginePos(cell, world) {
  if (!cell || !world) return { x: 0, y: 0 };
  return latLngToGrid(cell.centerLat, cell.centerLng, world.width, world.height);
}

/** Deterministic lat/lng → cellId string (no bounds object). Same location → same id. */
export function cellIdFromLatLng(lat, lng) {
  const cLat = Math.floor(lat / CELL_DEG) * CELL_DEG;
  const cLng = Math.floor(lng / CELL_DEG) * CELL_DEG;
  return `G${Math.round(cLat * 1e6)}_${Math.round(cLng * 1e6)}`;
}

/** Parse a cellId into its bounds + center, or null if malformed. */
export function parseCellId(cellId) {
  const m = /^G(-?\d+)_(-?\d+)$/.exec(String(cellId || ""));
  if (!m) return null;
  const south = Number(m[1]) / 1e6;
  const west = Number(m[2]) / 1e6;
  return {
    cellId: String(cellId),
    south,
    north: south + CELL_DEG,
    west,
    east: west + CELL_DEG,
    centerLat: south + CELL_DEG / 2,
    centerLng: west + CELL_DEG / 2,
  };
}

/**
 * The 8 geographic neighbors of a cell (Moore neighborhood). Territory
 * expansion must originate from a cell the actor already controls, so a
 * claim is only valid against a cell whose id appears here for some owned
 * cell. Pure math — no DB, no land index.
 */
export function getNeighborCellIds(cellId) {
  const c = parseCellId(cellId);
  if (!c) return [];
  const out = [];
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      out.push(cellIdFromLatLng(c.centerLat + dy * CELL_DEG, c.centerLng + dx * CELL_DEG));
    }
  }
  return out;
}

/* ------------------------------------------------------- viewport generation
 * Generate ONLY the geographic cells intersecting the visible bounds, filtered
 * to land. Returns [] when the viewport is too wide (LOD cap) so far zooms
 * never draw a local grid.
 *
 * `box` is MapLibre LngLatBounds (getNorth/getSouth/getEast/getWest) or a plain
 * { north, south, east, west } object.
 */
export function cellsInViewport(box) {
  const north = typeof box.getNorth === "function" ? box.getNorth() : box.north;
  const south = typeof box.getSouth === "function" ? box.getSouth() : box.south;
  const west = typeof box.getWest === "function" ? box.getWest() : box.west;
  const east = typeof box.getEast === "function" ? box.getEast() : box.east;
  if (!Number.isFinite(north) || !Number.isFinite(east)) return [];
  // Antimeridian wrap — at city zoom this won't happen; bail safely if it does.
  if (west > east) return [];
  const y0 = Math.floor(south / CELL_DEG);
  const y1 = Math.floor(north / CELL_DEG);
  const x0 = Math.floor(west / CELL_DEG);
  const x1 = Math.floor(east / CELL_DEG);
  const cols = x1 - x0 + 1;
  const rows = y1 - y0 + 1;
  if (cols * rows > MAX_VIEWPORT_CELLS) return []; // too zoomed out — no local grid
  const out = [];
  for (let gy = y0; gy <= y1; gy += 1) {
    const cLat = gy * CELL_DEG;
    for (let gx = x0; gx <= x1; gx += 1) {
      const cLng = gx * CELL_DEG;
      const centerLat = cLat + CELL_DEG / 2;
      const centerLng = cLng + CELL_DEG / 2;
      if (!isLand(centerLat, centerLng)) continue; // water-only cell — not spawnable
      out.push(geoCellFromOrigin(cLat, cLng));
    }
  }
  return out;
}

/** GeoJSON FeatureCollection of geographic cells (for MapLibre fill/line layers). */
export function cellsFeatureCollection(cells, opts = {}) {
  const selId = opts.selectedCellId;
  const feats = [];
  for (const c of cells) {
    const isSel = selId && c.cellId === selId;
    feats.push({
      type: "Feature",
      properties: {
        cellId: c.cellId,
        color: isSel ? (opts.selColor || "#22d3ee") : (opts.color || "#16323a"),
        opacity: isSel ? 0.5 : (opts.opacity != null ? opts.opacity : 0.3),
        sel: isSel ? 1 : 0,
      },
      geometry: {
        type: "Polygon",
        coordinates: [[[c.west, c.south], [c.east, c.south], [c.east, c.north], [c.west, c.north], [c.west, c.south]]],
      },
    });
  }
  return { type: "FeatureCollection", features: feats };
}