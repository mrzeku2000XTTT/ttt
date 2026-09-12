import React from 'react';
import { Eye, EyeOff, Plus } from 'lucide-react';
import CamTimelineClip from '@/components/cam/CamTimelineClip';

export default function CamTimelineRow({ track, timeline: t, media, width, zoom, camera = false, onSelectAsset }) {
  const asset = media.find((m) => m.id === track.assetId);
  return <div className={`cm-tl-row ${track.hidden ? 'is-muted' : ''}`}>
    <div className="cm-tl-track-label"><button onClick={() => !camera && onSelectAsset(track.assetId)} title={track.name}>{track.name}</button>
      {!camera && <><button onClick={() => t.hide(track.id)} disabled={t.recording} title={track.hidden ? 'Show layer' : 'Hide layer'}>{track.hidden ? <EyeOff /> : <Eye />}</button><button onClick={() => t.addClip(track.id)} disabled={!asset || t.recording} title="Add clip at playhead"><Plus /></button></>}
    </div>
    <div className="cm-tl-lane" style={{ width }}>
      {track.clips.map((clip, i) => <CamTimelineClip key={clip.id} clip={clip} image={asset?.url || (camera ? media[0]?.url : undefined)} title={camera ? `Scene ${i + 1}` : track.name} zoom={zoom} selected={t.selected === clip.id} disabled={t.recording} onUpdate={t.update} onSelect={(c) => { t.setSelected(c.id); t.seek(c.start); if (!camera) onSelectAsset(track.assetId); }} />)}
    </div>
  </div>;
}