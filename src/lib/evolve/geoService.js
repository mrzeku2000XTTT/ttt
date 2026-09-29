/**
 * geoService — SELF-HOSTED REAL EARTH geography layer for EVOLVE.
 *
 * No CARTO. No external tile API. No public Nominatim. No API key.
 *
 * Natural Earth vector GeoJSON (public domain) is served from the app's own
 * static storage at /evolve-earth/*.geojson. These files ship with the app,
 * so the map renders with zero third-party dependencies.
 *
 * The simulation grid stays the substrate; this module maps it to the real
 * planet and provides:
 *   - self-hosted Natural Earth country / state / land / populated-place data
 *   - point-in-polygon country / region resolution
 *   - grid <-> lat/lng projection helpers (delegated to countryMap)
 *   - camera conversion between the engine grid-cam and a map view
 *
 * A PMTiles vector archive (planet.pmtiles) can be dropped into
 * /evolve-earth/ to upgrade the basemap to full OSM detail — the PMTiles
 * protocol is registered in evolveMapStyle.js. Until then, the GeoJSON
 * sources are the authoritative, always-on basemap.
 */

import { gridToLatLng, latLngToGrid } from "./countryMap";

export { gridToLatLng, latLngToGrid };

const BASE = `${import.meta.env.BASE_URL}evolve-earth/`;
const FILES = {
  land110: "ne_110m_land.geojson",
  land50: "ne_50m_land.geojson",
  countries110: "ne_110m_admin_0_countries.geojson",
  countries50: "ne_50m_admin_0_countries.geojson",
  states50: "ne_50m_admin_1_states_provinces.geojson",
  places110: "ne_110m_populated_places.geojson",
  places50: "ne_50m_populated_places.geojson",
  places10: "ne_10m_populated_places.geojson",
};

const cache = {};
const pending = {};

async function loadGeo(key) {
  if (cache[key]) return cache[key];
  if (pending[key]) return pending[key];
  pending[key] = fetch(BASE + FILES[key])
    .then((r) => (r.ok ? r.json() : null))
    .then((g) => {
      cache[key] = g;
      pending[key] = null;
      return g;
    })
    .catch(() => {
      pending[key] = null;
      return null;
    });
  return pending[key];
}

export const loadLand110 = () => loadGeo("land110");
export const loadLand50 = () => loadGeo("land50");
export const loadCountries110 = () => loadGeo("countries110");
export const loadCountries50 = () => loadGeo("countries50");
export const loadStates50 = () => loadGeo("states50");
export const loadPlaces110 = () => loadGeo("places110");
export const loadPlaces50 = () => loadGeo("places50");
export const loadPlaces10 = () => loadGeo("places10");

/** Back-compat: the 110m countries are the canonical country layer. */
export function loadCountries() {
  return loadCountries110();
}
export function loadRegions() {
  return loadStates50();
}
export function hasCountries() {
  return !!cache.countries110;
}

/* ------------------------------------------------------- point in polygon
 * Ray-cast test for GeoJSON Polygon / MultiPolygon coordinates (lng,lat rings).
 */
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
  if (typeof coords[0][0][0] === "number") {
    if (!pointInRing(lat, lng, coords[0])) return false;
    for (let h = 1; h < coords.length; h += 1) {
      if (pointInRing(lat, lng, coords[h])) return false;
    }
    return true;
  }
  for (const poly of coords) {
    if (pointInRing(lat, lng, poly[0])) {
      let inHole = false;
      for (let h = 1; h < poly.length; h += 1) {
        if (pointInRing(lat, lng, poly[h])) {
          inHole = true;
          break;
        }
      }
      if (!inHole) return true;
    }
  }
  return false;
}

export function featureBounds(f) {
  let lat0 = 90;
  let lat1 = -90;
  let lng0 = 180;
  let lng1 = -180;
  const walk = (arr) => {
    if (typeof arr[0] === "number") {
      lng0 = Math.min(lng0, arr[0]);
      lng1 = Math.max(lng1, arr[0]);
      lat0 = Math.min(lat0, arr[1]);
      lat1 = Math.max(lat1, arr[1]);
      return;
    }
    for (const x of arr) walk(x);
  };
  if (f.geometry) walk(f.geometry.coordinates);
  return { lat0, lat1, lng0, lng1 };
}

export function latLngToCountry(lat, lng) {
  const geo = cache.countries110;
  if (!geo) return null;
  for (const f of geo.features) {
    if (!f.geometry) continue;
    if (pointInGeometry(lat, lng, f.geometry.coordinates)) {
      const p = f.properties || {};
      const b = featureBounds(f);
      return {
        iso: p.ISO_A2 || p.ISO_A3 || "",
        name: p.ADMIN || p.NAME || p.NAME_LONG || "",
        lat0: b.lat0,
        lat1: b.lat1,
        lng0: b.lng0,
        lng1: b.lng1,
      };
    }
  }
  return null;
}

export function latLngToRegion(lat, lng) {
  const geo = cache.states50;
  if (!geo) return null;
  for (const f of geo.features) {
    if (!f.geometry) continue;
    if (pointInGeometry(lat, lng, f.geometry.coordinates)) {
      const p = f.properties || {};
      const b = featureBounds(f);
      return {
        name: p.name || p.NAME_1 || p.gn_name || "",
        country: p.admin || p.ADM0_NAME || "",
        lat0: b.lat0,
        lat1: b.lat1,
        lng0: b.lng0,
        lng1: b.lng1,
      };
    }
  }
  return null;
}

/* --------------------------------------------------------- grid <-> lat/lng
 * cellBounds returns [[south, west], [north, east]] (Leaflet-style) for
 * compatibility; MapLibre components convert to [lng,lat] as needed.
 */
export function cellBounds(x, y, world) {
  const w = world.width;
  const h = world.height;
  const west = (x / w) * 360 - 180;
  const east = ((x + 1) / w) * 360 - 180;
  const north = 90 - (y / h) * 180;
  const south = 90 - ((y + 1) / h) * 180;
  return [
    [south, west],
    [north, east],
  ];
}

/** Cell bounds as a plain lng/lat box (MapLibre-friendly). */
export function cellBox(x, y, world) {
  const w = world.width;
  const h = world.height;
  return {
    west: (x / w) * 360 - 180,
    east: ((x + 1) / w) * 360 - 180,
    north: 90 - (y / h) * 180,
    south: 90 - ((y + 1) / h) * 180,
  };
}

/* ----------------------------------------------- engine grid-cam <-> map view
 * The engine camera is grid-space { x, y, scale } (pixels per cell).
 * The map view is { center: [lat, lng], zoom }. The mapping is exact so the
 * minimap rectangle still matches the visible region:
 *   scale = 256 * 2^z / world.width.
 */
const MIN_SCALE = 1.6;
const MAX_SCALE = 26;
const MIN_ZOOM = 2;
const MAX_ZOOM = 11;

export function camToView(cam, world, size) {
  const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, cam.scale));
  const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.log2((scale * world.width) / 256)));
  const vw = size && size.w ? size.w / scale : world.width / 2;
  const vh = size && size.h ? size.h / scale : world.height / 2;
  const lng = ((cam.x + vw / 2) / world.width) * 360 - 180;
  const lat = 90 - ((cam.y + vh / 2) / world.height) * 180;
  return { center: [lat, lng], zoom };
}

export function viewToCam(center, zoom, world, size) {
  const z = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
  const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, (256 * Math.pow(2, z)) / world.width));
  const vw = size && size.w ? size.w / scale : world.width / 2;
  const vh = size && size.h ? size.h / scale : world.height / 2;
  const lat = center[0];
  const lng = center[1];
  const cx = ((lng + 180) / 360) * world.width;
  const cy = ((90 - lat) / 180) * world.height;
  const maxX = Math.max(0, world.width - vw);
  const maxY = Math.max(0, world.height - vh);
  return {
    scale,
    x: Math.max(0, Math.min(maxX, cx - vw / 2)),
    y: Math.max(0, Math.min(maxY, cy - vh / 2)),
  };
}

/* ------------------------------------------------- viewport bbox -> grid range
 * Accepts a plain box { north, south, east, west } (MapLibre LngLatBounds-like
 * via getNorth()/getSouth()/getEast()/getWest(), or raw numbers).
 */
export function gridRangeFromBox(box, world) {
  const north = typeof box.getNorth === "function" ? box.getNorth() : box.north;
  const south = typeof box.getSouth === "function" ? box.getSouth() : box.south;
  const west = typeof box.getWest === "function" ? box.getWest() : box.west;
  const east = typeof box.getEast === "function" ? box.getEast() : box.east;
  const x0 = Math.max(0, Math.floor(((west + 180) / 360) * world.width));
  const x1 = Math.min(world.width - 1, Math.ceil(((east + 180) / 360) * world.width));
  const y0 = Math.max(0, Math.floor(((90 - north) / 180) * world.height));
  const y1 = Math.min(world.height - 1, Math.ceil(((90 - south) / 180) * world.height));
  return { x0, y0, x1, y1 };
}