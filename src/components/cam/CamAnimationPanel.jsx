import React, { useMemo, useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { CAM_ANIMATIONS } from '@/components/cam/camAnimationLibrary';

export default function CamAnimationPanel({ assetName, activeId, onApply, disabled }) {
  const [query,setQuery]=useState(''), [group,setGroup]=useState('All');
  const items=useMemo(()=>CAM_ANIMATIONS.filter((p)=>(group==='All'||p.group===group)&&(!query||p.tags.includes(query.toLowerCase()))),[query,group]);
  return <div className="cm-anim-panel">
    <p><Sparkles /> {CAM_ANIMATIONS.length} non-destructive presets <b>{assetName}</b></p>
    <label className="cm-anim-search"><Search/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search motion or effect" /></label>
    <div className="cm-anim-groups">{['All','Transform','Motion Path','Effects'].map((name)=><button key={name} className={group===name?'active':''} onClick={()=>setGroup(name)}>{name}</button>)}</div>
    <div className="cm-anim-list">{items.map((preset)=><button disabled={disabled} key={preset.id} className={activeId===preset.id?'active':''} onClick={()=>onApply(preset.id)}><b>{preset.name}</b><span>{preset.group}</span></button>)}</div>
  </div>;
}