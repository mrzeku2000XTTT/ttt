import React from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Dark tactical world map — every public Kaspa node plotted at its exact coordinates
export default function NodeWorldMap({ nodes, onSelect, earthquakes, showNodes = true, showQuakes = false }) {
  return (
    <MapContainer center={[25, 10]} zoom={2} minZoom={2} maxZoom={12} scrollWheelZoom
      className="w-full h-full" style={{ background: "#03080a" }} attributionControl={false} zoomControl={false}>
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
      {showQuakes && (earthquakes || []).map((q, i) => (
        <CircleMarker key={`q${i}`} center={[q.lat, q.lon]} radius={Math.max(4, (q.mag || 3) * 2)}
          pathOptions={{ color: "#fb923c", weight: 1, fillColor: "#f97316", fillOpacity: 0.5 }}>
          <Tooltip direction="top" opacity={1}>
            <span style={{ fontFamily: "monospace", fontSize: 11 }}>
              <b>🌋 M{q.mag}</b><br />{q.place}<br />DEPTH {q.depth?.toFixed(0)} KM
            </span>
          </Tooltip>
        </CircleMarker>
      ))}
      {showNodes && (nodes || []).map((n, i) => (
        <CircleMarker key={i} center={[n.lat, n.lon]} radius={4}
          pathOptions={{ color: "#2dd4bf", weight: 1, fillColor: "#5eead4", fillOpacity: 0.85 }}
          eventHandlers={{ click: () => onSelect?.({ ...n, index: i }) }}>
          <Tooltip direction="top" opacity={1}>
            <span style={{ fontFamily: "monospace", fontSize: 11 }}>
              <b>{n.country}{n.city ? `/${n.city}` : ""}</b><br />{n.version}
            </span>
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}