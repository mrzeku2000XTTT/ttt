import React,{useRef} from 'react';
import {useEvolve} from '@/lib/evolve/useEvolve';
import useComputer from '@/lib/aca/useComputer';
import ACAErrorBoundary from '@/components/evolve/aca/ACAErrorBoundary';
import ACATopBar from '@/components/evolve/aca/ACATopBar';
import ACAAppDock from '@/components/evolve/aca/ACAAppDock';
import ACAWindowHost from '@/components/evolve/aca/ACAWindowHost';
import ACADevControl from '@/components/evolve/aca/ACADevControl';
import ACAReplayControls from '@/components/evolve/aca/ACAReplayControls';
import ACAActionInspector from '@/components/evolve/aca/ACAActionInspector';
import ACACursor from '@/components/evolve/aca/ACACursor';
import ACABrainControl from '@/components/evolve/aca/ACABrainControl';
import ACABrainPanel from '@/components/evolve/aca/ACABrainPanel';
import useBrain from '@/lib/aca/useBrain';
import '@/components/evolve/aca/aca.css';
export default function ACAComputer({agentId,onClose}) {
  const {engine,experimentId,user}=useEvolve(); const agent=engine?.agentById.get(agentId); const root=useRef(null);
  const aca=useComputer(agent?.id || '',experimentId);
  const brain=useBrain(aca.computer?.id || '');
  if(user?.role!=='admin')return <div className="aca-computer"><div className="aca-idle">ACA DEV ACCESS REQUIRES ADMIN<button className="aca-btn" onClick={onClose}>CLOSE</button></div></div>;
  if(!aca.computer)return <div className="aca-computer"><div className="aca-idle">{aca.error?'FAILED: '+aca.error:'Opening actual computer…'}<button className="aca-btn" onClick={onClose}>CLOSE</button></div></div>;
  return <ACAErrorBoundary onClose={onClose}><div ref={root} className="aca-computer"><ACATopBar aca={aca} agent={agent} onClose={onClose}/><ACABrainPanel brain={brain}/><ACAReplayControls aca={aca}/>{aca.error && <div role="alert" className="aca-danger px-4 py-2 border-b border-border">FAILED · {aca.error}</div>}<div className="aca-main"><aside className="aca-sidebar"><ACABrainControl brain={brain} disabled={aca.disabled}/><ACADevControl aca={aca} autonomous={brain.autonomous}/><ACAActionInspector aca={aca}/></aside><ACAWindowHost aca={aca} agent={agent}/></div><ACAAppDock aca={aca}/><footer className="aca-status"><span>{aca.busy?'TASK: ACTIVE':aca.replayId?'TASK: REPLAY':'TASK: IDLE'}</span><span>SIM COMPUTE {aca.computer.compute_remaining}</span><span>COST: FREE · 0.00 tKAS</span><span>{aca.workspace.fileLoading?'READING ACTUAL BYTES':''}</span></footer><ACACursor root={root} event={aca.event} speed={aca.replayId?aca.speed:1}/></div></ACAErrorBoundary>;
}