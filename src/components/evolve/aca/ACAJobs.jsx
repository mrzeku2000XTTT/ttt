import React from 'react';
import {useQuery} from '@tanstack/react-query';
import acaClient from '@/lib/aca/client';
export default function ACAJobs({aca}) {
  const query=useQuery({queryKey:['aca-jobs',aca.computer.id],enabled:!aca.replayId,queryFn:()=>acaClient('acaResource',{computer_id:aca.computer.id,mode:'jobs'})});
  const data=aca.replayId?{jobs:aca.view.jobsSnapshot || []}:query.data,error=query.error,isLoading=query.isLoading && !aca.replayId;
  const job=data?.jobs.find(j=>j.id===aca.view.jobId);
  return <div className="aca-stack"><p className="aca-notice">EVOLVE JOBS · READ ONLY. Existing legacy records are not ACA verified work. Claiming, submission and payouts are disabled.</p>{isLoading && <p>Loading actual job records…</p>}{error && <p className="aca-danger">{error.message}</p>}{data?.jobs.map(j=><button className="aca-btn text-left" key={j.id} disabled={aca.disabled || !aca.computer.current_session_id} onClick={()=>aca.action('OPEN_JOB',{job_id:j.id,app_id:'aca.jobs'})}>{j.code} · {j.title} · {j.status}</button>)}{job && <div className="aca-notice"><h3>{job.title}</h3><p>{job.brief}</p><p>Verification method: {job.verification}</p><p>{job.inputStatus}</p><p>Specific acceptance criteria: not stored on this legacy record.</p><pre className="aca-pre">{job.submission || 'No submission stored'}</pre><button className="aca-btn" disabled>CLAIM / SUBMIT UNAVAILABLE</button></div>}</div>;
}