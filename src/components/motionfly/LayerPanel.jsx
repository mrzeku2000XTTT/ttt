import React from "react";
import { Type, Image, Square, Star, Move, Trash2, Copy, Eye, EyeOff } from "lucide-react";

export default function LayerPanel({ layers, selectedLayerIdx, onSelectLayer, onUpdateLayer, onDeleteLayer, onDuplicateLayer, onAddLayer, onMoveLayer }) {
  return (
    <div className="flex flex-col h-full" style={{ background: "#1a1a21" }}>
      {/* Add layer bar */}
      <div className="flex items-center gap-1 p-2 border-b border-white/5">
        {[
          { type: "text", icon: Type, label: "T", color: "#ffcc00" },
          { type: "image", icon: Image, label: "Img", color: "#ff9500" },
          { type: "shape", icon: Square, label: "Shape", color: "#00be8c" },
          { type: "logo", icon: Star, label: "Logo", color: "#007aff" },
        ].map(({ type, icon: Icon, label, color }) => (
          <button
            key={type}
            onClick={() => onAddLayer(type)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all flex-1 justify-center hover:bg-white/10"
            style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <Icon className="w-3 h-3" style={{ color }} />
            <span className="hidden xl:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Layer list */}
      <div className="overflow-y-auto p-2 space-y-0.5" style={{ maxHeight: 220, minHeight: 80 }}>
        {layers.map((layer, i) => {
          const isSelected = i === selectedLayerIdx;
          const trackColors = ["#ffcc00", "#ff9500", "#00be8c", "#007aff", "#af52de", "#ff3b30"];
          const color = trackColors[i % trackColors.length];

          return (
            <div
              key={layer.id}
              onClick={() => onSelectLayer(i)}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all group ${
                isSelected ? "ring-1 ring-[#34c759]/70 bg-white/5" : "hover:bg-white/5"
              }`}
            >
              {/* Visibility */}
              <button
                onClick={(e) => { e.stopPropagation(); onUpdateLayer(i, { visible: !(layer.visible !== false) }); }}
                className="shrink-0"
              >
                {layer.visible !== false ? (
                  <Eye className="w-3.5 h-3.5 text-white/60" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-white/20" />
                )}
              </button>

              {/* Color dot */}
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />

              {/* Name */}
              <input
                value={layer.name || ""}
                onChange={(e) => onUpdateLayer(i, { name: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                placeholder={`Layer ${i + 1}`}
                className="bg-transparent text-[11px] font-semibold text-white/80 outline-none flex-1 min-w-0 placeholder:text-white/20"
              />

              {/* Actions (shown on hover) */}
              <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); onMoveLayer(i, -1); }}
                  disabled={i === 0}
                  className="w-5 h-5 flex items-center justify-center rounded text-white/30 disabled:opacity-20 hover:text-white"
                >
                  <Move className="w-3 h-3 rotate-180" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onMoveLayer(i, 1); }}
                  disabled={i === layers.length - 1}
                  className="w-5 h-5 flex items-center justify-center rounded text-white/30 disabled:opacity-20 hover:text-white"
                >
                  <Move className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDuplicateLayer(i); }}
                  className="w-5 h-5 flex items-center justify-center rounded text-white/30 hover:text-white"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteLayer(i); }}
                  className="w-5 h-5 flex items-center justify-center rounded text-white/30 hover:text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected layer properties */}
      {selectedLayerIdx !== null && layers[selectedLayerIdx] && (
        <div className="border-t border-white/5 p-3 space-y-3 overflow-y-auto flex-1">
          <div className="flex items-center justify-between">
            <p className="text-[9px] uppercase tracking-widest text-white/25">Properties</p>
            <span className="text-[9px] text-white/20 bg-white/5 px-2 py-0.5 rounded-full">
              {layers[selectedLayerIdx].type}
            </span>
          </div>

          {layers[selectedLayerIdx].type === "text" && (
            <div className="space-y-1">
              <p className="text-[8px] uppercase text-white/25">Double-click text to edit on canvas</p>
              <input
                value={layers[selectedLayerIdx].text || ""}
                onChange={(e) => onUpdateLayer(selectedLayerIdx, { text: e.target.value })}
                placeholder="Enter text..."
                className="w-full rounded-lg p-2 text-[12px] font-medium text-white bg-white/5 border border-white/10 outline-none focus:border-[#34c759]/40 transition-colors"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[8px] uppercase text-white/25 mb-1">X <span className="text-white/10">{layers[selectedLayerIdx].x}</span></p>
              <input type="range" min={0} max={100} value={layers[selectedLayerIdx].x || 50}
                onChange={(e) => onUpdateLayer(selectedLayerIdx, { x: parseInt(e.target.value) })}
                className="w-full accent-[#34c759] h-1" />
            </div>
            <div>
              <p className="text-[8px] uppercase text-white/25 mb-1">Y <span className="text-white/10">{layers[selectedLayerIdx].y}</span></p>
              <input type="range" min={0} max={100} value={layers[selectedLayerIdx].y || 50}
                onChange={(e) => onUpdateLayer(selectedLayerIdx, { y: parseInt(e.target.value) })}
                className="w-full accent-[#34c759] h-1" />
            </div>
            <div>
              <p className="text-[8px] uppercase text-white/25 mb-1">Scale <span className="text-white/10">{layers[selectedLayerIdx].scale || 100}%</span></p>
              <input type="range" min={10} max={300} value={layers[selectedLayerIdx].scale || 100}
                onChange={(e) => onUpdateLayer(selectedLayerIdx, { scale: parseInt(e.target.value) })}
                className="w-full accent-[#34c759] h-1" />
            </div>
            <div>
              <p className="text-[8px] uppercase text-white/25 mb-1">Opacity <span className="text-white/10">{layers[selectedLayerIdx].opacity || 100}%</span></p>
              <input type="range" min={0} max={100} value={layers[selectedLayerIdx].opacity || 100}
                onChange={(e) => onUpdateLayer(selectedLayerIdx, { opacity: parseInt(e.target.value) })}
                className="w-full accent-[#34c759] h-1" />
            </div>
            <div>
              <p className="text-[8px] uppercase text-white/25 mb-1">Rotate <span className="text-white/10">{layers[selectedLayerIdx].rotation || 0}&deg;</span></p>
              <input type="range" min={-180} max={180} value={layers[selectedLayerIdx].rotation || 0}
                onChange={(e) => onUpdateLayer(selectedLayerIdx, { rotation: parseInt(e.target.value) })}
                className="w-full accent-[#34c759] h-1" />
            </div>
            {layers[selectedLayerIdx].type === "text" && (
              <div>
                <p className="text-[8px] uppercase text-white/25 mb-1">Size <span className="text-white/10">{layers[selectedLayerIdx].fontSize || 36}px</span></p>
                <input type="range" min={8} max={120} value={layers[selectedLayerIdx].fontSize || 36}
                  onChange={(e) => onUpdateLayer(selectedLayerIdx, { fontSize: parseInt(e.target.value) })}
                  className="w-full accent-[#34c759] h-1" />
              </div>
            )}
          </div>

          {/* Color picker */}
          <div>
            <p className="text-[8px] uppercase text-white/25 mb-1">Color</p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border border-white/20 flex-shrink-0" style={{ background: layers[selectedLayerIdx].color || "#ffffff" }} />
              <input type="color" value={layers[selectedLayerIdx].color || "#ffffff"}
                onChange={(e) => onUpdateLayer(selectedLayerIdx, { color: e.target.value })}
                className="flex-1 h-7 rounded cursor-pointer border-0 p-0" />
            </div>
          </div>

          {/* Font weight picker for text layers */}
          {layers[selectedLayerIdx].type === "text" && (
            <div>
              <p className="text-[8px] uppercase text-white/25 mb-1">Weight</p>
              <div className="flex gap-1">
                {["normal", "bold", "900"].map(w => (
                  <button key={w}
                    onClick={() => onUpdateLayer(selectedLayerIdx, { fontWeight: w })}
                    className="flex-1 py-1.5 rounded text-[10px] font-semibold transition-all"
                    style={{
                      background: layers[selectedLayerIdx].fontWeight === w ? "rgba(52,199,89,0.15)" : "rgba(255,255,255,0.04)",
                      color: layers[selectedLayerIdx].fontWeight === w ? "#34c759" : "rgba(255,255,255,0.4)",
                      border: layers[selectedLayerIdx].fontWeight === w ? "1px solid rgba(52,199,89,0.4)" : "1px solid transparent",
                    }}
                  >
                    {w === "normal" ? "Regular" : w === "bold" ? "Bold" : "Black"}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}