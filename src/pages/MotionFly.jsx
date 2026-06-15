import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft, Settings, Share2, Undo2, Redo2, SkipBack, Play, Pause,
  SkipForward, Copy, Maximize2, Plus, Download, Sparkles, Film,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import MotionPreview from "@/components/motionfly/MotionPreview";
import TimelineTrack from "@/components/motionfly/TimelineTrack";
import LayerPanel from "@/components/motionfly/LayerPanel";

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

const ANIMATION_PRESETS = [
  { name: "Fade In", layers: [{ opacity: 100 }] },
  { name: "Slide Up", layers: [{ y: 30 }, { y: 50 }] },
  { name: "Scale", layers: [{ scale: 30 }, { scale: 100 }] },
  { name: "Spin", layers: [{ rotation: 0 }, { rotation: 360 }] },
  { name: "Pop", layers: [{ scale: 0, opacity: 0 }, { scale: 120 }, { scale: 100, opacity: 100 }] },
];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MotionFly() {
  const [projectName, setProjectName] = useState("Apple style Animation");
  const [layers, setLayers] = useState([
    { ...makeLayer("shape"), name: "Background", color: "#1a1a2e", y: 50, x: 50, scale: 300, shape: "rect" },
    { ...makeLayer("text"), name: "Round", text: "Round", fontSize: 48, color: "#ffcc00", y: 35 },
    { ...makeLayer("text"), name: "Motion", text: "Motion", fontSize: 56, color: "#ff9500", y: 50, fontWeight: "900" },
    { ...makeLayer("text"), name: "Graphics", text: "Graphics", fontSize: 52, color: "#ffffff", y: 65 },
  ]);
  const [selectedLayerIdx, setSelectedLayerIdx] = useState(2);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadPercent, setPlayheadPercent] = useState(0);
  const [timecode, setTimecode] = useState("00:00:00");
  const [bgColor, setBgColor] = useState("#141419");
  const [bgImage, setBgImage] = useState("");
  const [device, setDevice] = useState("none");
  const [zoom, setZoom] = useState(1);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const playAnimRef = useRef(null);
  const frameRef = useRef(0);

  // Save initial state for undo
  useEffect(() => {
    setHistory([{ layers: JSON.parse(JSON.stringify(layers)), bgColor, bgImage, device, projectName }]);
    setHistoryIdx(0);
  }, []);

  const pushHistory = useCallback((newState) => {
    setHistory(prev => {
      const updated = prev.slice(0, historyIdx + 1);
      updated.push(JSON.parse(JSON.stringify(newState)));
      if (updated.length > 50) updated.shift();
      return updated;
    });
    setHistoryIdx(prev => Math.min(prev + 1, 49));
  }, [historyIdx]);

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
    setLayers(prev => {
      const updated = prev.map((l, i) => i === idx ? { ...l, ...changes } : l);
      return updated;
    });
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

  const play = () => {
    if (isPlaying) {
      clearInterval(playAnimRef.current);
      setIsPlaying(false);
      setPlayheadPercent(0);
      frameRef.current = 0;
      setTimecode("00:00:00");
      return;
    }
    setIsPlaying(true);
    frameRef.current = 0;
    setPlayheadPercent(0);
    const totalFrames = 90; // 3 seconds at 30fps
    playAnimRef.current = setInterval(() => {
      frameRef.current++;
      const pct = (frameRef.current / totalFrames) * 100;
      setPlayheadPercent(pct);
      const secs = Math.floor(frameRef.current / 30);
      const mins = Math.floor(secs / 60);
      const hrs = Math.floor(mins / 60);
      setTimecode(
        `${String(hrs).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`
      );
      if (frameRef.current >= totalFrames) {
        clearInterval(playAnimRef.current);
        setIsPlaying(false);
        setPlayheadPercent(100);
        frameRef.current = 0;
      }
    }, 33);
  };

  const handleAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const prompt = `Create a set of motion graphics layers for: "${aiPrompt}"

Return ONLY valid JSON array of layer objects. Each layer:
{
  "type": "text" | "image" | "shape" | "logo",
  "name": "Layer name",
  "text": "Display text (for text type)",
  "x": 0-100, "y": 0-100,
  "scale": 50-200, "opacity": 0-100, "rotation": -180 to 180,
  "fontSize": 12-80 (text only),
  "color": "hex color",
  "fontWeight": "normal" | "bold" | "900",
  "visible": true
}

Make 3-8 layers. Cinematic, modern, Apple-style motion graphics. Example:
[{"type":"shape","name":"Background","color":"#1a1a2e","x":50,"y":50,"scale":300,"shape":"rect"},{"type":"text","name":"Title","text":"Introducing","fontSize":48,"color":"#ffffff","x":50,"y":50,"fontWeight":"900"}]`;

      const raw = await base44.integrations.Core.InvokeLLM({ prompt, model: "claude_sonnet_4_6" });
      const str = typeof raw === "string" ? raw : JSON.stringify(raw);
      const match = str.match(/\[[\s\S]*\]/);
      const generated = JSON.parse(match ? match[0] : str);

      if (Array.isArray(generated) && generated.length > 0) {
        const newLayers = generated.map(l => ({
          ...makeLayer(l.type || "text"),
          ...l,
          id: newLayerId(),
          visible: true,
        }));
        setLayers(newLayers);
        setSelectedLayerIdx(newLayers.length > 1 ? 1 : 0);
        setAiPrompt("");
        setProjectName(aiPrompt.slice(0, 40) || "New Project");
      }
    } catch (e) {
      console.error("AI generation failed:", e);
    }
    setIsGenerating(false);
  };

  return (
    <div className="h-screen flex flex-col text-white overflow-hidden" style={{ background: "#141419", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* ─── TOP HEADER ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-2.5 flex-shrink-0"
        style={{ background: "#1c1c22", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link to={createPageUrl("AppStoreV2")}
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:bg-white/5">
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </Link>

        <input
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="bg-transparent text-[13px] font-[600] text-white outline-none flex-1 min-w-0"
        />

        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/5">
          <Settings className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-[700] text-white transition-all"
          style={{ background: "#34c759" }}
        >
          <Share2 className="w-3.5 h-3.5" />
          Export
        </button>
      </div>

      {/* ─── MAIN CONTENT ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0">
        {/* LEFT: Preview Canvas */}
        <div className="flex-1 flex flex-col min-w-0" style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          <MotionPreview
            layers={layers}
            canvasSize={{ w: 1200, h: 675 }}
            device={device}
            bgColor={bgColor}
            bgImage={bgImage}
          />
        </div>

        {/* RIGHT: Timeline & Layers */}
        <div className="flex flex-col" style={{ width: 380, minWidth: 340 }}>
          {/* Timeline toolbar */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-white/5" style={{ background: "#1a1a21" }}>
            <button onClick={undo} disabled={historyIdx <= 0}
              className="w-7 h-7 flex items-center justify-center rounded text-white/50 disabled:opacity-20 hover:text-white hover:bg-white/5">
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={redo} disabled={historyIdx >= history.length - 1}
              className="w-7 h-7 flex items-center justify-center rounded text-white/50 disabled:opacity-20 hover:text-white hover:bg-white/5">
              <Redo2 className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 mx-1" style={{ background: "rgba(255,255,255,0.1)" }} />
            <button className="w-7 h-7 flex items-center justify-center rounded text-white/50 hover:text-white hover:bg-white/5">
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button onClick={play}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white transition-all"
              style={{ background: isPlaying ? "#34c759" : "rgba(255,255,255,0.1)" }}>
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <button className="w-7 h-7 flex items-center justify-center rounded text-white/50 hover:text-white hover:bg-white/5">
              <SkipForward className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 mx-1" style={{ background: "rgba(255,255,255,0.1)" }} />
            <button className="w-7 h-7 flex items-center justify-center rounded text-white/50 hover:text-white hover:bg-white/5">
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button className="w-7 h-7 flex items-center justify-center rounded text-white/50 hover:text-white hover:bg-white/5">
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            <div className="flex-1" />

            {/* Timecode */}
            <span className="text-[11px] font-mono font-semibold text-white/70">{timecode}</span>
          </div>

          {/* Timeline tracks */}
          <div className="flex-1 overflow-hidden flex flex-col" style={{ background: "#18181e" }}>
            {/* Playhead ruler */}
            <div className="relative h-5 flex-shrink-0 mx-[44px]" style={{ background: "rgba(255,255,255,0.02)" }}>
              {/* Tick marks */}
              {[0, 1, 2, 3, 4, 5].map(i => (
                <span key={i} className="absolute text-[8px] font-mono text-white/15 top-0.5" style={{ left: `${i * 20}%` }}>
                  {i}s
                </span>
              ))}
              {/* Playhead line */}
              <div className="absolute top-0 bottom-0 w-px z-20" style={{ left: `${playheadPercent}%`, background: "#fff" }} />
            </div>

            {/* Layer tracks */}
            <div className="flex-1 overflow-y-auto">
              {layers.map((layer, i) => (
                <TimelineTrack
                  key={layer.id}
                  layer={layer}
                  index={i}
                  totalLayers={layers.length}
                  playheadPercent={playheadPercent}
                  onToggleVisibility={(idx) => updateLayer(idx, { visible: !(layers[idx].visible !== false) })}
                  onToggleLock={() => {}}
                  onSelectLayer={setSelectedLayerIdx}
                  isSelected={i === selectedLayerIdx}
                />
              ))}
            </div>
          </div>

          {/* Layer panel at bottom */}
          <div className="flex-shrink-0" style={{ height: 260, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
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

          {/* Floating add button */}
          <div style={{ position: "relative", height: 0 }}>
            <button
              onClick={() => addLayer("text")}
              className="absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 z-30"
              style={{ background: "#34c759" }}
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── AI BAR ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0"
        style={{ background: "#1c1c22", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <Sparkles className="w-3.5 h-3.5" style={{ color: "#bf5af2" }} />
        <input
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAI()}
          placeholder="Describe your motion graphics scene…"
          className="flex-1 px-3 py-1.5 rounded-lg text-[11px] text-white bg-white/5 border border-white/10 outline-none"
        />
        <button
          onClick={handleAI}
          disabled={isGenerating || !aiPrompt.trim()}
          className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white disabled:opacity-40 flex items-center gap-1.5 transition-all"
          style={{ background: "linear-gradient(135deg, #bf5af2, #0a84ff)" }}
        >
          {isGenerating ? (
            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
          ) : (
            <Sparkles className="w-3 h-3" />
          )}
          Generate
        </button>
      </div>

      {/* ─── EXPORT MODAL ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)" }}
            onClick={() => setShowExportModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="max-w-sm w-full p-6 rounded-3xl" style={{ background: "#1c1c22", border: "1px solid rgba(255,255,255,0.1)" }}
              onClick={e => e.stopPropagation()}>
              <h3 className="text-[17px] font-[800] text-white mb-1">Export Motion Graphics</h3>
              <p className="text-[11px] text-white/40 mb-5">Download frames or export video</p>
              <div className="space-y-3">
                <button className="w-full py-3 rounded-2xl text-[13px] font-bold text-white flex items-center justify-center gap-2"
                  style={{ background: "#34c759" }}>
                  <Download className="w-4 h-4" /> Export Current Frame (PNG)
                </button>
                <button className="w-full py-3 rounded-2xl text-[13px] font-bold text-white flex items-center justify-center gap-2"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <Film className="w-4 h-4" /> Export MP4 (Coming Soon)
                </button>
                <button className="w-full py-3 rounded-2xl text-[13px] font-bold flex items-center justify-center gap-2"
                  style={{ background: "rgba(191,90,242,0.12)", color: "#bf5af2", border: "1px solid rgba(191,90,242,0.2)" }}>
                  <Sparkles className="w-4 h-4" /> Add Voiceover (Coming Soon)
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