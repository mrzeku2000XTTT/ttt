import React, { useRef } from 'react';

export default function CamTimelineClip({ clip, image, title, zoom, selected, onSelect, onUpdate, disabled, camera }) {
  const drag = useRef(null), begin = (e, mode) => { e.stopPropagation(); if (disabled) return; drag.current={mode,x:e.clientX,start:clip.start,duration:clip.duration}; e.currentTarget.setPointerCapture(e.pointerId); onSelect(clip); };
  const move = (e) => { if (!drag.current) return; const d=drag.current, dx=(e.clientX-d.x)/zoom, end=d.start+d.duration;
    if(d.mode==='start'){const start=Math.max(0,Math.min(end-.1,d.start+dx));onUpdate(clip.id,{start,duration:end-start});}
    else if(d.mode==='end')onUpdate(clip.id,{duration:Math.max(.1,d.duration+dx)});
    else onUpdate(clip.id,{start:Math.max(0,d.start+dx)});
  };
  return <div role="button" tabIndex={0} className={`cm-tl-clip ${camera?'is-scene':''} ${selected?'is-selected':''}`} style={{left:clip.start*zoom,width:Math.max(12,clip.duration*zoom)}} title={`${title} · ${clip.start.toFixed(2)}–${(clip.start+clip.duration).toFixed(2)}s`} onClick={(e)=>{e.stopPropagation();onSelect(clip);}} onPointerDown={(e)=>begin(e,'move')} onPointerMove={move} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
    <i className="cm-tl-trim left" onPointerDown={(e)=>begin(e,'start')}/>{image&&<img src={image} alt="" draggable={false}/>}<span>{title}</span>{clip.animationId&&<b>FX</b>}<small>{clip.duration.toFixed(1)}s</small><i className="cm-tl-trim right" onPointerDown={(e)=>begin(e,'end')}/>
    <div className="cm-tl-keys">{clip.keys.filter((k)=>k.t<=clip.duration).map((key,i)=><i key={i} style={{left:Math.min(99,key.t/clip.duration*100)+'%'}}/>)}</div>
  </div>;
}