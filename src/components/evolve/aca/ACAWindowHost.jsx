import React from 'react';
import ACAFiles from '@/components/evolve/aca/ACAFiles';
import ACAEditor from '@/components/evolve/aca/ACAEditor';
import ACAData from '@/components/evolve/aca/ACAData';
import ACACode from '@/components/evolve/aca/ACACode';
import ACATerminal from '@/components/evolve/aca/ACATerminal';
import ACAResearch from '@/components/evolve/aca/ACAResearch';
import ACADocuments from '@/components/evolve/aca/ACADocuments';
import ACAArtifactViewer from '@/components/evolve/aca/ACAArtifactViewer';
import ACAJobs from '@/components/evolve/aca/ACAJobs';
import ACATools from '@/components/evolve/aca/ACATools';
import ACAWallet from '@/components/evolve/aca/ACAWallet';
import ACAMemory from '@/components/evolve/aca/ACAMemory';
import ACAActivity from '@/components/evolve/aca/ACAActivity';
import ACABrowser from '@/components/evolve/aca/ACABrowser';
const panels={files:ACAFiles,editor:ACAEditor,data:ACAData,code:ACACode,terminal:ACATerminal,research:ACAResearch,documents:ACADocuments,artifacts:ACAArtifactViewer,jobs:ACAJobs,tools:ACATools,wallet:ACAWallet,memory:ACAMemory,activity:ACAActivity,browser:ACABrowser};
export default function ACAWindowHost({aca,agent}) {
  const Panel=panels[aca.view.activeApp?.split('.')[1]];
  if(!Panel)return <main className="aca-idle"><div className="text-3xl tracking-widest aca-cyan">ACA_0011</div><div className="aca-dim">IDLE · AGT_0011 · COMPUTER ONLINE</div><p>Start a manual session, then open an installed app.</p><p className="aca-dim">No autonomous control · no invented activity</p></main>;
  return <main className="aca-window"><div className="aca-window-head">{(aca.view.windows || []).map(id=><button className="aca-btn" data-aca-target={'app:'+id} key={id} disabled={aca.disabled || !aca.computer.current_session_id} onClick={()=>aca.action('OPEN_APP',{app_id:id})}>{id.replace('aca.','').toUpperCase()}</button>)}<button className="aca-btn ml-auto" disabled={aca.disabled || !aca.computer.current_session_id} onClick={()=>aca.action('CLOSE_APP',{app_id:aca.view.activeApp})}>CLOSE WINDOW</button></div><div className="aca-content"><Panel aca={aca} agent={agent}/></div></main>;
}