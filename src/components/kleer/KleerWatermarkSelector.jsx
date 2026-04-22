import React, { useRef, useState, useEffect } from "react";
import { Play, Pause } from "lucide-react";

/**
 * Lets the user draw a box over the video to mark the watermark region.
 * Reports coordinates in the video's native pixel space (not CSS pixels).
 */
export default function KleerWatermarkSelector({ videoUrl, onBoxChange, onDimsChange }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [videoDims, setVideoDims] = useState({ width: 0, height: 0 });
  const [drawing, setDrawing] = useState(false);
  const [startPt, setStartPt] = useState(null);
  const [box, setBox] = useState(null); // CSS pixel coords relative to container

  const onLoaded = () => {
    const v = videoRef.current;
    if (!v) return;
    const dims = { width: v.videoWidth, height: v.videoHeight };
    setVideoDims(dims);
    onDimsChange?.(dims);
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  };

  const getPos = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: Math.max(0, Math.min(rect.width, clientX - rect.left)),
      y: Math.max(0, Math.min(rect.height, clientY - rect.top)),
    };
  };

  const handleDown = (e) => {
    e.preventDefault();
    const pos = getPos(e);
    setStartPt(pos);
    setBox({ x: pos.x, y: pos.y, w: 0, h: 0 });
    setDrawing(true);
  };

  const handleMove = (e) => {
    if (!drawing || !startPt) return;
    e.preventDefault();
    const pos = getPos(e);
    setBox({
      x: Math.min(startPt.x, pos.x),
      y: Math.min(startPt.y, pos.y),
      w: Math.abs(pos.x - startPt.x),
      h: Math.abs(pos.y - startPt.y),
    });
  };

  const handleUp = () => {
    setDrawing(false);
    if (!box || box.w < 10 || box.h < 10) {
      setBox(null);
      onBoxChange?.(null);
      return;
    }
    // Convert CSS box to video-pixel box
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = videoDims.width / rect.width;
    const scaleY = videoDims.height / rect.height;
    const videoBox = {
      x: Math.round(box.x * scaleX),
      y: Math.round(box.y * scaleY),
      w: Math.round(box.w * scaleX),
      h: Math.round(box.h * scaleY),
    };
    onBoxChange?.(videoBox);
  };

  useEffect(() => {
    const up = () => handleUp();
    window.addEventListener('mouseup', up);
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchend', up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawing, box]);

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="relative rounded-xl overflow-hidden bg-black border border-white/10 select-none touch-none"
        onMouseDown={handleDown}
        onMouseMove={handleMove}
        onTouchStart={handleDown}
        onTouchMove={handleMove}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          onLoadedMetadata={onLoaded}
          onEnded={() => setPlaying(false)}
          className="w-full h-auto max-h-[60vh] object-contain pointer-events-none block"
          muted
          playsInline
        />
        {box && (
          <div
            className="absolute border-2 border-cyan-400 bg-cyan-400/10 pointer-events-none"
            style={{
              left: box.x,
              top: box.y,
              width: box.w,
              height: box.h,
            }}
          >
            <div className="absolute -top-5 left-0 text-[10px] font-mono text-cyan-400 bg-black/80 px-1.5 py-0.5 rounded">
              {Math.round(box.w)} × {Math.round(box.h)}
            </div>
          </div>
        )}
        {!box && !drawing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full text-white text-xs font-semibold border border-white/20">
              ✋ Click & drag over the watermark
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          onClick={togglePlay}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs text-white/70 transition-all"
        >
          {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          {playing ? 'Pause' : 'Play'}
        </button>
        <div className="text-[10px] text-white/40 font-mono">
          {videoDims.width > 0 && `${videoDims.width} × ${videoDims.height}`}
        </div>
        {box && (
          <button
            onClick={() => { setBox(null); onBoxChange?.(null); }}
            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-full text-xs text-red-400 transition-all"
          >
            Clear box
          </button>
        )}
      </div>
    </div>
  );
}