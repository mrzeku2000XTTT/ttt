const paths = [
  ['rise','Rise','Transform'],['fall','Drop','Transform'],['left','Slide Left','Transform'],['right','Slide Right','Transform'],
  ['orbit','Orbit','Motion Path'],['arc','Arc','Motion Path'],['spiral','Spiral','Motion Path'],['bounce','Bounce','Motion Path'],
];
const effects = [['clean','Clean'],['fade','Fade'],['blur','Blur'],['glow','Glow'],['shake','Shake'],['pulse','Pulse'],['spin','Spin']];
const styles = [['soft','Soft',.55],['cinematic','Cinematic',1],['punchy','Punchy',1.45]];
export const CAM_ANIMATIONS = paths.flatMap(([path,pathLabel,group]) => effects.flatMap(([effect,effectLabel]) => styles.map(([style,styleLabel]) => ({
  id: `${style}-${path}-${effect}`, name: `${styleLabel} ${pathLabel} ${effectLabel}`, path, effect, style, group: effect === 'clean' ? group : 'Effects', tags: `${style} ${path} ${effect} ${pathLabel} ${effectLabel}`.toLowerCase(),
}))));
export const animationById = (id) => CAM_ANIMATIONS.find((item) => item.id === id) || CAM_ANIMATIONS[0];
export function findAnimationPreset(text='') {
  const q=text.toLowerCase().replace(/[^a-z0-9 ]/g,' '), words=q.split(/\s+/).filter(Boolean);
  return CAM_ANIMATIONS.map((p)=>({p,score:words.reduce((n,w)=>n+(p.tags.includes(w)||p.name.toLowerCase().includes(w)?1:0),0)})).sort((a,b)=>b.score-a.score)[0]?.p || CAM_ANIMATIONS[0];
}
const ease = (t, style) => style === 'punchy' ? 1-Math.pow(1-t,4) : style === 'soft' ? t*t*(3-2*t) : .5-Math.cos(Math.PI*t)/2;
export function animationState(id, progress, intensity=1) {
  const preset=animationById(id), amp=styles.find(([s])=>s===preset.style)[2]*intensity, p=Math.max(0,Math.min(1,progress)), e=ease(p,preset.style), left=1-e;
  let dx=0,dy=0,dz=0,scale=1,rot=0,opacity=1,blur=0,glow=0;
  if(preset.path==='rise')dy=-1.2*amp*left; if(preset.path==='fall')dy=1.2*amp*left;
  if(preset.path==='left')dx=1.7*amp*left; if(preset.path==='right')dx=-1.7*amp*left;
  if(preset.path==='orbit'){dx=Math.sin(p*Math.PI*2)*.65*amp;dy=(Math.cos(p*Math.PI*2)-1)*.24*amp;}
  if(preset.path==='arc'){dx=(e-.5)*1.4*amp;dy=Math.sin(p*Math.PI)*.8*amp;}
  if(preset.path==='spiral'){dx=Math.sin(p*Math.PI*4)*left*.8*amp;dy=Math.cos(p*Math.PI*4)*left*.5*amp;scale=.35+.65*e;}
  if(preset.path==='bounce')dy=Math.abs(Math.sin(p*Math.PI*3))*left*.7*amp;
  if(preset.effect==='fade')opacity=e; if(preset.effect==='blur')blur=14*left*amp; if(preset.effect==='glow')glow=(.25+Math.sin(p*Math.PI)*.75)*18*amp;
  if(preset.effect==='shake'){dx+=Math.sin(p*83)*left*.12*amp;dy+=Math.cos(p*67)*left*.1*amp;}
  if(preset.effect==='pulse')scale*=1+Math.sin(p*Math.PI*4)*left*.18*amp; if(preset.effect==='spin')rot=360*e*amp;
  return { dx,dy,dz,scale,rot,opacity,blur,glow };
}