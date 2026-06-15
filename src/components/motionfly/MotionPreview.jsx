import React, { useRef, useEffect, useState, useCallback } from "react";

const DEVICE_FRAMES = {
  none: { name: "Free", w: 1200, h: 675 },
  phone: { name: "iPhone", w: 390, h: 844 },
  laptop: { name: "MacBook", w: 1200, h: 750 },
  tablet: { name: "iPad", w: 1024, h: 1366 },
};

export default function MotionPreview({ layers, device, bgColor, bgImage, selectedLayerIdx, onSelectLayer, onUpdateLayer }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(null);
  const [editingText, setEditingText] = useState(null);
  const [editValue, setEditValue] = useState("");
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

  // When a text layer gets selected via LayerPanel, open inline editor
  useEffect(() => {
    if (selectedLayerIdx != null && layers[selectedLayerIdx]?.type === "text") {
      setEditingText(selectedLayerIdx);
      setEditValue(layers[selectedLayerIdx].text || "");
    } else {
      setEditingText(null);
    }
  }, [selectedLayerIdx]);

  // Convert screen px → canvas %
  const screenToCanvas = useCallback((clientX, clientY) => {
    if (!canvasRef.current) return { x: 50, y: 50 };
    const rect = canvasRef.current.getBoundingClientRect();
    const pxX = clientX - rect.left;
    const pxY = clientY - rect.top;
    const w = deviceMeta.w * scale;
    const h = deviceMeta.h * scale;
    return {
      x: Math.round(Math.max(0, Math.min(100, (pxX / w) * 100))),
      y: Math.round(Math.max(0, Math.min(100, (pxY / h) * 100))),
    };
  }, [scale, deviceMeta.w, deviceMeta.h]);

  const handleMouseDown = useCallback((e) => {
    const target = e.target.closest("[data-layer-id]");
    if (!target) return;
    const idx = parseInt(target.dataset.layerIndex);
    onSelectLayer(idx);

    // Start dragging
    const startPos = screenToCanvas(e.clientX, e.clientY);
    setDragging({ idx, startX: e.clientX, startY: e.clientY, origX: layers[idx].x, origY: layers[idx].y, startPos });
  }, [layers, screenToCanvas, onSelectLayer]);

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return;
    e.preventDefault();
    const dx = e.clientX - dragging.startX;
    const dy = e.clientY - dragging.startY;
    const w = deviceMeta.w * scale;
    const h = deviceMeta.h * scale;
    const pctX = (dx / w) * 100;
    const pctY = (dy / h) * 100;
    const newX = Math.round(Math.max(0, Math.min(100, dragging.origX + pctX)));
    const newY = Math.round(Math.max(0, Math.min(100, dragging.origY + pctY)));
    onUpdateLayer(dragging.idx, { x: newX, y: newY });
  }, [dragging, scale, deviceMeta.w, deviceMeta.h, onUpdateLayer]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  const handleDoubleClick = useCallback((e) => {
    const target = e.target.closest("[data-layer-id]");
    if (!target) return;
    const idx = parseInt(target.dataset.layerIndex);
    if (layers[idx]?.type === "text") {
      setEditingText(idx);
      setEditValue(layers[idx].text || "");
    }
  }, [layers]);

  const commitEdit = () => {
    if (editingText != null) {
      onUpdateLayer(editingText, { text: editValue });
      setEditingText(null);
    }
  };

  const isPhone = device === "phone";
  const isDevice = device !== "none";

  return (
    <div ref={containerRef} className="flex-1 flex items-center justify-center p-3 overflow-hidden" style={{ background: "#141419" }}>
      <div
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        className="relative overflow-hidden flex-shrink-0 select-none"
        style={{
          width: deviceMeta.w * scale,
          height: deviceMeta.h * scale,
          borderRadius: isPhone ? 24 * scale : isDevice ? 12 : 8,
          background: bgImage ? `url(${bgImage}) center/cover no-repeat` : (bgColor || "#1c1c1e"),
          border: isDevice ? `${Math.max(2, 3 * scale)}px solid #2c2c2e` : "none",
          boxShadow: isDevice ? "0 20px 60px rgba(0,0,0,0.5)" : "0 0 0 1px rgba(255,255,255,0.06)",
          cursor: dragging ? "grabbing" : "default",
        }}
      >
        {isPhone && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-black rounded-b-2xl z-20 pointer-events-none"
            style={{ width: Math.max(30, 100 * scale), height: Math.max(8, 20 * scale) }} />
        )}

        {layers.map((layer, i) => {
          if (layer.visible === false) return null;
          const isSelected = i === selectedLayerIdx;
          const fs = Math.max(8, (layer.fontSize || 36) * scale);
          const isEditing = editingText === i;

          if (isEditing) {
            // Inline text editor
            const estW = Math.max(30, ((editValue.length || 4) * fs * 0.6));
            return (
              <div
                key={layer.id}
                className="absolute z-30"
                style={{
                  left: `${layer.x || 50}%`,
                  top: `${layer.y || 50}%`,
                  transform: `translate(-50%, -50%) rotate(${layer.rotation || 0}deg) scale(${(layer.scale || 100) / 100})`,
                }}
              >
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") { setEditValue(layer.text || ""); setEditingText(null); } }}
                  className="bg-transparent text-center outline-none border-b-2 px-1"
                  style={{
                    fontSize: fs,
                    color: layer.color || "#ffffff",
                    fontWeight: layer.fontWeight || "bold",
                    fontFamily: layer.fontFamily || "system-ui, -apple-system, sans-serif",
                    textShadow: "0 2px 20px rgba(0,0,0,0.6)",
                    width: `${estW}px`,
                    minWidth: `${Math.min(40, estW)}px`,
                    borderColor: "#34c759",
                    lineHeight: 1.1,
                  }}
                />
              </div>
            );
          }

          return (
            <div
              key={layer.id}
              data-layer-id={layer.id}
              data-layer-index={i}
              className={`absolute overflow-hidden transition-shadow ${isSelected ? "z-10" : "z-0"}`}
              style={{
                left: `${layer.x || 50}%`,
                top: `${layer.y || 50}%`,
                transform: `translate(-50%, -50%) rotate(${layer.rotation || 0}deg) scale(${(layer.scale || 100) / 100})`,
                opacity: (layer.opacity || 100) / 100,
                maxWidth: `${deviceMeta.w * scale * 0.9}px`,
                outline: isSelected ? "2px solid rgba(52,199,89,0.5)" : "none",
                outlineOffset: 3,
                cursor: "grab",
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
                <img src={layer.imageUrl} alt="" className="max-w-full max-h-full object-contain rounded pointer-events-none"
                  style={{ maxWidth: deviceMeta.w * scale * 0.8, maxHeight: deviceMeta.h * scale * 0.8 }} />
              )}
              {layer.type === "shape" && (
                <div style={{
                  width: Math.min(80 * scale, deviceMeta.w * scale * 0.9),
                  height: Math.min(80 * scale, deviceMeta.h * scale * 0.9),
                  borderRadius: layer.shape === "circle" ? "50%" : "8px",
                  background: layer.color || "#ffffff",
                  opacity: (layer.opacity || 100) / 100,
                }} />
              )}
              {layer.type === "logo" && layer.imageUrl && (
                <img src={layer.imageUrl} alt="" className="object-contain pointer-events-none"
                  style={{ maxWidth: Math.min(200, deviceMeta.w * scale * 0.6), maxHeight: Math.min(200, deviceMeta.h * scale * 0.6) }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}