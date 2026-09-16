import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { createAngleScene } from '@/components/uiangle/angleSceneEngine';
import { loadAngleImage } from '@/components/uiangle/angleCutout';
export default function AngleViewport({ editor, preview=false, captureRef }) {
  const host=useRef(null),engine=useRef(null),latest=useRef(editor),[image,setImage]=useState(null),[error,setError]=useState('');latest.current=editor;
  useEffect(()=>{let active=true;setImage(null);if(editor.reference?.url)loadAngleImage(editor.reference.url).then(img=>{if(active)setImage(img);}).catch(err=>{if(active)setError(err.message);});return()=>{active=false;};},[editor.reference?.url]);
  useEffect(()=>{
    try {engine.current=createAngleScene(host.current,preview,{select:id=>latest.current.setSelected(id),move:(id,x,z)=>latest.current.move(id,x,z)});if(captureRef)captureRef.current=()=>engine.current.capture();}
    catch(err){setError('3D rendering is unavailable in this browser. Enable hardware acceleration or use 2D mode.');}
    return()=>{engine.current?.dispose();engine.current=null;if(captureRef)captureRef.current=null;};
  },[preview,captureRef]);
  useEffect(()=>{engine.current?.update(editor,image);},[editor.subjects,editor.liveCamera,editor.selected,image]);
  return <div className={`relative overflow-hidden bg-background ${preview?'aspect-video':'h-full min-h-[390px] lg:min-h-0'}`}><div ref={host} className="absolute inset-0"/>{error&&<p role="alert" className="absolute inset-x-4 top-12 rounded bg-card p-3 text-xs">{error}</p>}{!preview&&<><div className="pointer-events-none absolute left-4 top-4 text-[10px] uppercase tracking-[.18em] text-muted-foreground">Perspective / scene view</div><button title="Reset workspace view" onClick={()=>engine.current?.reset()} className="absolute right-4 top-4 rounded-lg border border-border bg-card p-2"><RotateCcw size={14}/></button><p className="pointer-events-none absolute bottom-4 left-4 text-[11px] text-muted-foreground">Drag subject or camera · Drag empty space to orbit · Scroll to zoom</p></>}</div>;
}