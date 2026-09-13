import { base44 } from '@/api/base44Client';
import { createClip } from '@/components/kutt/kuttEditorTools';
import { exportTimeline } from '@/components/kutt/kuttExport';

const waitFor=(node,event)=>new Promise((resolve,reject)=>{node.addEventListener(event,resolve,{once:true});node.addEventListener('error',()=>reject(new Error('Could not read this video.')),{once:true});});
export async function getVideoDuration(file){const video=document.createElement('video');const url=URL.createObjectURL(file);video.preload='metadata';video.src=url;await waitFor(video,'loadedmetadata');const duration=video.duration;URL.revokeObjectURL(url);return duration;}
export async function planShort(fileUri,duration){
  const signed=await base44.integrations.Core.CreateFileSignedUrl({file_uri:fileUri,expires_in:1800});
  const plan=await base44.integrations.Core.InvokeLLM({file_urls:[signed.signed_url],prompt:`You are the CLUTCHKAS esports short editor. Watch the ENTIRE ${duration.toFixed(1)} second gameplay video, including moments after the first minute. Select the strongest real action from anywhere in the source for KUTT's cut-and-ripple timeline; do not just take the first minute. Build a punchy edited version from only the strongest action. Return 1-5 chronological segments totaling no more than 58 seconds. Remove dead time, menus, loading, and repetition. For each segment give exact start/end seconds, horizontal action focus from 0 (left) to 1 (right), and restrained crop zoom from 1 to 1.18. Never invent footage. Briefly summarize the edit.`,response_json_schema:{type:'object',properties:{summary:{type:'string'},segments:{type:'array',items:{type:'object',properties:{start:{type:'number'},end:{type:'number'},focus_x:{type:'number'},zoom:{type:'number'}},required:['start','end']}}},required:['segments']}});
  let used=0;const segments=(plan.segments||[]).sort((a,b)=>a.start-b.start).flatMap(s=>{const start=Math.max(0,Math.min(duration-.1,Number(s.start)||0));const available=Math.min(duration,Number(s.end)||duration)-start;const length=Math.min(Math.max(0,available),58-used);if(length<.5)return[];used+=length;return[{start,end:start+length,focus_x:Number.isFinite(Number(s.focus_x))?Math.max(0,Math.min(1,Number(s.focus_x))):.5,zoom:Math.max(1,Math.min(1.18,Number(s.zoom)||1.04))}];});
  return{summary:plan.summary||'AI removed downtime and focused the strongest play.',segments:segments.length?segments:[{start:0,end:Math.min(duration,58),focus_x:.5,zoom:1.03}]};
}
function draw(ctx,video,segment){const w=720,h=1280,sw=video.videoWidth,sh=video.videoHeight,zoom=segment.zoom||1;ctx.fillStyle='#050508';ctx.fillRect(0,0,w,h);const cropW=Math.min(sw,sh*w/h)/zoom,cropH=cropW*h/w;const maxX=sw-cropW,sx=Math.max(0,Math.min(maxX,maxX*(segment.focus_x??.5)));const sy=Math.max(0,(sh-cropH)/2);ctx.drawImage(video,sx,sy,cropW,cropH,0,0,w,h);ctx.fillStyle='rgba(0,0,0,.34)';ctx.fillRect(0,0,w,62);ctx.fillStyle='#fff';ctx.font='700 25px sans-serif';ctx.fillText('CLUTCHKAS',28,40);}
export async function renderShort(file,plan,onProgress){
  if(!window.MediaRecorder)throw new Error('This browser cannot create the AI edit. Try Chrome or Edge.');
  const url=URL.createObjectURL(file),assetId='clutch-source';
  let cursor=0;
  const clips=plan.segments.map(segment=>{
    const length=Math.min(segment.end-segment.start,58-cursor);
    const clip={...createClip(assetId,0,cursor,Math.max(0,length),segment.start),segment};
    cursor+=Math.max(0,length);return clip;
  }).filter(clip=>clip.duration>0);
  if(!clips.length){URL.revokeObjectURL(url);throw new Error('No highlight cuts were selected. Please try again.');}
  try{
    const output=await exportTimeline({clips,assets:[{id:assetId,type:'video',url,name:file.name}],width:720,height:1280,onProgress,drawVideoFrame:(ctx,video,clip)=>draw(ctx,video,clip.segment)});
    URL.revokeObjectURL(output.url);
    return new File([output.blob],`${file.name.replace(/\.[^.]+$/,'')}-clutchkas-ai.${output.ext}`,{type:output.blob.type});
  }finally{URL.revokeObjectURL(url);}
}