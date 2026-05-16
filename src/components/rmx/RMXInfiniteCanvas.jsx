import React, { useEffect, useRef, useState } from "react";
import {
  Plus, Brain, Image as ImageIcon, Mail, Clock, Filter, Webhook,
  Database, GitBranch, Trash2, CheckCircle2, Twitter, Telescope, Rss,
  MessageSquarePlus, Maximize2, ZoomIn, ZoomOut, RotateCcw, Video as VideoIcon,
  Sparkles, Globe,
} from "lucide-react";

const ICONS = { Brain, ImageIcon, Mail, Clock, Filter, Webhook, Database, GitBranch, Twitter, Telescope, Rss, MessageSquarePlus, VideoIcon, Sparkles, Globe };

const NODE_W = 220;
const NODE_H = 64;
const COL_GAP = 30;

/**
 * RMXInfiniteCanvas — pannable/zoomable canvas with compact node cards.
 * Auto-lays nodes top-to-bottom in a single column; user can pan/zoom freely.
 * Mouse wheel = zoom around cursor. Drag empty space = pan.
 */
export default function RMXInfiniteCanvas({ nodes, selectedNodeId, onSelect, onDelete, onAdd }) {
  const containerRef = useRef(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const panRef = useRef({ active: false, startX: 0, startY: 0, origX: 0, origY: 0 });

  // Center first node nicely on initial load / when going from empty → populated
  useEffect(() => {
    if (nodes.length === 0) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPan((prev) => {
      // Only auto-center if pan hasn't been touched yet (still 0,0)
      if (prev.x !== 0 || prev.y !== 0) return prev;
      return {
        x: rect.width / 2 - NODE_W / 2,
        y: 60,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length === 0]);

  const handleWheel = (e) => {
    if (!e.ctrlKey && !e.metaKey) {
      // Plain wheel = pan vertically (smoother for trackpads)
      setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
      e.preventDefault();
      return;
    }
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.max(0.25, Math.min(2, zoom * factor));
    // Zoom around cursor
    const wx = (mx - pan.x) / zoom;
    const wy = (my - pan.y) / zoom;
    setPan({ x: mx - wx * newZoom, y: my - wy * newZoom });
    setZoom(newZoom);
  };

  const handleMouseDown = (e) => {
    // Only pan when clicking empty space (not a node)
    if (e.target.closest("[data-node-card]") || e.target.closest("[data-no-pan]")) return;
    panRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: pan.x,
      origY: pan.y,
    };
    document.body.style.cursor = "grabbing";
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!panRef.current.active) return;
      setPan({
        x: panRef.current.origX + (e.clientX - panRef.current.startX),
        y: panRef.current.origY + (e.clientY - panRef.current.startY),
      });
    };
    const onUp = () => {
      panRef.current.active = false;
      document.body.style.cursor = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const reset = () => {
    setZoom(1);
    const el = containerRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      setPan({ x: rect.width / 2 - NODE_W / 2, y: 60 });
    } else {
      setPan({ x: 0, y: 0 });
    }
  };

  // Empty state
  if (nodes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/30 rounded-2xl flex items-center justify-center mb-4 shadow-2xl shadow-purple-500/10">
          <Plus className="w-7 h-7 text-purple-300" />
        </div>
        <h2 className="text-white font-black text-xl mb-1.5">Build your workflow</h2>
        <p className="text-white/50 text-xs max-w-md mb-5">
          Infinite canvas — pan with drag, zoom with Ctrl+scroll. Add steps to begin.
        </p>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 rounded-xl text-white text-sm font-bold shadow-lg shadow-purple-500/30"
        >
          <Plus className="w-4 h-4" /> Add first node
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
      style={{ touchAction: "none" }}
    >
      {/* Zoom/pan controls */}
      <div data-no-pan className="absolute top-3 right-3 z-30 flex flex-col gap-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg p-1 shadow-xl">
        <button
          onClick={() => setZoom((z) => Math.min(2, z * 1.15))}
          className="w-7 h-7 rounded-md hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white"
          title="Zoom in (Ctrl+Scroll)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <div className="text-[9px] text-white/50 text-center font-mono font-bold">{Math.round(zoom * 100)}%</div>
        <button
          onClick={() => setZoom((z) => Math.max(0.25, z * 0.87))}
          className="w-7 h-7 rounded-md hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white"
          title="Zoom out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <div className="h-px bg-white/10 my-0.5" />
        <button
          onClick={reset}
          className="w-7 h-7 rounded-md hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white"
          title="Reset view"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Add button bottom-right */}
      <button
        data-no-pan
        onClick={onAdd}
        className="absolute bottom-4 right-4 z-30 flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 rounded-xl text-white text-xs font-bold shadow-lg shadow-purple-500/30"
      >
        <Plus className="w-3.5 h-3.5" /> Add Step
      </button>

      {/* World layer */}
      <div
        className="absolute origin-top-left will-change-transform"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}
      >
        {/* Connector SVG */}
        <svg
          className="absolute pointer-events-none"
          style={{ left: 0, top: 0, overflow: "visible" }}
          width="1"
          height="1"
        >
          {nodes.slice(0, -1).map((_, i) => {
            const y1 = i * (NODE_H + COL_GAP) + NODE_H;
            const y2 = (i + 1) * (NODE_H + COL_GAP);
            const x = NODE_W / 2;
            return (
              <line
                key={i}
                x1={x}
                y1={y1}
                x2={x}
                y2={y2}
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map((node, i) => {
          const Icon = ICONS[node.icon] || Brain;
          const isSelected = selectedNodeId === node.id;
          const hasOutput = node.output !== null && node.output !== undefined;
          const y = i * (NODE_H + COL_GAP);

          return (
            <div
              key={node.id}
              data-node-card
              onClick={(e) => {
                e.stopPropagation();
                onSelect(node.id);
              }}
              className={`absolute rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? "bg-purple-500/15 border-purple-400/60 ring-2 ring-purple-500/40 shadow-xl shadow-purple-500/20"
                  : "bg-zinc-900/95 border-white/10 hover:border-white/25 shadow-lg"
              }`}
              style={{ width: NODE_W, height: NODE_H, top: y, left: 0 }}
            >
              <div className="flex items-center gap-2 p-2 h-full">
                <div className="text-white/30 font-mono text-[10px] w-4 text-center flex-shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="relative w-9 h-9 flex-shrink-0">
                  <div className={`absolute inset-0 bg-gradient-to-br ${node.color} rounded-lg blur-sm opacity-50`} />
                  <div className={`relative w-full h-full bg-gradient-to-br ${node.color} rounded-lg flex items-center justify-center shadow-lg border border-white/20 overflow-hidden`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/20" />
                    <Icon className="relative w-4 h-4 text-white drop-shadow" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <h3 className="text-white font-bold text-xs truncate">{node.label}</h3>
                    {hasOutput && (
                      <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-white/40 text-[10px] truncate">{summary(node)}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(node.id);
                  }}
                  className="w-6 h-6 rounded-md hover:bg-red-500/20 flex items-center justify-center text-white/40 hover:text-red-400 flex-shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hint */}
      <div className="absolute bottom-3 left-3 text-white/30 text-[10px] font-medium pointer-events-none">
        Drag to pan · Ctrl+Scroll to zoom
      </div>
    </div>
  );
}

function summary(node) {
  const c = node.config || {};
  if (c.prompt) return c.prompt;
  if (c.topic) return c.topic;
  if (c.to) return `to: ${c.to}`;
  if (c.url) return c.url;
  if (c.seconds) return `${c.seconds}s`;
  if (c.contains) return `contains: ${c.contains}`;
  return "Tap to configure";
}