import React, { useRef } from 'react';
import AngleCutoutShape from '@/components/uiangle/AngleCutoutShape';
import { clamp, toWorld, toPercent } from '@/components/uiangle/angleModel';
export default function AngleScene2D({ editor:e, preview=false }) {
  const svg=useRef(null),drag=useRef(null),c=e.flatCamera,w=1600/c.zoom,h=900/c.zoom;
  const position=(event,node=svg.current)=>{const p=new DOMPoint(event.clientX,event.clientY);return p.matrixTransform(node.getScreenCTM().inverse());};
  const start=(event,id,vertex,node)=>{
    event.preventDefault();event.stopPropagation();e.setSelected(id);const p=position(event);const item=e.subjects.find(s=>s.id===id);
    drag.current={id,vertex,node,dx:p.x-(id==='camera'?c.x*16:toPercent(item.x)*16),dy:p.y-(id==='camera'?c.y*9:toPercent(item.z)*9)};svg.current.setPointerCapture(event.pointerId);
  };
  const move=event=>{const d=drag.current;if(!d)return;if(d.vertex!==undefined){const p=position(event,d.node);const item=e.subjects.find(s=>s.id===d.id);e.patchSubject(d.id,{outline:item.outline.map((v,i)=>i===d.vertex?[clamp(p.x,0,100),clamp(p.y,0,100)]:v)});return;}const p=position(event);if(d.id==='camera')e.patchFlat({x:clamp((p.x-d.dx)/16,0,100),y:clamp((p.y-d.dy)/9,0,100)});else e.move(d.id,toWorld(clamp((p.x-d.dx)/16,0,100)),toWorld(clamp((p.y-d.dy)/9,0,100)));};
  const end=event=>{drag.current=null;if(svg.current.hasPointerCapture(event.pointerId))svg.current.releasePointerCapture(event.pointerId);};
  const cameraTransform=preview?`translate(800 450) rotate(${-c.roll}) scale(${c.zoom}) translate(${-c.x*16} ${-c.y*9})`:undefined;
  return <div className={`relative bg-background angle-grid ${preview?'aspect-video':'flex h-full min-h-[390px] items-center p-5'}`}>
    <svg ref={svg} viewBox="0 0 1600 900" className="aspect-video w-full touch-none overflow-hidden bg-card" onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={()=>{drag.current=null;}}>
      <g transform={cameraTransform}>
        {e.reference&&<image href={e.reference.url} width="1600" height="900" opacity=".25" preserveAspectRatio="none"/>}
        {e.subjects.map(item=><AngleCutoutShape key={item.id} item={item} reference={e.reference} selected={e.selected===item.id} edit={e.editOutline} onStart={start} preview={preview}/>)}
      </g>
      {!preview&&<g transform={`translate(${c.x*16} ${c.y*9}) rotate(${c.roll})`}><rect x={-w/2} y={-h/2} width={w} height={h} fill="none" className="stroke-foreground" opacity=".65" strokeWidth="2" strokeDasharray="10 10" pointerEvents="none"/><g transform={`translate(0 ${-h/2+26})`} onPointerDown={event=>start(event,'camera')} className="cursor-move"><rect x="-45" y="-17" width="90" height="34" rx="7" className="fill-foreground"/><text textAnchor="middle" y="6" fontSize="16" className="fill-background">CAMERA</text></g></g>}
    </svg>
    {!preview&&<><span className="absolute left-4 top-4 text-[10px] uppercase tracking-[.18em] text-muted-foreground">2D composition / 16:9</span><p className="absolute bottom-3 left-4 text-[11px] text-muted-foreground">{e.editOutline?'Drag outline points to refine the selected silhouette.':'Drag subjects to place · Drag CAMERA to frame · Zoom and roll in inspector'}</p></>}
  </div>;
}