import React from 'react';
import { Crosshair } from 'lucide-react';
import AngleRange from '@/components/uiangle/AngleRange';
export default function AngleCameraInspector({editor:e}) {
  const flat=e.mode==='2d',c=flat?e.flatCamera:e.camera;
  const presets=[['Eye level',{height:1.6,tilt:0}],['Low angle',{height:.35,tilt:18}],['High angle',{height:4,tilt:-30}],['Overhead',{height:7,tilt:-89}]];
  return <section className="space-y-4 border-b border-border p-4"><div className="flex items-center justify-between"><h2 className="text-[10px] uppercase tracking-[.18em] text-muted-foreground">Camera 01</h2><span className="text-[10px]">{flat?'2D framing':'Perspective'}</span></div>
    {flat?<><AngleRange label="Frame zoom" value={c.zoom} min={.5} max={4} unit="×" onChange={zoom=>e.patchFlat({zoom})}/><AngleRange label="Camera roll" value={c.roll} min={-90} max={90} step={1} unit="°" onChange={roll=>e.patchFlat({roll})}/><button className="w-full rounded border border-border py-2 text-xs" onClick={()=>e.patchFlat({x:50,y:50,zoom:1,roll:0})}>Reset framing</button></>:<>
      <div className="grid grid-cols-2 gap-2">{presets.map(([label,patch])=><button key={label} onClick={()=>e.patchCamera(patch)} className="rounded-lg border border-border py-2 text-[10px] hover:bg-muted">{label}</button>)}</div>
      <AngleRange label="Height" value={c.height} min={.2} max={8} unit=" m" onChange={height=>e.patchCamera({height})}/>
      <AngleRange label="Field of view" value={c.fov} min={15} max={100} step={1} unit="°" onChange={fov=>e.patchCamera({fov})}/>
      <AngleRange label="Heading" value={c.yaw} min={-180} max={180} step={1} unit="°" onChange={yaw=>e.patchCamera({yaw})}/>
      <AngleRange label="Tilt" value={c.tilt} min={-89} max={89} step={1} unit="°" onChange={tilt=>e.patchCamera({tilt})}/>
      <button disabled={!e.subjects.length} className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2 text-xs hover:bg-muted" onClick={e.aim}><Crosshair size={13}/>Aim at {e.subjects.find(s=>s.id===e.selected)?.label||'subject'}</button>
    </>}
  </section>;
}