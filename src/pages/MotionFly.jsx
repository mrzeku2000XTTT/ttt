import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Plus, Trash2, Play, Pause, SkipForward, SkipBack, Download,
  Type, Image as ImageIcon, Layers, Camera, ChevronUp, ChevronDown,
  Copy, Sparkles, ArrowLeft, Monitor, Smartphone, Laptop, Tablet,
  Film, Music, Mic, Zap, Clock, Move, Maximize2, Grid3X3
} from "lucide-react";
import { base44 } from "@/api/base44Client";

// ─── Animation presets ────────────────────────────────────────────────────────
const ANIM_PRESETS = [
  { id: "fadeIn", label: "Fade In", icon: "🌅", style: { opacity: [0, 1], transition: "opacity 0.6s ease-out" } },
  { id: "slideUp", label: "Slide Up", icon: "⬆", style: { y: [40, 0], opacity: [0, 1], transition: "all 0.5s ease-out" } },
  { id: "slideLeft", label: "Slide Left", icon: "⬅", style: { x: [60, 0], opacity: [0, 1], transition: "all 0.5s ease-out" } },
  { id: "slideRight", label: "Slide Right", icon: "➡", style: { x: [-60, 0], opacity: [0, 1], transition: "all 0.5s ease-out" } },
  { id: "scale", label: "Scale Up", icon: "🔍", style: { scale: [0.7, 1], opacity: [0, 1], transition: "all 0.5s ease-out" } },
  { id: "bounce", label: "Bounce", icon: "🏀", style: { y: [30, 0], opacity: [0, 1], transition: "all 0.6s cubic-bezier(0.68,-0.55,0.27,1.55)" } },
  { id: "rotate", label: "Rotate In", icon: "🔄", style: { rotate: [15, 0], opacity: [0, 1], transition: "all 0.5s ease-out" } },
  { id: "blur", label: "Blur In", icon: "💨", style: { filter: "blur(12px)", opacity: [0, 1], transition: "all 0.5s ease-out" } },
];

const DEVICE_FRAMES = [
  { id: "none", label: "None", icon: Grid3X3, w: 1200, h: 675, ratio: "16:9" },
  { id: "phone", label: "Phone", icon: Smartphone, w: 390, h: 844, ratio: "9:19.5" },
  { id: "laptop", label: "Laptop", icon: Laptop, w: 1200, h: 750, ratio: "16:10" },
  { id: "tablet", label: "Tablet", icon: Tablet, w: 1024, h: 1366, ratio: "3:4" },
  { id: "monitor", label: "Monitor", icon: Monitor, w: 1920, h: 1080, ratio: "16:9" },
];

const SCENE_DURATIONS = [2, 3, 4, 5, 6, 8, 10];

// ─── Default layer ────────────────────────────────────────────────────────────
const makeLayer = (type = "text") => ({
  id: Date.now() + Math.random(),
  type, // text | image | shape | logo
  text: type === "text" ? "Motion graphics scene" : "",
  imageUrl: "",
  animPreset: "fadeIn",
  x: 50, y: 50, // % position
  fontSize: type === "text" ? 48 : 24,
  color: "#ffffff",
  bgColor: "transparent",
  fontWeight: "bold",
  opacity: 100,
  scale: 100,
  rotation: 0,
});

const makeScene = (name) => ({
  id: Date.now(),
  name: name || `Scene ${Date.now()}`,
  duration: 3,
  bgColor: "#0a0a0f",
  bgImage: "",
  device: "none",
  layers: [makeLayer("text")],
});

// ─── Scene thumbnail canvas ───────────────────────────────────────────────────
function SceneThumbnail({ scene, device, isActive, onSelect, onDelete, onDuplicate }) {
  const deviceMeta = DEVICE_FRAMES.find(d => d.id === (device || scene.device)) || DEVICE_FRAMES[0];
  return (
    <motion.div
      layout
      className={`flex-shrink-0 rounded-xl overflow-hidden cursor-pointer transition-all group relative ${
        isActive ? "ring-2 ring-blue-500 scale-105" : "ring-1 ring-white/10 hover:ring-white/20"
      }`}
      style={{ width: 120, height: 68, background: scene.bgColor }}
      onClick={onSelect}
    >
      {/* Mini layer preview */}
      {scene.layers.slice(0, 3).map((l, i) => (
        <div key={l.id} className="absolute inset-0 flex items-center justify-center">
          {l.type === "text" && (
            <span style={{
              fontSize: Math.min(10, 48 * (68 / (deviceMeta.h || 675))),
              color: l.color,
              fontWeight: l.fontWeight,
              opacity: l.opacity / 100,
              transform: `translate(${(l.x - 50) * 0.2}px, ${(l.y - 50) * 0.2}px)`,
            }}>{l.text || "..."}</span>
          )}
          {l.type === "image" && l.imageUrl && (
            <img src={l.imageUrl} alt="" className="w-3/4 h-3/4 object-contain opacity-70" />
          )}
        </div>
      ))}
      <div className="absolute bottom-0 left-0 right-0 px-1.5 py-0.5 text-[8px] font-bold bg-black/60 text-white truncate">
        {scene.name}
      </div>
      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5 p-0.5">
        <button onClick={e => { e.stopPropagation(); onDuplicate(); }}
          className="w-4 h-4 rounded-full flex items-center justify-center bg-black/60 text-white/70 hover:text-white">
          <Copy className="w-2.5 h-2.5" />
        </button>
        <button onClick={e => { e.stopPropagation(); onDelete(); }}
          className="w-4 h-4 rounded-full flex items-center justify-center bg-black/60 text-red-400/70 hover:text-red-400">
          <Trash2 className="w-2.5 h-2.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main preview canvas ──────────────────────────────────────────────────────
function ScenePreview({ scene, device, isPlaying }) {
  const deviceMeta = DEVICE_FRAMES.find(d => d.id === (device || scene.device)) || DEVICE_FRAMES[0];
  const canvasW = 1200;
  const scaleRatio = Math.min(1, 800 / canvasW);

  return (
    <div className="relative flex items-center justify-center flex-1 min-h-0 p-4">
      <div className="relative rounded-2xl overflow-hidden shadow-2xl"
        style={{
          width: canvasW * scaleRatio,
          height: (canvasW / (deviceMeta.w / deviceMeta.h)) * scaleRatio,
          background: scene.bgImage ? `url(${scene.bgImage}) center/cover` : scene.bgColor,
          border: scene.device !== "none" ? "12px solid #1c1c1e" : "none",
          borderRadius: scene.device === "phone" ? 28 : scene.device === "none" ? 12 : 16,
        }}>
        {/* Notch for phone */}
        {scene.device === "phone" && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-b-xl z-10" />
        )}

        {/* Layers */}
        {scene.layers.map((layer) => (
          <motion.div
            key={layer.id}
            className="absolute flex items-center justify-center select-none"
            style={{
              left: `${layer.x}%`,
              top: `${layer.y}%`,
              transform: `translate(-50%, -50%) rotate(${layer.rotation}deg) scale(${layer.scale / 100})`,
              opacity: layer.opacity / 100,
            }}
            animate={isPlaying ? { opacity: [0, layer.opacity / 100] } : {}}
            transition={isPlaying ? { duration: 0.5 } : {}}
          >
            {layer.type === "text" && (
              <span style={{
                fontSize: layer.fontSize * scaleRatio,
                color: layer.color,
                fontWeight: layer.fontWeight,
                textAlign: "center",
                textShadow: "0 2px 12px rgba(0,0,0,0.5)",
                background: layer.bgColor !== "transparent" ? layer.bgColor : undefined,
                padding: layer.bgColor !== "transparent" ? "8px 16px" : undefined,
                borderRadius: layer.bgColor !== "transparent" ? 8 : undefined,
              }}>
                {layer.text || "Your text here"}
              </span>
            )}
            {layer.type === "image" && layer.imageUrl && (
              <img src={layer.imageUrl} alt="" className="max-w-full max-h-full object-contain rounded-lg" />
            )}
            {layer.type === "logo" && layer.imageUrl && (
              <img src={layer.imageUrl} alt="" className="max-w-[120px] max-h-[120px] object-contain" />
            )}
          </motion.div>
        ))}

        {/* Device frame overlay */}
        {scene.device !== "none" && (
          <div className="absolute inset-0 pointer-events-none"
            style={{ boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.06)` }} />
        )}
      </div>

      {/* Duration indicator */}
      <div className="absolute bottom-4 left-4 text-[10px] font-bold px-2 py-1 rounded-full bg-black/70 text-white/60">
        {scene.duration}s
      </div>
    </div>
  );
}

// ─── Layer editor ─────────────────────────────────────────────────────────────
function LayerEditor({ layer, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  return (
    <div className="p-3 rounded-xl space-y-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "rgba(10,132,255,0.15)", color: "#0a84ff" }}>
          {layer.type}
        </span>
        <div className="flex-1" />
        <button onClick={onMoveUp} disabled={isFirst} className="p-1 rounded disabled:opacity-30 text-white/50 hover:text-white"><ChevronUp className="w-3 h-3" /></button>
        <button onClick={onMoveDown} disabled={isLast} className="p-1 rounded disabled:opacity-30 text-white/50 hover:text-white"><ChevronDown className="w-3 h-3" /></button>
        <button onClick={onDelete} className="p-1 rounded text-red-400/60 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
      </div>

      {layer.type === "text" && (
        <input value={layer.text} onChange={e => onChange({ ...layer, text: e.target.value })}
          placeholder="Enter text…" className="w-full rounded-lg p-2 text-[13px] text-white bg-white/5 border border-white/10 outline-none" />
      )}

      {layer.type === "image" && (
        <input value={layer.imageUrl} onChange={e => onChange({ ...layer, imageUrl: e.target.value })}
          placeholder="Paste image URL…" className="w-full rounded-lg p-2 text-[13px] text-white bg-white/5 border border-white/10 outline-none" />
      )}

      {layer.type === "logo" && (
        <input value={layer.imageUrl} onChange={e => onChange({ ...layer, imageUrl: e.target.value })}
          placeholder="Paste logo URL…" className="w-full rounded-lg p-2 text-[13px] text-white bg-white/5 border border-white/10 outline-none" />
      )}

      {/* Animation preset */}
      <div>
        <p className="text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>Animation</p>
        <div className="flex flex-wrap gap-1">
          {ANIM_PRESETS.map(ap => (
            <button key={ap.id} onClick={() => onChange({ ...layer, animPreset: ap.id })}
              className="px-2 py-1 rounded-full text-[10px] font-semibold transition-all"
              style={{
                background: layer.animPreset === ap.id ? "rgba(191,90,242,0.2)" : "rgba(255,255,255,0.05)",
                color: layer.animPreset === ap.id ? "#bf5af2" : "rgba(255,255,255,0.5)",
                border: `1px solid ${layer.animPreset === ap.id ? "rgba(191,90,242,0.4)" : "rgba(255,255,255,0.07)"}`,
              }}>
              {ap.icon} {ap.label}
            </button>
          ))}
        </div>
      </div>

      {/* Style controls */}
      <div className="grid grid-cols-4 gap-2">
        {layer.type === "text" && (
          <>
            <div>
              <p className="text-[9px] uppercase mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>Size</p>
              <input type="range" min={12} max={120} value={layer.fontSize}
                onChange={e => onChange({ ...layer, fontSize: parseInt(e.target.value) })}
                className="w-full accent-blue-500 h-1" />
            </div>
            <div>
              <p className="text-[9px] uppercase mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>Color</p>
              <input type="color" value={layer.color} onChange={e => onChange({ ...layer, color: e.target.value })}
                className="w-full h-6 rounded cursor-pointer" />
            </div>
          </>
        )}
        <div>
          <p className="text-[9px] uppercase mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>Opacity</p>
          <input type="range" min={10} max={100} value={layer.opacity}
            onChange={e => onChange({ ...layer, opacity: parseInt(e.target.value) })}
            className="w-full accent-purple-500 h-1" />
        </div>
        <div>
          <p className="text-[9px] uppercase mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>Scale</p>
          <input type="range" min={20} max={200} value={layer.scale}
            onChange={e => onChange({ ...layer, scale: parseInt(e.target.value) })}
            className="w-full accent-green-500 h-1" />
        </div>
        <div>
          <p className="text-[9px] uppercase mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>Rotate</p>
          <input type="range" min={-180} max={180} value={layer.rotation}
            onChange={e => onChange({ ...layer, rotation: parseInt(e.target.value) })}
            className="w-full accent-orange-500 h-1" />
        </div>
      </div>

      {/* Position */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[9px] uppercase mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>X Position</p>
          <input type="range" min={0} max={100} value={layer.x}
            onChange={e => onChange({ ...layer, x: parseInt(e.target.value) })}
            className="w-full accent-white/50 h-1" />
        </div>
        <div>
          <p className="text-[9px] uppercase mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>Y Position</p>
          <input type="range" min={0} max={100} value={layer.y}
            onChange={e => onChange({ ...layer, y: parseInt(e.target.value) })}
            className="w-full accent-white/50 h-1" />
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function MotionFly() {
  const [scenes, setScenes] = useState([makeScene("Opening"), makeScene("Feature 1"), makeScene("Outro")]);
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [deviceView, setDeviceView] = useState("none");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const playTimer = useRef(null);

  const activeScene = scenes[activeSceneIdx];

  const updateScene = (idx, updater) => {
    setScenes(prev => prev.map((s, i) => i === idx ? (typeof updater === "function" ? updater(s) : updater) : s));
  };

  const updateLayer = (layerId, updater) => {
    updateScene(activeSceneIdx, s => ({
      ...s,
      layers: s.layers.map(l => l.id === layerId ? (typeof updater === "function" ? updater(l) : updater) : l),
    }));
  };

  const addLayer = (type) => {
    updateScene(activeSceneIdx, s => ({ ...s, layers: [...s.layers, makeLayer(type)] }));
  };

  const removeLayer = (layerId) => {
    updateScene(activeSceneIdx, s => ({ ...s, layers: s.layers.filter(l => l.id !== layerId) }));
  };

  const moveLayer = (layerId, dir) => {
    updateScene(activeSceneIdx, s => {
      const idx = s.layers.findIndex(l => l.id === layerId);
      if (idx === -1) return s;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= s.layers.length) return s;
      const layers = [...s.layers];
      [layers[idx], layers[newIdx]] = [layers[newIdx], layers[idx]];
      return { ...s, layers };
    });
  };

  const addScene = () => {
    const s = makeScene(`Scene ${scenes.length + 1}`);
    setScenes(prev => [...prev, s]);
    setActiveSceneIdx(scenes.length);
  };

  const deleteScene = (idx) => {
    if (scenes.length <= 1) return;
    setScenes(prev => prev.filter((_, i) => i !== idx));
    setActiveSceneIdx(Math.min(idx, scenes.length - 2));
  };

  const duplicateScene = (idx) => {
    const scene = scenes[idx];
    setScenes(prev => {
      const newScenes = [...prev];
      newScenes.splice(idx + 1, 0, { ...scene, id: Date.now(), name: scene.name + " copy" });
      return newScenes;
    });
    setActiveSceneIdx(idx + 1);
  };

  const playPreview = () => {
    if (isPlaying) { clearTimeout(playTimer.current); setIsPlaying(false); return; }
    setIsPlaying(true);
    let i = activeSceneIdx;
    playTimer.current = setInterval(() => {
      i++;
      if (i >= scenes.length) { clearTimeout(playTimer.current); setIsPlaying(false); return; }
      setActiveSceneIdx(i);
    }, scenes[activeSceneIdx]?.duration * 1000 || 2000);
  };

  const handleAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const prompt = `Generate a structured JSON array of motion graphics scenes for: "${aiPrompt}"
Each scene has: name, duration (2-6 seconds), bgColor (hex), layers array.
Each layer: type (text/image/logo), text (if text), animPreset (one of: fadeIn, slideUp, slideLeft, slideRight, scale, bounce), x (0-100%), y (0-100%), fontSize, color (hex), fontWeight.
Make them cinematic and suitable for a product launch video. ONLY return valid JSON array. Example:
[{"name":"Opening","duration":3,"bgColor":"#0a0a0f","layers":[{"type":"text","text":"Introducing...","animPreset":"fadeIn","x":50,"y":50,"fontSize":56,"color":"#ffffff","fontWeight":"bold","opacity":100,"scale":100,"rotation":0}]}]`;

      const raw = await base44.integrations.Core.InvokeLLM({ prompt, model: "claude_sonnet_4_6" });
      const str = typeof raw === "string" ? raw : JSON.stringify(raw);
      const jsonMatch = str.match(/\[[\s\S]*\]/);
      const generatedScenes = JSON.parse(jsonMatch ? jsonMatch[0] : str);

      if (Array.isArray(generatedScenes) && generatedScenes.length > 0) {
        setScenes(generatedScenes.map(s => ({
          id: Date.now() + Math.random(),
          name: s.name || "Scene",
          duration: s.duration || 3,
          bgColor: s.bgColor || "#0a0a0f",
          bgImage: s.bgImage || "",
          device: s.device || "none",
          layers: (s.layers || []).map(l => ({
            id: Date.now() + Math.random(),
            type: l.type || "text",
            text: l.text || "",
            imageUrl: l.imageUrl || "",
            animPreset: l.animPreset || "fadeIn",
            x: l.x || 50,
            y: l.y || 50,
            fontSize: l.fontSize || 48,
            color: l.color || "#ffffff",
            bgColor: l.bgColor || "transparent",
            fontWeight: l.fontWeight || "bold",
            opacity: l.opacity || 100,
            scale: l.scale || 100,
            rotation: l.rotation || 0,
          })),
        })));
        setActiveSceneIdx(0);
        setAiPrompt("");
      }
    } catch (e) {
      console.error("AI generation failed:", e);
    }
    setIsGenerating(false);
  };

  const exportAllFrames = () => {
    // Take screenshot of each scene using canvas
    const previewEl = document.querySelector("[data-preview-canvas]");
    if (!previewEl) return;
    alert("Export: Select scenes and download frames individually. Video export coming soon.");
  };

  return (
    <div className="h-screen flex flex-col text-white overflow-hidden" style={{ background: "#08080d" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 flex-shrink-0"
        style={{ background: "rgba(0,0,0,0.6)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link to={createPageUrl("AppStoreV2")}
          className="flex items-center justify-center w-7 h-7 rounded-full transition-all"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <ArrowLeft className="w-3.5 h-3.5 text-white/70" />
        </Link>
        <Film className="w-4 h-4" style={{ color: "#bf5af2" }} />
        <h1 className="text-[15px] font-[900] text-white">MotionFly</h1>
        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(191,90,242,0.15)", color: "#bf5af2" }}>Scene Builder</span>
        <div className="flex-1" />
        <button onClick={playPreview}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold text-white transition-all"
          style={{ background: isPlaying ? "rgba(255,69,58,0.2)" : "#0a84ff" }}>
          {isPlaying ? <><Pause className="w-3 h-3" /> Stop</> : <><Play className="w-3 h-3" /> Preview</>}
        </button>
        <button onClick={() => setShowExport(!showExport)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold text-white transition-all"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
          <Download className="w-3 h-3" /> Export
        </button>
      </div>

      {/* Main layout: timeline + canvas + props */}
      <div className="flex-1 flex min-h-0">
        {/* Left sidebar - Layers */}
        <div className="w-64 flex-shrink-0 flex flex-col overflow-hidden"
          style={{ background: "rgba(255,255,255,0.02)", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
          {/* Toolbar */}
          <div className="p-3 border-b border-white/5">
            <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Add Layer</p>
            <div className="flex gap-1.5">
              <button onClick={() => addLayer("text")}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold transition-all"
                style={{ background: "rgba(10,132,255,0.15)", color: "#0a84ff", border: "1px solid rgba(10,132,255,0.25)" }}>
                <Type className="w-3 h-3" /> Text
              </button>
              <button onClick={() => addLayer("image")}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold transition-all"
                style={{ background: "rgba(48,209,88,0.15)", color: "#30d158", border: "1px solid rgba(48,209,88,0.25)" }}>
                <ImageIcon className="w-3 h-3" /> Image
              </button>
              <button onClick={() => addLayer("logo")}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold transition-all"
                style={{ background: "rgba(255,214,10,0.15)", color: "#ffd60a", border: "1px solid rgba(255,214,10,0.25)" }}>
                <Zap className="w-3 h-3" /> Logo
              </button>
            </div>
          </div>

          {/* Layer list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {activeScene?.layers.map((layer, i) => (
              <LayerEditor key={layer.id} layer={layer}
                onChange={(l) => updateLayer(layer.id, l)}
                onDelete={() => removeLayer(layer.id)}
                onMoveUp={() => moveLayer(layer.id, -1)}
                onMoveDown={() => moveLayer(layer.id, 1)}
                isFirst={i === 0}
                isLast={i === activeScene.layers.length - 1}
              />
            ))}
            {activeScene?.layers.length === 0 && (
              <p className="text-center py-8 text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                No layers — add text, image, or logo
              </p>
            )}
          </div>
        </div>

        {/* Center - Preview canvas */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Scene settings bar */}
          <div className="flex items-center gap-3 px-4 py-2 flex-shrink-0 border-b border-white/5">
            <input value={activeScene?.name || ""} onChange={e => updateScene(activeSceneIdx, s => ({ ...s, name: e.target.value }))}
              className="bg-transparent text-[13px] font-bold text-white outline-none w-32" />
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" style={{ color: "rgba(255,255,255,0.3)" }} />
              {SCENE_DURATIONS.map(d => (
                <button key={d} onClick={() => updateScene(activeSceneIdx, s => ({ ...s, duration: d }))}
                  className="px-2 py-0.5 rounded text-[10px] font-bold transition-all"
                  style={{
                    background: activeScene?.duration === d ? "rgba(10,132,255,0.2)" : "rgba(255,255,255,0.05)",
                    color: activeScene?.duration === d ? "#0a84ff" : "rgba(255,255,255,0.5)",
                  }}>{d}s</button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[10px] uppercase" style={{ color: "rgba(255,255,255,0.25)" }}>Bg</span>
              <input type="color" value={activeScene?.bgColor || "#0a0a0f"}
                onChange={e => updateScene(activeSceneIdx, s => ({ ...s, bgColor: e.target.value }))}
                className="w-6 h-6 rounded cursor-pointer border-0" />
            </div>
            <div className="flex items-center gap-1">
              {DEVICE_FRAMES.map(d => {
                const Icon = d.icon;
                return (
                  <button key={d.id} onClick={() => setDeviceView(d.id)} title={d.label}
                    className="p-1.5 rounded transition-all"
                    style={{ background: deviceView === d.id ? "rgba(10,132,255,0.2)" : "transparent", color: deviceView === d.id ? "#0a84ff" : "rgba(255,255,255,0.3)" }}>
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview */}
          <div className="flex-1 min-h-0 flex items-center justify-center" data-preview-canvas>
            <ScenePreview scene={activeScene || makeScene("")} device={deviceView} isPlaying={isPlaying} />
          </div>
        </div>

        {/* Right sidebar - AI + global */}
        <div className="w-72 flex-shrink-0 flex flex-col overflow-hidden"
          style={{ background: "rgba(255,255,255,0.02)", borderLeft: "1px solid rgba(255,255,255,0.05)" }}>
          {/* AI Prompt */}
          <div className="p-3 border-b border-white/5">
            <p className="text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: "rgba(191,90,242,0.7)" }}>
              <Sparkles className="w-3 h-3" /> AI Generate Scenes
            </p>
            <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
              placeholder="Describe your motion graphics video… e.g. 'Product launch for a fitness app with 3D phone mockups'"
              rows={3} className="w-full rounded-lg p-2.5 text-[12px] text-white bg-white/5 border border-white/10 outline-none resize-none mb-2" />
            <button onClick={handleAI} disabled={isGenerating || !aiPrompt.trim()}
              className="w-full py-2 rounded-lg text-[12px] font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #bf5af2, #0a84ff)" }}>
              {isGenerating ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> Generating…</>
                : <><Sparkles className="w-3 h-3" /> Generate Scenes</>}
            </button>
          </div>

          {/* Scene settings */}
          <div className="p-3 border-b border-white/5">
            <p className="text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
              <Layers className="w-3 h-3" /> Active Scene
            </p>
            <input value={activeScene?.bgImage || ""} onChange={e => updateScene(activeSceneIdx, s => ({ ...s, bgImage: e.target.value }))}
              placeholder="Background image URL (optional)"
              className="w-full rounded-lg p-2 text-[11px] text-white bg-white/5 border border-white/10 outline-none" />
          </div>

          {/* Keyboard shortcuts */}
          <div className="p-3">
            <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Shortcuts</p>
            <div className="space-y-1.5 text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
              <p><kbd className="px-1 py-0.5 rounded bg-white/10 text-[9px]">Space</kbd> Play / Pause</p>
              <p><kbd className="px-1 py-0.5 rounded bg-white/10 text-[9px]">N</kbd> Next scene</p>
              <p><kbd className="px-1 py-0.5 rounded bg-white/10 text-[9px]">B</kbd> Previous scene</p>
              <p><kbd className="px-1 py-0.5 rounded bg-white/10 text-[9px]">T</kbd> Add text layer</p>
              <p><kbd className="px-1 py-0.5 rounded bg-white/10 text-[9px]">S</kbd> Screenshot frame</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom timeline */}
      <div className="flex-shrink-0 px-4 py-3 flex items-center gap-3"
        style={{ background: "rgba(0,0,0,0.8)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <button onClick={() => setActiveSceneIdx(Math.max(0, activeSceneIdx - 1))} disabled={activeSceneIdx === 0}
          className="p-1.5 rounded text-white/50 disabled:opacity-20 hover:text-white">
          <SkipBack className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide pb-1 items-center">
          {scenes.map((s, i) => (
            <SceneThumbnail key={s.id} scene={s} device={deviceView}
              isActive={i === activeSceneIdx}
              onSelect={() => { setActiveSceneIdx(i); if (isPlaying) { clearTimeout(playTimer.current); setIsPlaying(false); } }}
              onDelete={() => deleteScene(i)}
              onDuplicate={() => duplicateScene(i)}
            />
          ))}
          <button onClick={addScene}
            className="flex-shrink-0 w-[120px] h-[68px] rounded-xl flex items-center justify-center transition-all"
            style={{ border: "1px dashed rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.02)" }}>
            <Plus className="w-5 h-5" style={{ color: "rgba(255,255,255,0.3)" }} />
          </button>
        </div>
        <button onClick={() => setActiveSceneIdx(Math.min(scenes.length - 1, activeSceneIdx + 1))} disabled={activeSceneIdx >= scenes.length - 1}
          className="p-1.5 rounded text-white/50 disabled:opacity-20 hover:text-white">
          <SkipForward className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Export flyout */}
      <AnimatePresence>
        {showExport && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.8)" }}
            onClick={() => setShowExport(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="max-w-sm w-full mx-4 p-6 rounded-3xl" style={{ background: "#1c1c1e", border: "1px solid rgba(255,255,255,0.1)" }}
              onClick={e => e.stopPropagation()}>
              <h3 className="text-[18px] font-[800] text-white mb-1">Export Video</h3>
              <p className="text-[12px] mb-5" style={{ color: "rgba(255,255,255,0.4)" }}>Export your motion graphics scenes</p>
              <div className="space-y-3">
                <button className="w-full py-3 rounded-2xl text-[13px] font-bold text-white flex items-center justify-center gap-2"
                  style={{ background: "#0a84ff" }}>
                  <Download className="w-4 h-4" /> Download All Frames (PNG)
                </button>
                <button className="w-full py-3 rounded-2xl text-[13px] font-bold text-white flex items-center justify-center gap-2"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  <Film className="w-4 h-4" /> Export MP4 (Coming Soon)
                </button>
                <button className="w-full py-3 rounded-2xl text-[13px] font-bold flex items-center justify-center gap-2"
                  style={{ background: "rgba(191,90,242,0.12)", color: "#bf5af2", border: "1px solid rgba(191,90,242,0.25)" }}>
                  <Music className="w-4 h-4" /> Add Voiceover + Music (Coming Soon)
                </button>
              </div>
              <button onClick={() => setShowExport(false)}
                className="w-full mt-4 py-2.5 rounded-2xl text-[13px] font-semibold"
                style={{ color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.06)" }}>
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}