import React, { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { X, Upload, Loader2, Image as ImageIcon, RotateCcw, Sparkles } from "lucide-react";
import * as THREE from "three";

// ── Canvas-based luminance depth estimation (no external deps) ──────────────
async function runDepthEstimation(imageElement) {
  const w = imageElement.naturalWidth || imageElement.width;
  const h = imageElement.naturalHeight || imageElement.height;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(imageElement, 0, 0);
  const imageData = ctx.getImageData(0, 0, w, h);
  const pixels = imageData.data; // RGBA

  // Build luminance map
  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = pixels[i * 4] / 255;
    const g = pixels[i * 4 + 1] / 255;
    const b = pixels[i * 4 + 2] / 255;
    lum[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }

  // Box blur to simulate depth smoothing
  const blurred = boxBlur(lum, w, h, 10);

  return { data: blurred, width: w, height: h, max: 1.0 };
}

function boxBlur(data, w, h, radius) {
  const tmp = new Float32Array(data.length);
  const out = new Float32Array(data.length);
  // Horizontal pass
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0, count = 0;
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = Math.min(Math.max(x + dx, 0), w - 1);
        sum += data[y * w + nx];
        count++;
      }
      tmp[y * w + x] = sum / count;
    }
  }
  // Vertical pass
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0, count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        const ny = Math.min(Math.max(y + dy, 0), h - 1);
        sum += tmp[ny * w + x];
        count++;
      }
      out[y * w + x] = sum / count;
    }
  }
  return out;
}

// ── 3D Depth Canvas ─────────────────────────────────────────────────────────
function DepthCanvas({ imageSrc, depthData }) {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!imageSrc || !depthData) return;
    const el = mountRef.current;
    if (!el) return;

    const w = el.clientWidth;
    const h = el.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050510);

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    camera.position.set(0, 0, 3.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(2, 3, 4);
    scene.add(dir);

    const segments = 128;
    const geo = new THREE.PlaneGeometry(3.2, 2.4, segments, segments);
    const pos = geo.attributes.position;

    const dw = depthData.width;
    const dh = depthData.height;
    const dPixels = depthData.data;
    const maxVal = depthData.max || 1.0;

    for (let i = 0; i <= segments; i++) {
      for (let j = 0; j <= segments; j++) {
        const idx = i * (segments + 1) + j;
        const px = Math.floor((j / segments) * (dw - 1));
        const py = Math.floor((i / segments) * (dh - 1));
        const dIdx = py * dw + px;
        const norm = (dPixels[dIdx] || 0) / maxVal;
        pos.setZ(idx, norm * 0.6 - 0.1);
      }
    }
    geo.computeVertexNormals();

    const loader = new THREE.TextureLoader();
    const tex = loader.load(imageSrc);
    tex.minFilter = THREE.LinearFilter;

    const mat = new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    // Particles
    const partGeo = new THREE.BufferGeometry();
    const pts = [];
    for (let i = 0; i < 60; i++) {
      pts.push((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 3);
    }
    partGeo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    scene.add(new THREE.Points(partGeo, new THREE.PointsMaterial({ color: 0x00aaff, size: 0.04 })));

    let t = 0;
    let mx = 0, my = 0;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      mx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      my = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    const onTouch = (e) => {
      const rect = el.getBoundingClientRect();
      mx = ((e.touches[0].clientX - rect.left) / rect.width - 0.5) * 2;
      my = -((e.touches[0].clientY - rect.top) / rect.height - 0.5) * 2;
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("touchmove", onTouch, { passive: true });

    let frame;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      t += 0.008;
      mesh.rotation.y = mx * 0.35 + Math.sin(t * 0.3) * 0.05;
      mesh.rotation.x = my * 0.2 + Math.sin(t * 0.4) * 0.03;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("touchmove", onTouch);
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      tex.dispose();
    };
  }, [imageSrc, depthData]);

  return <div ref={mountRef} className="w-full h-full" />;
}

// ── Default idle canvas ──────────────────────────────────────────────────────
function IdleCanvas() {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const w = el.clientWidth, h = el.clientHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    camera.position.set(0, 0, 4);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x223366, 2));
    const pt = new THREE.PointLight(0x00d4ff, 4, 20);
    pt.position.set(2, 2, 3);
    scene.add(pt);

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1, 64, 64),
      new THREE.MeshStandardMaterial({ color: 0x0088cc, emissive: 0x003355, metalness: 0.9, roughness: 0.1 })
    );
    scene.add(sphere);

    const wf = new THREE.Mesh(
      new THREE.SphereGeometry(1.02, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0x00aaff, wireframe: true, opacity: 0.15, transparent: true })
    );
    scene.add(wf);

    let t = 0;
    let frame;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      t += 0.01;
      sphere.rotation.y = t * 0.4;
      pt.position.x = Math.sin(t) * 3;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full" />;
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function FreedomPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("canvas");
  const [imageSrc, setImageSrc] = useState(null);
  const [depthData, setDepthData] = useState(null);
  const [status, setStatus] = useState("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const fileRef = useRef(null);

  const close = () => navigate(-1);

  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const src = e.target.result;
      setImageSrc(src);
      setDepthData(null);
      setStatus("estimating");
      setStatusMsg("Analysing depth from image...");

      const img = new Image();
      img.onload = async () => {
        try {
          const depth = await runDepthEstimation(img);
          setDepthData(depth);
          setStatus("done");
          setStatusMsg("");
        } catch (err) {
          console.error(err);
          setStatus("error");
          setStatusMsg("Depth estimation failed. Try a different image.");
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }, []);

  const reset = () => {
    setImageSrc(null);
    setDepthData(null);
    setStatus("idle");
    setStatusMsg("");
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const isProcessing = status === "estimating";

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={close}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative w-full sm:max-w-xl sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col"
        style={{
          background: "linear-gradient(160deg, #0a0a14 0%, #080810 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          height: "92dvh",
          maxHeight: "92dvh",
        }}
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0">
              <img src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/c93b4796d_generated_image.png" alt="Freedom" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-none">Freedom</h1>
              <p className="text-white/40 text-xs mt-0.5">Depth-Parallax 3D</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {imageSrc && (
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
              {/* 3D area */}
              <div className="relative mx-4 mt-3 rounded-2xl overflow-hidden flex-shrink-0"
                style={{ height: 260, border: "1px solid rgba(255,255,255,0.06)" }}>
                {isProcessing ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                    <p className="text-white/60 text-xs text-center px-6">{statusMsg}</p>
                  </div>
                ) : status === "error" ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/90">
                    <p className="text-red-400 text-sm">{statusMsg}</p>
                    <button onClick={reset} className="text-white/40 text-xs underline">Try again</button>
                  </div>
                ) : depthData && imageSrc ? (
                  <DepthCanvas imageSrc={imageSrc} depthData={depthData} />
                ) : (
                  <IdleCanvas />
                )}
              </div>

              {/* Status badge */}
              {status === "done" && (
                <div className="mx-4 mt-2 flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: "rgba(0,200,100,0.1)", border: "1px solid rgba(0,200,100,0.2)" }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span className="text-green-400 text-xs">Luminance depth · real 3D displacement · drag to rotate</span>
                </div>
              )}

              {/* Upload zone */}
              <div className="px-4 mt-3 pb-6">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />

                {imageSrc ? (
                  <div className="flex gap-3 items-center p-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <img src={imageSrc} alt="uploaded" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-sm font-medium">
                        {isProcessing ? "Processing..." : "3D depth render ready"}
                      </p>
                      <p className="text-white/40 text-xs mt-0.5">Drag to rotate · touch to interact</p>
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
                      <p className="text-white/35 text-xs mt-1">Instant depth analysis → interactive 3D mesh · drag & drop</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-4 py-2 rounded-full" style={{ background: "rgba(0,180,255,0.15)", border: "1px solid rgba(0,180,255,0.3)" }}>
                      <Upload className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-blue-400 text-xs font-medium">Choose Image</span>
                    </div>
                  </button>
                )}

                <p className="text-center text-white/20 text-xs mt-3 flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Move mouse / touch to rotate 3D model
                </p>
              </div>
            </div>
          ) : (
            <div className="px-5 py-4 pb-8 space-y-4">
              {[
                { num: "01", title: "Upload Any Image", body: "A face, landscape, object — any photo works. Freedom instantly analyses luminance to generate a depth map.", color: "#00b4ff" },
                { num: "02", title: "Luminance Depth Analysis", body: "Each pixel's brightness is used to estimate depth — brighter areas appear closer, darker areas recede. A gaussian blur smooths the depth field for a natural parallax feel.", color: "#8844ff" },
                { num: "03", title: "Real 3D Displacement", body: "Depth values are mapped to Z-positions on a 128×128 mesh. The original image textures the mesh, creating a true parallax 3D effect you can rotate.", color: "#00ffaa" },
                { num: "04", title: "The Philosophy", body: "Freedom perceives depth from flat images — just as consciousness extracts structure from raw sensation. Awareness is pattern recognition.", color: "#ff6644" },
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