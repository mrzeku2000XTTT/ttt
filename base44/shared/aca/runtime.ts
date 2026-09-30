import { fail, iso } from './contracts.ts';
import { scoped, assertScope } from './authorization.ts';
import { operate } from './operations.ts';
import { appOf } from './manifests.ts';
import { entries } from './workspace.ts';
import { validateAction } from './validation.ts';
const SPECIAL = ['START_SESSION','END_SESSION','CREATE_FIXTURE','OPEN_APP','CLOSE_APP','BROWSER_HISTORY','INSPECT_TOOLS'];
export async function dispatch(base, body) {
  const ctx = await scoped(base,body.computer_id);
  const type = body.action_type; const a = body.args || {};
  if (typeof type !== 'string' || typeof body.request_id !== 'string' || body.request_id.length > 100 || typeof a !== 'object' || Array.isArray(a)) fail('INVALID_REQUEST');
  const prior = (await ctx.sr.entities.ACAActionExecution.filter({computer_id:ctx.c.id,request_id:body.request_id},'created_date',1))[0];
  if (prior) return {execution:prior,computer:ctx.c,result:prior.output_reference || {},duplicate:true};
  const lock = await ctx.sr.entities.AgentComputer.updateMany({id:ctx.c.id,$or:[{lock_request:''},{lock_expires:{$lt:iso()}}]},{$set:{lock_request:body.request_id,lock_expires:new Date(Date.now()+120000).toISOString()}});
  if (lock.updated !== 1) fail('COMPUTER_BUSY','A real action is already running');
  let ex, session, event; const start=Date.now();
  try {
    ctx.c = await ctx.sr.entities.AgentComputer.get(ctx.c.id);
    ex = await ctx.sr.entities.ACAActionExecution.create({computer_id:ctx.c.id,agent_id:ctx.c.agent_id,session_id:body.session_id || '',request_id:body.request_id,requested_by_user_id:ctx.user.id,action_type:type,app_id:a.app_id || ctx.c.current_app_id || '',status:'REQUESTED',requested_at:iso(),cost_sompi:0,input_reference:{file_id:a.file_id || '',revision_id:a.revision_id || '',path:a.path || '',artifact_id:a.artifact_id || '',text_bytes:typeof a.text==='string' ? new TextEncoder().encode(a.text).length : 0}});
    await ctx.sr.entities.ACAActionExecution.update(ex.id,{status:'VALIDATING'});
    validateAction(type,a);
    if (type === 'START_SESSION') {
      if (ctx.c.current_session_id) fail('SESSION_ALREADY_ACTIVE');
      session = await ctx.sr.entities.AgentComputerSession.create({session_id:'ACA_SESSION_' + crypto.randomUUID(),computer_id:ctx.c.id,agent_id:ctx.c.agent_id,controller_user_id:ctx.user.id,started_at:iso(),status:'IDLE',trigger:'MANUAL_TEST',actions_count:0,events_count:0,artifacts_created:[],compute_used:0,tool_cost:0,initial_view:{windows:[],activeApp:''}});
      ctx.c = await ctx.sr.entities.AgentComputer.update(ctx.c.id,{current_session_id:session.id,view_state:{windows:[],activeApp:''}});
    } else {
      session = assertScope(await ctx.sr.entities.AgentComputerSession.get(body.session_id || ''),ctx.c);
      if (ctx.c.current_session_id !== session.id || session.controller_user_id !== ctx.user.id || !['IDLE','ACTIVE'].includes(session.status)) fail('SESSION_FORBIDDEN');
      if (session.actions_count >= 180) fail('SESSION_ACTION_LIMIT');
    }
    ctx.session=session;
    if (ctx.c.compute_remaining < 1) fail('INSUFFICIENT_SIM_COMPUTE');
    if (!SPECIAL.includes(type)) {
      const app=appOf(a.app_id || ctx.c.current_app_id || 'aca.files');
      if (!app || !ctx.c.installed_app_ids.includes(app.app_id) || !app.capabilities.includes(type)) fail('ACTION_UNAVAILABLE');
    }
    await ctx.sr.entities.AgentComputerSession.update(session.id,{status:'ACTIVE'});
    await ctx.sr.entities.ACAActionExecution.update(ex.id,{status:'RUNNING',session_id:session.id,started_at:iso()});
    const operation = type === 'START_SESSION' ? {view:ctx.c.view_state,result:{session_id:session.id},target:'control:start'} : type === 'END_SESSION' ? {view:ctx.c.view_state,result:{session_id:session.id},target:'control:end'} : await operate(ctx,type,a,ex);
    const view={...operation.view,currentAction:type,files:(await entries(ctx)).map(f=>({id:f.id,path:f.path,kind:f.kind,revision_id:f.revision_id || ''}))};
    ex = await ctx.sr.entities.ACAActionExecution.update(ex.id,{status:'COMPLETED',completed_at:iso(),duration_ms:Date.now()-start,output_reference:operation.result});
    event = await ctx.sr.entities.ACAActionEvent.create({computer_id:ctx.c.id,agent_id:ctx.c.agent_id,session_id:session.id,execution_id:ex.id,sequence:session.events_count+1,timestamp:iso(),action_type:type,app_id:view.activeApp || '',target_id:operation.target,status:'COMPLETED',duration_ms:ex.duration_ms,cost_sompi:0,metadata:operation.result,view_state:view});
    if (session.events_count % 10 === 0 || type === 'END_SESSION') await ctx.sr.entities.ACASessionCheckpoint.create({computer_id:ctx.c.id,session_id:session.id,sequence:event.sequence,view_state:view});
    await ctx.sr.entities.AgentComputerSession.update(session.id,{status:type==='END_SESSION' ? 'COMPLETED' : 'IDLE',ended_at:type==='END_SESSION' ? iso() : '',actions_count:session.actions_count+1,events_count:event.sequence,compute_used:session.compute_used+1,artifacts_created:[...new Set([...(session.artifacts_created || []),...(type==='CREATE_ARTIFACT' && operation.result.artifact_id ? [operation.result.artifact_id] : [])])]});
    ctx.c = await ctx.sr.entities.AgentComputer.update(ctx.c.id,{current_session_id:type==='END_SESSION' ? '' : session.id,current_app_id:view.activeApp || '',view_state:view,last_active_at:iso(),compute_remaining:ctx.c.compute_remaining-1});
    return {execution:ex,event,computer:{...ctx.c,lock_request:''},result:operation.result};
  } catch (error) {
    if(ex) {
      const code=error.code || 'INTERNAL_ERROR'; const message=String(error.message || code).replace(/https?:\/\/\S+/g,'[private URL]').slice(0,500);
      ex=await ctx.sr.entities.ACAActionExecution.update(ex.id,{status:'FAILED',completed_at:iso(),duration_ms:Date.now()-start,error_code:code,error_message:message});
      event=await ctx.sr.entities.ACAActionEvent.create({computer_id:ctx.c.id,agent_id:ctx.c.agent_id,session_id:session?.id || '',execution_id:ex.id,sequence:(session?.events_count || 0)+1,timestamp:iso(),action_type:type,status:'FAILED',duration_ms:ex.duration_ms,cost_sompi:0,metadata:{error_code:code,error_message:message},view_state:ctx.c.view_state || {}});
      if(session) await ctx.sr.entities.AgentComputerSession.update(session.id,{status:'IDLE',actions_count:session.actions_count+1,events_count:event.sequence});
      return {execution:ex,event,computer:{...ctx.c,lock_request:''},result:{}};
    }
    throw error;
  } finally { await ctx.sr.entities.AgentComputer.updateMany({id:ctx.c.id,lock_request:body.request_id},{$set:{lock_request:'',lock_expires:''}}); }
}