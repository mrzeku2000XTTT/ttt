import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import acaClient from '@/lib/aca/client';

const ACTIVE = ['STARTING', 'RUNNING', 'THINKING', 'ACTING', 'PAUSED', 'STOPPING'];

export default function useBrain(computerId) {
  const [run, setRun] = useState(null);
  const [error, setError] = useState('');
  const [watching, setWatching] = useState(false);
  const watchingRef = useRef(false);

  // Reconstruct the latest run after a refresh, straight from persisted state.
  useEffect(() => {
    if (!computerId) { setRun(null); return; }
    let alive = true;
    base44.entities.ACABrainRun.filter({ computer_id: computerId }, '-created_date', 1)
      .then(list => { if (alive && Array.isArray(list) && list[0]) setRun(list[0]); })
      .catch(() => {});
    return () => { alive = false; };
  }, [computerId]);

  const steps = useQuery({
    queryKey: ['aca-brain-steps', run?.id],
    enabled: !!run?.id,
    queryFn: () => base44.entities.ACABrainStep.filter({ brain_run_id: run.id }, '-step_number', 25),
    refetchInterval: 4000,
  });

  const call = useCallback(async (action, extra = {}) => {
    const r = await acaClient('acaBrain', { action, ...extra });
    if (r?.run) setRun(r.run);
    return r;
  }, []);

  // The driver advances the stepped loop: one real Observe→Decide→Act iteration
  // per request. It stops the moment the run is no longer RUNNING, and it never
  // issues two overlapping STEP calls.
  const drive = useCallback(async (runId) => {
    watchingRef.current = true;
    setWatching(true);
    try {
      while (watchingRef.current) {
        let r;
        try { r = await call('STEP', { run_id: runId }); }
        catch (e) { setError(e.message); return; }
        if (!r?.run || r.run.status !== 'RUNNING') return;
        await new Promise(res => setTimeout(res, 400));
      }
    } finally {
      watchingRef.current = false;
      setWatching(false);
    }
  }, [call]);

  const start = useCallback(async (goal) => {
    setError('');
    try {
      const r = await call('START', { computer_id: computerId, goal });
      if (r?.run) drive(r.run.id);
      return r?.run;
    } catch (e) { setError(e.message); }
  }, [computerId, call, drive]);

  const pause = useCallback(async () => {
    try { await call('PAUSE', { run_id: run?.id }); } catch (e) { setError(e.message); }
  }, [call, run?.id]);

  const resume = useCallback(async () => {
    setError('');
    try { const r = await call('RESUME', { run_id: run?.id }); if (r?.run) drive(r.run.id); }
    catch (e) { setError(e.message); }
  }, [call, run?.id, drive]);

  const stop = useCallback(async () => {
    watchingRef.current = false;
    setWatching(false);
    try { await call('STOP', { run_id: run?.id }); } catch (e) { setError(e.message); }
  }, [call, run?.id]);

  useEffect(() => () => { watchingRef.current = false; }, []);

  const autonomous = !!run && ACTIVE.includes(run.status);
  return { run, steps: steps.data || [], error, watching, autonomous, start, pause, resume, stop };
}