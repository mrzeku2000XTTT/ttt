import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";

const SIZE = 20;
const WALL_H = 6;

function WhiteRoom() {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[SIZE, SIZE]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <Grid
        position={[0, 0.01, 0]}
        args={[SIZE, SIZE]}
        cellColor="#d1d5db"
        sectionColor="#9ca3af"
        cellSize={1}
        sectionSize={5}
        fadeDistance={40}
      />

      {/* 4 walls = 4 corners */}
      <mesh position={[0, WALL_H / 2, -SIZE / 2]}>
        <boxGeometry args={[SIZE, WALL_H, 0.2]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
      <mesh position={[0, WALL_H / 2, SIZE / 2]}>
        <boxGeometry args={[SIZE, WALL_H, 0.2]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
      <mesh position={[-SIZE / 2, WALL_H / 2, 0]}>
        <boxGeometry args={[0.2, WALL_H, SIZE]} />
        <meshStandardMaterial color="#efefef" />
      </mesh>
      <mesh position={[SIZE / 2, WALL_H / 2, 0]}>
        <boxGeometry args={[0.2, WALL_H, SIZE]} />
        <meshStandardMaterial color="#efefef" />
      </mesh>

      {/* Corner pillars to accent the 4 corners */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
        <mesh key={i} position={[x * (SIZE / 2 - 0.4), WALL_H / 2, z * (SIZE / 2 - 0.4)]}>
          <boxGeometry args={[0.5, WALL_H, 0.5]} />
          <meshStandardMaterial color="#e5e7eb" />
        </mesh>
      ))}

      {/* Center platform */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[2.2, 2.2, 0.3, 48]} />
        <meshStandardMaterial color="#fafafa" />
      </mesh>
    </group>
  );
}

export default function Sector6Room() {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [10, 7, 10], fov: 50 }} style={{ background: "#ffffff" }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.9} />
          <directionalLight position={[8, 12, 6]} intensity={0.8} />
          <directionalLight position={[-6, 8, -8]} intensity={0.3} />
          <WhiteRoom />
          <OrbitControls
            maxPolarAngle={Math.PI / 2 - 0.05}
            minDistance={3}
            maxDistance={25}
            target={[0, 1, 0]}
          />
          <fog attach="fog" args={["#ffffff", 30, 60]} />
        </Suspense>
      </Canvas>
    </div>
  );
}