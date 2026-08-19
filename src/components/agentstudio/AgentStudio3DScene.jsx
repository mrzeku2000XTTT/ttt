import React, { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * 3D WebGL background for the AgentInternetStudio index.
 * Uses raw three.js (imperative) to avoid react-three-fiber applyProps
 * incompatibilities with the installed three version.
 */
export default function AgentStudio3DScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || window.innerWidth;
    const height = mount.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 200);
    camera.position.set(0, 0, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const l1 = new THREE.PointLight(0x22d3ee, 1.3);
    l1.position.set(5, 5, 5);
    scene.add(l1);
    const l2 = new THREE.PointLight(0xa855f7, 0.9);
    l2.position.set(-5, -3, -5);
    scene.add(l2);

    // Core group
    const core = new THREE.Group();
    scene.add(core);

    const ico = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.5, 1),
      new THREE.MeshStandardMaterial({ color: 0x22d3ee, wireframe: true, emissive: 0x0891b2, emissiveIntensity: 0.7 })
    );
    core.add(ico);

    const torus1 = new THREE.Mesh(
      new THREE.TorusGeometry(2.4, 0.02, 16, 120),
      new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x7c3aed, emissiveIntensity: 0.6 })
    );
    torus1.rotation.set(Math.PI / 2.2, 0, 0);
    core.add(torus1);

    const torus2 = new THREE.Mesh(
      new THREE.TorusGeometry(2.9, 0.02, 16, 120),
      new THREE.MeshStandardMaterial({ color: 0x67e8f9, emissive: 0x06b6d4, emissiveIntensity: 0.5 })
    );
    torus2.rotation.set(Math.PI / 1.7, Math.PI / 4, 0);
    core.add(torus2);

    // Particle starfield
    const count = 1200;
    const positions = new Float32Array(count * 3);
    const radius = 60;
    for (let i = 0; i < count; i++) {
      const r = radius * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const points = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({ size: 0.35, color: 0x67e8f9, sizeAttenuation: true, transparent: true, opacity: 0.85 })
    );
    scene.add(points);

    // Float bob
    let bob = 0;
    let raf;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const dt = 0.016;
      core.rotation.y += dt * 0.25;
      core.rotation.x += dt * 0.08;
      bob += dt;
      core.position.y = Math.sin(bob * 1.5) * 0.15;
      points.rotation.y += dt * 0.02;
      renderer.render(scene, camera);
    };
    animate();

    // Auto-rotate camera slowly
    let camAngle = 0;
    const camRaf = () => {
      camAngle += 0.0015;
      camera.position.x = Math.sin(camAngle) * 6;
      camera.position.z = Math.cos(camAngle) * 6;
      camera.lookAt(0, 0, 0);
      requestAnimationFrame(camRaf);
    };
    camRaf();

    const onResize = () => {
      const w = mount.clientWidth || window.innerWidth;
      const h = mount.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      pGeo.dispose();
      ico.geometry.dispose(); ico.material.dispose();
      torus1.geometry.dispose(); torus1.material.dispose();
      torus2.geometry.dispose(); torus2.material.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0" />;
}