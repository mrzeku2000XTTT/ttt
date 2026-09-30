import React, {useEffect,useState} from 'react';
import {X, Circle} from 'lucide-react';
import {useEvolve} from '@/lib/evolve/useEvolve';
export default function ACATopBar({aca,agent,onClose}) {
  const [clock,setClock]=useState(new Date()); const {chainBalances}=useEvolve();
  useEffect(()=>{const timer=setInterval(()=>setClock(new Date()),1000);return()=>clearInterval(timer);},[]);
  const balance=aca.replayId ? (aca.view.walletSnapshot?.balance_sompi == null ? undefined : aca.view.walletSnapshot.balance_sompi/1e8) : chainBalances.balanceFor(agent);
  const shownClock=aca.replayId && aca.event ? new Date(aca.event.timestamp) : clock;
  return <header className="aca-header"><strong className="text-lg tracking-widest">ACA <span className="aca-cyan">/ {agent.code}</span></strong><span className="aca-row aca-cyan"><Circle size={7} fill="currentColor"/>{aca.replayId?'REPLAY':'LIVE'}</span><span className="aca-header-detail aca-dim">{aca.computer?.computer_id} · {aca.computer?.version}</span><span className="aca-header-detail aca-dim">SESSION {aca.sessionId?aca.sessionId.slice(-8):'NONE'} · JOB NONE</span><span className="ml-auto">{shownClock.toLocaleTimeString()}</span><span className="aca-header-detail">WALLET {balance===undefined?'N/A':balance.toFixed(4)+' tKAS'}</span><button className="aca-btn" onClick={onClose} aria-label="Close computer"><X size={15}/></button></header>;
}