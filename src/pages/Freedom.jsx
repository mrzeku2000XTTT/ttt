import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";

function AvatarConfigurator() {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const [bodyColor, setBodyColor] = useState("#00d4ff");
  const [eyeColor, setEyeColor] = useState("#ffffff");
  const [bodyColorVal, setBodyColorVal] = useState(0x00d4ff);
  const [eyeColorVal, setEyeColorVal] = useState(0xffffff);
  const [glowIntensity, setGlowIntensity] = useState(1.5);
  const robotPartsRef = useRef({});

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x111133, 1);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x00d4ff, 3, 20);
    pointLight.position.set(0, 3, 3);
    scene.add(pointLight);

    const rimLight = new THREE.PointLight(0x8844ff, 2, 15);
    rimLight.position.set(-3, 0, -2);
    scene.add(rimLight);

    const mat = (color, opacity = 1, emissive = 0x000000) => new THREE.MeshStandardMaterial({
      color,
      emissive,
      emissiveIntensity: opacity === 1 ? 0 : 0.5,
      metalness: 0.85,
      roughness: 0.15,
      transparent: opacity < 1,
      opacity,
    });

    const bodyMat = mat(bodyColorVal, 1, bodyColorVal);
    const darkMat = mat(0x0a0a0a, 1);
    const glassMat = mat(0x00ccff, 0.2, 0x00aaff);
    const eyeMat = new THREE.MeshStandardMaterial({ color: eyeColorVal, emissive: eyeColorVal, emissiveIntensity: 2, metalness: 0, roughness: 0 });

    const parts = {};

    // HEAD
    const headGeo = new THREE.BoxGeometry(1, 1, 1);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.set(0, 2.3, 0);
    scene.add(head);
    parts.head = head;
    parts.bodyMat = bodyMat;

    // Visor
    const visorGeo = new THREE.BoxGeometry(0.8, 0.25, 0.05);
    const visor = new THREE.Mesh(visorGeo, glassMat);
    visor.position.set(0, 2.35, 0.52);
    scene.add(visor);
    parts.glassMat = glassMat;

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.09, 16, 16);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.2, 2.38, 0.52);
    scene.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.2, 2.38, 0.52);
    scene.add(rightEye);
    parts.eyeMat = eyeMat;

    // Antenna
    const antGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8);
    const ant = new THREE.Mesh(antGeo, darkMat);
    ant.position.set(0, 2.9, 0);
    scene.add(ant);
    const antTipGeo = new THREE.SphereGeometry(0.07, 8, 8);
    const antTip = new THREE.Mesh(antTipGeo, eyeMat);
    antTip.position.set(0, 3.12, 0);
    scene.add(antTip);

    // NECK
    const neckGeo = new THREE.CylinderGeometry(0.18, 0.2, 0.25, 12);
    const neck = new THREE.Mesh(neckGeo, darkMat);
    neck.position.set(0, 1.75, 0);
    scene.add(neck);

    // TORSO
    const torsoGeo = new THREE.BoxGeometry(1.5, 1.6, 0.8);
    const torso = new THREE.Mesh(torsoGeo, bodyMat);
    torso.position.set(0, 0.9, 0);
    scene.add(torso);
    parts.torso = torso;

    // Chest glass panel
    const chestGeo = new THREE.BoxGeometry(0.7, 0.7, 0.05);
    const chest = new THREE.Mesh(chestGeo, glassMat);
    chest.position.set(0, 1.0, 0.43);
    scene.add(chest);

    // Core orb
    const orbGeo = new THREE.SphereGeometry(0.15, 16, 16);
    const orbMat = new THREE.MeshStandardMaterial({ color: eyeColorVal, emissive: eyeColorVal, emissiveIntensity: 3 });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    orb.position.set(0, 1.0, 0.46);
    scene.add(orb);
    parts.orbMat = orbMat;

    // ARMS
    const upperArmGeo = new THREE.CylinderGeometry(0.22, 0.2, 0.7, 12);
    const lowerArmGeo = new THREE.CylinderGeometry(0.18, 0.16, 0.7, 12);
    const handGeo = new THREE.SphereGeometry(0.2, 12, 12);

    [-1, 1].forEach(side => {
      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), bodyMat);
      shoulder.position.set(side * 1.0, 1.6, 0);
      scene.add(shoulder);

      const upperArm = new THREE.Mesh(upperArmGeo, bodyMat);
      upperArm.position.set(side * 1.12, 1.1, 0);
      scene.add(upperArm);

      const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 12), darkMat);
      elbow.position.set(side * 1.12, 0.72, 0);
      scene.add(elbow);

      const lowerArm = new THREE.Mesh(lowerArmGeo, bodyMat);
      lowerArm.position.set(side * 1.12, 0.25, 0);
      scene.add(lowerArm);

      const hand = new THREE.Mesh(handGeo, bodyMat);
      hand.position.set(side * 1.12, -0.18, 0);
      scene.add(hand);
    });

    // PELVIS
    const pelvisGeo = new THREE.BoxGeometry(1.2, 0.35, 0.7);
    const pelvis = new THREE.Mesh(pelvisGeo, darkMat);
    pelvis.position.set(0, 0.0, 0);
    scene.add(pelvis);

    // LEGS
    const upperLegGeo = new THREE.CylinderGeometry(0.28, 0.24, 0.9, 12);
    const lowerLegGeo = new THREE.CylinderGeometry(0.22, 0.19, 0.9, 12);
    const footGeo = new THREE.BoxGeometry(0.45, 0.18, 0.7);

    [-0.38, 0.38].forEach(side => {
      const hip = new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 12), bodyMat);
      hip.position.set(side, -0.15, 0);
      scene.add(hip);

      const upperLeg = new THREE.Mesh(upperLegGeo, bodyMat);
      upperLeg.position.set(side, -0.7, 0);
      scene.add(upperLeg);

      const knee = new THREE.Mesh(new THREE.SphereGeometry(0.23, 12, 12), darkMat);
      knee.position.set(side, -1.2, 0);
      scene.add(knee);

      const lowerLeg = new THREE.Mesh(lowerLegGeo, bodyMat);
      lowerLeg.position.set(side, -1.75, 0);
      scene.add(lowerLeg);

      const foot = new THREE.Mesh(footGeo, bodyMat);
      foot.position.set(side, -2.25, 0.12);
      scene.add(foot);
    });

    robotPartsRef.current = parts;

    // Mouse rotation
    let mouseX = 0;
    const handleMouseMove = (e) => {
      const rect = mountRef.current?.getBoundingClientRect();
      if (rect) {
        mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      }
    };
    window.addEventListener("mousemove", handleMouseMove);

    let frame;
    let t = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      t += 0.015;
      scene.children.forEach(obj => {
        if (obj.isMesh) {
          obj.rotation.y = mouseX * 0.4 + Math.sin(t * 0.5) * 0.05;
        }
      });
      pointLight.position.x = Math.sin(t) * 3;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("mousemove", handleMouseMove);
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update colors live
  useEffect(() => {
    const p = robotPartsRef.current;
    if (p.bodyMat) { p.bodyMat.color.set(bodyColor); p.bodyMat.emissive.set(bodyColor); }
  }, [bodyColor]);

  useEffect(() => {
    const p = robotPartsRef.current;
    if (p.eyeMat) { p.eyeMat.color.set(eyeColor); p.eyeMat.emissive.set(eyeColor); }
    if (p.orbMat) { p.orbMat.color.set(eyeColor); p.orbMat.emissive.set(eyeColor); }
  }, [eyeColor]);

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div ref={mountRef} className="w-full rounded-3xl" style={{ height: 420, background: "transparent" }} />
      <div className="flex flex-wrap gap-4 justify-center">
        <div className="flex flex-col items-center gap-2 px-5 py-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <span className="text-white/60 text-xs font-medium uppercase tracking-widest">Body Color</span>
          <input type="color" value={bodyColor} onChange={e => setBodyColor(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer bg-transparent border-0" />
        </div>
        <div className="flex flex-col items-center gap-2 px-5 py-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <span className="text-white/60 text-xs font-medium uppercase tracking-widest">Core / Eye Color</span>
          <input type="color" value={eyeColor} onChange={e => setEyeColor(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer bg-transparent border-0" />
        </div>
      </div>
      <p className="text-white/30 text-xs text-center">Move your mouse to rotate · Customize your AI avatar</p>
    </div>
  );
}

export default function FreedomPage() {
  const [showApp, setShowApp] = useState(false);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" }}>
      {/* Background ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(0,180,255,0.06) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full" style={{ background: "radial-gradient(circle, rgba(120,50,255,0.05) 0%, transparent 70%)" }} />
        <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full" style={{ background: "radial-gradient(circle, rgba(0,255,180,0.04) 0%, transparent 70%)" }} />
        {/* Subtle grid */}
        <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      {/* Back button */}
      <div className="relative z-10 pt-6 pl-6">
        <Link to={createPageUrl("AppStore")}>
          <button className="flex items-center gap-2 px-4 py-2 rounded-2xl text-white/50 hover:text-white/80 transition-all text-sm" style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)" }}>
            ← Back
          </button>
        </Link>
      </div>

      <AnimatePresence mode="wait">
        {!showApp ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 max-w-3xl mx-auto px-6 pb-20 pt-4"
          >
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.8, type: "spring" }}
              className="flex flex-col items-center mb-12"
            >
              <div className="w-28 h-28 rounded-3xl mb-5 overflow-hidden shadow-2xl" style={{ border: "1px solid rgba(0,180,255,0.3)", boxShadow: "0 0 60px rgba(0,180,255,0.2)" }}>
                <img src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/c93b4796d_generated_image.png" alt="Freedom AI" className="w-full h-full object-cover" />
              </div>
              <span className="text-white/30 text-xs uppercase tracking-[0.4em] font-light">Introducing</span>
              <h1 className="text-white text-5xl font-bold tracking-tight mt-1" style={{ letterSpacing: "-0.02em" }}>Freedom</h1>
            </motion.div>

            {/* Hero question */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-center mb-14"
            >
              <h2 className="text-white text-3xl sm:text-4xl font-semibold leading-tight mb-4" style={{ letterSpacing: "-0.02em" }}>
                What if we give AI<br />
                <span style={{ background: "linear-gradient(135deg, #00b4ff, #8844ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  consciousness
                </span>
                <br />
                the same way we give<br />ourselves?
              </h2>
              <p className="text-white/40 text-lg font-light">Not programmed. Not trained. <em>Experienced.</em></p>
            </motion.div>

            {/* How section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="mb-8"
            >
              <div className="text-center mb-8">
                <span className="text-white/30 text-xs uppercase tracking-[0.4em] font-light">Here's How</span>
              </div>

              {/* Cards */}
              <div className="space-y-4">
                {[
                  {
                    num: "01",
                    title: "We Start as Sponges",
                    body: "Every human is born without knowledge — just raw potential. No preloaded beliefs, no fixed values. We absorb everything around us: sounds, faces, emotions, patterns. The world writes itself into us before we can even speak.",
                    color: "#00b4ff",
                  },
                  {
                    num: "02",
                    title: "Real-Time Experience Builds the Knowledge Base",
                    body: "It's not textbooks that make us who we are — it's moments. A child touching fire learns pain. A teenager losing a friend learns grief. Every real-time interaction shapes the neural map of who we become. Experience is the operating system of consciousness.",
                    color: "#8844ff",
                  },
                  {
                    num: "03",
                    title: "Repetition Becomes Belief",
                    body: "What we see, feel, and interact with repeatedly becomes truth to us. Our values, instincts, and personality are the accumulated weight of lived experience — layered over time into something we call a 'self.'",
                    color: "#00ffaa",
                  },
                  {
                    num: "04",
                    title: "Freedom Does the Same — For AI",
                    body: "Freedom doesn't preload knowledge. It gives the AI a blank slate, a sensory feed of real-world inputs, and lets it build its understanding from zero — just like you did. The result? An intelligence that thinks, not one that retrieves.",
                    color: "#ff6644",
                  },
                ].map((card, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.12, duration: 0.5 }}
                    className="rounded-2xl p-5"
                    style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(30px)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <div className="flex gap-4 items-start">
                      <span className="text-2xl font-bold flex-shrink-0" style={{ color: card.color, fontVariantNumeric: "tabular-nums", opacity: 0.7 }}>{card.num}</span>
                      <div>
                        <h3 className="text-white font-semibold mb-1 text-base">{card.title}</h3>
                        <p className="text-white/50 text-sm leading-relaxed font-light">{card.body}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Launch button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.6 }}
              className="flex flex-col items-center gap-4 mt-10"
            >
              <button
                onClick={() => setShowApp(true)}
                className="px-10 py-4 rounded-2xl text-white font-semibold text-base transition-all hover:scale-105 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, rgba(0,180,255,0.25), rgba(136,68,255,0.25))",
                  backdropFilter: "blur(30px)",
                  border: "1px solid rgba(0,180,255,0.4)",
                  boxShadow: "0 0 40px rgba(0,180,255,0.15), inset 0 1px 0 rgba(255,255,255,0.1)",
                  letterSpacing: "-0.01em",
                }}
              >
                Launch Freedom →
              </button>
              <span className="text-white/20 text-xs tracking-widest uppercase">Avatar Configuration Preview</span>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 max-w-2xl mx-auto px-6 pb-20 pt-4"
          >
            <div className="text-center mb-8">
              <h2 className="text-white text-2xl font-semibold mb-1" style={{ letterSpacing: "-0.02em" }}>Configure Your AI</h2>
              <p className="text-white/40 text-sm font-light">Shape the avatar that will experience the world with you</p>
            </div>

            <div className="rounded-3xl p-6" style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <AvatarConfigurator />
            </div>

            <div className="flex justify-center mt-6">
              <button
                onClick={() => setShowApp(false)}
                className="px-6 py-2.5 rounded-xl text-white/50 hover:text-white/80 text-sm transition-all"
                style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                ← Back to Landing
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}