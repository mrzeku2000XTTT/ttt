import React,{useState} from 'react';
import { base44 } from '@/api/base44Client';
import { X,Upload } from 'lucide-react';
import { youtubeId,signInToClutch } from '@/components/clutchkas/clutchMedia';
import { getVideoDuration,planShort,renderShort } from '@/components/clutchkas/clutchAutoEdit';
import ClutchProcessing from '@/components/clutchkas/ClutchProcessing';

export default function ClutchPublish({address,onClose,onPublished}){
  const [type,setType]=useState('youtube'),[title,setTitle]=useState(''),[name,setName]=useState(''),[caption,setCaption]=useState(''),[link,setLink]=useState(''),[file,setFile]=useState(null),[rights,setRights]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[login,setLogin]=useState(false),[phase,setPhase]=useState('Preparing your short'),[progress,setProgress]=useState(0),[startedAt,setStartedAt]=useState(0);
  const submit=async e=>{e.preventDefault();if(busy)return;setError('');setBusy(true);setStartedAt(Date.now());setProgress(2);
    try{
      if(!await base44.auth.isAuthenticated()){setLogin(true);return;}
      const id=type==='youtube'?youtubeId(link):null;
      if(type==='youtube'&&!id)throw new Error('Paste a valid YouTube video or Shorts link.');
      if(type==='upload'&&(!file||!['video/mp4','video/webm'].includes(file.type)||file.size>100*1024*1024))throw new Error('Choose an MP4 or WebM clip up to 100 MB.');
      if(!rights||!title.trim()||!name.trim())throw new Error('Add your title, player name, and confirm you own this highlight.');
      let media={};
      if(type==='upload'){
        setPhase('Reading your full video');
        const duration=await getVideoDuration(file);
        if(!Number.isFinite(duration)||duration<=0)throw new Error('Could not read this video’s duration.');
        setProgress(8);setPhase('Securing your original upload');
        const original=await base44.integrations.Core.UploadPrivateFile({file});
        setProgress(18);setPhase('AI is finding the clutch');
        const plan=await planShort(original.file_uri,duration);
        setProgress(25);setPhase('KUTT is cutting and rendering your short');
        const edited=await renderShort(file,plan,value=>setProgress(25+value*65));
        setPhase('Uploading the finished edit');
        const output=await base44.integrations.Core.UploadPrivateFile({file:edited});
        setProgress(96);media={file_uri:output.file_uri,original_file_uri:original.file_uri,duration_seconds:Math.min(60,plan.segments.reduce((total,segment)=>total+segment.end-segment.start,0)),ai_edit_summary:plan.summary,ai_edited:true};
      }else{
        setPhase('AI is finding the strongest moment');setProgress(12);
        const result=await base44.functions.invoke('klipzAnalyze',{url:link}),analysis=result.data,choice=analysis?.clips?.[0];
        if(!choice)throw new Error('AI could not find a grounded highlight in this video. Try a captioned Short or upload the clip directly.');
        const start=Math.max(0,Math.floor(choice.start_s||0)),end=Math.min(start+60,Math.floor(choice.end_s||start+60));
        setProgress(92);media={youtube_id:id,duration_seconds:Math.min(60,end-start),edit_start_seconds:start,edit_end_seconds:end,ai_edit_summary:choice.reason||'AI selected the strongest moment.',ai_edited:true};
      }
      setPhase('Publishing your short');
      const clip=await base44.entities.ClutchClip.create({title:title.trim(),creator_name:name.trim(),caption:caption.trim(),creator_wallet:'kaspa:'+address.replace(/^kaspa:/,''),source_type:type,...media});
      setProgress(100);onPublished(clip);
    }catch(err){setError(err.response?.data?.error||err.message||'Could not publish. Please try again.');}finally{setBusy(false);}
  };
  return <div className="clutch-modal" role="dialog" aria-modal="true" aria-label="Post a highlight"><form className="clutch-sheet" onSubmit={submit}><div className="clutch-sheet-head"><Upload/><button type="button" disabled={busy} onClick={onClose} aria-label="Close"><X/></button></div>{busy?<ClutchProcessing phase={phase} progress={progress} startedAt={startedAt}/>:<><h2>Drop your best round.</h2><p>Every post becomes an AI-edited Short no longer than one minute. Your connected wallet receives the tips.</p><div className="clutch-presets">{['youtube','upload'].map(t=><button type="button" key={t} aria-pressed={type===t} onClick={()=>setType(t)}>{t==='youtube'?'YouTube link':'Upload clip'}</button>)}</div><label>Player name<input required maxLength={40} value={name} onChange={e=>setName(e.target.value)}/></label><label>Highlight title<input required maxLength={120} value={title} onChange={e=>setTitle(e.target.value)} placeholder="1v4. One bullet. No problem."/></label>{type==='youtube'?<label>YouTube video or Shorts URL<input required type="url" value={link} onChange={e=>setLink(e.target.value)} placeholder="https://youtube.com/shorts/…"/></label>:<label>MP4 / WebM · up to 100 MB · longer videos welcome<input required type="file" accept="video/mp4,video/webm" onChange={e=>setFile(e.target.files?.[0])}/></label>}<label>Caption<textarea maxLength={500} value={caption} onChange={e=>setCaption(e.target.value)} rows={2}/></label><label className="clutch-check"><input type="checkbox" required checked={rights} onChange={e=>setRights(e.target.checked)}/>I own this highlight or have permission to publish and receive tips for it.</label><p className="clutch-small">Upload your full gameplay video—even over 60 seconds. AI selects the highlights and KUTT cuts them into a short under one minute. Only the edited short is published.</p>{error&&<p className="clutch-error" role="alert">{error}</p>}{login?<button type="button" className="clutch-primary" onClick={signInToClutch}>Sign in to publish</button>:<button className="clutch-primary" disabled={!rights}>Create AI short</button>}</>}</form></div>;
}