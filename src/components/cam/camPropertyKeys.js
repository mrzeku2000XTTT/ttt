export const PROPERTY_DEFAULTS = { x: 0, y: 0, z: 0, scale: 1, rotation: 0, opacity: 1 };
export function sampleProperty(keys, time, fallback = 0) {
  if (!keys?.length) return fallback;
  const sorted = [...keys].sort((a,b) => a.t-b.t), a = [...sorted].reverse().find(k=>k.t<=time) || sorted[0], b = sorted.find(k=>k.t>time) || a;
  let p = a.t===b.t ? 0 : Math.max(0,Math.min(1,(time-a.t)/(b.t-a.t)));
  if (a.ease==='hold') p=0; else if (a.ease==='smooth') p=p*p*(3-2*p);
  return a.value+(b.value-a.value)*p;
}
export function propertyPoints(clip, property) {
  return clip.channels?.[property] ?? (clip.keys||[]).filter(k=>Number.isFinite(k[property])).map((k,i)=>({id:`legacy-${property}-${i}`,t:k.t,value:k[property],ease:'linear'}));
}
export function propertyPose(clip, time, base) {
  return Object.fromEntries(Object.entries(PROPERTY_DEFAULTS).map(([property, fallback])=>[property,sampleProperty(clip.channels?.[property],time,base[property]??fallback)]));
}
export function editProperty(project, assetId, clipId, property, at, value, options = {}) {
  if (!(property in PROPERTY_DEFAULTS) || !Number.isFinite(value) || !Number.isFinite(at)) return project;
  return {...project,tracks:project.tracks.map(track=>{
    if (track.assetId!==assetId) return track;
    const chosen=track.clips.find(c=>c.id===clipId) || [...track.clips].reverse().find(c=>at>=c.start && at<=c.start+c.duration);
    if (!chosen) return track;
    return {...track,clips:track.clips.map(c=>{
      if(c.id!==chosen.id)return c;
      const t=Math.max(0,Math.min(c.duration,at-c.start)), keys=propertyPoints(c,property);
      const match=options.id ? keys.find(k=>k.id===options.id) : keys.find(k=>Math.abs(k.t-t)<.005);
      const retained=keys.filter(k=>k.id!==match?.id && (options.remove || Math.abs(k.t-t)>=.005));
      const bounded=property==='opacity'?Math.max(0,Math.min(1,value)):property==='scale'?Math.max(.01,value):value;
      if(!options.remove)retained.push({id:match?.id||crypto.randomUUID(),t,value:bounded,ease:options.ease||match?.ease||'linear'});
      return {...c,channels:{...c.channels,[property]:retained.sort((a,b)=>a.t-b.t)}};
    })};
  })};
}
export function sliceChannels(channels, start, end) {
  if(!channels)return undefined;
  return Object.fromEntries(Object.entries(channels).map(([property,keys])=>{
    if(!keys.length)return [property,[]];
    const before=[...keys].reverse().find(k=>k.t<=start)||keys[0];
    return [property,[{id:crypto.randomUUID(),t:0,value:sampleProperty(keys,start),ease:before.ease},...keys.filter(k=>k.t>start&&k.t<end).map(k=>({...k,id:crypto.randomUUID(),t:k.t-start})),{id:crypto.randomUUID(),t:end-start,value:sampleProperty(keys,end),ease:'linear'}]];
  }));
}