import React from 'react';

export default function ETACards4Scene({ scene, advanced, frameProgress=0 }) {
  const images=advanced.cardImages||[], count=Math.max(images.length,10), time=frameProgress*Number(scene.duration||3);
  const zooms=[...(advanced.cardZoomKeyframes||[])].sort((a,b)=>a.time-b.time), zoom=zooms.filter((item)=>item.time<=time).at(-1)||zooms[0]||{focusCard:0,zoomOut:true,x:960,y:540};
  const width=Number(advanced.cardWidth||112),height=Number(advanced.cardHeight||160),float=Number(advanced.floatRotation||5)*Math.sin(time*Number(advanced.floatSpeed||20)*Math.PI/180);
  const cameraX=-(Number(zoom.x||960)-960)*.12,cameraY=-(Number(zoom.y||540)-540)*.12,cameraScale=zoom.zoomOut?.82:1.45;
  return <div className="relative h-52 w-full max-w-md overflow-hidden" style={{perspective:Number(advanced.cardPerspective||900)}}><div className="absolute inset-0 transition-transform" style={{transformStyle:'preserve-3d',transform:`translate3d(${cameraX}px,${cameraY}px,0) scale(${cameraScale}) rotateZ(${float}deg)`}}>{Array.from({length:count}).map((_,i)=>{
    const angle=i/count*Math.PI*2,x=Math.cos(angle)*Number(advanced.haloX||145),y=Math.sin(angle)*Number(advanced.haloY||65),z=Math.sin(angle*2)*Number(advanced.haloZ||120),focused=!zoom.zoomOut&&i===Number(zoom.focusCard||0)%count;
    const blur=focused?0:Math.min(Number(advanced.maxBlur||8),Math.abs(Number(advanced.haloZ||120)-z)/Math.max(1,Number(advanced.depthStrength||35)));
    return <div key={i} className="absolute left-1/2 top-1/2 overflow-hidden border border-border bg-background p-2 shadow-2xl" style={{width,height,marginLeft:-width/2,marginTop:-height/2,borderRadius:Number(advanced.cardRadius||16),transform:`translate3d(${x}px,${y}px,${focused?z+80:z}px) rotateY(${-angle*180/Math.PI+float}deg)`,filter:`blur(${blur}px)`,opacity:Math.min(1,Math.max(.2,(frameProgress-i*.02)*7)),zIndex:focused?500:Math.round(z+200)}}>{images[i%Math.max(1,images.length)]?.url?<img src={images[i%images.length].url} alt="Zoom card" className="h-full w-full object-cover"/>:<><i className="block h-20 rounded-lg bg-primary/25"/><i className="mt-3 block h-2 w-4/5 rounded bg-muted"/><i className="mt-2 block h-2 w-1/2 rounded bg-muted"/></>}</div>;
  })}</div></div>;
}