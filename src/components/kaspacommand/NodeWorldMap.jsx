import React from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { COUNTRY_CENTROIDS } from "@/components/kaspacommand/countryCentroids";

// Dark tactical world map plotting live Kaspa node counts per country
export default function NodeWorldMap({ countries }) {
  const entries = Object.entries(countries || {}).filter(([code]) => COUNTRY_CENTROIDS[code]);
  const max = Math.max(1, ...entries.map(([, n]) => n));

  return (
    <MapContainer center={[25, 10]} zoom={2} minZoom={2} maxZoom={7} scrollWheelZoom
      className="w-full h-full" style={{ background: "#03080a" }} attributionControl={false} zoomControl={false}>
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
      {entries.map(([code, count]) => {
        const [lat, lng] = COUNTRY_CENTROIDS[code];
        const r = 5 + Math.sqrt(count / max) * 22;
        return (
          <React.Fragment key={code}>
            <CircleMarker center={[lat, lng]} radius={r}
              pathOptions={{ color: "#2dd4bf", weight: 1, fillColor: "#14b8a6", fillOpacity: 0.25 }} />
            <CircleMarker center={[lat, lng]} radius={3}
              pathOptions={{ color: "#5eead4", weight: 1.5, fillColor: "#5eead4", fillOpacity: 0.95 }}>
              <Tooltip direction="top" opacity={1}>
                <span style={{ fontFamily: "monospace", fontSize: 11 }}>
                  <b>{code}</b> · {count} node{count !== 1 ? "s" : ""}
                </span>
              </Tooltip>
            </CircleMarker>
          </React.Fragment>
        );
      })}
    </MapContainer>
  );
}