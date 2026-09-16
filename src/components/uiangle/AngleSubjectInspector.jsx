import React from 'react';
import { ScanLine, Trash2 } from 'lucide-react';
import AngleRange from '@/components/uiangle/AngleRange';
export default function AngleSubjectInspector({editor:e}) {
  const item=e.subjects.find(s=>s.id===e.selected);if(!item)return null;
  const patch=value=>e.patchSubject(item.id,value);
  return <section className="space-y-4 border-b border-border p-4"><div className="flex items-center justify-between"><h2 className="text-[10px] uppercase tracking-[.18em] text-muted-foreground">Selected subject</h2><button onClick={e.remove} title="Remove selected subject"><Trash2 size={14}/></button></div>
    <input aria-label="Subject name" className="angle-input" value={item.label} onChange={event=>patch({label:event.target.value})}/>
    <div className="grid grid-cols-2 gap-1 rounded-lg border border-border p-1">{['dummy','cutout'].map(display=><button key={display} disabled={display==='cutout'&&!item.source} onClick={()=>patch({display})} className={`rounded py-2 text-xs ${item.display===display?'bg-primary text-primary-foreground':'text-muted-foreground'}`}>{display==='dummy'?'Faceless dummy':'Image cutout'}</button>)}</div>
    <AngleRange label="Scale" value={item.scale} min={.25} max={3} unit="×" onChange={scale=>patch({scale})}/>
    <AngleRange label={e.mode==='2d'?'Rotation':'Facing'} value={item.rotation} min={-180} max={180} step={1} unit="°" onChange={rotation=>patch({rotation})}/>
    {e.mode!=='2d'&&<><AngleRange label="Height" value={item.height} min={.2} max={8} unit=" m" onChange={height=>patch({height})}/><AngleRange label="Width" value={item.width} min={.2} max={6} unit=" m" onChange={width=>patch({width})}/>{item.kind!=='character'&&<AngleRange label="Depth" value={item.depth} min={.1} max={6} unit=" m" onChange={depth=>patch({depth})}/>}</>}
    <button onClick={()=>{if(e.mode!=='2d'){e.setMode('2d');e.setEditOutline(true);}else e.setEditOutline(!e.editOutline);}} className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2 text-xs"><ScanLine size={13}/>{e.editOutline?'Finish outline':'Edit outline in 2D'}</button>
    <p className="text-[10px] leading-relaxed text-muted-foreground">Outlines clip the image itself. Moving a cutout keeps its original pixels; it no longer samples a different part of the reference.</p>
  </section>;
}