import React, { useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Crosshair, Radio } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { MORPH_SHAPES, buildMorphPath, getMorphKeyframes, sampleShapeMorph } from '@/lib/etaShapeMorph';
import ETAFormField, { etaInput } from './ETAFormField';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const upsertKeyframe = (frames, frame) => {
  const kept = frames.filter((f) => Math.abs(f.time - frame.time) > 0.05);
  return [...kept, frame].sort((a, b) => a.time - b.time);
};

const saveLearning = (frames, duration, advanced) => {
  const shapes = frames.map((f) => f.shape).filter(Boolean);
  const holds = frames.map((f) => Number(f.hold)).filter((v) => Number.isFinite(v) && v > 0);
  return base44.entities.ETAMorphLearning.create({
    shape_sequence: shapes.join('→'),
    hold: holds.length ? Number((holds.reduce((a, b) => a + b, 0) / holds.length).toFixed(2)) : 0.25,
    palette: `${advanced.shapeStrokeColor || '#ffffff'} stroke on ${advanced.shapeBackground || 'dark'} scene`,
    motion_note: `${shapes.length} shape keyframes across ${duration}s`,
  }).catch(() => {});
};

export default function ETAShapeMorphStudio({ scene, advanced = {}, setAdvanced }) {
  const duration = Math.max(1, Number(scene.duration) || 3);
  const keyframes = getMorphKeyframes(advanced, duration);
  const [time, setTime] = useState(0);
  const [recording, setRecording] = useState(false);
  const [dragPos, setDragPos] = useState(null);
  const stageRef = useRef(null);
  const dragRef = useRef(null);
  const state = sampleShapeMorph(keyframes, time, duration);

  const applyKeyframes = (next) => setAdvanced('shapeKeyframes', next);
  const currentFrame = (x, y, extra = {}) => ({
    time: Number(time.toFixed(2)),
    shape: state.toShape || 'circle',
    x, y,
    rotate: state.rotate,
    scale: state.scale,
    hold: state.hold ?? 0.25,
    easing: state.easing || 'ease-in-out',
    ...extra,
  });

  const nudge = (dx, dy) => applyKeyframes(upsertKeyframe(keyframes, currentFrame(clamp(state.x + dx, -150, 150), clamp(state.y + dy, -150, 150))));
  const pickShape = (nextShape) => applyKeyframes(upsertKeyframe(keyframes, currentFrame(state.x, state.y, { shape: nextShape })));

  const handlePointerDown = (event) => {
    if (!stageRef.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = stageRef.current.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      rect,
      startX: event.clientX,
      startY: event.clientY,
      baseX: dragPos?.x ?? state.x,
      baseY: dragPos?.y ?? state.y,
      startTime: time,
      startWall: performance.now(),
      captured: [],
      lastCapture: 0,
      moved: false,
    };
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    const scale = drag.rect.width / 320;
    const x = clamp(drag.baseX + (event.clientX - drag.startX) / scale, -150, 150);
    const y = clamp(drag.baseY + (event.clientY - drag.startY) / scale, -150, 150);
    drag.moved = true;
    drag.lastPos = { x, y };
    setDragPos({ x, y });
    if (recording) {
      const t = Math.min(duration - 0.05, drag.startTime + (performance.now() - drag.startWall) / 1000);
      if (performance.now() - drag.lastCapture >= 100) {
        drag.lastCapture = performance.now();
        drag.captured.push(currentFrame(x, y, { time: Number(t.toFixed(2)), hold: 0.15 }));
      }
    }
  };

  const handlePointerUp = (event) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    dragRef.current = null;
    setDragPos(null);
    if (!drag.moved) return;
    if (recording && drag.captured.length) {
      const endT = Math.min(duration - 0.05, drag.startTime + (performance.now() - drag.startWall) / 1000);
      drag.captured.push(currentFrame(drag.lastPos.x, drag.lastPos.y, { time: Number(endT.toFixed(2)), hold: 0.15 }));
      const startT = drag.captured[0].time;
      const outside = keyframes.filter((f) => f.time < startT - 0.05 || f.time > endT + 0.05);
      const merged = [...outside, ...drag.captured].sort((a, b) => a.time - b.time);
      applyKeyframes(merged);
      saveLearning(merged, duration, advanced);
    } else if (drag.lastPos) {
      applyKeyframes(upsertKeyframe(keyframes, currentFrame(drag.lastPos.x, drag.lastPos.y)));
    }
  };

  const display = dragPos ?? { x: state.x, y: state.y };
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Shape Morph Studio</h2>
          <p className="text-[11px] text-muted-foreground">Drag the shape · arrows nudge · Record auto-frames the path</p>
        </div>
        <button onClick={() => setRecording(!recording)} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${recording ? 'border-red-500/60 text-red-400' : 'border-border'}`}>
          <Radio className={`h-3.5 w-3.5 ${recording ? 'animate-pulse' : ''}`} />
          {recording ? 'Recording' : 'Record'}
        </button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Shape at {time.toFixed(2)}s</span>
        <select value={state.toShape || 'circle'} onChange={(e) => pickShape(e.target.value)} className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs">
          {MORPH_SHAPES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div
        ref={stageRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative mx-auto aspect-square w-full max-w-[300px] cursor-grab touch-none overflow-hidden rounded-2xl border border-border bg-background active:cursor-grabbing"
      >
        <svg viewBox="-160 -160 320 320" className="pointer-events-none h-full w-full">
          <g transform={`translate(${display.x} ${display.y}) rotate(${state.rotate}) scale(${state.scale})`}>
            <path
              d={buildMorphPath(state.radii)}
              fill={advanced.shapeFillColor || '#ffffff'}
              fillOpacity={Number(advanced.shapeFillOpacity ?? 0.12)}
              stroke={advanced.shapeStrokeColor || '#ffffff'}
              strokeWidth={Number(advanced.shapeStrokeWidth ?? 2)}
              strokeLinejoin="round"
            />
          </g>
        </svg>
        <div className="pointer-events-none absolute left-2 top-2 rounded bg-background/80 px-2 py-1 text-[10px] text-muted-foreground">
          {time.toFixed(2)}s · {state.fromShape}→{state.toShape} · {Math.round(state.morphT * 100)}%
        </div>
        {recording && <div className="pointer-events-none absolute right-2 top-2 flex items-center gap-1 rounded bg-background/80 px-2 py-1 text-[10px] font-semibold text-red-400"><span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />REC</div>}
      </div>
      <ETAFormField label={`Timeline scrub (${time.toFixed(2)}s / ${duration}s)`}>
        <input className="w-full accent-foreground" type="range" min={0} max={duration} step={0.05} value={time} onChange={(e) => setTime(Number(e.target.value))} />
      </ETAFormField>
      <div className="grid w-[150px] grid-cols-3 gap-1">
        <div />
        <button onClick={() => nudge(0, -8)} className="flex items-center justify-center rounded-lg border border-border py-2" title="Move up"><ArrowUp className="h-3.5 w-3.5" /></button>
        <div />
        <button onClick={() => nudge(-8, 0)} className="flex items-center justify-center rounded-lg border border-border py-2" title="Move left"><ArrowLeft className="h-3.5 w-3.5" /></button>
        <button onClick={() => applyKeyframes(upsertKeyframe(keyframes, currentFrame(0, 0)))} className="flex items-center justify-center rounded-lg border border-border py-2" title="Recenter"><Crosshair className="h-3.5 w-3.5" /></button>
        <button onClick={() => nudge(8, 0)} className="flex items-center justify-center rounded-lg border border-border py-2" title="Move right"><ArrowRight className="h-3.5 w-3.5" /></button>
        <div />
        <button onClick={() => nudge(0, 8)} className="flex items-center justify-center rounded-lg border border-border py-2" title="Move down"><ArrowDown className="h-3.5 w-3.5" /></button>
        <div />
      </div>
    </section>
  );
}