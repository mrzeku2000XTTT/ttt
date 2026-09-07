import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import BackToStore from '@/components/BackToStore';
import KinezmaStage from '@/components/kinezma/KinezmaStage';
import KinezmaChat from '@/components/kinezma/KinezmaChat';
import { decomposeImage, motionFromChat, buildCutouts, loadImage, buildAsset } from '@/components/kinezma/kinezmaEngine';
import { exportKinezmaMp4 } from '@/components/kinezma/kinezmaExport';
import { Loader2, Play, Download, Upload, Library as LibraryIcon, Plus } from 'lucide-react';
import KinezmaLibrary from '@/components/kinezma/KinezmaLibrary';
import { saveProject, getProject, listProjects, deleteProject, genProjectId, setActiveId, getActiveId } from '@/components/kinezma/kinezmaStore';

export default function Kinezma() {
  const [scene, setScene] = useState(null);
  const [cutouts, setCutouts] = useState({});
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState('');
  const [busyStart, setBusyStart] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [motion, setMotion] = useState(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playToken, setPlayToken] = useState(0);
  const [selected, setSelected] = useState(null);
  const [exportPct, setExportPct] = useState(null);
  const [video, setVideo] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const motionRef = useRef(null);
  const inputRef = useRef(null);

  // elapsed timer on long tasks
  useEffect(() => {
    if (!busy) return;
    setElapsed(0);
    const iv = setInterval(() => setElapsed(Math.round((Date.now() - busyStart) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [busy, busyStart]);

  // playback loop
  useEffect(() => {
    if (!playToken) return;
    const m = motionRef.current;
    if (!m) return;
    setPlaying(true);
    let raf;
    const start = performance.now();
    const loop = () => {
      let t = (performance.now() - start) / 1000;
      const d = m.duration || 4;
      if (t >= d) {
        if (m.loop) t = t % d;
        else { setTime(d); setPlaying(false); return; }
      }
      setTime(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playToken]);

  const restoreProject = (p) => {
    setProjectId(p.id);
    setActiveId(p.id);
    setScene(p.scene);
    setCutouts(p.cutouts || {});
    setMessages(p.messages || []);
    setSelected(null);
    setVideo(null);
    if (p.motion?.tracks?.length) {
      motionRef.current = p.motion;
      setMotion(p.motion);
      setTime(p.motion.duration || 0);
    }
  };

  // restore last active project on mount — survives refresh
  useEffect(() => {
    const activeId = getActiveId();
    const load = (p) => {
      if (p) restoreProject(p);
      return listProjects();
    };
    (activeId ? getProject(activeId).then(load) : load(null))
      .then(setProjects)
      .catch(() => setProjects([]));
  }, []);

  // debounced autosave — users can always return to their work
  useEffect(() => {
    if (!scene) return;
    const id = setTimeout(() => {
      const firstAsk = (messages.find((m) => m.role === 'user')?.text || '').slice(0, 40);
      const p = {
        id: projectId || genProjectId(),
        name: firstAsk || 'Untitled scene',
        scene,
        cutouts,
        motion,
        messages,
        savedAt: Date.now()
      };
      saveProject(p)
        .then(() => {
          setProjectId(p.id);
          setActiveId(p.id);
          return listProjects();
        })
        .then(setProjects)
        .catch(() => {});
    }, 1200);
    return () => clearTimeout(id);
  }, [scene, cutouts, motion, messages, projectId]);

  const newProject = () => {
    setScene(null);
    setCutouts({});
    setMotion(null);
    motionRef.current = null;
    setMessages([]);
    setVideo(null);
    setSelected(null);
    setProjectId(null);
    setActiveId(null);
  };

  const openProject = (id) => {
    getProject(id)
      .then((p) => {
        if (p) restoreProject(p);
        setLibraryOpen(false);
      })
      .catch(() => {});
  };

  const removeProject = (id) => {
    deleteProject(id)
      .then(() => listProjects())
      .then(setProjects)
      .catch(() => {});
  };

  const playMotion = (m) => {
    motionRef.current = m;
    setMotion(m);
    setTime(0);
    setPlayToken((t) => t + 1);
  };

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setBusy('Splitting your image into components');
    setBusyStart(Date.now());
    try {
      const up = await base44.integrations.Core.UploadFile({ file });
      const img = await loadImage(up.file_url);
      const w = 1000;
      const h = Math.max(400, Math.min(2200, Math.round((w * img.naturalHeight) / img.naturalWidth)));
      const sc = await decomposeImage({ imageUrl: up.file_url, width: w, height: h });
      const cuts = await buildCutouts(up.file_url, sc);
      setScene(sc);
      setCutouts(cuts);
      setSelected(null);
      setVideo(null);
      setProjectId(null);
      setActiveId(null);
      setMessages([
        {
          role: 'assistant',
          text: `Split your image into ${sc.components.length} components. Click any component to drag it around — then tell me the motion, e.g. "make the title drop in and bounce, background slowly pans left". Or ask me to generate a brand-new asset — a logo, icon, or b-roll — premium quality, fully controllable.`
        }
      ]);
    } catch (e) {
      setMessages([{ role: 'assistant', text: `Something went wrong: ${e?.message || e}` }]);
    } finally {
      setBusy('');
    }
  };

  const send = async (text) => {
    if (!text.trim() || busy) return;
    setMessages((m) => [...m, { role: 'user', text }, { role: 'assistant', text: 'Working on it', working: true }]);
    setBusy('Directing the scene');
    setBusyStart(Date.now());
    try {
      const m = await motionFromChat({ request: text, scene, currentMotion: motionRef.current });
      if (m.asset) {
        const built = await buildAsset(m.asset, scene);
        setScene((s) => ({ ...s, components: [...s.components, built.component] }));
        if (built.dataUrl) setCutouts((c) => ({ ...c, [built.component.id]: built.dataUrl }));
        if (built.track) m.tracks = [...m.tracks, built.track];
      }
      if (m.edits.length) {
        setScene((s) => ({
          ...s,
          components: s.components.map((c) => {
            const e = m.edits.find((x) => x.component === c.id);
            if (!e) return c;
            return { ...c, text: e.text ?? c.text, color: e.color ?? c.color, bg: e.bg ?? c.bg, fontSize: e.fontSize ?? c.fontSize, fontFamily: e.fontFamily ?? c.fontFamily };
          })
        }));
      }
      if (m.tracks.length) playMotion({ tracks: m.tracks, duration: m.duration, loop: m.loop });
      setMessages((msgs) =>
        msgs.map((x) => (x.working ? { ...x, working: false, text: m.reply + (m.asset ? ' — added to the stage, animating in. Drag it into place or tell me what to change.' : m.tracks.length ? ' — playing now.' : '') } : x))
      );
    } catch (e) {
      setMessages((msgs) =>
        msgs.map((x) => (x.working ? { ...x, working: false, text: `Something went wrong: ${e?.message || e}` } : x))
      );
    } finally {
      setBusy('');
    }
  };

  const moveComponent = (id, x, y) => {
    setScene((s) => ({ ...s, components: s.components.map((c) => (c.id === id ? { ...c, x, y } : c)) }));
  };

  const editComponent = (id, patch) => {
    setScene((s) => ({ ...s, components: s.components.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  };

  const doExport = async () => {
    if (!motion) return;
    setExportPct(0.001);
    try {
      const blob = await exportKinezmaMp4({ scene, cutouts, motion, onProgress: (p) => setExportPct(Math.max(0.001, p)) });
      setVideo(URL.createObjectURL(blob));
      setExportPct(null);
    } catch (e) {
      setExportPct(null);
      setMessages((m) => [...m, { role: 'assistant', text: `Export failed: ${e?.message || e}` }]);
    }
  };

  const selectedComp = scene?.components.find((c) => c.id === selected);

  return (
    <div className="h-[100dvh] overflow-hidden bg-black text-white flex flex-col">
      <BackToStore />
      <div className="flex-1 min-h-0 flex flex-col px-4 pt-4 pb-3">
        <div className="shrink-0 flex items-center justify-between gap-3 pr-28">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-none">KINEZMA</h1>
            <p className="text-zinc-500 text-[11px] sm:text-xs mt-1">Image in · components split · motion from chat · 4K MP4 out</p>
          </div>
          <div className="flex items-center gap-2">
            {scene && (
              <button
                onClick={newProject}
                className="flex items-center gap-1.5 border border-zinc-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 hover:border-zinc-500 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> New
              </button>
            )}
            <button
              onClick={() => { listProjects().then(setProjects).catch(() => {}); setLibraryOpen(true); }}
              className="flex items-center gap-1.5 border border-zinc-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 hover:border-zinc-500 transition-colors"
            >
              <LibraryIcon className="w-3.5 h-3.5" /> Library{projects.length ? ` (${projects.length})` : ''}
            </button>
          </div>
        </div>

        {!scene ? (
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
            className="mt-4 flex-1 min-h-0 flex flex-col items-center justify-center gap-3 border border-dashed border-zinc-800 rounded-2xl cursor-pointer hover:border-zinc-600 transition-colors"
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />
            {busy ? (
              <div className="flex items-center gap-2 text-zinc-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{busy}{elapsed ? ` · ${elapsed}s` : ''}</span>
              </div>
            ) : (
              <>
                <Upload className="w-6 h-6 text-zinc-500" />
                <span className="text-sm text-zinc-400">Drop an image or click to upload</span>
                <span className="text-xs text-zinc-600">The AI splits it into editable components</span>
              </>
            )}
          </label>
        ) : (
          <div className="mt-4 flex-1 min-h-0 flex flex-col lg:flex-row gap-3">
            <div className="flex-1 min-h-0 flex flex-col gap-2">
              <div className="flex-1 min-h-0 border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950">
                <KinezmaStage
                  scene={scene}
                  cutouts={cutouts}
                  motion={motion}
                  time={time}
                  selected={selected}
                  onSelect={setSelected}
                  onMove={moveComponent}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => setPlayToken((t) => t + 1)}
                  disabled={!motion}
                  className="flex items-center gap-2 bg-white text-black text-sm font-semibold rounded-lg px-4 py-2 disabled:opacity-30"
                >
                  <Play className="w-4 h-4" /> {playing ? 'Restart' : 'Play'}
                </button>
                <button
                  onClick={doExport}
                  disabled={!motion || exportPct !== null}
                  className="flex items-center gap-2 border border-zinc-700 text-sm font-semibold rounded-lg px-4 py-2 hover:border-zinc-400 disabled:opacity-30 transition-colors"
                >
                  {exportPct !== null ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {exportPct !== null ? `Recording 4K ${Math.round(exportPct * 100)}%` : 'Export 4K MP4'}
                </button>
                {motion && (
                  <span className="text-xs text-zinc-500">
                    {motion.duration}s · {motion.tracks.length} moving · {playing ? 'playing' : 'idle'}
                  </span>
                )}
              </div>

              {video && (
                <video src={video} controls loop className="h-24 w-auto max-w-full rounded-lg border border-zinc-800 shrink-0" />
              )}

              {selectedComp && (
                <div className="shrink-0 border border-zinc-800 rounded-xl p-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-zinc-500 uppercase tracking-wide">{selectedComp.name}</span>
                  {selectedComp.kind === 'text' && (
                    <input
                      value={selectedComp.text || ''}
                      onChange={(e) => editComponent(selectedComp.id, { text: e.target.value })}
                      className="flex-1 min-w-[160px] bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
                    />
                  )}
                  {selectedComp.kind !== 'cutout' && (
                    <label className="flex items-center gap-2 text-xs text-zinc-500">
                      color
                      <input
                        type="color"
                        value={selectedComp.kind === 'text' ? selectedComp.color || '#000000' : selectedComp.bg || '#000000'}
                        onChange={(e) =>
                          editComponent(selectedComp.id, selectedComp.kind === 'text' ? { color: e.target.value } : { bg: e.target.value })
                        }
                        className="w-8 h-8 bg-transparent cursor-pointer"
                      />
                    </label>
                  )}
                  <span className="text-xs text-zinc-600">drag on stage to reposition</span>
                </div>
              )}
            </div>

            <div className="h-56 lg:h-auto lg:w-[340px] shrink-0 min-h-0">
              <KinezmaChat messages={messages} busy={!!busy} elapsed={elapsed} onSend={send} />
            </div>
          </div>
        )}
      </div>
      {libraryOpen && (
        <KinezmaLibrary
          projects={projects}
          currentId={projectId}
          onClose={() => setLibraryOpen(false)}
          onOpen={openProject}
          onDelete={removeProject}
        />
      )}
    </div>
  );
}