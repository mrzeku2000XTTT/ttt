import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, X, Settings2, ImageIcon, Camera, Zap, Palette, Brain, Sparkles, Telescope, Mail, MessageSquarePlus, Twitter, Rss, Search, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { MIRAGE_LOGO } from "./mirageTools";

const ICONS = { ImageIcon, Camera, Zap, Palette, Brain, Sparkles, Telescope, Mail, MessageSquarePlus, Twitter, Rss, Search };

/**
 * MIRAGE Canvas — radial layout.
 * MIRAGE logo sits in the center. Tool nodes orbit around it on a circle.
 * Curved beams connect each tool back to MIRAGE (the orchestrator).
 * Execution still flows top-to-bottom by node order in the array.
 */
export default function MirageCanvas({ nodes, selectedId, onSelect, onAdd, onDelete, runStatus }) {
  const [size, setSize] = useState({ w: 800, h: 600 });
  const wrapRef = useRef(null);

  useEffect(() => {
    const update = () => {
      if (!wrapRef.current) return;
      const r = wrapRef.current.getBoundingClientRect();
      setSize({ w: r.width, h: r.height });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const cx = size.w / 2;
  const cy = size.h / 2;
  const radius = Math.min(size.w, size.h) * 0.36;
  const minRadius = 180;
  const r = Math.max(minRadius, radius);

  const positionedNodes = nodes.map((n, i) => {
    const angle = nodes.length === 0 ? 0 : (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
    return {
      ...n,
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      angle,
    };
  });

  const getStatus = (nodeId) => runStatus?.[nodeId];

  return (
    <div ref={wrapRef} className="relative w-full h-full overflow-hidden bg-[radial-gradient(circle_at_center,#0a1f1c_0%,#04100e_60%,#000_100%)]">
      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Connection beams (SVG) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        <defs>
          <linearGradient id="beam-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.8" />
          </linearGradient>
          <filter id="beam-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {positionedNodes.map((n) => {
          const status = getStatus(n.id);
          const isActive = status === "running";
          const isDone = status === "done";
          const isError = status === "error";
          const stroke = isError ? "#ef4444" : isDone ? "#10b981" : isActive ? "url(#beam-grad)" : "url(#beam-grad)";
          const opacity = isActive ? 1 : isDone ? 0.7 : 0.35;
          return (
            <g key={`beam-${n.id}`}>
              <line
                x1={cx}
                y1={cy}
                x2={n.x}
                y2={n.y}
                stroke={stroke}
                strokeWidth={isActive ? 3 : 1.5}
                strokeOpacity={opacity}
                filter={isActive ? "url(#beam-glow)" : undefined}
                strokeDasharray={isActive ? "8 4" : undefined}
              >
                {isActive && (
                  <animate attributeName="stroke-dashoffset" from="12" to="0" dur="0.6s" repeatCount="indefinite" />
                )}
              </line>
            </g>
          );
        })}
      </svg>

      {/* Outer ring decoration */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#10b981" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="2 6" />
        <circle cx={cx} cy={cy} r={r * 0.55} fill="none" stroke="#fbbf24" strokeOpacity="0.08" strokeWidth="1" strokeDasharray="1 4" />
      </svg>

      {/* MIRAGE Center */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 18, stiffness: 220 }}
        className="absolute z-10"
        style={{ left: cx, top: cy, transform: "translate(-50%, -50%)" }}
      >
        <div className="relative">
          {/* Pulsing aura */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500 via-teal-400 to-amber-400 blur-2xl"
            animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: 140, height: 140, left: -20, top: -20 }}
          />
          <div className="relative w-[100px] h-[100px] rounded-full overflow-hidden ring-4 ring-emerald-400/40 shadow-2xl shadow-emerald-500/40">
            <img src={MIRAGE_LOGO} alt="MIRAGE" className="w-full h-full object-cover" />
          </div>
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-emerald-400/30 whitespace-nowrap">
            <span className="text-white font-black text-[11px] tracking-widest">MIRAGE</span>
          </div>
        </div>
      </motion.div>

      {/* Tool nodes */}
      {positionedNodes.map((n, i) => (
        <ToolNode
          key={n.id}
          node={n}
          index={i}
          selected={selectedId === n.id}
          status={getStatus(n.id)}
          onSelect={() => onSelect(n.id)}
          onDelete={(e) => { e.stopPropagation(); onDelete(n.id); }}
        />
      ))}

      {/* Empty state */}
      {nodes.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute z-20 left-1/2 bottom-12 -translate-x-1/2 text-center pointer-events-none"
        >
          <p className="text-white/50 text-sm font-medium mb-3">MIRAGE is awake. Connect your first tool.</p>
        </motion.div>
      )}

      {/* Add tool button — floating */}
      <motion.button
        onClick={onAdd}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="absolute bottom-6 right-6 z-30 flex items-center gap-2 px-5 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-amber-400 hover:from-emerald-400 hover:to-amber-300 text-black font-bold text-sm shadow-2xl shadow-emerald-500/40"
      >
        <Plus className="w-4 h-4" /> Connect a TTT App
      </motion.button>
    </div>
  );
}

function ToolNode({ node, index, selected, status, onSelect, onDelete }) {
  const Icon = ICONS[node.icon] || Sparkles;
  const isRunning = status === "running";
  const isDone = status === "done";
  const isError = status === "error";

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: index * 0.05, type: "spring", damping: 22, stiffness: 220 }}
      className="absolute z-20 group"
      style={{ left: node.x, top: node.y, transform: "translate(-50%, -50%)" }}
    >
      <button
        onClick={onSelect}
        className={`relative flex flex-col items-center gap-2 transition-transform ${selected ? "scale-110" : "hover:scale-105"}`}
      >
        <div className="relative w-[72px] h-[72px]">
          <div
            className={`absolute inset-0 bg-gradient-to-br ${node.color} rounded-2xl blur-md transition-opacity ${
              selected || isRunning ? "opacity-90" : "opacity-50"
            }`}
          />
          <div
            className={`relative w-full h-full rounded-2xl shadow-xl border-2 overflow-hidden ${
              selected
                ? "border-white"
                : isError
                ? "border-red-400"
                : isDone
                ? "border-emerald-400"
                : "border-white/30"
            }`}
          >
            {node.logo ? (
              <img src={node.logo} alt={node.appName} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${node.color} flex items-center justify-center`}>
                <Icon className="w-7 h-7 text-white drop-shadow" />
              </div>
            )}
            {/* Status overlay */}
            {isRunning && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
            {isDone && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-black flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3 text-white" />
              </div>
            )}
            {isError && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-black flex items-center justify-center">
                <AlertCircle className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        </div>
        <div className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 whitespace-nowrap">
          <span className="text-white font-bold text-[11px]">{node.appName}</span>
        </div>
      </button>

      <button
        onClick={onDelete}
        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 border-2 border-black opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
      >
        <X className="w-3 h-3 text-white" />
      </button>
    </motion.div>
  );
}