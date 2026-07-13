import React, { useEffect, useRef } from "react";
import * as THREE from "three";

// 3D animated forge-world — molten horizon, glowing ember grid, floating rings and sparks
export default function IgraHorizonScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0302, 0.018);

    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 400);
    camera.position.set(0, 10, 42);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x070201);
    mount.appendChild(renderer.domElement);

    // Ember grid floor
    const grid = new THREE.GridHelper(300, 80, 0xb45309, 0x431407);
    scene.add(grid);

    // Molten sun on the horizon
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(14, 48, 48),
      new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.85 })
    );
    sun.position.set(0, 10, -110);
    scene.add(sun);
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(20, 48, 48),
      new THREE.MeshBasicMaterial({ color: 0xfb923c, transparent: true, opacity: 0.15 })
    );
    halo.position.copy(sun.position);
    scene.add(halo);

    // Great L2 rings orbiting the horizon — the "covenant gates"
    const rings = [];
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(22 + i * 7, 0.18, 12, 120),
        new THREE.MeshBasicMaterial({ color: i === 1 ? 0xfdba74 : 0xea580c, transparent: true, opacity: 0.5 - i * 0.12 })
      );
      ring.position.copy(sun.position);
      ring.rotation.x = Math.PI / 2.4 + i * 0.18;
      scene.add(ring);
      rings.push(ring);
    }

    // Obsidian monoliths with glowing edges
    const monoliths = new THREE.Group();
    const rand = (() => { let s = 7; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
    const darkMat = new THREE.MeshBasicMaterial({ color: 0x120503 });
    for (let i = 0; i < 90; i++) {
      const w = 1.5 + rand() * 3, h = 4 + rand() * rand() * 30, d = 1.5 + rand() * 3;
      const geo = new THREE.BoxGeometry(w, h, d);
      const box = new THREE.Mesh(geo, darkMat);
      const a = rand() * Math.PI * 2, r = 20 + rand() * 105;
      box.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r - 15);
      monoliths.add(box);
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: 0x9a3412, transparent: true, opacity: 0.55 })
      );
      edges.position.copy(box.position);
      monoliths.add(edges);
    }
    scene.add(monoliths);

    // Rising ember sparks
    const pCount = 800;
    const positions = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 240;
      positions[i * 3 + 1] = Math.random() * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 240;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const embers = new THREE.Points(pGeo, new THREE.PointsMaterial({
      color: 0xfdba74, size: 0.32, transparent: true, opacity: 0.7, sizeAttenuation: true,
    }));
    scene.add(embers);

    let frame;
    const clock = new THREE.Clock();
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      camera.position.x = Math.sin(t * 0.05) * 9;
      camera.position.y = 10 + Math.sin(t * 0.07) * 1.6;
      camera.lookAt(0, 9, -40);
      rings.forEach((r, i) => { r.rotation.z = t * (0.05 + i * 0.02); });
      embers.rotation.y = t * 0.01;
      const pos = pGeo.attributes.position;
      for (let i = 0; i < pCount; i++) {
        let y = pos.getY(i) + 0.012;
        if (y > 52) y = 0;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
      halo.scale.setScalar(1 + Math.sin(t * 0.8) * 0.04);
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
      renderer.dispose();
      pGeo.dispose();
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="fixed inset-0" />;
}