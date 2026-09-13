import { buildCutouts, decomposeImage, fitFontSize, loadImage } from '@/components/kinezma/kinezmaEngine';

const rasterize = (component) => {
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(component.w)); canvas.height=Math.max(1,Math.round(component.h));
  const ctx=canvas.getContext('2d');
  if(component.bg){ctx.fillStyle=component.bg;ctx.fillRect(0,0,canvas.width,canvas.height);}
  if(component.kind==='box'){ctx.fillStyle=component.bg||'#000000';ctx.fillRect(0,0,canvas.width,canvas.height);}
  if(component.kind==='text'){
    const size=fitFontSize({...component,x:0,y:0});
    ctx.fillStyle=component.color||'#000000';ctx.font=`${Number(component.fontWeight)||700} ${size}px ${component.fontFamily||'sans-serif'}`;
    ctx.textAlign=component.align==='left'?'left':'center';ctx.textBaseline='middle';
    ctx.fillText(component.text||'',component.align==='left'?0:canvas.width/2,canvas.height/2,canvas.width);
  }
  return canvas.toDataURL('image/png');
};

export async function separateIntoCamLayers({ imageUrl, width, height }) {
  const scene=await decomposeImage({imageUrl,width,height});
  const cutouts=await buildCutouts(imageUrl,scene);
  const background=document.createElement('canvas');background.width=scene.width;background.height=scene.height;
  const bg=background.getContext('2d');bg.fillStyle=scene.background||'#000000';bg.fillRect(0,0,scene.width,scene.height);
  const primaryUrl=background.toDataURL('image/png'),primaryImage=await loadImage(primaryUrl),stamp=Date.now();
  const components=scene.components.filter(c=>!(c.kind==='box'&&c.x<=0&&c.y<=0&&c.w>=scene.width*.95&&c.h>=scene.height*.95));
  const layers=await Promise.all(components.map(async(c,index)=>{
    const url=c.kind==='cutout'?cutouts[c.id]:rasterize(c),img=await loadImage(url);
    return {id:`kinezma-${stamp}-${c.id}`,name:c.name||`Layer ${index+1}`,img,url,sourceUrl:url,aspect:c.w/c.h,pos:{x:((c.x+c.w/2)/scene.width-.5)*3.4,y:(.5-(c.y+c.h/2)/scene.height)*1.9,z:.03*(index+1)},scale:c.h/scene.height,rotation:0,opacity:1,edgeCropped:true};
  }));
  return {primary:{id:'primary',name:'Background',img:primaryImage,url:primaryUrl,pos:{x:0,y:0,z:0},scale:1,aspect:scene.width/scene.height},layers};
}