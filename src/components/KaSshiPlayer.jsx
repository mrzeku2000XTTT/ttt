import React, { useState, useEffect, useRef } from 'react';
import { X, Minimize2, Maximize, Music } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const KASSHI_STORAGE_KEY = 'kasshi_player_active';
const KASSHI_POS_KEY = 'kasshi_player_position';
const KASSHI_INLINE_KEY = 'kasshi_inline_visited';

// Global singleton so we can share state without context across lazy-loaded trees
let globalKaSshiState = { active: false, listeners: new Set() };

export function setKaSshiGlobal(active) {
  globalKaSshiState.active = active;
  localStorage.setItem(KASSHI_STORAGE_KEY, String(active));
  globalKaSshiState.listeners.forEach(fn => fn(active));
}

export function subscribeKaSshi(fn) {
  globalKaSshiState.listeners.add(fn);
  return () => globalKaSshiState.listeners.delete(fn);
}

// Mark that user has seen the inline KaSshi player (call from TTTVMini)
export function markKaSshiInlineVisited() {
  localStorage.setItem(KASSHI_INLINE_KEY, 'true');
}

// Initialize from localStorage
try {
  globalKaSshiState.active = localStorage.getItem(KASSHI_STORAGE_KEY) === 'true';
} catch {}

export default function KaSshiPlayer() {
  const location = useLocation();
  const [active, setActive] = useState(globalKaSshiState.active);
  const [minimized, setMinimized] = useState(false);
  const [position, setPosition] = useState(() => {
    try {
      const s = localStorage.getItem(KASSHI_POS_KEY);
      return s ? JSON.parse(s) : { x: 16, y: 120 };
    } catch { return { x: 16, y: 120 }; }
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const playerRef = useRef(null);
  const prevPathRef = useRef(location.pathname);

  // Pages where KaSshi inline iframe is embedded — hide mini player there
  const isInlinePage = location.pathname === '/' || location.pathname === '/TTTV2';

  useEffect(() => {
    return subscribeKaSshi((val) => {
      setActive(val);
      if (val) setMinimized(false);
    });
  }, []);

  // Auto-activate mini player when leaving a page with inline KaSshi
  useEffect(() => {
    const prevPath = prevPathRef.current;
    prevPathRef.current = location.pathname;

    const wasInline = prevPath === '/' || prevPath === '/TTTV2';
    const hasVisited = localStorage.getItem(KASSHI_INLINE_KEY) === 'true';

    if (wasInline && !isInlinePage && hasVisited) {
      // User left the landing page where KaSshi was playing — launch mini player
      setKaSshiGlobal(true);
      setActive(true);
    }
  }, [location.pathname]);

  // Dragging
  const handleDragStart = (e) => {
    e.preventDefault();
    const rect = playerRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragStartRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setIsDragging(true);
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    if (!isDragging) return;
    const move = (e) => {
      const x = Math.max(0, Math.min(window.innerWidth - 80, e.clientX - dragStartRef.current.x));
      const y = Math.max(0, Math.min(window.innerHeight - 80, e.clientY - dragStartRef.current.y));
      setPosition({ x, y });
    };
    const up = () => {
      setIsDragging(false);
      document.body.style.userSelect = '';
      localStorage.setItem(KASSHI_POS_KEY, JSON.stringify(position));
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [isDragging, position]);

  const handleClose = () => {
    setKaSshiGlobal(false);
    setActive(false);
  };

  if (!active) return null;

  // On inline pages, hide visually but keep iframe mounted so music doesn't stop
  const hidden = isInlinePage;

  return (
    <div
      ref={playerRef}
      className="fixed z-[9998]"
      style={{
        left: position.x,
        top: position.y,
        width: minimized ? 'auto' : 340,
        height: minimized ? 'auto' : 440,
        transition: isDragging ? 'none' : 'transform 0.15s',
        // Hide on inline pages but keep mounted
        ...(hidden ? { width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none', opacity: 0 } : {}),
      }}
    >
      {/* Minimized pill UI — shown on top when minimized */}
      {minimized && !hidden && (
        <div
          className="cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleDragStart}
        >
          <div className="bg-black border-2 border-purple-500 rounded-2xl shadow-[0_0_25px_rgba(168,85,247,0.5)] p-2.5 flex items-center gap-2">
            <Music className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="text-white text-[11px] font-bold">KaSshi</span>
            <button onClick={(e) => { e.stopPropagation(); setMinimized(false); }} className="p-1 hover:bg-white/10 rounded"><Maximize className="w-3.5 h-3.5 text-purple-400" /></button>
            <button onClick={(e) => { e.stopPropagation(); handleClose(); }} className="p-1 hover:bg-red-500/20 rounded"><X className="w-3.5 h-3.5 text-red-400" /></button>
          </div>
        </div>
      )}

      {/* Full player + iframe — iframe ALWAYS stays mounted, just hidden when minimized */}
      <div
        className="bg-black border-2 border-purple-500 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.4)] flex flex-col"
        style={{
          width: 340,
          height: 440,
          ...(minimized ? { position: 'absolute', left: -9999, top: -9999, pointerEvents: 'none' } : {}),
        }}
      >
        {/* Header — draggable */}
        <div
          onMouseDown={handleDragStart}
          className="bg-black/95 px-3 py-2 flex items-center justify-between border-b border-purple-500/30 cursor-grab active:cursor-grabbing select-none flex-shrink-0"
        >
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="text-white text-xs font-bold">KaSshi.io</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); setMinimized(true); }} className="p-1.5 hover:bg-white/10 rounded" title="Minimize"><Minimize2 className="w-3.5 h-3.5 text-purple-400" /></button>
            <button onClick={(e) => { e.stopPropagation(); handleClose(); }} className="p-1.5 hover:bg-red-500/20 rounded" title="Close"><X className="w-3.5 h-3.5 text-red-400" /></button>
          </div>
        </div>
        {/* Iframe — NEVER unmounted so music keeps playing */}
        <iframe
          src="https://kasshi.io"
          title="KaSshi.io"
          className="w-full flex-1 border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
        />
      </div>
    </div>
  );
}