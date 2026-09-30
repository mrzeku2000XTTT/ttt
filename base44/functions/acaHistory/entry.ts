import { context, scoped } from '../../shared/aca/authorization.ts';
import { history } from '../../shared/aca/history.ts';
export default async function(req) {
  try { const body=await req.json(), ctx=await scoped(await context(req),body.computer_id); return Response.json(await history(ctx,body.session_id,body.before_sequence)); }
  catch(e) {return Response.json({error:e.code || 'INTERNAL_ERROR',message:e.code ? e.message : 'History unavailable'}, {status:['FORBIDDEN','UNAUTHORIZED'].includes(e.code)?403:400});}
}