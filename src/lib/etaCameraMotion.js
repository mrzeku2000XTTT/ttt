const lerp = (a,b,t) => Number(a ?? 0) + (Number(b ?? 0) - Number(a ?? 0)) * t;
const ease = (t) => t < .5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
export const productDemoCamera = (duration) => [
  {time:0,panX:0,panY:8,depth:0,scale:.9,rotateX:0,rotateY:0,rotateZ:0,originX:50,originY:50},
  {time:duration*.18,panX:0,panY:0,depth:0,scale:1,rotateX:0,rotateY:0,rotateZ:0,originX:50,originY:40},
  {time:duration*.42,panX:0,panY:12,depth:0,scale:1.24,rotateX:0,rotateY:0,rotateZ:0,originX:62,originY:34},
  {time:duration*.67,panX:-14,panY:-8,depth:0,scale:1.3,rotateX:0,rotateY:0,rotateZ:0,originX:58,originY:61},
  {time:duration*.84,panX:0,panY:-12,depth:0,scale:1.2,rotateX:0,rotateY:0,rotateZ:0,originX:56,originY:76},
  {time:duration,panX:0,panY:0,depth:0,scale:1,rotateX:0,rotateY:0,rotateZ:0,originX:50,originY:50}
];
export function sampleCamera(items,time) { const sorted=[...items].sort((a,b)=>a.time-b.time); const index=sorted.findIndex((item)=>item.time>=time); if(index===-1)return sorted.at(-1)||{}; if(index===0)return sorted[0]||{}; const a=sorted[index-1],b=sorted[index],span=Math.max(.001,b.time-a.time),t=ease(Math.max(0,Math.min(1,(time-a.time)/span))); return Object.keys({...a,...b}).reduce((out,key)=>{out[key]=typeof b[key]==='number'?lerp(a[key],b[key],t):b[key];return out;},{}); }