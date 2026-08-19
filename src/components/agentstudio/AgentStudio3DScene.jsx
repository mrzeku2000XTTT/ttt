import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls, Icosahedron, Torus } from "@react-three/drei";

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

function ParticleField({ count = 1200, radius = 60 }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = radius * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count, radius]);
  const ref = useRef();
  useFrame((_, delta) => { if (ref.current) ref.current.rotation.y += delta * 0.02; });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.35} color="#67e8f9" sizeAttenuation transparent opacity={0.85} />
    </points>
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
      <ParticleField />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
    </Canvas>
  );
}