/** @jsxRuntime classic */
/** @jsx camSceneElement */
import React, { useMemo, useRef } from 'react';
import camSceneElement from '@/components/cam/camSceneElement';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Html, TransformControls } from '@react-three/drei';
import * as THREE from 'three';

const PLANE_W = 4.8;
const CAM_FOV = 42;
const CAM_DIST = 6.4; // approx camera distance to the layer plane — for px→world drag math

function LayerContent({ layer, selected }) {
  const cls = `cm-fus-el ${selected ? 'is-sel' : ''}`;
  const c = layer.css || {};
  if (layer.kind === 'text')
    return (
      <div className={cls} style={{ width: layer.w, height: layer.h, overflow: 'hidden', boxSizing: 'border-box', fontFamily: c.fontFamily, fontSize: c.fontSize, fontWeight: c.fontWeight, fontStyle: c.fontStyle, color: c.color, lineHeight: c.lineHeight, letterSpacing: c.letterSpacing, textTransform: c.textTransform, textAlign: c.textAlign, padding: c.padding, backgroundColor: c.bgColor === 'rgba(0, 0, 0, 0)' ? 'transparent' : c.bgColor, borderRadius: c.radius }}>
        {layer.text}
      </div>
    );
  if (layer.kind === 'crop')
    return (
      <div className={cls} style={{ width: layer.w, height: layer.h, overflow: 'hidden', position: 'relative', borderRadius: c.radius }}>
        <img src={layer.src} alt="" style={{ position: 'absolute', left: layer.ox, top: layer.oy, width: layer.iw, height: layer.ih }} />
      </div>
    );
  if (layer.kind === 'bg')
    return <div className={cls} style={{ width: layer.w, height: layer.h, backgroundImage: c.bgImage, backgroundSize: c.bgSize, backgroundPosition: c.bgPos, backgroundRepeat: c.bgRepeat, borderRadius: c.radius }} />;
  return <div className={cls} style={{ width: layer.w, height: layer.h, backgroundColor: c.bgColor, borderRadius: c.radius, border: c.border }} />;
}

function FusionLayer({ layer, selected, onSelect, register, startDrag, moveDrag, endDrag }) {
  return (
    <group position={[layer.pos.x, layer.pos.y, layer.pos.z]} ref={(o) => { register(layer.id, o); }}>
      <group scale={layer.scale}>
        <Html transform center className="cm-fus-wrap">
          <div
            className="cm-fus-hit"
            title="Drag to move · Shift-drag to slide across the grid"
            onPointerDown={(e) => startDrag(e, layer)}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <LayerContent layer={layer} selected={selected} />
          </div>
        </Html>
      </group>
    </group>
  );
}

// DaVinci Fusion-style 3D composite: every cloned text / asset is its own
// layer in 3D space. Click a layer to grab it and drag it across the scene —
// Shift-drag slides it across the XZ grid; the XYZ arrow gizmo stays available
// for precise single-axis moves.
export default function CamFusionScene({ image, layers, selectedId, onSelect, onCommit }) {
  const groups = useRef({});
  const register = (id, o) => { groups.current[id] = o; };
  const boxRef = useRef(null);
  const drag = useRef(null);

  const startDrag = (e, layer) => {
    onSelect(layer.id);
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id: layer.id, sx: e.clientX, sy: e.clientY, pos: { ...layer.pos }, grid: e.shiftKey };
  };
  const moveDrag = (e) => {
    const d = drag.current;
    if (!d || !boxRef.current) return;
    const wpp = (2 * CAM_DIST * Math.tan(((CAM_FOV / 2) * Math.PI) / 180)) / boxRef.current.clientHeight;
    const dx = (e.clientX - d.sx) * wpp;
    const dy = (e.clientY - d.sy) * wpp;
    onCommit(d.id, d.grid
      ? { x: d.pos.x + dx, y: d.pos.y, z: d.pos.z + dy } // shift — slide across the XZ grid
      : { x: d.pos.x + dx, y: d.pos.y - dy, z: d.pos.z }); // normal — move in the camera-facing plane
  };
  const endDrag = () => { drag.current = null; };

  const texture = useMemo(() => {
    if (!image) return null;
    const t = new THREE.CanvasTexture(image);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [image]);
  const aspect = image ? image.naturalHeight / image.naturalWidth : 9 / 16;
  const ordered = useMemo(() => [...(layers || [])].sort((a, b) => a.pos.z - b.pos.z), [layers]);

  return (
    <div ref={boxRef} className="relative h-full w-full">
      <Canvas camera={{ position: [0, 0.7, CAM_DIST], fov: CAM_FOV }} dpr={[1, 2]} onPointerMissed={() => onSelect(null)}>
        <color attach="background" args={['#0a0d0b']} />
        <fog attach="fog" args={['#0a0d0b', 16, 34]} />
        <mesh position={[0, 0, -0.8]}>
          <planeGeometry args={[PLANE_W, PLANE_W * aspect]} />
          {texture
            ? <meshBasicMaterial map={texture} transparent opacity={0.16} side={THREE.DoubleSide} toneMapped={false} />
            : <meshBasicMaterial color="#15201a" transparent opacity={0.4} side={THREE.DoubleSide} />}
        </mesh>
        <Grid position={[0, -PLANE_W * aspect / 2 - 0.2, 0]} args={[24, 24]} cellSize={0.4} cellThickness={0.5} cellColor="#223028" sectionSize={2} sectionThickness={0.9} sectionColor="#31503e" fadeDistance={22} fadeStrength={2.2} infiniteGrid />
        <axesHelper args={[1.1]} position={[-PLANE_W / 2, -PLANE_W * aspect / 2, -0.4]} />
        {ordered.map((layer) => (
          <FusionLayer key={layer.id} layer={layer} selected={layer.id === selectedId} onSelect={onSelect} register={register} startDrag={startDrag} moveDrag={moveDrag} endDrag={endDrag} />
        ))}
        {selectedId && groups.current[selectedId] && (
          <TransformControls
            key={selectedId}
            object={groups.current[selectedId]}
            mode="translate"
            size={0.7}
            onMouseUp={() => {
              const p = groups.current[selectedId]?.position;
              if (p) onCommit(selectedId, { x: p.x, y: p.y, z: p.z });
            }}
          />
        )}
        <OrbitControls makeDefault target={[0, 0, 0]} minDistance={2.5} maxDistance={16} />
      </Canvas>

      <div className="cm3d-hud left-4 top-4">
        <p className="cm-display text-[11px] tracking-[0.3em]">FUSION 3D COMPOSITE</p>
        <p className="mt-1 text-[9px] uppercase tracking-[0.22em] text-[hsl(var(--cm-muted))]">{ordered.length} layers · image exploded into assets</p>
      </div>
      {!ordered.length && (
        <div className="cm3d-hud left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <p className="text-[11px] uppercase tracking-[0.25em]">Upload an image, then hit “Explode into 3D layers”</p>
        </div>
      )}
      <div className="cm3d-hud bottom-4 right-4 text-[9px] uppercase tracking-[0.22em] text-[hsl(var(--cm-muted))]">Click + drag a layer · Shift-drag slides across the grid · arrows for XYZ</div>
      <div className="cm3d-ring" />
    </div>
  );
}