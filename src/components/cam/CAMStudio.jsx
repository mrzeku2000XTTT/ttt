import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOVES, moveById, drawInto } from './camMoves';
import { base44 } from '@/api/base44Client';
import CamFusionScene from './CamFusionScene';
import CamFusionPanel from './CamFusionPanel';
import CamAIAgent from './CamAIAgent';
import useCamNodes from './useCamNodes';
import { extractLayers } from './fusionExtract';
import CamTopBar from './CamTopBar';
import CamViewerDeck from './CamViewerDeck';
import CamTransport from './CamTransport';
import CamInspector from './CamInspector';
import CamShotStrip from './CamShotStrip';
import CamEditorPanel from '@/components/cam/CamEditorPanel';
import useCamTimeline from '@/components/cam/useCamTimeline';
import { captureScene } from '@/components/cam/camTimelineModel';
import renderCamScene from '@/components/cam/camSceneRender';
import { edgeSmartCrop } from '@/components/cam/camSmartCrop';
import { findAnimationPreset } from '@/components/cam/camAnimationLibrary';

const LOGO = 'https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/154c8ae70_generated_image.png';
const CW = 1280, CH = 720;
const FUSION_W = 4.8;

export default function CAMStudio({ address, onHome }) {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const canvasRef = useRef(null);
  const barRef = useRef(null);
  const [img, setImg] = useState(null);
  const [moveId, setMoveId] = useState('dolly');
  const [intensity, setIntensity] = useState(0.6);
  const [duration, setDuration] = useState(4);
  const [playing, setPlaying] = useState(false);
  const [mode, setMode] = useState('move'); // 'move' | 'seq'
  const [viewZoom, setViewZoom] = useState(0.85); // framing zoom — zoomed out a touch by default
  const [splitPct, setSplitPct] = useState(50); // viewer split — 2D vs 3D pane sizes
  const [maxPane, setMaxPane] = useState(null); // 'media' | 'camera' | 'nodes' | null
  const [seqIdx, setSeqIdx] = useState(0);
  const [shots, setShots] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`cam_shots_${address}`)) || []; } catch { return []; }
  });
  const [fusionOn, setFusionOn] = useState(false);
  const [fusionBusy, setFusionBusy] = useState(false);
  const [fusionElapsed, setFusionElapsed] = useState(0);
  const [fusionError, setFusionError] = useState('');
  const [fusionSel, setFusionSel] = useState(null);
  const [fusionLayers, setFusionLayers] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`cam_fusion_${address}`)) || []; } catch { return []; }
  });
  const fusionFileRef = useRef(null);
  const [imgSize, setImgSize] = useState({ w: 1280, h: 720 });
  // node graph — restored from the user's persisted project so it survives refresh
  const graph = useCamNodes(() => { try { return JSON.parse(localStorage.getItem(`cam_graph_${address}`)); } catch { return null; } });

  // multi-media 3D rig — the first item (id 'primary') is the filmed background;
  // the rest are extra asset planes the user drops into the world.
  const [media, setMedia] = useState([]);
  const [manualOffset, setManualOffset] = useState({ x: 0, y: 0, z: 0 });
  const [autoKey, setAutoKey] = useState(false);
  const [camRig, setCamRig] = useState({ fov: 48, distance: 4.2, roll: 0, autoOrbit: false });
  const [refId, setRefId] = useState(null);
  const mediaInputRef = useRef(null);
  const timeline = useCamTimeline(address, captureScene(media, manualOffset, camRig, moveId, intensity, duration));
  const timelineRef = useRef(timeline); timelineRef.current = timeline;
  const scene = timeline.enabled ? timeline.scene : null;
  const primaryPose = scene?.assets.find((a) => a.id === 'primary');
  const previewOffset = scene && !timeline.recording ? { x: (primaryPose?.x || 0) / 2.4, y: (primaryPose?.y || 0) / 1.6, z: (primaryPose?.z || 0) / 2.2 } : manualOffset;
  const previewMedia = scene && !timeline.recording ? media.flatMap((m) => { const pose = scene.assets.find((a) => a.id === m.id); return pose ? [{ ...m, pos: { x: pose.x, y: pose.y, z: pose.z }, scale: pose.scale, rotation: pose.rotation, opacity: pose.opacity, glow: pose.glow }] : []; }) : media;
  useEffect(() => { if (scene && !fusionOn) renderCamScene(canvasRef.current, scene, media, viewZoom); }, [scene, media, viewZoom, fusionOn]);

  // refs mirrored for the animation loop
  const playingRef = useRef(false); playingRef.current = playing;
  const modeRef = useRef(mode); modeRef.current = mode;
  const shotsRef = useRef(shots); shotsRef.current = shots;
  const seqIdxRef = useRef(0);
  const pRef = useRef(0);
  const curRef = useRef({}); curRef.current = { moveId, intensity, duration };
  const viewZoomRef = useRef(0.85); viewZoomRef.current = viewZoom;

  // shared frame reader — the 3D rig view animates from the exact same virtual camera state
  const getFrame = useCallback(() => {
    const timeline = timelineRef.current;
    if (timeline.enabled) { const s = timeline.scene; return { move: moveById(s.camera.moveId), intensity: s.camera.intensity, p: s.progress, visibleAssets: s.assets.map((a) => a.id) }; }
    const seqMode = modeRef.current === 'seq' && shotsRef.current.length > 0;
    const active = seqMode
      ? shotsRef.current[seqIdxRef.current % shotsRef.current.length]
      : curRef.current;
    return { move: moveById(active.move || active.moveId), intensity: active.intensity, p: pRef.current };
  }, []);

  useEffect(() => {
    try { localStorage.setItem(`cam_shots_${address}`, JSON.stringify(shots)); } catch {}
  }, [shots, address]);
  useEffect(() => {
    try { localStorage.setItem(`cam_fusion_${address}`, JSON.stringify(fusionLayers)); } catch {}
  }, [fusionLayers, address]);
  useEffect(() => {
    try { localStorage.setItem(`cam_graph_${address}`, JSON.stringify({ nodes: graph.nodes, edges: graph.edges })); } catch {}
  }, [graph.nodes, graph.edges, address]);

  const drawStill = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img || timelineRef.current.enabled) return;
    if (modeRef.current === 'seq' && shotsRef.current.length) {
      const shot = shotsRef.current[seqIdxRef.current % shotsRef.current.length];
      drawInto(canvas.getContext('2d'), CW, CH, img, moveById(shot.move), pRef.current, shot.intensity, viewZoomRef.current);
    } else {
      drawInto(canvas.getContext('2d'), CW, CH, img, moveById(curRef.current.moveId), pRef.current, curRef.current.intensity, viewZoomRef.current);
    }
  }, [img]);

  useEffect(() => { if (!playing) { pRef.current = 0; drawStill(); } }, [img, moveId, intensity, mode, seqIdx, playing, drawStill, viewZoom]);

  // animation loop — advances the virtual camera through the active move / sequence
  useEffect(() => {
    let raf, last = performance.now();
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.1); last = now;
      if (timelineRef.current.enabled) { if (barRef.current) barRef.current.style.width = `${timelineRef.current.total ? timelineRef.current.time / timelineRef.current.total * 100 : 0}%`; return; }
      if (!playingRef.current || !img) return;
      const seqMode = modeRef.current === 'seq' && shotsRef.current.length > 0;
      const active = seqMode
        ? shotsRef.current[seqIdxRef.current % shotsRef.current.length]
        : { move: curRef.current.moveId, intensity: curRef.current.intensity, duration: curRef.current.duration };
      pRef.current += dt / Math.max(0.5, active.duration || 4);
      if (pRef.current >= 1) {
        pRef.current = 0;
        if (seqMode) { seqIdxRef.current = (seqIdxRef.current + 1) % shotsRef.current.length; setSeqIdx(seqIdxRef.current); }
      }
      const canvas = canvasRef.current;
      if (canvas) drawInto(canvas.getContext('2d'), CW, CH, img, moveById(active.move), pRef.current, active.intensity, viewZoomRef.current);
      if (barRef.current) barRef.current.style.width = `${pRef.current * 100}%`;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [img]);

  const handleFile = (file) => {
    if (!file) return;
    fusionFileRef.current = file;
    setFusionLayers([]); setFusionSel(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target.result;
      const ni = new Image();
      ni.onload = () => {
        setImg(ni); setImgSize({ w: ni.naturalWidth, h: ni.naturalHeight }); pRef.current = 0;
        // the uploaded image is the rig's background plane (media[0])
        const primary = { id: 'primary', img: ni, url, name: 'Background', pos: { x: 0, y: 0, z: 0 }, scale: 1 };
        setMedia((prev) => (prev.length && prev[0].id === 'primary' ? [primary, ...prev.slice(1)] : [primary, ...prev]));
      };
      ni.src = url;
    };
    reader.readAsDataURL(file);
  };
  // drop another image into the 3D world as a movable asset plane
  const addMedia = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const ni = new Image();
      ni.onload = async () => {
        const crop = await edgeSmartCrop(ni), id = `media-${Date.now()}`;
        setMedia((prev) => {
          const extras = prev.filter((m) => m.id !== 'primary'), idx = extras.length;
          return [...prev, { id, img: crop.image, url: crop.url, sourceUrl: ev.target.result, name: `Cutout ${idx + 1}`, pos: { x: (idx % 2 ? 1.7 : -1.7), y: (idx < 2 ? 0.7 : -0.7), z: -0.6 * (idx + 1) }, scale: 0.6, aspect: crop.width / crop.height, edgeCropped: crop.cropped }];
        });
        setRefId(id);
      };
      ni.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };
  const onMovePick = (id) => {
    if (!timeline.recording) timeline.leave();
    if (autoKey) {
      // auto keyframe — append a shot and spawn a node for each clicked move
      setShots((prev) => [...prev, { id: Date.now(), move: id, intensity, duration }]);
      graph.addNode('Camera3D');
    } else {
      setMoveId(id); setMode('move');
    }
  };
  const onOffset = (axis, value) => setManualOffset((o) => ({ ...o, [axis]: value }));
  const onSelectAsset = (id) => setRefId(id);
  const onBeginAssetMove = () => {
    if (timeline.enabled && !timeline.recording) timeline.leave();
    setPlaying(false);
  };
  const applyAssetAnimation = (preset, assetId = refId, amount = 1) => {
    const target = assetId || media.find((m) => m.id !== 'primary')?.id || 'primary';
    const match = findAnimationPreset(preset);
    setRefId(target); timeline.applyAnimation(target, match.id, Math.min(1.5, Math.max(0.1, amount)));
  };
  const smartCropAsset = async (id = refId) => {
    const source = media.find((m) => m.id === id); if (!source || id === 'primary') return;
    const crop = await edgeSmartCrop(source.img);
    setMedia((items) => items.map((m) => m.id === id ? { ...m, img: crop.image, url: crop.url, aspect: crop.width / crop.height, edgeCropped: crop.cropped } : m));
  };
  const onMoveAsset = (id, axis, value) => {
    if (id === 'primary') {
      const units = { x: 2.4, y: 1.6, z: 2.2 };
      setManualOffset((o) => ({ ...o, [axis]: value / units[axis] }));
    } else {
      setMedia((items) => items.map((m) => m.id === id ? { ...m, pos: { ...m.pos, [axis]: value } } : m));
    }
  };

  // Per-asset axis tool — the Inspector XYZ sliders edit whichever asset is
  // currently selected. The background ('primary') uses the normalized offset
  // the rig scales; every other asset edits its world-space position directly.
  const selectedMedia = refId && refId !== 'primary' ? media.find((m) => m.id === refId) : null;
  const axisOffset = selectedMedia ? selectedMedia.pos : manualOffset;
  const axisRange = selectedMedia ? 3 : 1;
  const axisTargetName = selectedMedia ? selectedMedia.name : 'Background';
  const onAxis = (axis, value) => {
    if (selectedMedia) setMedia((prev) => prev.map((m) => (m.id === selectedMedia.id ? { ...m, pos: { ...m.pos, [axis]: value } } : m)));
    else setManualOffset((o) => ({ ...o, [axis]: value }));
  };
  const onAxisReset = () => {
    if (selectedMedia) setMedia((prev) => prev.map((m) => (m.id === selectedMedia.id ? { ...m, pos: { x: 0, y: 0, z: 0 } } : m)));
    else setManualOffset({ x: 0, y: 0, z: 0 });
  };
  useEffect(() => {
    const onPaste = (e) => {
      const items = e.clipboardData?.items || [];
      for (const it of items) if (it.type.startsWith('image/')) { handleFile(it.getAsFile()); break; }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  const togglePlay = () => { if (timeline.enabled) { if (!timeline.recording) timeline.play(); return; } if (img) setPlaying((v) => !v); };
  const restart = () => {
    if (timeline.enabled) { timeline.seek(0); return; }
    pRef.current = 0; seqIdxRef.current = 0; setSeqIdx(0);
    if (!playing) drawStill();
    if (barRef.current) barRef.current.style.width = '0%';
  };
  const playSequence = () => {
    if (!img || !shots.length) return;
    timeline.leave();
    setMode('seq'); pRef.current = 0; seqIdxRef.current = 0; setSeqIdx(0); setPlaying(true);
  };
  const addShot = () => setShots((prev) => [...prev, { id: Date.now(), move: moveId, intensity, duration }]);
  const loadShot = (shot) => {
    timeline.leave();
    setMode('move'); setMoveId(shot.move); setIntensity(shot.intensity); setDuration(shot.duration);
  };
  const downloadStoryboard = () => {
    if (!img) return;
    const fw = 480, fh = 270;
    const off = document.createElement('canvas');
    off.width = fw * 4; off.height = fh;
    const ctx = off.getContext('2d');
    const move = moveById(moveId);
    [0, 1, 2, 3].forEach((k) => {
      ctx.save();
      ctx.translate(fw * k, 0);
      ctx.beginPath(); ctx.rect(0, 0, fw, fh); ctx.clip();
      drawInto(ctx, fw, fh, img, move, k / 3, intensity, viewZoomRef.current);
      ctx.restore();
    });
    const a = document.createElement('a');
    a.download = `cam-${moveId}-storyboard.png`;
    a.href = off.toDataURL('image/png');
    a.click();
  };

  // Fusion mode — explode the uploaded image into individual 3D layers
  const toggleFusion = () => { setMaxPane(null); if (!fusionOn) setPlaying(false); setFusionOn(!fusionOn); };
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setMaxPane(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const decompose = async () => {
    const file = fusionFileRef.current;
    if (!file || fusionBusy) return;
    setFusionError(''); setFusionBusy(true); setFusionElapsed(0);
    const tick = setInterval(() => setFusionElapsed((s) => s + 1), 1000);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri, expires_in: 86400 });
      const res = await base44.functions.invoke('metaMimicClone', { imageUrl: signed_url, cloneMode: true, imageWidth: imgSize.w, imageHeight: imgSize.h });
      const html = res?.data?.html;
      if (!html) throw new Error(res?.data?.error || 'Could not decompose this image.');
      const raw = await extractLayers(html, imgSize.w, imgSize.h);
      const scale = FUSION_W / imgSize.w;
      const layers = raw.map((l, i) => {
        const pos = { x: (l.x + l.w / 2 - imgSize.w / 2) * scale, y: -(l.y + l.h / 2 - imgSize.h / 2) * scale, z: 0.014 * i };
        return { ...l, id: `f${i}`, scale, pos, base: pos };
      });
      setFusionLayers(layers); setFusionSel(null);
    } catch (err) {
      setFusionError(err?.message || 'Decomposition failed. Please try again.');
    }
    clearInterval(tick); setFusionBusy(false);
  };
  const commitFusionPos = (id, pos) => setFusionLayers((items) => items.map((l) => (l.id === id ? { ...l, pos } : l)));
  const setFusionPos = (id, axis, value) => setFusionLayers((items) => items.map((l) => (l.id === id ? { ...l, pos: { ...l.pos, [axis]: value } } : l)));
  const resetFusionPos = (id) => setFusionLayers((items) => items.map((l) => (l.id === id ? { ...l, pos: { ...l.base } } : l)));

  // CAM AI Agent — executes the tools the agent calls across the whole studio
  const runAgentAction = (a) => {
    if (!a?.tool) return;
    switch (a.tool) {
      case 'set_move': if (MOVES.some((m) => m.id === a.move)) { setMode('move'); setMoveId(a.move); } break;
      case 'set_intensity': setIntensity(Math.min(1, Math.max(0.05, a.value || 0.6))); break;
      case 'set_duration': setDuration(Math.min(30, Math.max(0.5, a.value || 4))); break;
      case 'add_shot': setShots((prev) => [...prev, { id: Date.now(), move: a.move || moveId, intensity: a.intensity ?? intensity, duration: a.duration ?? duration }]); break;
      case 'play': if (img) { if (timeline.isEnabled()) timeline.play(); else setPlaying(true); } break;
      case 'pause': if (timeline.isEnabled()) timeline.setRunning(false); else setPlaying(false); break;
      case 'play_sequence': playSequence(); break;
      case 'open_rig': setMaxPane('camera'); break;
      case 'open_nodes': setMaxPane('nodes'); break;
      case 'restore_view': setMaxPane(null); break;
      case 'fusion_on': if (!fusionOn) toggleFusion(); break;
      case 'fusion_off': if (fusionOn) toggleFusion(); break;
      case 'decompose': if (!fusionOn) toggleFusion(); decompose(); break;
      case 'move_layer': {
        const l = a.layer === -1 ? fusionLayers.find((x) => x.id === fusionSel) : fusionLayers[a.layer];
        if (l && ['x', 'y', 'z'].includes(a.axis)) setFusionPos(l.id, a.axis, a.value || 0);
        break;
      }
      case 'set_image': if (a.file) handleFile(a.file); break;
      case 'add_media': if (a.file) addMedia(a.file); break;
      case 'move_media': {
        const m = a.asset_id === 'primary' ? media[0] : media.find((x) => x.id === a.asset_id);
        if (m && ['x', 'y', 'z'].includes(a.axis)) setMedia((prev) => prev.map((x) => (x.id === m.id ? { ...x, pos: { ...x.pos, [a.axis]: a.value } } : x)));
        break;
      }
      case 'select_ref': setRefId(a.asset_id || null); break;
      case 'animate_asset': applyAssetAnimation(a.preset || 'cinematic-rise-fade', a.asset_id || refId, a.intensity || 1); break;
      case 'smart_crop_asset': smartCropAsset(a.asset_id || refId); break;
      case 'set_offset': if (['x', 'y', 'z'].includes(a.axis)) setManualOffset((o) => ({ ...o, [a.axis]: a.value })); break;
      case 'set_fov': setCamRig((c) => ({ ...c, fov: a.value })); break;
      case 'set_distance': setCamRig((c) => ({ ...c, distance: a.value })); break;
      case 'set_roll': setCamRig((c) => ({ ...c, roll: a.value })); break;
      case 'auto_orbit': setCamRig((c) => ({ ...c, autoOrbit: !!a.value })); break;
      default: break;
    }
  };
  const aiContext = { move: moveId, intensity: Math.round(intensity * 100) / 100, duration, mode, hasImage: !!img, shotCount: shots.length, fusionOn, layerCount: fusionLayers.length, mediaCount: media.length, refId, fov: camRig.fov };

  const currentMove = moveById(mode === 'seq' && shots.length ? shots[seqIdx % shots.length]?.move || moveId : moveId);

  if (fusionOn) {
    return (
      <div className="cm-page cm-fusion-shell">
        <CamTopBar logo={LOGO} address={address} onHome={onHome} onUpload={() => fileRef.current?.click()} onDownload={downloadStoryboard} onExit={() => navigate('/AppStoreV2')} canExport={!!img} fusionOn={fusionOn} onToggleFusion={toggleFusion} />
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
        <div className="cm-fusion-work">
          <main className="cm-fusion-center">
            <section className="cm-viewer" style={{ flex: 1 }}>
              <div className="cm-viewer-title"><span>Fusion1</span><span>3D Composite</span></div>
              <div className="cm-viewer-body">
                <CamFusionScene image={img} layers={fusionLayers} selectedId={fusionSel} onSelect={setFusionSel} onCommit={commitFusionPos} />
              </div>
            </section>
          </main>
          <CamFusionPanel hasImage={!!img} busy={fusionBusy} elapsed={fusionElapsed} error={fusionError} layers={fusionLayers} selectedId={fusionSel} onSelect={setFusionSel} onDecompose={decompose} onPos={setFusionPos} onReset={resetFusionPos} />
        </div>
        <input ref={mediaInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => Array.from(e.target.files || []).forEach(addMedia)} />
        <CamAIAgent address={address} context={aiContext} onAction={runAgentAction} onGraph={graph.addAINodes} media={media} refId={refId} onClearRef={() => setRefId(null)} />
      </div>
    );
  }

  return (
    <div className={`cm-page cm-fusion-shell ${maxPane === 'nodes' ? 'is-max-nodes' : ''}`}>
      <CamTopBar logo={LOGO} address={address} onHome={onHome} onUpload={() => fileRef.current?.click()} onDownload={downloadStoryboard} onExit={() => navigate('/AppStoreV2')} canExport={!!img} fusionOn={fusionOn} onToggleFusion={toggleFusion} />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      <input ref={mediaInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => Array.from(e.target.files || []).forEach(addMedia)} />
      <div className="cm-fusion-work">
        <main className="cm-fusion-center">
          <CamViewerDeck canvasRef={canvasRef} image={img} getFrame={getFrame} label={`${currentMove.label} · ${Math.round(intensity * 100)}% · ${duration}s`} onUpload={() => fileRef.current?.click()} onFile={handleFile} split={splitPct} onSplit={setSplitPct} max={maxPane === 'media' || maxPane === 'camera' ? maxPane : null} onMax={setMaxPane} media={previewMedia} manualOffset={previewOffset} camRig={scene?.camera || camRig} onSelectAsset={onSelectAsset} refId={refId} onOffset={onOffset} onMoveAsset={onMoveAsset} onBeginAssetMove={onBeginAssetMove} />
          <CamTransport currentTime={timeline.enabled ? timeline.time : undefined} totalTime={timeline.enabled ? timeline.total : undefined} onPrevious={timeline.enabled ? () => timeline.seek([...timeline.project.cuts].map((c) => c.start).sort((a, b) => b - a).find((t) => t < timeline.time - 0.01) ?? 0) : undefined} onNext={timeline.enabled ? () => timeline.seek([...timeline.project.cuts].map((c) => c.start).sort((a, b) => a - b).find((t) => t > timeline.time + 0.01) ?? timeline.total) : undefined} playing={timeline.enabled ? timeline.running : playing} canPlay={!!img && !timeline.recording} onPlay={togglePlay} onRestart={restart} barRef={barRef} zoom={viewZoom} setZoom={setViewZoom} label={mode === 'seq' && shots.length ? `Shot ${seqIdx + 1}/${shots.length}` : `${duration}s`} />
          <div className="cm-fusion-lower">
            <CamShotStrip shots={shots} activeIndex={seqIdx} onAdd={addShot} onPlay={playSequence} onLoad={loadShot} onDelete={(id) => setShots((items) => items.filter((shot) => shot.id !== id))} canUse={!!img} />
            <CamEditorPanel timeline={timeline} media={media} onAddMedia={() => mediaInputRef.current?.click()} onSelectAsset={onSelectAsset} graph={graph} image={img} moveLabel={currentMove.label} intensity={intensity} duration={duration} isMax={maxPane === 'nodes'} onMax={() => setMaxPane(maxPane === 'nodes' ? null : 'nodes')} />
          </div>
        </main>
        <CamInspector moveId={moveId} onMovePick={onMovePick} autoKey={autoKey} setAutoKey={setAutoKey} intensity={intensity} setIntensity={setIntensity} duration={duration} setDuration={setDuration} camRig={camRig} setCamRig={setCamRig} media={media} onAddMedia={() => mediaInputRef.current?.click()} onSelectAsset={onSelectAsset} refId={refId} onApplyAnimation={applyAssetAnimation} onSmartCrop={smartCropAsset} activeAnimation={timeline.project.tracks.find((t) => t.assetId === refId)?.clips.find((c) => c.id === timeline.selected)?.animationId} axisOffset={axisOffset} axisRange={axisRange} axisTargetName={axisTargetName} onAxis={onAxis} onAxisReset={onAxisReset} />
        <CamAIAgent address={address} context={aiContext} onAction={runAgentAction} onGraph={graph.addAINodes} media={media} refId={refId} onClearRef={() => setRefId(null)} />
      </div>
    </div>
  );
}