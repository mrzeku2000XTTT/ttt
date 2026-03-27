import React, { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { X, Upload, Loader2, Image as ImageIcon, RotateCcw, Sparkles } from "lucide-react";
import * as THREE from "three";

// ── Build depth map from image ───────────────────────────────────────────────
async function buildDepthMap(imageElement, onProgress) {
  onProgress("Reading pixels...");
  const MAX = 300; // cap resolution for performance
  const aspect = imageElement.naturalWidth / imageElement.naturalHeight;
  const cw = Math.min(imageElement.naturalWidth, MAX);
  const ch = Math.round(cw / aspect);

  const canvas = document.createElement("canvas");
  canvas.width = cw; canvas.height = ch;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(imageElement, 0, 0, cw, ch);
  const { data } = ctx.getImageData(0, 0, cw, ch);

  onProgress("Computing depth...");

  // Check for alpha channel
  let hasAlpha = false;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 200) { hasAlpha = true; break; }
  }

  const depth = new Float32Array(cw * ch);

  if (hasAlpha) {
    for (let i = 0; i < cw * ch; i++) depth[i] = data[i * 4 + 3] / 255;
  } else {
    // Sample corners for background color
    let bgR = 0, bgG = 0, bgB = 0, n = 0;
    const corners = [[0,0],[cw-1,0],[0,ch-1],[cw-1,ch-1],[Math.floor(cw/2),0],[0,Math.floor(ch/2)]];
    for (const [x, y] of corners) {
      const i = (y * cw + x) * 4;
      bgR += data[i]; bgG += data[i+1]; bgB += data[i+2]; n++;
    }
    bgR /= n; bgG /= n; bgB /= n;
    for (let i = 0; i < cw * ch; i++) {
      const dr = data[i*4] - bgR, dg = data[i*4+1] - bgG, db = data[i*4+2] - bgB;
      depth[i] = Math.sqrt(dr*dr + dg*dg + db*db) / 441.67;
    }
  }

  // Smooth depth
  // For images with alpha: use distance-from-silhouette-edge transform
  // This makes center pixels bulge forward, edges recede = rounded 3D body
  if (hasAlpha) {
    // Build binary mask of opaque pixels
    const mask = new Uint8Array(cw * ch);
    for (let i = 0; i < cw * ch; i++) mask[i] = depth[i] > 0.5 ? 1 : 0;

    // Approximate distance transform: blur the mask multiple times
    // Each pass spreads the "distance from edge" information inward
    let distMap = new Float32Array(cw * ch);
    for (let i = 0; i < cw * ch; i++) distMap[i] = mask[i];

    // Multiple blur passes simulate distance transform
    for (let pass = 0; pass < 12; pass++) {
      distMap = boxBlur(distMap, cw, ch, 3);
      // Re-clamp to mask boundary — only keep values inside the silhouette
      for (let i = 0; i < cw * ch; i++) if (!mask[i]) distMap[i] = 0;
    }

    // Normalize
    let max = 0;
    for (let i = 0; i < distMap.length; i++) if (distMap[i] > max) max = distMap[i];
    if (max > 0) for (let i = 0; i < distMap.length; i++) distMap[i] /= max;

    // Apply sqrt to make the rounding more spherical
    for (let i = 0; i < distMap.length; i++) distMap[i] = Math.sqrt(distMap[i]);

    return { depth: distMap, data, width: cw, height: ch };
  }

  // For non-alpha images: use existing color-distance approach
  const blurred = boxBlur(depth, cw, ch, 4);
  let max = 0;
  for (let i = 0; i < blurred.length; i++) if (blurred[i] > max) max = blurred[i];
  if (max > 0) for (let i = 0; i < blurred.length; i++) blurred[i] /= max;

  return { depth: blurred, data, width: cw, height: ch };
}

function boxBlur(src, w, h, r) {
  const tmp = new Float32Array(src.length), out = new Float32Array(src.length);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let s = 0, c = 0;
    for (let dx = -r; dx <= r; dx++) { const nx = Math.min(Math.max(x+dx,0),w-1); s += src[y*w+nx]; c++; }
    tmp[y*w+x] = s/c;
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let s = 0, c = 0;
    for (let dy = -r; dy <= r; dy++) { const ny = Math.min(Math.max(y+dy,0),h-1); s += tmp[ny*w+x]; c++; }
    out[y*w+x] = s/c;
  }
  return out;
}

// ── 3D Point Cloud Canvas ────────────────────────────────────────────────────
function PointCloudCanvas({ depthMap }) {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!depthMap) return;
    const el = mountRef.current;
    if (!el) return;

    const W = el.clientWidth, H = el.clientHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.01, 100);
    camera.position.set(0, 0, 2.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    // Build point cloud geometry
    const { depth, data, width, height } = depthMap;
    const step = 1; // every pixel for full density
    const positions = [];
    const colors = [];

    // Fit the cloud into a 2x2 world-unit box preserving aspect ratio
    const aspect = width / height;
    // scale so the larger dimension spans 2 units
    const scaleX = aspect >= 1 ? 2 : 2 * aspect;
    const scaleY = aspect >= 1 ? 2 / aspect : 2;

    const MAX_DEPTH = 0.5; // total depth of the 3D body
    const Z_SLICES = 8;    // how many layers to fill per pixel column

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const i = y * width + x;
        const alpha = data[i * 4 + 3] !== undefined ? data[i * 4 + 3] / 255 : 1;
        if (alpha < 0.15) continue;

        const d = depth[i];
        const px = ((x / width) - 0.5) * scaleX;
        const py = -((y / height) - 0.5) * scaleY;
        const frontZ = d * MAX_DEPTH;

        const r = data[i*4]/255, g = data[i*4+1]/255, b = data[i*4+2]/255;

        // Fill the full column from back (z=0) to front (z=frontZ)
        for (let s = 0; s <= Z_SLICES; s++) {
          const pz = (s / Z_SLICES) * frontZ;
          // Darken interior slices slightly for shading depth cue
          const shade = 0.4 + 0.6 * (s / Z_SLICES);
          positions.push(px, py, pz);
          colors.push(r * shade, g * shade, b * shade);
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.008,
      vertexColors: true,
      sizeAttenuation: true,
    });

    const cloud = new THREE.Points(geo, mat);
    scene.add(cloud);

    // Subtle ambient particles
    const pts = [];
    for (let i = 0; i < 60; i++) pts.push((Math.random()-.5)*5,(Math.random()-.5)*5,(Math.random()-.5)*2);
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0x0066ff, size: 0.025, opacity: 0.4, transparent: true })));

    // Drag-to-orbit state
    let isDragging = false;
    let prevX = 0, prevY = 0;
    let rotX = 0, rotY = 0;
    let velX = 0, velY = 0;
    let autoRotate = true;

    const onMouseDown = (e) => { isDragging = true; autoRotate = false; prevX = e.clientX; prevY = e.clientY; };
    const onMouseMove = (e) => {
      if (!isDragging) return;
      velY += (e.clientX - prevX) * 0.005;
      velX += (e.clientY - prevY) * 0.005;
      prevX = e.clientX; prevY = e.clientY;
    };
    const onMouseUp = () => { isDragging = false; };

    const onTouchStart = (e) => { isDragging = true; autoRotate = false; prevX = e.touches[0].clientX; prevY = e.touches[0].clientY; };
    const onTouchMove = (e) => {
      if (!isDragging) return;
      velY += (e.touches[0].clientX - prevX) * 0.007;
      velX += (e.touches[0].clientY - prevY) * 0.007;
      prevX = e.touches[0].clientX; prevY = e.touches[0].clientY;
    };
    const onTouchEnd = () => { isDragging = false; };

    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd);

    let t = 0, frame;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      t += 0.008;

      if (autoRotate) {
        cloud.rotation.y += 0.004;
        cloud.rotation.x = Math.sin(t * 0.3) * 0.15;
      } else {
        rotY += velY; rotX += velX;
        velY *= 0.88; velX *= 0.88;
        cloud.rotation.y = rotY;
        cloud.rotation.x = Math.max(-1.2, Math.min(1.2, rotX));
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      renderer.dispose(); geo.dispose(); mat.dispose();
    };
  }, [depthMap]);

  return <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />;
}

// ── Idle canvas ──────────────────────────────────────────────────────────────
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
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.02, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0x00aaff, wireframe: true, opacity: 0.15, transparent: true })
    ));

    let t = 0, frame;
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
  const [depthMap, setDepthMap] = useState(null);
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
      setDepthMap(null);
      setStatus("loading");
      setStatusMsg("Preparing...");

      const img = new Image();
      img.onload = async () => {
        try {
          const result = await buildDepthMap(img, setStatusMsg);
          setDepthMap(result);
          setStatus("done");
          setStatusMsg("");
        } catch (err) {
          console.error(err);
          setStatus("error");
          setStatusMsg("Processing failed. Try a different image.");
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }, []);

  const reset = () => { setImageSrc(null); setDepthMap(null); setStatus("idle"); setStatusMsg(""); };
  const onDrop = useCallback((e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }, [handleFile]);
  const isProcessing = status === "loading";

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={close} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative w-full sm:max-w-xl sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col"
        style={{ background: "linear-gradient(160deg,#0a0a14 0%,#080810 100%)", border: "1px solid rgba(255,255,255,0.08)", height: "92dvh", maxHeight: "92dvh" }}
        onDrop={onDrop} onDragOver={e => e.preventDefault()} onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0">
              <img src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/c93b4796d_generated_image.png" alt="Freedom" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-none">Freedom</h1>
              <p className="text-white/40 text-xs mt-0.5">3D Point Cloud</p>
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
              <div className="relative mx-4 mt-3 rounded-2xl overflow-hidden flex-shrink-0"
                style={{ height: 280, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(3,3,12,0.9)" }}>
                {isProcessing ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                    <p className="text-white/60 text-xs text-center px-6">{statusMsg}</p>
                  </div>
                ) : status === "error" ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <p className="text-red-400 text-sm text-center px-4">{statusMsg}</p>
                    <button onClick={reset} className="text-white/40 text-xs underline mt-1">Try again</button>
                  </div>
                ) : depthMap ? (
                  <PointCloudCanvas depthMap={depthMap} />
                ) : (
                  <IdleCanvas />
                )}
              </div>

              {status === "done" && (
                <div className="mx-4 mt-2 flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: "rgba(0,200,100,0.1)", border: "1px solid rgba(0,200,100,0.2)" }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-400 text-xs">3D point cloud · drag to orbit · pinch to zoom</span>
                </div>
              )}

              <div className="px-4 mt-3 pb-6">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />

                {imageSrc ? (
                  <div className="flex gap-3 items-center p-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <img src={imageSrc} alt="uploaded" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-sm font-medium">{isProcessing ? statusMsg : "3D point cloud ready"}</p>
                      <p className="text-white/40 text-xs mt-0.5">Drag to orbit · rotate to see depth</p>
                    </div>
                    <button onClick={() => fileRef.current?.click()} className="px-3 py-1.5 rounded-xl text-xs text-white/60 hover:text-white transition-all flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)" }}>
                      Change
                    </button>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()}
                    className="w-full flex flex-col items-center gap-3 py-8 rounded-2xl transition-all hover:bg-white/5 active:scale-[0.98]"
                    style={{ border: "1.5px dashed rgba(255,255,255,0.12)" }}>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(0,180,255,0.12)", border: "1px solid rgba(0,180,255,0.2)" }}>
                      <ImageIcon className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-white/70 font-medium text-sm">Upload an image</p>
                      <p className="text-white/35 text-xs mt-1">Converted to a real 3D point cloud you can orbit · PNG works best</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-4 py-2 rounded-full" style={{ background: "rgba(0,180,255,0.15)", border: "1px solid rgba(0,180,255,0.3)" }}>
                      <Upload className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-blue-400 text-xs font-medium">Choose Image</span>
                    </div>
                  </button>
                )}

                <p className="text-center text-white/20 text-xs mt-3 flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Drag to orbit · auto-rotates to show depth
                </p>
              </div>
            </div>
          ) : (
            <div className="px-5 py-4 pb-8 space-y-4">
              {[
                { num: "01", title: "Upload Any Image", body: "PNG with transparency works best. Each visible pixel becomes a 3D point in space.", color: "#00b4ff" },
                { num: "02", title: "Depth Detection", body: "Alpha channel (for PNGs) or background color distance determines how far each pixel sits in Z-space.", color: "#8844ff" },
                { num: "03", title: "True 3D Point Cloud", body: "Every pixel is placed as a colored 3D point at its computed depth — forming a real volumetric structure you can orbit from any angle.", color: "#00ffaa" },
                { num: "04", title: "The Philosophy", body: "Freedom reconstructs depth from flatness — seeing the hidden dimension inside every image.", color: "#ff6644" },
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