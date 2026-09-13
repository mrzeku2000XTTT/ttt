import React,{useState} from 'react';
import { base44 } from '@/api/base44Client';
import { X, Upload, Loader2 } from 'lucide-react';
import { youtubeId,signInToClutch } from '@/components/clutchkas/clutchMedia';
export default function ClutchPublish({address,onClose,onPublished}){
  const [type,setType]=useState('youtube'),[title,setTitle]=useState(''),[name,setName]=useState(''),[caption,setCaption]=useState(''),[link,setLink]=useState(''),[file,setFile]=useState(null),[rights,setRights]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[login,setLogin]=useState(false);
  const submit=async e=>{e.preventDefault();if(busy)return;setError('');setBusy(true);
    try{
      if(!await base44.auth.isAuthenticated()){setLogin(true);return;}
      const id=type==='youtube'?youtubeId(link):null;
      if(type==='youtube'&&!id)throw new Error('Paste a valid YouTube video or Shorts link.');
      if(type==='upload'&&(!file||!['video/mp4','video/webm'].includes(file.type)||file.size>100*1024*1024))throw new Error('Choose an MP4 or WebM clip up to 100 MB.');
      if(!rights||!title.trim()||!name.trim())throw new Error('Add your title, player name, and confirm you own this highlight.');
      const upload=type==='upload'?await base44.integrations.Core.UploadPrivateFile({file}):null;
      const clip=await base44.entities.ClutchClip.create({title:title.trim(),creator_name:name.trim(),caption:caption.trim(),creator_wallet:'kaspa:'+address.replace(/^kaspa:/,''),source_type:type,...(id?{youtube_id:id}:{file_uri:upload.file_uri})});
      onPublished(clip);
    }catch(err){setError(err.message||'Could not publish. Please try again.');}finally{setBusy(false);}
  };
  return <div className="clutch-modal" role="dialog" aria-modal="true" aria-label="Post a highlight"><form className="clutch-sheet" onSubmit={submit}><div className="clutch-sheet-head"><Upload/><button type="button" disabled={busy} onClick={onClose} aria-label="Close"><X/></button></div><h2>Drop your best round.</h2><p>Your connected wallet receives the tips. Post only your own gameplay or content you have permission to monetize.</p><div className="clutch-presets">{['youtube','upload'].map(t=><button type="button" key={t} aria-pressed={type===t} disabled={busy} onClick={()=>setType(t)}>{t==='youtube'?'YouTube link':'Upload clip'}</button>)}</div><label>Player name<input required maxLength={40} value={name} onChange={e=>setName(e.target.value)}/></label><label>Highlight title<input required maxLength={120} value={title} onChange={e=>setTitle(e.target.value)} placeholder="1v4. One bullet. No problem."/></label>{type==='youtube'?<label>YouTube video or Shorts URL<input required type="url" value={link} onChange={e=>setLink(e.target.value)} placeholder="https://youtube.com/shorts/…"/></label>:<label>MP4 / WebM · up to 100 MB<input required type="file" accept="video/mp4,video/webm" onChange={e=>setFile(e.target.files?.[0])}/></label>}<label>Caption<textarea maxLength={500} value={caption} onChange={e=>setCaption(e.target.value)} rows={2}/></label><label className="clutch-check"><input type="checkbox" required checked={rights} onChange={e=>setRights(e.target.checked)}/>I own this highlight or have permission to publish and receive tips for it.</label><p className="clutch-small">Publishing makes this clip visible in the community feed. YouTube embeds must allow playback on other sites.</p>{error&&<p className="clutch-error" role="alert">{error}</p>}{login?<button type="button" className="clutch-primary" onClick={signInToClutch}>Sign in to publish</button>:<button className="clutch-primary" disabled={busy||!rights}>{busy?<><Loader2 className="animate-spin"/>Publishing…</>:'Publish highlight'}</button>}</form></div>;
}