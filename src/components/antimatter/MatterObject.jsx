import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";

// Matter = glowing sphere (warm light)
// Antimatter = inverted glowing octahedron (cool void)
export default function MatterObject({ element, selected, ghost, onSelect }) {
  const ref = useRef();
  const isAnti = element.kind === "antimatter";
  const color = element.color || (isAnti ? "#a855f7" : "#22d3ee");
  const pos = element.position || { x: 0, y: 0, z: 0 };
  const scale = element.scale || 1;

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    // Gentle floating motion
    ref.current.position.y = pos.y + Math.sin(t + pos.x) * 0.15;
    ref.current.rotation.y += isAnti ? -0.005 : 0.005;
    ref.current.rotation.x += isAnti ? 0.003 : -0.003;
  });

  const opacity = ghost ? 0.25 : 1;

  return (
    <group ref={ref} position={[pos.x, pos.y, pos.z]} onClick={(e) => { e.stopPropagation(); onSelect?.(element); }}>
      {isAnti ? (
        <mesh scale={scale}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={selected ? 1.2 : 0.6}
            transparent
            opacity={opacity}
            wireframe={ghost}
          />
        </mesh>
      ) : (
        <mesh scale={scale}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={selected ? 0.9 : 0.4}
            roughness={0.2}
            metalness={0.8}
            transparent
            opacity={opacity}
          />
        </mesh>
      )}
      {/* Glow halo */}
      <mesh scale={scale * 1.4}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={selected ? 0.18 : 0.08} />
      </mesh>
      {selected && (
        <mesh scale={scale * 1.7}>
          <ringGeometry args={[1, 1.05, 64]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.5} side={2} />
        </mesh>
      )}
    </group>
  );
}