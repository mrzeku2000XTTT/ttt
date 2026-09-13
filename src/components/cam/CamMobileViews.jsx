import React from 'react';

export default function CamMobileViews({ view, onChange }) {
  return <nav className="cm-mobile-views" aria-label="Mobile workspace view">
    {[['preview','Preview'],['rig','Axes'],['timeline','Timeline'],['layers','Layers'],['all','All']].map(([id,label])=><button key={id} aria-pressed={view===id} onClick={()=>onChange(id)}>{label}</button>)}
  </nav>;
}