import React from 'react';

const sampleMove = (items, time) => [...(items || [])].sort((a,b) => a.time-b.time).filter((item) => item.time <= time).at(-1) || {x:0,y:0,z:0};
export default function ETACards3Scene({ scene, advanced, frameProgress=0 }) {
  const count = Math.max(advanced.cardImages?.length || 0, 12), time = frameProgress * Number(scene.duration || 3);
  const move = sampleMove(advanced.haloMoveKeyframes, time), images = advanced.cardImages || [];
  const width = Number(advanced.cardWidth || 112), height = Number(advanced.cardHeight || 160), depth = Number(advanced.haloZ || 120);
  const group = `translate3d(${Number(advanced.haloBaseX||0)+Number(move.x||0)}px,${Number(advanced.haloBaseY||0)+Number(move.y||0)}px,${Number(advanced.haloBaseZ||0)+Number(move.z||0)}px)`;
  const drift = Number(advanced.centerDriftMin||2) + (Number(advanced.centerDriftMax||12)-Number(advanced.centerDriftMin||2)) * (.5+.5*Math.sin(time*Number(advanced.centerDriftStrength||1)));
  return <div className="relative h-52 w-full max-w-md" style={{ perspective:Number(advanced.cardPerspective||900) }}><div className="absolute inset-0" style={{ transformStyle:'preserve-3d', transform:group }}>{Array.from({length:count}).map((_,i) => {
    const angle = i/count*Math.PI*2 + time*.16, x=Math.cos(angle)*Number(advanced.haloX||150), y=Math.sin(angle)*Number(advanced.haloY||65), z=Math.sin(angle*2)*depth;
    const blur=Math.min(Number(advanced.maxBlur||8), Math.abs(depth-z)/Math.max(1,Number(advanced.depthStrength||35)));
    return <div key={i} className="absolute left-1/2 top-1/2 overflow-hidden border border-border bg-background p-2 shadow-2xl" style={{ width,height,marginLeft:-width/2,marginTop:-height/2,borderRadius:Number(advanced.cardRadius||16),transform:`translate3d(${x}px,${y}px,${z}px) rotateY(${-angle*180/Math.PI}deg)`,filter:`blur(${blur}px)`,opacity:Math.min(1,Math.max(.18,(frameProgress-i*.018)*6)),zIndex:Math.round(z+200) }}>{images[i%Math.max(1,images.length)]?.url ? <img src={images[i%images.length].url} alt="Halo card" className="h-full w-full object-cover" /> : <><i className="block h-20 rounded-lg bg-primary/25" /><i className="mt-3 block h-2 w-4/5 rounded bg-muted" /><i className="mt-2 block h-2 w-1/2 rounded bg-muted" /></>}</div>;
  })}</div><p className="absolute inset-x-0 top-1/2 z-[400] text-center" style={{ color:advanced.centerTextColor||'#fff',fontFamily:advanced.cardFont||'SF Pro Display',fontSize:Number(advanced.cardFontSize||28),fontWeight:Number(advanced.cardFontWeight||700),transform:`translate3d(${Math.cos(time)*drift}px,calc(-50% + ${Math.sin(time)*drift}px),${Number(advanced.cardTextDepth||20)}px)` }}>{advanced.centerHeadline||scene.headline}</p></div>;
}