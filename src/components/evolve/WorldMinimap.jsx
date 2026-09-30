import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Plus, Minus, Locate } from "lucide-react";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { camToView, viewToCam, gridToLatLng, loadLand50, loadCountries110 } from "@/lib/evolve/geoService";
import { initialStyle, EVOLVE_COLORS, registerPmtilesProtocol, addLandLayer, addCountryBorders } from "@/lib/evolve/evolveMapStyle";

/**
 * The minimap is a world OVERVIEW: it always shows the whole planet, so the
 * viewport rectangle always means something and you can never lose the camera.
 *
 * It is deliberately NOT a second copy of the main camera. Mirroring the main
 * camera into it at a fixed zoom offset meant that at high zoom the "minimap"
 * showed a few degrees of ocean, and because MapLibre clamps a camera against
 * its bounds, every mirrored move could be misread as the user navigating the
 * minimap — which dragged the main camera outward until both views sat on an
 * empty corner of the world.
 */
const WORLD_ZOOM = -0.9;

export default function WorldMinimap({ cam, setCam, mapSize }) {
  const { engine } = useEvolve();
  const ref = useRef(null);
  const mapRef = useRef(null);
  const world = engine?.world;

  // Read by the map's event handlers, which outlive any single render.
  const camRef = useRef(cam);
  const sizeRef = useRef(mapSize);
  const worldRef = useRef(world);
  camRef.current = cam;
  sizeRef.current = mapSize;
  worldRef.current = world;

  /* build the world overview once */
  useEffect(() => {
    if (!world || !ref.current || mapRef.current) return undefined;
    registerPmtilesProtocol();
    const map = new maplibregl.Map({
      container: ref.current,
      style: initialStyle(),
      center: [0, 0],
      zoom: WORLD_ZOOM,
      minZoom: WORLD_ZOOM,
      maxZoom: 5,
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
        paint: { "fill-color": EVOLVE_COLORS.cell, "fill-opacity": 0.12 },
      });
      map.addLayer({
        id: "ev-mini-view-line",
        type: "line",
        source: "ev-mini-view",
        paint: { "line-color": EVOLVE_COLORS.cell, "line-width": 1.4 },
      });
      map.resize();
    });

    // Clicking a place on the overview moves the main camera there and keeps the
    // main zoom. This is the ONLY way the minimap writes to the camera, so the
    // two can never chase each other.
    map.on("click", (e) => {
      const w = worldRef.current;
      const size = sizeRef.current;
      if (!w || !size?.w || !size?.h) return;
      const zoom = camToView(camRef.current, w, size).zoom;
      setCam(viewToCam([e.lngLat.lat, e.lngLat.lng], zoom, w, size));
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world]);

  /* draw where the main camera is looking */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !world || !mapSize?.w || !mapSize?.h) return;
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

  if (!engine || !world) return null;

  return (
    <div className="ev-section">
      <div className="ev-row" style={{ marginBottom: 6 }}>
        <span className="ev-label">Minimap · tap to jump</span>
        <div style={{ display: "flex", gap: 3 }}>
          <button className="ev-btn ev-btn-ghost" style={{ padding: 4 }} onClick={() => setCam((p) => ({ ...p, scale: Math.min((256 * 8192) / world.width, p.scale * 1.6) }))} title="Zoom in">
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
              setCam({ scale: 6, x: world.width / 2 - (mapSize?.w || 400) / 12, y: world.height / 2 - (mapSize?.h || 300) / 12 })
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