import React, { useId } from 'react';
import { toPercent } from '@/components/uiangle/angleModel';
export default function AngleCutoutShape({ item, reference, selected, edit, onStart, preview=false }) {
  const id=useId().replace(/:/g,''),w=item.w*16*item.scale,h=item.h*9*item.scale,s=item.source;
  const points=item.outline.map(p=>p.join(',')).join(' ');
  return <g transform={`translate(${toPercent(item.x)*16} ${toPercent(item.z)*9}) rotate(${item.rotation})`}>
    <svg x={-w/2} y={-h} width={w} height={h} viewBox="0 0 100 100" preserveAspectRatio="none" overflow="visible" onPointerDown={e=>!preview&&onStart(e,item.id)} className={preview?'':'cursor-move'}>
      <defs><clipPath id={id}><polygon points={points}/></clipPath></defs>
      <polygon points={points} className="fill-foreground" fillOpacity=".8"/>
      {item.display==='cutout'&&s&&reference&&<image href={reference.url} x={-s.x/s.w*100} y={-s.y/s.h*100} width={100/s.w} height={100/s.h} preserveAspectRatio="none" clipPath={`url(#${id})`}/>}
      {selected&&!preview&&<polygon points={points} fill="none" className="stroke-foreground" strokeWidth="1.3" vectorEffect="non-scaling-stroke"/>}
      {selected&&edit&&!preview&&item.outline.map(([x,y],i)=><ellipse key={i} cx={x} cy={y} rx={Math.max(1.5,700/w)} ry={Math.max(1.5,700/h)} className="fill-background stroke-foreground cursor-crosshair" strokeWidth="1" vectorEffect="non-scaling-stroke" onPointerDown={e=>{e.stopPropagation();onStart(e,item.id,i,e.currentTarget.ownerSVGElement);}}/>)}
    </svg>
    {selected&&!preview&&<text x={0} y={22} textAnchor="middle" fontSize="17" className="fill-foreground pointer-events-none">{item.label}</text>}
  </g>;
}