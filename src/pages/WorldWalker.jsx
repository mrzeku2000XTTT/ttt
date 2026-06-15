import React, { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, useTexture, Html, PerspectiveCamera } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Camera, Download, MapPin, X, Trash2, Image as ImageIcon, Crosshair, RotateCcw, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import * as THREE from "three";

// ─── Lens presets ─────────────────────────────────────────────────────────────
const LENS_PRESETS = [
  { label: "14mm", fov: 100, desc: "Ultra-wide" },
  { label: "24mm", fov: 84, desc: "Wide" },
  { label: "35mm", fov: 63, desc: "Natural" },
  { label: "50mm", fov: 47, desc: "Human eye" },
  { label: "85mm", fov: 29, desc: "Portrait" },
  { label: "135mm", fov: 18, desc: "Telephoto" },
];

const CAMERA_PRESETS = [
  { id: "eye", label: "Eye Level", pitch: 0, height: 1.6 },
  { id: "low", label: "Low Angle", pitch: -0.4, height: 0.4 },
  { id: "high", label: "High Angle", pitch: 0.35, height: 3.5 },
  { id: "bird", label: "Bird's Eye", pitch: 1.2, height: 12 },
  { id: "worm", label: "Worm's Eye", pitch: -0.9, height: 0.15 },
];

// ─── First-person camera controller ───────────────────────────────────────────
function FPSController({ locked, fov, onPositionChange }) {
  const { camera, gl } = useThree();
  const keys = useRef({});
  const yaw = useRef(0);
  const pitch = useRef(0);
  const speed = 6;
  const mouseSensitivity = 0.002;
  const position = useRef(new THREE.Vector3(0, 1.6, 0));

  useEffect(() => {
    if (locked) return;

    const onKeyDown = (e) => { keys.current[e.code] = true; };
    const onKeyUp = (e) => { keys.current[e.code] = false; };
    const onMouseMove = (e) => {
      if (document.pointerLockElement !== gl.domElement) return;
      yaw.current -= e.movementX * mouseSensitivity;
      pitch.current = Math.max(-Math.PI / 2.4, Math.min(Math.PI / 2.4, pitch.current - e.movementY * mouseSensitivity));
    };
    const onClick = () => { gl.domElement.requestPointerLock(); };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    document.addEventListener("mousemove", onMouseMove);
    gl.domElement.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("mousemove", onMouseMove);
      gl.domElement.removeEventListener("click", onClick);
    };
  }, [locked, gl]);

  useFrame((_, delta) => {
    if (locked) return;
    const dt = delta;

    camera.fov = fov;
    camera.updateProjectionMatrix();

    const forward = new THREE.Vector3(-Math.sin(yaw.current), 0, -Math.cos(yaw.current)).normalize();
    const right = new THREE.Vector3(Math.cos(yaw.current), 0, -Math.sin(yaw.current)).normalize();

    if (keys.current["KeyW"]) position.current.addScaledVector(forward, speed * dt);
    if (keys.current["KeyS"]) position.current.addScaledVector(forward, -speed * dt);
    if (keys.current["KeyA"]) position.current.addScaledVector(right, -speed * dt);
    if (keys.current["KeyD"]) position.current.addScaledVector(right, speed * dt);

    // Clamp inside sphere
    if (position.current.length() > 48) {
      position.current.normalize().multiplyScalar(48);
    }

    camera.position.copy(position.current);

    const lookDir = new THREE.Vector3(
      -Math.sin(yaw.current) * Math.cos(pitch.current),
      Math.sin(pitch.current),
      -Math.cos(yaw.current) * Math.cos(pitch.current)
    ).normalize();

    camera.lookAt(position.current.clone().add(lookDir));

    if (onPositionChange) {
      onPositionChange({
        x: Math.round(position.current.x * 10) / 10,
        y: Math.round(position.current.y * 10) / 10,
        z: Math.round(position.current.z * 10) / 10,
        yaw: Math.round(((yaw.current * 180 / Math.PI) % 360 + 360) % 360),
        pitch: Math.round(pitch.current * 180 / Math.PI),
      });
    }
  });

  return null;
}

// ─── Sky sphere ───────────────────────────────────────────────────────────────
function SkySphere({ imageUrl }) {
  const texture = useTexture(imageUrl);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[50, 64, 32]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}

// ─── Ground ring (subtle reference plane) ─────────────────────────────────────
function GroundRing() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
      <ringGeometry args={[2, 50, 64]} />
      <meshBasicMaterial color="#111" side={THREE.DoubleSide} transparent opacity={0.25} />
    </mesh>
  );
}

// ─── 3D Marker ────────────────────────────────────────────────────────────────
function WorldMarker({ position, color, label, isActive, onClick }) {
  const meshRef = useRef();

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} onClick={onClick}>
        <coneGeometry args={[0.35, 1.2, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isActive ? 0.8 : 0.3} />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <sphereGeometry args={[isActive ? 0.3 : 0.2, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isActive ? 1 : 0.5} />
      </mesh>
      {label && (
        <Html position={[0, 1.8, 0]} center style={{ pointerEvents: "none" }}>
          <div className="bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
            📍 {label}
          </div>
        </Html>
      )}
    </group>
  );
}

// ─── 3D Scene ─────────────────────────────────────────────────────────────────
function WorldScene({ imageUrl, locked, fov, markers, activeMarker, onMarkerClick, onPositionChange, onDoubleClickPlace }) {
  const { camera, gl } = useThree();
  const lastClick = useRef(0);

  useEffect(() => {
    const handler = (e) => {
      const now = Date.now();
      if (now - lastClick.current < 300) {
        // Double click detected - place marker at camera look direction
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2(0, 0); // center of screen
        raycaster.setFromCamera(mouse, camera);
        const sphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 49);
        const intersect = new THREE.Vector3();
        if (raycaster.ray.intersectSphere(sphere, intersect)) {
          onDoubleClickPlace({
            x: Math.round(intersect.x * 10) / 10,
            y: Math.round(intersect.y * 10) / 10,
            z: Math.round(intersect.z * 10) / 10,
          });
        }
      }
      lastClick.current = now;
    };
    gl.domElement.addEventListener("dblclick", handler);
    return () => gl.domElement.removeEventListener("dblclick", handler);
  }, [camera, gl, onDoubleClickPlace]);

  return (
    <>
      <FPSController locked={locked} fov={fov} onPositionChange={onPositionChange} />
      <SkySphere imageUrl={imageUrl} />
      <GroundRing />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={0.3} />
      {markers.map((m) => (
        <WorldMarker
          key={m.id}
          position={[m.x, m.y, m.z]}
          color={activeMarker === m.id ? "#ffd60a" : "#0a84ff"}
          label={m.label}
          isActive={activeMarker === m.id}
          onClick={() => onMarkerClick(m)}
        />
      ))}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function WorldWalker() {
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [locked, setLocked] = useState(false);
  const [selectedLens, setSelectedLens] = useState(3); // 50mm
  const [selectedPreset, setSelectedPreset] = useState("eye");
  const [markers, setMarkers] = useState([]);
  const [activeMarker, setActiveMarker] = useState(null);
  const [screenshots, setScreenshots] = useState([]);
  const [tab, setTab] = useState("lens");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [pendingMarker, setPendingMarker] = useState(null);
  const [newMarkerLabel, setNewMarkerLabel] = useState("");
  const [camPos, setCamPos] = useState({ x: 0, y: 1.6, z: 0, yaw: 0, pitch: 0 });
  const fileRef = useRef(null);
  const canvasRef = useRef(null);

  const lens = LENS_PRESETS[selectedLens];

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImage(URL.createObjectURL(file));
    setMarkers([]);
    setScreenshots([]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image")) return;
    setImageFile(file);
    setImage(URL.createObjectURL(file));
    setMarkers([]);
    setScreenshots([]);
  };

  const takeScreenshot = () => {
    const c = document.querySelector("canvas");
    if (!c) return;
    const dataUrl = c.toDataURL("image/png");
    const shot = {
      id: Date.now(),
      url: dataUrl,
      label: `Shot ${screenshots.length + 1}`,
      yaw: camPos.yaw,
      pitch: camPos.pitch,
      lens: lens.label,
      preset: CAMERA_PRESETS.find(p => p.id === selectedPreset)?.label,
      pos: { ...camPos },
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

  const handleDoubleClickPlace = (pos) => {
    setPendingMarker(pos);
  };

  const confirmMarker = () => {
    if (!pendingMarker) return;
    const m = {
      id: Date.now(),
      label: newMarkerLabel || `Pos ${markers.length + 1}`,
      ...pendingMarker,
    };
    setMarkers(prev => [...prev, m]);
    setActiveMarker(m.id);
    setPendingMarker(null);
    setNewMarkerLabel("");
  };

  const generateAIWorld = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const result = await base44.integrations.Core.GenerateImage({
        prompt: `360-degree equirectangular spherical panorama, ${aiPrompt}, seamlessly tileable horizontally, photorealistic, no text, no watermarks, epic establishing shot`
      });
      setImage(result.url);
      setMarkers([]);
      setScreenshots([]);
    } catch {}
    setIsGenerating(false);
  };

  const preset = CAMERA_PRESETS.find(p => p.id === selectedPreset);

  return (
    <div className="fixed inset-0 text-white flex flex-col" style={{ background: "#000" }}>
      {/* Minimal top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2.5"
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)" }}>
        <div className="flex items-center gap-3">
          <Link to={createPageUrl("AppStoreV2")}
            className="flex items-center justify-center w-8 h-8 rounded-full transition-all"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <ArrowLeft className="w-4 h-4 text-white" />
          </Link>
          <div>
            <h1 className="text-[15px] font-[900] text-white">WorldWalker</h1>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>WASD walk · mouse look · cinematic positioning</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {image && (
            <button onClick={takeScreenshot}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold text-black"
              style={{ background: "#ffd60a" }}>
              <Camera className="w-3 h-3" /> Screenshot
            </button>
          )}
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold text-white"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <Upload className="w-3 h-3" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </div>
      </div>

      {!image ? (
        /* Landing / upload screen */
        <div className="flex-1 flex flex-col items-center justify-center px-4 gap-8">
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            className="rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all max-w-md w-full"
            style={{ minHeight: 260, border: "2px dashed rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.02)" }}
            onClick={() => fileRef.current?.click()}>
            <ImageIcon className="w-12 h-12" style={{ color: "rgba(255,255,255,0.15)" }} />
            <p className="text-[16px] font-[700] text-white">Drop a panoramic / 360° image</p>
            <p className="text-[12px] text-center max-w-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              Works best with equirectangular 360° photos. You'll walk INSIDE this world in true 3D.
            </p>
            <button className="px-5 py-2.5 rounded-full text-[13px] font-bold text-white" style={{ background: "#0a84ff" }}>
              Choose Image
            </button>
          </div>
          <div className="max-w-md w-full p-5 rounded-3xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-[13px] font-[700] text-white mb-3">✨ AI-generate a world</p>
            <div className="flex gap-2">
              <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                placeholder="Rainy Tokyo alley, ancient temple forest…"
                className="flex-1 rounded-2xl px-4 py-2.5 text-[13px] text-white outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                onKeyDown={e => e.key === "Enter" && generateAIWorld()} />
              <button onClick={generateAIWorld} disabled={isGenerating || !aiPrompt.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[13px] font-bold text-white disabled:opacity-50"
                style={{ background: "#bf5af2" }}>
                {isGenerating ? "…" : "Generate"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* 3D View */
        <div className="flex-1 relative">
          <Canvas
            ref={canvasRef}
            gl={{ preserveDrawingBuffer: true }}
            style={{ position: "absolute", inset: 0 }}
          >
            <Suspense fallback={null}>
              <WorldScene
                imageUrl={image}
                locked={locked}
                fov={lens.fov}
                markers={markers}
                activeMarker={activeMarker}
                onMarkerClick={(m) => setActiveMarker(m.id)}
                onPositionChange={setCamPos}
                onDoubleClickPlace={handleDoubleClickPlace}
              />
            </Suspense>
          </Canvas>

          {/* HUD */}
          <div className="absolute top-14 sm:top-16 left-3 flex flex-col gap-1.5 pointer-events-none">
            <div className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
              YAW {camPos.yaw}° · PITCH {camPos.pitch}°
            </div>
            <div className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", color: "#ffd60a" }}>
              {lens.label} · {preset?.label}
            </div>
          </div>

          <div className="absolute top-14 sm:top-16 right-3 text-[9px] px-2.5 py-1 rounded-full pointer-events-none" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", color: "rgba(255,255,255,0.45)" }}>
            Click = look · Double-tap = pin · ESC = menu
          </div>

          {/* Pending marker modal */}
          <AnimatePresence>
            {pendingMarker && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-44 left-4 right-4 max-w-sm mx-auto p-4 rounded-2xl flex items-center gap-3 z-20"
                style={{ background: "rgba(10,132,255,0.15)", backdropFilter: "blur(12px)", border: "1px solid rgba(10,132,255,0.35)" }}>
                <MapPin className="w-5 h-5 flex-shrink-0" style={{ color: "#0a84ff" }} />
                <input value={newMarkerLabel} onChange={e => setNewMarkerLabel(e.target.value)}
                  placeholder="Label this position…"
                  className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder-white/30"
                  autoFocus onKeyDown={e => e.key === "Enter" && confirmMarker()} />
                <button onClick={confirmMarker} className="px-4 py-1.5 rounded-full text-[12px] font-bold text-white" style={{ background: "#0a84ff" }}>Pin</button>
                <button onClick={() => setPendingMarker(null)} className="p-1 rounded-full" style={{ color: "rgba(255,255,255,0.4)" }}><X className="w-4 h-4" /></button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom panel */}
          <div className="absolute bottom-0 left-0 right-0 z-20">
            {/* Tab bar */}
            <div className="flex items-center gap-1.5 px-4 pb-2 overflow-x-auto scrollbar-hide">
              {[
                { key: "lens", label: "Lens" },
                { key: "angle", label: "Angles" },
                { key: "markers", label: `Markers (${markers.length})` },
                { key: "shots", label: `Shots (${screenshots.length})` },
              ].map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-all"
                  style={{ background: tab === t.key ? "#0a84ff" : "rgba(255,255,255,0.08)", color: tab === t.key ? "#fff" : "rgba(255,255,255,0.5)" }}>
                  {t.label}
                </button>
              ))}
              <div className="flex-1" />
              <button onClick={() => { setImage(null); setMarkers([]); setScreenshots([]); }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] text-white/30 hover:text-white/60 transition-all">
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              {tab === "lens" && (
                <motion.div key="lens" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="px-4 pb-4 flex gap-2 overflow-x-auto scrollbar-hide"
                  style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 100%)" }}>
                  {LENS_PRESETS.map((l, i) => (
                    <button key={l.label} onClick={() => setSelectedLens(i)}
                      className="flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-2xl transition-all min-w-[72px]"
                      style={{ background: selectedLens === i ? "rgba(10,132,255,0.2)" : "rgba(255,255,255,0.05)", border: `1px solid ${selectedLens === i ? "rgba(10,132,255,0.5)" : "rgba(255,255,255,0.08)"}` }}>
                      <span className="text-[14px] font-[900]" style={{ color: selectedLens === i ? "#0a84ff" : "rgba(255,255,255,0.75)" }}>{l.label}</span>
                      <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>{l.desc}</span>
                    </button>
                  ))}
                </motion.div>
              )}

              {tab === "angle" && (
                <motion.div key="angle" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="px-4 pb-4 flex gap-2 overflow-x-auto scrollbar-hide"
                  style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 100%)" }}>
                  {CAMERA_PRESETS.map(p => (
                    <button key={p.id} onClick={() => setSelectedPreset(p.id)}
                      className="flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-2xl transition-all min-w-[80px]"
                      style={{ background: selectedPreset === p.id ? "rgba(191,90,242,0.2)" : "rgba(255,255,255,0.05)", border: `1px solid ${selectedPreset === p.id ? "rgba(191,90,242,0.5)" : "rgba(255,255,255,0.08)"}` }}>
                      <span className="text-[14px] font-[900]" style={{ color: selectedPreset === p.id ? "#bf5af2" : "rgba(255,255,255,0.75)" }}>{p.label}</span>
                      <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>{p.height}m height</span>
                    </button>
                  ))}
                </motion.div>
              )}

              {tab === "markers" && (
                <motion.div key="markers" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="px-4 pb-4 max-h-48 overflow-y-auto space-y-2"
                  style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 100%)" }}>
                  {markers.length === 0 ? (
                    <p className="text-center py-4 text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>Double-tap in the world to place markers</p>
                  ) : markers.map(m => (
                    <div key={m.id} className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all"
                      style={{ background: activeMarker === m.id ? "rgba(10,132,255,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${activeMarker === m.id ? "rgba(10,132,255,0.3)" : "rgba(255,255,255,0.07)"}` }}
                      onClick={() => setActiveMarker(m.id)}>
                      <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: activeMarker === m.id ? "#0a84ff" : "rgba(255,255,255,0.4)" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-white">{m.label}</p>
                        <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.35)" }}>{m.x} · {m.y} · {m.z}</p>
                      </div>
                      <button onClick={e => { e.stopPropagation(); setMarkers(prev => prev.filter(x => x.id !== m.id)); if (activeMarker === m.id) setActiveMarker(null); }}
                        className="p-1.5 rounded-full" style={{ color: "rgba(255,69,58,0.7)" }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}

              {tab === "shots" && (
                <motion.div key="shots" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="px-4 pb-4 max-h-48 overflow-y-auto"
                  style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 100%)" }}>
                  {screenshots.length === 0 ? (
                    <p className="text-center py-4 text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>No screenshots yet — hit the yellow button</p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {screenshots.map(s => (
                        <motion.div key={s.id} layout initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                          className="rounded-xl overflow-hidden group relative cursor-pointer"
                          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                          onClick={() => downloadShot(s)}>
                          <img src={s.url} alt={s.label} className="w-full object-cover" style={{ aspectRatio: "16/9" }} />
                          <div className="absolute bottom-0 left-0 right-0 p-1.5" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.8))" }}>
                            <p className="text-[10px] font-bold text-white">{s.label}</p>
                            <p className="text-[8px]" style={{ color: "rgba(255,255,255,0.45)" }}>{s.lens} · {s.preset} · {s.yaw}°</p>
                          </div>
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Download className="w-3 h-3 text-white" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                  {screenshots.length > 0 && (
                    <button onClick={() => screenshots.forEach(s => downloadShot(s))}
                      className="w-full mt-3 py-2.5 rounded-2xl text-[12px] font-bold text-white flex items-center justify-center gap-2"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <Download className="w-3.5 h-3.5" /> Download All ({screenshots.length})
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Overlay cinematography shot button */}
          <button onClick={takeScreenshot}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-110 z-10"
            style={{ background: "rgba(255,214,10,0.2)", border: "3px solid #ffd60a", boxShadow: "0 0 36px rgba(255,214,10,0.25)" }}>
            <Camera className="w-6 h-6" style={{ color: "#ffd60a" }} />
          </button>
        </div>
      )}
    </div>
  );
}