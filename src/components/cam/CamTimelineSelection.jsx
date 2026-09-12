import React from 'react';

export default function CamTimelineSelection({ item, timeline: t }) {
  if (!item) return <span>Select a scene or layer clip to edit it. Drag its ends to trim; drag the middle to move.</span>;
  const { clip, label, kind } = item;
  return <>
    <strong>{kind}</strong><span>{label}</span>
    <label>Start <input type="number" min="0" step="0.1" value={Number(clip.start.toFixed(2))} disabled={t.recording} onChange={(e)=>t.update(clip.id,{start:Math.max(0,+e.target.value)})}/></label>
    <label>Duration <input type="number" min="0.1" step="0.1" value={Number(clip.duration.toFixed(2))} disabled={t.recording} onChange={(e)=>t.update(clip.id,{duration:Math.max(.1,+e.target.value)})}/></label>
    <span>{clip.keys?.length || 0} keyframes</span>{clip.animationId && <span className="cm-tl-effect">FX · {clip.animationId}</span>}
  </>;
}