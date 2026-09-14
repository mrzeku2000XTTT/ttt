import React, { useState } from 'react';
import { Plus, Images, Undo2, Redo2, FolderOpen, Play, Pause, Shuffle, Crosshair, Trash2, FilePlus2, Pencil, Type } from 'lucide-react';
export default function CameraStudioToolbar({ project, rename, add, library, toggleLibrary, undo, redo, canUndo, canRedo, newProject, deleteProject, playing, togglePlay, disabled, canPlay, status, editorMode, setEditorMode, compose, videoMode, armed, toggleArmed, pointCount, canDelete, deletePoint, drawMode, toggleDraw, textPresets = [], addText }) {
  const [textOpen, setTextOpen] = useState(false);
  return <div className="camera-toolbar">
    <div className="camera-toolbar-left">
      <label className="camera-pill camera-project"><FolderOpen size={14}/><input aria-label="Project name" value={project.name} maxLength={70} onChange={e => rename(e.target.value)} disabled={disabled}/><button title="Add media" onClick={add} disabled={disabled}><Plus size={14}/><span>Add media</span></button></label>
      <div className="relative">
        <button className="camera-pill" onClick={() => setTextOpen(value => !value)} aria-expanded={textOpen} disabled={disabled} title="Add a text animation preset"><Type size={14}/><span>Text</span></button>
        {textOpen && <div className="absolute top-full left-0 mt-2 z-50 w-60 rounded-xl border border-border bg-card p-1 shadow-xl">
          {textPresets.map(preset => <button key={preset.id} className="block w-full text-left px-3 py-2 rounded-lg hover:bg-secondary" onClick={() => { addText(preset.id); setTextOpen(false); }}>
            <span className="block text-sm font-semibold text-foreground">{preset.name}</span>
            <span className="block text-[11px] leading-tight text-muted-foreground">{preset.description}</span>
          </button>)}
        </div>}
      </div>
      <button className="camera-pill" onClick={toggleLibrary} aria-pressed={library} disabled={disabled}><Images size={14}/><span>Library</span></button><button className="camera-pill camera-new" onClick={newProject} disabled={disabled}><FilePlus2 size={14}/><span>New</span></button>
             <span className="camera-save"><i/>{status}</span>
    </div>
    {videoMode ? <div className="camera-mode-switch">
      <button onClick={() => setEditorMode('operator')} aria-pressed={editorMode === 'operator'}><Play size={13}/>Operator</button>
      <button onClick={compose} aria-pressed={editorMode === 'compose'} disabled={disabled || !canPlay || pointCount === 0}><Shuffle size={13}/>Compose</button>
      <button className="camera-interest-button" onClick={toggleArmed} aria-pressed={armed} disabled={disabled || !canPlay} title="Set framing window"><Crosshair size={15}/>{pointCount > 0 && <span>{pointCount}</span>}</button><button onClick={toggleDraw} aria-pressed={drawMode} disabled={disabled || !canPlay} title="Draw smooth layer motion"><Pencil size={15}/></button><button onClick={deletePoint} disabled={!canDelete} title="Delete selected framing window"><Trash2 size={15}/></button>
    </div> : <button className="camera-operator" onClick={togglePlay} disabled={disabled || !canPlay} aria-pressed={playing}>{playing ? <Pause size={14}/> : <Play size={14}/>}Operator</button>}
    <div className="camera-toolbar-right"><span className="camera-local">Local workspace</span><button className="camera-pill" onClick={undo} disabled={!canUndo || disabled} title="Undo"><Undo2 size={15}/></button><button className="camera-pill" onClick={redo} disabled={!canRedo || disabled} title="Redo"><Redo2 size={15}/></button><button className="camera-pill camera-danger" onClick={deleteProject} disabled={disabled} title="Delete current project"><Trash2 size={15}/></button></div>
  </div>;
}