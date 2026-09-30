import { fail, pathOf, textOf, MAX_BYTES, ROOTS } from './contracts.ts';
import { assertScope } from './authorization.ts';
export async function hashBytes(bytes) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(b => b.toString(16).padStart(2,'0')).join(''); }
export async function entries(ctx) {
  const list = await ctx.sr.entities.ACAWorkspaceEntry.filter({computer_id:ctx.c.id,deleted:false},'path',501);
  if (list.length > 500) fail('ENTRY_LIMIT');
  const revisions = await ctx.sr.entities.ACAFileRevision.filter({computer_id:ctx.c.id},'-created_date',2000);
  const byId = new Map(revisions.map(r => [r.id,r]));
  return list.map(e => ({...e, revision:publicRevision(byId.get(e.revision_id))}));
}
export function publicRevision(r) { if (!r) return null; const {storage_reference, ...safe} = r; return safe; }
export async function entry(ctx, args) {
  const e = args.file_id ? await ctx.sr.entities.ACAWorkspaceEntry.get(args.file_id) : (await ctx.sr.entities.ACAWorkspaceEntry.filter({computer_id:ctx.c.id,path:pathOf(args.path),deleted:false},'created_date',1))[0];
  assertScope(e, ctx.c); if ((e.deleted && !args.revision_id) || e.kind !== 'FILE') fail('FILE_NOT_FOUND'); return e;
}
export async function readFile(ctx, args) {
  const e = await entry(ctx,args);
  const r = assertScope(await ctx.sr.entities.ACAFileRevision.get(args.revision_id || e.revision_id),ctx.c);
  if (r.file_id !== e.id || r.size_bytes > MAX_BYTES) fail('REVISION_FORBIDDEN');
  const {signed_url} = await ctx.sr.integrations.Core.CreateFileSignedUrl({file_uri:r.storage_reference,expires_in:60});
  const response = await fetch(signed_url); if (!response.ok) fail('FILE_READ_FAILED');
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length !== r.size_bytes || await hashBytes(bytes) !== r.sha256) fail('HASH_MISMATCH');
  const text = new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  return {file:e, revision:publicRevision(r), text};
}
export async function writeFile(ctx, path, text, executionId, expectedRevision, draft = false) {
  path = pathOf(path); textOf(text); const filename = path.split('/').pop();
  if (!/\.(csv|json|txt|md|js|ts|jsx|tsx|py|css|yaml|yml)$/.test(filename)) fail('UNSUPPORTED_FORMAT');
  const parent = path.slice(0,path.lastIndexOf('/'));
  const dir = (await ctx.sr.entities.ACAWorkspaceEntry.filter({computer_id:ctx.c.id,path:parent,kind:'DIRECTORY',deleted:false},'created_date',1))[0];
  if (!dir) fail('DIRECTORY_NOT_FOUND');
  let e = (await ctx.sr.entities.ACAWorkspaceEntry.filter({computer_id:ctx.c.id,path,deleted:false},'created_date',1))[0];
  if (e && e.kind !== 'FILE') fail('PATH_CONFLICT');
  if (e && expectedRevision !== e.revision_id) fail('REVISION_CONFLICT','Reopen the file before saving');
  const list = await entries(ctx);
  const bytes = new TextEncoder().encode(text);
  const revisions = await ctx.sr.entities.ACAFileRevision.filter({computer_id:ctx.c.id},'-created_date',2001);
  if (revisions.length >= 2000 || revisions.reduce((n,r) => n + r.size_bytes,0) + bytes.length > ctx.c.storage_limit || list.length >= 500) fail('STORAGE_LIMIT');
  const mime = filename.endsWith('.csv') ? 'text/csv' : filename.endsWith('.json') ? 'application/json' : 'text/plain';
  const {file_uri} = await ctx.sr.integrations.Core.UploadPrivateFile({file:new File([bytes],filename,{type:mime})});
  if (!file_uri) fail('UPLOAD_FAILED');
  if (!e) e = await ctx.sr.entities.ACAWorkspaceEntry.create({computer_id:ctx.c.id,agent_id:ctx.c.agent_id,path,kind:'FILE',deleted:false});
  const r = await ctx.sr.entities.ACAFileRevision.create({computer_id:ctx.c.id,agent_id:ctx.c.agent_id,file_id:e.id,storage_reference:file_uri,size_bytes:bytes.length,sha256:await hashBytes(bytes),mime_type:mime,filename,previous_revision_id:e.revision_id || '',execution_id:executionId});
  if (!draft) e = await ctx.sr.entities.ACAWorkspaceEntry.update(e.id,{revision_id:r.id});
  return {file:e, revision:publicRevision(r)};
}
export async function mkdir(ctx, path) {
  path = pathOf(path); const prior = (await ctx.sr.entities.ACAWorkspaceEntry.filter({computer_id:ctx.c.id,path,deleted:false},'created_date',1))[0];
  if (prior) { if (prior.kind !== 'DIRECTORY') fail('PATH_CONFLICT'); return prior; }
  const parent = path.slice(0,path.lastIndexOf('/')) || '/';
  if (parent !== '/' && !(await ctx.sr.entities.ACAWorkspaceEntry.filter({computer_id:ctx.c.id,path:parent,kind:'DIRECTORY',deleted:false},'created_date',1))[0]) fail('DIRECTORY_NOT_FOUND');
  return ctx.sr.entities.ACAWorkspaceEntry.create({computer_id:ctx.c.id,agent_id:ctx.c.agent_id,path,kind:'DIRECTORY',deleted:false});
}
export async function initFolders(ctx) { for (const root of ROOTS) await mkdir(ctx,'/' + root); }