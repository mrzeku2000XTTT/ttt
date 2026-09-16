import { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { analyzeReferenceImage } from '@/components/uiangle/analyzeRef';
import { captureFlatShot } from '@/components/uiangle/angleCutout';
import { scenePrompt } from '@/components/uiangle/angleModel';
export default function useAngleActions(editor) {
  const [busy,setBusy]=useState(''),[error,setError]=useState(''),[result,setResult]=useState(null),[copied,setCopied]=useState(false),lock=useRef(false);
  const upload=async event=>{
    const file=event.target.files?.[0];event.target.value='';if(!file||lock.current)return;
    lock.current=true;setError('');setBusy('Tracing reference');editor.setPlaying(false);
    try {const data=await analyzeReferenceImage(file);editor.ingest(data);setResult(null);if(!data.subjects.length)setError('No subjects were detected. Add a stand-in from the scene panel, or try a clearer reference.');}
    catch(err){setError(err.message||'Reference analysis failed. Please try again.');}
    finally{lock.current=false;setBusy('');}
  };
  const generate=async()=>{
    if(lock.current)return;lock.current=true;editor.setPlaying(false);setError('');setBusy('Rendering camera frame');
    try {
      const shot=editor.mode==='2d'?await captureFlatShot(editor):await editor.captureRef.current?.();
      if(!shot)throw new Error('The camera preview is not ready. Switch to 2D or wait for the 3D view to load.');
      const {file_uri}=await base44.integrations.Core.UploadPrivateFile({file:new File([shot],'camera-composition.png',{type:'image/png'})});
      const {signed_url}=await base44.integrations.Core.CreateFileSignedUrl({file_uri,expires_in:3600});
      const urls=[signed_url];if(editor.reference){const ref=await base44.integrations.Core.CreateFileSignedUrl({file_uri:editor.reference.uri,expires_in:3600});urls.push(ref.signed_url);}
      const prompt=scenePrompt(editor),response=await base44.integrations.Core.GenerateImage({prompt,existing_image_urls:urls});
      if(!response.url)throw new Error('No image was returned. Please try again.');setResult({url:response.url,prompt});
    } catch(err){setError(err.message||'Generation failed. Please try again.');}
    finally{lock.current=false;setBusy('');}
  };
  const copy=async()=>{setError('');try{await navigator.clipboard.writeText(scenePrompt(editor));setCopied(true);setTimeout(()=>setCopied(false),1800);}catch{setError('Clipboard access is unavailable in this browser.');}};
  return {busy,error,result,copied,upload,generate,copy,closeResult:()=>setResult(null)};
}