import { context, scoped } from '../../shared/aca/authorization.ts';
import { dispatch } from '../../shared/aca/runtime.ts';
export default async function(req) {
  try {
    const base=await context(req), body=await req.json();
    if(['START_SESSION','END_SESSION'].includes(body.action_type)) return Response.json(await dispatch(base,body));
    const ctx=await scoped(base,body.computer_id);
    return Response.json({sessions:await ctx.sr.entities.AgentComputerSession.filter({computer_id:ctx.c.id},'-created_date',50)});
  } catch(e) {return Response.json({error:e.code || 'INTERNAL_ERROR',message:e.code ? e.message : 'Session operation failed'}, {status:['FORBIDDEN','UNAUTHORIZED'].includes(e.code)?403:400});}
}