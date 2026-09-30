import { fail, pathOf } from './contracts.ts';
import { entries, readFile, mkdir, entry, writeFile } from './workspace.ts';
export async function terminal(ctx, command, executionId) {
  if (typeof command !== 'string' || command.length > 300 || /[;&|`$<>\\\n\r]/.test(command)) fail('COMMAND_FORBIDDEN');
  const [cmd,...args] = command.trim().split(/\s+/);
  if (!['pwd','ls','cat','head','wc','find','mkdir','cp','mv'].includes(cmd)) fail('COMMAND_FORBIDDEN');
  if (args.some(a => a.startsWith('-'))) fail('COMMAND_FORBIDDEN','Flags are not supported');
  if (cmd === 'pwd') { if (args.length) fail('INVALID_COMMAND'); return {text:'/workspace'}; }
  if (['ls','find'].includes(cmd)) {
    if (args.length > 1) fail('INVALID_COMMAND'); const path = pathOf(args[0] || '/workspace',true);
    const list = (await entries(ctx)).filter(e => path === '/' || e.path.startsWith(path + '/'));
    return {text:list.filter(e => cmd === 'find' || e.path.slice(path === '/' ? 1 : path.length+1).indexOf('/') < 0).map(e => e.path + (e.kind === 'DIRECTORY' ? '/' : '')).join('\n')};
  }
  if (['cat','head','wc'].includes(cmd)) {
    if (args.length !== 1) fail('INVALID_COMMAND'); const file = await readFile(ctx,{path:pathOf(args[0])});
    return {text:cmd === 'cat' ? file.text : cmd === 'head' ? file.text.split('\n').slice(0,10).join('\n') : `${file.text.split('\n').length - (file.text.endsWith('\n') ? 1 : 0)} lines · ${file.revision.size_bytes} bytes`, revision_id:file.revision.id};
  }
  if (cmd === 'mkdir') { if (args.length !== 1) fail('INVALID_COMMAND'); await mkdir(ctx,pathOf(args[0])); return {text:'Directory created: ' + args[0]}; }
  if (args.length !== 2) fail('INVALID_COMMAND'); const source = await readFile(ctx,{path:pathOf(args[0])}); const dest = pathOf(args[1]);
  if (cmd === 'cp') { const result = await writeFile(ctx,dest,source.text,executionId); return {text:'Copied to ' + dest,...result}; }
  if ((await entries(ctx)).some(e => e.path === dest)) fail('PATH_CONFLICT');
  const parent = dest.slice(0,dest.lastIndexOf('/')); if (!(await entries(ctx)).some(e => e.path === parent && e.kind === 'DIRECTORY')) fail('DIRECTORY_NOT_FOUND');
  await ctx.sr.entities.ACAWorkspaceEntry.update(source.file.id,{path:dest}); return {text:'Moved to ' + dest};
}