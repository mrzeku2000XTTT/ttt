import React,{useEffect,useState} from 'react';
import {motion} from 'framer-motion';
import {MousePointer2} from 'lucide-react';
import cursorTargets from '@/lib/aca/cursorTargets';
export default function ACACursor({root,event,speed=1}) {
  const [point,setPoint]=useState({x:260,y:180,key:'idle'});
  useEffect(()=>{if(!event || event.status!=='COMPLETED')return;let target,timer;const frame=requestAnimationFrame(()=>{const p=cursorTargets(root.current,event);if(p){target=p.element;target.classList.add('aca-target-pulse');setPoint({x:p.x,y:p.y,key:event.id});timer=setTimeout(()=>target.classList.remove('aca-target-pulse'),650/speed);}});return()=>{cancelAnimationFrame(frame);clearTimeout(timer);target?.classList.remove('aca-target-pulse');};},[event?.id,root,speed]);
  if(!point)return null;
  return <motion.div className="aca-cursor" animate={{x:point.x,y:point.y}} initial={false} transition={{duration:.3/speed,ease:'easeOut'}}><MousePointer2 size={19} fill="currentColor" stroke="hsl(var(--foreground))"/>{point.key !== 'idle' && <motion.span key={point.key} initial={{opacity:1,scale:.8}} animate={{opacity:0,scale:2}} transition={{duration:.6/speed}} className="absolute -top-2 -left-2 h-7 w-7 rounded-full border border-primary"/>}<span className="text-[9px] pl-3">A#011</span></motion.div>;
}