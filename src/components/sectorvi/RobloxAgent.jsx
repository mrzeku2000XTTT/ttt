import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { ROOM_SIZE } from "./sectorAgents";

const BOUND = ROOM_SIZE / 2 - 2;
const AGENT_RADIUS = 1.1;       // collision radius — agents push apart when closer than this
const SEPARATION_FORCE = 4.0;   // how strongly agents shove each other apart
const rand = () => (Math.random() * 2 - 1) * BOUND;

export default function RobloxAgent({ agent, positionsRef, selected, onClick }) {
  const group = useRef();
  const leftArm = useRef(); const rightArm = useRef();
  const leftLeg = useRef(); const rightLeg = useRef();

  const state = useMemo(() => ({
    target: { x: rand(), z: rand() },
    pause: 0,
  }), []);

  useFrame(({ clock }, delta) => {
    const g = group.current;
    if (!g) return;
    const t = clock.elapsedTime;

    let walking = false;
    if (state.pause > 0) {
      state.pause -= delta;
    } else {
      const dx = state.target.x - g.position.x;
      const dz = state.target.z - g.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.3) {
        state.target = { x: rand(), z: rand() };
        state.pause = 0.5 + Math.random() * 2;
      } else {
        const targetRot = Math.atan2(dx, dz);
        let dr = targetRot - g.rotation.y;
        while (dr > Math.PI) dr -= Math.PI * 2;
        while (dr < -Math.PI) dr += Math.PI * 2;
        g.rotation.y += dr * Math.min(1, delta * 6);
        g.position.x += (dx / dist) * agent.speed * delta;
        g.position.z += (dz / dist) * agent.speed * delta;
        walking = true;
      }
    }

    // ── Agent-to-agent collision separation ──
    // Read every other agent's position from the shared ref and push apart
    // when we're within the collision radius. This prevents overlapping/clip-through.
    const others = positionsRef.current;
    let pushX = 0, pushZ = 0;
    for (const id in others) {
      if (id === agent.id) continue;
      const o = others[id];
      if (!o) continue;
      const odx = g.position.x - o.x;
      const odz = g.position.z - o.z;
      const od = Math.hypot(odx, odz);
      if (od < AGENT_RADIUS && od > 0.001) {
        const overlap = (AGENT_RADIUS - od) / AGENT_RADIUS;
        pushX += (odx / od) * overlap * SEPARATION_FORCE * delta;
        pushZ += (odz / od) * overlap * SEPARATION_FORCE * delta;
      } else if (od <= 0.001) {
        // Exactly overlapping — nudge in a random direction to break the tie
        const ang = Math.random() * Math.PI * 2;
        pushX += Math.cos(ang) * SEPARATION_FORCE * delta;
        pushZ += Math.sin(ang) * SEPARATION_FORCE * delta;
      }
    }
    g.position.x += pushX;
    g.position.z += pushZ;

    // Keep inside the room bounds
    g.position.x = Math.max(-BOUND, Math.min(BOUND, g.position.x));
    g.position.z = Math.max(-BOUND, Math.min(BOUND, g.position.z));

    // limb swing
    const swing = walking ? Math.sin(t * 8) * 0.7 : 0;
    if (leftArm.current) leftArm.current.rotation.x = swing;
    if (rightArm.current) rightArm.current.rotation.x = -swing;
    if (leftLeg.current) leftLeg.current.rotation.x = -swing;
    if (rightLeg.current) rightLeg.current.rotation.x = swing;
    // slight bob
    g.position.y = walking ? Math.abs(Math.sin(t * 8)) * 0.06 : 0;

    positionsRef.current[agent.id] = {
      x: g.position.x, z: g.position.z, rot: g.rotation.y,
    };
  });

  const skin = "#f5d0a9";

  return (
    <group
      ref={group}
      position={[rand(), 0, rand()]}
      onClick={(e) => { e.stopPropagation(); onClick(agent.id); }}
    >
      {/* name tag */}
      <Text position={[0, 3.05, 0]} fontSize={0.32} color={selected ? "#06b6d4" : "#111111"} anchorX="center" anchorY="bottom" outlineWidth={0.012} outlineColor="#ffffff">
        {agent.name}
      </Text>
      {selected && (
        <mesh position={[0, 3.5, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.18, 0.35, 4]} />
          <meshStandardMaterial color="#06b6d4" flatShading />
        </mesh>
      )}
      {/* head */}
      <mesh position={[0, 2.45, 0]} castShadow>
        <boxGeometry args={[0.7, 0.7, 0.7]} />
        <meshStandardMaterial color={skin} flatShading />
      </mesh>
      {/* eyes */}
      <mesh position={[-0.15, 2.5, 0.36]}><boxGeometry args={[0.09, 0.12, 0.02]} /><meshStandardMaterial color="#111" /></mesh>
      <mesh position={[0.15, 2.5, 0.36]}><boxGeometry args={[0.09, 0.12, 0.02]} /><meshStandardMaterial color="#111" /></mesh>
      {/* torso */}
      <mesh position={[0, 1.55, 0]} castShadow>
        <boxGeometry args={[0.9, 1.1, 0.5]} />
        <meshStandardMaterial color={agent.color} flatShading />
      </mesh>
      {/* arms (pivot at shoulder) */}
      <group ref={leftArm} position={[-0.6, 2.05, 0]}>
        <mesh position={[0, -0.5, 0]} castShadow>
          <boxGeometry args={[0.3, 1.0, 0.35]} />
          <meshStandardMaterial color={agent.color} flatShading />
        </mesh>
      </group>
      <group ref={rightArm} position={[0.6, 2.05, 0]}>
        <mesh position={[0, -0.5, 0]} castShadow>
          <boxGeometry args={[0.3, 1.0, 0.35]} />
          <meshStandardMaterial color={agent.color} flatShading />
        </mesh>
      </group>
      {/* legs (pivot at hip) */}
      <group ref={leftLeg} position={[-0.23, 1.0, 0]}>
        <mesh position={[0, -0.5, 0]} castShadow>
          <boxGeometry args={[0.35, 1.0, 0.4]} />
          <meshStandardMaterial color={agent.pants} flatShading />
        </mesh>
      </group>
      <group ref={rightLeg} position={[0.23, 1.0, 0]}>
        <mesh position={[0, -0.5, 0]} castShadow>
          <boxGeometry args={[0.35, 1.0, 0.4]} />
          <meshStandardMaterial color={agent.pants} flatShading />
        </mesh>
      </group>
    </group>
  );
}