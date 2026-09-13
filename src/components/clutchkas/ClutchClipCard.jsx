import React,{useEffect,useRef,useState} from 'react';
import ClutchPlayer from '@/components/clutchkas/ClutchPlayer';
import ClutchHeart from '@/components/clutchkas/ClutchHeart';
import { shortKaspaAddress } from '@/lib/useKcc20Wallet';
export default function ClutchClipCard({clip,address,amount,onConfigure,onRefresh,paused}){
  const card=useRef(null),[visible,setVisible]=useState(false);
  useEffect(()=>{const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting&&entry.intersectionRatio>.6),{threshold:[0,.6,1]});observer.observe(card.current);return()=>observer.disconnect();},[]);
  return <article ref={card} className="clutch-clip"><div className="clutch-video"><ClutchPlayer clip={clip} active={visible&&!paused}/></div><div className="clutch-clip-details"><div className="min-w-0"><div className="clutch-creator"><b>@{clip.creator_name}</b><span title={clip.creator_wallet}>{shortKaspaAddress(clip.creator_wallet)}</span></div><h2>{clip.title}</h2>{clip.caption&&<p className="clutch-caption">{clip.caption}</p>}<p>VALORANT · AI EDIT · {Math.round(clip.duration_seconds||60)}S · Scroll or swipe for the next play</p></div><ClutchHeart clip={clip} address={address} amount={amount} onConfigure={onConfigure} onRefresh={onRefresh}/></div></article>;
}