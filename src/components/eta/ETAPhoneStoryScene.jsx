import React from 'react';
import { ArrowRight, BatteryFull, List, Play, Signal, Sparkles, Wand2, Wifi } from 'lucide-react';

function ScreenMedia({ media }) {
  if (!media?.url) return null;
  return String(media.type).startsWith('video')
    ? <video src={media.url} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
    : <img src={media.url} alt="Scene media" className="absolute inset-0 h-full w-full object-cover" />;
}
export default function ETAPhoneStoryScene({ scene, advanced }) {
  const cardCopy = scene.visual || scene.voiceover;
  return <div className="absolute inset-[3px] overflow-hidden rounded-[2.45rem] border border-white/25 bg-[#08090b] text-[#f5f5f7] shadow-[inset_0_0_0_1px_rgba(255,255,255,.08)]">
    <ScreenMedia media={advanced.screenMedia} />
    {!advanced.screenMedia?.url && <div className="relative flex h-full flex-col px-[7%] pb-[5%] pt-[17%]">
      <div className="absolute left-[8%] right-[8%] top-[4%] flex items-center justify-between text-[clamp(8px,1vw,13px)] font-semibold"><span>9:41</span><span className="flex items-center gap-1"><Signal className="w-[1em]"/><Wifi className="w-[1em]"/><BatteryFull className="w-[1.2em]"/></span></div>
      <div className="absolute left-1/2 top-[3.5%] h-[4.2%] w-[30%] -translate-x-1/2 rounded-full bg-black shadow-inner" />
      <h2 className="mx-auto max-w-[92%] text-center text-[clamp(18px,2.5vw,34px)] font-medium leading-[1.04] tracking-[-0.04em]">{scene.headline}</h2>
      <div className="relative mt-[7%] h-[24%] overflow-hidden rounded-[1.15rem] border border-white/20 bg-[radial-gradient(circle_at_15%_20%,#b8ff3d_0%,#526d22_28%,#15171b_68%)] shadow-[0_0_32px_rgba(184,255,61,.22)]">
        <div className="absolute inset-x-[10%] bottom-[12%] top-[18%] overflow-hidden rounded-[1rem] border border-white/25 bg-gradient-to-br from-[#25282d] to-[#090a0c] shadow-2xl"><i className="absolute left-[12%] top-[46%] h-[10%] w-[48%] rounded-full bg-[#b8ff3d]"/><i className="absolute -right-[8%] top-[18%] h-[55%] w-[64%] -rotate-[16deg] rounded-[50%] border-t-[12px] border-[#d9ff98] opacity-90"/><i className="absolute bottom-0 right-[28%] h-[68%] w-px bg-white/50"/></div>
      </div>
      <div className="mt-[5%] grid min-h-0 flex-1 grid-rows-2 gap-[3%]">
        <article className="flex min-h-0 items-center gap-[5%] rounded-[1rem] border border-white/15 bg-[#202226]/90 px-[6%]"><span className="grid aspect-square w-[24%] grid-cols-2 place-items-center gap-1 rounded-xl bg-white/5 text-[#b8ff3d]"><Sparkles/><Wand2/></span><div className="min-w-0"><h3 className="text-[clamp(10px,1.2vw,17px)] font-semibold leading-tight">{scene.purpose}</h3><p className="mt-1 line-clamp-3 text-[clamp(7px,.8vw,11px)] leading-snug text-white/55">{cardCopy}</p></div></article>
        <article className="flex min-h-0 items-center gap-[5%] rounded-[1rem] border border-white/15 bg-[#202226]/90 px-[6%]"><span className="grid aspect-square w-[24%] grid-cols-2 place-items-center gap-1 rounded-xl bg-white/5 text-[#b8ff3d]"><Play/><List/></span><div className="min-w-0"><h3 className="text-[clamp(10px,1.2vw,17px)] font-semibold leading-tight">{scene.motion}</h3><p className="mt-1 line-clamp-3 text-[clamp(7px,.8vw,11px)] leading-snug text-white/55">{scene.transition}</p></div></article>
      </div>
      <div className="mt-[4%] flex h-[7%] items-center justify-center gap-2 rounded-full bg-[#b8ff3d] text-[clamp(9px,1vw,14px)] font-bold text-black">{advanced.ctaLabel || 'Continue'}<ArrowRight className="w-[1em]"/></div>
      <i className="mx-auto mt-[4%] h-1 w-[36%] rounded-full bg-white" />
    </div>}
  </div>;
}