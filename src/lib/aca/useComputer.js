import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import acaClient, {requestId} from '@/lib/aca/client';
import useActivity from '@/lib/aca/useActivity';
import useWorkspace from '@/lib/aca/useWorkspace';
import replayReducer from '@/lib/aca/replayReducer';
import demoPlan from '@/lib/aca/demoPlan';
export default function useComputer(agentId, experimentId) {
  const qc=useQueryClient(), [computer,setComputer]=useState(null),[apps,setApps]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState(false),[demoRunning,setDemoRunning]=useState(false);
  const [sessionId,setSessionId]=useState(''),[replayId,setReplayId]=useState(''),[index,setIndex]=useState(0),[playing,setPlaying]=useState(false),[speed,setSpeed]=useState(1),[lastEvent,setLastEvent]=useState(null);
  useEffect(()=>{let active=true;acaClient('acaComputer',{agent_id:agentId,experiment_id:experimentId}).then(r=>{if(active){setComputer(r.computer);setApps(r.apps);setSessionId(r.computer.current_session_id || '');}}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[agentId,experimentId]);
  const sessions=useQuery({queryKey:['aca-sessions',computer?.id],enabled:!!computer,queryFn:()=>acaClient('acaSession',{computer_id:computer.id}),refetchInterval:10000});
  const history=useActivity(computer?.id,replayId || sessionId);
  const view=replayId ? replayReducer(history.events,index) : computer?.view_state || {windows:[],activeApp:''};
  const workspace=useWorkspace(computer?.id,view);
  useEffect(()=>{if(!computer?.id || replayId)return;let timer;const unsub=base44.entities.AgentComputer.subscribe(event=>{if(event.id!==computer.id)return;clearTimeout(timer);timer=setTimeout(()=>acaClient('acaComputer',{computer_id:computer.id}).then(r=>{setComputer(r.computer);if(r.computer.current_session_id)setSessionId(r.computer.current_session_id);qc.invalidateQueries({queryKey:['aca-workspace',computer.id]});}).catch(e=>setError(e.message)),120);});return()=>{unsub();clearTimeout(timer);};},[computer?.id,replayId,qc]);
  useEffect(()=>{if(replayId)return;const event=history.events.at(-1);if(event?.status==='COMPLETED' && (!lastEvent || Date.parse(event.timestamp)>Date.parse(lastEvent.timestamp)))setLastEvent(event);},[history.events,replayId]);
  useEffect(()=>{if(!playing || !replayId || !history.events.length)return;const timer=setTimeout(()=>{if(index>=history.events.length-1)setPlaying(false);else setIndex(index+1);},Math.max(120,Math.min(3000,(Date.parse(history.events[index+1]?.timestamp)-Date.parse(history.events[index]?.timestamp)) || 400)/speed));return()=>clearTimeout(timer);},[playing,replayId,index,speed,history.events]);
  const refresh=useCallback(async()=>{if(!computer)return;const r=await acaClient('acaComputer',{computer_id:computer.id});setComputer(r.computer);await qc.invalidateQueries({queryKey:['aca-workspace',computer.id]});await qc.invalidateQueries({queryKey:['aca-sessions',computer.id]});await history.refresh();},[computer?.id,qc,history.refresh]);
  const run=useCallback(async(type,args={},explicitSession)=>{
    if(replayId) throw new Error('Replay is read-only'); setBusy(true);setError('');
    try {const r=await acaClient('acaAction',{computer_id:computer.id,session_id:explicitSession || sessionId,request_id:requestId(),action_type:type,args});
      setComputer(r.computer);setLastEvent(r.event);
      if(r.execution.status!=='COMPLETED')throw new Error(r.execution.error_code + ': ' + r.execution.error_message);
      if(type==='START_SESSION')setSessionId(r.result.session_id);
      await qc.invalidateQueries({queryKey:['aca-workspace',computer.id]});await qc.invalidateQueries({queryKey:['aca-sessions',computer.id]});await history.refresh();return r;
    }catch(e){setError(e.message);throw e;}finally{setBusy(false);}
  },[computer?.id,sessionId,replayId,qc,history.refresh]);
  const action=(type,args)=>run(type,args).catch(()=>{});
  const replay=id=>{setReplayId(id);setIndex(0);setPlaying(false);};
  const live=()=>{setReplayId('');setPlaying(false);refresh().catch(e=>setError(e.message));};
  const demo=async()=>{setDemoRunning(true);try{const id=await demoPlan(run,workspace.data.files);setSessionId(id);await refresh();}catch(e){setError(e.message);}finally{setDemoRunning(false);}};
  return {computer,apps,error,busy:busy || demoRunning,sessionId,view,workspace,history,sessions:sessions.data?.sessions || [],run,action,demo,refresh,replay,live,replayId,index,setIndex,playing,setPlaying,speed,setSpeed,event:replayId?history.events[index]:lastEvent,disabled:busy || demoRunning || !!replayId};
}