import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Minimize2, Maximize2, GripHorizontal } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const KASSHI_STORAGE_KEY = 'kasshi_player_active';
const KASSHI_POS_KEY = 'kasshi_player_position';
const KASSHI_INLINE_KEY = 'kasshi_inline_visited';

let globalKaSshiState = { active: false, listeners: new Set() };

export function setKaSshiGlobal(active) {
  globalKaSshiState.active = active;
  try { localStorage.setItem(KASSHI_STORAGE_KEY, String(active)); } catch {}
  globalKaSshiState.listeners.forEach(fn => fn(active));
}

export function subscribeKaSshi(fn) {
  globalKaSshiState.listeners.add(fn);
  return () => globalKaSshiState.listeners.delete(fn);
}

export function markKaSshiInlineVisited() {
  try { localStorage.setItem(KASSHI_INLINE_KEY, 'true'); } catch {}
}

try { globalKaSshiState.active = localStorage.getItem(KASSHI_STORAGE_KEY) === 'true'; } catch {}

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

  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const posRef = useRef(position);
  const containerRef = useRef(null);
  const prevPathRef = useRef(location.pathname);

  const isInlinePage = location.pathname === '/' || location.pathname === '/TTTV2';

  useEffect(() => {
    return subscribeKaSshi((val) => {
      setActive(val);
      if (val) setMinimized(false);
    });
  }, []);

  // Auto-activate when leaving inline page
   useEffect(() => {
     const prevPath = prevPathRef.current;
     prevPathRef.current = location.pathname;
     const wasInline = prevPath === '/' || prevPath === '/TTTV2';
     const hasVisited = localStorage.getItem(KASSHI_INLINE_KEY) === 'true';
     if (wasInline && !isInlinePage && hasVisited) {
       // Only activate if not already active and not minimized
       if (!active || minimized) {
         setKaSshiGlobal(true);
         setActive(true);
         setMinimized(false);
       }
     }
   }, [location.pathname, active, minimized]);

  // Pointer-based drag (mouse + touch)
  const handlePointerDown = useCallback((e) => {
    if (e.target.closest('button')) return;
    e.preventDefault();
    isDraggingRef.current = true;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    el.setPointerCapture(e.pointerId);
    document.body.style.userSelect = 'none';
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!isDraggingRef.current) return;
    const x = Math.max(0, Math.min(window.innerWidth - 60, e.clientX - dragOffsetRef.current.x));
    const y = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragOffsetRef.current.y));
    posRef.current = { x, y };
    setPosition({ x, y });
  }, []);

  const handlePointerUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    document.body.style.userSelect = '';
    try { localStorage.setItem(KASSHI_POS_KEY, JSON.stringify(posRef.current)); } catch {}
  }, []);

  useEffect(() => { posRef.current = position; }, [position]);

  const handleClose = () => {
    setKaSshiGlobal(false);
    setActive(false);
    localStorage.removeItem(KASSHI_INLINE_KEY);
  };

  // Don't render anything if not active
  if (!active) return null;

  // On inline pages: completely hide but keep iframe alive
  const hidden = isInlinePage;

  return (
    <>
      <style>{`
        @keyframes kasshi-glow-pulse {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.7; }
        }
        .kasshi-eq-bar {
          display: inline-block;
          width: 3px;
          border-radius: 2px;
          background: linear-gradient(to top, #a855f7, #06b6d4);
          animation: kasshi-eq 0.8s ease-in-out infinite alternate;
        }
        .kasshi-eq-bar:nth-child(1) { height: 8px; animation-delay: 0s; }
        .kasshi-eq-bar:nth-child(2) { height: 14px; animation-delay: 0.15s; }
        .kasshi-eq-bar:nth-child(3) { height: 6px; animation-delay: 0.3s; }
        .kasshi-eq-bar:nth-child(4) { height: 12px; animation-delay: 0.45s; }
        @keyframes kasshi-eq {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1); }
        }
      `}</style>

      {/*
        CRITICAL: One single container that is NEVER unmounted.
        The iframe lives here permanently. We only toggle visibility via CSS.
      */}
      <div
        ref={containerRef}
        className="fixed z-[9998] select-none touch-none"
        style={{
          left: hidden ? -9999 : position.x,
          top: hidden ? -9999 : position.y,
          opacity: hidden ? 0 : 1,
          pointerEvents: hidden ? 'none' : 'auto',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* ── Minimized pill ── always rendered, visibility toggled via position */}
        <div
          className="cursor-grab active:cursor-grabbing"
          style={{
            position: minimized ? 'relative' : 'absolute',
            left: minimized ? 0 : -9999,
            top: minimized ? 0 : -9999,
            pointerEvents: minimized ? 'auto' : 'none',
          }}
        >
          <div className="relative group">
            <div
              className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500 rounded-2xl blur-md transition-opacity"
              style={{ animation: 'kasshi-glow-pulse 3s ease-in-out infinite', opacity: 0.4 }}
            />
            <div className="relative bg-black/90 backdrop-blur-xl border border-white/15 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 shadow-2xl">
              <GripHorizontal className="w-3 h-3 text-white/20 flex-shrink-0" />
              <div className="flex items-end gap-[2px] h-[14px]">
                <span className="kasshi-eq-bar" />
                <span className="kasshi-eq-bar" />
                <span className="kasshi-eq-bar" />
                <span className="kasshi-eq-bar" />
              </div>
              <span className="text-white/90 text-[11px] font-bold tracking-wide">KaSshi</span>
              <div className="flex items-center gap-0.5 ml-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setMinimized(false); }}
                  className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleClose(); }}
                  className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-white/40 hover:text-red-400" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Expanded player shell ── ALWAYS keeps full dimensions and stays mounted.
            When minimized we just shove it off-screen — never collapse height/width or use
            display:none/visibility:hidden, since those can pause iframe audio. */}
        <div
          className="group"
          style={{
            width: 350,
            height: 460,
            position: minimized ? 'absolute' : 'relative',
            left: minimized ? -9999 : 0,
            top: minimized ? -9999 : 0,
            pointerEvents: minimized ? 'none' : 'auto',
          }}
        >
          <div
            className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-purple-500 via-cyan-400 to-purple-500 blur-sm transition-opacity"
            style={{ opacity: 0.5 }}
          />
          <div className="relative bg-black/95 backdrop-blur-2xl rounded-2xl overflow-hidden h-full border border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.7)] flex flex-col">
            <div className="px-3 py-2.5 flex items-center justify-between cursor-grab active:cursor-grabbing flex-shrink-0 bg-gradient-to-r from-black via-zinc-900/50 to-black border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <GripHorizontal className="w-3.5 h-3.5 text-white/20" />
                <div className="flex items-end gap-[2px] h-[14px]">
                  <span className="kasshi-eq-bar" />
                  <span className="kasshi-eq-bar" />
                  <span className="kasshi-eq-bar" />
                  <span className="kasshi-eq-bar" />
                </div>
                <span className="text-white/80 text-xs font-bold tracking-wide">KaSshi.io</span>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={(e) => { e.stopPropagation(); setMinimized(true); }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                  title="Minimize"
                >
                  <Minimize2 className="w-3.5 h-3.5 text-cyan-400" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleClose(); }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/20 transition-colors"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5 text-white/40 hover:text-red-400" />
                </button>
              </div>
            </div>
            {/* IFRAME — ALWAYS in this exact spot in the tree, NEVER unmounted */}
            <iframe
              src="https://kasshi.io"
              title="KaSshi.io"
              className="w-full flex-1 border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; microphone; camera"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation allow-popups-to-escape-sandbox allow-downloads"
            />
          </div>
        </div>
      </div>
    </>
  );
}