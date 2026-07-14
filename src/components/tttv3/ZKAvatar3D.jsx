import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial } from "@react-three/drei";

function OrbCore() {
  const mesh = useRef();
  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.elapsedTime;
    mesh.current.rotation.y = t * 0.6;
    mesh.current.rotation.x = Math.sin(t * 0.4) * 0.3;
    const s = 1 + Math.sin(t * 2.2) * 0.05;
    mesh.current.scale.set(s, s, s);
  });
  return (
    <mesh ref={mesh}>
      <icosahedronGeometry args={[1, 4]} />
      <MeshDistortMaterial color="#f59e0b" emissive="#78350f" roughness={0.12} metalness={0.75} distort={0.38} speed={2.4} />
    </mesh>
  );
}

/**
 * ZKAvatar3D — animated three.js orb avatar for ZK's chat responses.
 * Only the latest message renders the live WebGL orb (browser context limits);
 * older messages fall back to the static badge.
 */
export default function ZKAvatar3D({ live = false, size = 32 }) {
  if (!live) {
    return (
      <div className="rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[11px] font-bold"
        style={{ width: size, height: size, background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000" }}>
        ZK
      </div>
    );
  }
  return (
    <div className="relative rounded-full overflow-hidden flex-shrink-0 mt-0.5"
      style={{ width: size, height: size, boxShadow: "0 0 14px rgba(245,158,11,0.45), inset 0 0 6px rgba(0,0,0,0.5)", border: "1px solid rgba(245,158,11,0.4)", background: "#0d0d0d" }}>
      <Canvas camera={{ position: [0, 0, 2.6], fov: 45 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[3, 3, 3]} intensity={2} color="#fbbf24" />
        <pointLight position={[-3, -2, 2]} intensity={1} color="#8b5cf6" />
        <OrbCore />
      </Canvas>
      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black pointer-events-none"
        style={{ color: "rgba(0,0,0,0.75)", textShadow: "0 0 4px rgba(255,255,255,0.4)" }}>
        ZK
      </span>
    </div>
  );
}