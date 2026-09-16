import React, { useRef } from 'react';
import { clamp, toPercent, toWorld } from '@/components/uiangle/angleModel';
export default function AngleSceneMap({ editor:e }) {
  const svg=useRef(null),drag=useRef(null),c=e.liveCamera,cx=toPercent(c.x)*3,cy=toPercent(c.z)*3;
  const point=event=>new DOMPoint(event.clientX,event.clientY).matrixTransform(svg.current.getScreenCTM().inverse());
  const start=(event,id)=>{if(e.playing)return;event.preventDefault();const p=point(event),item=id==='camera'?e.camera:e.subjects.find(s=>s.id===id);drag.current={id,dx:p.x-toPercent(item.x)*3,dy:p.y-toPercent(item.z)*3};e.setSelected(id);svg.current.setPointerCapture(event.pointerId);};
  const move=event=>{if(!drag.current)return;const p=point(event),d=drag.current;e.move(d.id,toWorld(clamp((p.x-d.dx)/3,3,97)),toWorld(clamp((p.y-d.dy)/3,3,97)));};
  const end=event=>{drag.current=null;if(svg.current.hasPointerCapture(event.pointerId))svg.current.releasePointerCapture(event.pointerId);};
  const half=Math.tan(c.fov/2*Math.PI/180)*80;
  return <div className="bg-card"><div className="flex justify-between border-b border-border px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground"><span>Scene map</span><span>16 × 16 m</span></div><svg ref={svg} viewBox="0 0 300 300" className="mx-auto aspect-square max-h-[220px] w-full touch-none" onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={()=>{drag.current=null;}}>
    {Array.from({length:9},(_,i)=><path key={i} d={`M ${i*37.5} 0 V 300 M 0 ${i*37.5} H 300`} className="stroke-border" fill="none"/>)}
    <g transform={`translate(${cx} ${cy}) rotate(${c.yaw})`}><path d={`M 0 0 L ${-half} -80 L ${half} -80 Z`} className="fill-foreground stroke-foreground" fillOpacity=".06" strokeOpacity=".35"/></g>
    {e.subjects.map((item,i)=><g key={item.id} transform={`translate(${toPercent(item.x)*3} ${toPercent(item.z)*3})`} onPointerDown={event=>start(event,item.id)} className="cursor-move"><circle r="11" className={e.selected===item.id?'fill-foreground stroke-foreground':'fill-muted stroke-muted-foreground'}/><text y="4" textAnchor="middle" fontSize="10" className={e.selected===item.id?'fill-background':'fill-foreground'}>{i+1}</text></g>)}
    <g transform={`translate(${cx} ${cy}) rotate(${c.yaw})`} onPointerDown={event=>start(event,'camera')} className="cursor-move"><rect x="-10" y="-7" width="20" height="16" rx="3" className="fill-foreground"/><path d="M -5 -7 L 0 -15 L 5 -7" className="fill-foreground"/></g>
  </svg><p className="px-3 pb-3 text-[10px] text-muted-foreground">Drag numbered subjects or camera. Positions stay synced with the 3D scene.</p></div>;
}