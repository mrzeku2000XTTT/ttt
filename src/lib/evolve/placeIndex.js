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

function buildEntry(id, kind, name, region, country, countryCode, lat, lng, bbox, type, pop) {
  const hierarchy = [region, country].filter(Boolean).join(", ");
  return {
    id,
    kind, // 'country' | 'region' | 'place'
    type, // 'COUNTRY' | 'REGION' | 'CITY' | 'TOWN'
    name,
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
    const [countries, states, places50, places110] = await Promise.all([
      loadCountries110(),
      loadStates50(),
      loadPlaces50(),
      loadPlaces110(),
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
        out.push(buildEntry(`c${n++}`, "country", p.ADMIN || p.NAME || p.NAME_LONG || "", "", "", p.ISO_A2 || p.ISO_A3 || "", lat, lng, b, "COUNTRY", p.POP_EST || 0));
      }
    }
    if (states) {
      for (const f of states.features) {
        if (!f.geometry) continue;
        const p = f.properties || {};
        const b = bboxFromFeature(f);
        const lat = p.latitude != null ? p.latitude : (b.lat0 + b.lat1) / 2;
        const lng = p.longitude != null ? p.longitude : (b.lng0 + b.lng1) / 2;
        out.push(buildEntry(`s${n++}`, "region", p.name || p.NAME_1 || p.gn_name || "", "", p.admin || p.ADM0_NAME || "", p.iso_a2 || "", lat, lng, b, "REGION", 0));
      }
    }
    const addPlace = (f, prefix) => {
      if (!f.geometry || f.geometry.type !== "Point") return;
      const p = f.properties || {};
      const lat = p.LATITUDE;
      const lng = p.LONGITUDE;
      if (lat == null || lng == null) return;
      out.push(buildEntry(`${prefix}${n++}`, "place", p.NAME || p.NAMEASCII || "", p.ADM1NAME || "", p.ADM0NAME || "", p.ISO_A2 || p.SOV_A3 || "", lat, lng, pointBBox(lat, lng), TYPE_LABEL[placeType(p)], p.POP_MAX || 0));
    };
    if (places110) for (const f of places110.features) addPlace(f, "p110");
    if (places50) for (const f of places50.features) addPlace(f, "p50");
    index = out;
    building = null;
    return out;
  })();
  return building;
}

function norm(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

function scoreEntry(entry, q) {
  const name = norm(entry.name);
  if (!name) return -1;
  if (name === q) return 1000 + (entry.pop || 0) / 1e6;
  if (name.startsWith(q)) return 500 + (entry.pop || 0) / 1e6;
  const words = name.split(" ");
  for (const w of words) if (w.startsWith(q)) return 300 + (entry.pop || 0) / 1e6;
  if (name.includes(q)) return 100 + (entry.pop || 0) / 1e6;
  return -1;
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