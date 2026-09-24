import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Play, Pause, SkipBack, Maximize2, Minimize2, Grid3x3, ZoomIn, ZoomOut,
  Store, RotateCcw, Magnet, Home, Layers, Sliders, Clock,
  SplitSquareHorizontal, Plus, Type, X,
} from 'lucide-react';
import MorphStage from '@/components/morph/MorphStage';
import MorphTimeline from '@/components/morph/MorphTimeline';
import MorphInspector from '@/components/morph/MorphInspector';
import MorphLayers from '@/components/morph/MorphLayers';
import MorphSmartInput from '@/components/morph/MorphSmartInput';
import MorphToolButton from '@/components/morph/MorphToolButton';
import {
  starterScene, makeLayer, upsertKey, removeKey, sampleLayer, clamp, PROPS, autoEaseScene,
} from '@/components/morph/morphEngine';

const STORE_KEY = 'morph_scene_v1';
const LAYOUT_KEY = 'morph_layout_v1';
const LOGO = 'https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/76b25d579_generated_image.png';

const DEFAULT_LAYOUT = { sidebarW: 264, timelineH: 200, split: 50, paneDir: 'row', autoEase: true, ease: 'easeInOut' };

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

const loadLayout = () => {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY);
    if (raw) return { ...DEFAULT_LAYOUT, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_LAYOUT;
};

export default function MorphStudio({ onHome }) {
  const [scene, setScene] = useState(loadScene);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selectedId, setSelectedId] = useState(() => loadScene().layers[0]?.id || null);
  const [zoom, setZoom] = useState(1);
  const [grid, setGrid] = useState(true);
  const [autoKey, setAutoKey] = useState(true);
  const [solo, setSolo] = useState(null);
  const [layout, setLayout] = useState(loadLayout);
  const [panel, setPanel] = useState(null); // mobile sheet: layers | inspector | timeline
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);

  const areaRef = useRef(null);
  const imgCount = useRef(0);
  const firstEase = useRef(true);

  const { split, paneDir: widePaneDir, sidebarW, timelineH, autoEase, ease } = layout;
  const paneDir = wide ? widePaneDir : 'col';
  const keyEase = autoEase ? ease : 'linear';

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
    try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout)); } catch {}
  }, [layout]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const apply = () => setWide(mq.matches);
    apply();
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, []);

  // Auto-ease: switching it on (or changing the curve) smooths the whole scene.
  useEffect(() => {
    if (firstEase.current) { firstEase.current = false; return; }
    if (autoEase) setScene((s) => autoEaseScene(s, ease));
  }, [autoEase, ease]);

  /* -------------------------------------------------------------- editing */
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
            ? upsertKey({ ...next, [prop]: value }, prop, time, value, keyEase)
            : { ...next, [prop]: value };
        });
        return next;
      }),
    }));
  }, [autoKey, time, keyEase]);

  const toggleKey = (id, prop) => {
    setScene((s) => ({
      ...s,
      layers: s.layers.map((l) => {
        if (l.id !== id) return l;
        const existing = (l.tracks?.[prop] || []).some((k) => Math.abs(k.t - time) < 0.003);
        return existing ? removeKey(l, prop, time) : upsertKey(l, prop, time, sampleLayer(l, time)[prop], keyEase);
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

  // Pasted / dropped / linked images land in the scene immediately, with an
  // eased entrance when auto-ease is on.
  const addImageLayer = useCallback((url, name) => {
    const k = imgCount.current++;
    const layer = makeLayer({
      type: 'image',
      name: name || 'Image',
      src: url,
      size: 0.32,
      x: 0.32 + (k % 3) * 0.18,
      y: 0.5,
      ...(autoEase
        ? {
          tracks: {
            opacity: [{ t: 0, v: 0, ease }, { t: 0.7, v: 1, ease }],
            scale: [{ t: 0, v: 0.85, ease }, { t: 0.7, v: 1, ease }],
          },
        }
        : {}),
    });
    setScene((s) => ({ ...s, layers: [...s.layers, layer] }));
    setSelectedId(layer.id);
  }, [autoEase, ease]);

  const deleteLayer = (id) => {
    setScene((s) => ({ ...s, layers: s.layers.filter((l) => l.id !== id) }));
    setSelectedId((cur) => (cur === id ? null : cur));
  };

  const toggleVisible = (id) => {
    setScene((s) => ({ ...s, layers: s.layers.map((l) => (l.id === id ? { ...l, visible: l.visible === false } : l)) }));
  };

  const applyScene = useCallback((next) => {
    const eased = autoEase ? autoEaseScene(next, ease) : next;
    setScene(eased);
    setTime(0);
    setPlaying(false);
    setSelectedId(eased.layers[0]?.id || null);
    setSolo(null);
  }, [autoEase, ease]);

  const reset = () => {
    const fresh = starterScene();
    setScene(autoEase ? autoEaseScene(fresh, ease) : fresh);
    setTime(0);
    setPlaying(false);
    setSelectedId(fresh.layers[0]?.id || null);
  };

  /* ------------------------------------------------------ resizable splits */
  const startResize = (kind) => (e) => {
    e.preventDefault();
    const move = (ev) => {
      if (kind === 'sidebar') {
        setLayout((l) => ({ ...l, sidebarW: clamp(ev.clientX, 200, 460) }));
      } else if (kind === 'timeline') {
        setLayout((l) => ({ ...l, timelineH: clamp(window.innerHeight - ev.clientY, 110, 420) }));
      } else if (kind === 'panes' && areaRef.current) {
        const r = areaRef.current.getBoundingClientRect();
        const p = paneDir === 'row'
          ? ((ev.clientX - r.left) / r.width) * 100
          : ((ev.clientY - r.top) / r.height) * 100;
        setLayout((l) => ({ ...l, split: clamp(p, 15, 85) }));
      }
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

  const paneStyle = (id) => {
    if (solo) return solo === id ? { flex: 1 } : { display: 'none' };
    if (id === 'viewport') return paneDir === 'row' ? { width: `${split}%` } : { height: `${split}%` };
    return { flex: 1 };
  };

  const dividerClass = `shrink-0 bg-white/10 hover:bg-white/30 transition-colors ${
    paneDir === 'row' ? 'w-1.5 cursor-col-resize' : 'h-1.5 cursor-row-resize'
  } ${solo ? 'hidden' : ''}`;

  const pane = (id, label) => (
    <div className="flex-1 min-w-0 min-h-0 flex flex-col bg-black">
      <div className="flex items-center justify-between gap-2 px-2.5 py-1 border-b border-white/10 bg-[#0b0b0b]">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className="hidden xl:inline text-[10px] text-white/25">
            {id === 'viewport' ? `${Math.round(split)}% · drag the RGB handles` : 'true output'}
          </span>
          <button
            onClick={() => setSolo(solo === id ? null : id)}
            title={solo === id ? 'Restore split view' : 'Fullscreen this pane'}
            className="p-1 rounded text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            {solo === id ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden p-2">
        <div className="w-full h-full">
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

  const layersPanel = (
    <MorphLayers
      scene={scene}
      selectedId={selectedId}
      onSelect={setSelectedId}
      onAdd={addLayer}
      onDelete={deleteLayer}
      onToggleVisible={toggleVisible}
    />
  );

  const inspectorPanel = (
    <MorphInspector
      layer={selected}
      time={time}
      onTransform={updateLayer}
      onToggleKey={(prop) => selected && toggleKey(selected.id, prop)}
    />
  );

  const timelinePanel = (
    <MorphTimeline
      scene={scene}
      time={time}
      onSeek={(t) => { setPlaying(false); setTime(t); }}
      selectedId={selectedId}
      onSelect={setSelectedId}
    />
  );

  return (
    <div className="morph-studio flex flex-col bg-[#070707] text-white overflow-hidden h-screen" style={{ height: '100dvh' }}>
      {/* Toolbar */}
      <header className="shrink-0 border-b border-white/10 bg-[#0b0b0b]">
        <div className="flex items-center gap-2 px-2.5 py-2">
          <button
            onClick={onHome}
            title="Back to landing"
            className="flex items-center gap-1.5 shrink-0 hover:opacity-80 transition-opacity"
          >
            <img src={LOGO} alt="Morph" className="w-4 h-4 rounded object-cover" />
            <span className="text-[11px] font-bold tracking-[0.2em]">MORPH</span>
          </button>

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

          <span className="hidden md:block flex-1 min-w-0 truncate text-[10px] text-white/25">
            {scene.name} · {scene.layers.length} layers · {scene.duration.toFixed(1)}s
          </span>
          <span className="md:hidden flex-1" />

          <div className="hidden lg:flex items-center gap-1 shrink-0">
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
            <button
              onClick={() => setLayout((l) => ({ ...l, paneDir: l.paneDir === 'row' ? 'col' : 'row' }))}
              title="Stack the panes instead of side-by-side"
              className="p-1.5 rounded text-white/45 hover:text-white transition-colors"
            >
              <SplitSquareHorizontal className="w-3.5 h-3.5" />
            </button>
            <button onClick={reset} className="p-1.5 rounded text-white/45 hover:text-white" title="Reset scene">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onHome}
              title="Home"
              className="p-1.5 rounded text-white/45 hover:text-white transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
            </button>
            <Link
              to="/AppStoreV2"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/15 text-[10px] text-white/60 hover:text-white hover:border-white/40 transition-colors"
            >
              <Store className="w-3 h-3" />
              <span className="hidden sm:inline">Exit to Store</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Sidebar + split panes */}
      <div className="flex-1 min-h-0 flex">
        <aside
          style={{ width: sidebarW }}
          className="hidden lg:flex flex-col shrink-0 border-r border-white/10 overflow-y-auto"
        >
          {layersPanel}
          {inspectorPanel}
        </aside>
        <div
          onPointerDown={startResize('sidebar')}
          className="hidden lg:block w-1.5 shrink-0 cursor-col-resize bg-white/10 hover:bg-white/30 transition-colors"
          title="Drag to resize the panel"
        />

        <div
          ref={areaRef}
          className={`flex-1 min-w-0 min-h-0 flex ${paneDir === 'row' ? 'flex-row' : 'flex-col'}`}
        >
          <div style={paneStyle('viewport')} className="flex min-w-0 min-h-0">
            {pane('viewport', 'VIEWPORT · editor')}
          </div>
          <div
            onPointerDown={startResize('panes')}
            className={dividerClass}
            title="Drag to resize the split"
          />
          <div style={paneStyle('final')} className="flex min-w-0 min-h-0">
            {pane('final', 'FINAL · compositor')}
          </div>
        </div>
      </div>

      {/* Timeline — desktop keeps it docked and resizable */}
      <div className="hidden lg:block shrink-0">
        <div
          onPointerDown={startResize('timeline')}
          className="h-1.5 cursor-row-resize bg-white/10 hover:bg-white/30 transition-colors"
          title="Drag to resize the timeline"
        />
        <div style={{ height: timelineH }} className="overflow-y-auto">
          {timelinePanel}
        </div>
      </div>

      {/* Mobile / tablet: tools + panels as a sheet, then the chat composer */}
      <div className="lg:hidden shrink-0 border-t border-white/10 bg-[#0b0b0b]">
        <div className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto scrollbar-hide">
          <MorphToolButton
            icon={Layers}
            label="Layers"
            active={panel === 'layers'}
            onClick={() => setPanel((p) => (p === 'layers' ? null : 'layers'))}
          />
          <MorphToolButton
            icon={Sliders}
            label="Edit"
            active={panel === 'inspector'}
            onClick={() => setPanel((p) => (p === 'inspector' ? null : 'inspector'))}
          />
          <MorphToolButton
            icon={Clock}
            label="Time"
            active={panel === 'timeline'}
            onClick={() => setPanel((p) => (p === 'timeline' ? null : 'timeline'))}
          />
          <MorphToolButton icon={Magnet} label="Auto-key" active={autoKey} onClick={() => setAutoKey((v) => !v)} />
          <MorphToolButton icon={Grid3x3} label="Grid" active={grid} onClick={() => setGrid((g) => !g)} />
          <MorphToolButton icon={Plus} label="Shape" onClick={() => addLayer('shape')} />
          <MorphToolButton icon={Type} label="Text" onClick={() => addLayer('text')} />
          <MorphToolButton icon={RotateCcw} label="Reset" onClick={reset} />
        </div>

        {panel && (
          <div className="border-t border-white/10 max-h-[38vh] overflow-y-auto bg-black/40">
            <div className="flex items-center justify-between px-2.5 py-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">{panel}</span>
              <button onClick={() => setPanel(null)} className="p-1 text-white/40 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {panel === 'layers' ? layersPanel : panel === 'inspector' ? inspectorPanel : timelinePanel}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-white/10 bg-[#0b0b0b]">
        <MorphSmartInput
          scene={scene}
          onScene={applyScene}
          onAddImage={addImageLayer}
          autoEase={autoEase}
          ease={ease}
          onToggleAutoEase={() => setLayout((l) => ({ ...l, autoEase: !l.autoEase }))}
          onEaseChange={(v) => setLayout((l) => ({ ...l, ease: v }))}
          compact={!wide}
        />
      </div>
    </div>
  );
}