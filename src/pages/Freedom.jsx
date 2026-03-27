import React, { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Loader2, Sparkles, RotateCcw, Image as ImageIcon } from "lucide-react";
import * as THREE from "three";
import { base44 } from "@/api/base44Client";

// ── 3D Canvas ──────────────────────────────────────────────────────────────
function ThreeCanvas({ config }) {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const w = el.clientWidth, h = el.clientHeight;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    scene.add(new THREE.AmbientLight(0x222244, 2));
    const pt = new THREE.PointLight(config.primaryColor || 0x00d4ff, 4, 20);
    pt.position.set(3, 3, 3);
    scene.add(pt);
    const rim = new THREE.PointLight(config.secondaryColor || 0x8844ff, 2, 15);
    rim.position.set(-3, -1, -2);
    scene.add(rim);

    // Build geometry based on detected shape
    const primaryMat = new THREE.MeshStandardMaterial({
      color: config.primaryColor || 0x00d4ff,
      emissive: config.primaryColor || 0x00d4ff,
      emissiveIntensity: 0.3,
      metalness: 0.8,
      roughness: 0.2,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: config.accentColor || 0xffffff,
      emissive: config.accentColor || 0xffffff,
      emissiveIntensity: 1.5,
    });

    const group = new THREE.Group();

    const shape = config.shape || "sphere";

    if (shape === "cube") {
      group.add(new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 1.8), primaryMat));
    } else if (shape === "cylinder") {
      group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 2, 32), primaryMat));
    } else if (shape === "torus") {
      group.add(new THREE.Mesh(new THREE.TorusGeometry(1, 0.4, 16, 100), primaryMat));
    } else if (shape === "diamond") {
      const geo = new THREE.OctahedronGeometry(1.2);
      group.add(new THREE.Mesh(geo, primaryMat));
    } else if (shape === "robot") {
      // simplified robot
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 0.7), primaryMat);
      body.position.y = 0;
      group.add(body);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.7), primaryMat);
      head.position.y = 1.2;
      group.add(head);
      [-0.5, 0.5].forEach(x => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), accentMat);
        eye.position.set(x * 0.4, 1.25, 0.38);
        group.add(eye);
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 1, 8), primaryMat);
        arm.position.set(x * 0.85, 0, 0);
        group.add(arm);
      });
    } else {
      // default sphere
      group.add(new THREE.Mesh(new THREE.SphereGeometry(1.2, 64, 64), primaryMat));
    }

    // Floating particles
    const partGeo = new THREE.BufferGeometry();
    const pos = [];
    for (let i = 0; i < 80; i++) {
      pos.push((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
    }
    partGeo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    const partMat = new THREE.PointsMaterial({ color: config.primaryColor || 0x00d4ff, size: 0.05 });
    scene.add(new THREE.Points(partGeo, partMat));

    scene.add(group);

    let t = 0;
    let mouseX = 0;
    const onMouse = (e) => {
      const rect = el.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    };
    const onTouch = (e) => {
      const rect = el.getBoundingClientRect();
      mouseX = ((e.touches[0].clientX - rect.left) / rect.width - 0.5) * 2;
    };
    el.addEventListener("mousemove", onMouse);
    el.addEventListener("touchmove", onTouch, { passive: true });

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      t += 0.012;
      group.rotation.y = mouseX * 0.6 + t * 0.3;
      group.rotation.x = Math.sin(t * 0.4) * 0.15;
      group.position.y = Math.sin(t * 0.6) * 0.1;
      pt.position.x = Math.sin(t) * 3;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      el.removeEventListener("mousemove", onMouse);
      el.removeEventListener("touchmove", onTouch);
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [config]);

  return <div ref={mountRef} className="w-full h-full" />;
}

// ── Default config ─────────────────────────────────────────────────────────
const DEFAULT_CONFIG = { shape: "sphere", primaryColor: 0x00d4ff, secondaryColor: 0x8844ff, accentColor: 0xffffff, description: "A glowing cyan sphere floating in space." };

// ── Main Page ──────────────────────────────────────────────────────────────
export default function FreedomPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("canvas"); // "canvas" | "about"
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [aiDescription, setAiDescription] = useState("");
  const fileRef = useRef(null);

  const close = () => navigate(-1);

  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      setUploadedImage(dataUrl);
      setAnalyzing(true);
      try {
        // Upload file first
        const blob = await fetch(dataUrl).then(r => r.blob());
        const formFile = new File([blob], file.name, { type: file.type });
        const { file_url } = await base44.integrations.Core.UploadFile({ file: formFile });

        // Analyze with LLM
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Analyze this image and extract visual properties to create a 3D render. Return JSON with:
- shape: one of "sphere", "cube", "cylinder", "torus", "diamond", "robot" — pick the closest match to the subject
- primaryColor: dominant color as hex number (e.g. 0x00d4ff)  
- secondaryColor: secondary color as hex number
- accentColor: highlight/accent color as hex number
- description: one sentence describing what you see and how it maps to the 3D form

Be creative — map organic subjects to geometric forms.`,
          file_urls: [file_url],
          response_json_schema: {
            type: "object",
            properties: {
              shape: { type: "string" },
              primaryColor: { type: "number" },
              secondaryColor: { type: "number" },
              accentColor: { type: "number" },
              description: { type: "string" },
            },
          },
        });
        setConfig(result);
        setAiDescription(result.description || "");
      } catch (err) {
        console.error(err);
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const reset = () => {
    setConfig(DEFAULT_CONFIG);
    setUploadedImage(null);
    setAiDescription("");
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={close}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative w-full sm:max-w-xl sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col"
        style={{
          background: "linear-gradient(160deg, #0a0a14 0%, #080810 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          maxHeight: "92vh",
        }}
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0">
              <img src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/c93b4796d_generated_image.png" alt="Freedom" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-none">Freedom</h1>
              <p className="text-white/40 text-xs mt-0.5">Image → 3D Canvas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {uploadedImage && (
              <button onClick={reset} className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white/80 hover:bg-white/10 transition-all">
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button onClick={close} className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white/80 hover:bg-white/10 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-5 gap-1 flex-shrink-0">
          {["canvas", "about"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${tab === t ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}>
              {t === "canvas" ? "3D Canvas" : "About"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {tab === "canvas" ? (
            <div className="flex flex-col h-full">
              {/* 3D Render area */}
              <div className="relative mx-4 mt-3 rounded-2xl overflow-hidden flex-shrink-0" style={{ height: 260, background: "radial-gradient(ellipse at center, rgba(0,100,200,0.08) 0%, transparent 70%)", border: "1px solid rgba(255,255,255,0.06)" }}>
                {analyzing ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                    <p className="text-white/50 text-sm">Analyzing image...</p>
                  </div>
                ) : (
                  <ThreeCanvas config={config} />
                )}
                {aiDescription ? (
                  <div className="absolute bottom-0 left-0 right-0 px-4 py-2.5" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.7))" }}>
                    <p className="text-white/60 text-xs leading-relaxed">{aiDescription}</p>
                  </div>
                ) : null}
              </div>

              {/* Upload zone */}
              <div className="px-4 mt-3 pb-6">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />

                {uploadedImage ? (
                  <div className="flex gap-3 items-center p-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <img src={uploadedImage} alt="uploaded" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-sm font-medium">Image uploaded</p>
                      <p className="text-white/40 text-xs mt-0.5">3D render generated from your image</p>
                    </div>
                    <button onClick={() => fileRef.current?.click()} className="px-3 py-1.5 rounded-xl text-xs text-white/60 hover:text-white transition-all flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)" }}>
                      Change
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full flex flex-col items-center gap-3 py-8 rounded-2xl transition-all hover:bg-white/5 active:scale-[0.98]"
                    style={{ border: "1.5px dashed rgba(255,255,255,0.12)" }}
                  >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(0,180,255,0.12)", border: "1px solid rgba(0,180,255,0.2)" }}>
                      <ImageIcon className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-white/70 font-medium text-sm">Upload an image</p>
                      <p className="text-white/35 text-xs mt-1">AI converts it to a 3D render · drag & drop supported</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-4 py-2 rounded-full" style={{ background: "rgba(0,180,255,0.15)", border: "1px solid rgba(0,180,255,0.3)" }}>
                      <Upload className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-blue-400 text-xs font-medium">Choose Image</span>
                    </div>
                  </button>
                )}

                <p className="text-center text-white/20 text-xs mt-3 flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Touch to rotate the 3D model
                </p>
              </div>
            </div>
          ) : (
            <div className="px-5 py-4 pb-8 space-y-4">
              {[
                { num: "01", title: "Upload Any Image", body: "A face, a landscape, an object — Freedom's AI reads the visual essence of whatever you provide.", color: "#00b4ff" },
                { num: "02", title: "AI Analysis", body: "The image is analyzed for dominant colors, shapes, and composition. These map directly to 3D geometry and material properties.", color: "#8844ff" },
                { num: "03", title: "Live 3D Render", body: "A Three.js scene is generated in real time — shape, color, lighting, and particles all derived from your image.", color: "#00ffaa" },
                { num: "04", title: "The Philosophy", body: "Just as humans build knowledge from lived experience, Freedom builds a 3D world from visual experience. Consciousness through sensation.", color: "#ff6644" },
              ].map((card, i) => (
                <div key={i} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex gap-3">
                    <span className="text-xl font-bold flex-shrink-0" style={{ color: card.color, opacity: 0.7 }}>{card.num}</span>
                    <div>
                      <h3 className="text-white font-semibold text-sm mb-1">{card.title}</h3>
                      <p className="text-white/50 text-xs leading-relaxed">{card.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}