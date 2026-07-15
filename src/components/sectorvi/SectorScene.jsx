import React, { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import RobloxAgent from "./RobloxAgent";
import { ROOM_SIZE } from "./sectorAgents";

function FollowCamera({ positionsRef, followId }) {
  const { camera } = useThree();
  useFrame(() => {
    const p = positionsRef.current[followId];
    if (!p) return;
    const dist = 6, height = 4;
    const tx = p.x - Math.sin(p.rot) * dist;
    const tz = p.z - Math.cos(p.rot) * dist;
    camera.position.x += (tx - camera.position.x) * 0.08;
    camera.position.y += (height - camera.position.y) * 0.08;
    camera.position.z += (tz - camera.position.z) * 0.08;
    camera.lookAt(p.x, 2, p.z);
  });
  return null;
}

function WhiteRoom() {
  const S = ROOM_SIZE;
  const wall = <meshStandardMaterial color="#f4f4f5" flatShading />;
  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[S, S]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* grid lines */}
      <gridHelper args={[S, S, "#d4d4d8", "#e4e4e7"]} position={[0, 0.01, 0]} />
      {/* walls */}
      <mesh position={[0, 4, -S / 2]}><boxGeometry args={[S, 8, 0.3]} />{wall}</mesh>
      <mesh position={[-S / 2, 4, 0]}><boxGeometry args={[0.3, 8, S]} />{wall}</mesh>
      <mesh position={[S / 2, 4, 0]}><boxGeometry args={[0.3, 8, S]} />{wall}</mesh>
      {/* low poly props */}
      <mesh position={[-7, 0.75, -7]} castShadow><boxGeometry args={[1.5, 1.5, 1.5]} /><meshStandardMaterial color="#e0f2fe" flatShading /></mesh>
      <mesh position={[7, 0.5, -8]} castShadow><boxGeometry args={[3, 1, 2]} /><meshStandardMaterial color="#f0fdf4" flatShading /></mesh>
      <mesh position={[8, 1, 7]} castShadow><coneGeometry args={[1.2, 2, 5]} /><meshStandardMaterial color="#fef9c3" flatShading /></mesh>
      <mesh position={[-8, 0.6, 8]} castShadow><icosahedronGeometry args={[0.9, 0]} /><meshStandardMaterial color="#fae8ff" flatShading /></mesh>
      {/* center platform */}
      <mesh position={[0, 0.15, 0]} receiveShadow><cylinderGeometry args={[3, 3, 0.3, 8]} /><meshStandardMaterial color="#ecfeff" flatShading /></mesh>
    </group>
  );
}

export default function SectorScene({ agents, positionsRef, mode, followId, selectedId, onSelect }) {
  const controls = useRef();
  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[10, 15, 8]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
      <WhiteRoom />
      {agents.map((a) => (
        <RobloxAgent key={a.id} agent={a} positionsRef={positionsRef} selected={a.id === selectedId} onClick={onSelect} />
      ))}
      {mode === "free" ? (
        <OrbitControls ref={controls} maxPolarAngle={Math.PI / 2 - 0.05} minDistance={2} maxDistance={40} target={[0, 1.5, 0]} />
      ) : (
        <FollowCamera positionsRef={positionsRef} followId={followId} />
      )}
    </>
  );
}