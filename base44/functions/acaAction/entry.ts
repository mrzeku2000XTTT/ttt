import { context } from '../../shared/aca/authorization.ts';
import { dispatch } from '../../shared/aca/runtime.ts';
export default async function(req) {
  try { const ctx=await context(req); return Response.json(await dispatch(ctx,await req.json())); }
  catch(e) {return Response.json({error:e.code || 'INTERNAL_ERROR',message:e.code ? e.message : 'ACA action failed'}, {status:['FORBIDDEN','UNAUTHORIZED'].includes(e.code)?403:400});}
}