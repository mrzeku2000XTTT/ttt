import { fail } from './contracts.ts';
import { readFile } from './workspace.ts';
import { jobs } from './evolveReadAdapter.ts';
export async function resource(ctx, address) {
  if (typeof address !== 'string' || address.length > 200) fail('INVALID_RESOURCE');
  if (address === 'aca://home') return {title:'ACA workspace',text:'Internal resources only. Use aca://file/workspace/inventory.csv or aca://jobs. General internet unavailable.'};
  if (address === 'aca://jobs') return {title:'EVOLVE Jobs (read-only)',text:JSON.stringify(await jobs(ctx),null,2)};
  if (address.startsWith('aca://file/')) { const r = await readFile(ctx,{path:'/' + address.slice(11)}); return {title:r.file.path,text:r.text,revision_id:r.revision.id,file_id:r.file.id}; }
  fail('RESOURCE_UNAVAILABLE','Only approved ACA internal resources are available');
}