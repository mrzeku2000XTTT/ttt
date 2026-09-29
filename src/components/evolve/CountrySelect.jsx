import React, { useEffect, useState } from "react";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { searchPlaces } from "@/lib/evolve/placeIndex";
import { loadCountries, latLngToCountry } from "@/lib/evolve/geoService";
import { C } from "@/lib/evolve/constants";

const FILTERS = ["ALL", "COUNTRY", "REGION", "CITY"];

/**
 * CountrySelect — REAL EARTH place search (self-hosted, API-key-free).
 * Users type any country / state / city / town and get hierarchical results
 * (e.g. "Springfield · Illinois, United States"). Selecting a place resolves
 * its real country + bounding box and proceeds to cell selection.
 *
 * No public Nominatim. Powered by the bundled Natural Earth place index
 * (see placeIndex.js). A self-hosted Photon instance can replace the index
 * later without changing this UI.
 */
export default function CountrySelect({ onExplore, onStartHere, onClose }) {
  const { selectCountry, selectedCountry } = useEvolve();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState(null);

  useEffect(() => {
    loadCountries();
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    setSearching(true);
    const id = setTimeout(async () => {
      const r = await searchPlaces(q, filter);
      setResults(r);
      setSearching(false);
    }, 300);
    return () => clearTimeout(id);
  }, [query, filter]);

  const buildCountry = (place) => {
    const cFeat = latLngToCountry(place.lat, place.lng);
    const bbox =
      place.bbox ||
      (cFeat && { lat0: cFeat.lat0, lat1: cFeat.lat1, lng0: cFeat.lng0, lng1: cFeat.lng1 }) || {
        lat0: place.lat - 1,
        lat1: place.lat + 1,
        lng0: place.lng - 1,
        lng1: place.lng + 1,
      };
    return {
      iso: cFeat?.iso || place.countryCode || "",
      name: place.country || cFeat?.name || place.name,
      lat0: bbox.lat0,
      lat1: bbox.lat1,
      lng0: bbox.lng0,
      lng1: bbox.lng1,
      _place: place,
    };
  };

  const pick = (place) => {
    const country = buildCountry(place);
    setPicked({ place, country });
    selectCountry(country);
  };

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 36, display: "flex", background: "rgba(3,6,11,0.96)" }}>
      <div className="ev-panel" style={{ flex: "1 1 45%", maxWidth: 460, borderRight: `1px solid ${C.line}` }}>
        <div className="ev-panel-head">
          <span className="ev-panel-title">SEARCH · REAL EARTH</span>
          <button className="ev-btn ev-btn-ghost" style={{ marginLeft: "auto", padding: "4px 10px" }} onClick={onClose}>CLOSE</button>
        </div>
        <div style={{ padding: "8px 10px", borderBottom: `1px solid ${C.line}` }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SEARCH EARTH — country, state, city or town…"
            autoFocus
            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.line}`, borderRadius: 5, padding: "8px 10px", color: C.text, fontSize: 12, outline: "none" }}
          />
          <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="ev-btn"
                style={{
                  padding: "3px 8px", fontSize: 8.5, letterSpacing: "0.08em",
                  background: filter === f ? "rgba(34,211,238,0.14)" : "transparent",
                  color: filter === f ? C.cyan : C.textFaint,
                  border: `1px solid ${filter === f ? "rgba(34,211,238,0.4)" : C.line}`,
                }}
              >
                {f}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 8.5, color: C.textFaint, marginTop: 6, letterSpacing: "0.08em" }}>
            Self-hosted Natural Earth place index · no API key · worldwide
          </div>
        </div>
        <div className="ev-panel-body ev-scroll">
          {searching && <div style={{ padding: 14, color: C.textFaint, fontSize: 11 }}>Searching the planet…</div>}
          {!searching && query && results.length === 0 && <div style={{ padding: 14, color: C.textFaint, fontSize: 11 }}>No places matched.</div>}
          {!searching && !query && (
            <div style={{ padding: 14, color: C.textFaint, fontSize: 11 }}>
              Type any place on Earth — country, state/province, city or town. Results show the full hierarchy so duplicate city names are distinguishable.
            </div>
          )}
          {results.map((r) => {
            const isSel = picked?.place?.id === r.id;
            return (
              <button
                key={r.id}
                onClick={() => pick(r)}
                style={{
                  width: "100%", textAlign: "left", padding: "9px 12px",
                  background: isSel ? "rgba(34,211,238,0.1)" : "transparent",
                  border: "none", borderBottom: `1px solid ${C.line}`,
                  color: isSel ? C.cyan : C.textDim, cursor: "pointer",
                }}
              >
                <div style={{ fontSize: 12, color: isSel ? C.cyan : C.text, fontWeight: 600 }}>{r.name}</div>
                <div style={{ fontSize: 9.5, color: C.textFaint, marginTop: 2, letterSpacing: "0.04em" }}>
                  {r.label} <span style={{ color: C.cyan, marginLeft: 6 }}>{r.type}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 16, overflowY: "auto" }}>
        {picked ? (
          <>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 4 }}>{picked.place.name}</div>
            <div style={{ fontSize: 9, color: C.textFaint, letterSpacing: "0.12em", marginBottom: 14 }}>{picked.place.label}</div>
            <div className="ev-grid2" style={{ gap: 10, marginBottom: 16 }}>
              <Metric label="COUNTRY" value={picked.place.country || "—"} color={C.cyan} />
              <Metric label="STATE / REGION" value={picked.place.region || "—"} color={C.text} />
              <Metric label="PLACE" value={picked.place.name || "—"} color={C.green} />
              <Metric label="TYPE" value={picked.place.type || "—"} color={C.purple} />
              <Metric label="LAT" value={picked.place.lat.toFixed(3)} color={C.textDim} />
              <Metric label="LNG" value={picked.place.lng.toFixed(3)} color={C.textDim} />
            </div>
            <div style={{ fontSize: 9.5, color: C.textFaint, marginBottom: 14, lineHeight: 1.5 }}>
              Press START HERE to drop into this region. The next screen shows the real map of {picked.country?.name || picked.place.country || "this area"} — zoom in and pick your simulation cell on real land.
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
              <button className="ev-btn ev-btn-ghost" onClick={() => onExplore?.(picked.country)}>EXPLORE</button>
              <button className="ev-btn" onClick={() => onStartHere?.(picked.country)}>START HERE</button>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: C.textFaint, fontSize: 11, textAlign: "center", padding: 24 }}>
            Search any place on Earth to choose your spawn region.
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, color }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.line}`, borderRadius: 6, padding: "10px 12px" }}>
      <div style={{ fontSize: 8, letterSpacing: "0.13em", color: C.textFaint }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color, marginTop: 3, wordBreak: "break-word" }}>{value}</div>
    </div>
  );
}