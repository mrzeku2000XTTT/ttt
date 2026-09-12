/** @jsxRuntime classic */
/** @jsx camSceneElement */
import React from 'react';
import { Html } from '@react-three/drei';
import camSceneElement from '@/components/cam/camSceneElement';
import useCamAxisDrag from '@/components/cam/useCamAxisDrag';

const axes = {
  x: { color: '#ffd43b', position: [0.4, 0, 0], rotation: [0, 0, -Math.PI / 2], label: [0.9, 0, 0] },
  y: { color: '#8dff6a', position: [0, 0.4, 0], rotation: [0, 0, 0], label: [0, 0.9, 0] },
  z: { color: '#4d9fff', position: [0, 0, 0.4], rotation: [Math.PI / 2, 0, 0], label: [0, 0, 0.9] },
};
export default function CamDragAxis({ axis, value, active, onChange, onSelect, dragging }) {
  const spec = axes[axis];
  const start = useCamAxisDrag({ axis, value, onChange, onSelect, dragging });
  return <group>
    <mesh position={spec.position} rotation={spec.rotation} renderOrder={1001} onPointerDown={start} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      <cylinderGeometry args={[active ? 0.02 : 0.012, active ? 0.02 : 0.012, 0.8, 8]} />
      <meshBasicMaterial color={spec.color} depthTest={false} depthWrite={false} toneMapped={false} />
    </mesh>
    <mesh position={spec.position} rotation={spec.rotation} renderOrder={1002} onPointerDown={start} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      <cylinderGeometry args={[0.065, 0.065, 0.8, 8]} />
      <meshBasicMaterial transparent opacity={0} depthTest={false} depthWrite={false} />
    </mesh>
    <Html position={spec.label} center style={{ pointerEvents: 'none' }}><span className="cm3d-label" style={{ color: spec.color }}>{axis.toUpperCase()}</span></Html>
  </group>;
}