import React, { useRef, useEffect } from "react";
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

    float numLines = 28.0;
    float angleSeg = theta / 6.2831853 * numLines;
    float lineFract = abs(fract(angleSeg) - 0.5);
    float lineThick = 0.012 + 0.05 * r;
    float radialLines = smoothstep(lineThick, 0.0, lineFract);
    float radialMask = smoothstep(0.06, 0.18, r) * smoothstep(0.85, 0.5, r);
    radialLines *= radialMask;
    float breakN = noise(vec2(theta * 6.0, r * 16.0 + uTime * 0.4));
    radialLines *= step(0.3, breakN);

    float ringFract = abs(fract(r * 9.0) - 0.5);
    float rings = smoothstep(0.02, 0.0, ringFract);
    rings *= smoothstep(0.1, 0.22, r) * smoothstep(0.85, 0.5, r);
    rings *= step(0.42, noise(vec2(r * 11.0, theta * 2.0 - uTime * 0.2)));

    float pulse = 0.5 + 0.5 * sin(r * 22.0 - uTime * 2.5);
    float pupil = smoothstep(0.2, 0.0, r);
    float pupilPulse = 0.75 + 0.25 * sin(uTime * 1.3);
    float irisRing = smoothstep(0.006, 0.0, abs(r - 0.16)) * 0.5;

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

export default function CyberneticEyeSphere() {
  const mountRef = useRef(null);
  const stateRef = useRef({ renderer: null, animId: null, material: null });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const W = mount.clientWidth;
    const H = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0A0A0A");

    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0, 0, 3.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.1));
    const pointLight = new THREE.PointLight("#FDB931", 1.8, 12);
    pointLight.position.set(0, 0, 2);
    scene.add(pointLight);

    const group = new THREE.Group();

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uGold: { value: new THREE.Color("#C5A059") },
        uBrightGold: { value: new THREE.Color("#FDB931") },
        uBase: { value: new THREE.Color("#0A0A0A") },
      },
    });

    const geometry = new THREE.SphereGeometry(1, 128, 128);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.setScalar(1.5);
    group.add(mesh);

    scene.add(group);

    const s = stateRef.current;
    s.renderer = renderer;
    s.material = material;

    const mouse = { x: 0, y: 0 };
    const onMouseMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", onMouseMove);

    const handleResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(mount);

    let last = performance.now();
    const animate = () => {
      const now = performance.now();
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;

      mesh.rotation.y += delta * 0.06;
      group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, mouse.y * 0.12, 0.04);
      group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, -mouse.x * 0.08, 0.04);
      pointLight.intensity = 1.8 + Math.sin(now / 1000 * 1.3) * 0.5;

      material.uniforms.uTime.value += delta;

      renderer.render(scene, camera);
      s.animId = requestAnimationFrame(animate);
    };
    s.animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(s.animId);
      ro.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      geometry.dispose();
      material.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      s.renderer = null;
      s.material = null;
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        background: "#0A0A0A",
      }}
    />
  );
}