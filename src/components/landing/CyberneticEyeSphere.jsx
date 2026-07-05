import React, { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = `
  varying vec3 vViewNormal;
  varying vec3 vViewPosition;
  void main() {
    vViewNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec3 vViewNormal;
  varying vec3 vViewPosition;
  uniform float uTime;
  uniform vec3 uGold;
  uniform vec3 uBrightGold;
  uniform vec3 uBase;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  void main() {
    vec3 n = normalize(vViewNormal);
    vec2 p = n.xy;
    float r = length(p);
    float theta = atan(p.y, p.x);

    // Radial circuit lines converging toward center
    float numLines = 28.0;
    float angleSeg = theta / 6.2831853 * numLines;
    float lineFract = abs(fract(angleSeg) - 0.5);
    float lineThick = 0.012 + 0.05 * r;
    float radialLines = smoothstep(lineThick, 0.0, lineFract);
    float radialMask = smoothstep(0.06, 0.18, r) * smoothstep(0.85, 0.5, r);
    radialLines *= radialMask;
    float breakN = noise(vec2(theta * 6.0, r * 16.0 + uTime * 0.4));
    radialLines *= step(0.3, breakN);

    // Concentric circuit rings
    float ringFract = abs(fract(r * 9.0) - 0.5);
    float rings = smoothstep(0.02, 0.0, ringFract);
    rings *= smoothstep(0.1, 0.22, r) * smoothstep(0.85, 0.5, r);
    rings *= step(0.42, noise(vec2(r * 11.0, theta * 2.0 - uTime * 0.2)));

    // Pulse traveling outward
    float pulse = 0.5 + 0.5 * sin(r * 22.0 - uTime * 2.5);

    // Pupil glow (center)
    float pupil = smoothstep(0.2, 0.0, r);
    float pupilPulse = 0.75 + 0.25 * sin(uTime * 1.3);

    // Iris ring
    float irisRing = smoothstep(0.006, 0.0, abs(r - 0.16)) * 0.5;

    // Fresnel rim
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - max(dot(n, viewDir), 0.0), 3.0);

    vec3 color = uBase;
    vec3 lineCol = mix(uGold, uBrightGold, pulse);
    color = mix(color, lineCol, radialLines * 0.85);
    color = mix(color, lineCol * 0.8, rings * 0.5);
    color += uBrightGold * pupil * pupilPulse * 0.7;
    color += uBrightGold * irisRing;
    color += uGold * fresnel * 0.8;

    gl_FragColor = vec4(color, 1.0);
  }
`;

function EyeSphere() {
  const groupRef = useRef();
  const meshRef = useRef();
  const mouseRef = useRef({ x: 0, y: 0 });

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uGold: { value: new THREE.Color("#C5A059") },
          uBrightGold: { value: new THREE.Color("#FDB931") },
          uBase: { value: new THREE.Color("#0A0A0A") },
        },
      }),
    []
  );

  useEffect(() => {
    const handler = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.06;
    }
    if (groupRef.current) {
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        mouseRef.current.y * 0.12,
        0.04
      );
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        -mouseRef.current.x * 0.08,
        0.04
      );
    }
    material.uniforms.uTime.value += delta;
  });

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} scale={1.5} material={material}>
        <sphereGeometry args={[1, 128, 128]} />
      </mesh>
    </group>
  );
}

function CenterLight() {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.intensity = 1.8 + Math.sin(state.clock.elapsedTime * 1.3) * 0.5;
    }
  });
  return (
    <pointLight
      ref={ref}
      position={[0, 0, 2]}
      color="#FDB931"
      intensity={1.8}
      distance={12}
    />
  );
}

export default function CyberneticEyeSphere() {
  return (
    <Canvas
      camera={{ position: [0, 0, 3.5], fov: 45 }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        background: "#0A0A0A",
      }}
    >
      <color attach="background" args={["#0A0A0A"]} />
      <ambientLight intensity={0.1} />
      <CenterLight />
      <EyeSphere />
    </Canvas>
  );
}