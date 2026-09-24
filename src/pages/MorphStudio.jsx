import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Play, Pause, SkipBack, Maximize2, Minimize2, Grid3x3, ZoomIn, ZoomOut,
  Store, RotateCcw, Magnet, Home, Layers, Sliders, Clock,
  SplitSquareHorizontal, Plus, Type, X, Wand2, Sparkles, FolderOpen, Boxes, Link2, ArrowRightLeft,
} from 'lucide-react';
import MorphStage from '@/components/morph/MorphStage';
import MorphTimeline from '@/components/morph/MorphTimeline';
import MorphInspector from '@/components/morph/MorphInspector';
import MorphLayers from '@/components/morph/MorphLayers';
import MorphSmartInput from '@/components/morph/MorphSmartInput';
import MorphMorphPanel from '@/components/morph/MorphMorphPanel';
import MorphTransitionPanel from '@/components/morph/MorphTransitionPanel';
import MorphToolButton from '@/components/morph/MorphToolButton';
import MorphSequences from '@/components/morph/MorphSequences';
import MorphDynamics from '@/components/morph/MorphDynamics';
import { applySequence } from '@/components/morph/morphSequences';
import {
  MORPH_PRESETS, addMorph, applyMorphPreset, applyMotionStyle,
  deleteMorph, makeMorph, musicToThrillerScene, updateMorph,
} from '@/components/morph/morphMorphs';
import {
  addTransition, deleteTransition, matchCutDemoScene, planFor, replanInScene,
  transitionContext, updateTransition,
} from '@/components/morph/morphTransitions';
import { parseTransitionCommand } from '@/components/morph/transitionCommands';
import { DEFAULT_DYNAMICS, bakeDynamics } from '@/components/morph/morphDynamics';
import MorphLibrary from '@/components/morph/MorphLibrary';
import MorphProjects from '@/components/morph/MorphProjects';
import { blankScene } from '@/components/morph/morphComponents';
import {
  activate, activeProject, createProject, deleteProject, loadStore, persist,
  pushHistory, restoreVersion, updateActiveScene,
} from '@/components/morph/morphProjects';
import {
  addMarker, addTime, deleteKey, groupMembers, moveKey, removeMarker,
  setDuration, setGroup, setKeyEase, stagger, transformGroup, uniqueGroupName,
} from '@/components/morph/morphEdits';
import {
  starterScene, makeLayer, upsertKey, removeKey, sampleLayer, clamp, PROPS, autoEaseScene,
} from '@/components/morph/morphEngine';

const STORE_KEY = 'morph_scene_v1';
const LAYOUT_KEY = 'morph_layout_v1';
const LOGO = 'https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/76b25d579_generated_image.png';

const DEFAULT_LAYOUT = { sidebarW: 280, timelineH: 240, split: 50, paneDir: 'row', autoEase: true, ease: 'easeInOut' };

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
  // Boot once: the projects store, and whichever scene it says is open (falling
  // back to the single-scene key older sessions left behind).
  const [boot] = useState(() => {
    const legacy = loadScene();
    const store = loadStore(legacy);
    return { store, scene: activeProject(store)?.scene || legacy };
  });
  const [scene, setScene] = useState(boot.scene);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selectedId, setSelectedId] = useState(() => boot.scene.layers[0]?.id || null);
  const [zoom, setZoom] = useState(1);
  const [grid, setGrid] = useState(true);
  const [autoKey, setAutoKey] = useState(true);
  const [solo, setSolo] = useState(null);
  const [layout, setLayout] = useState(loadLayout);
  const [panel, setPanel] = useState(null); // mobile sheet: dynamics | sequences | layers | inspector | timeline
  const [timelineMode, setTimelineMode] = useState('simple');
  const [keySel, setKeySel] = useState(null);
  const [checked, setChecked] = useState([]);
  const [dynamics, setDynamics] = useState(DEFAULT_DYNAMICS);
  const [store, setStore] = useState(boot.store);
  const [showProjects, setShowProjects] = useState(false);
  const [morphSel, setMorphSel] = useState(null);
  const [transitionSel, setTransitionSel] = useState(null);
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);

  const active = activeProject(store);
  // A queued label means "the next scene change is worth remembering".
  const snapLabel = useRef('');

  const areaRef = useRef(null);
  const imgCount = useRef(0);
  const firstEase = useRef(true);

  const { split, paneDir: widePaneDir, sidebarW, timelineH, autoEase, ease } = layout;
  const paneDir = wide ? widePaneDir : 'col';
  const keyEase = autoEase ? ease : 'linear';

  // One thing is selected at a time — a layer, a morph or a match cut — so the
  // Delete key and the canvas highlight always mean exactly one thing.
  const selectLayer = (id) => {
    setSelectedId(id);
    setMorphSel(null);
    setTransitionSel(null);
  };

  const selectMorph = (id) => {
    setMorphSel(id);
    setSelectedId(null);
    setTransitionSel(null);
  };

  const selectTransition = (id) => {
    setTransitionSel(id);
    setMorphSel(null);
    setSelectedId(null);
  };

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
    // Read the label outside the updater so the update stays pure.
    const label = snapLabel.current;
    snapLabel.current = '';
    setStore((s) => {
      const next = updateActiveScene(s, scene);
      return label ? pushHistory(next, label, scene) : next;
    });
  }, [scene]);

  useEffect(() => { persist(store); }, [store]);

  // An explicit save writes straight away — no scene change is coming.
  const snapshotNow = (label) => setStore((s) => pushHistory(updateActiveScene(s, scene), label, scene));

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
    selectLayer(layer.id);
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
    selectLayer(layer.id);
  }, [autoEase, ease]);

  const deleteLayer = (id) => {
    setScene((s) => ({ ...s, layers: s.layers.filter((l) => l.id !== id) }));
    setSelectedId((cur) => (cur === id ? null : cur));
  };

  const toggleVisible = (id) => {
    setScene((s) => ({ ...s, layers: s.layers.map((l) => (l.id === id ? { ...l, visible: l.visible === false } : l)) }));
  };

  const applyScene = useCallback((next, dyn, marks) => {
    // Auto-ease first, then bake the behaviour: the spring curve the behaviour
    // writes is the whole point, so nothing may overwrite it afterwards.
    let s = autoEase ? autoEaseScene(next, ease) : next;
    if (dyn) {
      s = bakeDynamics(s, dyn);
      setDynamics((d) => ({ ...d, ...dyn }));
    }
    (marks || []).forEach((m) => { s = addMarker(s, Number(m.t), m.label || 'Marker'); });
    snapLabel.current = 'AI built a scene';
    setScene(s);
    setTime(0);
    setPlaying(false);
    selectLayer(s.layers[0]?.id || null);
    setSolo(null);
  }, [autoEase, ease]);

  // A backdrop belongs to the scene rather than to a layer: it is set, swapped
  // and cleared on its own, without disturbing anything already animated.
  const setBackground = useCallback((bg) => {
    snapLabel.current = bg ? 'Background gradient' : 'Background cleared';
    setScene((s) => ({ ...s, background: bg || undefined }));
  }, []);

  const reset = () => {
    const fresh = starterScene();
    snapLabel.current = 'Reset to the starter logo';
    setScene(fresh);
    setTime(0);
    setPlaying(false);
    selectLayer(fresh.layers[0]?.id || null);
  };

  // Prebuilt sequences merge into the tracks already there, so several can be
  // chained onto the same logo. They carry their own hand-tuned easing, so they
  // are deliberately not run through auto-ease.
  const applySeq = useCallback((name, scope) => {
    snapLabel.current = `Sequence · ${name}`;
    setScene((s) => applySequence(s, name, scope === 'layer' && selectedId ? { layerIds: [selectedId] } : {}));
    setTime(0);
    setPlaying(false);
  }, [selectedId]);

  const runSequences = useCallback((names, dyn, marks) => {
    if (!names?.length && !dyn && !marks?.length) return;
    snapLabel.current = names?.length ? `Sequences · ${names.join(', ')}` : 'Behaviour applied';
    setScene((s) => {
      let next = (names || []).reduce((acc, n) => applySequence(acc, n, {}), s);
      if (dyn) next = bakeDynamics(next, dyn);
      (marks || []).forEach((m) => { next = addMarker(next, Number(m.t), m.label || 'Marker'); });
      return next;
    });
    if (dyn) setDynamics((d) => ({ ...d, ...dyn }));
    setTime(0);
    setPlaying(false);
  }, []);

  /* ------------------------------------------------ timeline + hierarchy ops */
  const selectKey = (k) => {
    const layer = scene.layers.find((l) => l.id === k.layerId);
    const found = (layer?.tracks?.[k.prop] || []).find((x) => Math.abs(x.t - k.t) < 0.004);
    setKeySel(found ? { ...k, ease: found.ease } : null);
    setTime(k.t);
  };

  const groupChecked = () => {
    if (checked.length < 2) return;
    setScene((s) => setGroup(s, checked, uniqueGroupName(s, 'LOGO')));
    setChecked([]);
  };

  const ungroup = (name) => setScene((s) => setGroup(s, groupMembers(s, name).map((l) => l.id), ''));

  // Parenting: the group moves or scales as one, baked into its members' keys.
  const moveGroup = (group, delta) => setScene((s) => transformGroup(s, group, delta));

  const staggerIds = (ids) => setScene((s) => stagger(s, ids, 0.1));

  const bakeDyn = (scope) =>
    setScene((s) => bakeDynamics(s, dynamics, scope === 'layer' && selectedId ? { layerIds: [selectedId] } : {}));

  /* ------------------------------------------------- library, projects, history */
  const addComponent = useCallback((layers) => {
    if (!layers?.length) return;
    snapLabel.current = 'Component added';
    setScene((s) => ({ ...s, layers: [...s.layers, ...layers] }));
    selectLayer(layers[0].id);
    setTime(0);
    setPlaying(false);
  }, []);

  const applyDynPreset = (motion) => {
    snapLabel.current = `Behaviour · ${motion}`;
    setScene((s) => bakeDynamics(s, { ...dynamics, motion }));
    setTime(0);
    setPlaying(false);
  };

  const loadInto = (next, show) => {
    setScene(next);
    setTime(0);
    setPlaying(false);
    selectLayer(next.layers[0]?.id || null);
    setChecked([]);
    setKeySel(null);
    if (show) setShowProjects(false);
  };

  const newProject = (name) => {
    const fresh = blankScene((name || '').trim());
    const { store: next } = createProject(store, name, fresh);
    setStore(next);
    loadInto(fresh, true);
  };

  const openProject = (id) => {
    if (id === store.activeId) {
      setShowProjects(false);
      return;
    }
    const next = activate(store, id);
    setStore(next);
    const target = activeProject(next)?.scene;
    if (target) loadInto(target, true);
    else setShowProjects(false);
  };

  const removeProject = (id) => setStore((s) => deleteProject(s, id));

  const restore = (entryId) => {
    const snap = restoreVersion(store, entryId);
    if (snap) loadInto(snap, true);
  };

  /* ------------------------------------------------------------------ morphs */
  // A morph is a relation between two layers. Creating one writes it into the
  // scene, so both panes and the timeline pick it up on the next frame.
  const createMorph = (from, to, opts) => {
    const rel = makeMorph({ from, to, ...opts });
    snapLabel.current = 'Morph created';
    setScene((s) => addMorph(s, rel));
    selectMorph(rel.id);
    setPlaying(false);
    setTime(rel.start);
  };

  const editMorph = (id, patch) => setScene((s) => updateMorph(s, id, patch));

  const dropMorph = (id) => {
    setScene((s) => deleteMorph(s, id));
    setMorphSel((cur) => (cur === id ? null : cur));
  };

  const loadMorphScene = (next, label) => {
    snapLabel.current = label;
    setScene(next);
    setTime(0);
    setPlaying(false);
    // The most specific thing the preset brought in gets the selection: a match
    // cut first, then a morph, then a layer.
    const cut = next.transitions?.[next.transitions.length - 1]?.id || null;
    const rel = next.morphs?.[next.morphs.length - 1]?.id || null;
    setTransitionSel(cut);
    setMorphSel(cut ? null : rel);
    setSelectedId(cut || rel ? null : next.layers[next.layers.length - 1]?.id || null);
  };

  // The word a text-based preset should carry: the selected text layer's, or the
  // scene's only text layer.
  const presetWord = (() => {
    const picked = scene.layers.find((l) => l.id === selectedId);
    return (picked?.type === 'text' ? picked.text : '')
      || scene.layers.find((l) => l.type === 'text')?.text
      || '';
  })();

  const addPreset = (id, options = {}) => {
    const word = options.text || presetWord;
    loadMorphScene(
      applyMorphPreset(scene, id, word ? { ...options, text: word } : options),
      `Morph preset · ${MORPH_PRESETS.find((p) => p.id === id)?.label || id}`,
    );
  };

  const buildSequence = (options) => addPreset('shape-text-logo', options);

  const loadDemo = () => loadMorphScene(musicToThrillerScene(), 'Demo · Music → Thriller');

  const setMorphStyle = (id, styleId) => setScene((s) => applyMotionStyle(s, id, styleId));

  /* ----------------------------------------------------------- match cuts */
  // Scene-level. Layers carry a scene tag, the planner finds the pair, the plan
  // lands on the scene and the engine renders the handover.
  const createTransition = (options = {}) => {
    const plan = planFor(scene, { start: 0.5, ...options });
    if (!plan) return;
    snapLabel.current = `Match cut · ${plan.meta.source.name} → ${plan.meta.target.name}`;
    setScene((s) => addTransition(s, plan));
    selectTransition(plan.id);
    setPlaying(false);
    setTime(plan.start);
  };

  const editTransition = (id, patch) => setScene((s) => updateTransition(s, id, patch));

  const dropTransition = (id) => {
    setScene((s) => deleteTransition(s, id));
    setTransitionSel((cur) => (cur === id ? null : cur));
  };

  const replanById = (id, patch) =>
    setScene((s) => {
      const plan = (s.transitions || []).find((t) => t.id === id);
      if (!plan) return s;
      const next = replanInScene(s, plan, patch);
      return next ? updateTransition(s, id, next) : s;
    });

  // A sentence becomes planner options, the planner becomes a plan — the AI and
  // the user take exactly the same path.
  const runTransitionCommand = (text) => {
    const ctx = transitionContext(scene);
    const parsed = parseTransitionCommand(text, {
      anchorsA: ctx.anchorsA,
      anchorsB: ctx.anchorsB,
      candidates: ctx.candidates,
    });
    if (!parsed) return { ok: false, message: 'Nothing to match yet.' };
    const plan = planFor(scene, { start: 0.5, ...parsed.options });
    if (!plan) return { ok: false, message: 'No visual correspondence found between the scenes.' };
    snapLabel.current = `Match cut · ${plan.meta.source.name} → ${plan.meta.target.name}`;
    setScene((s) => addTransition(s, plan));
    selectTransition(plan.id);
    setPlaying(false);
    setTime(plan.start);
    return { ok: true, message: `${parsed.understood.join(' · ')} — ${Math.round(plan.score * 100)}% match.` };
  };

  const previewTransition = (start) => {
    setTime(Math.max(0, start - 0.35));
    setPlaying(true);
  };

  const loadMatchCutDemo = () => loadMorphScene(matchCutDemoScene(), 'Match cut · Music → Thriller');

  // Delete / Backspace removes whatever is selected — a layer or an asset, a
  // morph, a match cut, or a keyframe. Never while typing in a field.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const el = e.target;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)) return;
      if (transitionSel) { e.preventDefault(); dropTransition(transitionSel); return; }
      if (morphSel) { e.preventDefault(); dropMorph(morphSel); return; }
      if (keySel) {
        e.preventDefault();
        setScene((s) => deleteKey(s, keySel.layerId, keySel.prop, keySel.t));
        setKeySel(null);
        return;
      }
      if (selectedId) { e.preventDefault(); deleteLayer(selectedId); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [transitionSel, morphSel, keySel, selectedId]);

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
            onSelect={id === 'viewport' ? selectLayer : undefined}
            onTransform={id === 'viewport' ? updateLayer : undefined}
            zoom={id === 'viewport' ? zoom : 1}
            grid={grid}
            selectedMorphId={id === 'viewport' ? morphSel : null}
            selectedTransitionId={id === 'viewport' ? transitionSel : null}
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
      onSelect={selectLayer}
      onAdd={addLayer}
      onDelete={deleteLayer}
      onToggleVisible={toggleVisible}
      checked={checked}
      onCheck={(id) => setChecked((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))}
      onGroup={groupChecked}
      onUngroup={ungroup}
      onStagger={staggerIds}
    />
  );

  const inspectorPanel = (
    <MorphInspector
      layer={selected}
      time={time}
      onTransform={updateLayer}
      onToggleKey={(prop) => selected && toggleKey(selected.id, prop)}
      onGroupTransform={moveGroup}
    />
  );

  const morphPanel = (
    <MorphMorphPanel
      scene={scene}
      morphSel={morphSel}
      onSelect={selectMorph}
      onCreate={createMorph}
      onUpdate={editMorph}
      onDelete={dropMorph}
      onApplyPreset={addPreset}
      onApplyStyle={setMorphStyle}
      onDemo={loadDemo}
      sequenceWord={presetWord}
      onBuildSequence={buildSequence}
    />
  );

  const transitionPanel = (
    <MorphTransitionPanel
      scene={scene}
      transitionSel={transitionSel}
      onSelect={selectTransition}
      onCreate={createTransition}
      onUpdate={editTransition}
      onDelete={dropTransition}
      onReplan={replanById}
      onCommand={runTransitionCommand}
      onPreview={previewTransition}
      onDemo={loadMatchCutDemo}
    />
  );

  const timelinePanel = (
    <MorphTimeline
      scene={scene}
      time={time}
      mode={timelineMode}
      onModeChange={setTimelineMode}
      onSeek={(t) => { setPlaying(false); setTime(t); }}
      onDuration={(d) => setScene((s) => setDuration(s, d))}
      onAddTime={(sec) => setScene((s) => addTime(s, sec))}
      selectedId={selectedId}
      onSelect={selectLayer}
      keySel={keySel}
      onSelectKey={selectKey}
      onEaseKey={(ease) => {
        setScene((s) => setKeyEase(s, keySel.layerId, keySel.prop, keySel.t, ease));
        setKeySel((k) => ({ ...k, ease }));
      }}
      onMoveKey={(layerId, prop, t, nextT) => setScene((s) => moveKey(s, layerId, prop, t, nextT))}
      onDeleteKey={() => {
        setScene((s) => deleteKey(s, keySel.layerId, keySel.prop, keySel.t));
        setKeySel(null);
      }}
      morphSel={morphSel}
      onSelectMorph={selectMorph}
      onMoveMorph={(id, patch) => setScene((s) => updateMorph(s, id, patch))}
      transitionSel={transitionSel}
      onSelectTransition={selectTransition}
      onMoveTransition={(id, patch) => setScene((s) => updateTransition(s, id, patch))}
      onAddMarker={(t) => setScene((s) => addMarker(s, t))}
      onRemoveMarker={(id) => setScene((s) => removeMarker(s, id))}
      dynamics={dynamics}
      onEditDynamics={() => { if (!wide) setPanel('dynamics'); }}
    />
  );

  const sequencesPanel = <MorphSequences onApply={applySeq} hasSelection={!!selected} />;

  const dynamicsPanel = (
    <MorphDynamics value={dynamics} onChange={setDynamics} onBake={bakeDyn} hasSelection={!!selected} />
  );

  const libraryPanel = (
    <MorphLibrary
      scene={scene}
      onAddComponent={addComponent}
      onApplySequence={applySeq}
      onApplyDynamics={applyDynPreset}
      onAddAsset={addImageLayer}
      hasSelection={!!selected}
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

          <button
            onClick={() => setShowProjects(true)}
            title="Projects & version history"
            className="flex items-center gap-1 shrink-0 px-2 py-1.5 rounded-lg border border-white/15 text-[10px] text-white/60 hover:text-white hover:border-white/40 transition-colors"
          >
            <FolderOpen className="w-3 h-3" />
            <span className="hidden sm:inline max-w-[120px] truncate">{active?.name || 'Project'}</span>
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
          {libraryPanel}
          {layersPanel}
          {morphPanel}
          {transitionPanel}
          {dynamicsPanel}
          {sequencesPanel}
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
            icon={Boxes}
            label="Library"
            active={panel === 'library'}
            onClick={() => setPanel((p) => (p === 'library' ? null : 'library'))}
          />
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
          <MorphToolButton
            icon={Sparkles}
            label="Dynamic"
            active={panel === 'dynamics'}
            onClick={() => setPanel((p) => (p === 'dynamics' ? null : 'dynamics'))}
          />
          <MorphToolButton
            icon={Wand2}
            label="Sequences"
            active={panel === 'sequences'}
            onClick={() => setPanel((p) => (p === 'sequences' ? null : 'sequences'))}
          />
          <MorphToolButton
            icon={Link2}
            label="Morph"
            active={panel === 'morph'}
            onClick={() => setPanel((p) => (p === 'morph' ? null : 'morph'))}
          />
          <MorphToolButton
            icon={ArrowRightLeft}
            label="Match cut"
            active={panel === 'cuts'}
            onClick={() => setPanel((p) => (p === 'cuts' ? null : 'cuts'))}
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
            {panel === 'library'
              ? libraryPanel
              : panel === 'layers'
                ? layersPanel
                : panel === 'inspector'
                  ? inspectorPanel
                  : panel === 'timeline'
                    ? timelinePanel
                    : panel === 'sequences'
                      ? sequencesPanel
                      : panel === 'morph'
                        ? morphPanel
                        : panel === 'cuts'
                          ? transitionPanel
                          : dynamicsPanel}
          </div>
        )}
      </div>

      {showProjects && (
        <MorphProjects
          projects={store.projects}
          activeId={store.activeId}
          onNew={newProject}
          onOpen={openProject}
          onDelete={removeProject}
          onRestore={restore}
          onSnapshot={() => snapshotNow('Manual save')}
          onClose={() => setShowProjects(false)}
        />
      )}

      <div className="shrink-0 border-t border-white/10 bg-[#0b0b0b]">
        <MorphSmartInput
          scene={scene}
          onScene={applyScene}
          onSequences={runSequences}
          onAddImage={addImageLayer}
          onBackground={setBackground}
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