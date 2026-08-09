import React, { useRef, useState, useCallback, useEffect } from "react";

/**
 * CSS-3D phone frame that wraps a video element.
 * Drag to orbit · scroll to zoom · auto-rotation optional.
 * Inspired by OriginKit's interactive 3D components.
 */
export default function Phone3DFrame({ videoUrl, autoRotate, rotX, rotY, setRotX, setRotY, zoom, setZoom, captionText }) {
  const dragging = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const videoRef = useRef(null);

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

  const scale = zoom / 100;

  return (
    <div
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
      style={{ perspective: "1400px" }}
      onWheel={(e) => {
        e.preventDefault();
        setZoom(Math.max(40, Math.min(160, zoom - e.deltaY * 0.05)));
      }}
    >
      {/* Auto-rotation animation */}
      <style>{`
        @keyframes okml-autorot { from { transform: rotateY(0deg); } to { transform: rotateY(360deg); } }
      `}</style>

      <div
        onPointerDown={onPointerDown}
        className="relative cursor-grab active:cursor-grabbing"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${rotX}deg) rotateY(${autoRotate && !isDragging ? 0 : rotY}deg) scale(${scale})`,
          transition: isDragging ? "none" : "transform 0.1s ease-out",
          animation: autoRotate && !isDragging ? "okml-autorot 12s linear infinite" : "none",
        }}
      >
        {/* Phone body */}
        <div
          className="relative rounded-[2.5rem] bg-zinc-900 shadow-2xl"
          style={{
            width: "300px",
            height: "620px",
            padding: "14px",
            boxShadow: "0 0 60px rgba(0,0,0,0.6), inset 0 0 2px rgba(255,255,255,0.1)",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Side buttons */}
          <div className="absolute -right-[3px] top-32 w-[3px] h-12 bg-zinc-700 rounded-r" />
          <div className="absolute -right-[3px] top-48 w-[3px] h-20 bg-zinc-700 rounded-r" />
          <div className="absolute -left-[3px] top-40 w-[3px] h-16 bg-zinc-700 rounded-l" />

          {/* Screen */}
          <div className="relative w-full h-full rounded-[2rem] overflow-hidden bg-black">
            {videoUrl ? (
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">
                No video
              </div>
            )}

            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-zinc-900 rounded-b-2xl z-20" />

            {/* Caption overlay inside screen */}
            {captionText && (
              <div className="absolute bottom-8 left-0 right-0 px-4 text-center z-10">
                <span className="inline-block bg-black/70 text-white text-[13px] font-semibold px-3 py-1.5 rounded-lg leading-snug">
                  {captionText}
                </span>
              </div>
            )}
          </div>

          {/* Glass reflection */}
          <div
            className="absolute inset-0 rounded-[2.5rem] pointer-events-none"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.04) 100%)",
            }}
          />
        </div>
      </div>

      {/* Hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-white/30 flex items-center gap-3">
        <span>Drag to orbit</span>
        <span>·</span>
        <span>Scroll to zoom</span>
      </div>
    </div>
  );
}