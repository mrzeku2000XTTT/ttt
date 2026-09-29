import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, Rectangle, CircleMarker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { ZoomIn, ZoomOut, Maximize2, Layers } from "lucide-react";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { BIOMES, orgColor } from "@/lib/evolve/constants";
import {
  loadCountries,
  loadRegions,
  camToView,
  viewToCam,
  cellBounds,
  boundsToGridRange,
  gridToLatLng,
} from "@/lib/evolve/geoService";

const ASSET_COLOR = {
  server: "#60a5fa",
  city: "#22d3ee",
  energy: "#fbbf24",
  compute: "#a78bfa",
  storage: "#94a3b8",
  deposit: "#34d399",
};

/**
 * EarthViewport — real Earth map (Leaflet) that replaces the canvas WorldViewport.
 * Same props contract: { cam, setCam, onSize }. The engine grid-cam is kept as the
 * single source of truth (so the minimap and panels still work); this component
 * converts to/from a Leaflet view. Real coastlines + borders come from CARTO
 * tiles and Natural Earth GeoJSON; EVOLVE cells, agents, players and assets
 * overlay the geography at their real lat/lng positions.
 */
export default function EarthViewport({ cam, setCam, onSize }) {
  const { engine, say } = useEvolve();
  const wrapRef = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [mapInstance, setMapInstance] = useState(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const apply = () => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
      onSize?.({ w: el.clientWidth, h: el.clientHeight });
    };
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    apply();
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!engine) return <div className="ev-map" ref={wrapRef} />;

  const world = engine.world;
  const view = camToView(cam, world, size);

  const onCellClick = (x, y) => {
    if (!world.inBounds(x, y)) return;
    const res = engine.applyTool(x, y);
    if (res?.message) say(res.message, res.ok !== false);
  };

  return (
    <div className="ev-map" ref={wrapRef}>
      {size.w > 0 && (
        <MapContainer
          center={view.center}
          zoom={view.zoom}
          minZoom={2}
          maxZoom={11}
          zoomControl={false}
          attributionControl={false}
          preferCanvas
          worldCopyJump
          style={{ width: "100%", height: "100%", background: "#03080a" }}
          eventHandlers={{
            click: (e) => {
              const { lat, lng } = e.latlng;
              const g = { x: Math.floor(((lng + 180) / 360) * world.width), y: Math.floor(((90 - lat) / 180) * world.height) };
              onCellClick(g.x, g.y);
            },
          }}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" subdomains="abcd" />
          <BordersLayer />
          <CellsLayer world={world} selection={engine.selection} />
          <ActorsLayer engine={engine} onPick={onCellClick} />
          <MapBinder cam={cam} setCam={setCam} world={world} size={size} />
          <MapResize onSize={onSize} />
          <MapRef onReady={setMapInstance} />
        </MapContainer>
      )}

      <div className="ev-map-overlay" style={{ top: 8, right: 8, display: "flex", flexDirection: "column", gap: 5 }}>
        <ZoomButtons map={mapInstance} />
      </div>

      <div className="ev-coords">
        {world.width}×{world.height} · {cam.scale.toFixed(1)}× · {view.zoom.toFixed(1)}z
      </div>

      {engine.tool && engine.tool !== "OBSERVE" && (
        <div className="ev-map-overlay" style={{ top: 8, left: 8 }}>
          <div className="ev-overlay-card" style={{ padding: "5px 9px", fontSize: 9, letterSpacing: "0.12em", color: "#22d3ee", textTransform: "uppercase" }}>
            {engine.tool} tool · tap the world
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------- map binder
 * Two-way sync between the engine grid-cam and the Leaflet view, without loops.
 */
function MapBinder({ cam, setCam, world, size }) {
  const map = useMap();
  const lastRef = useRef(null);

  // cam -> map (external changes: minimap jump, country explore, etc.)
  useEffect(() => {
    const view = camToView(cam, world, size);
    const last = lastRef.current;
    if (!last) {
      map.setView(view.center, view.zoom, { animate: false });
      lastRef.current = view;
      return;
    }
    const moved =
      Math.abs(view.center[0] - last.center[0]) > 0.01 ||
      Math.abs(view.center[1] - last.center[1]) > 0.01 ||
      Math.abs(view.zoom - last.zoom) > 0.05;
    if (moved) {
      map.setView(view.center, view.zoom, { animate: false });
      lastRef.current = view;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cam]);

  // map -> cam
  useMapEvents({
    moveend: (e) => {
      const m = e.target;
      lastRef.current = { center: [m.getCenter().lat, m.getCenter().lng], zoom: m.getZoom() };
      setCam(viewToCam([m.getCenter().lat, m.getCenter().lng], m.getZoom(), world, size));
    },
    zoomend: (e) => {
      const m = e.target;
      lastRef.current = { center: [m.getCenter().lat, m.getCenter().lng], zoom: m.getZoom() };
      setCam(viewToCam([m.getCenter().lat, m.getCenter().lng], m.getZoom(), world, size));
    },
  });

  return null;
}

/* ----------------------------------------------------------- resize */
function MapResize({ onSize }) {
  const map = useMap();
  useEffect(() => {
    const handler = () => {
      map.invalidateSize();
      onSize?.({ w: map.getSize().x, h: map.getSize().y });
    };
    const id = setTimeout(handler, 200);
    return () => clearTimeout(id);
  }, [map, onSize]);
  return null;
}

/* ----------------------------------------------------------- borders */
function BordersLayer() {
  const [countries, setCountries] = useState(null);
  const [regions, setRegions] = useState(null);
  const [zoom, setZoom] = useState(2);

  useMapEvents({
    zoomend: (e) => setZoom(e.target.getZoom()),
  });

  useEffect(() => {
    loadCountries().then(setCountries);
  }, []);

  useEffect(() => {
    if (zoom >= 5 && !regions) loadRegions().then(setRegions);
  }, [zoom, regions]);

  return (
    <>
      {countries && (
        <GeoJSON
          key="countries"
          data={countries}
          style={{ color: "#3a5a7a", weight: 0.8, opacity: 0.7, fill: false, fillOpacity: 0 }}
        />
      )}
      {regions && (
        <GeoJSON
          key="regions"
          data={regions}
          style={{ color: "#2a3a4a", weight: 0.4, opacity: 0.5, fill: false, fillOpacity: 0 }}
        />
      )}
    </>
  );
}

/* ----------------------------------------------------------- cells overlay */
function CellsLayer({ world, selection }) {
  const [tick, setTick] = useState(0);
  useMapEvents({
    moveend: () => setTick((t) => t + 1),
    zoomend: () => setTick((t) => t + 1),
  });
  const map = useMap();

  const cells = useMemo(() => {
    if (!map) return [];
    const z = map.getZoom();
    if (z < 5) return [];
    const range = boundsToGridRange(map.getBounds(), world);
    const count = (range.x1 - range.x0 + 1) * (range.y1 - range.y0 + 1);
    if (count > 2500) return [];
    const out = [];
    for (let y = range.y0; y <= range.y1; y += 1) {
      for (let x = range.x0; x <= range.x1; x += 1) {
        const i = y * world.width + x;
        const ownerSlot = world.owner ? world.owner[i] : 0;
        const orgId = ownerSlot > 0 && world.orgSlots ? world.orgSlots[ownerSlot] : null;
        const biome = world.biome[i];
        out.push({
          x,
          y,
          b: cellBounds(x, y, world),
          color: orgId ? orgColor(orgId) : BIOMES[biome] ? BIOMES[biome].color : "#0a121e",
          org: !!orgId,
        });
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, world]);

  return (
    <>
      {cells.map((c) => (
        <Rectangle
          key={`${c.x},${c.y}`}
          bounds={c.b}
          pathOptions={{ color: c.org ? c.color : "rgba(120,160,200,0.12)", weight: c.org ? 0.5 : 0, fillColor: c.color, fillOpacity: 0.42 }}
        />
      ))}
      {selection && (
        <Rectangle
          bounds={cellBounds(selection.x, selection.y, world)}
          pathOptions={{ color: "#22d3ee", weight: 2, fill: false }}
        />
      )}
    </>
  );
}

/* ----------------------------------------------------------- actors overlay */
function ActorsLayer({ engine, onPick }) {
  const world = engine.world;
  const toLatLng = (p) => gridToLatLng((p.x || 0) + 0.5, (p.y || 0) + 0.5, world.width, world.height);

  return (
    <>
      {world.assets.map((a) => {
        const ll = toLatLng({ x: a.x, y: a.y });
        return (
          <CircleMarker
            key={a.sim_id}
            center={[ll.lat, ll.lng]}
            radius={4}
            pathOptions={{ color: ASSET_COLOR[a.kind] || "#94a3b8", fillColor: ASSET_COLOR[a.kind] || "#94a3b8", fillOpacity: 0.8, weight: 1 }}
            eventHandlers={{ click: () => onPick(a.x, a.y) }}
          />
        );
      })}
      {engine.agents.filter((a) => a.status !== "archived" && a.position).map((ag) => {
        const ll = toLatLng(ag.position);
        const org = ag.organization_id;
        return (
          <CircleMarker
            key={ag.id}
            center={[ll.lat, ll.lng]}
            radius={3}
            pathOptions={{ color: org ? orgColor(org) : "#e2e8f0", fillColor: org ? orgColor(org) : "#e2e8f0", fillOpacity: 0.9, weight: 1 }}
            eventHandlers={{ click: () => onPick(ag.position.x, ag.position.y) }}
          />
        );
      })}
      {(engine.players || []).filter((p) => p.position).map((pl) => {
        const ll = toLatLng(pl.position);
        const org = pl.organization_id;
        return (
          <CircleMarker
            key={pl.id}
            center={[ll.lat, ll.lng]}
            radius={5}
            pathOptions={{ color: "#22d3ee", fillColor: org ? orgColor(org) : "#22d3ee", fillOpacity: 0.95, weight: 2 }}
            eventHandlers={{ click: () => onPick(pl.position.x, pl.position.y) }}
          />
        );
      })}
    </>
  );
}

/* ----------------------------------------------------------- map ref */
function MapRef({ onReady }) {
  const map = useMap();
  useEffect(() => {
    onReady?.(map);
  }, [map, onReady]);
  return null;
}

/* ----------------------------------------------------------- zoom buttons */
function ZoomButtons({ map }) {
  const [layers, setLayers] = useState({ borders: true, cells: true });
  if (!map) return null;
  return (
    <div className="ev-overlay-card" style={{ display: "flex", flexDirection: "column", padding: 3, gap: 2 }}>
      <button className="ev-btn ev-btn-ghost" style={{ padding: 6 }} onClick={() => map.zoomIn()} title="Zoom in">
        <ZoomIn className="h-3.5 w-3.5" />
      </button>
      <button className="ev-btn ev-btn-ghost" style={{ padding: 6 }} onClick={() => map.zoomOut()} title="Zoom out">
        <ZoomOut className="h-3.5 w-3.5" />
      </button>
      <button
        className="ev-btn ev-btn-ghost"
        style={{ padding: 6 }}
        onClick={() => map.setView([20, 0], 3, { animate: true })}
        title="Centre the world"
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </button>
      <button
        className={`ev-btn ${layers.cells ? "" : "ev-btn-ghost"}`}
        style={{ padding: 6 }}
        onClick={() => setLayers((l) => ({ ...l, cells: !l.cells }))}
        title="Cell overlay"
      >
        <Layers className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}