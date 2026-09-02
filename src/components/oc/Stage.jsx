import React, { useRef, useState, useEffect } from "react";
import { propsAtTime } from "./useMotionEditor";

function Layer({ obj, time, selected, onPointerDown }) {
  const p = propsAtTime(obj, time);
  const w = obj.base.width, h = obj.base.height;
  const left = p.x - w / 2;
  const top = p.y - h / 2;
  const common = {
    position: "absolute",
    left, top, width: w, height: h,
    transform: `rotate(${p.rotation}deg) scale(${p.scale})`,
    transformOrigin: "center center",
    opacity: p.opacity,
    touchAction: "none",
  };
  let inner;
  if (obj.type === "text") {
    inner = (
      <div style={{
        width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
        textAlign: "center", color: obj.base.color, fontSize: obj.base.fontSize,
        fontFamily: '-apple-system, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
        fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.02em", whiteSpace: "pre-wrap",
        userSelect: "none", pointerEvents: "none",
      }}>{obj.base.text}</div>
    );
  } else if (obj.type === "rect") {
    inner = <div style={{ width: "100%", height: "100%", background: obj.base.color, borderRadius: obj.base.radius || 0 }} />;
  } else if (obj.type === "ellipse") {
    inner = <div style={{ width: "100%", height: "100%", background: obj.base.color, borderRadius: "50%" }} />;
  } else if (obj.type === "image") {
    inner = <img src={obj.base.src} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12, pointerEvents: "none" }} />;
  }
  return (
    <div
      style={common}
      onPointerDown={(e) => onPointerDown(e, obj.id)}
    >
      {inner}
      {selected && (
        <div style={{
          position: "absolute", inset: -1.5, borderRadius: obj.type === "ellipse" ? "50%" : (obj.type === "rect" ? (obj.base.radius || 0) + 2 : 12),
          boxShadow: "0 0 0 1.5px #0A84FF, 0 0 0 3px rgba(10,132,255,0.18)",
          pointerEvents: "none",
        }} />
      )}
    </div>
  );
}

export default function Stage({ editor }) {
  const { objects, selectedId, selectObject, setKeyframe, setPlaying, canvasW, canvasH } = editor;
  const wrapRef = useRef(null);
  const stageRef = useRef(null);
  const [scale, setScale] = useState(0.5);
  const dragRef = useRef(null);
  const live = useRef({ objects, time: editor.time });
  live.current = { objects, time: editor.time };

  useEffect(() => {
    const el = wrapRef.current; if (!el) return;
    const fit = () => {
      const pad = 56;
      const w = el.clientWidth - pad, h = el.clientHeight - pad;
      setScale(Math.max(0.05, Math.min(w / canvasW, h / canvasH)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [canvasW, canvasH]);

  const toLogical = (clientX, clientY) => {
    const r = stageRef.current.getBoundingClientRect();
    return { x: (clientX - r.left) * (canvasW / r.width), y: (clientY - r.top) * (canvasH / r.height) };
  };

  const onObjectPointerDown = (e, id) => {
    e.stopPropagation();
    selectObject(id);
    setPlaying(false);
    const o = live.current.objects.find((x) => x.id === id);
    const p = propsAtTime(o, live.current.time);
    const start = toLogical(e.clientX, e.clientY);
    dragRef.current = { id, start, origin: { x: p.x, y: p.y } };
  };

  useEffect(() => {
    const move = (e) => {
      const d = dragRef.current; if (!d) return;
      const cur = toLogical(e.clientX, e.clientY);
      const nx = d.origin.x + (cur.x - d.start.x);
      const ny = d.origin.y + (cur.y - d.start.y);
      setKeyframe(d.id, "x", live.current.time, nx);
      setKeyframe(d.id, "y", live.current.time, ny);
    };
    const up = () => { dragRef.current = null; };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [setKeyframe, canvasW, canvasH]);

  return (
    <div ref={wrapRef} className="relative flex-1 min-h-0 flex items-center justify-center"
      style={{ background: "#f5f5f7" }}
      onPointerDown={() => selectObject(null)}
    >
      <div
        ref={stageRef}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          width: canvasW, height: canvasH, transform: `scale(${scale})`, transformOrigin: "center center",
          background: "#ffffff", borderRadius: 14, boxShadow: "0 12px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
          position: "relative", overflow: "hidden",
        }}
      >
        {objects.map((o) => (
          <Layer key={o.id} obj={o} time={editor.time} selected={o.id === selectedId} onPointerDown={onObjectPointerDown} />
        ))}
      </div>
    </div>
  );
}