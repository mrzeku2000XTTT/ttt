/** @jsxRuntime classic */
/** @jsx camSceneElement */
import React, { useMemo, useRef } from 'react';
import camSceneElement from '@/components/cam/camSceneElement';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Html, GizmoHelper, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';
import { moveAt } from './camMoves';
import CamAssetAxes from '@/components/cam/CamAssetAxes';

// Rig dimensions — the image plane the virtual camera films.
const PLANE_W = 3.4;
const PLANE_H = 1.9;
const BASE_DIST = 4.2;

// An extra media asset placed in the 3D world — clickable to reference it.
function MediaPlane({ item, selected, onSelect }) {
  const tex = useMemo(() => {
    if (!item.img) return null;
    const t = new THREE.CanvasTexture(item.img);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [item.img]);
  const w = PLANE_W * (item.scale || 1);
  const h = PLANE_H * (item.scale || 1);
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.PlaneGeometry(w, h)), [w, h]);
  return (
    <group position={[item.pos.x, item.pos.y, item.pos.z]} onClick={(e) => { e.stopPropagation(); onSelect?.(item.id); }}>
      <mesh>
        <planeGeometry args={[w, h]} />
        {tex
          ? <meshBasicMaterial map={tex} toneMapped={false} side={THREE.DoubleSide} transparent opacity={0.96} />
          : <meshBasicMaterial color="#1a2620" transparent opacity={0.6} side={THREE.DoubleSide} />}
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={selected ? '#00ff9d' : '#3a4a40'} />
      </lineSegments>
      <Html position={[0, h / 2 + 0.12, 0]} center style={{ pointerEvents: 'none' }}>
        <span className="cm3d-label" style={{ color: selected ? '#00ff9d' : '#9aa8a0' }}>{item.name}</span>
      </Html>
    </group>
  );
}

function Rig({ image, media, manualOffset, camRig, onSelectAsset, refId, getFrame, onMoveAsset }) {
  const dragging = useRef(false);
  const selected = media?.find((m) => m.id === refId && m.id !== 'primary');
  const assetPosition = selected?.pos || { x: (manualOffset?.x || 0) * 2.4, y: (manualOffset?.y || 0) * 1.6, z: (manualOffset?.z || 0) * 2.2 };
  const bodyRef = useRef();
  const rigRef = useRef();       // auto-orbit spins this group
  const planeGroupRef = useRef(); // background plane — follows the XYZ drag

  const virtualCam = useMemo(() => {
    const c = new THREE.PerspectiveCamera(48, 16 / 9, 0.05, 60);
    c.position.set(0, 0, BASE_DIST);
    return c;
  }, []);
  const helper = useMemo(() => new THREE.CameraHelper(virtualCam), [virtualCam]);

  const texture = useMemo(() => {
    if (!image) return null;
    const t = new THREE.CanvasTexture(image);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [image]);

  const planeEdges = useMemo(() => new THREE.EdgesGeometry(new THREE.PlaneGeometry(PLANE_W, PLANE_H)), []);

  const cornerLines = useMemo(() => (
    [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sy]) => {
      const g = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3((sx * PLANE_W) / 2, (sy * PLANE_H) / 2, 0),
        new THREE.Vector3(0, 0, BASE_DIST),
      ]);
      const m = new THREE.LineDashedMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, dashSize: 0.05, gapSize: 0.05 });
      return new THREE.Line(g, m);
    })
  ), []);

  const dimLines = useMemo(() => {
    const segs = [
      [[-PLANE_W / 2, -PLANE_H / 2 - 0.14, 0], [PLANE_W / 2, -PLANE_H / 2 - 0.14, 0]],
      [[-PLANE_W / 2 - 0.14, -PLANE_H / 2, 0], [-PLANE_W / 2 - 0.14, PLANE_H / 2, 0]],
      [[PLANE_W / 2 + 0.16, -PLANE_H / 2, 0], [PLANE_W / 2 + 0.16, -PLANE_H / 2, BASE_DIST]],
    ];
    return segs.map(([a, b]) => {
      const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]);
      const m = new THREE.LineDashedMaterial({ color: 0x9aa8a0, transparent: true, opacity: 0.7, dashSize: 0.05, gapSize: 0.04 });
      const l = new THREE.Line(g, m);
      l.computeLineDistances();
      return l;
    });
  }, []);

  useFrame((_, dt) => {
    // expanded camera-rig controls
    const fov = camRig?.fov ?? 48;
    if (Math.abs(virtualCam.fov - fov) > 0.01) { virtualCam.fov = fov; virtualCam.updateProjectionMatrix(); }
    const baseDist = camRig?.distance ?? BASE_DIST;

    const f = getFrame ? getFrame() : null;
    const s = f ? moveAt(f.move, f.p, f.intensity) : { zoom: 1, x: 0, y: 0, rot: 0 };
    virtualCam.position.set(s.x * PLANE_W, -s.y * PLANE_H, baseDist / Math.max(0.55, s.zoom));
    virtualCam.lookAt(0, 0, 0);
    virtualCam.rotateZ((s.rot * Math.PI) / 180 + ((camRig?.roll || 0) * Math.PI) / 180);
    virtualCam.updateMatrixWorld();
    helper.update();
    if (bodyRef.current) {
      bodyRef.current.position.copy(virtualCam.position);
      bodyRef.current.quaternion.copy(virtualCam.quaternion);
    }
    cornerLines.forEach((l) => {
      const pos = l.geometry.attributes.position;
      pos.setXYZ(1, virtualCam.position.x, virtualCam.position.y, virtualCam.position.z);
      pos.needsUpdate = true;
      l.computeLineDistances();
    });

    // auto-orbit spins the whole rig world
    if (camRig?.autoOrbit && rigRef.current && !dragging.current) rigRef.current.rotation.y += dt * 0.25;

    // the background image asset follows the XYZ drag
    if (planeGroupRef.current) {
      planeGroupRef.current.position.set(
        (manualOffset?.x || 0) * 2.4,
        (manualOffset?.y || 0) * 1.6,
        (manualOffset?.z || 0) * 2.2
      );
    }
  });

  return (
    <group ref={rigRef}>
      {/* background plane — draggable via the XYZ gizmo, clickable as a reference */}
      <group ref={planeGroupRef} onClick={(e) => { e.stopPropagation(); onSelectAsset?.('primary'); }}>
        <mesh>
          <planeGeometry args={[PLANE_W, PLANE_H]} />
          {texture
            ? <meshBasicMaterial map={texture} toneMapped={false} side={THREE.DoubleSide} />
            : <meshBasicMaterial color="#15201a" transparent opacity={0.5} side={THREE.DoubleSide} />}
        </mesh>
        <lineSegments geometry={planeEdges}>
          <lineBasicMaterial color={refId === 'primary' ? '#00ff9d' : '#e8efe9'} transparent opacity={0.7} />
        </lineSegments>
        {!texture && (
          <Html center position={[0, 0, 0.06]} style={{ pointerEvents: 'none' }}>
            <span className="cm3d-label">No image — the plane awaits its texture</span>
          </Html>
        )}
      </group>

      {/* extra media assets in the 3D world */}
      {media?.filter((m) => m.id !== 'primary').map((m) => (
        <MediaPlane key={m.id} item={m} selected={refId === m.id} onSelect={onSelectAsset} />
      ))}

      {/* dimension guides */}
      {dimLines.map((l, i) => <primitive key={`dim-${i}`} object={l} />)}
      <Html position={[0, -PLANE_H / 2 - 0.32, 0]} center style={{ pointerEvents: 'none' }}><span className="cm3d-label">Width</span></Html>
      <Html position={[-PLANE_W / 2 - 0.36, 0, 0]} center style={{ pointerEvents: 'none' }}><span className="cm3d-label">Height</span></Html>
      <Html position={[PLANE_W / 2 + 0.42, -PLANE_H / 2, BASE_DIST / 2]} center style={{ pointerEvents: 'none' }}><span className="cm3d-label">Depth</span></Html>

      {/* Axis handles follow and translate the selected asset in rig space. */}
      <CamAssetAxes key={selected?.id || 'primary'} id={selected?.id || 'primary'} position={assetPosition} scale={selected?.scale || 1} onSelect={onSelectAsset} onMove={onMoveAsset} dragging={dragging} />

      {/* projection lines + frustum */}
      {cornerLines.map((l, i) => <primitive key={i} object={l} />)}
      <primitive object={helper} />

      {/* camera body */}
      <group ref={bodyRef}>
        <mesh>
          <boxGeometry args={[0.32, 0.22, 0.38]} />
          <meshBasicMaterial color="#dfe8e2" />
        </mesh>
        <mesh position={[0, 0, 0.26]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.1, 0.16, 20]} />
          <meshBasicMaterial color="#00ff9d" />
        </mesh>
      </group>

      <Grid position={[0, -PLANE_H / 2, 0]} args={[30, 30]} cellSize={0.4} cellThickness={0.5} cellColor="#223028" sectionSize={2} sectionThickness={0.9} sectionColor="#31503e" fadeDistance={26} fadeStrength={2.2} infiniteGrid />
    </group>
  );
}

// After Effects-style 3D rig view — same virtual camera, seen from the outside.
export default function Cam3DView({ image, media, manualOffset, camRig, onSelectAsset, refId, onOffset, onMoveAsset, getFrame, label }) {
  return (
    <div className="relative h-full w-full">
      <Canvas camera={{ position: [2.7, 1.4, 4.9], fov: 42 }} dpr={[1, 2]}>
        <color attach="background" args={['#0c0e0d']} />
        <fog attach="fog" args={['#0c0e0d', 14, 32]} />
        <Rig image={image} media={media} manualOffset={manualOffset} camRig={camRig} onSelectAsset={onSelectAsset} refId={refId} getFrame={getFrame} onMoveAsset={onMoveAsset} />
        <OrbitControls makeDefault target={[0, 0, 0]} minDistance={2.2} maxDistance={14} />
        <GizmoHelper alignment="bottom-right" margin={[70, 70]}>
          <GizmoViewport axisColors={['#ff5f56', '#8dff6a', '#4d9fff']} labelColor="#0c0e0d" />
        </GizmoHelper>
      </Canvas>

      {/* HUD overlay */}
      <div className="cm3d-hud left-4 top-4">
        <p className="cm-display text-[11px] tracking-[0.3em]">3D CAMERA RIG</p>
        <p className="mt-1 text-[9px] uppercase tracking-[0.22em] text-[hsl(var(--cm-muted))]">Frustum synced to the 2D render</p>
      </div>
      {label && (
        <div className="cm3d-hud bottom-4 left-4 text-[10px] uppercase tracking-[0.22em] text-[hsl(var(--cm-muted))]">{label}</div>
      )}
      <div className="cm3d-hud top-4 right-4 text-[9px] uppercase tracking-[0.22em] text-[hsl(var(--cm-muted))]">Click an asset to reference it</div>
      <div className="cm3d-hud bottom-4 right-4 text-[9px] uppercase tracking-[0.22em] text-[hsl(var(--cm-muted))]">Drag colored axes to move asset · drag empty space to orbit</div>
      <div className="cm3d-ring" />
      <div className="cm3d-corner left-2 top-2 border-b-0 border-r-0" />
      <div className="cm3d-corner right-2 top-2 border-b-0 border-l-0" />
      <div className="cm3d-corner bottom-2 left-2 border-t-0 border-r-0" />
      <div className="cm3d-corner bottom-2 right-2 border-t-0 border-l-0" />
    </div>
  );
}