import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Plus, Type, Square, Circle, Image, Layers, Trash2, Copy, ChevronLeft, GripVertical, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

// ---------- Apple-style color palette ----------
const COLORS = {
  white: "#FFFFFF",
  bg: "#F5F5F7",
  textDark: "#1D1D1F",
  textSecondary: "#6E6E73",
  blue: "#007AFF",
  green: "#34C759",
  orange: "#FF9500",
  red: "#FF3B30",
  purple: "#AF52DE",
  gray: "#AEAEB2",
  darkGray: "#636366",
};

// ---------- Easing functions (Apple-style cubic bezier) ----------
const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutBack = (t) => { const c1 = 1.70158; const c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

const EASINGS = {
  "ease-out": easeOutQuart,
  "ease-in-out": easeInOutCubic,
  "bounce": easeOutBack,
};

// ---------- Animation presets (Apple-inspired) ----------
const PRESETS = [
  { id: "fade-in", label: "Fade In", icon: "○→●", defaults: { opacity: [0, 1], duration: 0.6 }, easing: "ease-out" },
  { id: "slide-up", label: "Slide Up", icon: "↑", defaults: { y: [40, 0], opacity: [0, 1], duration: 0.7 }, easing: "ease-out" },
  { id: "slide-down", label: "Slide Down", icon: "↓", defaults: { y: [-40, 0], opacity: [0, 1], duration: 0.7 }, easing: "ease-out" },
  { id: "slide-left", label: "Slide Left", icon: "←", defaults: { x: [80, 0], opacity: [0, 1], duration: 0.7 }, easing: "ease-out" },
  { id: "slide-right", label: "Slide Right", icon: "→", defaults: { x: [-80, 0], opacity: [0, 1], duration: 0.7 }, easing: "ease-out" },
  { id: "scale-up", label: "Scale Up", icon: "⊕", defaults: { scale: [0.7, 1], opacity: [0, 1], duration: 0.8 }, easing: "ease-out" },
  { id: "pop", label: "Pop", icon: "💫", defaults: { scale: [0.3, 1.05, 1], opacity: [0, 1], duration: 0.8 }, easing: "bounce" },
  { id: "reveal", label: "Word Reveal", icon: "✧", defaults: { y: [20, 0], opacity: [0, 1], stagger: 0.08, duration: 0.5 }, easing: "ease-out", isText: true },
];

// ---------- Icon library (simple SVGs) ----------
const ICONS = {
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  heart: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  check: "M20 6L9 17l-5-5",
  arrow: "M5 12h14M12 5l7 7-7 7",
  play: "M5 3l14 9-14 9V3z",
  mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6",
  phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  camera: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  lock: "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z M7 11V7a5 5 0 0 1 10 0v4",
  bell: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.35-4.35",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
};

let nextId = 1;
const genId = () => `el_${nextId++}`;

// ---------- Canvas rendering component ----------
function CanvasRenderer({ elements, time, duration, isPlaying }) {
  return (
    <div className="relative w-full h-full bg-white rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.06)] overflow-hidden" style={{ minHeight: 500 }}>
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle, #1D1D1F 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      {elements.map((el) => {
        const { preset, startTime = 0, duration: elDuration = 1 } = el;
        const elEnd = startTime + elDuration;
        const visible = time >= startTime && time <= elEnd;
        if (!visible && !isPlaying) return null;

        const localT = elDuration > 0 ? Math.max(0, Math.min(1, (time - startTime) / elDuration)) : 1;
        const easingFn = EASINGS[el.easing || "ease-out"] || easeOutQuart;
        const t = easingFn(localT);

        // Compute animated properties
        const ox = el.presetData?.x?.[0] ?? 0;
        const oy = el.presetData?.y?.[0] ?? 0;
        const oopacity = el.presetData?.opacity?.[0] ?? 1;
        const oscale = el.presetData?.scale?.[0] ?? 1;

        const tx = el.presetData?.x ? (ox + (el.presetData.x[1] - ox) * t) : 0;
        const ty = el.presetData?.y ? (oy + (el.presetData.y[1] - oy) * t) : 0;
        const topacity = el.presetData?.opacity ? (oopacity + (el.presetData.opacity[1] - oopacity) * t) : 1;
        const tscale = el.presetData?.scale ? (oscale + (el.presetData.scale[1] - oscale) * t) : 1;

        const style = {
          left: `${el.x}%`,
          top: `${el.y}%`,
          opacity: topacity,
          transform: `translate(-50%, -50%) translate(${tx}px, ${ty}px) scale(${tscale})`,
          transition: "none",
          position: "absolute",
        };

        if (el.type === "text") {
          return (
            <div key={el.id} style={style} className="pointer-events-none">
              <p
                style={{
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif",
                  fontSize: `${el.fontSize || 48}px`,
                  fontWeight: el.fontWeight || 700,
                  color: el.color || COLORS.textDark,
                  lineHeight: 1.15,
                  letterSpacing: "-0.02em",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {el.text}
              </p>
            </div>
          );
        }

        if (el.type === "panel") {
          return (
            <div key={el.id} style={{
              ...style,
              width: `${el.width || 280}px`,
              height: `${el.height || 180}px`,
              borderRadius: `${el.borderRadius || 20}px`,
              background: el.color || COLORS.white,
              boxShadow: "0 2px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
              position: "absolute",
            }} className="pointer-events-none" />
          );
        }

        if (el.type === "circle") {
          return (
            <div key={el.id} style={{
              ...style,
              width: `${el.size || 80}px`,
              height: `${el.size || 80}px`,
              borderRadius: "50%",
              background: el.color || COLORS.blue,
              position: "absolute",
            }} className="pointer-events-none" />
          );
        }

        if (el.type === "icon") {
          return (
            <div key={el.id} style={style} className="pointer-events-none">
              <svg
                width={el.size || 48}
                height={el.size || 48}
                viewBox="0 0 24 24"
                fill="none"
                stroke={el.color || COLORS.blue}
                strokeWidth={el.strokeWidth || 1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={ICONS[el.icon] || ICONS.star} />
              </svg>
            </div>
          );
        }

        return null;
      })}
      {elements.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-[#AEAEB2] select-none">
          <div className="text-center">
            <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium" style={{ fontFamily: "-apple-system, sans-serif" }}>
              Add elements from the sidebar
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Main Page ----------
export default function PingguoPage() {
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(3);
  const [showBack, setShowBack] = useState(false);
  const animRef = useRef(null);
  const lastFrameRef = useRef(0);

  const selected = elements.find((e) => e.id === selectedId) || null;

  // Check if navigated from categories
  useEffect(() => {
    if (localStorage.getItem("came_from_categories") === "true") setShowBack(true);
  }, []);

  // Playback loop
  useEffect(() => {
    if (isPlaying) {
      lastFrameRef.current = performance.now();
      const loop = (now) => {
        const dt = (now - lastFrameRef.current) / 1000;
        lastFrameRef.current = now;
        setTime((prev) => {
          const next = prev + dt;
          if (next >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return next;
        });
        animRef.current = requestAnimationFrame(loop);
      };
      animRef.current = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(animRef.current);
    }
  }, [isPlaying, duration]);

  const addElement = (type, defaults = {}) => {
    const id = genId();
    const el = {
      id,
      type,
      x: 50,
      y: 50,
      color: type === "text" ? COLORS.textDark : type === "panel" ? COLORS.white : COLORS.blue,
      ...defaults,
    };
    setElements((prev) => [...prev, el]);
    setSelectedId(id);
  };

  const removeElement = (id) => {
    setElements((prev) => prev.filter((e) => e.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const updateElement = (id, updates) => {
    setElements((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };

  const applyPreset = (presetId) => {
    if (!selected) return;
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const startTime = time;

    let presetData = {};
    if (preset.defaults.y) presetData.y = preset.defaults.y;
    if (preset.defaults.x) presetData.x = preset.defaults.x;
    if (preset.defaults.opacity) presetData.opacity = preset.defaults.opacity;
    if (preset.defaults.scale) presetData.scale = preset.defaults.scale;

    updateElement(selected.id, {
      preset: presetId,
      presetData,
      easing: preset.easing,
      startTime,
      duration: preset.defaults.duration || 0.7,
    });
    setTime(startTime);
    setIsPlaying(true);
  };

  const clearPreset = () => {
    if (!selected) return;
    updateElement(selected.id, {
      preset: null,
      presetData: null,
      easing: null,
      startTime: 0,
      duration: 1,
    });
  };

  const handleBack = () => {
    localStorage.removeItem("came_from_categories");
    window.location.href = "/AppStoreV2";
  };

  return (
    <div className="min-h-screen bg-[#F2F2F6]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBack && (
              <button onClick={handleBack} className="p-2 rounded-lg hover:bg-black/5 text-[#6E6E73]">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center">
                <Play className="w-3.5 h-3.5 text-white" fill="white" />
              </div>
              <h1 className="text-lg font-bold tracking-tight text-[#1D1D1F]">Pingguo Motion</h1>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#007AFF]/10 text-[#007AFF]">BETA</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Canvas */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="relative aspect-[4/3] max-h-[550px] rounded-2xl overflow-hidden bg-white shadow-sm border border-black/5">
              <CanvasRenderer elements={elements} time={time} duration={duration} isPlaying={isPlaying} />
            </div>

            {/* Playback bar */}
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-black/5 shadow-sm">
              <button
                onClick={() => { if (!isPlaying && time >= duration) setTime(0); setIsPlaying(!isPlaying); }}
                className="w-10 h-10 rounded-full bg-[#007AFF] hover:bg-[#0066D6] text-white flex items-center justify-center transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <button
                onClick={() => { setIsPlaying(false); setTime(0); }}
                className="w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-[#6E6E73]" />
              </button>
              <div className="flex-1 h-2 bg-[#E8E8ED] rounded-full overflow-hidden relative">
                <div
                  className="absolute inset-y-0 left-0 bg-[#007AFF] rounded-full transition-all duration-75"
                  style={{ width: `${duration > 0 ? (time / duration) * 100 : 0}%` }}
                />
                <input
                  type="range"
                  min={0}
                  max={duration}
                  step={0.01}
                  value={time}
                  onChange={(e) => { setTime(parseFloat(e.target.value)); setIsPlaying(false); }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-[#6E6E73] min-w-[100px]">
                <Clock className="w-3.5 h-3.5" />
                <span>{time.toFixed(1)}s</span>
                <span>/</span>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Math.max(0.5, parseFloat(e.target.value) || 3))}
                  className="w-12 text-center bg-transparent border-b border-black/10 focus:border-[#007AFF] outline-none text-[#1D1D1F]"
                  min={0.5}
                  max={30}
                  step={0.5}
                />
                <span>s</span>
              </div>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="w-full lg:w-72 space-y-4">
            {/* Add Elements */}
            <div className="bg-white rounded-xl border border-black/5 shadow-sm p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6E6E73] mb-3">Add Element</h3>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => addElement("panel", { width: 280, height: 180, borderRadius: 20, color: COLORS.white })} className="flex flex-col items-center gap-1 p-2.5 rounded-lg hover:bg-[#F2F2F6] transition-colors text-[#1D1D1F]">
                  <Square className="w-5 h-5" />
                  <span className="text-[10px] font-medium">Panel</span>
                </button>
                <button onClick={() => addElement("text", { text: "Hello", fontSize: 48, fontWeight: 700 })} className="flex flex-col items-center gap-1 p-2.5 rounded-lg hover:bg-[#F2F2F6] transition-colors text-[#1D1D1F]">
                  <Type className="w-5 h-5" />
                  <span className="text-[10px] font-medium">Text</span>
                </button>
                <button onClick={() => addElement("circle", { size: 80, color: COLORS.blue })} className="flex flex-col items-center gap-1 p-2.5 rounded-lg hover:bg-[#F2F2F6] transition-colors text-[#1D1D1F]">
                  <Circle className="w-5 h-5" fill="currentColor" />
                  <span className="text-[10px] font-medium">Shape</span>
                </button>
                <button onClick={() => addElement("icon", { icon: "star", size: 48, color: COLORS.blue })} className="flex flex-col items-center gap-1 p-2.5 rounded-lg hover:bg-[#F2F2F6] transition-colors text-[#1D1D1F]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d={ICONS.star} />
                  </svg>
                  <span className="text-[10px] font-medium">Icon</span>
                </button>
              </div>
            </div>

            {/* Element Properties */}
            {selected && (
              <div className="bg-white rounded-xl border border-black/5 shadow-sm p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6E6E73] mb-3">Properties</h3>

                {selected.type === "text" && (
                  <div className="space-y-3">
                    <input
                      value={selected.text || ""}
                      onChange={(e) => updateElement(selected.id, { text: e.target.value })}
                      placeholder="Text content"
                      className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm font-medium focus:border-[#007AFF] outline-none"
                      style={{ fontSize: "16px" }}
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={selected.fontSize || 48}
                        onChange={(e) => updateElement(selected.id, { fontSize: parseInt(e.target.value) || 48 })}
                        className="flex-1 px-3 py-2 rounded-lg border border-black/10 text-sm focus:border-[#007AFF] outline-none"
                        placeholder="Size"
                      />
                      <select
                        value={selected.fontWeight || 700}
                        onChange={(e) => updateElement(selected.id, { fontWeight: parseInt(e.target.value) })}
                        className="flex-1 px-3 py-2 rounded-lg border border-black/10 text-sm focus:border-[#007AFF] outline-none bg-white"
                      >
                        <option value={400}>Regular</option>
                        <option value={600}>Semibold</option>
                        <option value={700}>Bold</option>
                        <option value={900}>Black</option>
                      </select>
                    </div>
                  </div>
                )}

                {selected.type === "circle" && (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={selected.size || 80}
                      onChange={(e) => updateElement(selected.id, { size: parseInt(e.target.value) || 80 })}
                      className="flex-1 px-3 py-2 rounded-lg border border-black/10 text-sm focus:border-[#007AFF] outline-none"
                      placeholder="Size"
                    />
                  </div>
                )}

                {selected.type === "panel" && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={selected.width || 280}
                        onChange={(e) => updateElement(selected.id, { width: parseInt(e.target.value) || 280 })}
                        className="flex-1 px-3 py-2 rounded-lg border border-black/10 text-sm focus:border-[#007AFF] outline-none"
                        placeholder="Width"
                      />
                      <input
                        type="number"
                        value={selected.height || 180}
                        onChange={(e) => updateElement(selected.id, { height: parseInt(e.target.value) || 180 })}
                        className="flex-1 px-3 py-2 rounded-lg border border-black/10 text-sm focus:border-[#007AFF] outline-none"
                        placeholder="Height"
                      />
                    </div>
                    <input
                      type="number"
                      value={selected.borderRadius || 20}
                      onChange={(e) => updateElement(selected.id, { borderRadius: parseInt(e.target.value) || 20 })}
                      className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:border-[#007AFF] outline-none"
                      placeholder="Corner Radius"
                    />
                  </div>
                )}

                {selected.type === "icon" && (
                  <div className="space-y-3">
                    <select
                      value={selected.icon || "star"}
                      onChange={(e) => updateElement(selected.id, { icon: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:border-[#007AFF] outline-none bg-white"
                    >
                      {Object.keys(ICONS).map((key) => (
                        <option key={key} value={key}>{key}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={selected.size || 48}
                        onChange={(e) => updateElement(selected.id, { size: parseInt(e.target.value) || 48 })}
                        className="flex-1 px-3 py-2 rounded-lg border border-black/10 text-sm focus:border-[#007AFF] outline-none"
                        placeholder="Size"
                      />
                      <input
                        type="number"
                        value={selected.strokeWidth || 1.8}
                        onChange={(e) => updateElement(selected.id, { strokeWidth: parseFloat(e.target.value) || 1.8 })}
                        step={0.2}
                        className="flex-1 px-3 py-2 rounded-lg border border-black/10 text-sm focus:border-[#007AFF] outline-none"
                        placeholder="Stroke"
                      />
                    </div>
                  </div>
                )}

                {/* Color picker */}
                <div className="mt-3">
                  <div className="text-[10px] font-medium text-[#6E6E73] mb-1.5">Color</div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(COLORS).filter(([k]) => k !== "white" && k !== "bg").map(([key, hex]) => (
                      <button
                        key={key}
                        onClick={() => updateElement(selected.id, { color: hex })}
                        className="w-6 h-6 rounded-full border-2 transition-all hover:scale-110"
                        style={{
                          backgroundColor: hex,
                          borderColor: selected.color === hex ? "#1D1D1F" : "transparent",
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeElement(selected.id)}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[#FF3B30] text-xs font-medium hover:bg-[#FF3B30]/5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              </div>
            )}

            {/* Animation Presets */}
            {selected && (
              <div className="bg-white rounded-xl border border-black/5 shadow-sm p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6E6E73] mb-3">Animation Preset</h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => applyPreset(p.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                        selected.preset === p.id
                          ? "bg-[#007AFF] text-white"
                          : "hover:bg-[#F2F2F6] text-[#1D1D1F]"
                      }`}
                    >
                      <span className="text-sm">{p.icon}</span>
                      {p.label}
                    </button>
                  ))}
                </div>
                {selected.preset && (
                  <button
                    onClick={clearPreset}
                    className="mt-2 w-full text-center text-[10px] text-[#FF3B30] hover:underline"
                  >
                    Clear animation
                  </button>
                )}
              </div>
            )}

            {/* Element list */}
            {elements.length > 0 && (
              <div className="bg-white rounded-xl border border-black/5 shadow-sm p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6E6E73] mb-3">
                  Layers ({elements.length})
                </h3>
                <div className="space-y-1">
                  {elements.map((el) => (
                    <button
                      key={el.id}
                      onClick={() => setSelectedId(el.id)}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                        selectedId === el.id ? "bg-[#007AFF]/10 text-[#007AFF]" : "hover:bg-[#F2F2F6] text-[#1D1D1F]"
                      }`}
                    >
                      <GripVertical className="w-3 h-3 opacity-30 flex-shrink-0" />
                      <span className="flex-1 truncate text-left">
                        {el.type === "text" ? `"${el.text?.slice(0, 20)}"` : `${el.type} ${el.id.slice(-4)}`}
                      </span>
                      {el.preset && (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-[#34C759]/10 text-[#34C759]">{el.preset}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}