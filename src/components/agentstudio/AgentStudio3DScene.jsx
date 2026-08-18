import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls, Stars, Sparkles, Icosahedron, Torus } from "@react-three/drei";

function Core() {
  const ref = useRef();
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.25;
    ref.current.rotation.x += delta * 0.08;
  });
  return (
    <group ref={ref}>
      <Icosahedron args={[1.5, 1]}>
        <meshStandardMaterial color="#22d3ee" wireframe emissive="#0891b2" emissiveIntensity={0.7} />
      </Icosahedron>
      <Torus args={[2.4, 0.02, 16, 120]} rotation={[Math.PI / 2.2, 0, 0]}>
        <meshStandardMaterial color="#a855f7" emissive="#7c3aed" emissiveIntensity={0.6} />
      </Torus>
      <Torus args={[2.9, 0.02, 16, 120]} rotation={[Math.PI / 1.7, Math.PI / 4, 0]}>
        <meshStandardMaterial color="#67e8f9" emissive="#06b6d4" emissiveIntensity={0.5} />
      </Torus>
    </group>
  );
}

/** 3D WebGL Three.js scene — the "harness" for the AgentInternetStudio index. */
export default function AgentStudio3DScene() {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 50 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={1.3} color="#22d3ee" />
      <pointLight position={[-5, -3, -5]} intensity={0.9} color="#a855f7" />
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.9}>
        <Core />
      </Float>
      <Sparkles count={70} scale={7} size={2.2} speed={0.4} color="#67e8f9" />
      <Stars radius={60} depth={25} count={1200} factor={2.5} fade speed={1} />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
    </Canvas>
  );
}