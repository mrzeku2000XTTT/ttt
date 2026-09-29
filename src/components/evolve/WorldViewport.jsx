import React, { useCallback, useEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut, Maximize2, Layers } from "lucide-react";
import { drawWorld } from "./worldRenderer";
import { useEvolve } from "@/lib/evolve/useEvolve";

const MIN_SCALE = 1.6;
const MAX_SCALE = 26;

/**
 * WorldViewport — pan, zoom and every tap on the world.
 * The canvas is drawn imperatively; React never re-renders per tile.
 */
export default function WorldViewport({ cam, setCam }) {
  const { engine, say } = useEvolve();
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hover, setHover] = useState(null);
  const [layers, setLayers] = useState({ territory: true, agents: true, grid: false });
  const drag = useRef(null);
  const pointers = useRef(new Map());
  const pinch = useRef(null);

  /* ------------------------------------------------------------- sizing */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !size.w) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.floor(size.w * dpr);
    c.height = Math.floor(size.h * dpr);
    c.__dpr = dpr;
  }, [size]);

  /* -------------------------------------------------------------- paint */
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !engine) return;
    drawWorld(c, {
      world: engine.world,
      cam,
      dpr: c.__dpr || 1,
      selection: engine.selection,
      hover,
      pendingTarget: engine.pendingTarget,
      agents: engine.agents,
      showTerritory: layers.territory,
      showAgents: layers.agents,
      showGrid: layers.grid,
    });
  });

  const clamp = useCallback((next) => {
    const w = engine?.world;
    if (!w) return next;
    const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, next.scale));
    const maxX = Math.max(0, w.width - size.w / scale);
    const maxY = Math.max(0, w.height - size.h / scale);
    return {
      scale,
      x: Math.max(0, Math.min(maxX, next.x)),
      y: Math.max(0, Math.min(maxY, next.y)),
    };
  }, [engine, size]);

  const toTile = useCallback(
    (clientX, clientY) => {
      const rect = wrapRef.current.getBoundingClientRect();
      const x = Math.floor((clientX - rect.left) / cam.scale + cam.x);
      const y = Math.floor((clientY - rect.top) / cam.scale + cam.y);
      return { x, y };
    },
    [cam]
  );

  const zoomAt = useCallback(
    (factor, cx, cy) => {
      setCam((prev) => {
        const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale * factor));
        const wx = (cx - (wrapRef.current?.getBoundingClientRect().left || 0)) / prev.scale + prev.x;
        const wy = (cy - (wrapRef.current?.getBoundingClientRect().top || 0)) / prev.scale + prev.y;
        return clamp({ scale, x: wx - cx / scale + (wrapRef.current?.getBoundingClientRect().left || 0) / scale, y: wy - cy / scale + (wrapRef.current?.getBoundingClientRect().top || 0) / scale });
      });
    },
    [clamp, setCam]
  );

  /* ----------------------------------------------------------- pointers */
  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), scale: cam.scale };
      drag.current = null;
      return;
    }
    drag.current = { x: e.clientX, y: e.clientY, camX: cam.x, camY: cam.y, moved: false };
  };

  const onPointerMove = (e) => {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pinch.current && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      setCam((prev) => clamp({ ...prev, scale: pinch.current.scale * (d / pinch.current.dist) }));
      return;
    }

    if (drag.current) {
      const dx = e.clientX - drag.current.x;
      const dy = e.clientY - drag.current.y;
      if (Math.abs(dx) + Math.abs(dy) > 5) drag.current.moved = true;
      if (drag.current.moved) {
        setCam((prev) =>
          clamp({ ...prev, x: drag.current.camX - dx / prev.scale, y: drag.current.camY - dy / prev.scale })
        );
      }
      return;
    }

    const t = toTile(e.clientX, e.clientY);
    if (engine?.world.inBounds(t.x, t.y)) setHover(t);
    else setHover(null);
  };

  const onPointerUp = (e) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;

    if (drag.current && !drag.current.moved) {
      const t = toTile(e.clientX, e.clientY);
      const res = engine.applyTool(t.x, t.y);
      if (res?.message) say(res.message, res.ok !== false);
    }
    drag.current = null;
  };

  const onWheel = (e) => {
    e.preventDefault();
    zoomAt(e.deltaY < 0 ? 1.14 : 1 / 1.14, e.clientX, e.clientY);
  };

  const recenter = () => {
    const w = engine?.world;
    if (!w) return;
    setCam(clamp({ scale: 6, x: w.width / 2 - size.w / 12, y: w.height / 2 - size.h / 12 }));
  };

  useEffect(() => {
    if (!size.w || !engine?.world) return;
    if (cam.x === 0 && cam.y === 0) recenter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.w, size.h]);

  return (
    <div className="ev-map" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        className="ev-canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onPointerLeave={() => setHover(null)}
      />

      <div className="ev-map-overlay" style={{ top: 8, right: 8, display: "flex", flexDirection: "column", gap: 5 }}>
        <div className="ev-overlay-card" style={{ display: "flex", flexDirection: "column", padding: 3, gap: 2 }}>
          <button className="ev-btn ev-btn-ghost" style={{ padding: 6 }} onClick={() => zoomAt(1.25, (wrapRef.current?.getBoundingClientRect().left || 0) + size.w / 2, (wrapRef.current?.getBoundingClientRect().top || 0) + size.h / 2)} title="Zoom in">
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button className="ev-btn ev-btn-ghost" style={{ padding: 6 }} onClick={() => zoomAt(1 / 1.25, (wrapRef.current?.getBoundingClientRect().left || 0) + size.w / 2, (wrapRef.current?.getBoundingClientRect().top || 0) + size.h / 2)} title="Zoom out">
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button className="ev-btn ev-btn-ghost" style={{ padding: 6 }} onClick={recenter} title="Centre the world">
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button
            className={`ev-btn ${layers.territory ? "" : "ev-btn-ghost"}`}
            style={{ padding: 6 }}
            onClick={() => setLayers((l) => ({ ...l, territory: !l.territory }))}
            title="Faction territory overlay"
          >
            <Layers className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="ev-coords">
        {engine?.world.width}×{engine?.world.height} · {cam.scale.toFixed(1)}× ·{" "}
        {hover ? `${hover.x},${hover.y}` : "—"}
      </div>

      {engine?.tool && engine.tool !== "OBSERVE" && (
        <div className="ev-map-overlay" style={{ top: 8, left: 8 }}>
          <div className="ev-overlay-card" style={{ padding: "5px 9px", fontSize: 9, letterSpacing: "0.12em", color: "#22d3ee", textTransform: "uppercase" }}>
            {engine.tool} tool · tap the world
          </div>
        </div>
      )}
    </div>
  );
}