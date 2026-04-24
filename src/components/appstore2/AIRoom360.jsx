import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCw, Sparkles } from "lucide-react";

export default function AIRoom360({ agent, onClose }) {
  const mountRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const autoRotateRef = useRef(true);

  useEffect(() => { autoRotateRef.current = autoRotate; }, [autoRotate]);

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

    // 360 sphere
    const geometry = new THREE.SphereGeometry(500, 64, 32);
    geometry.scale(-1, 1, 1);

    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";

    loader.load(
      agent.image,
      (texture) => {
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        setLoading(false);
      },
      undefined,
      () => setLoading(false)
    );

    // ---------- FLOATING FLYERS / BILLBOARDS ----------
    const flyerTextures = [];

    const makeFlyerTexture = (title, subtitle, accent = "#22d3ee") => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 320;
      const ctx = canvas.getContext("2d");

      // Background
      const grad = ctx.createLinearGradient(0, 0, 0, 320);
      grad.addColorStop(0, "rgba(0, 0, 0, 0.95)");
      grad.addColorStop(1, "rgba(10, 10, 30, 0.95)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 320);

      // Border
      ctx.strokeStyle = accent;
      ctx.lineWidth = 4;
      ctx.strokeRect(8, 8, 496, 304);

      // Corner brackets
      ctx.lineWidth = 6;
      const corners = [[16, 16], [496, 16], [16, 304], [496, 304]];
      corners.forEach(([x, y], i) => {
        ctx.beginPath();
        const dx = i % 2 === 0 ? 20 : -20;
        const dy = i < 2 ? 20 : -20;
        ctx.moveTo(x + dx, y);
        ctx.lineTo(x, y);
        ctx.lineTo(x, y + dy);
        ctx.stroke();
      });

      // Accent badge
      ctx.fillStyle = accent;
      ctx.fillRect(32, 36, 80, 6);

      // Title
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 42px sans-serif";
      ctx.fillText(title, 32, 120);

      // Subtitle
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "22px sans-serif";
      wrapText(ctx, subtitle, 32, 170, 450, 30);

      // Footer tag
      ctx.fillStyle = accent;
      ctx.font = "bold 14px monospace";
      ctx.fillText("TTT · AI AGENT", 32, 288);

      const texture = new THREE.CanvasTexture(canvas);
      flyerTextures.push(texture);
      return texture;
    };

    function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
      const words = text.split(" ");
      let line = "";
      let yy = y;
      for (let n = 0; n < words.length; n++) {
        const test = line + words[n] + " ";
        if (ctx.measureText(test).width > maxWidth && n > 0) {
          ctx.fillText(line, x, yy);
          line = words[n] + " ";
          yy += lineHeight;
          if (yy > y + lineHeight * 3) break;
        } else {
          line = test;
        }
      }
      ctx.fillText(line, x, yy);
    }

    const flyers = [
      {
        tex: makeFlyerTexture(agent.name, agent.tagline || "AI Agent", "#22d3ee"),
        position: [30, 5, -80],
        rotation: [0, 0.3, 0],
      },
      {
        tex: makeFlyerTexture("ABOUT", agent.description || "Part of the TTT ecosystem", "#a855f7"),
        position: [-60, 0, -50],
        rotation: [0, -0.5, 0],
      },
      {
        tex: makeFlyerTexture("STATUS", agent.badge || "ONLINE", "#10b981"),
        position: [-20, 10, 60],
        rotation: [0, Math.PI + 0.3, 0],
      },
      {
        tex: makeFlyerTexture("CATEGORY", agent.category || "AI AGENT", "#ec4899"),
        position: [70, -5, 40],
        rotation: [0, -Math.PI / 2 - 0.3, 0],
      },
    ];

    const flyerMeshes = [];
    flyers.forEach((f) => {
      const flyerGeo = new THREE.PlaneGeometry(20, 12.5);
      const flyerMat = new THREE.MeshBasicMaterial({
        map: f.tex,
        transparent: true,
        side: THREE.DoubleSide,
      });
      const flyerMesh = new THREE.Mesh(flyerGeo, flyerMat);
      flyerMesh.position.set(...f.position);
      flyerMesh.rotation.set(...f.rotation);
      flyerMesh.userData.basePos = flyerMesh.position.clone();
      flyerMesh.userData.floatOffset = Math.random() * Math.PI * 2;
      scene.add(flyerMesh);
      flyerMeshes.push(flyerMesh);
    });

    // Ambient particles
    const particlesGeo = new THREE.BufferGeometry();
    const particleCount = 200;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 150;
    }
    particlesGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particlesMat = new THREE.PointsMaterial({
      color: 0x22d3ee,
      size: 0.5,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particles);

    // Drag to look
    let isDragging = false;
    let lon = 0, lat = 0;
    let downLon = 0, downLat = 0, downX = 0, downY = 0;

    const getPt = (e) => ({
      x: e.clientX ?? e.touches?.[0]?.clientX ?? 0,
      y: e.clientY ?? e.touches?.[0]?.clientY ?? 0,
    });

    const onDown = (e) => {
      isDragging = true;
      setAutoRotate(false);
      const p = getPt(e);
      downX = p.x; downY = p.y;
      downLon = lon; downLat = lat;
    };
    const onMove = (e) => {
      if (!isDragging) return;
      const p = getPt(e);
      lon = (downX - p.x) * 0.15 + downLon;
      lat = (p.y - downY) * 0.15 + downLat;
    };
    const onUp = () => { isDragging = false; };

    const canvas = renderer.domElement;
    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseup", onUp);
    canvas.addEventListener("mouseleave", onUp);
    canvas.addEventListener("touchstart", onDown);
    canvas.addEventListener("touchmove", onMove);
    canvas.addEventListener("touchend", onUp);

    const handleResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    let frameId;
    const clock = new THREE.Clock();
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      if (autoRotateRef.current && !isDragging) lon += 0.05;

      lat = Math.max(-85, Math.min(85, lat));
      const phi = THREE.MathUtils.degToRad(90 - lat);
      const theta = THREE.MathUtils.degToRad(lon);

      camera.lookAt(
        500 * Math.sin(phi) * Math.cos(theta),
        500 * Math.cos(phi),
        500 * Math.sin(phi) * Math.sin(theta)
      );

      // Float & gently turn flyers toward camera
      flyerMeshes.forEach((m, i) => {
        m.position.y = m.userData.basePos.y + Math.sin(t * 0.8 + m.userData.floatOffset) * 2;
        m.rotation.z = Math.sin(t * 0.5 + i) * 0.04;
      });

      particles.rotation.y += 0.0005;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("mouseleave", onUp);
      canvas.removeEventListener("touchstart", onDown);
      canvas.removeEventListener("touchmove", onMove);
      canvas.removeEventListener("touchend", onUp);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      geometry.dispose();
      particlesGeo.dispose();
      particlesMat.dispose();
      flyerTextures.forEach(t => t.dispose());
      flyerMeshes.forEach(m => { m.geometry.dispose(); m.material.dispose(); });
      renderer.dispose();
    };
  }, [agent]);

  if (!agent) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] bg-black"
      >
        <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

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
            <h2 className="text-white text-2xl sm:text-3xl font-[900] tracking-tight drop-shadow-2xl">{agent.name}</h2>
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
                  Drag to look around · Floating flyers contain agent info
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}