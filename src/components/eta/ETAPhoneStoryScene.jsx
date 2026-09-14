import React from 'react';
import { BatteryFull, Signal, Wifi } from 'lucide-react';
import ETAPhoneStoryLayouts from './ETAPhoneStoryLayouts';

function ScreenMedia({ media }) {
  if (!media?.url) return null;
  return String(media.type).startsWith('video')
    ? <video src={media.url} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
    : <img src={media.url} alt="Scene media" className="absolute inset-0 h-full w-full object-cover" />;
}
export default function ETAPhoneStoryScene({ scene, advanced, frameProgress }) {
  return <div className="absolute inset-[3px] overflow-hidden rounded-[2.45rem] border border-white/25 bg-[#08090b] text-[#f5f5f7] shadow-[inset_0_0_0_1px_rgba(255,255,255,.08)]">
    <ScreenMedia media={advanced.screenMedia} />
    {!advanced.screenMedia?.url && <div className="relative flex h-full flex-col overflow-hidden px-[7%] pb-[5%] pt-[17%]">
      <div className="absolute left-[8%] right-[8%] top-[4%] flex items-center justify-between text-[clamp(8px,1vw,13px)] font-semibold"><span>9:41</span><span className="flex items-center gap-1"><Signal className="w-[1em]"/><Wifi className="w-[1em]"/><BatteryFull className="w-[1.2em]"/></span></div>
      <div className="absolute left-1/2 top-[3.5%] h-[4.2%] w-[30%] -translate-x-1/2 rounded-full bg-black shadow-inner" />
      <ETAPhoneStoryLayouts scene={scene} advanced={advanced} frameProgress={frameProgress}/>
      <i className="mx-auto mt-[3%] h-1 w-[36%] shrink-0 rounded-full bg-white" />
    </div>}
  </div>;
}