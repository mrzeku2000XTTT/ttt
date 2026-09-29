/**
 * geoService — REAL EARTH geography layer for EVOLVE.
 *
 * The simulation grid stays the substrate; this module maps it to the real
 * planet and provides:
 *   - Natural Earth country + state/province borders (GeoJSON, public domain)
 *   - point-in-polygon country / region resolution
 *   - place search via the evolveGeoSearch backend function (Nominatim)
 *   - grid <-> lat/lng projection helpers (delegated to countryMap)
 *   - camera conversion between the engine grid-cam and a Leaflet view
 *
 * No fake rectangular country grids. No hardcoded city lists.
 */

import { base44 } from "@/api/base44Client";
import { gridToLatLng, latLngToGrid } from "./countryMap";

export { gridToLatLng, latLngToGrid };

/* ----------------------------------------------------------- boundaries
 * Natural Earth vector GeoJSON (public domain). 110m for countries (light),
 * 50m for states/provinces (loaded only when zoomed in).
 */
const COUNTRIES_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";
const REGIONS_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson";

let countriesGeo = null;
let regionsGeo = null;
let countriesPromise = null;
let regionsPromise = null;

export function loadCountries() {
  if (countriesGeo) return Promise.resolve(countriesGeo);
  if (countriesPromise) return countriesPromise;
  countriesPromise = fetch(COUNTRIES_URL)
    .then((r) => (r.ok ? r.json() : null))
    .then((g) => {
      countriesGeo = g;
      return g;
    })
    .catch(() => null);
  return countriesPromise;
}

export function loadRegions() {
  if (regionsGeo) return Promise.resolve(regionsGeo);
  if (regionsPromise) return regionsPromise;
  regionsPromise = fetch(REGIONS_URL)
    .then((r) => (r.ok ? r.json() : null))
    .then((g) => {
      regionsGeo = g;
      return g;
    })
    .catch(() => null);
  return regionsPromise;
}

export function hasCountries() {
  return !!countriesGeo;
}

/* ------------------------------------------------------- point in polygon
 * Ray-cast test for GeoJSON Polygon / MultiPolygon coordinates.
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
  // Polygon: array of rings; coords[0] is outer, rest are holes.
  if (typeof coords[0][0][0] === "number") {
    if (!pointInRing(lat, lng, coords[0])) return false;
    for (let h = 1; h < coords.length; h += 1) {
      if (pointInRing(lat, lng, coords[h])) return false;
    }
    return true;
  }
  // MultiPolygon: array of polygons.
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

function featureBounds(f) {
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
  if (!countriesGeo) return null;
  for (const f of countriesGeo.features) {
    if (!f.geometry) continue;
    if (pointInGeometry(lat, lng, f.geometry.coordinates)) {
      const p = f.properties || {};
      const b = featureBounds(f);
      return {
        iso: p.ISO_A2 || p.iso_a2 || p.ADMIN ? p.ISO_A2 || "" : "",
        name: p.NAME || p.name || p.ADMIN || "",
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
  if (!regionsGeo) return null;
  for (const f of regionsGeo.features) {
    if (!f.geometry) continue;
    if (pointInGeometry(lat, lng, f.geometry.coordinates)) {
      const p = f.properties || {};
      const b = featureBounds(f);
      return {
        name: p.name || p.NAME_1 || p.gn_name || "",
        country: p.admin || p.sov_a3 || "",
        lat0: b.lat0,
        lat1: b.lat1,
        lng0: b.lng0,
        lng1: b.lng1,
      };
    }
  }
  return null;
}

/* ------------------------------------------------------------- place search
 * Delegates to the evolveGeoSearch backend function (Nominatim proxy).
 */
export async function searchPlaces(query) {
  if (!query) return [];
  try {
    const res = await base44.functions.invoke("evolveGeoSearch", { query });
    return res?.data?.results || [];
  } catch {
    return [];
  }
}

/* --------------------------------------------------------- grid <-> lat/lng
 * cellBounds returns a Leaflet-style [[south, west], [north, east]] box.
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

/* ----------------------------------------------- engine grid-cam <-> leaflet
 * The engine camera is grid-space { x, y, scale } (pixels per cell).
 * Leaflet is { center: [lat, lng], zoom }. The mapping is exact so the minimap
 * rectangle still matches the visible region: scale = 256 * 2^z / world.width.
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

/* --------------------------------------------------------- bounds -> grid range
 * Converts a Leaflet LatLngBounds to the grid cell range it covers.
 */
export function boundsToGridRange(bounds, world) {
  const north = bounds.getNorth();
  const south = bounds.getSouth();
  const west = bounds.getWest();
  const east = bounds.getEast();
  const x0 = Math.max(0, Math.floor(((west + 180) / 360) * world.width));
  const x1 = Math.min(world.width - 1, Math.ceil(((east + 180) / 360) * world.width));
  const y0 = Math.max(0, Math.floor(((90 - north) / 180) * world.height));
  const y1 = Math.min(world.height - 1, Math.ceil(((90 - south) / 180) * world.height));
  return { x0, y0, x1, y1 };
}