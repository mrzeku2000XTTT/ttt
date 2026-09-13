import React, { useState } from 'react';
import CamNodeGraph from '@/components/cam/CamNodeGraph';
import CamTimeline from '@/components/cam/CamTimeline';
import '@/components/cam/camTimeline.css';

export default function CamEditorPanel({ timeline, media, onAddMedia, onSelectAsset, mobileView, ...graphProps }) {
  const [tab, setTab] = useState('nodes');
  React.useEffect(()=>{if(mobileView==='timeline'){setTab('timeline');timeline.enable();}},[mobileView]);
  const tabs = <div className="cm-editor-tabs" role="tablist" aria-label="Editor view">{['nodes', 'timeline'].map((name) => <button role="tab" aria-selected={tab === name} key={name} className={tab === name ? 'is-active' : ''} onClick={() => { setTab(name); if (name === 'timeline') timeline.enable(); }}>{name === 'nodes' ? 'Nodes' : 'Timeline'}</button>)}</div>;
  return tab === 'nodes' ? <CamNodeGraph {...graphProps} tabs={tabs} /> : <CamTimeline timeline={timeline} media={media} onAddMedia={onAddMedia} onSelectAsset={onSelectAsset} tabs={tabs} isMax={graphProps.isMax} onMax={graphProps.onMax} />;
}