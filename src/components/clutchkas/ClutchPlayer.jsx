import React,{useEffect,useRef,useState} from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';

export default function ClutchPlayer({clip,active}){
  const video=useRef(null),[failed,setFailed]=useState(false);
  const source=useQuery({queryKey:['clutch-video',clip.id,clip.file_uri],queryFn:async()=>{const r=await base44.integrations.Core.CreateFileSignedUrl({file_uri:clip.file_uri,expires_in:3600});return r.signed_url;},enabled:active&&clip.source_type==='upload',staleTime:3000000});
  useEffect(()=>{if(!video.current)return;if(active)video.current.play().catch(()=>{});else video.current.pause();},[active,source.data]);
  if(clip.source_type==='youtube'){
    const start=Math.max(0,Math.floor(clip.edit_start_seconds||0)),end=Math.max(start+1,Math.floor(clip.edit_end_seconds||start+60));
    const embed=`https://www.youtube.com/embed/${clip.youtube_id}?autoplay=1&mute=1&playsinline=1&rel=0&start=${start}&end=${end}`;
    return active?<div className="clutch-youtube"><iframe title={clip.title} src={embed} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/><a target="_blank" rel="noreferrer" href={`https://www.youtube.com/watch?v=${clip.youtube_id}&t=${start}s`}>Can’t play? Open on YouTube</a></div>:<img className="clutch-poster" src={`https://i.ytimg.com/vi/${clip.youtube_id}/hqdefault.jpg`} alt={clip.title}/>;
  }
  if(source.isError||failed)return <div className="clutch-player-message"><p>Unable to play this clip.</p><button onClick={()=>{setFailed(false);source.refetch();}}>Retry video</button></div>;
  if(!source.data)return <div className="clutch-player-message"><Loader2 className="animate-spin"/><span>Loading AI edit…</span></div>;
  return <video ref={video} src={source.data} controls muted playsInline loop preload="metadata" onError={()=>setFailed(true)} aria-label={clip.title}/>;
}