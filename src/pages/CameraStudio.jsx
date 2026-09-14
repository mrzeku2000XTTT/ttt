import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, X, Loader2 } from 'lucide-react';
import BackToStore from '@/components/BackToStore';
import useCameraProject from '@/components/camerastudio/useCameraProject';
import CameraStudioToolbar from '@/components/camerastudio/CameraStudioToolbar';
import CameraStudioStage from '@/components/camerastudio/CameraStudioStage';
import CameraStudioLibrary from '@/components/camerastudio/CameraStudioLibrary';
import CameraStudioDock from '@/components/camerastudio/CameraStudioDock';
import { exportCameraPhoto, exportCameraVideo } from '@/components/camerastudio/cameraStudioExport';
import '@/components/camerastudio/cameraStudio.css';
export default function CameraStudio() {
  const state = useCameraProject(), { project, update, setError } = state;
  const input = useRef(null), engine = useRef(null);
  const [library, setLibrary] = useState(false), [playing, setPlaying] = useState(false), [ready, setReady] = useState(false), [exporting, setExporting] = useState(false), [progress, setProgress] = useState(0);
  const asset = project.assets.find(item => item.id === project.selected);
  const upload = () => input.current?.click();
  const add = files => { setPlaying(false); state.add(files); };
  const capture = async () => {
    if (!engine.current || !ready || exporting) return;
    setPlaying(false); setLibrary(false); setExporting(true); setProgress(0); setError('');
    try { if (project.settings.mode === 'photo') await exportCameraPhoto(engine.current, project.settings, project.name); else await exportCameraVideo(engine.current, project.settings, project.name, setProgress); }
    catch (error) { setError(error.message); }
    finally { setExporting(false); }
  };
  return <div className="camera-studio">
    <BackToStore/>
    <header className="camera-heading"><Link to="/AppStoreV2"><ArrowLeft size={15}/>Store</Link><strong>Camera Studio</strong><span>Native 3D editor</span></header>
    <input ref={input} hidden type="file" multiple accept="image/png,image/jpeg,image/webp,image/avif,image/gif,video/*" onChange={e => { add(e.target.files); e.target.value = ''; }}/>
    <CameraStudioToolbar project={project} rename={name => state.patch({ name })} add={upload} library={library} toggleLibrary={() => setLibrary(!library)} undo={() => { setPlaying(false); state.undo(); }} canUndo={state.past.length > 0} playing={playing} togglePlay={() => setPlaying(!playing)} disabled={exporting || !state.loaded} canPlay={ready} status={state.status}/>
    {state.error && <div className="camera-error" role="alert">{state.error}<button onClick={() => setError('')} aria-label="Dismiss message"><X size={14}/></button></div>}
    <main className="camera-body">
      {!state.loaded ? <div role="status" className="flex items-center gap-2"><Loader2 size={18} className="animate-spin"/>Opening local project…</div> : <CameraStudioStage asset={asset} settings={project.settings} playing={playing} engineRef={engine} add={add} upload={upload} busy={exporting} onReady={setReady} onError={setError}/>}
      {library && !exporting && <CameraStudioLibrary assets={project.assets} selected={project.selected} select={selected => { setPlaying(false); state.patch({ selected }); }} remove={id => { setPlaying(false); state.remove(id); }} close={() => setLibrary(false)} add={upload}/>}
    </main>
    <CameraStudioDock settings={project.settings} update={update} exporting={exporting || !state.loaded} progress={progress} ready={ready} capture={capture}/>
  </div>;
}