import { useEffect, useState } from 'react';

async function textMedia(item) {
  const canvas=document.createElement('canvas'), ctx=canvas.getContext('2d');
  ctx.font='700 96px sans-serif';
  const lines=item.text.split('\n');
  canvas.width=Math.min(4096,Math.max(96,...lines.map(line=>Math.ceil(ctx.measureText(line).width)+32)));
  canvas.height=Math.min(2048,Math.max(128,lines.length*120+16));
  ctx.font='700 96px sans-serif';ctx.fillStyle='#ffffff';ctx.textBaseline='top';
  lines.forEach((line,i)=>ctx.fillText(line,16,8+i*120,canvas.width-32));
  const url=canvas.toDataURL('image/png'), img=new Image();
  await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url;});
  return {...item,kind:'text',name:item.text.slice(0,32),url,img,aspect:canvas.width/canvas.height,pos:{x:0,y:0,z:.1},scale:.35};
}
export default function useCamTextLayers(address,setMedia) {
  const [items,setItems]=useState(()=>JSON.parse(localStorage.getItem(`cam_text_${address}`)||'[]'));
  useEffect(()=>{
    let alive=true;
    localStorage.setItem(`cam_text_${address}`,JSON.stringify(items));
    Promise.all(items.map(textMedia)).then(layers=>{if(alive)setMedia(prev=>[...prev.filter(m=>m.kind!=='text'),...layers.map(layer=>({...prev.find(m=>m.id===layer.id),...layer,pos:prev.find(m=>m.id===layer.id)?.pos||layer.pos,scale:prev.find(m=>m.id===layer.id)?.scale??layer.scale}))]);});
    return()=>{alive=false;};
  },[items,address,setMedia]);
  const add=(text)=>{if(!text?.trim())return;const id=crypto.randomUUID();setItems(prev=>[...prev,{id,text:text.trim().slice(0,500)}]);return id;};
  const edit=(id,text)=>{if(text?.trim())setItems(prev=>prev.map(item=>item.id===id?{...item,text:text.trim().slice(0,500)}:item));};
  return {add,edit};
}