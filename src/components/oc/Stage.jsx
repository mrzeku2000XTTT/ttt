import React, { useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { propsAtTime } from "./useMotionEditor";
import { Minimize2, SlidersHorizontal } from "lucide-react";
import AddMenu from "./AddMenu";

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
    <div style={common} onPointerDown={(e) => onPointerDown(e, obj.id)}>
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

export default function Stage({ editor, fullscreen, onToggleFullscreen, onOpenInspector }) {
  const { objects, selectedId, selectObject, setKeyframe, setPlaying, setRecording, addObject, setCanvasSize, canvasW, canvasH } = editor;
  const wrapRef = useRef(null);
  const fitRef = useRef(null);
  const stageRef = useRef(null);
  const dragRef = useRef(null);
  const live = useRef({ objects, time: editor.time });
  live.current = { objects, time: editor.time };

  // The canvas fills the available area exactly (no scale/transform), so it
  // always renders visibly on every screen size. Its coordinate space is set
  // to the measured pixel size of the stage area.
  useEffect(() => {
    const el = fitRef.current; if (!el) return;
    const fit = () => {
      const aw = el.clientWidth - 16;   // px-2 (8px each side)
      const ah = el.clientHeight - 72;  // pt-2 (8) + pb-16 (64) reserved for the Add button
      if (aw <= 10 || ah <= 10) return;
      setCanvasSize(aw, ah);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fullscreen, setCanvasSize]);

  const toLogical = (clientX, clientY) => {
    const r = stageRef.current.getBoundingClientRect();
    return { x: (clientX - r.left) * (canvasW / r.width), y: (clientY - r.top) * (canvasH / r.height) };
  };

  // Drag = record mode: the playhead auto-advances and each position is
  // written as a keyframe, so one drag paints a real motion path.
  const onObjectPointerDown = (e, id) => {
    e.stopPropagation();
    selectObject(id);
    setPlaying(false);
    const o = live.current.objects.find((x) => x.id === id);
    const p = propsAtTime(o, live.current.time);
    const start = toLogical(e.clientX, e.clientY);
    dragRef.current = { id, start, origin: { x: p.x, y: p.y }, recording: false };
  };

  useEffect(() => {
    const move = (e) => {
      const d = dragRef.current; if (!d) return;
      if (!d.recording) {
        d.recording = true;
        setRecording(true);
        setKeyframe(d.id, "x", live.current.time, d.origin.x);
        setKeyframe(d.id, "y", live.current.time, d.origin.y);
      }
      const cur = toLogical(e.clientX, e.clientY);
      const nx = d.origin.x + (cur.x - d.start.x);
      const ny = d.origin.y + (cur.y - d.start.y);
      setKeyframe(d.id, "x", live.current.time, nx);
      setKeyframe(d.id, "y", live.current.time, ny);
    };
    const up = () => {
      if (dragRef.current?.recording) setRecording(false);
      dragRef.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [setKeyframe, setRecording, canvasW, canvasH]);

  const onDrop = async (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith("image/")) {
      try {
        const res = await base44.integrations.Core.UploadFile({ file: f });
        addObject("image", { src: res?.file_url || res?.url });
      } catch { /* ignore */ }
    }
  };

  return (
    <div ref={wrapRef} className="relative flex-1 min-h-0 flex flex-col"
      style={{ background: fullscreen ? "#000" : "#f5f5f7" }}
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <div ref={fitRef} className="flex-1 min-h-0 px-2 pt-2 pb-16"
        onPointerDown={() => selectObject(null)}
      >
        <div ref={stageRef} onPointerDown={(e) => e.stopPropagation()} style={{
          width: "100%", height: "100%",
          background: "#ffffff", borderRadius: 14,
          boxShadow: "0 12px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
          border: "1px solid rgba(0,0,0,0.08)",
          position: "relative", overflow: "hidden", touchAction: "none",
        }}>
          {objects.map((o) => (
            <Layer key={o.id} obj={o} time={editor.time} selected={o.id === selectedId} onPointerDown={onObjectPointerDown} />
          ))}
        </div>
      </div>

      {editor.recording && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500 text-white text-[11px] font-semibold pointer-events-none z-30">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> REC
        </div>
      )}

      {fullscreen && (
        <button onClick={onToggleFullscreen} title="Exit fullscreen"
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/80 backdrop-blur-xl shadow-sm hover:bg-white flex items-center justify-center text-[#1d1d1f] z-30">
          <Minimize2 className="w-4 h-4" />
        </button>
      )}

      {!fullscreen && (
        <button onClick={onOpenInspector}
          className="md:hidden absolute bottom-4 left-4 flex items-center gap-1.5 h-10 px-3.5 rounded-full bg-white/90 backdrop-blur-xl text-[#1d1d1f] text-[13px] font-medium shadow-sm z-30"
          style={{ fontFamily: '-apple-system, system-ui, sans-serif' }}>
          <SlidersHorizontal className="w-4 h-4" /> Properties
        </button>
      )}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
        <AddMenu editor={editor} />
      </div>
    </div>
  );
}