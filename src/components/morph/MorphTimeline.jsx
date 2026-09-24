import React, { useRef, useState } from 'react';
import { ArrowRightLeft, ChevronDown, ChevronRight, Flag, Link2, X } from 'lucide-react';
import { EASES, clamp, layerKeyTimes, timecode } from './morphEngine';
import MorphTimelineAgent from './MorphTimelineAgent';

const MODES = [
  { id: 'simple', label: 'Simple' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'agent', label: 'Agent' },
];

// Property tracks, grouped the way a motion designer thinks about them.
const PROP_GROUPS = [
  {
    label: 'Transform',
    rows: [['x', 'Position'], ['y', 'Position Y'], ['scale', 'Scale'], ['rotation', 'Rotation'], ['opacity', 'Opacity']],
  },
  { label: 'Appearance', rows: [['glow', 'Glow']] },
  { label: 'Morph', rows: [['morph', 'Path']] },
];

const EASE_LABELS = {
  linear: 'Linear',
  easeIn: 'Ease In',
  easeOut: 'Ease Out',
  easeInOut: 'Ease In Out',
  backOut: 'Back Out',
  backIn: 'Back In',
  anticipate: 'Anticipate',
  cubicBezier: 'Cubic Bezier',
  spring: 'Spring',
  bounce: 'Bounce',
  elastic: 'Elastic',
  hold: 'Hold',
};

const ADD_STEPS = [0.5, 1, 2, 5];
const LABEL_W = 128;

/**
 * The timeline. Three modes over one model: Simple (blocks of keyframes),
 * Advanced (property tracks you can retime and re-ease), Agent (the animation
 * described). The composition length is draggable and extendable at the end of
 * the ruler.
 */
export default function MorphTimeline({
  scene,
  time,
  mode = 'simple',
  onModeChange,
  onSeek,
  onDuration,
  onAddTime,
  selectedId,
  onSelect,
  keySel,
  onSelectKey,
  onEaseKey,
  onMoveKey,
  onDeleteKey,
  morphSel,
  onSelectMorph,
  onMoveMorph,
  transitionSel,
  onSelectTransition,
  onMoveTransition,
  onAddMarker,
  onRemoveMarker,
  dynamics,
  onEditDynamics,
}) {
  const rulerRef = useRef(null);
  const scrubbing = useRef(false);
  const [collapsed, setCollapsed] = useState([]);
  const [expanded, setExpanded] = useState([]);

  const duration = Math.max(0.5, scene.duration || 3);
  const pct = Math.min(100, (time / duration) * 100);
  const markers = scene.markers || [];

  const seekFrom = (clientX) => {
    const rect = rulerRef.current.getBoundingClientRect();
    onSeek(clamp((clientX - rect.left) / rect.width, 0, 1) * duration);
  };

  const startScrub = (e) => {
    scrubbing.current = true;
    seekFrom(e.clientX);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const startDurationDrag = (e) => {
    e.stopPropagation();
    const rect = rulerRef.current.getBoundingClientRect();
    const x0 = e.clientX;
    const d0 = duration;
    const move = (ev) => onDuration(clamp(d0 + ((ev.clientX - x0) / rect.width) * d0, 0.5, 120));
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  const startKeyDrag = (e, layerId, prop, t) => {
    e.stopPropagation();
    onSelectKey({ layerId, prop, t });
    const rect = rulerRef.current.getBoundingClientRect();
    const x0 = e.clientX;
    let cur = t;
    let active = false;
    const move = (ev) => {
      if (!active && Math.abs(ev.clientX - x0) < 4) return;
      active = true;
      const nt = clamp(((ev.clientX - rect.left) / rect.width) * duration, 0, duration);
      onMoveKey(layerId, prop, cur, nt);
      cur = Math.round(nt * 1000) / 1000;
      onSelectKey({ layerId, prop, t: cur });
      onSeek(nt);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  // A relation bar drags along the ruler: its start time, never past the end of
  // the composition. Shared by morphs and match cuts.
  const startBarDrag = (e, item, onMove) => {
    e.stopPropagation();
    const rect = rulerRef.current.getBoundingClientRect();
    const x0 = e.clientX;
    const s0 = item.start || 0;
    let active = false;
    const handleMove = (ev) => {
      if (!active && Math.abs(ev.clientX - x0) < 4) return;
      active = true;
      const ns = clamp(s0 + ((ev.clientX - x0) / rect.width) * duration, 0, Math.max(0, duration - (item.duration || 1)));
      onMove(ns);
      onSeek(ns);
    };
    const up = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  const ticks = [];
  for (let s = 0; s <= duration + 0.001; s += 0.5) ticks.push(Math.round(s * 100) / 100);

  const groupNames = [];
  scene.layers.forEach((l) => {
    if (l.group && !groupNames.includes(l.group)) groupNames.push(l.group);
  });
  const loose = scene.layers.filter((l) => !l.group);
  const morphs = scene.morphs || [];
  const cuts = scene.transitions || [];
  const nameOf = (id) => scene.layers.find((l) => l.id === id)?.name || '—';

  const laneBase = (isSelected) =>
    `relative flex-1 h-6 rounded bg-white/[0.04] cursor-pointer ${isSelected ? 'ring-1 ring-white/25' : ''}`;

  const layerRow = (layer) => {
    const open = expanded.includes(layer.id) || (mode === 'advanced' && layer.id === selectedId);
    const times = layerKeyTimes(layer);
    const isSelected = selectedId === layer.id;

    return (
      <React.Fragment key={layer.id}>
        <div className="flex items-center gap-2">
          <div style={{ width: LABEL_W }} className="shrink-0 flex items-center gap-1">
            {mode === 'advanced' && (
              <button
                onClick={() => setExpanded((x) => (open ? x.filter((i) => i !== layer.id) : [...x, layer.id]))}
                className="p-0.5 text-white/40 hover:text-white"
              >
                {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
            )}
            <button
              onClick={() => onSelect(layer.id)}
              className={`flex-1 min-w-0 text-left truncate text-[11px] px-1.5 py-0.5 rounded transition-colors ${
                isSelected ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/80'
              }`}
            >
              {layer.name}
            </button>
          </div>
          <div
            onClick={(e) => {
              onSelect(layer.id);
              seekFrom(e.clientX);
            }}
            className={laneBase(isSelected)}
          >
            {times.map((t) => (
              <div
                key={t}
                title={`${t.toFixed(2)}s`}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-white"
                style={{ left: `${(t / duration) * 100}%` }}
              />
            ))}
            <div className="absolute top-0 bottom-0 w-px bg-white/70 pointer-events-none" style={{ left: `${pct}%` }} />
          </div>
        </div>

        {mode === 'advanced' && open && PROP_GROUPS.map((group) => {
          const rows = group.rows
            .map(([prop, label]) => ({ prop, label, list: layer.tracks?.[prop] || [] }))
            .filter((r) => r.list.length);
          if (!rows.length) return null;
          return (
            <React.Fragment key={group.label}>
              <div className="flex items-center gap-2">
                <span style={{ width: LABEL_W }} className="shrink-0 pl-6 text-[9px] uppercase tracking-wider text-white/25">
                  {group.label}
                </span>
                <div className="flex-1" />
              </div>
              {rows.map((r) => (
                <div key={r.prop} className="flex items-center gap-2">
                  <span style={{ width: LABEL_W }} className="shrink-0 pl-9 truncate text-[10px] text-white/35">{r.label}</span>
                  <div className="relative flex-1 h-5 rounded bg-white/[0.03]">
                    {r.list.map((k) => {
                      const selected =
                        keySel && keySel.layerId === layer.id && keySel.prop === r.prop && Math.abs(keySel.t - k.t) < 0.004;
                      return (
                        <button
                          key={k.t}
                          onPointerDown={(e) => startKeyDrag(e, layer.id, r.prop, k.t)}
                          title={`${k.t.toFixed(2)}s · ${EASE_LABELS[k.ease] || k.ease}`}
                          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 border cursor-ew-resize ${
                            selected ? 'bg-white border-white' : 'bg-white/70 border-white/40 hover:bg-white'
                          }`}
                          style={{ left: `${(k.t / duration) * 100}%` }}
                        />
                      );
                    })}
                    <div className="absolute top-0 bottom-0 w-px bg-white/50 pointer-events-none" style={{ left: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </React.Fragment>
          );
        })}
      </React.Fragment>
    );
  };

  const groupRow = (name) => {
    const members = scene.layers.filter((l) => l.group === name);
    const isCollapsed = collapsed.includes(name);
    const times = [...new Set(members.flatMap((l) => layerKeyTimes(l)))].sort((a, b) => a - b);
    return (
      <React.Fragment key={name}>
        <div className="flex items-center gap-2">
          <button
            style={{ width: LABEL_W }}
            onClick={() => setCollapsed((c) => (isCollapsed ? c.filter((x) => x !== name) : [...c, name]))}
            className="shrink-0 flex items-center gap-1 px-1 py-0.5 text-[11px] font-semibold text-white/80 hover:text-white"
          >
            {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            <span className="truncate">{name}</span>
          </button>
          <div className="relative flex-1 h-5 rounded bg-white/[0.05] border border-white/10">
            {times.map((t) => (
              <div
                key={t}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-white/45"
                style={{ left: `${(t / duration) * 100}%` }}
              />
            ))}
            <div className="absolute top-0 bottom-0 w-px bg-white/70 pointer-events-none" style={{ left: `${pct}%` }} />
          </div>
        </div>
        {!isCollapsed && members.map((l) => layerRow(l))}
      </React.Fragment>
    );
  };

  return (
    <div className="bg-[#0b0b0b]">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-1.5 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Timeline</span>
        <span className="text-[11px] tabular-nums text-white/70">{timecode(time, scene.fps || 30)}</span>
        <span className="text-[11px] tabular-nums text-white/30">/ {duration.toFixed(2)}s</span>

        <div className="flex rounded-lg overflow-hidden border border-white/10 ml-1">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => onModeChange(m.id)}
              className={`px-2 py-0.5 text-[10px] transition-colors ${
                mode === m.id ? 'bg-white/20 text-white' : 'text-white/45 hover:text-white'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 ml-auto">
          {ADD_STEPS.map((s) => (
            <button
              key={s}
              onClick={() => onAddTime(s)}
              title={`Extend the composition by ${s}s`}
              className="px-1.5 py-0.5 rounded border border-white/12 text-[10px] text-white/50 hover:text-white hover:border-white/40 transition-colors"
            >
              +{s}s
            </button>
          ))}
        </div>
      </div>

      {/* Ruler */}
      <div className="flex items-stretch px-3">
        <div style={{ width: LABEL_W }} className="shrink-0" />
        <div
          ref={rulerRef}
          onPointerDown={startScrub}
          onPointerMove={(e) => { if (scrubbing.current) seekFrom(e.clientX); }}
          onPointerUp={() => { scrubbing.current = false; }}
          onPointerCancel={() => { scrubbing.current = false; }}
          className="relative flex-1 h-7 cursor-ew-resize select-none border-b border-white/10"
        >
          {ticks.map((t) => (
            <div key={t} className="absolute top-0 h-full" style={{ left: `${(t / duration) * 100}%` }}>
              <div className="w-px h-2.5 bg-white/20" />
              {Number.isInteger(t) && (
                <span className="absolute top-3 -translate-x-1/2 text-[9px] tabular-nums text-white/30">{t}s</span>
              )}
            </div>
          ))}
          <div className="absolute top-0 bottom-0 w-px bg-white pointer-events-none" style={{ left: `${pct}%` }}>
            <div className="absolute -top-0.5 -left-[5px] w-2.5 h-2.5 rotate-45 bg-white" />
          </div>
          <div
            onPointerDown={startDurationDrag}
            title="Drag to change the composition length"
            className="absolute -right-1 top-0 bottom-0 w-3 flex items-center justify-center cursor-ew-resize group"
          >
            <div className="w-1 h-full bg-white/35 group-hover:bg-white/90 rounded transition-colors" />
          </div>
        </div>
      </div>

      {mode === 'agent' ? (
        <MorphTimelineAgent scene={scene} dynamics={dynamics} onEditDynamics={onEditDynamics} />
      ) : (
        <>
          {/* Markers */}
          <div className="flex items-stretch px-3 border-b border-white/5">
            <div style={{ width: LABEL_W }} className="shrink-0 flex items-center">
              <button
                onClick={() => onAddMarker(time)}
                title="Add a marker at the playhead"
                className="flex items-center gap-1 px-1.5 py-0.5 text-[9px] text-white/40 hover:text-white transition-colors"
              >
                <Flag className="w-3 h-3" />
                Marker
              </button>
            </div>
            <div className="relative flex-1 h-5">
              {markers.map((m) => (
                <div
                  key={m.id}
                  className="absolute top-0.5 -translate-x-1/2 flex items-center gap-1 px-1 rounded bg-white/10 border border-white/20 text-[9px] text-white/70"
                  style={{ left: `${(m.t / duration) * 100}%` }}
                >
                  <button onClick={() => onSeek(m.t)} className="hover:text-white truncate max-w-[80px]">{m.label}</button>
                  <button onClick={() => onRemoveMarker(m.id)} className="text-white/40 hover:text-red-300">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Keyframe interpolation */}
          {keySel && (
            <div className="flex items-center gap-1 px-3 py-1.5 border-b border-white/10 bg-white/[0.03] flex-wrap">
              <span className="text-[10px] text-white/50 mr-1">
                {(PROP_GROUPS.flatMap((g) => g.rows).find(([p]) => p === keySel.prop)?.[1]) || keySel.prop} @ {keySel.t.toFixed(2)}s
              </span>
              {Object.keys(EASES).map((e) => (
                <button
                  key={e}
                  onClick={() => onEaseKey(e)}
                  className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                    keySel.ease === e ? 'bg-white text-black' : 'text-white/50 hover:text-white'
                  }`}
                >
                  {EASE_LABELS[e] || e}
                </button>
              ))}
              <button onClick={onDeleteKey} className="ml-auto text-[10px] text-white/40 hover:text-red-300">
                Delete key
              </button>
            </div>
          )}

          {/* Lanes */}
          <div className="px-3 py-2 space-y-1 max-h-40 overflow-y-auto">
            {/* A match cut spans both scenes, so it sits above everything else. */}
            {cuts.length > 0 && (
              <div className="space-y-1 pb-1 mb-1 border-b border-white/5">
                {cuts.map((cut) => {
                  const on = transitionSel === cut.id;
                  const left = ((cut.start || 0) / duration) * 100;
                  const width = Math.max(2, ((cut.duration || 1) / duration) * 100);
                  return (
                    <div key={cut.id} className="flex items-center gap-2">
                      <div style={{ width: LABEL_W }} className="shrink-0 flex items-center gap-1">
                        <ArrowRightLeft className="w-3 h-3 shrink-0 text-cyan-300/70" />
                        <button
                          onClick={() => onSelectTransition(cut.id)}
                          className={`flex-1 min-w-0 text-left truncate text-[11px] px-1.5 py-0.5 rounded transition-colors ${
                            on ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/80'
                          }`}
                        >
                          Match cut
                        </button>
                      </div>
                      <div className="relative flex-1 h-6 rounded bg-white/[0.04]">
                        <button
                          onPointerDown={(e) => startBarDrag(e, cut, (ns) => onMoveTransition?.(cut.id, { start: ns }))}
                          title={`${nameOf(cut.from)} → ${nameOf(cut.to)} · ${cut.duration}s · ${EASE_LABELS[cut.easing] || cut.easing}`}
                          style={{ left: `${left}%`, width: `${width}%` }}
                          className={`absolute top-0.5 bottom-0.5 rounded flex items-center gap-1 px-1.5 overflow-hidden cursor-ew-resize text-[9px] ${
                            on
                              ? 'bg-gradient-to-r from-cyan-200 to-white text-black'
                              : 'bg-gradient-to-r from-cyan-400/30 to-white/25 text-white/80 hover:from-cyan-300/50 hover:to-white/40'
                          }`}
                        >
                          <span className="truncate">{nameOf(cut.from)} → {nameOf(cut.to)}</span>
                        </button>
                        <div className="absolute top-0 bottom-0 w-px bg-white/70 pointer-events-none" style={{ left: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Morphs sit above the layers: they are the relationships between them. */}
            {morphs.length > 0 && (
              <div className="space-y-1 pb-1 mb-1 border-b border-white/5">
                {morphs.map((rel) => {
                  const on = morphSel === rel.id;
                  const left = ((rel.start || 0) / duration) * 100;
                  const width = Math.max(2, ((rel.duration || 1) / duration) * 100);
                  return (
                    <div key={rel.id} className="flex items-center gap-2">
                      <div style={{ width: LABEL_W }} className="shrink-0 flex items-center gap-1">
                        <Link2 className="w-3 h-3 shrink-0 text-white/35" />
                        <button
                          onClick={() => onSelectMorph(rel.id)}
                          className={`flex-1 min-w-0 text-left truncate text-[11px] px-1.5 py-0.5 rounded transition-colors ${
                            on ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/80'
                          }`}
                        >
                          Morph
                        </button>
                      </div>
                      <div className="relative flex-1 h-6 rounded bg-white/[0.04]">
                        <button
                          onPointerDown={(e) => startBarDrag(e, rel, (ns) => onMoveMorph?.(rel.id, { start: ns }))}
                          title={`${nameOf(rel.from)} → ${nameOf(rel.to)} · ${rel.duration}s · ${EASE_LABELS[rel.easing] || rel.easing}`}
                          style={{ left: `${left}%`, width: `${width}%` }}
                          className={`absolute top-0.5 bottom-0.5 rounded flex items-center gap-1 px-1.5 overflow-hidden cursor-ew-resize text-[9px] ${
                            on ? 'bg-white text-black' : 'bg-white/20 text-white/70 hover:bg-white/30'
                          }`}
                        >
                          <span className="truncate">{nameOf(rel.from)} → {nameOf(rel.to)}</span>
                        </button>
                        <div className="absolute top-0 bottom-0 w-px bg-white/70 pointer-events-none" style={{ left: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {scene.layers.length === 0 && <p className="text-[11px] text-white/35 py-2">No layers yet.</p>}
            {groupNames.map((g) => groupRow(g))}
            {loose.map((l) => layerRow(l))}
          </div>
        </>
      )}
    </div>
  );
}