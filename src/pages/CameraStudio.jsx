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
import { exportCameraPhoto, exportCameraVideo } from '@/components/camerastudio/cameraStudioExport';
import '@/components/camerastudio/cameraStudio.css';
export default function CameraStudio() {
  const state = useCameraProject(), { project, update, setError } = state;
  const input = useRef(null), engine = useRef(null);
  const [library, setLibrary] = useState(false), [playing, setPlaying] = useState(false), [ready, setReady] = useState(false), [exporting, setExporting] = useState(false), [progress, setProgress] = useState(0);
  const [playhead, setPlayhead] = useState(0), [armed, setArmed] = useState(false), [activePointId, setActivePointId] = useState(null), [pointPreview, setPointPreview] = useState(null), [layerPreview, setLayerPreview] = useState(null);
  const displayAssets = project.assets.map(item => item.id === layerPreview?.id ? { ...item, transform: layerPreview.transform } : item);
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
      {!state.loaded ? <div role="status" className="flex items-center gap-2"><Loader2 size={18} className="animate-spin"/>Opening local project…</div> : <CameraStudioStage asset={asset} assets={displayAssets} selected={project.selected} settings={project.settings} playing={playing} engineRef={engine} add={add} upload={upload} busy={exporting} onReady={setReady} onError={setError} interestPoints={project.editorMode === 'compose' ? previewPoints : []} overlayPoints={previewPoints} playhead={playhead} onTime={setPlayhead} armed={project.editorMode === 'operator' && armed} activePointId={activePointId} onSelectPoint={selectInterestPoint} onPlacePoint={placeInterestPoint} onPreviewPoint={previewInterestPoint} onMovePoint={updateInterestPoint} showFocus={project.settings.mode === 'video' && project.editorMode === 'operator'} layersEditable={project.editorMode === 'operator'} selectAsset={selected => state.patch({ selected })} previewAsset={(id, transform) => setLayerPreview({ id, transform })} commitAsset={(id, transform) => { state.patch({ assets: project.assets.map(item => item.id === id ? { ...item, transform } : item) }); setLayerPreview(null); }}/>}
      {library && !exporting && <CameraStudioLibrary assets={project.assets} selected={project.selected} select={selected => { setPlaying(false); state.patch({ selected }); }} remove={id => { setPlaying(false); state.patch({ interestPoints: (project.interestPoints || []).filter(point => point.assetId !== id) }); state.remove(id); }} close={() => setLibrary(false)} add={upload}/>}
    </main>
    {project.settings.mode === 'video' && asset && <CameraVideoTimeline duration={project.settings.duration} time={playhead} playing={playing} togglePlay={() => setPlaying(value => !value)} points={interestPoints} activeId={activePointId} select={selectInterestPoint} remove={removeInterestPoint} move={updateInterestPoint} preview={previewInterestPoint} easing={project.settings.easing || 'auto'} seek={time => { setPlaying(false); setPlayhead(time); }}/>} 
    <CameraStudioDock settings={project.settings} update={patch => { if (patch.mode) { setPlaying(false); setArmed(false); setPlayhead(0); } update(patch); }} exporting={exporting || !state.loaded} progress={progress} ready={ready} capture={capture}/>
  </div>;
}