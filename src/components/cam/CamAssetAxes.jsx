/** @jsxRuntime classic */
/** @jsx camSceneElement */
import React, { useState } from 'react';
import camSceneElement from '@/components/cam/camSceneElement';
import CamDragAxis from '@/components/cam/CamDragAxis';

export default function CamAssetAxes({ id, position, scale = 1, onSelect, onMove, onDragStart, dragging }) {
  const [active, setActive] = useState(null);
  return <group position={[position.x - 1.7 * scale - 0.42, position.y, position.z]}>
    {['x', 'y', 'z'].map((axis) => <CamDragAxis key={axis} axis={axis} value={position[axis]} active={active === axis} dragging={dragging}
      onSelect={() => { setActive(axis); onSelect?.(id); }} onDragStart={() => onDragStart?.(id)} onChange={(value) => onMove?.(id, axis, value)} />)}
  </group>;
}