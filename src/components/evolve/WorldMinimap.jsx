import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Plus, Minus, Locate } from "lucide-react";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { camToView, viewToCam, gridToLatLng, toValidLngLat, loadLand50, loadCountries110 } from "@/lib/evolve/geoService";
import { initialStyle, EVOLVE_COLORS, registerPmtilesProtocol, addLandLayer, addCountryBorders } from "@/lib/evolve/evolveMapStyle";

/**
 * The minimap shows a WIDER slice of the same Earth than the main viewport, so
 * its own zoom sits this many levels below the main map's.
 */
const MINI_ZOOM_OFFSET = 2.5;
const MINI_MAX_ZOOM = 11 - MINI_ZOOM_OFFSET;

/**
 * WorldMinimap — the main map in miniature.
 *
 * It renders the SAME self-hosted Earth basemap the main viewport uses (land +
 * country borders), draws the current viewport rectangle on top, and is fully
 * interactive: dragging or zooming the minimap moves the main camera. It is a
 * navigation control, not a picture of a different world.
 */
export default function WorldMinimap({ cam, setCam, mapSize }) {
  const { engine } = useEvolve();
  const ref = useRef(null);
  const mapRef = useRef(null);
  // The view we last pushed INTO the minimap. A move we caused ourselves must
  // not be read back as user navigation — that ping-pong dragged the main
  // camera around (and upward) on its own.
  const pushedRef = useRef(null);
  const world = engine?.world;

  /* build the mini map once */
  useEffect(() => {
    if (!world || !ref.current || mapRef.current) return undefined;
    registerPmtilesProtocol();
    const map = new maplibregl.Map({
      container: ref.current,
      style: initialStyle(),
      center: [0, 20],
      zoom: 1,
      minZoom: 0,
      maxZoom: MINI_MAX_ZOOM,
      maxBounds: [[-180, -85], [180, 85]],
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
    });
    mapRef.current = map;

    map.on("load", async () => {
      const [land, c110] = await Promise.all([loadLand50(), loadCountries110()]);
      addLandLayer(map, land);
      addCountryBorders(map, c110, { id: "ev-mini-countries", minzoom: 0, maxzoom: 6, color: EVOLVE_COLORS.border, width: 0.5 });
      map.addSource("ev-mini-view", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "ev-mini-view-fill",
        type: "fill",
        source: "ev-mini-view",
        paint: { "fill-color": EVOLVE_COLORS.cell, "fill-opacity": 0.1 },
      });
      map.addLayer({
        id: "ev-mini-view-line",
        type: "line",
        source: "ev-mini-view",
        paint: { "line-color": EVOLVE_COLORS.cell, "line-width": 1.4 },
      });
    });

    map.on("moveend", () => onMiniMoveEnd(map));
    map.on("zoomend", () => onMiniMoveEnd(map));

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world]);

  /* mirror the main camera and redraw the viewport rectangle */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !world || !mapSize?.w || !mapSize?.h) return;

    const view = camToView(cam, world, mapSize);
    const zoom = Math.max(0, Math.min(MINI_MAX_ZOOM, view.zoom - MINI_ZOOM_OFFSET));
    const center = toValidLngLat(view.center[1], view.center[0]);
    if (center) {
      const cur = map.getCenter();
      if (Math.abs(cur.lng - center[0]) > 0.01 || Math.abs(cur.lat - center[1]) > 0.01 || Math.abs(map.getZoom() - zoom) > 0.05) {
        pushedRef.current = { lng: center[0], lat: center[1], zoom };
        map.jumpTo({ center, zoom });
      }
    }

    const src = map.getSource("ev-mini-view");
    if (!src) return;
    const scale = cam.scale > 0 ? cam.scale : 6;
    const vw = mapSize.w / scale;
    const vh = mapSize.h / scale;
    const nw = gridToLatLng(cam.x, cam.y, world.width, world.height);
    const se = gridToLatLng(cam.x + vw, cam.y + vh, world.width, world.height);
    const west = Math.max(-180, Math.min(180, nw.lng));
    const east = Math.max(-180, Math.min(180, se.lng));
    const north = Math.max(-85, Math.min(85, nw.lat));
    const south = Math.max(-85, Math.min(85, se.lat));
    src.setData({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: [[[west, north], [east, north], [east, south], [west, south], [west, north]]],
          },
        },
      ],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cam, world, mapSize]);

  /* user panned/zoomed the minimap → move the main camera */
  function onMiniMoveEnd(map) {
    if (!world || !mapSize?.w || !mapSize?.h) return;
    const c = map.getCenter();
    const pushed = pushedRef.current;
    pushedRef.current = null;
    if (
      pushed &&
      Math.abs(pushed.lng - c.lng) < 0.02 &&
      Math.abs(pushed.lat - c.lat) < 0.02 &&
      Math.abs(pushed.zoom - map.getZoom()) < 0.05
    ) {
      return; // our own push, not the user moving the minimap
    }
    const next = viewToCam([c.lat, c.lng], map.getZoom() + MINI_ZOOM_OFFSET, world, mapSize);
    // Bail out when the camera already matches, so mirroring the main map back
    // into the minimap can never ping-pong between the two.
    setCam((prev) =>
      Math.abs(prev.x - next.x) < 0.6 && Math.abs(prev.y - next.y) < 0.6 && Math.abs(prev.scale - next.scale) < 0.05 ? prev : next
    );
  }

  if (!engine || !world) return null;

  return (
    <div className="ev-section">
      <div className="ev-row" style={{ marginBottom: 6 }}>
        <span className="ev-label">Minimap</span>
        <div style={{ display: "flex", gap: 3 }}>
          <button className="ev-btn ev-btn-ghost" style={{ padding: 4 }} onClick={() => setCam((p) => ({ ...p, scale: Math.min(world.width > 0 ? (256 * 8192) / world.width : p.scale, p.scale * 1.6) }))} title="Zoom in">
            <Plus className="h-3 w-3" />
          </button>
          <button className="ev-btn ev-btn-ghost" style={{ padding: 4 }} onClick={() => setCam((p) => ({ ...p, scale: Math.max((256 * 4) / world.width, p.scale / 1.6) }))} title="Zoom out">
            <Minus className="h-3 w-3" />
          </button>
          <button
            className="ev-btn ev-btn-ghost"
            style={{ padding: 4 }}
            title="Centre the world"
            onClick={() =>
              setCam({ scale: 6, x: engine.world.width / 2 - (mapSize?.w || 400) / 12, y: engine.world.height / 2 - (mapSize?.h || 300) / 12 })
            }
          >
            <Locate className="h-3 w-3" />
          </button>
        </div>
      </div>
      <div ref={ref} className="ev-minimap" />
    </div>
  );
}