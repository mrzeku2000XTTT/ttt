import React, { useState, useRef } from "react";
import { motion } from "framer-motion";

const DEVICE_FRAMES = {
  none: { name: "Free", w: 1200, h: 675 },
  phone: { name: "iPhone", w: 390, h: 844 },
  laptop: { name: "MacBook", w: 1200, h: 750 },
  tablet: { name: "iPad", w: 1024, h: 1366 },
};

export default function MotionPreview({ layers, canvasSize, device, bgColor, bgImage }) {
  const containerRef = useRef(null);
  const deviceMeta = DEVICE_FRAMES[device] || DEVICE_FRAMES.none;

  const scaleToFit = () => {
    const containerW = containerRef.current?.clientWidth || 800;
    const containerH = containerRef.current?.clientHeight || 500;
    const scaleX = (containerW - 60) / deviceMeta.w;
    const scaleY = (containerH - 60) / deviceMeta.h;
    return Math.min(scaleX, scaleY, 1);
  };

  const scale = scaleToFit();
  const isPhone = device === "phone";
  const isDevice = device !== "none";

  return (
    <div ref={containerRef} className="flex-1 flex items-center justify-center p-4" style={{ background: "#141419" }}>
      <div
        className="relative overflow-hidden flex-shrink-0"
        style={{
          width: deviceMeta.w * scale,
          height: deviceMeta.h * scale,
          borderRadius: isPhone ? 24 * scale : isDevice ? 12 : 8,
          background: bgImage ? `url(${bgImage}) center/cover no-repeat` : (bgColor || "#1c1c1e"),
          border: isDevice ? `${3 * scale}px solid #2c2c2e` : "none",
          boxShadow: isDevice ? "0 20px 60px rgba(0,0,0,0.5)" : "0 0 0 1px rgba(255,255,255,0.06)",
        }}
      >
        {/* Phone notch */}
        {isPhone && <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-black rounded-b-2xl z-10" style={{ width: 100 * scale, height: 20 * scale }} />}

        {layers.map((layer, i) => {
          if (layer.visible === false) return null;
          return (
            <motion.div
              key={layer.id || i}
              className="absolute"
              style={{
                left: `${layer.x || 50}%`,
                top: `${layer.y || 50}%`,
                transform: `translate(-50%, -50%) rotate(${layer.rotation || 0}deg) scale(${(layer.scale || 100) / 100})`,
                opacity: (layer.opacity || 100) / 100,
              }}
            >
              {layer.type === "text" && (
                <span
                  style={{
                    fontSize: (layer.fontSize || 36) * scale,
                    color: layer.color || "#ffffff",
                    fontWeight: layer.fontWeight || "bold",
                    textAlign: "center",
                    textShadow: "0 2px 20px rgba(0,0,0,0.6)",
                    whiteSpace: "nowrap",
                    fontFamily: layer.fontFamily || "system-ui, -apple-system, sans-serif",
                  }}
                >
                  {layer.text || "Text"}
                </span>
              )}
              {layer.type === "image" && layer.imageUrl && (
                <img src={layer.imageUrl} alt="" className="max-w-full max-h-full object-contain rounded" />
              )}
              {layer.type === "shape" && (
                <div style={{
                  width: 80 * scale, height: 80 * scale,
                  borderRadius: layer.shape === "circle" ? "50%" : "8px",
                  background: layer.color || "#ffffff",
                  opacity: layer.opacity ? layer.opacity / 100 : 0.8,
                }} />
              )}
              {layer.type === "logo" && layer.imageUrl && (
                <img src={layer.imageUrl} alt="" className="max-w-[200px] max-h-[200px] object-contain" />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}