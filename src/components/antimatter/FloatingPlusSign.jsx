import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Plus } from "lucide-react";

// Three floating plus signs at fixed positions around origin — clicking each one
// spawns a new element of the corresponding type at the world center.
export default function FloatingPlusSign({ position, color, label, kind, onSpawn, ghost }) {
  const ref = useRef();

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = position[1] + Math.sin(t * 1.5) * 0.2;
    ref.current.rotation.z += 0.01;
  });

  return (
    <group ref={ref} position={position}>
      <Html center distanceFactor={8} style={{ pointerEvents: ghost ? "none" : "auto" }}>
        <button
          onClick={(e) => { e.stopPropagation(); onSpawn?.(kind); }}
          className={`group relative flex flex-col items-center gap-1 transition-all ${ghost ? "opacity-20" : "opacity-100"}`}
          style={{ filter: `drop-shadow(0 0 12px ${color})` }}
        >
          <div
            className="w-12 h-12 rounded-full border-2 flex items-center justify-center bg-black/60 backdrop-blur-md transition-transform group-hover:scale-125"
            style={{ borderColor: color, color }}
          >
            <Plus className="w-6 h-6" strokeWidth={3} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-white/80 whitespace-nowrap">{label}</span>
        </button>
      </Html>
    </group>
  );
}