import React, { useRef, useEffect, useCallback } from "react";
import * as THREE from "three";

export default function DAGCanvas3D({ blocks, isMobile }) {
  const mountRef = useRef(null);
  const stateRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    nodes: [],
    particles: null,
    wormholeRings: [],
    satellites: [],
    newBlocks: [],
    seenIds: new Set(),
    time: 0,
    drag: { active: false, lastX: 0, lastY: 0 },
    rotX: 0.3,
    rotY: 0,
    zoom: 1,
    animId: null,
  });

  useEffect(() => {
    if (!blocks?.length) return;
    const s = stateRef.current;
    blocks.forEach((block) => {
      const id = block.blockHash || block.header?.hashMerkleRoot;
      if (id && s.seenIds.has(id)) return;
      if (id) s.seenIds.add(id);
      s.newBlocks.push(block);
    });
  }, [blocks]);

  const init = useCallback(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const W = mount.clientWidth;
    const H = mount.clientHeight;
    const s = stateRef.current;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x01040c);
    scene.fog = new THREE.FogExp2(0x01040c, 0.018);
    s.scene = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(65, W / H, 0.1, 500);
    camera.position.set(0, 0, 22);
    s.camera = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: false });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    mount.appendChild(renderer.domElement);
    s.renderer = renderer;

    // ── Wormhole tunnel rings ──────────────────────────────────────────────
    for (let i = 0; i < (isMobile ? 14 : 22); i++) {
      const geo = new THREE.TorusGeometry(3 + i * 0.45, 0.04, 8, 80);
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.46 + i * 0.01, 1, 0.55),
        transparent: true,
        opacity: 0.35 - i * 0.012,
      });
      const ring = new THREE.Mesh(geo, mat);
      ring.position.z = -i * 1.8;
      ring.userData = { baseZ: -i * 1.8, speed: 0.9 + i * 0.02 };
      scene.add(ring);
      s.wormholeRings.push(ring);
    }

    // ── Star particles ─────────────────────────────────────────────────────
    const starCount = isMobile ? 800 : 2000;
    const starGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 8 + Math.random() * 80;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.08, transparent: true, opacity: 0.7 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);
    s.particles = stars;

    // ── Portal glow at center ──────────────────────────────────────────────
    const portalGeo = new THREE.SphereGeometry(1.8, 32, 32);
    const portalMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.18 });
    const portal = new THREE.Mesh(portalGeo, portalMat);
    portal.userData.isPortal = true;
    scene.add(portal);

    // Outer glow ring
    const glowRingGeo = new THREE.TorusGeometry(2.2, 0.35, 16, 100);
    const glowRingMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.35 });
    scene.add(new THREE.Mesh(glowRingGeo, glowRingMat));

    // ── Orbiting Satellites ─────────────────────────────────────────────────
    const SAT_COUNT = isMobile ? 4 : 7;
    for (let i = 0; i < SAT_COUNT; i++) {
      const isChain = i % 3 === 0;
      const geo = new THREE.SphereGeometry(isChain ? 0.22 : 0.15, 12, 12);
      const mat = new THREE.MeshBasicMaterial({
        color: isChain ? 0x00ffbe : new THREE.Color().setHSL(0.58 + i * 0.05, 1, 0.6),
        transparent: true,
        opacity: 0.9,
      });
      const sat = new THREE.Mesh(geo, mat);
      // Orbit ring
      const orbitR = 5 + (i % 3) * 1.5;
      const tiltX = (i * 0.7) % Math.PI;
      const tiltZ = (i * 0.5) % Math.PI;
      sat.userData = {
        orbitR,
        orbitSpeed: 0.4 + i * 0.12,
        tiltX,
        tiltZ,
        phase: (i / SAT_COUNT) * Math.PI * 2,
        isChain,
      };

      // Orbit path line
      const orbitPts = [];
      for (let a = 0; a <= Math.PI * 2; a += 0.08) {
        orbitPts.push(new THREE.Vector3(Math.cos(a) * orbitR, Math.sin(a) * orbitR * 0.55, 0));
      }
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPts);
      const orbitMat = new THREE.LineBasicMaterial({
        color: isChain ? 0x00ffbe : 0x0088ff,
        transparent: true,
        opacity: 0.15,
      });
      const orbitLine = new THREE.Line(orbitGeo, orbitMat);
      orbitLine.rotation.x = tiltX;
      orbitLine.rotation.z = tiltZ;
      scene.add(orbitLine);

      // Glow aura
      const aurGeo = new THREE.SphereGeometry(isChain ? 0.5 : 0.35, 8, 8);
      const aurMat = new THREE.MeshBasicMaterial({
        color: isChain ? 0x00ffbe : 0x0088ff,
        transparent: true,
        opacity: 0.12,
      });
      sat.userData.aura = new THREE.Mesh(aurGeo, aurMat);
      scene.add(sat.userData.aura);
      scene.add(sat);
      s.satellites.push(sat);
    }

    // Ambient + point lights
    scene.add(new THREE.AmbientLight(0x001a2e, 2));
    const pt = new THREE.PointLight(0x00ffcc, 3, 40);
    scene.add(pt);

    return renderer;
  }, [isMobile]);

  const spawnBlock = useCallback((block) => {
    const s = stateRef.current;
    if (!s.scene) return;

    const isChain = block.verboseData?.isChainBlock;
    const txCount = block.verboseData?.transactionCount || 1;

    // Size based on tx count: bigger blocks = more transactions
    const r = isChain
      ? Math.min(0.55, 0.3 + txCount * 0.02)
      : Math.min(0.4, 0.2 + txCount * 0.015);

    const geo = new THREE.SphereGeometry(r, isMobile ? 10 : 18, isMobile ? 10 : 18);
    const mat = new THREE.MeshBasicMaterial({
      color: isChain ? 0x00ffbe : 0x3399ff,
      transparent: true,
      opacity: 1,
    });
    const mesh = new THREE.Mesh(geo, mat);

    // Glow aura around each real block
    const aurGeo = new THREE.SphereGeometry(r * 2.2, 8, 8);
    const aurMat = new THREE.MeshBasicMaterial({
      color: isChain ? 0x00ffbe : 0x3399ff,
      transparent: true,
      opacity: 0.15,
    });
    const aura = new THREE.Mesh(aurGeo, aurMat);
    s.scene.add(aura);

    // Spawn at center (portal), burst outward
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const speed = 3.5 + Math.random() * 3;
    mesh.position.set(0, 0, 0);
    aura.position.set(0, 0, 0);

    mesh.userData = {
      vx: Math.sin(phi) * Math.cos(theta) * speed,
      vy: Math.sin(phi) * Math.sin(theta) * speed * 0.7,
      vz: Math.cos(phi) * speed * 0.8,
      age: 0,
      maxAge: 5 + Math.random() * 4,
      isChain,
      aura,
    };

    // Trail line
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(30 * 3), 3));
    trailGeo.setDrawRange(0, 0);
    const trail = new THREE.Line(
      trailGeo,
      new THREE.LineBasicMaterial({ color: isChain ? 0x00ffbe : 0x3399ff, transparent: true, opacity: 0.5 })
    );
    trail.userData = { positions: [], maxLen: 30 };
    s.scene.add(trail);
    mesh.userData.trail = trail;

    s.scene.add(mesh);
    s.nodes.push(mesh);
  }, [isMobile]);

  const animate = useCallback(() => {
    const s = stateRef.current;
    if (!s.renderer || !s.scene || !s.camera) return;

    s.time += 0.016;
    const t = s.time;

    // Consume queued blocks
    while (s.newBlocks.length > 0) {
      spawnBlock(s.newBlocks.shift());
    }

    // Apply camera orbit from drag/touch
    const pivot = new THREE.Object3D();
    pivot.rotation.x = s.rotX;
    pivot.rotation.y = s.rotY;
    const dir = new THREE.Vector3(0, 0, 1).applyEuler(pivot.rotation);
    s.camera.position.copy(dir.multiplyScalar(22 * s.zoom));
    s.camera.lookAt(0, 0, 0);

    // Animate wormhole rings — scroll toward viewer
    s.wormholeRings.forEach((ring, i) => {
      ring.position.z += ring.userData.speed * 0.04;
      ring.rotation.z += 0.003 * (i % 2 === 0 ? 1 : -1);
      if (ring.position.z > 8) {
        ring.position.z = ring.userData.baseZ;
      }
      ring.material.opacity = Math.max(0, 0.35 - (ring.position.z + 40) * 0.005);
    });

    // Animate satellites
    s.satellites.forEach((sat) => {
      const d = sat.userData;
      const a = d.phase + t * d.orbitSpeed;
      const x = Math.cos(a) * d.orbitR;
      const y = Math.sin(a) * d.orbitR * 0.55;
      // apply tilt
      const cx = x * Math.cos(d.tiltZ) - y * Math.sin(d.tiltX);
      const cy = x * Math.sin(d.tiltZ) + y * Math.cos(d.tiltX);
      const cz = -x * Math.sin(d.tiltX) * 0.3;
      sat.position.set(cx, cy, cz);
      if (d.aura) d.aura.position.copy(sat.position);
      sat.material.opacity = 0.7 + 0.3 * Math.sin(t * 2.5 + d.phase);
    });

    // Animate block nodes
    const dt = 0.016;
    s.nodes = s.nodes.filter((mesh) => {
      const d = mesh.userData;
      d.age += dt;
      if (d.age > d.maxAge) {
        s.scene.remove(mesh);
        if (d.trail) s.scene.remove(d.trail);
        if (d.aura) s.scene.remove(d.aura);
        return false;
      }

      mesh.position.x += d.vx * dt;
      mesh.position.y += d.vy * dt;
      mesh.position.z += d.vz * dt;

      // Move aura with block
      if (d.aura) d.aura.position.copy(mesh.position);

      // Fade out near end of life
      const lifeRatio = d.age / d.maxAge;
      const opacity = lifeRatio > 0.7 ? 1 - (lifeRatio - 0.7) / 0.3 : 1;
      mesh.material.opacity = opacity;
      if (d.aura) d.aura.material.opacity = opacity * 0.15;

      // Update trail
      if (d.trail) {
        const tr = d.trail.userData;
        tr.positions.push(mesh.position.clone());
        if (tr.positions.length > tr.maxLen) tr.positions.shift();
        const posArr = d.trail.geometry.attributes.position.array;
        tr.positions.forEach((p, i) => {
          posArr[i * 3] = p.x;
          posArr[i * 3 + 1] = p.y;
          posArr[i * 3 + 2] = p.z;
        });
        d.trail.geometry.attributes.position.needsUpdate = true;
        d.trail.geometry.setDrawRange(0, tr.positions.length);
        d.trail.material.opacity = mesh.material.opacity * 0.35;
      }
      return true;
    });

    // Trim
    const MAX_NODES = isMobile ? 60 : 180;
    if (s.nodes.length > MAX_NODES) {
      const toRemove = s.nodes.splice(0, s.nodes.length - MAX_NODES);
      toRemove.forEach((m) => {
        s.scene.remove(m);
        if (m.userData.trail) s.scene.remove(m.userData.trail);
      });
    }

    // Portal pulse
    s.scene.children.forEach((c) => {
      if (c.userData.isPortal) {
        c.material.opacity = 0.12 + 0.08 * Math.sin(t * 3.5);
        const ps = 1 + 0.08 * Math.sin(t * 4);
        c.scale.set(ps, ps, ps);
      }
    });

    s.renderer.render(s.scene, s.camera);
    s.animId = requestAnimationFrame(animate);
  }, [isMobile, spawnBlock]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    init();
    stateRef.current.animId = requestAnimationFrame(animate);

    const handleResize = () => {
      const s = stateRef.current;
      if (!s.renderer || !s.camera) return;
      const W = mount.clientWidth;
      const H = mount.clientHeight;
      s.camera.aspect = W / H;
      s.camera.updateProjectionMatrix();
      s.renderer.setSize(W, H);
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(mount);

    // Mouse drag
    const onDown = (e) => {
      stateRef.current.drag = { active: true, lastX: e.clientX ?? e.touches?.[0]?.clientX, lastY: e.clientY ?? e.touches?.[0]?.clientY };
    };
    const onMove = (e) => {
      const s = stateRef.current;
      if (!s.drag.active) return;
      const x = e.clientX ?? e.touches?.[0]?.clientX;
      const y = e.clientY ?? e.touches?.[0]?.clientY;
      s.rotY += (x - s.drag.lastX) * 0.008;
      s.rotX += (y - s.drag.lastY) * 0.008;
      s.rotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, s.rotX));
      s.drag.lastX = x;
      s.drag.lastY = y;
    };
    const onUp = () => { stateRef.current.drag.active = false; };
    const onWheel = (e) => {
      stateRef.current.zoom = Math.max(0.4, Math.min(3, stateRef.current.zoom + e.deltaY * 0.001));
    };

    mount.addEventListener("mousedown", onDown);
    mount.addEventListener("mousemove", onMove);
    mount.addEventListener("mouseup", onUp);
    mount.addEventListener("mouseleave", onUp);
    mount.addEventListener("touchstart", onDown, { passive: true });
    mount.addEventListener("touchmove", onMove, { passive: true });
    mount.addEventListener("touchend", onUp);
    mount.addEventListener("wheel", onWheel, { passive: true });

    return () => {
      cancelAnimationFrame(stateRef.current.animId);
      ro.disconnect();
      if (stateRef.current.renderer) {
        mount.removeChild(stateRef.current.renderer.domElement);
        stateRef.current.renderer.dispose();
      }
      mount.removeEventListener("mousedown", onDown);
      mount.removeEventListener("mousemove", onMove);
      mount.removeEventListener("mouseup", onUp);
      mount.removeEventListener("mouseleave", onUp);
      mount.removeEventListener("touchstart", onDown);
      mount.removeEventListener("touchmove", onMove);
      mount.removeEventListener("touchend", onUp);
      mount.removeEventListener("wheel", onWheel);
    };
  }, [init, animate]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full block"
      style={{ background: "#01040c", touchAction: "none", cursor: "grab" }}
    />
  );
}