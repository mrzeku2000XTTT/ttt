/** @jsxRuntime classic */
/** @jsx camSceneElement */
import React, { useRef, useState } from 'react';
import camSceneElement from '@/components/cam/camSceneElement';
import CamDragAxis from '@/components/cam/CamDragAxis';
import { Html } from '@react-three/drei';

const AXES=['x','y','z'];
function AxisSet({ kind, position, onMove, dragging }) {
  const [active,setActive]=useState(null);
  return <group position={[position.x,position.y,position.z]}>
    {AXES.map(axis=><CamDragAxis key={`${kind}-${axis}`} axis={axis} value={position[axis]} active={active===axis} dragging={dragging} onSelect={()=>setActive(axis)} onDragStart={()=>{}} onChange={value=>onMove(kind,axis,value)}/>)}
    <mesh renderOrder={1003}><sphereGeometry args={[(kind === 'pivot' ? 0.09 : 0.12),16,16]}/><meshBasicMaterial color={kind==='pivot'?'#ffffff':'#ff8a3d'} depthTest={false} depthWrite={false}/></mesh>
    <Html position={[0,-0.2,0]} center style={{pointerEvents:'none'}}><span className="cm3d-label" style={{color:kind==='pivot'?'#ffffff':'#ff8a3d'}}>{kind==='pivot'?'PIVOT':'CAMERA'}</span></Html>
  </group>;
}
export default function CamCameraRigControls({ cameraPosition, pivot, onMove }) {
  const dragging=useRef(false);
  return <>
    <AxisSet kind="camera" position={cameraPosition} onMove={onMove} dragging={dragging}/>
    <AxisSet kind="pivot" position={pivot} onMove={onMove} dragging={dragging}/>
  </>;
}