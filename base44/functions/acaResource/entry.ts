import { context, scoped } from '../../shared/aca/authorization.ts';
import { resource } from '../../shared/aca/resources.ts';
import { jobs, wallet } from '../../shared/aca/evolveReadAdapter.ts';
import { toolNetwork } from '../../shared/aca/toolNetworkAdapter.ts';
export default async function(req) {
  try {
    const body=await req.json(), ctx=await scoped(await context(req),body.computer_id);
    return Response.json(body.mode==='jobs' ? {jobs:await jobs(ctx)} : body.mode==='wallet' ? await wallet(ctx) : body.mode==='tools' ? toolNetwork() : await resource(ctx,body.address));
  } catch(e) {return Response.json({error:e.code || 'INTERNAL_ERROR',message:e.code ? e.message : 'Resource unavailable'}, {status:['FORBIDDEN','UNAUTHORIZED'].includes(e.code)?403:400});}
}