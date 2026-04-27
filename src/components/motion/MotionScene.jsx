import React, { useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";

/* Device frame: rounded rectangle with screen plane mapped to user texture */
function DeviceMesh({ texture, settings }) {
  const groupRef = useRef();

  // Smoothly interpolate camera-like transforms each frame
  useFrame(() => {
    if (!groupRef.current) return;
    const g = groupRef.current;
    const targetRotX = THREE.MathUtils.degToRad(settings.tiltX);
    const targetRotY = THREE.MathUtils.degToRad(settings.tiltY);
    const targetRotZ = THREE.MathUtils.degToRad(settings.roll);
    g.rotation.x += (targetRotX - g.rotation.x) * 0.15;
    g.rotation.y += (targetRotY - g.rotation.y) * 0.15;
    g.rotation.z += (targetRotZ - g.rotation.z) * 0.15;
    g.position.x += (settings.panX - g.position.x) * 0.15;
    g.position.y += (-settings.panY - g.position.y) * 0.15;
    const targetScale = settings.zoom;
    g.scale.x += (targetScale - g.scale.x) * 0.15;
    g.scale.y += (targetScale - g.scale.y) * 0.15;
    g.scale.z += (targetScale - g.scale.z) * 0.15;
  });

  // Compute aspect from texture
  const aspect = useMemo(() => {
    if (!texture?.image) return 16 / 10;
    return texture.image.width / texture.image.height;
  }, [texture]);

  const w = 4 * Math.min(aspect, 2);
  const h = w / aspect;
  const bezel = 0.18;

  return (
    <group ref={groupRef}>
      {/* Device body (rounded look via slightly larger dark plane) */}
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[w + bezel, h + bezel]} />
        <meshBasicMaterial color="#0a0a0a" />
      </mesh>

      {/* Subtle inner highlight ring */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[w + bezel * 0.5, h + bezel * 0.5]} />
        <meshBasicMaterial color="#1a1a1a" />
      </mesh>

      {/* Screen with the user's image */}
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  );
}

function ScreenshotPlane({ url, settings }) {
  const texture = useLoader(THREE.TextureLoader, url);
  texture.colorSpace = THREE.SRGBColorSpace;
  return <DeviceMesh texture={texture} settings={settings} />;
}

export default function MotionScene({ imageUrl, settings, canvasRef, bgGradient }) {
  return (
    <Canvas
      ref={canvasRef}
      gl={{ preserveDrawingBuffer: true, antialias: true, alpha: true }}
      dpr={[1, 2]}
      camera={{ position: [0, 0, 6], fov: 45 }}
      style={{ background: bgGradient, borderRadius: 16 }}
    >
      <ambientLight intensity={1} />
      {imageUrl && (
        <React.Suspense fallback={null}>
          <ScreenshotPlane url={imageUrl} settings={settings} />
        </React.Suspense>
      )}
    </Canvas>
  );
}