import React, { useRef, useEffect, useState } from "react";

const DEVICE_FRAMES = {
  none: { name: "Free", w: 1200, h: 675 },
  phone: { name: "iPhone", w: 390, h: 844 },
  laptop: { name: "MacBook", w: 1200, h: 750 },
  tablet: { name: "iPad", w: 1024, h: 1366 },
};

export default function MotionPreview({ layers, device, bgColor, bgImage }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const deviceMeta = DEVICE_FRAMES[device] || DEVICE_FRAMES.none;

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pad = 32;
      const scaleX = (rect.width - pad) / deviceMeta.w;
      const scaleY = (rect.height - pad) / deviceMeta.h;
      setScale(Math.min(scaleX, scaleY, 1));
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [device, deviceMeta.w, deviceMeta.h]);

  const isPhone = device === "phone";
  const isDevice = device !== "none";

  return (
    <div ref={containerRef} className="flex-1 flex items-center justify-center p-3 overflow-hidden" style={{ background: "#141419" }}>
      <div
        className="relative overflow-hidden flex-shrink-0"
        style={{
          width: deviceMeta.w * scale,
          height: deviceMeta.h * scale,
          borderRadius: isPhone ? 24 * scale : isDevice ? 12 : 8,
          background: bgImage ? `url(${bgImage}) center/cover no-repeat` : (bgColor || "#1c1c1e"),
          border: isDevice ? `${Math.max(2, 3 * scale)}px solid #2c2c2e` : "none",
          boxShadow: isDevice ? "0 20px 60px rgba(0,0,0,0.5)" : "0 0 0 1px rgba(255,255,255,0.06)",
        }}
      >
        {isPhone && <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-black rounded-b-2xl z-10" style={{ width: Math.max(30, 100 * scale), height: Math.max(8, 20 * scale) }} />}

        {layers.map((layer, i) => {
          if (layer.visible === false) return null;
          const fs = Math.max(8, (layer.fontSize || 36) * scale);
          return (
            <div
              key={layer.id || i}
              className="absolute overflow-hidden"
              style={{
                left: `${layer.x || 50}%`,
                top: `${layer.y || 50}%`,
                transform: `translate(-50%, -50%) rotate(${layer.rotation || 0}deg) scale(${(layer.scale || 100) / 100})`,
                opacity: (layer.opacity || 100) / 100,
                maxWidth: `${deviceMeta.w * scale * 0.9}px`,
              }}
            >
              {layer.type === "text" && (
                <span
                  style={{
                    fontSize: fs,
                    color: layer.color || "#ffffff",
                    fontWeight: layer.fontWeight || "bold",
                    textAlign: "center",
                    textShadow: "0 2px 20px rgba(0,0,0,0.6)",
                    whiteSpace: "nowrap",
                    fontFamily: layer.fontFamily || "system-ui, -apple-system, sans-serif",
                    display: "block",
                    lineHeight: 1.1,
                  }}
                >
                  {layer.text || "Text"}
                </span>
              )}
              {layer.type === "image" && layer.imageUrl && (
                <img src={layer.imageUrl} alt="" className="max-w-full max-h-full object-contain rounded" style={{ maxWidth: deviceMeta.w * scale * 0.8, maxHeight: deviceMeta.h * scale * 0.8 }} />
              )}
              {layer.type === "shape" && (
                <div style={{
                  width: Math.min(80 * scale, deviceMeta.w * scale * 0.9),
                  height: Math.min(80 * scale, deviceMeta.h * scale * 0.9),
                  borderRadius: layer.shape === "circle" ? "50%" : "8px",
                  background: layer.color || "#ffffff",
                  opacity: layer.opacity ? layer.opacity / 100 : 0.8,
                }} />
              )}
              {layer.type === "logo" && layer.imageUrl && (
                <img src={layer.imageUrl} alt="" className="object-contain" style={{ maxWidth: Math.min(200, deviceMeta.w * scale * 0.6), maxHeight: Math.min(200, deviceMeta.h * scale * 0.6) }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}