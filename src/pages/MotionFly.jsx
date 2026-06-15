import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft, Share2, Undo2, Redo2, SkipBack, Play, Pause,
  SkipForward, Plus, Download, Sparkles, Film, Smartphone,
  Eye, Layers, Grid3X3, Monitor, Tablet, Square, ChevronDown, Clock
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import MotionPreview from "@/components/motionfly/MotionPreview";
import TimelineTrack from "@/components/motionfly/TimelineTrack";
import LayerPanel from "@/components/motionfly/LayerPanel";

let _layerId = 1;
const newLayerId = () => `layer_${Date.now()}_${_layerId++}`;

const makeLayer = (type) => ({
  id: newLayerId(),
  type,
  name: type === "text" ? "Text" : type === "image" ? "Image" : type === "shape" ? "Shape" : "Logo",
  text: type === "text" ? "Hello World" : "",
  imageUrl: "",
  x: 50, y: 50,
  scale: 100, opacity: 100, rotation: 0,
  fontSize: 36, color: "#ffffff", fontWeight: "bold",
  fontFamily: "system-ui, -apple-system, sans-serif",
  visible: true,
  keyframes: [],
  shape: "rect",
});

const DEVICE_OPTIONS = [
  { id: "none", icon: Square, label: "Free" },
  { id: "phone", icon: Smartphone, label: "Phone" },
  { id: "laptop", icon: Monitor, label: "Laptop" },
  { id: "tablet", icon: Tablet, label: "Tablet" },
];

const FPS = 60;
const DEFAULT_DURATION = 5; // seconds

const PRESET_SCENES = [
  { label: "Cinematic Title", prompt: "cinematic movie title with dramatic lighting and bold text" },
  { label: "Product Launch", prompt: "sleek product launch with glowing highlights and clean typography" },
  { label: "Social Story", prompt: "vertical social media story with vibrant colors and animated text" },
  { label: "Logo Reveal", prompt: "minimal logo reveal with particle effects and smooth transitions" },
  { label: "Music Visualizer", prompt: "audio-reactive music visualizer with neon waveforms and pulsing shapes" },
  { label: "Quote Card", prompt: "inspirational quote on a cinematic background with elegant typography" },
];

export default function MotionFly() {
  const [projectName, setProjectName] = useState("Apple style Animation");
  const [layers, setLayers] = useState([
    { ...makeLayer("shape"), name: "Background", color: "#1a1a2e", y: 50, x: 50, scale: 300, shape: "rect" },
    { ...makeLayer("text"), name: "Round", text: "Round", fontSize: 48, color: "#ffcc00",
      x: 50, y: 50,
      keyframes: [
        { time: 0, x: 50, y: 60, scale: 100, opacity: 0, rotation: 0, easing: "ease-out-back" },
        { time: 800, x: 50, y: 35, scale: 100, opacity: 100, rotation: 0 },
        { time: 4000, x: 50, y: 35, scale: 110, opacity: 100, rotation: 0 },
      ]
    },
    { ...makeLayer("text"), name: "Motion", text: "Motion", fontSize: 56, color: "#ff9500", fontWeight: "900",
      x: 50, y: 50,
      keyframes: [
        { time: 300, x: 50, y: 65, scale: 60, opacity: 0, rotation: -15, easing: "ease-out-back" },
        { time: 1200, x: 50, y: 50, scale: 100, opacity: 100, rotation: 0 },
        { time: 4200, x: 50, y: 48, scale: 120, opacity: 100, rotation: 0 },
      ]
    },
    { ...makeLayer("text"), name: "Graphics", text: "Graphics", fontSize: 52, color: "#ffffff",
      x: 50, y: 50,
      keyframes: [
        { time: 600, x: 50, y: 70, scale: 50, opacity: 0, rotation: 10, easing: "ease-out-back" },
        { time: 1600, x: 50, y: 65, scale: 100, opacity: 100, rotation: 0 },
        { time: 4400, x: 50, y: 62, scale: 130, opacity: 100, rotation: 0 },
      ]
    },
  ]);
  const [selectedLayerIdx, setSelectedLayerIdx] = useState(2);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [durationSec, setDurationSec] = useState(DEFAULT_DURATION);
  const [bgColor, setBgColor] = useState("#141419");
  const [bgImage, setBgImage] = useState("");
  const [device, setDevice] = useState("none");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [mobileTab, setMobileTab] = useState("preview");
  const [deviceMenuOpen, setDeviceMenuOpen] = useState(false);
  const animRef = useRef(null);
  const lastTimeRef = useRef(0);
  const frameAccRef = useRef(0);
  const frameLabelRef = useRef(currentFrame);
  frameLabelRef.current = currentFrame;

  const totalFrames = durationSec * FPS;
  const playheadPercent = durationSec > 0 ? (currentFrame / totalFrames) * 100 : 0;
  const timeMs = (currentFrame / FPS) * 1000;
  const secs = Math.floor(timeMs / 1000);
  const mins = Math.floor(secs / 60);
  const timecode = `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;

  useEffect(() => {
    setHistory([{ layers: JSON.parse(JSON.stringify(layers)), bgColor, bgImage, device, projectName }]);
    setHistoryIdx(0);
  }, []);

  useEffect(() => {
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  const undo = () => {
    if (historyIdx <= 0) return;
    const idx = historyIdx - 1;
    const state = history[idx];
    setHistoryIdx(idx);
    setLayers(state.layers);
    setBgColor(state.bgColor);
    setBgImage(state.bgImage);
    setDevice(state.device);
    setProjectName(state.projectName);
  };

  const redo = () => {
    if (historyIdx >= history.length - 1) return;
    const idx = historyIdx + 1;
    const state = history[idx];
    setHistoryIdx(idx);
    setLayers(state.layers);
    setBgColor(state.bgColor);
    setBgImage(state.bgImage);
    setDevice(state.device);
    setProjectName(state.projectName);
  };

  const updateLayer = (idx, changes) => {
    setLayers(prev => prev.map((l, i) => i === idx ? { ...l, ...changes } : l));
  };

  const addLayer = (type) => {
    const layer = makeLayer(type);
    setLayers(prev => [...prev, layer]);
    setSelectedLayerIdx(layers.length);
  };

  const deleteLayer = (idx) => {
    if (layers.length <= 1) return;
    setLayers(prev => prev.filter((_, i) => i !== idx));
    setSelectedLayerIdx(Math.min(idx, layers.length - 2));
  };

  const duplicateLayer = (idx) => {
    setLayers(prev => {
      const dup = { ...prev[idx], id: newLayerId(), name: (prev[idx].name || "") + " copy" };
      const updated = [...prev];
      updated.splice(idx + 1, 0, dup);
      return updated;
    });
    setSelectedLayerIdx(idx + 1);
  };

  const moveLayer = (idx, dir) => {
    setLayers(prev => {
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const updated = [...prev];
      [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
      return updated;
    });
    setSelectedLayerIdx(prev => prev + dir);
  };

  // ─── 60fps playback via requestAnimationFrame ───────────────────────────
  const play = useCallback(() => {
    if (isPlaying) {
      cancelAnimationFrame(animRef.current);
      setIsPlaying(false);
      setCurrentFrame(0);
      frameAccRef.current = 0;
      return;
    }
    setIsPlaying(true);
    setCurrentFrame(0);
    frameAccRef.current = 0;
    lastTimeRef.current = performance.now();
    const maxFrames = durationSec * FPS;

    const tick = (now) => {
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;
      frameAccRef.current += delta;
      const frameInterval = 1000 / FPS;
      const framesElapsed = Math.floor(frameAccRef.current / frameInterval);
      frameAccRef.current -= framesElapsed * frameInterval;

      if (framesElapsed > 0) {
        setCurrentFrame(prev => {
          const next = prev + framesElapsed;
          if (next >= maxFrames) {
            setIsPlaying(false);
            frameAccRef.current = 0;
            return 0;
          }
          return next;
        });
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
  }, [isPlaying, durationSec]);

  const seekToFrame = (f) => {
    setCurrentFrame(Math.max(0, Math.min(f, totalFrames)));
  };

  // Keyframe management
  const addKeyframe = () => {
    if (selectedLayerIdx == null) return;
    const layer = layers[selectedLayerIdx];
    const currentTimeMs = (currentFrame / FPS) * 1000;
    const kfs = [...(layer.keyframes || []), {
      time: Math.round(currentTimeMs),
      x: layer.x, y: layer.y,
      scale: layer.scale, opacity: layer.opacity,
      rotation: layer.rotation,
    }];
    updateLayer(selectedLayerIdx, { keyframes: kfs });
  };

  const removeKeyframe = () => {
    if (selectedLayerIdx == null) return;
    const layer = layers[selectedLayerIdx];
    const currentTimeMs = (currentFrame / FPS) * 1000;
    const kfs = (layer.keyframes || []).filter(kf => {
      return Math.abs(kf.time - currentTimeMs) > 50; // 50ms tolerance
    });
    updateLayer(selectedLayerIdx, { keyframes: kfs });
  };

  const handleAI = async (promptOverride) => {
    const p = promptOverride || aiPrompt;
    if (!p.trim()) return;
    setIsGenerating(true);
    try {
      const prompt = `Create a set of motion graphics layers for: "${p}"

Return ONLY this exact JSON format (no extra text):
{
  "bgColor": "#hexcolor", 
  "layers": [{layer}, {layer}, ...]
}

Each layer: type (text/image/shape/logo), name, text, x (0-100), y (0-100), scale (50-200), opacity (0-100), rotation (-180 to 180), fontSize (12-80 for text), color (hex), fontWeight.
bgColor should match the mood/theme of the scene. Make 3-8 layers, cinematic Apple-style.`;

      const raw = await base44.integrations.Core.InvokeLLM({ prompt, model: "claude_sonnet_4_6" });
      const str = typeof raw === "string" ? raw : JSON.stringify(raw);
      // Try to parse as object with bgColor+layers, or fall back to array
      let result;
      try {
        result = JSON.parse(str);
      } catch {
        const match = str.match(/\{[\s\S]*\}/);
        result = match ? JSON.parse(match[0]) : JSON.parse(str);
      }

      const generatedLayers = Array.isArray(result) ? result : result?.layers;
      const generatedBg = (result && !Array.isArray(result) && result.bgColor) ? result.bgColor : null;

      if (Array.isArray(generatedLayers) && generatedLayers.length > 0) {
        const newLayers = generatedLayers.map(l => ({
          ...makeLayer(l.type || "text"),
          ...l,
          id: newLayerId(),
          visible: true,
        }));
        setLayers(newLayers);
        if (generatedBg) setBgColor(generatedBg);
        setSelectedLayerIdx(newLayers.length > 1 ? 1 : 0);
        setAiPrompt("");
        const name = p.slice(0, 40) || "New Project";
        setProjectName(name);
        setHistory(prev => [...prev.slice(0, historyIdx + 1), {
          layers: JSON.parse(JSON.stringify(newLayers)), bgColor: generatedBg || bgColor, bgImage, device, projectName: name
        }]);
        setHistoryIdx(prev => prev + 1);
      }
    } catch (e) {
      console.error("AI generation failed:", e);
    }
    setIsGenerating(false);
  };

  const currentDevice = DEVICE_OPTIONS.find(d => d.id === device);
  const DeviceIcon = currentDevice?.icon || Square;

  return (
    <div className="h-[100dvh] flex flex-col text-white overflow-hidden" style={{ background: "#141419", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* TOP HEADER */}
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 flex-shrink-0"
        style={{ background: "#1c1c22", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link to={createPageUrl("AppStoreV2")}
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:bg-white/5 shrink-0">
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </Link>

        <div className="hidden sm:flex items-center gap-2 shrink-0 mr-2">
          <img
            src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/4b941540b_generated_image.png"
            alt="MotionFly"
            className="w-7 h-7 rounded-lg object-cover"
          />
          <span className="text-[13px] font-[800] tracking-tight text-white/90">MotionFly</span>
        </div>

        <div className="w-px h-5 hidden sm:block" style={{ background: "rgba(255,255,255,0.1)" }} />

        <input
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="bg-transparent text-[12px] sm:text-[13px] font-[600] text-white outline-none flex-1 min-w-0"
          placeholder="Untitled Project"
        />

        {/* Duration chip */}
        <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold text-white/40"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <Clock className="w-3 h-3" />
          {durationSec}s
        </div>

        {/* Device frame selector */}
        <div className="relative shrink-0">
          <button
            onClick={() => setDeviceMenuOpen(!deviceMenuOpen)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-white/50 hover:text-white hover:bg-white/5 transition-all">
            <DeviceIcon className="w-3.5 h-3.5" />
            <ChevronDown className="w-2.5 h-2.5" />
          </button>
          <AnimatePresence>
            {deviceMenuOpen && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                className="absolute right-0 top-full mt-1 p-1.5 rounded-xl z-40 shadow-xl"
                style={{ background: "#1c1c22", border: "1px solid rgba(255,255,255,0.08)", minWidth: 100 }}
                onClick={() => setDeviceMenuOpen(false)}>
                {DEVICE_OPTIONS.map(opt => {
                  const OptIcon = opt.icon;
                  return (
                    <button key={opt.id}
                      onClick={() => { setDevice(opt.id); setDeviceMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all text-left"
                      style={{
                        color: device === opt.id ? "#fff" : "rgba(255,255,255,0.5)",
                        background: device === opt.id ? "rgba(52,199,89,0.1)" : "transparent",
                      }}>
                      <OptIcon className="w-3.5 h-3.5" />
                      {opt.label}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button onClick={() => setShowExportModal(true)}
          className="flex items-center gap-1 px-3 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-[700] text-white transition-all shrink-0"
          style={{ background: "#34c759" }}>
          <Share2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>

      {/* PRESET SCENES BAR */}
      <div className="hidden lg:flex items-center gap-1.5 px-4 py-2 flex-shrink-0 overflow-x-auto"
        style={{ background: "#1a1a21", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <span className="text-[9px] uppercase tracking-widest text-white/20 mr-2 shrink-0">Presets</span>
        {PRESET_SCENES.map((scene, i) => (
          <button key={i} onClick={() => handleAI(scene.prompt)} disabled={isGenerating}
            className="shrink-0 px-3 py-1 rounded-full text-[10px] font-semibold text-white/40 hover:text-white hover:bg-white/5 transition-all border border-white/5 disabled:opacity-30">
            {scene.label}
          </button>
        ))}
      </div>

      {/* MOBILE TAB SWITCHER */}
      <div className="lg:hidden flex items-center flex-shrink-0" style={{ background: "#1a1a21", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {[
          { id: "preview", icon: Eye, label: "Preview" },
          { id: "layers", icon: Layers, label: "Layers" },
          { id: "timeline", icon: Grid3X3, label: "Timeline" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setMobileTab(tab.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold transition-all"
            style={{
              color: mobileTab === tab.id ? "#fff" : "rgba(255,255,255,0.35)",
              borderBottom: mobileTab === tab.id ? "2px solid #34c759" : "2px solid transparent",
            }}>
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex min-h-0">
        {/* LEFT: Preview Canvas */}
        <div className={`flex-1 flex flex-col min-w-0 ${mobileTab !== "preview" ? "hidden lg:flex" : "flex"}`}
          style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          {/* Play controls bar */}
          <div className="flex items-center gap-1 px-2 sm:px-3 py-1.5 flex-shrink-0" style={{ background: "#1a1a21", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <button onClick={undo} disabled={historyIdx <= 0}
              className="w-7 h-7 flex items-center justify-center rounded text-white/50 disabled:opacity-20 hover:text-white hover:bg-white/5" title="Undo">
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={redo} disabled={historyIdx >= history.length - 1}
              className="w-7 h-7 flex items-center justify-center rounded text-white/50 disabled:opacity-20 hover:text-white hover:bg-white/5" title="Redo">
              <Redo2 className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 mx-0.5" style={{ background: "rgba(255,255,255,0.1)" }} />
            <button onClick={() => seekToFrame(0)}
              className="w-7 h-7 flex items-center justify-center rounded text-white/50 hover:text-white hover:bg-white/5">
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button onClick={play}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-white transition-all"
              style={{ background: isPlaying ? "#34c759" : "rgba(255,255,255,0.1)" }}>
              {isPlaying ? <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5" />}
            </button>
            <button onClick={() => seekToFrame(totalFrames)}
              className="w-7 h-7 flex items-center justify-center rounded text-white/50 hover:text-white hover:bg-white/5">
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            {/* Keyframe buttons */}
            <div className="w-px h-4 mx-1" style={{ background: "rgba(255,255,255,0.1)" }} />
            <button onClick={addKeyframe} disabled={selectedLayerIdx == null}
              className="w-7 h-7 flex items-center justify-center rounded text-white/50 disabled:opacity-20 hover:text-white hover:bg-white/5"
              title="Add keyframe at playhead">
              <span className="text-[9px] font-bold">◆</span>
            </button>
            <button onClick={removeKeyframe} disabled={selectedLayerIdx == null}
              className="w-7 h-7 flex items-center justify-center rounded text-white/50 disabled:opacity-20 hover:text-red-400 hover:bg-white/5"
              title="Remove keyframe at playhead">
              <span className="text-[14px] font-bold leading-none">−</span>
            </button>

            <div className="flex-1" />
            <span className="text-[10px] sm:text-[11px] font-mono font-semibold text-white/40">{timecode}</span>
          </div>

          <MotionPreview
            layers={layers}
            device={device}
            bgColor={bgColor}
            bgImage={bgImage}
            selectedLayerIdx={selectedLayerIdx}
            onSelectLayer={setSelectedLayerIdx}
            onUpdateLayer={updateLayer}
            currentFrame={currentFrame}
            fps={FPS}
            isPlaying={isPlaying}
          />
        </div>

        {/* RIGHT: Timeline & Layers */}
        <div className={`lg:flex flex-col ${mobileTab === "preview" ? "hidden lg:flex" : "flex"}`}
          style={{ width: "100%" }}>
          <div className="flex flex-col h-full lg:w-[380px] lg:min-w-[340px]" style={{ background: "#1a1a21" }}>
            <div className={`${mobileTab === "layers" ? "hidden lg:block" : "block"} flex-1 overflow-hidden flex flex-col min-h-0`} style={{ background: "#18181e" }}>
              <div className="relative h-5 flex-shrink-0" style={{ marginLeft: 44, background: "rgba(255,255,255,0.02)" }}>
                {Array.from({ length: durationSec + 1 }).map((_, i) => (
                  <span key={i} className="absolute text-[8px] font-mono text-white/15 top-0.5"
                    style={{ left: `${(i / durationSec) * 100}%` }}>
                    {i}s
                  </span>
                ))}
                <div className="absolute top-0 bottom-0 w-px z-20" style={{ left: `${playheadPercent}%`, background: "#fff" }} />
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                {layers.map((layer, i) => (
                  <TimelineTrack
                    key={layer.id}
                    layer={layer}
                    index={i}
                    totalLayers={layers.length}
                    playheadPercent={playheadPercent}
                    fps={FPS}
                    durationMs={durationSec * 1000}
                    onToggleVisibility={(idx) => updateLayer(idx, { visible: !(layers[idx].visible !== false) })}
                    onToggleLock={() => {}}
                    onSelectLayer={(idx) => { setSelectedLayerIdx(idx); setMobileTab("layers"); }}
                    isSelected={i === selectedLayerIdx}
                  />
                ))}
              </div>
            </div>

            <div className={`${mobileTab === "timeline" ? "hidden lg:block" : "block"} flex-shrink-0 min-h-0 overflow-hidden`}
              style={{ height: mobileTab === "layers" ? undefined : 260, borderTop: "1px solid rgba(255,255,255,0.06)", flex: mobileTab === "layers" ? 1 : undefined }}>
              <LayerPanel
                layers={layers}
                selectedLayerIdx={selectedLayerIdx}
                onSelectLayer={setSelectedLayerIdx}
                onUpdateLayer={updateLayer}
                onDeleteLayer={deleteLayer}
                onDuplicateLayer={duplicateLayer}
                onAddLayer={addLayer}
                onMoveLayer={moveLayer}
              />
            </div>
          </div>
        </div>
      </div>

      {/* FLOATING ADD BUTTON (mobile) */}
      <div className="pointer-events-none fixed z-30 lg:hidden" style={{ bottom: 80, right: 16 }}>
        <button
          onClick={() => { addLayer("text"); setMobileTab("layers"); }}
          className="pointer-events-auto w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
          style={{ background: "#34c759" }}>
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* AI BAR */}
      <div className="flex items-center gap-2 px-3 sm:px-4 py-2 flex-shrink-0"
        style={{ background: "#1c1c22", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: "#bf5af2" }} />
        <input
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAI()}
          placeholder="Describe your motion scene, or pick a preset above…"
          className="flex-1 px-3 py-1.5 rounded-lg text-[11px] sm:text-[12px] text-white bg-white/5 border border-white/10 outline-none min-w-0" />
        <button onClick={() => handleAI()} disabled={isGenerating || !aiPrompt.trim()}
          className="px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold text-white disabled:opacity-40 flex items-center gap-1.5 transition-all shrink-0"
          style={{ background: "linear-gradient(135deg, #bf5af2, #0a84ff)" }}>
          {isGenerating ? (
            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
          ) : (
            <Sparkles className="w-3 h-3" />
          )}
          <span className="hidden sm:inline">Generate</span>
        </button>
      </div>

      {/* EXPORT MODAL */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)" }}
            onClick={() => setShowExportModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="max-w-sm w-full p-6 rounded-3xl" style={{ background: "#1c1c22", border: "1px solid rgba(255,255,255,0.1)" }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <img src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/4b941540b_generated_image.png"
                  alt="" className="w-10 h-10 rounded-xl object-cover" />
                <div>
                  <h3 className="text-[16px] font-[800] text-white">Export Motion Graphics</h3>
                  <p className="text-[10px] text-white/30">MotionFly Studio</p>
                </div>
              </div>
              <div className="space-y-3">
                <button className="w-full py-3 rounded-2xl text-[13px] font-bold text-white flex items-center justify-center gap-2"
                  style={{ background: "#34c759" }}>
                  <Download className="w-4 h-4" /> Export Current Frame (PNG)
                </button>
                <button className="w-full py-3 rounded-2xl text-[13px] font-bold text-white flex items-center justify-center gap-2"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <Film className="w-4 h-4" /> Export MP4 (Coming Soon)
                </button>
              </div>
              <button onClick={() => setShowExportModal(false)}
                className="w-full mt-4 py-2.5 rounded-2xl text-[13px] font-semibold text-white/40"
                style={{ background: "rgba(255,255,255,0.04)" }}>
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}