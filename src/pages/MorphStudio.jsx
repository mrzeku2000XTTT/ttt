import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Play, Pause, SkipBack, Maximize2, Minimize2, Grid3x3, ZoomIn, ZoomOut,
  Store, RotateCcw, Magnet,
} from 'lucide-react';
import MorphStage from '@/components/morph/MorphStage';
import MorphTimeline from '@/components/morph/MorphTimeline';
import MorphInspector from '@/components/morph/MorphInspector';
import MorphLayers from '@/components/morph/MorphLayers';
import MorphAgent from '@/components/morph/MorphAgent';
import {
  starterScene, makeLayer, upsertKey, removeKey, sampleLayer, clamp, PROPS, DEFAULTS,
} from '@/components/morph/morphEngine';

const STORE_KEY = 'morph_scene_v1';

const loadScene = () => {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.layers?.length) return parsed;
    }
  } catch {}
  return starterScene();
};

export default function MorphStudio() {
  const [scene, setScene] = useState(loadScene);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selectedId, setSelectedId] = useState(() => loadScene().layers[0]?.id || null);
  const [zoom, setZoom] = useState(1);
  const [grid, setGrid] = useState(true);
  const [autoKey, setAutoKey] = useState(true);
  const [split, setSplit] = useState(50);
  const [solo, setSolo] = useState(null);
  const [dir, setDir] = useState('row');

  const areaRef = useRef(null);
  const dragging = useRef(false);

  /* ------------------------------------------------------------- playback */
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      setTime((t) => {
        const next = t + dt;
        return next >= scene.duration ? next % scene.duration : next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, scene.duration]);

  useEffect(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(scene)); } catch {}
  }, [scene]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const apply = () => setDir(mq.matches ? 'col' : 'row');
    apply();
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, []);

  /* --------------------------------------------------------------- editing */
  const updateLayer = useCallback((id, patch, forceKey = false) => {
    setScene((s) => ({
      ...s,
      layers: s.layers.map((l) => {
        if (l.id !== id) return l;
        let next = { ...l };
        Object.entries(patch).forEach(([prop, value]) => {
          if (!PROPS.includes(prop)) {
            next = { ...next, [prop]: value };
            return;
          }
          const hasKeys = (next.tracks?.[prop] || []).length > 0;
          next = forceKey || autoKey || hasKeys
            ? upsertKey({ ...next, [prop]: value }, prop, time, value)
            : { ...next, [prop]: value };
        });
        return next;
      }),
    }));
  }, [autoKey, time]);

  const toggleKey = (id, prop) => {
    setScene((s) => ({
      ...s,
      layers: s.layers.map((l) => {
        if (l.id !== id) return l;
        const existing = (l.tracks?.[prop] || []).some((k) => Math.abs(k.t - time) < 0.003);
        return existing ? removeKey(l, prop, time) : upsertKey(l, prop, time, sampleLayer(l, time)[prop]);
      }),
    }));
  };

  const addLayer = (type) => {
    const layer = type === 'text'
      ? makeLayer({ type: 'text', name: 'Text', text: 'TITLE', size: 0.2, y: 0.8 })
      : makeLayer({ name: 'Shape', shape: 'circle', morphTo: 'star' });
    setScene((s) => ({ ...s, layers: [...s.layers, layer] }));
    setSelectedId(layer.id);
  };

  const deleteLayer = (id) => {
    setScene((s) => ({ ...s, layers: s.layers.filter((l) => l.id !== id) }));
    setSelectedId((cur) => (cur === id ? null : cur));
  };

  const toggleVisible = (id) => {
    setScene((s) => ({ ...s, layers: s.layers.map((l) => (l.id === id ? { ...l, visible: l.visible === false } : l)) }));
  };

  const applyAgentScene = (next) => {
    setScene(next);
    setTime(0);
    setPlaying(false);
    setSelectedId(next.layers[0]?.id || null);
    setSolo(null);
  };

  const reset = () => {
    const fresh = starterScene();
    setScene(fresh);
    setTime(0);
    setPlaying(false);
    setSelectedId(fresh.layers[0]?.id || null);
  };

  /* ---------------------------------------------------------- split panes */
  const onDividerDown = (e) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onDividerMove = (e) => {
    if (!dragging.current || !areaRef.current) return;
    const r = areaRef.current.getBoundingClientRect();
    const p = dir === 'row' ? ((e.clientX - r.left) / r.width) * 100 : ((e.clientY - r.top) / r.height) * 100;
    setSplit(clamp(p, 15, 85));
  };
  const onDividerUp = () => { dragging.current = false; };

  const paneStyle = (id) => {
    if (solo) return solo === id ? { flex: 1 } : { display: 'none' };
    if (id === 'viewport') return dir === 'row' ? { width: `${split}%` } : { height: `${split}%` };
    return { flex: 1 };
  };

  const pane = (id, label) => (
    <div className="flex-1 min-w-0 min-h-0 flex flex-col bg-black">
      <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 border-b border-white/10 bg-[#0b0b0b]">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">{label}</span>
        <div className="flex items-center gap-1.5">
          {id === 'viewport' && (
            <span className="hidden sm:inline text-[10px] text-white/25">drag the RGB handles</span>
          )}
          <button
            onClick={() => setSolo(solo === id ? null : id)}
            title={solo === id ? 'Restore split view' : 'Fullscreen this pane'}
            className="p-1 rounded text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            {solo === id ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden p-2 flex items-start justify-center">
        <div className="w-full aspect-video">
          <MorphStage
            scene={scene}
            time={time}
            mode={id === 'viewport' ? 'edit' : 'final'}
            selectedId={id === 'viewport' ? selectedId : null}
            onSelect={id === 'viewport' ? setSelectedId : undefined}
            onTransform={id === 'viewport' ? updateLayer : undefined}
            zoom={id === 'viewport' ? zoom : 1}
            grid={grid}
          />
        </div>
      </div>
    </div>
  );

  const selected = scene.layers.find((l) => l.id === selectedId) || null;

  return (
    <div className="morph-studio h-screen flex flex-col bg-[#070707] text-white overflow-hidden">
      {/* Toolbar */}
      <header className="shrink-0 border-b border-white/10 bg-[#0b0b0b]">
        <div className="flex items-center gap-2 px-2.5 py-2 flex-wrap">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-4 h-4 rounded-full bg-white" />
            <span className="text-[11px] font-bold tracking-[0.2em]">MORPH</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => { setPlaying(false); setTime(0); }}
              className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              title="Back to start"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPlaying((p) => !p)}
              className="p-1.5 rounded bg-white text-black hover:opacity-90 transition-opacity"
              title={playing ? 'Pause' : 'Play'}
            >
              {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          </div>

          <MorphAgent onScene={applyAgentScene} />

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setAutoKey((v) => !v)}
              title="Auto-keyframe: dragging writes a keyframe at the playhead"
              className={`p-1.5 rounded transition-colors ${autoKey ? 'bg-white/15 text-white' : 'text-white/45 hover:text-white'}`}
            >
              <Magnet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setGrid((g) => !g)}
              title="Editor grid"
              className={`p-1.5 rounded transition-colors ${grid ? 'bg-white/15 text-white' : 'text-white/45 hover:text-white'}`}
            >
              <Grid3x3 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setZoom((z) => clamp(z - 0.1, 0.5, 2.5))} className="p-1.5 rounded text-white/45 hover:text-white" title="Zoom out">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] tabular-nums text-white/45 w-8 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => clamp(z + 0.1, 0.5, 2.5))} className="p-1.5 rounded text-white/45 hover:text-white" title="Zoom in">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button onClick={reset} className="p-1.5 rounded text-white/45 hover:text-white" title="Reset scene">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <Link
              to="/AppStoreV2"
              className="ml-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/15 text-[10px] text-white/60 hover:text-white hover:border-white/40 transition-colors"
            >
              <Store className="w-3 h-3" />
              <span className="hidden sm:inline">Exit to Store</span>
            </Link>
          </div>
        </div>
        <p className="px-2.5 pb-1.5 text-[10px] text-white/25 truncate">
          {scene.name} · {scene.layers.length} layers · {scene.duration.toFixed(1)}s
        </p>
      </header>

      {/* Sidebar + split panes */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        <aside className="lg:w-[264px] shrink-0 border-b lg:border-b-0 lg:border-r border-white/10 overflow-y-auto max-h-[36vh] lg:max-h-none">
          <MorphLayers
            scene={scene}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAdd={addLayer}
            onDelete={deleteLayer}
            onToggleVisible={toggleVisible}
          />
          <MorphInspector
            layer={selected}
            time={time}
            onTransform={updateLayer}
            onToggleKey={(prop) => selected && toggleKey(selected.id, prop)}
          />
        </aside>

        <div
          ref={areaRef}
          className={`flex-1 min-w-0 min-h-0 flex ${dir === 'row' ? 'flex-row' : 'flex-col'}`}
        >
          <div style={paneStyle('viewport')} className="flex min-w-0 min-h-0">
            {pane('viewport', 'VIEWPORT · editor')}
          </div>
          <div
            onPointerDown={onDividerDown}
            onPointerMove={onDividerMove}
            onPointerUp={onDividerUp}
            onPointerCancel={onDividerUp}
            className={
              solo
                ? 'hidden'
                : dir === 'row'
                  ? 'w-1.5 shrink-0 cursor-col-resize bg-white/10 hover:bg-white/30 transition-colors'
                  : 'h-1.5 shrink-0 cursor-row-resize bg-white/10 hover:bg-white/30 transition-colors'
            }
            title="Drag to resize"
          />
          <div style={paneStyle('final')} className="flex min-w-0 min-h-0">
            {pane('final', 'FINAL · compositor')}
          </div>
        </div>
      </div>

      <div className="shrink-0">
        <MorphTimeline
          scene={scene}
          time={time}
          onSeek={(t) => { setPlaying(false); setTime(t); }}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>
    </div>
  );
}