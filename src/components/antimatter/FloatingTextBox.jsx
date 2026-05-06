import React, { useState, useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Save, Trash2, X } from "lucide-react";

// A floating, draggable, editable web-style UI card embedded in 3D space.
// Saves on Ctrl/Cmd+Enter or Save button click.
export default function FloatingTextBox({ element, selected, ghost, onSelect, onSave, onDelete }) {
  const ref = useRef();
  const [title, setTitle] = useState(element.text_title || "Untitled");
  const [content, setContent] = useState(element.text_content || "");
  const [editing, setEditing] = useState(false);
  const [savingState, setSavingState] = useState("idle"); // idle | saving | saved
  const pos = element.position || { x: 0, y: 0, z: 0 };
  const color = element.color || "#22d3ee";

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = pos.y + Math.sin(t * 0.6 + pos.x) * 0.1;
  });

  const handleSave = async () => {
    setSavingState("saving");
    await onSave?.(element.id, { text_title: title, text_content: content });
    setSavingState("saved");
    setTimeout(() => setSavingState("idle"), 1200);
  };

  return (
    <group ref={ref} position={[pos.x, pos.y, pos.z]}>
      {/* 3D anchor pin */}
      <mesh onClick={(e) => { e.stopPropagation(); onSelect?.(element); }}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} />
      </mesh>

      <Html
        transform
        distanceFactor={6}
        position={[0, 1.2, 0]}
        style={{ pointerEvents: ghost ? "none" : "auto" }}
        zIndexRange={[100, 0]}
      >
        <div
          onClick={(e) => { e.stopPropagation(); onSelect?.(element); }}
          className={`w-72 rounded-2xl backdrop-blur-2xl border shadow-2xl transition-all ${
            selected
              ? "bg-black/85 border-cyan-400/60 shadow-cyan-500/30 scale-105"
              : "bg-black/70 border-white/15"
          } ${ghost ? "opacity-30" : "opacity-100"}`}
          style={{ boxShadow: selected ? `0 0 40px ${color}66` : undefined }}
        >
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <div className="w-2 h-2 rounded-full bg-green-400" />
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={() => setEditing(true)}
              className="flex-1 bg-transparent text-[11px] font-bold text-white/90 outline-none"
              placeholder="Untitled"
            />
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(element.id); }}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-500/30 text-white/40 hover:text-red-300"
              title="Delete"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setEditing(true)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                handleSave();
              }
            }}
            placeholder="Write something into the universe…"
            className="w-full h-24 bg-transparent text-[12px] text-white/85 outline-none resize-none px-3 py-2 placeholder:text-white/25"
          />

          <div className="flex items-center justify-between px-3 py-2 border-t border-white/10">
            <div className="text-[9px] uppercase tracking-wider font-bold text-white/35">
              {element.kind}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleSave(); }}
              disabled={savingState === "saving"}
              className={`flex items-center gap-1 px-2.5 h-6 rounded-full text-[10px] font-black transition-all ${
                savingState === "saved"
                  ? "bg-emerald-400 text-black"
                  : "bg-white text-black hover:opacity-90"
              }`}
            >
              <Save className="w-3 h-3" />
              {savingState === "saving" ? "Saving…" : savingState === "saved" ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      </Html>
    </group>
  );
}