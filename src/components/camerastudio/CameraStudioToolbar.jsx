import React from 'react';
import { Plus, Images, Undo2, FolderOpen, Play, Pause } from 'lucide-react';
export default function CameraStudioToolbar({ project, rename, add, library, toggleLibrary, undo, canUndo, playing, togglePlay, disabled, canPlay, status }) {
  return <div className="camera-toolbar">
    <div className="camera-toolbar-left">
      <label className="camera-pill camera-project"><FolderOpen size={14}/><input aria-label="Project name" value={project.name} maxLength={70} onChange={e => rename(e.target.value)} disabled={disabled}/><button title="Add media" onClick={add} disabled={disabled}><Plus size={14}/><span>Add media</span></button></label>
      <button className="camera-pill" onClick={toggleLibrary} aria-pressed={library} disabled={disabled}><Images size={14}/><span>Library</span></button>
      <span className="camera-save"><i/>{status}</span>
    </div>
    <button className="camera-operator" onClick={togglePlay} disabled={disabled || !canPlay} aria-pressed={playing}>{playing ? <Pause size={14}/> : <Play size={14}/>}Operator</button>
    <div className="camera-toolbar-right"><span className="camera-local">Local workspace</span><button className="camera-pill" onClick={undo} disabled={!canUndo || disabled} title="Undo"><Undo2 size={15}/></button></div>
  </div>;
}