import React, { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { X, Upload, Loader2, Image as ImageIcon, RotateCcw, Sparkles } from "lucide-react";
import * as THREE from "three";

// ── Build depth map from image ───────────────────────────────────────────────
async function buildDepthMap(imageElement, onProgress) {
  onProgress("Reading pixels...");
  const MAX = 256;
  const aspect = imageElement.naturalWidth / imageElement.naturalHeight;
  const cw = Math.min(imageElement.naturalWidth, MAX);
  const ch = Math.round(cw / aspect);

  const canvas = document.createElement("canvas");
  canvas.width = cw; canvas.height = ch;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(imageElement, 0, 0, cw, ch);
  const { data } = ctx.getImageData(0, 0, cw, ch);

  onProgress("Building depth map...");

  // Build silhouette mask with strict filtering
  let hasAlpha = false;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 200) { hasAlpha = true; break; }
  }

  const mask = new Uint8Array(cw * ch);
  const ALPHA_THRESHOLD = 230; // 90% opacity
  const WHITE_THRESHOLD = 240; // exclude near-white pixels
  
  if (hasAlpha) {
    // Alpha-based masking: only pixels with opacity >= 90%
    for (let i = 0; i < cw * ch; i++) {
      const alpha = data[i * 4 + 3];
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      // Exclude: low alpha OR very white pixels
      mask[i] = (alpha >= ALPHA_THRESHOLD && !(r > WHITE_THRESHOLD && g > WHITE_THRESHOLD && b > WHITE_THRESHOLD)) ? 1 : 0;
    }
  } else {
    // Background color detection + white threshold
    let bgR = 0, bgG = 0, bgB = 0, n = 0;
    const corners = [[0,0],[cw-1,0],[0,ch-1],[cw-1,ch-1]];
    for (const [x, y] of corners) {
      const i = (y * cw + x) * 4;
      bgR += data[i]; bgG += data[i+1]; bgB += data[i+2]; n++;
    }
    bgR /= n; bgG /= n; bgB /= n;
    for (let i = 0; i < cw * ch; i++) {
      const r = data[i*4], g = data[i*4+1], b = data[i*4+2];
      const dr = r-bgR, dg = g-bgG, db = b-bgB;
      const dist = Math.sqrt(dr*dr+dg*dg+db*db);
      // Exclude: too close to background color OR very white
      mask[i] = (dist > 40 && !(r > WHITE_THRESHOLD && g > WHITE_THRESHOLD && b > WHITE_THRESHOLD)) ? 1 : 0;
    }
  }

  // Apply 3px edge erosion to remove silhouette bleed
  const erosionRadius = 3;
  const erodedMask = new Uint8Array(cw * ch);
  for (let i = 0; i < cw * ch; i++) erodedMask[i] = mask[i];
  
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      if (!mask[y * cw + x]) continue; // skip if already background
      let isBoundary = false;
      for (let dy = -erosionRadius; dy <= erosionRadius; dy++) {
        for (let dx = -erosionRadius; dx <= erosionRadius; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= cw || ny < 0 || ny >= ch || !mask[ny * cw + nx]) {
            isBoundary = true;
            break;
          }
        }
        if (isBoundary) break;
      }
      if (isBoundary) erodedMask[y * cw + x] = 0; // erode boundary pixels
    }
  }
  
  for (let i = 0; i < cw * ch; i++) mask[i] = erodedMask[i];

  // Distance-from-edge transform via iterative erosion
  let distMap = new Float32Array(cw * ch);
  for (let i = 0; i < cw * ch; i++) distMap[i] = mask[i];

  for (let pass = 0; pass < 16; pass++) {
    distMap = boxBlur(distMap, cw, ch, 2);
    for (let i = 0; i < cw * ch; i++) if (!mask[i]) distMap[i] = 0;
  }

  // Normalize and apply gamma only within foreground region
  let maxD = 0;
  for (let i = 0; i < distMap.length; i++) if (mask[i] && distMap[i] > maxD) maxD = distMap[i];
  if (maxD > 0) {
    for (let i = 0; i < distMap.length; i++) {
      if (mask[i]) {
        distMap[i] /= maxD;
        distMap[i] = Math.pow(distMap[i], 0.6); // gamma: rounder bulge
      } else {
        distMap[i] = 0; // force background to zero depth
      }
    }
  }

  return { depth: distMap, mask, data, width: cw, height: ch, aspect };
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

// ── 3D Mesh Canvas ────────────────────────────────────────────────────────────
function MeshCanvas({ depthMap }) {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!depthMap) return;
    const el = mountRef.current;
    if (!el) return;

    const W = el.clientWidth, H = el.clientHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.01, 100);
    camera.position.set(0, 0, 3.0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1);
    renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);

    const { depth, mask, data, width, height, aspect } = depthMap;

    // Build displaced mesh geometry
    const segW = Math.min(width - 1, 255);
    const segH = Math.min(height - 1, 255);
    const scaleX = aspect >= 1 ? 2 : 2 * aspect;
    const scaleY = aspect >= 1 ? 2 / aspect : 2;
    const MAX_Z = 0.18;

    const geo = new THREE.BufferGeometry();
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    const getDepth = (xi, yi) => {
      const sx = Math.round((xi / segW) * (width - 1));
      const sy = Math.round((yi / segH) * (height - 1));
      const idx = sy * width + sx;
      return mask[idx] ? depth[idx] * MAX_Z : 0;
    };

    const getMaskXY = (xi, yi) => {
      const sx = Math.round((Math.min(Math.max(xi,0),segW) / segW) * (width - 1));
      const sy = Math.round((Math.min(Math.max(yi,0),segH) / segH) * (height - 1));
      return mask[sy * width + sx] ? 1 : 0;
    };

    // Front face vertices
    for (let yi = 0; yi <= segH; yi++) {
      for (let xi = 0; xi <= segW; xi++) {
        const u = xi / segW;
        const v = yi / segH;
        const x = (u - 0.5) * scaleX;
        const y = -(v - 0.5) * scaleY;
        const z = getDepth(xi, yi);
        positions.push(x, y, z);
        uvs.push(u, 1 - v);
        normals.push(0, 0, 1); // will compute later
      }
    }

    // Front face triangles — only where mask is foreground
    for (let yi = 0; yi < segH; yi++) {
      for (let xi = 0; xi < segW; xi++) {
        // Skip quad if all 4 corners are background
        const m00 = getMaskXY(xi, yi), m10 = getMaskXY(xi+1, yi);
        const m01 = getMaskXY(xi, yi+1), m11 = getMaskXY(xi+1, yi+1);
        if (!m00 && !m10 && !m01 && !m11) continue;
        const a = yi * (segW + 1) + xi;
        const b = a + 1;
        const c = a + (segW + 1);
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }

    // Back face (depth-displaced concave mirror of front, gives real volume)
    const backOffset = positions.length / 3;
    for (let yi = 0; yi <= segH; yi++) {
      for (let xi = 0; xi <= segW; xi++) {
        const u = xi / segW;
        const v = yi / segH;
        const x = (u - 0.5) * scaleX;
        const y = -(v - 0.5) * scaleY;
        const z = -getDepth(xi, yi) * 0.15; // thinner back wall
        positions.push(x, y, z);
        uvs.push(u, 1 - v);
        normals.push(0, 0, -1);
      }
    }
    for (let yi = 0; yi < segH; yi++) {
      for (let xi = 0; xi < segW; xi++) {
        const m00 = getMaskXY(xi, yi), m10 = getMaskXY(xi+1, yi);
        const m01 = getMaskXY(xi, yi+1), m11 = getMaskXY(xi+1, yi+1);
        if (!m00 && !m10 && !m01 && !m11) continue;
        const a = backOffset + yi * (segW + 1) + xi;
        const b = a + 1;
        const c = a + (segW + 1);
        const d = c + 1;
        indices.push(a, b, c, b, d, c);
      }
    }

    // Side walls along silhouette edges
    const frontV = (yi, xi) => yi * (segW + 1) + xi;
    const backV  = (yi, xi) => backOffset + yi * (segW + 1) + xi;

    for (let yi = 0; yi < segH; yi++) {
      for (let xi = 0; xi < segW; xi++) {
        const here = getMaskXY(xi, yi);
        if (!here) continue;
        if (!getMaskXY(xi + 1, yi)) {
          const f0 = frontV(yi, xi+1), f1 = frontV(yi+1, xi+1);
          const b0 = backV(yi, xi+1),  b1 = backV(yi+1, xi+1);
          indices.push(f0, f1, b0, f1, b1, b0);
        }
        if (!getMaskXY(xi - 1, yi)) {
          const f0 = frontV(yi, xi), f1 = frontV(yi+1, xi);
          const b0 = backV(yi, xi),  b1 = backV(yi+1, xi);
          indices.push(f0, b0, f1, f1, b0, b1);
        }
        if (!getMaskXY(xi, yi + 1)) {
          const f0 = frontV(yi+1, xi), f1 = frontV(yi+1, xi+1);
          const b0 = backV(yi+1, xi),  b1 = backV(yi+1, xi+1);
          indices.push(f0, f1, b0, f1, b1, b0);
        }
        if (!getMaskXY(xi, yi - 1)) {
          const f0 = frontV(yi, xi), f1 = frontV(yi, xi+1);
          const b0 = backV(yi, xi),  b1 = backV(yi, xi+1);
          indices.push(f0, b0, f1, f1, b0, b1);
        }
      }
    }

    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals(); // real smooth normals

    // Texture from image data
    const texCanvas = document.createElement("canvas");
    texCanvas.width = width; texCanvas.height = height;
    const tc = texCanvas.getContext("2d");
    const imgData = tc.createImageData(width, height);
    imgData.data.set(data);
    // Fill transparent pixels with nearest edge color for cleaner silhouette
    for (let i = 0; i < width * height; i++) {
      if (!mask[i]) {
        imgData.data[i * 4 + 3] = 0;
      }
    }
    tc.putImageData(imgData, 0, 0);
    const texture = new THREE.CanvasTexture(texCanvas);
    texture.needsUpdate = true;

    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.DoubleSide,
      alphaTest: 0.1,
      roughness: 0.7,
      metalness: 0.05,
    });

    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    // Ambient particles
    const pts = [];
    for (let i = 0; i < 40; i++) pts.push((Math.random()-.5)*6,(Math.random()-.5)*6,(Math.random()-.5)*3);
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0x0066ff, size: 0.02, opacity: 0.3, transparent: true })));

    // Drag to orbit
    let isDragging = false, prevX = 0, prevY = 0;
    let rotX = 0, rotY = 0, velX = 0, velY = 0;
    let autoRotate = true;

    const onDown = (x, y) => { isDragging = true; autoRotate = false; prevX = x; prevY = y; };
    const onMove = (x, y) => {
      if (!isDragging) return;
      velY += (x - prevX) * 0.005; velX += (y - prevY) * 0.005;
      prevX = x; prevY = y;
    };
    const onUp = () => { isDragging = false; };

    el.addEventListener("mousedown", e => onDown(e.clientX, e.clientY));
    window.addEventListener("mousemove", e => onMove(e.clientX, e.clientY));
    window.addEventListener("mouseup", onUp);
    el.addEventListener("touchstart", e => onDown(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
    el.addEventListener("touchmove", e => onMove(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
    el.addEventListener("touchend", onUp);

    let t = 0, frame;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      t += 0.008;
      if (autoRotate) {
        mesh.rotation.y += 0.004;
        mesh.rotation.x = Math.sin(t * 0.3) * 0.1;
      } else {
        rotY += velY; rotX += velX;
        velY *= 0.88; velX *= 0.88;
        mesh.rotation.y = rotY;
        mesh.rotation.x = Math.max(-1.2, Math.min(1.2, rotX));
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("mousedown", e => onDown(e.clientX, e.clientY));
      window.removeEventListener("mousemove", e => onMove(e.clientX, e.clientY));
      window.removeEventListener("mouseup", onUp);
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      renderer.dispose(); geo.dispose(); mat.dispose(); texture.dispose();
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
    renderer.setClearColor(0x000000, 1);
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
                  <MeshCanvas depthMap={depthMap} />
                ) : (
                  <IdleCanvas />
                )}
              </div>

              {status === "done" && (
                <div className="mx-4 mt-2 flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: "rgba(0,200,100,0.1)", border: "1px solid rgba(0,200,100,0.2)" }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-400 text-xs">3D mesh · drag to orbit · real geometry</span>
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
                      <p className="text-white/35 text-xs mt-1">Works best with black background · PNG with transparency</p>
                    </div>
                  </button>
                )}

                <p className="text-center text-white/20 text-xs mt-3 flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Real 3D mesh · drag to orbit · depth-displaced geometry
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