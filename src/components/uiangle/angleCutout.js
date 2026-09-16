import * as THREE from 'three';
export function loadAngleImage(url) {
  return new Promise((resolve, reject) => { const img = new Image(); img.crossOrigin = 'anonymous'; img.onload = () => resolve(img); img.onerror = () => reject(new Error('Could not load the reference. Upload it again to refresh access.')); img.src = url; });
}
export function drawSubject(ctx, item, image, width, height) {
  ctx.save(); ctx.beginPath();
  item.outline.forEach(([x,y],i) => ctx[i ? 'lineTo' : 'moveTo'](x/100*width,y/100*height)); ctx.closePath(); ctx.clip();
  if (image && item.source && item.display === 'cutout') {
    const s=item.source; ctx.drawImage(image,s.x*image.width,s.y*image.height,s.w*image.width,s.h*image.height,0,0,width,height);
  } else { ctx.fillStyle = '#c8c8c8'; ctx.fillRect(0,0,width,height); }
  ctx.restore();
}
export function subjectTexture(item, image) {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 1024;
  drawSubject(canvas.getContext('2d'),item,image,512,1024);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}
export async function captureFlatShot(state) {
  const canvas=document.createElement('canvas'); canvas.width=1600; canvas.height=900;
  const ctx=canvas.getContext('2d'), c=state.flatCamera;
  const image=state.reference ? await loadAngleImage(state.reference.url) : null;
  ctx.fillStyle='#171717'; ctx.fillRect(0,0,1600,900); ctx.translate(800,450); ctx.rotate(-c.roll*Math.PI/180); ctx.scale(c.zoom,c.zoom); ctx.translate(-c.x*16,-c.y*9);
  if(image) { ctx.globalAlpha=.25; ctx.drawImage(image,0,0,1600,900); ctx.globalAlpha=1; }
  state.subjects.forEach(item => {
    const w=item.w*16*item.scale,h=item.h*9*item.scale; ctx.save(); ctx.translate((item.x/16+.5)*1600,(item.z/16+.5)*900); ctx.rotate(item.rotation*Math.PI/180); ctx.translate(-w/2,-h); drawSubject(ctx,item,image,w,h); ctx.restore();
  });
  return new Promise(resolve => canvas.toBlob(resolve,'image/png'));
}