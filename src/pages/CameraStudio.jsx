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
  const [playhead, setPlayhead] = useState(0), [armed, setArmed] = useState(false), [activePointId, setActivePointId] = useState(null);
  const asset = project.assets.find(item => item.id === project.selected);
  const interestPoints = (project.interestPoints || []).filter(point => point.assetId === project.selected).sort((a, b) => a.time - b.time);
  const upload = () => input.current?.click();
  const add = files => { setPlaying(false); setPlayhead(0); setArmed(false); state.add(files); };
  const placeInterestPoint = position => {
    if (!asset || interestPoints.length >= 3) return;
    const point = { id: crypto.randomUUID(), assetId: asset.id, time: playhead, ...position };
    state.patch({ interestPoints: [...(project.interestPoints || []), point] });
    setActivePointId(point.id); setArmed(false);
  };
  const removeInterestPoint = id => {
    state.patch({ interestPoints: (project.interestPoints || []).filter(point => point.id !== id) });
    if (activePointId === id) setActivePointId(null);
  };
  const capture = async () => {
    if (!engine.current || !ready || exporting) return;
    setPlaying(false); setLibrary(false); setExporting(true); setProgress(0); setError('');
    try { if (project.settings.mode === 'photo') await exportCameraPhoto(engine.current, project.settings, project.name); else await exportCameraVideo(engine.current, project.settings, project.name, setProgress, interestPoints); }
    catch (error) { setError(error.message); }
    finally { setExporting(false); }
  };
  return <div className="camera-studio">
    <BackToStore/>
    <header className="camera-heading"><Link to="/AppStoreV2"><ArrowLeft size={15}/>Store</Link><strong>Camera Studio</strong><span>Native 3D editor</span></header>
    <input ref={input} hidden type="file" multiple accept="image/png,image/jpeg,image/webp,image/avif,image/gif,video/*" onChange={e => { add(e.target.files); e.target.value = ''; }}/>
    <CameraStudioToolbar project={project} rename={name => state.patch({ name })} add={upload} library={library} toggleLibrary={() => setLibrary(!library)} undo={() => { setPlaying(false); state.undo(); }} canUndo={state.past.length > 0} playing={playing} togglePlay={() => setPlaying(!playing)} disabled={exporting || !state.loaded} canPlay={ready} status={state.status} editorMode={project.editorMode || 'operator'} setEditorMode={editorMode => { setPlaying(false); setArmed(false); state.patch({ editorMode }); }} videoMode={project.settings.mode === 'video'} armed={armed} toggleArmed={() => setArmed(value => !value)} pointCount={interestPoints.length} canDelete={interestPoints.some(point => point.id === activePointId)} deletePoint={() => removeInterestPoint(activePointId)}/>
    {state.error && <div className="camera-error" role="alert">{state.error}<button onClick={() => setError('')} aria-label="Dismiss message"><X size={14}/></button></div>}
    <main className="camera-body">
      {!state.loaded ? <div role="status" className="flex items-center gap-2"><Loader2 size={18} className="animate-spin"/>Opening local project…</div> : <CameraStudioStage asset={asset} settings={project.settings} playing={playing} engineRef={engine} add={add} upload={upload} busy={exporting} onReady={setReady} onError={setError} interestPoints={interestPoints} playhead={playhead} onTime={setPlayhead} armed={project.editorMode === 'composer' && armed} activePointId={activePointId} onSelectPoint={setActivePointId} onPlacePoint={placeInterestPoint} showFocus={project.settings.mode === 'video' && project.editorMode === 'composer'}/>}
      {library && !exporting && <CameraStudioLibrary assets={project.assets} selected={project.selected} select={selected => { setPlaying(false); state.patch({ selected }); }} remove={id => { setPlaying(false); state.patch({ interestPoints: (project.interestPoints || []).filter(point => point.assetId !== id) }); state.remove(id); }} close={() => setLibrary(false)} add={upload}/>}
    </main>
    {project.settings.mode === 'video' && asset && <CameraVideoTimeline duration={project.settings.duration} time={playhead} playing={playing} togglePlay={() => setPlaying(value => !value)} points={interestPoints} activeId={activePointId} select={setActivePointId} remove={removeInterestPoint} seek={time => { setPlaying(false); setPlayhead(time); }}/>} 
    <CameraStudioDock settings={project.settings} update={patch => { if (patch.mode) { setPlaying(false); setArmed(false); setPlayhead(0); } update(patch); }} exporting={exporting || !state.loaded} progress={progress} ready={ready} capture={capture}/>
  </div>;
}