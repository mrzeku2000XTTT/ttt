import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, Rectangle, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { countryGridBounds, randomCellInCountry, cellStats } from "@/lib/evolve/countryMap";
import { cellBounds, loadCountries, loadRegions } from "@/lib/evolve/geoService";
import { BIOMES } from "@/lib/evolve/constants";
import { C } from "@/lib/evolve/constants";

/**
 * CellSelect — real map of the chosen region.
 * A Leaflet map is fit to the selected country/place bounds. The user zooms
 * into real geography and clicks a buildable cell to spawn. No fake grid.
 */
export default function CellSelect({ onClose }) {
  const { engine, selectedCountry, selectSpawnCell, selectedSpawnCell, spawnPlayer } = useEvolve();
  const [hover, setHover] = useState(null);

  useEffect(() => {
    loadCountries();
    loadRegions();
  }, []);

  const bounds = useMemo(() => {
    if (!engine || !selectedCountry) return null;
    return countryGridBounds(engine.world, selectedCountry);
  }, [engine, selectedCountry]);

  const stats = useMemo(() => {
    if (!engine || !hover) return null;
    return cellStats(engine.world, engine.agents, engine.players, engine.world.assets, hover.x, hover.y);
  }, [engine, hover]);

  if (!engine || !selectedCountry || !bounds) return null;

  const world = engine.world;
  const fit = [
    [selectedCountry.lat0, selectedCountry.lng0],
    [selectedCountry.lat1, selectedCountry.lng1],
  ];

  const onMapClick = (lat, lng) => {
    const x = Math.floor(((lng + 180) / 360) * world.width);
    const y = Math.floor(((90 - lat) / 180) * world.height);
    if (!world.inBounds(x, y)) return;
    if (!world.isBuildable(x, y)) return;
    selectSpawnCell({ x, y });
    setHover({ x, y });
  };

  const pickRandom = () => {
    const cell = randomCellInCountry(world, engine.rng, selectedCountry);
    selectSpawnCell(cell);
    setHover(cell);
  };

  const handleSpawn = async () => {
    if (!selectedSpawnCell) return;
    await spawnPlayer({ country: selectedCountry.name, position: selectedSpawnCell });
  };

  // Build cell rectangles for the country grid range (buildable highlight).
  const cells = [];
  const maxCells = 3000;
  const total = (bounds.x1 - bounds.x0 + 1) * (bounds.y1 - bounds.y0 + 1);
  if (total <= maxCells) {
    for (let y = bounds.y0; y <= bounds.y1; y += 1) {
      for (let x = bounds.x0; x <= bounds.x1; x += 1) {
        if (!world.isBuildable(x, y)) continue;
        const isSel = selectedSpawnCell?.x === x && selectedSpawnCell?.y === y;
        const i = y * world.width + x;
        const biome = world.biome[i];
        cells.push(
          <Rectangle
            key={`${x},${y}`}
            bounds={cellBounds(x, y, world)}
            pathOptions={{
              color: isSel ? "#22d3ee" : "rgba(120,160,200,0.10)",
              weight: isSel ? 2 : 0,
              fillColor: isSel ? "#22d3ee" : BIOMES[biome] ? BIOMES[biome].color : "#1a2a1a",
              fillOpacity: isSel ? 0.5 : 0.28,
            }}

          />
        );
      }
    }
  }

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 37, display: "flex", background: "rgba(3,6,11,0.96)" }}>
      <div className="ev-panel" style={{ flex: 1, borderRight: `1px solid ${C.line}`, minWidth: 0 }}>
        <div className="ev-panel-head">
          <span className="ev-panel-title">{selectedCountry.name.toUpperCase()} · CELL SELECT</span>
          <button className="ev-btn ev-btn-ghost" style={{ marginLeft: "auto", padding: "4px 10px" }} onClick={onClose}>BACK</button>
        </div>
        <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
          <MapContainer
            center={[(selectedCountry.lat0 + selectedCountry.lat1) / 2, (selectedCountry.lng0 + selectedCountry.lng1) / 2]}
            zoom={6}
            minZoom={2}
            maxZoom={11}
            zoomControl={false}
            attributionControl={false}
            preferCanvas
            style={{ width: "100%", height: "100%", background: "#03080a" }}
            eventHandlers={{ click: (e) => onMapClick(e.latlng.lat, e.latlng.lng) }}
          >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" subdomains="abcd" />
            <CountryBorders />
            {cells}
            <FitBounds bounds={fit} />
          </MapContainer>
        </div>
        <div style={{ padding: "8px 12px", borderTop: `1px solid ${C.line}`, display: "flex", gap: 8 }}>
          <button className="ev-btn ev-btn-ghost" onClick={pickRandom}>RANDOM CELL</button>
          <button className="ev-btn" disabled={!selectedSpawnCell} onClick={handleSpawn} style={{ marginLeft: "auto" }}>
            SPAWN HERE
          </button>
        </div>
      </div>

      <div style={{ width: 260, padding: 14, overflowY: "auto" }}>
        {stats ? (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>CELL {stats.label}</div>
            <div style={{ fontSize: 9, color: C.textFaint, marginBottom: 12 }}>{selectedCountry.name} · {stats.biome}</div>
            <Row label="AI" value={stats.independentAI + " ind."} />
            <Row label="HUMANS" value={stats.humans} />
            <Row label="ORGANIZATIONS" value={stats.organizations} />
            <Row label="OPEN JOBS" value={stats.openJobs} />
            <Row label="COMPUTE" value={stats.compute} />
            <Row label="ENERGY" value={stats.energy} />
            <Row label="CONTROL" value={stats.control} />
            <Row label="ECON. ACTIVITY" value={stats.economicActivity} />
            <Row label="BUILDABLE" value={stats.buildable ? "YES" : "NO"} color={stats.buildable ? C.green : C.red} />
          </>
        ) : (
          <div style={{ color: C.textFaint, fontSize: 11 }}>Click a buildable cell on the map to inspect.</div>
        )}
      </div>
    </div>
  );
}

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [20, 20] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function CountryBorders() {
  const [countries, setCountries] = useState(null);
  const [regions, setRegions] = useState(null);
  useEffect(() => {
    loadCountries().then(setCountries);
    loadRegions().then(setRegions);
  }, []);
  return (
    <>
      {countries && <GeoJSON key="c" data={countries} style={{ color: "#3a5a7a", weight: 0.8, opacity: 0.7, fill: false }} />}
      {regions && <GeoJSON key="r" data={regions} style={{ color: "#2a3a4a", weight: 0.4, opacity: 0.5, fill: false }} />}
    </>
  );
}

function Row({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${C.line}` }}>
      <span style={{ fontSize: 9, letterSpacing: "0.1em", color: C.textFaint }}>{label}</span>
      <span style={{ fontSize: 11, color: color || C.text, fontWeight: 600 }}>{value}</span>
    </div>
  );
}