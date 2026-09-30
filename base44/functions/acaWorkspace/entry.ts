import { context, scoped, assertScope, find } from '../../shared/aca/authorization.ts';
import { entries, readFile } from '../../shared/aca/workspace.ts';
export default async function(req) {
  try {
    const body=await req.json(), ctx=await scoped(await context(req),body.computer_id);
    if(body.mode==='read') return Response.json(await readFile(ctx,body));
    if(body.mode==='download') {
      const file=await readFile(ctx,body); const revision=await find(ctx.sr,'ACAFileRevision',file.revision.id,'REVISION_NOT_FOUND'); assertScope(revision,ctx.c,'REVISION_NOT_FOUND');
      const result=await ctx.sr.integrations.Core.CreateFileSignedUrl({file_uri:revision.storage_reference,expires_in:60});
      return Response.json({...result,filename:revision.filename});
    }
    const [files,artifacts,notes,skills,verifications]=await Promise.all([entries(ctx),ctx.sr.entities.AgentArtifact.filter({computer_id:ctx.c.id},'-created_date',200),ctx.sr.entities.ACAMemoryEntry.filter({computer_id:ctx.c.id},'-created_date',100),ctx.sr.entities.AgentSkill.filter({computer_id:ctx.c.id},'created_date',30),ctx.sr.entities.ACAVerificationResult.filter({computer_id:ctx.c.id},'-created_date',200)]);
    return Response.json({files,artifacts,notes,skills,verifications});
  } catch(e) {return Response.json({error:e.code || 'INTERNAL_ERROR',message:e.code ? e.message : 'Workspace operation failed'}, {status:['FORBIDDEN','UNAUTHORIZED'].includes(e.code)?403:400});}
}