import React, { useCallback, useEffect, useMemo, useState } from 'react';
import BackToStore from '@/components/BackToStore';
import LumiflyStage from './LumiflyStage';
import LumiflyTopBar from './LumiflyTopBar';
import LumiflyScenes from './LumiflyScenes';
import LumiflyInspector from './LumiflyInspector';
import LumiflyTransport from './LumiflyTransport';
import LumiflyAIEditor from './LumiflyAIEditor';
import LumiflyTextEditor from './LumiflyTextEditor';
import { LUMIFLY_PROJECT_KEY, RESOLUTION_SCALE, cloneScene, createScene, defaultProject } from './lumiflyPresets';
import { mergeScenePatch } from './lumiflyScenePatch';
import { exportFrame } from './lumiflyRender';
import { Type } from 'lucide-react';

/**
 * The studio. Scenes on the left, the stage and transport in the middle, every
 * motion setting on the right. The project lives in localStorage, and the
 * landing's input box hands its phrase to scene one through ?text=.
 */
export default function LumiflyWorkspace() {
  const [project, setProject] = useState(() => {
    let loaded = null;
    try {
      const raw = localStorage.getItem(LUMIFLY_PROJECT_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed?.scenes?.length) loaded = parsed;
    } catch {
      loaded = null;
    }
    const base = loaded || defaultProject();
    try {
      const text = new URLSearchParams(window.location.search).get('text');
      if (!text) return base;
      return { ...base, scenes: base.scenes.map((s, i) => (i === 0 ? { ...s, text } : s)) };
    } catch {
      return base;
    }
  });

  const [selectedId, setSelectedId] = useState(() => project.scenes[0].id);
  const [aspect, setAspect] = useState('16:9');
  const [resolution, setResolution] = useState('1080P');
  const [playing, setPlaying] = useState(true);
  const [playAll, setPlayAll] = useState(true);
  const [rate, setRate] = useState(1);
  const [cursor, setCursor] = useState({ index: 0, t: 0 });
  const [editingText, setEditingText] = useState(false);

  const scenes = project.scenes;

  useEffect(() => {
    try {
      localStorage.setItem(LUMIFLY_PROJECT_KEY, JSON.stringify(project));
    } catch {
      /* storage full or blocked — the session still works */
    }
  }, [project]);

  const index = Math.min(cursor.index, scenes.length - 1);
  const scene = scenes[index] || scenes[0];
  const duration = Math.max(0.5, Number(scene.duration) || 6);

  // The clock. It advances the current scene, then hands over to the next one.
  useEffect(() => {
    if (!playing) return undefined;
    let raf;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.06, (now - last) / 1000) * rate;
      last = now;
      setCursor((c) => {
        const current = scenes[c.index] || scenes[0];
        const span = Math.max(0.5, Number(current?.duration) || 6);
        const next = c.t + dt;
        if (next < span) return { index: c.index, t: next };
        if (playAll && scenes.length > 1) return { index: (c.index + 1) % scenes.length, t: 0 };
        return { index: c.index, t: 0 };
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, rate, playAll, scenes]);

  // While playing the whole timeline, the selection follows the playhead.
  useEffect(() => {
    if (!playAll) return;
    const id = scenes[index]?.id;
    if (id && id !== selectedId) setSelectedId(id);
  }, [index, playAll, scenes, selectedId]);

  const transition = useMemo(() => {
    const outDuration = Math.max(0, Number(scene.outgoing?.duration) || 0);
    const inDuration = Math.max(0, Number(scene.incoming?.duration) || 0);
    return {
      out:
        outDuration > 0 && cursor.t > duration - outDuration
          ? Math.min(1, (cursor.t - (duration - outDuration)) / outDuration)
          : null,
      in: inDuration > 0 && cursor.t < inDuration ? Math.min(1, cursor.t / inDuration) : null,
    };
  }, [scene, cursor.t, duration]);

  const patchScene = useCallback(
    (patch) => {
      setProject((p) => ({
        ...p,
        scenes: p.scenes.map((s) => (s.id === selectedId ? mergeScenePatch(s, patch) : s)),
      }));
    },
    [selectedId]
  );

  // Editing type on the canvas: settle the scene at rest first, so the editable
  // words sit exactly where the render puts them.
  const startTextEdit = () => {
    setPlaying(false);
    const rest = Math.max(0, duration - (Number(scene.outgoing?.duration) || 0) - 0.02);
    setCursor((c) => ({ index: c.index, t: rest }));
    setEditingText(true);
  };

  const selectScene = (id) => {
    const i = scenes.findIndex((s) => s.id === id);
    if (i < 0) return;
    setSelectedId(id);
    setCursor({ index: i, t: 0 });
    setEditingText(false);
  };

  const addScene = () => {
    const created = createScene(`scene-${scenes.length + 1}`, {
      text: scene.text,
      textColors: [...scene.textColors],
      background: { ...scene.background, colors: [...scene.background.colors] },
    });
    setProject((p) => ({ ...p, scenes: [...p.scenes, created] }));
    setSelectedId(created.id);
    setCursor({ index: scenes.length, t: 0 });
  };

  const duplicateScene = (id) => {
    const at = scenes.findIndex((s) => s.id === id);
    if (at < 0) return;
    const copy = cloneScene(scenes[at]);
    setProject((p) => {
      const next = [...p.scenes];
      next.splice(at + 1, 0, copy);
      return { ...p, scenes: next };
    });
    setSelectedId(copy.id);
    setCursor({ index: at + 1, t: 0 });
  };

  const deleteScene = (id) => {
    if (scenes.length <= 1) return;
    const at = scenes.findIndex((s) => s.id === id);
    setProject((p) => ({ ...p, scenes: p.scenes.filter((s) => s.id !== id) }));
    const fallback = scenes[Math.max(0, at - 1)];
    if (id === selectedId) {
      setSelectedId(fallback.id);
      setCursor({ index: Math.max(0, at - 1), t: 0 });
    }
  };

  const seek = (i) => {
    setCursor({ index: i, t: 0 });
    setSelectedId(scenes[i].id);
    setEditingText(false);
  };

  const download = () => {
    const url = exportFrame(scene, aspect, cursor.t, transition, RESOLUTION_SCALE[resolution] || 1);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lumifly-${String(scene.name || 'scene').replace(/\s+/g, '-').toLowerCase()}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white">
      <BackToStore />

      <LumiflyTopBar
        name={project.name}
        onName={(v) => setProject((p) => ({ ...p, name: v }))}
        aspect={aspect}
        onAspect={setAspect}
        resolution={resolution}
        onResolution={setResolution}
        onDuplicate={() => duplicateScene(selectedId)}
        onDownload={download}
      />

      <div className="flex flex-col lg:flex-row">
        <LumiflyScenes
          scenes={scenes}
          selectedId={selectedId}
          onSelect={selectScene}
          onAdd={addScene}
          onDuplicate={duplicateScene}
          onDelete={deleteScene}
        />

        <main className="min-w-0 flex-1">
          <div className="p-3 sm:p-5">
            <div
              className="relative mx-auto overflow-hidden rounded-xl border border-white/10 bg-black"
              style={{ maxWidth: aspect === '9:16' ? 380 : 980 }}
              onDoubleClick={startTextEdit}
            >
              <LumiflyStage
                scene={editingText ? { ...scene, text: '' } : scene}
                time={cursor.t}
                aspect={aspect}
                transition={transition}
                className="h-auto w-full"
              />

              {editingText ? (
                <LumiflyTextEditor
                  scene={scene}
                  onText={(value) => patchScene({ text: value })}
                  onDone={() => setEditingText(false)}
                />
              ) : (
                <button
                  onClick={startTextEdit}
                  className="absolute right-2 top-2 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-2.5 py-1 text-[10px] text-white/70 backdrop-blur transition-colors hover:text-white"
                >
                  <Type className="w-3 h-3" />
                  Edit text
                </button>
              )}
            </div>

            <p className="mt-2 text-center text-[10px] text-white/30">
              {editingText
                ? 'Editing the words on the canvas — Esc or Enter to finish'
                : 'Double-click the preview to edit the text'}
            </p>
          </div>

          <LumiflyAIEditor scene={scene} onApply={patchScene} />

          <LumiflyTransport
            scenes={scenes}
            cursor={{ index, t: cursor.t }}
            onSeek={seek}
            playing={playing}
            onPlay={() => setPlaying((v) => !v)}
            playAll={playAll}
            onPlayAll={setPlayAll}
            rate={rate}
            onRate={setRate}
            duration={duration}
            onStretch={(delta) => patchScene({ duration: Math.max(0.5, Number((duration + delta).toFixed(2))) })}
          />
        </main>

        <LumiflyInspector scene={scene} onPatch={patchScene} />
      </div>
    </div>
  );
}