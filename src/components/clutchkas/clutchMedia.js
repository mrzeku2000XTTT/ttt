export const CLUTCH_LOGO='https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/e9d1c80d2_generated_image.png';
export const CLUTCH_HERO='https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/181d0f663_generated_image.png';
export function youtubeId(value){
  let url;try{url=new URL(value);}catch{return null;}
  if(url.protocol!=='https:'&&url.protocol!=='http:')return null;
  const host=url.hostname.toLowerCase().replace(/^www\./,'');
  const parts=url.pathname.split('/').filter(Boolean);
  const id=host==='youtu.be'?parts[0]:['youtube.com','m.youtube.com','music.youtube.com'].includes(host)?(parts[0]==='watch'?url.searchParams.get('v'):['shorts','embed','live'].includes(parts[0])?parts[1]:null):null;
  return /^[\w-]{11}$/.test(id||'')?id:null;
}
export const signInToClutch=()=>{window.location.href='/login?returnTo='+encodeURIComponent('/ClutchKAS');};
export function validTip(value){return /^\d+(\.\d{1,8})?$/.test(String(value))&&Number(value)>0&&Number.isSafeInteger(Math.round(Number(value)*1e8));}