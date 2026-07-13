import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { createAgentRobots } from "@/components/agenticworld/createAgentRobots";

// 3D animated cyber-city — teal wireframe grid, glowing towers, floating data particles
export default function AgenticCityScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000508, 0.016);

    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 400);
    camera.position.set(0, 14, 46);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000407);
    mount.appendChild(renderer.domElement);

    // Glowing grid floor
    const grid = new THREE.GridHelper(300, 90, 0x0e7490, 0x083344);
    grid.position.y = 0;
    scene.add(grid);

    // City towers — dark boxes with teal glowing edges
    const towers = new THREE.Group();
    const boxMat = new THREE.MeshBasicMaterial({ color: 0x010c12 });
    const seededRand = (() => { let s = 42; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
    for (let i = 0; i < 140; i++) {
      const w = 1.5 + seededRand() * 3.5;
      const h = 3 + seededRand() * seededRand() * 34;
      const d = 1.5 + seededRand() * 3.5;
      const geo = new THREE.BoxGeometry(w, h, d);
      const box = new THREE.Mesh(geo, boxMat);
      const angle = seededRand() * Math.PI * 2;
      const radius = 18 + seededRand() * 110;
      box.position.set(Math.cos(angle) * radius, h / 2, Math.sin(angle) * radius - 20);
      towers.add(box);
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: 0x155e75, transparent: true, opacity: 0.55 })
      );
      edges.position.copy(box.position);
      towers.add(edges);
      // Random window lights on taller towers
      if (h > 14 && seededRand() > 0.4) {
        const lightGeo = new THREE.PlaneGeometry(w * 0.75, 0.22);
        const lightMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
        const floors = 2 + Math.floor(seededRand() * 4);
        for (let f = 0; f < floors; f++) {
          const win = new THREE.Mesh(lightGeo, lightMat);
          win.position.set(box.position.x, 2 + seededRand() * (h - 3), box.position.z + d / 2 + 0.02);
          towers.add(win);
        }
      }
    }
    scene.add(towers);

    // Floating data particles
    const pCount = 900;
    const positions = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 260;
      positions[i * 3 + 1] = Math.random() * 55;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 260;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
      color: 0x7dd3fc, size: 0.35, transparent: true, opacity: 0.65, sizeAttenuation: true,
    }));
    scene.add(particles);

    // Agentic humanoid robots wandering the open world
    const robots = createAgentRobots(scene, 12);

    // Slow camera drift
    let frame;
    const clock = new THREE.Clock();
    let lastT = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const dt = Math.min(t - lastT, 0.05);
      lastT = t;
      robots.update(t, dt);
      camera.position.x = Math.sin(t * 0.05) * 10;
      camera.position.y = 14 + Math.sin(t * 0.08) * 2;
      camera.lookAt(0, 8, -10);
      particles.rotation.y = t * 0.008;
      particles.position.y = Math.sin(t * 0.15) * 1.2;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      robots.dispose();
      renderer.dispose();
      pGeo.dispose();
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="fixed inset-0" />;
}