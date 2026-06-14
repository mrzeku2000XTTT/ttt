import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Camera, Download, MapPin, Eye, Move, RotateCcw, Maximize2, X, Plus, Trash2, Film, Image as ImageIcon, ZoomIn, ZoomOut, Crosshair, Layers } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Camera presets for cinematography
const CAMERA_PRESETS = [
  { id: "eye", label: "Eye Level", icon: "👁", pitch: 0, desc: "Natural human POV" },
  { id: "low", label: "Low Angle", icon: "📐", pitch: -25, desc: "Heroic, powerful subjects" },
  { id: "high", label: "High Angle", icon: "🏔", pitch: 25, desc: "Vulnerable, overview" },
  { id: "bird", label: "Bird's Eye", icon: "🦅", pitch: 70, desc: "Top-down aerial" },
  { id: "dutch", label: "Dutch Tilt", icon: "↗", pitch: 0, roll: 15, desc: "Unease, tension" },
  { id: "worm", label: "Worm's Eye", icon: "🐛", pitch: -60, desc: "Extreme upward drama" },
];

const LENS_PRESETS = [
  { label: "14mm", fov: 100, desc: "Ultra-wide, dramatic distortion" },
  { label: "24mm", fov: 84, desc: "Wide, environmental storytelling" },
  { label: "35mm", fov: 63, desc: "Natural, documentary feel" },
  { label: "50mm", fov: 47, desc: "Human eye, neutral" },
  { label: "85mm", fov: 29, desc: "Portrait, subject isolation" },
  { label: "135mm", fov: 18, desc: "Telephoto compression" },
];

function WorldCanvas({ image, cameraPos, setCameraPos, cameraAngle, setCameraAngle, fov, roll, markers, onAddMarker, activeMarker }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const dragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // Draw world view — pan/zoom over the equirectangular image simulating walkable navigation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const img = new window.Image();
    img.onload = () => {
      // Compute visible window based on cameraPos (yaw 0-360, pitch -90..90), fov, zoom
      const yaw = ((cameraPos.x % 360) + 360) % 360;
      const pitch = Math.max(-85, Math.min(85, cameraPos.y));

      // Map yaw/pitch to source rect in equirectangular image
      const srcXFraction = yaw / 360;
      const srcYFraction = (pitch + 90) / 180;

      const srcW = img.naturalWidth / (fov / 90) / zoom;
      const srcH = img.naturalHeight / (fov / 90) / zoom;

      const srcX = (img.naturalWidth * srcXFraction - srcW / 2 + img.naturalWidth) % img.naturalWidth;
      const srcY = Math.max(0, Math.min(img.naturalHeight - srcH, img.naturalHeight * srcYFraction - srcH / 2));

      // Apply roll via canvas rotation
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate((roll || 0) * Math.PI / 180);
      ctx.translate(-W / 2, -H / 2);

      // Handle wrap-around at seam
      if (srcX + srcW <= img.naturalWidth) {
        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, W, H);
      } else {
        const part1W = img.naturalWidth - srcX;
        const part1Frac = part1W / srcW;
        ctx.drawImage(img, srcX, srcY, part1W, srcH, 0, 0, W * part1Frac, H);
        ctx.drawImage(img, 0, srcY, srcW - part1W, srcH, W * part1Frac, 0, W * (1 - part1Frac), H);
      }

      // Vignette overlay
      const grad = ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.75);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(1, "rgba(0,0,0,0.45)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Draw markers visible in current FOV
      markers.forEach((m) => {
        const markerYaw = ((m.yaw % 360) + 360) % 360;
        const relYaw = markerYaw - yaw;
        const normRelYaw = ((relYaw + 540) % 360) - 180;
        const halfFOV = fov / 2;
        if (Math.abs(normRelYaw) < halfFOV * 1.1) {
          const relPitch = m.pitch - pitch;
          const halfVFOV = (H / W) * halfFOV;
          if (Math.abs(relPitch) < halfVFOV * 1.2) {
            const markerX = W / 2 + (normRelYaw / halfFOV) * (W / 2);
            const markerY = H / 2 - (relPitch / halfVFOV) * (H / 2);
            const isActive = activeMarker === m.id;
            ctx.beginPath();
            ctx.arc(markerX, markerY, isActive ? 10 : 7, 0, Math.PI * 2);
            ctx.fillStyle = isActive ? "rgba(255,214,10,0.9)" : "rgba(10,132,255,0.85)";
            ctx.fill();
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = "white";
            ctx.font = "bold 9px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(m.label || "📍", markerX, markerY + 20);
          }
        }
      });

      // Crosshair
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(W / 2 - 16, H / 2); ctx.lineTo(W / 2 + 16, H / 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W / 2, H / 2 - 16); ctx.lineTo(W / 2, H / 2 + 16); ctx.stroke();
      ctx.restore();
    };
    img.src = image;
  }, [image, cameraPos, fov, roll, zoom, markers, activeMarker]);

  const handleMouseDown = (e) => {
    dragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseMove = (e) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setCameraPos(p => ({ x: p.x - dx * 0.15, y: Math.max(-85, Math.min(85, p.y + dy * 0.1)) }));
  };
  const handleMouseUp = () => { dragging.current = false; };

  const handleTouchStart = (e) => {
    dragging.current = true;
    lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchMove = (e) => {
    if (!dragging.current) return;
    const dx = e.touches[0].clientX - lastMouse.current.x;
    const dy = e.touches[0].clientY - lastMouse.current.y;
    lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setCameraPos(p => ({ x: p.x - dx * 0.2, y: Math.max(-85, Math.min(85, p.y + dy * 0.15)) }));
  };

  const handleDoubleClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const W = canvasRef.current.width;
    const H = canvasRef.current.height;
    const halfFOV = fov / 2;
    const halfVFOV = (H / W) * halfFOV;
    const yaw = ((cameraPos.x % 360) + 360) % 360;
    const relYaw = ((mx - W / 2) / (W / 2)) * halfFOV;
    const relPitch = -((my - H / 2) / (H / 2)) * halfVFOV;
    const markerYaw = (yaw + relYaw + 360) % 360;
    const markerPitch = cameraPos.y + relPitch;
    onAddMarker({ yaw: markerYaw, pitch: markerPitch });
  };

  return (
    <div ref={containerRef} className="relative w-full" style={{ aspectRatio: "16/9" }}>
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        className="w-full h-full rounded-2xl"
        style={{ cursor: dragging.current ? "grabbing" : "grab", background: "#000", display: "block" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      />
      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5">
        <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-all" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
          <ZoomIn className="w-4 h-4" />
        </button>
        <button onClick={() => setZoom(z => Math.max(0.5, z - 0.2))} className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-all" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
          <ZoomOut className="w-4 h-4" />
        </button>
        <button onClick={() => { setZoom(1); setCameraPos({ x: 0, y: 0 }); }} className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-all" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function WorldWalker() {
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0 });
  const [cameraAngle, setCameraAngle] = useState({ pitch: 0, roll: 0 });
  const [selectedPreset, setSelectedPreset] = useState("eye");
  const [selectedLens, setSelectedLens] = useState(1); // index into LENS_PRESETS
  const [markers, setMarkers] = useState([]);
  const [activeMarker, setActiveMarker] = useState(null);
  const [screenshots, setScreenshots] = useState([]);
  const [tab, setTab] = useState("camera"); // camera | markers | shots
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [newMarkerLabel, setNewMarkerLabel] = useState("");
  const [pendingMarker, setPendingMarker] = useState(null);
  const fileRef = useRef(null);
  const canvasRef = useRef(null);

  const lens = LENS_PRESETS[selectedLens];
  const preset = CAMERA_PRESETS.find(p => p.id === selectedPreset);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImage(url);
    setMarkers([]);
    setScreenshots([]);
    setCameraPos({ x: 0, y: 0 });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image")) return;
    setImageFile(file);
    setImage(URL.createObjectURL(file));
    setMarkers([]);
    setScreenshots([]);
    setCameraPos({ x: 0, y: 0 });
  };

  const applyPreset = (p) => {
    setSelectedPreset(p.id);
    setCameraAngle({ pitch: p.pitch || 0, roll: p.roll || 0 });
  };

  const takeScreenshot = () => {
    // Find the canvas element rendered by WorldCanvas
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const shot = {
      id: Date.now(),
      url: dataUrl,
      label: `Shot ${screenshots.length + 1}`,
      yaw: Math.round(((cameraPos.x % 360) + 360) % 360),
      pitch: Math.round(cameraPos.y),
      lens: lens.label,
      preset: preset?.label,
      marker: markers.find(m => m.id === activeMarker)?.label || null,
    };
    setScreenshots(prev => [shot, ...prev]);
    setTab("shots");
  };

  const downloadShot = (shot) => {
    const a = document.createElement("a");
    a.href = shot.url;
    a.download = `worldwalker_${shot.label.replace(" ", "_")}.png`;
    a.click();
  };

  const addMarker = ({ yaw, pitch }) => {
    setPendingMarker({ yaw, pitch });
  };

  const confirmMarker = () => {
    if (!pendingMarker) return;
    const m = { id: Date.now(), label: newMarkerLabel || `Shot ${markers.length + 1}`, ...pendingMarker };
    setMarkers(prev => [...prev, m]);
    setActiveMarker(m.id);
    setPendingMarker(null);
    setNewMarkerLabel("");
  };

  const jumpToMarker = (m) => {
    setCameraPos({ x: m.yaw, y: m.pitch });
    setActiveMarker(m.id);
  };

  const generateAIWorld = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const result = await base44.integrations.Core.GenerateImage({
        prompt: `360-degree equirectangular panoramic photograph, ${aiPrompt}, seamlessly tileable horizontally, ultra-wide spherical projection, cinematic lighting, photorealistic, no text, no watermarks, wide establishing shot`
      });
      setImage(result.url);
      setMarkers([]);
      setScreenshots([]);
      setCameraPos({ x: 0, y: 0 });
    } catch {}
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen text-white" style={{ background: "#000" }}>
      {/* Header */}
      <div className="sticky top-0 z-30 px-5 py-3 flex items-center justify-between gap-3"
        style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <h1 className="text-[18px] font-[900] text-white">WorldWalker</h1>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>Drop a panorama · walk it · set camera positions · screenshot</p>
        </div>
        <div className="flex items-center gap-2">
          {image && (
            <button onClick={takeScreenshot}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-bold text-black"
              style={{ background: "#ffd60a" }}>
              <Camera className="w-3.5 h-3.5" /> Screenshot
            </button>
          )}
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-semibold text-white"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <Upload className="w-3.5 h-3.5" /> Upload
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 pb-24">
        {/* Drop zone / canvas */}
        {!image ? (
          <div className="space-y-6">
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              className="rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all"
              style={{ minHeight: 300, border: "2px dashed rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.02)" }}
              onClick={() => fileRef.current?.click()}
            >
              <ImageIcon className="w-12 h-12" style={{ color: "rgba(255,255,255,0.15)" }} />
              <p className="text-[15px] font-[700] text-white">Drop a panoramic / 360° image here</p>
              <p className="text-[12px] text-center max-w-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                Works best with equirectangular 360° photos. Any wide-angle or landscape image also works.
              </p>
              <button className="px-5 py-2.5 rounded-full text-[13px] font-bold text-white" style={{ background: "#0a84ff" }}>
                Choose Image
              </button>
            </div>

            {/* AI generation */}
            <div className="p-5 rounded-3xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-[13px] font-[700] text-white mb-3">✨ Or generate a world with AI</p>
              <div className="flex gap-2">
                <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                  placeholder="e.g. rainy Tokyo street at night, ancient temple forest, modern cyberpunk alley…"
                  className="flex-1 rounded-2xl px-4 py-2.5 text-[13px] text-white outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                  onKeyDown={e => e.key === "Enter" && generateAIWorld()} />
                <button onClick={generateAIWorld} disabled={isGenerating || !aiPrompt.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[13px] font-bold text-white disabled:opacity-50"
                  style={{ background: "#bf5af2" }}>
                  {isGenerating ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> Generating…</> : "Generate"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* World canvas */}
            <div className="relative">
              <WorldCanvas
                image={image}
                cameraPos={cameraPos}
                setCameraPos={setCameraPos}
                cameraAngle={cameraAngle}
                setCameraAngle={setCameraAngle}
                fov={lens.fov}
                roll={cameraAngle.roll}
                markers={markers}
                onAddMarker={addMarker}
                activeMarker={activeMarker}
              />
              {/* HUD overlay */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                <div className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", color: "rgba(255,255,255,0.7)" }}>
                  YAW {Math.round(((cameraPos.x % 360) + 360) % 360)}° · PITCH {Math.round(cameraPos.y)}°
                </div>
                <div className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", color: "#ffd60a" }}>
                  {lens.label} · {preset?.label}
                </div>
              </div>
              <div className="absolute top-3 right-3 text-[10px] px-2.5 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", color: "rgba(255,255,255,0.5)" }}>
                Drag to look · Double-tap to pin marker
              </div>
            </div>

            {/* Pending marker modal */}
            <AnimatePresence>
              {pendingMarker && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 rounded-2xl flex items-center gap-3"
                  style={{ background: "rgba(10,132,255,0.12)", border: "1px solid rgba(10,132,255,0.3)" }}>
                  <MapPin className="w-5 h-5 flex-shrink-0" style={{ color: "#0a84ff" }} />
                  <input value={newMarkerLabel} onChange={e => setNewMarkerLabel(e.target.value)}
                    placeholder="Label this camera position…"
                    className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder-white/30"
                    autoFocus onKeyDown={e => e.key === "Enter" && confirmMarker()} />
                  <button onClick={confirmMarker} className="px-4 py-1.5 rounded-full text-[12px] font-bold text-white" style={{ background: "#0a84ff" }}>Pin</button>
                  <button onClick={() => setPendingMarker(null)} className="p-1 rounded-full" style={{ color: "rgba(255,255,255,0.4)" }}><X className="w-4 h-4" /></button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Controls row */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {["camera", "markers", "shots"].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className="flex-shrink-0 px-4 py-1.5 rounded-full text-[12px] font-semibold capitalize transition-all"
                  style={{ background: tab === t ? "#0a84ff" : "rgba(255,255,255,0.06)", color: tab === t ? "#fff" : "rgba(255,255,255,0.5)" }}>
                  {t === "shots" ? `Shots (${screenshots.length})` : t}
                </button>
              ))}
              <div className="flex-1" />
              <button onClick={() => { setImage(null); setMarkers([]); setScreenshots([]); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] text-white/40 hover:text-white/70 transition-all">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              {tab === "camera" && (
                <motion.div key="camera" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                  {/* Lens presets */}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>🎞 Lens / Focal Length</p>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {LENS_PRESETS.map((l, i) => (
                        <button key={l.label} onClick={() => setSelectedLens(i)}
                          className="flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-2xl transition-all min-w-[80px]"
                          style={{ background: selectedLens === i ? "rgba(10,132,255,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${selectedLens === i ? "rgba(10,132,255,0.4)" : "rgba(255,255,255,0.07)"}` }}>
                          <span className="text-[14px] font-[900]" style={{ color: selectedLens === i ? "#0a84ff" : "rgba(255,255,255,0.7)" }}>{l.label}</span>
                          <span className="text-[9px] text-center" style={{ color: "rgba(255,255,255,0.3)" }}>{l.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Camera angle presets */}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>🎬 Camera Angle</p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {CAMERA_PRESETS.map(p => (
                        <button key={p.id} onClick={() => applyPreset(p)}
                          className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-2xl transition-all"
                          style={{ background: selectedPreset === p.id ? "rgba(191,90,242,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${selectedPreset === p.id ? "rgba(191,90,242,0.4)" : "rgba(255,255,255,0.07)"}` }}>
                          <span className="text-[18px]">{p.icon}</span>
                          <span className="text-[11px] font-bold" style={{ color: selectedPreset === p.id ? "#bf5af2" : "rgba(255,255,255,0.7)" }}>{p.label}</span>
                          <span className="text-[9px] text-center leading-tight" style={{ color: "rgba(255,255,255,0.3)" }}>{p.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual controls */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Yaw (horizontal)</p>
                      <input type="range" min={0} max={360} value={((cameraPos.x % 360) + 360) % 360}
                        onChange={e => setCameraPos(p => ({ ...p, x: parseFloat(e.target.value) }))}
                        className="w-full accent-blue-500" />
                      <span className="text-[12px] text-white font-bold">{Math.round(((cameraPos.x % 360) + 360) % 360)}°</span>
                    </div>
                    <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Pitch (vertical)</p>
                      <input type="range" min={-85} max={85} value={cameraPos.y}
                        onChange={e => setCameraPos(p => ({ ...p, y: parseFloat(e.target.value) }))}
                        className="w-full accent-purple-500" />
                      <span className="text-[12px] text-white font-bold">{Math.round(cameraPos.y)}°</span>
                    </div>
                  </div>

                  <button onClick={takeScreenshot}
                    className="w-full py-4 rounded-2xl text-[15px] font-[800] text-black flex items-center justify-center gap-2 transition-all hover:brightness-110"
                    style={{ background: "#ffd60a", boxShadow: "0 0 32px rgba(255,214,10,0.3)" }}>
                    <Camera className="w-5 h-5" /> Take Screenshot
                  </button>
                </motion.div>
              )}

              {tab === "markers" && (
                <motion.div key="markers" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  <div className="p-4 rounded-2xl text-[12px]" style={{ background: "rgba(255,214,10,0.06)", border: "1px solid rgba(255,214,10,0.2)", color: "rgba(255,214,10,0.8)" }}>
                    💡 <strong>Double-tap anywhere in the world view</strong> to drop a camera position marker. Then click a marker to jump back to that exact spot.
                  </div>
                  {markers.length === 0 ? (
                    <p className="text-center py-10 text-[13px]" style={{ color: "rgba(255,255,255,0.3)" }}>No markers yet — double-tap in the world view</p>
                  ) : (
                    <div className="space-y-2">
                      {markers.map(m => (
                        <motion.div key={m.id} layout
                          className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all"
                          style={{ background: activeMarker === m.id ? "rgba(10,132,255,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${activeMarker === m.id ? "rgba(10,132,255,0.3)" : "rgba(255,255,255,0.07)"}` }}
                          onClick={() => jumpToMarker(m)}>
                          <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: activeMarker === m.id ? "#0a84ff" : "rgba(255,255,255,0.4)" }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-white">{m.label}</p>
                            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>YAW {Math.round(m.yaw)}° · PITCH {Math.round(m.pitch)}°</p>
                          </div>
                          <button onClick={e => { e.stopPropagation(); setCameraPos({ x: m.yaw, y: m.pitch }); takeScreenshot(); }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-black"
                            style={{ background: "#ffd60a" }}>
                            <Camera className="w-3 h-3" /> Shoot
                          </button>
                          <button onClick={e => { e.stopPropagation(); setMarkers(prev => prev.filter(x => x.id !== m.id)); if (activeMarker === m.id) setActiveMarker(null); }}
                            className="p-1.5 rounded-full transition-all" style={{ color: "rgba(255,69,58,0.7)" }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {tab === "shots" && (
                <motion.div key="shots" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {screenshots.length === 0 ? (
                    <p className="text-center py-10 text-[13px]" style={{ color: "rgba(255,255,255,0.3)" }}>No screenshots yet — hit the yellow Screenshot button</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {screenshots.map(s => (
                        <motion.div key={s.id} layout initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                          className="rounded-2xl overflow-hidden group relative"
                          style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                          <img src={s.url} alt={s.label} className="w-full object-cover" style={{ aspectRatio: "16/9" }} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <p className="text-[11px] font-bold text-white">{s.label}</p>
                            <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.45)" }}>{s.lens} · {s.preset} · {s.yaw}° {s.pitch}°</p>
                            {s.marker && <p className="text-[9px]" style={{ color: "#ffd60a" }}>📍 {s.marker}</p>}
                          </div>
                          <button onClick={() => downloadShot(s)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-full flex items-center justify-center text-white"
                            style={{ background: "rgba(0,0,0,0.6)" }}>
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                  {screenshots.length > 0 && (
                    <button onClick={() => screenshots.forEach(s => downloadShot(s))}
                      className="w-full mt-4 py-3 rounded-2xl text-[13px] font-bold text-white flex items-center justify-center gap-2"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <Download className="w-4 h-4" /> Download All ({screenshots.length})
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}