import { useEffect, useMemo, useRef, useState } from 'react';
import { aimAt, initialCamera, initialFlatCamera, motionCamera, newSubject } from '@/components/uiangle/angleModel';
export default function useAngleEditor() {
  const [subjects,setSubjects]=useState(()=>[newSubject(),{...newSubject('building'),x:-3,z:-1}]);
  const [reference,setReference]=useState(null),[mode,setModeState]=useState('3d'),[selected,setSelected]=useState('camera');
  const [camera,setCamera]=useState(initialCamera),[flatCamera,setFlatCamera]=useState(initialFlatCamera);
  const [prompt,setPrompt]=useState(''),[editOutline,setEditOutline]=useState(false),[motion,setMotion]=useState('Dolly in');
  const [time,setTime]=useState(0),[playing,setPlaying]=useState(false),captureRef=useRef(null);
  const patchSubject=(id,patch)=>setSubjects(items=>items.map(item=>item.id===id?{...item,...patch}:item));
  const patchCamera=patch=>{setPlaying(false);setTime(0);setCamera(c=>({...c,...patch}));};
  const patchFlat=patch=>setFlatCamera(c=>({...c,...patch}));
  const move=(id,x,z)=>{if(id==='camera')patchCamera({x,z});else patchSubject(id,{x,z});};
  const add=kind=>{const item=newSubject(kind);setSubjects(items=>[...items,item]);setSelected(item.id);};
  const remove=()=>{setSubjects(items=>items.filter(item=>item.id!==selected));setSelected('camera');setEditOutline(false);};
  const setMode=value=>{setModeState(value);setPlaying(false);setTime(0);setEditOutline(false);};
  const aim=()=>{const item=subjects.find(s=>s.id===selected)||subjects.find(s=>s.kind==='character')||subjects[0];if(item)patchCamera(aimAt(camera,item));};
  const ingest=data=>{setReference(data.reference);setSubjects(data.subjects);setSelected(data.subjects[0]?.id||'camera');setMode('2d');setFlatCamera(initialFlatCamera);setCamera(initialCamera);};
  useEffect(()=>{if(!playing)return;let frame;const start=performance.now()-time*6000;const tick=now=>{const next=Math.min((now-start)/6000,1);setTime(next);if(next<1)frame=requestAnimationFrame(tick);else setPlaying(false);};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);},[playing]);
  const liveCamera=useMemo(()=>mode==='4d'?motionCamera(camera,motion,time):camera,[camera,mode,motion,time]);
  return {subjects,reference,mode,selected,camera,flatCamera,prompt,editOutline,motion,time,playing,captureRef,liveCamera,setSelected,setMode,patchSubject,patchCamera,patchFlat,move,add,remove,aim,ingest,setPrompt,setEditOutline,setMotion,setTime,setPlaying};
}