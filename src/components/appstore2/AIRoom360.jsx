import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { X, Maximize2, RotateCw, Sparkles } from "lucide-react";

export default function AIRoom360({ agent, onClose }) {
  const mountRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);

  useEffect(() => {
    if (!agent || !mountRef.current) return;

    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    // Scene
    const scene = new THREE.Scene();

    // Camera at center, looking outward
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1100);
    camera.position.set(0, 0, 0.1);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    // Sphere with image as inverted texture (panoramic environment)
    const geometry = new THREE.SphereGeometry(500, 64, 32);
    geometry.scale(-1, 1, 1); // invert so we see inside

    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";
    
    let mesh;
    loader.load(
      agent.image,
      (texture) => {
        const material = new THREE.MeshBasicMaterial({ map: texture });
        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        setLoading(false);
      },
      undefined,
      () => setLoading(false)
    );

    // Floating particles for ambience
    const particlesGeo = new THREE.BufferGeometry();
    const particleCount = 200;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 100;
    }
    particlesGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particlesMat = new THREE.PointsMaterial({
      color: 0x22d3ee,
      size: 0.4,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particles);

    // Mouse / touch drag to look around
    let isDragging = false;
    let lon = 0;
    let lat = 0;
    let onPointerDownLon = 0;
    let onPointerDownLat = 0;
    let onPointerDownX = 0;
    let onPointerDownY = 0;

    const onPointerDown = (e) => {
      isDragging = true;
      setAutoRotate(false);
      const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      const y = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
      onPointerDownX = x;
      onPointerDownY = y;
      onPointerDownLon = lon;
      onPointerDownLat = lat;
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      const y = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
      lon = (onPointerDownX - x) * 0.15 + onPointerDownLon;
      lat = (y - onPointerDownY) * 0.15 + onPointerDownLat;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    renderer.domElement.addEventListener("mousedown", onPointerDown);
    renderer.domElement.addEventListener("mousemove", onPointerMove);
    renderer.domElement.addEventListener("mouseup", onPointerUp);
    renderer.domElement.addEventListener("mouseleave", onPointerUp);
    renderer.domElement.addEventListener("touchstart", onPointerDown);
    renderer.domElement.addEventListener("touchmove", onPointerMove);
    renderer.domElement.addEventListener("touchend", onPointerUp);

    // Resize
    const handleResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // Animation loop
    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);

      if (autoRotate && !isDragging) {
        lon += 0.05;
      }

      lat = Math.max(-85, Math.min(85, lat));
      const phi = THREE.MathUtils.degToRad(90 - lat);
      const theta = THREE.MathUtils.degToRad(lon);

      const target = new THREE.Vector3(
        500 * Math.sin(phi) * Math.cos(theta),
        500 * Math.cos(phi),
        500 * Math.sin(phi) * Math.sin(theta)
      );
      camera.lookAt(target);

      particles.rotation.y += 0.0005;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("mousedown", onPointerDown);
      renderer.domElement.removeEventListener("mousemove", onPointerMove);
      renderer.domElement.removeEventListener("mouseup", onPointerUp);
      renderer.domElement.removeEventListener("mouseleave", onPointerUp);
      renderer.domElement.removeEventListener("touchstart", onPointerDown);
      renderer.domElement.removeEventListener("touchmove", onPointerMove);
      renderer.domElement.removeEventListener("touchend", onPointerUp);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      geometry.dispose();
      particlesGeo.dispose();
      particlesMat.dispose();
      renderer.dispose();
    };
  }, [agent, autoRotate]);

  if (!agent) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] bg-black"
      >
        {/* 3D Canvas Mount */}
        <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

        {/* Loading overlay */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black flex flex-col items-center justify-center z-10"
            >
              <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
              <div className="text-cyan-300 text-sm font-bold tracking-widest uppercase">Entering {agent.name}'s Room</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute top-0 left-0 right-0 z-20 p-4 sm:p-6 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent pointer-events-none"
        >
          <div className="pointer-events-auto">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-cyan-300 text-[10px] font-bold tracking-[0.2em] uppercase">Live · 360°</span>
            </div>
            <h2 className="text-white text-2xl sm:text-3xl font-[900] tracking-tight drop-shadow-2xl">
              {agent.name}
            </h2>
            <p className="text-white/70 text-xs sm:text-sm drop-shadow-lg">{agent.tagline}</p>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`w-10 h-10 rounded-full backdrop-blur ring-1 ring-white/20 flex items-center justify-center transition-colors ${
                autoRotate ? "bg-cyan-500/30 text-cyan-200" : "bg-black/60 text-white/80 hover:bg-black/80"
              }`}
              title="Auto-rotate"
            >
              <RotateCw className={`w-4 h-4 ${autoRotate ? "animate-spin" : ""}`} style={{ animationDuration: "4s" }} />
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur ring-1 ring-white/20 flex items-center justify-center text-white/80 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Bottom info card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="absolute bottom-0 left-0 right-0 z-20 p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-none"
        >
          <div className="max-w-2xl mx-auto pointer-events-auto">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-black/60 backdrop-blur-xl ring-1 ring-white/10">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-xs sm:text-sm leading-relaxed">{agent.description}</p>
                <div className="mt-2 text-white/40 text-[10px] tracking-wider">
                  Drag to look around · Tap rotate icon to toggle auto-spin
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}