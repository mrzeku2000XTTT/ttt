import React,{useEffect,useState} from 'react';
import { Loader2,Scissors } from 'lucide-react';
export default function ClutchProcessing({phase,progress,startedAt}){
  const [elapsed,setElapsed]=useState(0);
  useEffect(()=>{const tick=()=>setElapsed(Math.floor((Date.now()-startedAt)/1000));tick();const timer=setInterval(tick,1000);return()=>clearInterval(timer);},[startedAt]);
  return <div className="clutch-processing" role="status" aria-live="polite"><div className="clutch-processing-icon"><Scissors/><Loader2 className="animate-spin"/></div><p>CLUTCHKAS AI EDITOR</p><h2>{phase}</h2><div className="clutch-progress"><span style={{width:`${Math.round(progress)}%`}}/></div><div className="clutch-processing-meta"><span>{Math.round(progress)}%</span><span>{elapsed}s elapsed</span></div><small>Keep this window open while your edited short is rendered.</small></div>;
}