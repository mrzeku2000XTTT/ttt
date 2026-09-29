/**
 * placeIndex — SELF-HOSTED, API-key-free worldwide place search for EVOLVE.
 *
 * Photon (komoot/photon) is the preferred self-hosted geocoder, but a full
 * planet Photon database needs ~95 GB of disk plus substantial RAM, which
 * this Base44 runtime cannot host. Instead we build a lightweight local
 * search index from bundled Natural Earth vector data (public domain):
 *   - countries (ne_110m_admin_0_countries)
 *   - states / provinces (ne_50m_admin_1_states_provinces)
 *   - populated places (ne_50m_populated_places + ne_110m_populated_places)
 *
 * The adapter is abstract: searchPlaces(query, filter) returns a normalized
 * result list. A future self-hosted Photon instance can replace the index
 * builder without touching the EVOLVE UI.
 *
 * No public Nominatim. No external geocoder. No API key.
 */

import {
  loadCountries110,
  loadStates50,
  loadPlaces50,
  loadPlaces110,
  loadPlaces10,
  featureBounds,
} from "./geoService";

let index = null;
let building = null;

const TYPE_LABEL = {
  country: "COUNTRY",
  region: "REGION",
  capital: "CITY",
  city: "CITY",
  town: "TOWN",
};

function placeType(props) {
  const fc = (props.FEATURECLA || props.featurecla || "").toLowerCase();
  const pop = props.POP_MAX || props.POP_MAX || 0;
  if (fc.includes("capital")) return "capital";
  if (pop >= 100000) return "city";
  return "town";
}

function bboxFromFeature(f) {
  const b = featureBounds(f);
  return { lat0: b.lat0, lat1: b.lat1, lng0: b.lng0, lng1: b.lng1 };
}

function pointBBox(lat, lng, span = 0.06) {
  return {
    lat0: lat - span,
    lat1: lat + span,
    lng0: lng - span,
    lng1: lng + span,
  };
}

function buildEntry(id, kind, name, region, country, countryCode, lat, lng, bbox, type, pop, altNames = []) {
  const hierarchy = [region, country].filter(Boolean).join(", ");
  return {
    id,
    kind, // 'country' | 'region' | 'place'
    type, // 'COUNTRY' | 'REGION' | 'CITY' | 'TOWN'
    name,
    altNames: altNames.filter(Boolean),
    region: region || "",
    country: country || "",
    countryCode: countryCode || "",
    lat,
    lng,
    bbox,
    pop: pop || 0,
    label: hierarchy ? `${name} · ${hierarchy}` : name,
  };
}

export async function buildPlaceIndex() {
  if (index) return index;
  if (building) return building;
  building = (async () => {
    const [countries, states, places50, places110, places10] = await Promise.all([
      loadCountries110(),
      loadStates50(),
      loadPlaces50(),
      loadPlaces110(),
      loadPlaces10(),
    ]);
    const out = [];
    let n = 0;
    if (countries) {
      for (const f of countries.features) {
        if (!f.geometry) continue;
        const p = f.properties || {};
        const b = bboxFromFeature(f);
        const lat = (b.lat0 + b.lat1) / 2;
        const lng = (b.lng0 + b.lng1) / 2;
        out.push(buildEntry(`c${n++}`, "country", p.ADMIN || p.NAME || p.NAME_LONG || "", "", "", p.ISO_A2 || p.ISO_A3 || "", lat, lng, b, "COUNTRY", p.POP_EST || 0, [p.NAME_LONG, p.NAME_SORT, p.FORMAL_EN, p.NAME_ALT, p.gn_name]));
      }
    }
    const regionSeen = new Set();
    if (states) {
      for (const f of states.features) {
        if (!f.geometry) continue;
        const p = f.properties || {};
        const b = bboxFromFeature(f);
        const lat = p.latitude != null ? p.latitude : (b.lat0 + b.lat1) / 2;
        const lng = p.longitude != null ? p.longitude : (b.lng0 + b.lng1) / 2;
        const name = p.name || p.NAME_1 || p.gn_name || "";
        const country = p.admin || p.ADM0_NAME || "";
        const key = `${norm(name)}|${norm(country)}`;
        if (name && !regionSeen.has(key)) {
          regionSeen.add(key);
          out.push(buildEntry(`s${n++}`, "region", name, "", country, p.iso_a2 || "", lat, lng, b, "REGION", 0, [p.name_alt, p.gn_name, p.NAME_1_ALT, p.gn_alt_name]));
        }
      }
    }
    // Derive worldwide regions from the 10m places' ADM1NAME field — gives every
    // country's admin-1 divisions (Bayern, Ontario, Maharashtra, …) without the
    // 40MB 10m states geometry file. Centroid = mean of the region's places.
    if (places10) {
      const byRegion = {};
      for (const f of places10.features) {
        if (!f.geometry || f.geometry.type !== "Point") continue;
        const p = f.properties || {};
        const r = p.ADM1NAME || "";
        const c = p.ADM0NAME || "";
        if (!r || !c) continue;
        const key = `${norm(r)}|${norm(c)}`;
        if (!byRegion[key]) byRegion[key] = { name: r, country: c, lat: 0, lng: 0, n: 0, lat0: 90, lat1: -90, lng0: 180, lng1: -180 };
        const e = byRegion[key];
        e.lat += p.LATITUDE; e.lng += p.LONGITUDE; e.n += 1;
        e.lat0 = Math.min(e.lat0, p.LATITUDE); e.lat1 = Math.max(e.lat1, p.LATITUDE);
        e.lng0 = Math.min(e.lng0, p.LONGITUDE); e.lng1 = Math.max(e.lng1, p.LONGITUDE);
      }
      for (const [key, e] of Object.entries(byRegion)) {
        if (regionSeen.has(key)) continue;
        regionSeen.add(key);
        const lat = e.lat / e.n, lng = e.lng / e.n;
        out.push(buildEntry(`r${n++}`, "region", e.name, "", e.country, "", lat, lng, { lat0: e.lat0, lat1: e.lat1, lng0: e.lng0, lng1: e.lng1 }, "REGION", 0));
      }
    }
    const placeSeen = new Set();
    const addPlace = (f, prefix) => {
      if (!f.geometry || f.geometry.type !== "Point") return;
      const p = f.properties || {};
      const lat = p.LATITUDE;
      const lng = p.LONGITUDE;
      if (lat == null || lng == null) return;
      const name = p.NAME || p.NAMEASCII || "";
      const dedup = `${norm(name)}|${lat.toFixed(3)}|${lng.toFixed(3)}`;
      if (!name || placeSeen.has(dedup)) return;
      placeSeen.add(dedup);
      out.push(buildEntry(`${prefix}${n++}`, "place", name, p.ADM1NAME || "", p.ADM0NAME || "", p.ISO_A2 || p.SOV_A3 || "", lat, lng, pointBBox(lat, lng), TYPE_LABEL[placeType(p)], p.POP_MAX || 0, [p.NAMEASCII, p.NAME_ALT, p.NAMEPAR, p.gn_name]));
    };
    if (places110) for (const f of places110.features) addPlace(f, "p110");
    if (places50) for (const f of places50.features) addPlace(f, "p50");
    if (places10) for (const f of places10.features) addPlace(f, "p10");
    index = out;
    building = null;
    return out;
  })();
  return building;
}

function norm(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

function scoreName(name, q, pop) {
  if (!name) return -1;
  if (name === q) return 1000 + (pop || 0) / 1e6;
  if (name.startsWith(q)) return 500 + (pop || 0) / 1e6;
  const words = name.split(" ");
  for (const w of words) if (w.startsWith(q)) return 300 + (pop || 0) / 1e6;
  if (name.includes(q)) return 100 + (pop || 0) / 1e6;
  return -1;
}

function scoreEntry(entry, q) {
  let best = scoreName(norm(entry.name), q, entry.pop);
  if (entry.altNames) {
    for (const alt of entry.altNames) {
      const s = scoreName(norm(alt), q, entry.pop);
      if (s > best) best = s;
    }
  }
  return best;
}

/**
 * searchPlaces — worldwide, self-hosted, API-key-free.
 * @param {string} query
 * @param {string} filter 'ALL' | 'COUNTRY' | 'REGION' | 'CITY'
 * @returns {Promise<Array>} normalized place results
 */
export async function searchPlaces(query, filter = "ALL") {
  const q = norm(query);
  if (q.length < 2) return [];
  const all = await buildPlaceIndex();
  const scored = [];
  for (const e of all) {
    if (filter === "COUNTRY" && e.kind !== "country") continue;
    if (filter === "REGION" && e.kind !== "region") continue;
    if (filter === "CITY" && e.kind !== "place") continue;
    const s = scoreEntry(e, q);
    if (s > 0) scored.push({ e, s });
  }
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, 40).map(({ e }) => e);
}