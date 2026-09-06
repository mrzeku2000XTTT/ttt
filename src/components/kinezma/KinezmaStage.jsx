import React, { useEffect, useRef, useState } from 'react';
import { stateAt } from './kinezmaEngine';

/**
 * The live scene: every component positioned in scene-pixel space, scaled to
 * fit the container. Supports click-to-select, drag-to-move, and applies the
 * interpolated motion state on top of each component while playing.
 */
export default function KinezmaStage({ scene, cutouts, motion, time, selected, onSelect, onMove }) {
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / scene.width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [scene.width]);

  const state = motion ? stateAt(motion.tracks, time) : {};

  const startDrag = (e, c) => {
    if (e.button !== 0) return;
    onSelect?.(c.id);
    const startX = e.clientX;
    const startY = e.clientY;
    const baseX = c.x;
    const baseY = c.y;
    const move = (ev) => {
      onMove(c.id, baseX + (ev.clientX - startX) / scale, baseY + (ev.clientY - startY) / scale);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div ref={wrapRef} className="w-full select-none" style={{ aspectRatio: `${scene.width} / ${scene.height}` }}>
      <div
        className="relative origin-top-left overflow-hidden"
        style={{
          width: scene.width,
          height: scene.height,
          transform: `scale(${scale})`,
          background: scene.background
        }}
      >
        {[...scene.components].sort((a, b) => (a.z || 0) - (b.z || 0)).map((c) => {
          const st = state[c.id] || { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 };
          return (
            <div
              key={c.id}
              onPointerDown={(e) => startDrag(e, c)}
              title={c.name}
              style={{
                position: 'absolute',
                left: c.x,
                top: c.y,
                width: c.w,
                height: c.h,
                zIndex: c.z || 0,
                transform: `translate(${st.x}px, ${st.y}px) rotate(${st.rotate}deg) scale(${st.scale})`,
                opacity: st.opacity,
                cursor: 'grab',
                outline: selected === c.id ? '2px dashed rgba(255,255,255,0.9)' : 'none',
                outlineOffset: 2
              }}
            >
              {c.kind === 'cutout' ? (
                <img
                  src={cutouts[c.id]}
                  alt={c.name}
                  draggable={false}
                  className="w-full h-full pointer-events-none"
                  style={{ objectFit: 'fill' }}
                />
              ) : c.kind === 'box' ? (
                <div
                  className="w-full h-full pointer-events-none"
                  style={{ background: c.bg || '#000', borderRadius: c.radius || 0, border: c.border || 'none' }}
                />
              ) : (
                <div
                  className="w-full h-full flex pointer-events-none overflow-hidden"
                  style={{
                    alignItems: 'center',
                    justifyContent: c.align === 'left' ? 'flex-start' : 'center',
                    color: c.color || '#000',
                    fontSize: c.fontSize || Math.round(c.h * 0.8),
                    fontWeight: Number(c.fontWeight) || 700,
                    fontFamily: c.fontFamily || 'sans-serif',
                    lineHeight: 1.05,
                    textAlign: c.align === 'left' ? 'left' : 'center',
                    background: c.bg || 'transparent'
                  }}
                >
                  {c.text}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}