import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, X, Loader2 } from 'lucide-react';
import BackToStore from '@/components/BackToStore';
import useCameraProject from '@/components/camerastudio/useCameraProject';
import CameraStudioToolbar from '@/components/camerastudio/CameraStudioToolbar';
import CameraStudioStage from '@/components/camerastudio/CameraStudioStage';
import CameraStudioLibrary from '@/components/camerastudio/CameraStudioLibrary';
import CameraStudioDock from '@/components/camerastudio/CameraStudioDock';
import CameraVideoTimeline from '@/components/camerastudio/CameraVideoTimeline';
import CameraDirectorChat from '@/components/camerastudio/CameraDirectorChat';
import { layerTransformAt, mergeLayerKeyframes } from '@/components/camerastudio/cameraLayerAnimation';
import { exportCameraPhoto, exportCameraVideo } from '@/components/camerastudio/cameraStudioExport';
import '@/components/camerastudio/cameraStudio.css';
export default function CameraStudio() {
  const state = useCameraProject(), { project, update, setError } = state;
  const input = useRef(null), engine = useRef(null);
  const [library, setLibrary] = useState(false), [playing, setPlaying] = useState(false), [ready, setReady] = useState(false), [exporting, setExporting] = useState(false), [progress, setProgress] = useState(0);
  const [playhead, setPlayhead] = useState(0), [armed, setArmed] = useState(false), [activePointId, setActivePointId] = useState(null), [pointPreview, setPointPreview] = useState(null), [layerPreview, setLayerPreview] = useState(null), [recording, setRecording] = useState(false);
  const recordBuffer = useRef([]);
  const displayAssets = project.assets.map(item => item.id === layerPreview?.id ? { ...item, transform: layerPreview.transform, previewing: true } : item);
  const asset = project.assets.find(item => item.id === project.selected);
  const interestPoints = (project.interestPoints || []).filter(point => point.assetId === project.selected).sort((a, b) => a.time - b.time);
  const previewPoints = interestPoints.map(point => point.id === pointPreview?.id ? { ...point, ...pointPreview.patch } : point);
  const upload = () => input.current?.click();
  const add = files => { setPlaying(false); setPlayhead(0); setArmed(false); state.add(files); };
  const placeInterestPoint = position => {
    if (!asset || interestPoints.length >= 3) return;
    const point = { id: crypto.randomUUID(), assetId: asset.id, time: playhead, ...position };
    state.patch({ interestPoints: [...(project.interestPoints || []), point] });
    setActivePointId(point.id); setArmed(false);
  };
  const selectInterestPoint = id => {
    const point = interestPoints.find(item => item.id === id);
    setActivePointId(id); setPlaying(false);
    if (point) setPlayhead(point.time);
  };
  const previewInterestPoint = (id, patch) => {
    setPointPreview({ id, patch }); setPlaying(false);
    if (patch.time !== undefined) setPlayhead(patch.time);
  };
  const updateInterestPoint = (id, patch) => {
    state.patch({ interestPoints: (project.interestPoints || []).map(point => point.id === id ? { ...point, ...patch } : point) });
    setPointPreview(null);
  };
  const removeInterestPoint = id => {
    state.patch({ interestPoints: (project.interestPoints || []).filter(point => point.id !== id) });
    setPointPreview(null);
    if (activePointId === id) setActivePointId(null);
  };
  const previewAsset = (id, transform) => { setLayerPreview({ id, transform }); if (recording && id === project.selected) { const previous = recordBuffer.current.at(-1); if (!previous || Math.abs(playhead - previous.time) >= .07) recordBuffer.current.push({ id: crypto.randomUUID(), time: playhead, transform, easing: project.settings.easing || 'auto' }); } };
  const commitAsset = (id, transform) => { const captured = recording && id === project.selected ? [...recordBuffer.current, { id: crypto.randomUUID(), time: playhead, transform, easing: project.settings.easing || 'auto' }] : []; state.patch({ assets: project.assets.map(item => item.id === id ? { ...item, transform, keyframes: mergeLayerKeyframes(item.keyframes, captured) } : item) }); setLayerPreview(null); recordBuffer.current = recording ? [{ id: crypto.randomUUID(), time: playhead, transform, easing: project.settings.easing || 'auto' }] : []; };
  const toggleRecord = () => { const next = !recording; setRecording(next); setPlaying(next); const current = project.assets.find(item => item.id === project.selected); recordBuffer.current = next && current ? [{ id: crypto.randomUUID(), time: playhead, transform: layerTransformAt(current, playhead, project.settings.easing), easing: project.settings.easing || 'auto' }] : []; };
  const capture = async () => {
    if (!engine.current || !ready || exporting) return;
    setPlaying(false); setLibrary(false); setExporting(true); setProgress(0); setError('');
    try { if (project.settings.mode === 'photo') await exportCameraPhoto(engine.current, project.settings, project.name, displayAssets); else await exportCameraVideo(engine.current, project.settings, project.name, setProgress, interestPoints, displayAssets); }
    catch (error) { setError(error.message); }
    finally { setExporting(false); }
  };
  return <div className="camera-studio">
    <BackToStore/>
    <header className="camera-heading"><Link to="/AppStoreV2"><ArrowLeft size={15}/>Store</Link><strong>Camera Studio</strong><span>Native 3D editor</span></header>
    <input ref={input} hidden type="file" multiple accept="image/png,image/jpeg,image/webp,image/avif,image/gif,video/*" onChange={e => { add(e.target.files); e.target.value = ''; }}/>
    <CameraStudioToolbar project={project} rename={name => state.patch({ name })} add={upload} library={library} toggleLibrary={() => setLibrary(!library)} undo={() => { setPlaying(false); state.undo(); }} canUndo={state.past.length > 0} playing={playing} togglePlay={() => setPlaying(!playing)} disabled={exporting || !state.loaded} canPlay={ready} status={state.status} editorMode={project.editorMode || 'operator'} setEditorMode={editorMode => { setPlaying(false); setArmed(false); setPlayhead(0); state.patch({ editorMode }); }} compose={() => { setArmed(false); setPlayhead(0); state.patch({ editorMode: 'compose' }); setPlaying(true); }} videoMode={project.settings.mode === 'video'} armed={armed} toggleArmed={() => { setPlaying(false); state.patch({ editorMode: 'operator' }); setArmed(value => !value); }} pointCount={interestPoints.length} canDelete={interestPoints.some(point => point.id === activePointId)} deletePoint={() => removeInterestPoint(activePointId)}/>
    {state.error && <div className="camera-error" role="alert">{state.error}<button onClick={() => setError('')} aria-label="Dismiss message"><X size={14}/></button></div>}
    <main className="camera-body">
      {!state.loaded ? <div role="status" className="flex items-center gap-2"><Loader2 size={18} className="animate-spin"/>Opening local project…</div> : <CameraStudioStage asset={asset} assets={displayAssets} selected={project.selected} settings={project.settings} playing={playing} engineRef={engine} add={add} upload={upload} busy={exporting} onReady={setReady} onError={setError} interestPoints={project.editorMode === 'compose' ? previewPoints : []} overlayPoints={previewPoints} playhead={playhead} onTime={setPlayhead} armed={project.editorMode === 'operator' && armed} activePointId={activePointId} onSelectPoint={selectInterestPoint} onPlacePoint={placeInterestPoint} onPreviewPoint={previewInterestPoint} onMovePoint={updateInterestPoint} showFocus={project.settings.mode === 'video' && project.editorMode === 'operator'} layersEditable={project.editorMode === 'operator'} selectAsset={selected => state.patch({ selected })} previewAsset={previewAsset} commitAsset={commitAsset}/>}
      {library && !exporting && <CameraStudioLibrary assets={project.assets} selected={project.selected} select={selected => { setPlaying(false); state.patch({ selected }); }} remove={id => { setPlaying(false); state.patch({ interestPoints: (project.interestPoints || []).filter(point => point.assetId !== id) }); state.remove(id); }} close={() => setLibrary(false)} add={upload}/>}
    </main>
    {project.settings.mode === 'video' && asset && <CameraVideoTimeline duration={project.settings.duration} time={playhead} playing={playing} togglePlay={() => setPlaying(value => !value)} points={interestPoints} activeId={activePointId} select={selectInterestPoint} remove={removeInterestPoint} move={updateInterestPoint} preview={previewInterestPoint} easing={project.settings.easing || 'auto'} layerKeyframes={asset?.keyframes || []} recording={recording} toggleRecord={toggleRecord} seek={time => { setPlaying(false); setPlayhead(time); }}/>} 
    <CameraDirectorChat project={project} execute={actions => actions.forEach(action => { const settingMap = { set_mode: 'mode', set_ratio: 'ratio', set_motion: 'motion', set_easing: 'easing', set_duration: 'duration', set_background: 'background', set_zoom: 'zoom', set_radius: 'radius', set_shadow: 'shadow' }; if (settingMap[action.type]) update({ [settingMap[action.type]]: ['set_duration','set_zoom','set_radius','set_shadow'].includes(action.type) ? action.number_value : action.value }); else if (action.type === 'set_rotation') update({ x: action.x ?? project.settings.x, y: action.y ?? project.settings.y, z: action.z ?? project.settings.z }); else if (action.type === 'auto_frame') update({ x: 0, y: 0, z: 0, zoom: 1 }); else if (action.type === 'toggle_corners') update({ radius: project.settings.radius ? 0 : .08 }); else if (action.type === 'record_movement' && !recording) toggleRecord(); else if (action.type === 'stop_recording' && recording) toggleRecord(); else if (action.type === 'transform_selected' && asset) commitAsset(asset.id, { ...asset.transform, x: action.x ?? asset.transform?.x ?? 0, y: action.y ?? asset.transform?.y ?? 0, scale: action.scale ?? asset.transform?.scale ?? 1, rotation: action.rotation ?? asset.transform?.rotation ?? 0 }); else if (action.type === 'select_asset') { const match = project.assets.find(item => item.name.toLowerCase().includes((action.value || '').toLowerCase())); if (match) state.patch({ selected: match.id }); } else if (action.type === 'duplicate_selected' && asset) { const copy = { ...asset, id: crypto.randomUUID(), name: `${asset.name} copy`, transform: { ...asset.transform, x: (asset.transform?.x || 0) + .06, y: (asset.transform?.y || 0) + .06 }, keyframes: [] }; state.patch({ assets: [...project.assets, copy], selected: copy.id }); } else if (action.type === 'remove_selected' && asset) state.remove(asset.id); else if (action.type === 'play') setPlaying(true); else if (action.type === 'pause') setPlaying(false); else if (action.type === 'compose' && interestPoints.length) { state.patch({ editorMode: 'compose' }); setPlayhead(0); setPlaying(true); } else if (action.type === 'undo') state.undo(); else if (action.type === 'open_library') setLibrary(true); else if (action.type === 'add_media') upload(); else if (action.type === 'export') capture(); })}/>
    <CameraStudioDock settings={project.settings} update={patch => { if (patch.mode) { setPlaying(false); setArmed(false); setPlayhead(0); } update(patch); }} exporting={exporting || !state.loaded} progress={progress} ready={ready} capture={capture}/>
  </div>;
}