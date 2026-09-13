import React, { useRef } from 'react';

export default function CamPropertyKey({ point, clip, zoom, onSeek, onEdit, disabled }) {
  const drag=useRef(null);
  return <button className="cm-property-key" disabled={disabled} style={{left:(clip.start+point.t)*zoom}} aria-label={`Keyframe at ${(clip.start+point.t).toFixed(2)} seconds, ${point.ease}; Delete removes, double click changes easing`} title={`${(clip.start+point.t).toFixed(2)}s · ${point.ease} · drag to retime · double-click to ease`}
    onPointerDown={e=>{e.stopPropagation();drag.current=e.clientX;e.currentTarget.setPointerCapture(e.pointerId);}}
    onPointerUp={e=>{e.stopPropagation();if(drag.current===null)return;const delta=(e.clientX-drag.current)/zoom;drag.current=null;if(Math.abs(delta*zoom)>3)onEdit(point,Math.max(0,Math.min(clip.duration,point.t+delta)));else onSeek(clip.start+point.t);}}
    onPointerCancel={()=>{drag.current=null;}}
    onDoubleClick={()=>onEdit(point,point.t,{ease:point.ease==='smooth'?'linear':'smooth'})}
    onKeyDown={e=>{if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();e.stopPropagation();onEdit(point,point.t,{remove:true});}if(e.key==='Enter')onSeek(clip.start+point.t);}}>
    {point.ease==='smooth'?'◆':point.ease==='hold'?'■':'◇'}
  </button>;
}