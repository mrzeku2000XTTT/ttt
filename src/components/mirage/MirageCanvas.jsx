import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus, X, ImageIcon, Camera, Zap, Palette, Brain, Sparkles, Telescope, Mail,
  MessageSquarePlus, Twitter, Rss, Search, Loader2, CheckCircle2, AlertCircle,
  Maximize2, Minus,
} from "lucide-react";
import { MIRAGE_LOGO } from "./mirageTools";

const ICONS = { ImageIcon, Camera, Zap, Palette, Brain, Sparkles, Telescope, Mail, MessageSquarePlus, Twitter, Rss, Search };

const NODE_W = 180;
const NODE_H = 96;
const MIRAGE_SIZE = 120;

/**
 * Free-form n8n-style canvas:
 *  - Pan with drag on empty space
 *  - Zoom with scroll wheel / pinch / +/- buttons
 *  - Drag nodes individually
 *  - MIRAGE sits in the middle and routes outputs into each tool (visible connector handles)
 *  - Layout auto-positions new nodes, but users can drag them anywhere
 */
export default function MirageCanvas({ nodes, selectedId, onSelect, onAdd, onDelete, runStatus, onPositionsChange }) {
  const wrapRef = useRef(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [positions, setPositions] = useState({}); // { [nodeId]: {x, y} } in canvas coords
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [panning, setPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const dragStart = useRef({ x: 0, y: 0, nx: 0, ny: 0 });

  // Track viewport size
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

  // MIRAGE center in canvas coords (fixed)
  const cx = 0;
  const cy = 0;

  // Auto-layout new nodes on a circle around MIRAGE if they don't have a position
  useEffect(() => {
    setPositions((prev) => {
      const next = { ...prev };
      let changed = false;
      const radius = 260;
      nodes.forEach((n, i) => {
        if (!next[n.id]) {
          const angle = (i / Math.max(1, nodes.length)) * Math.PI * 2 - Math.PI / 2;
          next[n.id] = {
            x: cx + Math.cos(angle) * radius,
            y: cy + Math.sin(angle) * radius,
          };
          changed = true;
        }
      });
      // Cleanup positions for removed nodes
      Object.keys(next).forEach((id) => {
        if (!nodes.find((n) => n.id === id)) {
          delete next[id];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [nodes]);

  // Center the view initially
  useEffect(() => {
    if (size.w > 0 && size.h > 0 && transform.x === 0 && transform.y === 0) {
      setTransform({ x: size.w / 2, y: size.h / 2, scale: 1 });
    }
    // eslint-disable-next-line
  }, [size.w, size.h]);

  // ── Pan ──
  const onCanvasMouseDown = (e) => {
    if (e.target.closest("[data-node]") || e.target.closest("[data-control]")) return;
    setPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y };
  };

  const onMouseMove = useCallback((e) => {
    if (panning) {
      setTransform((t) => ({
        ...t,
        x: panStart.current.tx + (e.clientX - panStart.current.x),
        y: panStart.current.ty + (e.clientY - panStart.current.y),
      }));
    } else if (draggingNodeId) {
      const dx = (e.clientX - dragStart.current.x) / transform.scale;
      const dy = (e.clientY - dragStart.current.y) / transform.scale;
      setPositions((prev) => ({
        ...prev,
        [draggingNodeId]: {
          x: dragStart.current.nx + dx,
          y: dragStart.current.ny + dy,
        },
      }));
    }
  }, [panning, draggingNodeId, transform.scale]);

  const onMouseUp = useCallback(() => {
    setPanning(false);
    setDraggingNodeId(null);
  }, []);

  useEffect(() => {
    if (panning || draggingNodeId) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      return () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };
    }
  }, [panning, draggingNodeId, onMouseMove, onMouseUp]);

  // ── Zoom (wheel) ──
  const onWheel = (e) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    setTransform((t) => {
      const newScale = Math.max(0.3, Math.min(2, t.scale * (1 + delta)));
      // Zoom toward cursor
      const rect = wrapRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const ratio = newScale / t.scale;
      return {
        scale: newScale,
        x: mx - (mx - t.x) * ratio,
        y: my - (my - t.y) * ratio,
      };
    });
  };

  // ── Touch (basic 1-finger pan) ──
  const onTouchStart = (e) => {
    if (e.touches.length === 1 && !e.target.closest("[data-node]")) {
      const t = e.touches[0];
      setPanning(true);
      panStart.current = { x: t.clientX, y: t.clientY, tx: transform.x, ty: transform.y };
    }
  };
  const onTouchMove = (e) => {
    if (panning && e.touches.length === 1) {
      const t = e.touches[0];
      setTransform((tr) => ({
        ...tr,
        x: panStart.current.tx + (t.clientX - panStart.current.x),
        y: panStart.current.ty + (t.clientY - panStart.current.y),
      }));
    }
  };
  const onTouchEnd = () => setPanning(false);

  // ── Node drag start ──
  const startNodeDrag = (e, nodeId) => {
    e.stopPropagation();
    const pos = positions[nodeId] || { x: 0, y: 0 };
    setDraggingNodeId(nodeId);
    dragStart.current = { x: e.clientX, y: e.clientY, nx: pos.x, ny: pos.y };
  };

  // ── Zoom controls ──
  const zoomIn = () => setTransform((t) => ({ ...t, scale: Math.min(2, t.scale * 1.2) }));
  const zoomOut = () => setTransform((t) => ({ ...t, scale: Math.max(0.3, t.scale / 1.2) }));
  const resetView = () => setTransform({ x: size.w / 2, y: size.h / 2, scale: 1 });

  const getStatus = (nodeId) => runStatus?.[nodeId];

  // Compute connector path between MIRAGE and a node (curved bezier)
  const connectorPath = (nx, ny) => {
    const startX = cx;
    const startY = cy;
    const endX = nx;
    const endY = ny;
    const midX = (startX + endX) / 2;
    return `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
  };

  return (
    <div
      ref={wrapRef}
      onMouseDown={onCanvasMouseDown}
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={`relative w-full h-full overflow-hidden bg-[radial-gradient(circle_at_center,#0a1f1c_0%,#04100e_60%,#000_100%)] ${
        panning ? "cursor-grabbing" : "cursor-grab"
      }`}
      style={{ touchAction: "none" }}
    >
      {/* Grid — moves with pan, scales with zoom */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)",
          backgroundSize: `${40 * transform.scale}px ${40 * transform.scale}px`,
          backgroundPosition: `${transform.x}px ${transform.y}px`,
        }}
      />

      {/* Transformed canvas content */}
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: "0 0",
        }}
      >
        {/* Connector beams as SVG, in canvas coords */}
        <svg
          className="absolute pointer-events-none overflow-visible"
          style={{ left: 0, top: 0, width: 1, height: 1 }}
        >
          <defs>
            <linearGradient id="beam-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.9" />
            </linearGradient>
            <filter id="beam-glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {nodes.map((n) => {
            const p = positions[n.id];
            if (!p) return null;
            const status = getStatus(n.id);
            const isActive = status === "running";
            const isDone = status === "done";
            const isError = status === "error";
            const stroke = isError ? "#ef4444" : isDone ? "#10b981" : "url(#beam-grad)";
            return (
              <g key={`beam-${n.id}`}>
                <path
                  d={connectorPath(p.x, p.y)}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={isActive ? 3 : 2}
                  strokeOpacity={isActive ? 1 : isDone ? 0.85 : 0.55}
                  filter={isActive ? "url(#beam-glow)" : undefined}
                  strokeDasharray={isActive ? "8 4" : undefined}
                  strokeLinecap="round"
                >
                  {isActive && (
                    <animate attributeName="stroke-dashoffset" from="12" to="0" dur="0.6s" repeatCount="indefinite" />
                  )}
                </path>
                {/* Input handle dot on the node side */}
                <circle
                  cx={p.x - NODE_W / 2}
                  cy={p.y}
                  r={5}
                  fill={isActive ? "#fbbf24" : isDone ? "#10b981" : "#0f0f0f"}
                  stroke={isActive ? "#fbbf24" : "#10b981"}
                  strokeWidth={2}
                />
              </g>
            );
          })}
          {/* Output handles around MIRAGE */}
          {nodes.map((n) => {
            const p = positions[n.id];
            if (!p) return null;
            const dx = p.x - cx;
            const dy = p.y - cy;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const ox = cx + (dx / len) * (MIRAGE_SIZE / 2);
            const oy = cy + (dy / len) * (MIRAGE_SIZE / 2);
            return (
              <circle
                key={`out-${n.id}`}
                cx={ox}
                cy={oy}
                r={4}
                fill="#fbbf24"
                stroke="#000"
                strokeWidth={1.5}
              />
            );
          })}
        </svg>

        {/* Outer ring decoration around MIRAGE */}
        <svg className="absolute pointer-events-none overflow-visible" style={{ left: 0, top: 0, width: 1, height: 1 }}>
          <circle cx={cx} cy={cy} r={MIRAGE_SIZE * 1.4} fill="none" stroke="#10b981" strokeOpacity="0.12" strokeWidth="1" strokeDasharray="2 6" />
          <circle cx={cx} cy={cy} r={MIRAGE_SIZE * 0.85} fill="none" stroke="#fbbf24" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="1 4" />
        </svg>

        {/* MIRAGE Center */}
        <div
          className="absolute"
          style={{ left: cx, top: cy, transform: "translate(-50%, -50%)" }}
        >
          <div className="relative">
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500 via-teal-400 to-amber-400 blur-2xl"
              animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: MIRAGE_SIZE + 40, height: MIRAGE_SIZE + 40, left: -20, top: -20 }}
            />
            <div
              className="relative rounded-full overflow-hidden ring-4 ring-emerald-400/40 shadow-2xl shadow-emerald-500/40"
              style={{ width: MIRAGE_SIZE, height: MIRAGE_SIZE }}
            >
              <img src={MIRAGE_LOGO} alt="MIRAGE" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-emerald-400/30 whitespace-nowrap">
              <span className="text-white font-black text-[11px] tracking-widest">MIRAGE</span>
            </div>
          </div>
        </div>

        {/* Tool nodes */}
        {nodes.map((n, i) => {
          const p = positions[n.id];
          if (!p) return null;
          return (
            <ToolNode
              key={n.id}
              node={n}
              x={p.x}
              y={p.y}
              index={i}
              selected={selectedId === n.id}
              status={getStatus(n.id)}
              dragging={draggingNodeId === n.id}
              onMouseDownDrag={(e) => startNodeDrag(e, n.id)}
              onSelect={() => onSelect(n.id)}
              onDelete={(e) => { e.stopPropagation(); onDelete(n.id); }}
            />
          );
        })}
      </div>

      {/* Empty state */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="text-center mt-48">
            <p className="text-white/50 text-sm font-medium">MIRAGE is awake. Connect your first tool.</p>
            <p className="text-white/30 text-xs mt-1">Drag to pan · Scroll to zoom</p>
          </div>
        </div>
      )}

      {/* Zoom controls (top-right) */}
      <div data-control className="absolute top-4 right-4 z-30 flex flex-col gap-1 bg-black/70 backdrop-blur-md rounded-xl border border-white/10 p-1">
        <button onClick={zoomIn} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/70 hover:text-white" title="Zoom in">
          <Plus className="w-4 h-4" />
        </button>
        <div className="text-[9px] text-center text-white/40 font-bold tabular-nums">
          {Math.round(transform.scale * 100)}%
        </div>
        <button onClick={zoomOut} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/70 hover:text-white" title="Zoom out">
          <Minus className="w-4 h-4" />
        </button>
        <div className="border-t border-white/10 my-0.5" />
        <button onClick={resetView} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/70 hover:text-white" title="Reset view">
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Add tool button */}
      <motion.button
        data-control
        onClick={onAdd}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="absolute bottom-6 right-6 z-30 flex items-center gap-2 px-5 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-amber-400 hover:from-emerald-400 hover:to-amber-300 text-black font-bold text-sm shadow-2xl shadow-emerald-500/40"
      >
        <Plus className="w-4 h-4" /> Connect a TTT App
      </motion.button>

      {/* Help hint (bottom-left) */}
      <div data-control className="absolute bottom-4 left-4 z-30 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] text-white/40 font-medium pointer-events-none">
        Drag canvas to pan · Scroll to zoom · Drag nodes to rearrange
      </div>
    </div>
  );
}

function ToolNode({ node, x, y, index, selected, status, dragging, onMouseDownDrag, onSelect, onDelete }) {
  const Icon = ICONS[node.icon] || Sparkles;
  const isRunning = status === "running";
  const isDone = status === "done";
  const isError = status === "error";

  return (
    <motion.div
      data-node
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: index * 0.05, type: "spring", damping: 22, stiffness: 220 }}
      className={`absolute group ${dragging ? "z-40" : "z-20"}`}
      style={{
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
        cursor: dragging ? "grabbing" : "grab",
      }}
      onMouseDown={onMouseDownDrag}
    >
      {/* Card */}
      <div
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-zinc-900/95 backdrop-blur-md shadow-2xl border-2 transition-all ${
          selected
            ? "border-white scale-[1.03]"
            : isError
            ? "border-red-400"
            : isDone
            ? "border-emerald-400"
            : isRunning
            ? "border-amber-300"
            : "border-white/15 hover:border-white/30"
        }`}
        style={{ width: NODE_W, height: NODE_H }}
      >
        {/* Glow */}
        <div className={`absolute -inset-0.5 bg-gradient-to-br ${node.color} rounded-2xl blur-md transition-opacity ${selected || isRunning ? "opacity-50" : "opacity-0 group-hover:opacity-30"} -z-10`} />

        {/* Logo */}
        <div className="relative w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden ring-1 ring-white/15 shadow-lg">
          {node.logo ? (
            <img src={node.logo} alt={node.appName} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${node.color} flex items-center justify-center`}>
              <Icon className="w-5 h-5 text-white drop-shadow" />
            </div>
          )}
          {/* Status overlay */}
          {isRunning && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Label */}
        <div className="flex-1 min-w-0">
          <div className="text-white font-black text-[12px] truncate">{node.appName}</div>
          <div className="text-emerald-300 text-[9px] font-bold uppercase tracking-wider truncate">
            {isError ? "Failed" : isDone ? "Complete" : isRunning ? "Running…" : "Ready"}
          </div>
        </div>

        {/* Status badge */}
        {isDone && (
          <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-emerald-500 border-2 border-black flex items-center justify-center">
            <CheckCircle2 className="w-3 h-3 text-white" />
          </div>
        )}
        {isError && (
          <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 border-2 border-black flex items-center justify-center">
            <AlertCircle className="w-3 h-3 text-white" />
          </div>
        )}

        {/* Delete button */}
        <button
          onClick={onDelete}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-red-500 border-2 border-black opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:scale-110"
        >
          <X className="w-2.5 h-2.5 text-white" />
        </button>

        {/* Input connector handle (left) */}
        <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-emerald-400 border-2 border-black shadow-md" />
        {/* Output connector handle (right) — for future chaining */}
        <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-amber-400 border-2 border-black shadow-md" />
      </div>
    </motion.div>
  );
}