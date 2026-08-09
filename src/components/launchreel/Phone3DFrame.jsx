import React, { useRef, useState, useCallback, useEffect } from "react";

/**
 * Real 3D phone with physical thickness and a back casing.
 * Uses CSS 3D transforms (preserve-3d) with a front face, back face,
 * and four side walls to give real depth. Drag to orbit.
 */
export default function Phone3DFrame({
  videoUrl,
  autoRotate,
  rotX,
  rotY,
  setRotX,
  setRotY,
  zoom,
  setZoom,
  isPlaying,
  onPlayPause,
  textTemplate,
  device,
}) {
  const dragging = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const videoRef = useRef(null);
  const thickness = device?.thickness || 18;

  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.play();
    else videoRef.current.pause();
  }, [isPlaying]);

  const onPointerDown = (e) => {
    e.preventDefault();
    const p = e.touches ? e.touches[0] : e;
    dragging.current = { x: p.clientX, y: p.clientY, rx: rotX, ry: rotY };
    setIsDragging(true);
  };

  const onPointerMove = useCallback((e) => {
    if (!dragging.current) return;
    const p = e.touches ? e.touches[0] : e;
    setRotY(dragging.current.ry + (p.clientX - dragging.current.x) * 0.4);
    setRotX(dragging.current.rx - (p.clientY - dragging.current.y) * 0.4);
  }, [setRotX, setRotY]);

  const onPointerUp = useCallback(() => { dragging.current = null; setIsDragging(false); }, []);

  useEffect(() => {
    if (!isDragging) return;
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);
    window.addEventListener("touchmove", onPointerMove, { passive: false });
    window.addEventListener("touchend", onPointerUp);
    return () => {
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);
    };
  }, [isDragging, onPointerMove, onPointerUp]);

  const W = device?.width || 300;
  const H = device?.height || 620;
  const scale = zoom / 100;

  return (
    <div
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
      style={{ perspective: "1800px" }}
      onWheel={(e) => {
        e.preventDefault();
        setZoom(Math.max(40, Math.min(160, zoom - e.deltaY * 0.05)));
      }}
    >
      <style>{`
        @keyframes okml-autorot { from { transform: rotateY(0deg); } to { transform: rotateY(360deg); } }
      `}</style>

      <div
        onPointerDown={onPointerDown}
        className="relative cursor-grab active:cursor-grabbing"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${rotX}deg) rotateY(${autoRotate && !isDragging ? 0 : rotY}deg) scale(${scale})`,
          transition: isDragging ? "none" : "transform 0.15s ease-out",
          animation: autoRotate && !isDragging ? "okml-autorot 14s linear infinite" : "none",
        }}
      >
        {/* === FRONT FACE (screen) === */}
        <div
          className="absolute"
          style={{
            width: W, height: H,
            transform: `translateZ(${thickness / 2}px)`,
            transformStyle: "preserve-3d",
          }}
        >
          <PhoneBody W={W} H={H} />
          <PhoneScreen W={W} H={H} videoUrl={videoUrl} videoRef={videoRef} textTemplate={textTemplate} isPlaying={isPlaying} onPlayPause={onPlayPause} />
        </div>

        {/* === BACK FACE === */}
        <div
          className="absolute rounded-[2.5rem]"
          style={{
            width: W, height: H,
            transform: `translateZ(${-thickness / 2}px) rotateY(180deg)`,
            background: "linear-gradient(145deg, #2a2a2e 0%, #18181b 50%, #0a0a0c 100%)",
            boxShadow: "inset 0 0 4px rgba(255,255,255,0.05)",
          }}
        >
          {/* Camera module */}
          <div className="absolute top-5 left-5 w-20 h-20 rounded-2xl bg-black/80 border border-zinc-700 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-1.5">
              <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-600" />
              <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-600" />
              <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-600" />
              <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-600" />
            </div>
          </div>
          {/* Logo area (subtle) */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-zinc-700 text-[10px] font-bold tracking-widest">
            {device?.brand || "DEVICE"}
          </div>
        </div>

        {/* === SIDE WALLS (thickness) === */}
        {/* Top */}
        <div className="absolute bg-zinc-800" style={{ width: W, height: thickness, transform: `rotateX(90deg) translateZ(${H / 2}px)`, top: 0, left: 0 }} />
        {/* Bottom */}
        <div className="absolute bg-zinc-800" style={{ width: W, height: thickness, transform: `rotateX(-90deg) translateZ(${H / 2}px)`, bottom: 0, left: 0 }} />
        {/* Left */}
        <div className="absolute bg-zinc-800" style={{ width: thickness, height: H, transform: `rotateY(-90deg) translateZ(${W / 2}px)`, top: 0, left: 0 }} />
        {/* Right */}
        <div className="absolute bg-zinc-800" style={{ width: thickness, height: H, transform: `rotateY(90deg) translateZ(${W / 2}px)`, top: 0, right: 0 }} />

        {/* Physical buttons */}
        <div className="absolute bg-zinc-700" style={{ width: 3, height: 48, right: -2, top: 140, transform: "rotateY(90deg)" }} />
        <div className="absolute bg-zinc-700" style={{ width: 3, height: 80, right: -2, top: 200, transform: "rotateY(90deg)" }} />
      </div>
    </div>
  );
}

function PhoneBody({ W, H }) {
  return (
    <div
      className="absolute inset-0 rounded-[2.5rem] bg-zinc-900"
      style={{ boxShadow: "0 0 60px rgba(0,0,0,0.7), inset 0 0 2px rgba(255,255,255,0.08)" }}
    />
  );
}

function PhoneScreen({ W, H, videoUrl, videoRef, textTemplate, isPlaying, onPlayPause }) {
  return (
    <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden" style={{ padding: 12 }}>
      <div className="relative w-full h-full rounded-[2rem] overflow-hidden bg-black">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover"
            loop
            muted
            playsInline
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">No video</div>
        )}

        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-zinc-900 rounded-b-2xl z-30" />

        {/* Text template overlay ON the screen */}
        {textTemplate && <TextOverlay template={textTemplate} />}
      </div>

      {/* Glass reflection */}
      <div
        className="absolute inset-0 rounded-[2.5rem] pointer-events-none"
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.03) 100%)" }}
      />
    </div>
  );
}

function TextOverlay({ template }) {
  if (!template) return null;
  const pos = template.position || "bottom";
  const posClass = {
    bottom: "bottom-8",
    top: "top-12",
    center: "top-1/2 -translate-y-1/2",
  }[pos] || "bottom-8";

  return (
    <div className={`absolute ${posClass} left-0 right-0 px-6 text-center z-20`}>
      {template.style === "title" && (
        <h2 className="text-white text-2xl font-black tracking-tight drop-shadow-lg" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
          {template.text}
        </h2>
      )}
      {template.style === "subtitle" && (
        <p className="text-white/90 text-sm font-semibold tracking-wide" style={{ textShadow: "0 2px 6px rgba(0,0,0,0.8)" }}>
          {template.text}
        </p>
      )}
      {template.style === "caption" && (
        <span className="inline-block bg-black/75 text-white text-[13px] font-semibold px-3 py-1.5 rounded-md">
          {template.text}
        </span>
      )}
      {template.style === "badge" && (
        <span className="inline-block bg-white text-black text-[11px] font-black px-3 py-1 rounded-full">
          {template.text}
        </span>
      )}
    </div>
  );
}