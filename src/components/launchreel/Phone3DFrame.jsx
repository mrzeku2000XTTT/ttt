import React, { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, RoundedBox, Html } from "@react-three/drei";
import * as THREE from "three";

/**
 * Real 3D phone using three.js — solid rounded box body with
 * real thickness, a back face with camera module, and a video
 * texture on the front screen.
 */
export default function Phone3DFrame({
  videoUrl,
  autoRotate,
  isPlaying,
  onPlayPause,
  textTemplate,
  device,
  videoElRef,
}) {
  const controlsRef = useRef(null);

  const W = (device?.width || 300) / 100;
  const H = (device?.height || 620) / 100;
  const T = (device?.thickness || 18) / 100;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      style={{ background: "transparent" }}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 35 }}
        style={{ width: "100%", height: "100%", display: "block" }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 4, 5]} intensity={1.2} />
        <directionalLight position={[-3, -2, -4]} intensity={0.3} />
        <spotLight position={[0, 5, 3]} angle={0.3} penumbra={0.5} intensity={0.5} />

        <PhoneModel
          videoUrl={videoUrl}
          W={W}
          H={H}
          T={T}
          device={device}
          autoRotate={autoRotate}
          textTemplate={textTemplate}
          videoElRef={videoElRef}
          isPlaying={isPlaying}
        />

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          minDistance={4}
          maxDistance={14}
          enableZoom={true}
          target={[0, 0, 0]}
        />
      </Canvas>

      {/* Hint */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-white/25 flex items-center gap-3 pointer-events-none">
        <span>Drag to orbit</span>
        <span>·</span>
        <span>Scroll to zoom</span>
      </div>
    </div>
  );
}

function PhoneModel({ videoUrl, W, H, T, device, autoRotate, textTemplate, videoElRef, isPlaying }) {
  const groupRef = useRef(null);
  const videoTexture = useRef(null);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    if (!videoUrl) return;
    // Create or reuse a shared video element
    let v = videoElRef?.current;
    if (!v) {
      v = document.createElement("video");
      v.crossOrigin = "anonymous";
      v.loop = true;
      v.muted = true;
      v.playsInline = true;
      if (videoElRef) videoElRef.current = v;
    }
    v.src = videoUrl;
    v.play();

    const tex = new THREE.VideoTexture(v);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    videoTexture.current = tex;
    setVideoReady(true);

    return () => {
      if (v) { v.pause(); }
      tex.dispose();
    };
  }, [videoUrl, videoElRef]);

  // Play/pause control
  useEffect(() => {
    const v = videoElRef?.current;
    if (!v) return;
    if (isPlaying) v.play();
    else v.pause();
  }, [isPlaying, videoElRef]);

  // Auto-rotate
  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.4;
    }
  });

  const screenMaterial = useMemo(() => {
    if (!videoTexture.current) return new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.2 });
    return new THREE.MeshStandardMaterial({
      map: videoTexture.current,
      roughness: 0.1,
      metalness: 0.1,
    });
  }, [videoReady]);

  const bodyMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.4, metalness: 0.6 }),
    []
  );

  const backMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.5, metalness: 0.4 }),
    []
  );

  return (
    <group ref={groupRef} rotation={[0.1, -0.3, 0]}>
      {/* Phone body — solid rounded box with real thickness */}
      <RoundedBox args={[W, H, T]} radius={0.08} smoothness={8} material={bodyMaterial} castShadow receiveShadow />

      {/* Front screen — slightly inset, video textured */}
      <mesh position={[0, 0, T / 2 + 0.001]}>
        <planeGeometry args={[W * 0.92, H * 0.94]} />
        <primitive object={screenMaterial} attach="material" />
      </mesh>

      {/* Screen bezel frame (dark border around screen) */}
      <mesh position={[0, 0, T / 2 + 0.0005]}>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial color={0x000000} />
      </mesh>

      {/* Back face */}
      <mesh position={[0, 0, -T / 2 - 0.001]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[W * 0.98, H * 0.98]} />
        <primitive object={backMaterial} attach="material" />
      </mesh>

      {/* Camera module on back */}
      <mesh position={[-W * 0.22, H * 0.32, -T / 2 - 0.01]}>
        <boxGeometry args={[W * 0.3, W * 0.3, 0.02]} />
        <meshStandardMaterial color={0x111111} roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Camera lenses */}
      {[
        [-W * 0.28, H * 0.38],
        [-W * 0.16, H * 0.38],
        [-W * 0.28, H * 0.26],
        [-W * 0.16, H * 0.26],
      ].map((pos, i) => (
        <mesh key={i} position={[pos[0], pos[1], -T / 2 - 0.02]}>
          <cylinderGeometry args={[W * 0.05, W * 0.05, 0.01, 16]} />
          <meshStandardMaterial color={0x333333} roughness={0.1} metalness={0.9} />
        </mesh>
      ))}

      {/* Side buttons */}
      <mesh position={[W / 2 + 0.005, H * 0.15, 0]}>
        <boxGeometry args={[0.01, H * 0.12, T * 0.6]} />
        <meshStandardMaterial color={0x333333} metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[W / 2 + 0.005, -H * 0.05, 0]}>
        <boxGeometry args={[0.01, H * 0.2, T * 0.6]} />
        <meshStandardMaterial color={0x333333} metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[-W / 2 - 0.005, H * 0.2, 0]}>
        <boxGeometry args={[0.01, H * 0.1, T * 0.6]} />
        <meshStandardMaterial color={0x333333} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Text overlay on screen (HTML overlay positioned in 3D) */}
      {textTemplate && (
        <Html
          position={[0, textTemplate.position === "top" ? H * 0.35 : textTemplate.position === "center" ? 0 : -H * 0.35, T / 2 + 0.01]}
          center
          distanceFactor={3}
          style={{ pointerEvents: "none" }}
        >
          <TextOverlay template={textTemplate} />
        </Html>
      )}
    </group>
  );
}

function TextOverlay({ template }) {
  if (!template) return null;
  const styleMap = {
    title: { fontSize: "28px", fontWeight: 900, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.9)" },
    subtitle: { fontSize: "16px", fontWeight: 600, color: "rgba(255,255,255,0.9)", textShadow: "0 2px 6px rgba(0,0,0,0.8)" },
    caption: { fontSize: "14px", fontWeight: 600, color: "#fff", background: "rgba(0,0,0,0.75)", padding: "6px 12px", borderRadius: "6px" },
    badge: { fontSize: "12px", fontWeight: 900, color: "#000", background: "#fff", padding: "4px 10px", borderRadius: "999px" },
  };
  const s = styleMap[template.style] || styleMap.caption;
  return (
    <div style={{ textAlign: "center", maxWidth: "240px", ...s }}>
      {template.text}
    </div>
  );
}