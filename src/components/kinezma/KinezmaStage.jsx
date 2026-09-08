import React, { useEffect, useRef, useState } from 'react';
import { stateAt, fitFontSize } from './kinezmaEngine';

/**
 * The live scene: every component positioned in scene-pixel space, scaled to
 * fit the container. Supports click-to-select, drag-to-move, and applies the
 * interpolated motion state on top of each component while playing.
 */
export default function KinezmaStage({ scene, cutouts, motion, time, selected, onSelect, onMove, showBadges = true }) {
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    // fit BOTH dimensions so tall images never overflow the viewport
    const update = () =>
      setScale(Math.min(el.clientWidth / scene.width, el.clientHeight / scene.height) || 0);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [scene.width, scene.height]);

  const state = motion ? stateAt(motion.tracks, time) : {};
  const numbers = {};
  scene.components.forEach((c, i) => { numbers[c.id] = i + 1; });

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
    <div ref={wrapRef} className="w-full h-full flex items-center justify-center select-none overflow-hidden">
      <div className="overflow-hidden" style={{ width: scene.width * scale, height: scene.height * scale }}>
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
              {showBadges && (
                <div
                  className="absolute -top-3 -left-3 flex items-center justify-center rounded-full bg-white text-black font-black pointer-events-none"
                  style={{ width: 36, height: 36, fontSize: 20, lineHeight: 1 }}
                >
                  {numbers[c.id]}
                </div>
              )}
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
                  className="w-full h-full flex pointer-events-none"
                  style={{
                    alignItems: 'center',
                    justifyContent: c.align === 'left' ? 'flex-start' : 'center',
                    color: c.color || '#000',
                    fontSize: fitFontSize(c),
                    fontWeight: Number(c.fontWeight) || 700,
                    fontFamily: c.fontFamily || 'sans-serif',
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
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
    </div>
  );
}