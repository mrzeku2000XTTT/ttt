import React from 'react';
import { sampleKeys, activeClip } from '@/components/cam/camTimelineModel';
import { propertyPose, propertyPoints } from '@/components/cam/camPropertyKeys';
import CamPropertyKey from '@/components/cam/CamPropertyKey';

const FIELDS=[['x','Position X'],['y','Position Y'],['z','Position Z'],['scale','Scale'],['rotation','Rotation °'],['opacity','Opacity']];
export default function CamPropertyTracks({ track, timeline:t, width, zoom }) {
  const clip=track.clips.find(c=>c.id===t.selected)||activeClip(track.clips,t.time);
  if(!clip)return <div className="cm-layer-note">Select a clip in this layer to edit its properties.</div>;
  const local=Math.max(0,Math.min(clip.duration,t.time-clip.start)), pose=propertyPose(clip,local,sampleKeys(clip.keys,local));
  return <>{FIELDS.map(([property,label])=>{
    const keys=propertyPoints(clip,property), current=keys.find(k=>Math.abs(k.t-local)<.005);
    const edit=(point,at,options={})=>t.setProperty(track.assetId,property,point.value,clip.start+at,{clipId:clip.id,id:point.id,...options});
    return <div className="cm-property-row" key={property}>
      <div className="cm-tl-track-label cm-property-label">
        <span>{label}</span><input aria-label={`${track.name} ${label}`} type="number" step={property==='rotation'?1:.05} min={property==='opacity'?0:property==='scale'?.01:undefined} max={property==='opacity'?1:undefined} disabled={t.recording} value={Number(pose[property].toFixed(3))} onChange={e=>{if(e.target.value!=='')t.setProperty(track.assetId,property,Number(e.target.value),clip.start+local,{clipId:clip.id});}}/>
        <button disabled={t.recording} title={current?'Remove keyframe here':'Add keyframe here'} onClick={()=>current?edit(current,local,{remove:true}):t.setProperty(track.assetId,property,pose[property],clip.start+local,{clipId:clip.id})}>{current?'◆':'◇'}</button>
        <select aria-label={`${label} interpolation`} disabled={!current||t.recording} value={current?.ease||'linear'} onChange={e=>edit(current,local,{ease:e.target.value})}><option value="linear">Linear</option><option value="smooth">Ease</option><option value="hold">Hold</option></select>
      </div>
      <div className="cm-property-lane" style={{width}}><i className="cm-property-range" style={{left:clip.start*zoom,width:clip.duration*zoom}}/>{keys.filter(k=>k.t<=clip.duration).map(point=><CamPropertyKey key={point.id} point={point} clip={clip} zoom={zoom} disabled={t.recording} onSeek={t.seek} onEdit={edit}/>)}</div>
    </div>;
  })}</>;
}