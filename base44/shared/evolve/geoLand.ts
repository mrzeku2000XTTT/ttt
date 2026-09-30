/**
 * geoLand — SERVER-SIDE land index for the EVOLVE territory system.
 *
 * The frontend geoCells.js already has a land index built from the
 * self-hosted Natural Earth land polygons. This is the same logic, available
 * to backend functions so the authoritative claim validator can reject
 * water-only cells without trusting the browser.
 *
 * The land GeoJSON is fetched once per warm function instance from the app's
 * own public static assets and cached module-side.
 */

interface LandFeature {
  coords: any;
  lat0: number;
  lat1: number;
  lng0: number;
  lng1: number;
}

let landFeatures: LandFeature[] | null = null;
let landLoading: Promise<LandFeature[]> | null = null;

/**
 * The app's public origin, where the self-hosted Natural Earth GeoJSON lives.
 * Backend requests arrive with the dispatcher worker as their origin, which
 * does NOT serve app static assets — so the land index is fetched from the
 * published app host instead. Falls back to the request origin if needed.
 */
const APP_ORIGIN = 'https://tttxyz.base44.app';

function computeBounds(coords: any): { lat0: number; lat1: number; lng0: number; lng1: number } {
  let lat0 = 90, lat1 = -90, lng0 = 180, lng1 = -180;
  const walk = (arr: any) => {
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

function pointInRing(lat: number, lng: number, ring: number[][]): boolean {
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

function pointInGeometry(lat: number, lng: number, coords: any): boolean {
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
        if (pointInRing(lat, lng, poly[h])) { inHole = true; break; }
      }
      if (!inHole) return true;
    }
  }
  return false;
}

async function loadLand(origin: string): Promise<LandFeature[]> {
  if (landFeatures) return landFeatures;
  if (landLoading) return landLoading;
  landLoading = (async () => {
    const bases = [APP_ORIGIN, origin].filter(Boolean);
    let lastErr: any = null;
    for (const base of bases) {
      try {
        const res = await fetch(`${base}/evolve-earth/ne_50m_land.geojson`);
        if (!res.ok) {
          lastErr = new Error(`land geojson fetch failed: ${res.status} (${base})`);
          continue;
        }
        const geo = await res.json();
        const out: LandFeature[] = [];
        for (const f of geo.features || []) {
          if (!f.geometry) continue;
          const b = computeBounds(f.geometry.coordinates);
          out.push({ coords: f.geometry.coordinates, ...b });
        }
        landFeatures = out;
        return out;
      } catch (e) {
        lastErr = e;
      }
    }
    landLoading = null; // allow a later retry instead of caching the failure
    throw lastErr || new Error('land index unavailable');
  })();
  return landLoading;
}

/**
 * Is this lat/lng point over land? Throws if the land index cannot be loaded
 * — the caller should treat a throw as "validation unavailable" and decide
 * whether to fail closed or open.
 */
export async function isLand(lat: number, lng: number, origin: string): Promise<boolean> {
  const features = await loadLand(origin);
  for (const e of features) {
    if (lat < e.lat0 || lat > e.lat1 || lng < e.lng0 || lng > e.lng1) continue;
    if (pointInGeometry(lat, lng, e.coords)) return true;
  }
  return false;
}