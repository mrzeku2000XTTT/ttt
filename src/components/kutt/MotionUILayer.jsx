import React, { useEffect, useRef, useState } from "react";
import { drawMotionUI } from "./motionUIRender";

/** Live-preview renderer for a motion_ui clip — same painter as the exporter. */
export default function MotionUILayer({ clip, t, url, width = 1280, height = 720 }) {
  const canvasRef = useRef(null);
  const [img, setImg] = useState(null);

  useEffect(() => {
    if (!url) { setImg(null); return; }
    const el = new Image();
    el.crossOrigin = "anonymous";
    el.onload = () => setImg(el);
    el.src = url;
  }, [url]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const progress = (t - clip.start) / Math.max(0.001, clip.duration);
    drawMotionUI(ctx, { image: img, clip, progress, t }, width, height);
  }, [t, img, clip, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} className="max-w-full max-h-full object-contain" />;
}