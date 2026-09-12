import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import CamTimelineToolbar from '@/components/cam/CamTimelineToolbar';
import CamTimelineRow from '@/components/cam/CamTimelineRow';

export default function CamTimeline({ timeline: t, media, onAddMedia, onSelectAsset, tabs, isMax, onMax }) {
  const [zoom, setZoom] = useState(65), scrubbing = useRef(false);
  const extent = Math.max(12, Math.ceil(t.total + 3)), width = extent * zoom, scrollRef=useRef(null);
  const fit=()=>{const available=Math.max(300,(scrollRef.current?.clientWidth||800)-132);setZoom(Math.max(12,Math.min(240,available/Math.max(6,t.total+1))));};
  useEffect(()=>{const key=(e)=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(e.code==='Space'){e.preventDefault();t.play();}else if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='d'){e.preventDefault();e.shiftKey?t.splitSelected(t.selected):t.duplicate(t.selected);}else if((e.key==='Delete'||e.key==='Backspace')&&t.selected){e.preventDefault();t.remove(t.selected);t.setSelected(null);}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[t.selected,t.time,t.total,t.running]);
  const seek = (e) => { const r = e.currentTarget.getBoundingClientRect(); t.seek((e.clientX - r.left) / zoom); };
  return <section className="cm-node-panel cm-timeline">
    <div className="cm-panel-heading">{tabs}<span className="cm-panel-tools"><span>{t.project.tracks.length} layers · {t.project.cuts.length} scenes</span><button onClick={onMax} title={isMax ? 'Restore workspace' : 'Fullscreen timeline'}>{isMax ? <Minimize2 /> : <Maximize2 />}</button></span></div>
    <CamTimelineToolbar timeline={t} zoom={zoom} setZoom={setZoom} onFit={fit} onAddMedia={onAddMedia} hasMedia={media.length > 0} />
    <div ref={scrollRef} className="cm-tl-scroll"><div className="cm-tl-content" style={{ width: width + 132, minWidth: '100%' }}>
      <div className="cm-tl-ruler-row"><div className="cm-tl-track-label">LAYERS / SECONDS</div><div className="cm-tl-ruler" style={{ width }} onPointerDown={(e) => { scrubbing.current = true; e.currentTarget.setPointerCapture(e.pointerId); seek(e); }} onPointerMove={(e) => { if (scrubbing.current) seek(e); }} onPointerUp={() => { scrubbing.current = false; }} onPointerCancel={() => { scrubbing.current = false; }}>{Array.from({ length: Math.ceil(extent / (zoom < 25 ? 5 : 1)) }, (_, i) => { const s = i * (zoom < 25 ? 5 : 1); return <span key={s} style={{ left: s * zoom }}>{s}s</span>; })}</div></div>
      <CamTimelineRow camera track={{ name: 'Scene cuts', clips: t.project.cuts }} timeline={t} media={media} width={width} zoom={zoom} onSelectAsset={onSelectAsset} />
      {[...t.project.tracks].reverse().map((track) => <CamTimelineRow key={track.id} track={track} timeline={t} media={media} width={width} zoom={zoom} onSelectAsset={onSelectAsset} />)}
      <div className="cm-tl-playhead" style={{ left: 132 + t.time * zoom }}><i /></div>
      {!media.length && <p className="cm-tl-empty">Add an image layer to record movement and build your timeline.</p>}
    </div></div>
  </section>;
}