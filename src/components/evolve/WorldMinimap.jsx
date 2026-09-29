import React, { useEffect, useRef } from "react";
import { Plus, Minus, Locate } from "lucide-react";
import { drawMinimap } from "./worldRenderer";
import { useEvolve } from "@/lib/evolve/useEvolve";

/** Whole-world preview with the camera rectangle, plus zoom and centre. */
export default function WorldMinimap({ cam, setCam, mapSize }) {
  const { engine } = useEvolve();
  const ref = useRef(null);

  useEffect(() => {
    const c = ref.current;
    if (!c || !engine?.world) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.floor(c.clientWidth * dpr);
    c.height = Math.floor(c.clientHeight * dpr);
    drawMinimap(c, { world: engine.world, cam, viewW: mapSize?.w, viewH: mapSize?.h, dpr });
  });

  const jump = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    const w = engine.world;
    const scale = cam.scale;
    setCam({
      scale,
      x: Math.max(0, Math.min(w.width - (mapSize?.w || 400) / scale, fx * w.width - (mapSize?.w || 400) / scale / 2)),
      y: Math.max(0, Math.min(w.height - (mapSize?.h || 300) / scale, fy * w.height - (mapSize?.h || 300) / scale / 2)),
    });
  };

  return (
    <div className="ev-section">
      <div className="ev-row" style={{ marginBottom: 6 }}>
        <span className="ev-label">Minimap</span>
        <div style={{ display: "flex", gap: 3 }}>
          <button className="ev-btn ev-btn-ghost" style={{ padding: 4 }} onClick={() => setCam((p) => ({ ...p, scale: Math.min(26, p.scale * 1.3) }))} title="Zoom in">
            <Plus className="h-3 w-3" />
          </button>
          <button className="ev-btn ev-btn-ghost" style={{ padding: 4 }} onClick={() => setCam((p) => ({ ...p, scale: Math.max(1.6, p.scale / 1.3) }))} title="Zoom out">
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
      <canvas ref={ref} className="ev-minimap" onClick={jump} />
    </div>
  );
}