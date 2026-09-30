import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import acaClient from '@/lib/aca/client';
export default function useActivity(computerId, sessionId) {
  const [history,setHistory]=useState({events:[],session:null,checkpoints:[]});
  const [error,setError]=useState('');
  const refresh=useCallback(async()=>{if(!computerId || !sessionId) {setHistory({events:[],session:null,checkpoints:[]}); return;} try {setHistory(await acaClient('acaHistory',{computer_id:computerId,session_id:sessionId}));setError('');}catch(e){setError(e.message);}},[computerId,sessionId]);
  useEffect(()=>{
    setHistory({events:[],session:null,checkpoints:[]});
    if(!computerId || !sessionId) return;
    const unsubscribe=base44.entities.ACAActionEvent.subscribe(event=>{
      if(event.data?.computer_id===computerId && event.data?.session_id===sessionId) refresh();
    });
    refresh(); const timer=setInterval(refresh,5000);
    return ()=>{unsubscribe();clearInterval(timer);};
  },[computerId,sessionId,refresh]);
  return {...history,error,refresh};
}