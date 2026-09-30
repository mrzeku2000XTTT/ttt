import { context, scoped } from '../../shared/aca/authorization.ts';
import { VERSION, fail } from '../../shared/aca/contracts.ts';
import { APPS, SKILLS } from '../../shared/aca/manifests.ts';
import { initFolders } from '../../shared/aca/workspace.ts';
export default async function(req) {
  try {
    const ctx=await context(req), body=await req.json(); let c;
    if(body.computer_id) c=(await scoped(ctx,body.computer_id)).c;
    else {
      if(body.agent_id !== 'AGT_0011') fail('AGENT_UNAVAILABLE','V0.1 is attached to AGT_0011 only');
      const agents=await ctx.sr.entities.EvolveAgent.filter({agent_key:body.agent_id,experiment_id:body.experiment_id},'-created_date',1);
      const agent=agents[0]; if(!agent || agent.status==='archived') fail('AGENT_UNAVAILABLE');
      c=(await ctx.sr.entities.AgentComputer.filter({agent_id:agent.agent_key,experiment_id:agent.experiment_id},'created_date',1))[0];
      if(!c) c=await ctx.sr.entities.AgentComputer.create({computer_id:'ACA_0011',agent_id:agent.agent_key,agent_record_id:agent.id,experiment_id:agent.experiment_id,workspace_id:crypto.randomUUID(),status:'ONLINE',version:VERSION,installed_app_ids:APPS.map(a=>a.app_id),skill_ids:SKILLS.map(s=>s.skill_id),current_session_id:'',current_app_id:'',view_state:{windows:[],activeApp:''},compute_tier:'PROTOTYPE',memory_limit:262144,storage_limit:4194304,compute_remaining:10000,total_execution_cost:0,lock_request:'',lock_expires:''});
      await initFolders({...ctx,c});
      const existing=await ctx.sr.entities.ACAAppManifest.list('created_date',100);
      const missing=APPS.filter(a=>!existing.some(e=>e.app_id===a.app_id)); if(missing.length) await ctx.sr.entities.ACAAppManifest.bulkCreate(missing);
      const changed=APPS.flatMap(app=>{const record=existing.find(e=>e.app_id===app.app_id);return record && JSON.stringify(record.capabilities)!==JSON.stringify(app.capabilities)?[{id:record.id,...app}]:[];});if(changed.length)await ctx.sr.entities.ACAAppManifest.bulkUpdate(changed);
      const assigned=await ctx.sr.entities.AgentSkill.filter({computer_id:c.id},'created_date',30);
      const skills=SKILLS.filter(s=>!assigned.some(e=>e.skill_id===s.skill_id)); if(skills.length) await ctx.sr.entities.AgentSkill.bulkCreate(skills.map(s=>({...s,computer_id:c.id,agent_id:c.agent_id,version:VERSION,source:'MANUAL',instructions_reference:'aca://skill/' + s.skill_id})));
    }
    return Response.json({computer:c,apps:APPS});
  } catch(e) {return Response.json({error:e.code || 'INTERNAL_ERROR',message:e.code ? e.message : 'ACA initialization failed'}, {status:['FORBIDDEN','UNAUTHORIZED'].includes(e.code)?403:400});}
}