import { fail, iso, pathOf, textOf } from './contracts.ts';
import { readFile, writeFile, entries, entry, mkdir } from './workspace.ts';
import { assertScope, find } from './authorization.ts';
import { appOf } from './manifests.ts';
import { inventoryFixture } from './demoFixture.ts';
import { cleanInventory } from './dataTransforms.ts';
import { verifyInventory } from './verification.ts';
import { parseTable, csvText } from './csv.ts';
import { terminal } from './terminal.ts';
import { resource } from './resources.ts';
import { jobs, wallet } from './evolveReadAdapter.ts';
import { toolNetwork } from './toolNetworkAdapter.ts';
import {navigate,browserHistory} from './browser.ts';
export async function operate(ctx, action, a, ex) {
  const view = {...(ctx.c.view_state || {}),windows:[...(ctx.c.view_state?.windows || [])]};
  const activate = id => { if (!appOf(id) || !ctx.c.installed_app_ids.includes(id)) fail('APP_UNAVAILABLE'); view.activeApp = id; if (!view.windows.includes(id)) view.windows.push(id); };
  const opened = async (args, app) => { const r = await readFile(ctx,args); activate(app || (/\.(csv|json)$/.test(r.file.path) ? 'aca.data' : 'aca.editor')); view.fileId = r.file.id; view.revisionId = r.revision.id; view.draftRevisionId = ''; view.path = r.file.path; return r; };
  let result = {}, target = 'app:' + (a.app_id || view.activeApp || 'aca.files');
  if (action === 'OPEN_APP') { activate(a.app_id); result = {app_id:a.app_id}; if(a.app_id==='aca.wallet') {view.walletSnapshot=await wallet(ctx);result.wallet=view.walletSnapshot;} if(a.app_id==='aca.jobs') {view.jobsSnapshot=await jobs(ctx);} }
  else if (action === 'CLOSE_APP') { view.windows = view.windows.filter(id => id !== a.app_id); view.activeApp = view.windows.at(-1) || ''; }
  else if (action === 'OPEN_FILE') { const r = await opened(a,a.app_id); result = {file_id:r.file.id,revision_id:r.revision.id,path:r.file.path,size_bytes:r.revision.size_bytes,sha256:r.revision.sha256}; if (/\.(csv|json)$/.test(r.file.path)) result.row_count = parseTable(r.text,r.file.path).rows.length; target = 'file:' + r.file.id; }
  else if (['CREATE_FILE','SAVE_FILE','SAVE_AS','EDIT_FILE','CREATE_FIXTURE'].includes(action)) {
    let path = a.path, text = a.text, expected = a.expected_revision_id;
    if (action === 'CREATE_FIXTURE') { path = '/workspace/inventory.csv'; text = inventoryFixture(); }
    if (['SAVE_FILE','EDIT_FILE'].includes(action)) { const old = await entry(ctx,a); path = old.path; if (expected !== old.revision_id) fail('REVISION_CONFLICT'); }
    const r = await writeFile(ctx,path,text,ex.id,expected,action === 'EDIT_FILE');
    activate(action === 'CREATE_FIXTURE' ? 'aca.files' : (a.app_id || 'aca.editor'));
    view.fileId = r.file.id; view.path = r.file.path; view.revisionId = action === 'EDIT_FILE' ? r.file.revision_id : r.revision.id; view.draftRevisionId = action === 'EDIT_FILE' ? r.revision.id : '';
    result = {file_id:r.file.id,revision_id:r.revision.id,path:r.file.path,size_bytes:r.revision.size_bytes,sha256:r.revision.sha256,draft:action === 'EDIT_FILE'};
    if (action === 'CREATE_FIXTURE') result.row_count = parseTable(text,path).rows.length;
    target = action === 'SAVE_FILE' ? 'control:save' : 'file:' + r.file.id;
  }
  else if (action === 'DATA_TRANSFORM') {
    const input = await readFile(ctx,a); const cleaned = cleanInventory(input.text,input.file.path);
    const output = await writeFile(ctx,a.output_path || '/workspace/cleaned_inventory.csv',cleaned.text,ex.id,a.expected_output_revision_id);
    const reread = await readFile(ctx,{file_id:output.file.id,revision_id:output.revision.id});
    const verified = verifyInventory(input.text,input.file.path,reread.text);
    const verification = await ctx.sr.entities.ACAVerificationResult.create({computer_id:ctx.c.id,agent_id:ctx.c.agent_id,session_id:ctx.session.id,execution_id:ex.id,input_revision_id:input.revision.id,output_revision_id:output.revision.id,output_sha256:reread.revision.sha256,status:verified.status,checks:verified.checks,summary:cleaned.summary});
    if (verified.status !== 'PASS') fail('VERIFICATION_FAILED');
    activate('aca.data'); view.fileId = output.file.id; view.revisionId = output.revision.id; view.path = output.file.path; view.verificationId = verification.id; view.summary = cleaned.summary; view.sourceRevisionId = input.revision.id;
    result = {input_file_id:input.file.id,input_revision_id:input.revision.id,output_file_id:output.file.id,output_revision_id:output.revision.id,path:output.file.path,sha256:output.revision.sha256,size_bytes:output.revision.size_bytes,verification_id:verification.id,verification:verified.status,summary:cleaned.summary}; target = 'control:transform';
  }
  else if (action === 'EXPORT_DATA') {
    const input = await readFile(ctx,a); const table = parseTable(input.text,input.file.path);
    let rows = table.rows;
    if (a.search) rows = rows.filter(r => r.some(v => v.toLowerCase().includes(String(a.search).toLowerCase())));
    if (a.sort_column) { const i = table.columns.indexOf(a.sort_column); if (i < 0) fail('INVALID_COLUMN'); rows = [...rows].sort((x,y)=>x[i].localeCompare(y[i]) * (a.descending ? -1 : 1)); }
    if (a.filter_column) { const i = table.columns.indexOf(a.filter_column); if (i < 0) fail('INVALID_COLUMN'); rows = rows.filter(r => r[i] === a.filter_value); }
    const r = await writeFile(ctx,a.output_path,csvText(table.columns,rows),ex.id);
    result = {file_id:r.file.id,revision_id:r.revision.id,row_count:rows.length,sha256:r.revision.sha256,path:r.file.path};
  }
  else if (action === 'CREATE_ARTIFACT' || action === 'OPEN_ARTIFACT') {
    let artifact;
    if (action === 'OPEN_ARTIFACT') { artifact = await find(ctx.sr,'AgentArtifact',a.artifact_id,'ARTIFACT_NOT_FOUND'); assertScope(artifact,ctx.c,'ARTIFACT_NOT_FOUND'); }
    else { const file = await readFile(ctx,a); const previous = (await ctx.sr.entities.AgentArtifact.filter({computer_id:ctx.c.id,revision_id:file.revision.id},'created_date',1))[0]; artifact = previous || await ctx.sr.entities.AgentArtifact.create({computer_id:ctx.c.id,agent_id:ctx.c.agent_id,session_id:ctx.session.id,execution_id:ex.id,file_id:file.file.id,revision_id:file.revision.id,filename:file.revision.filename,mime_type:file.revision.mime_type,type:file.file.path.endsWith('.csv') ? 'CSV' : file.file.path.endsWith('.json') ? 'JSON' : file.file.path.endsWith('.md') ? 'REPORT' : /\.(js|ts|jsx|tsx|py)$/.test(file.file.path) ? 'CODE' : 'TEXT',size_bytes:file.revision.size_bytes,sha256:file.revision.sha256,metadata:{verification_id:view.verificationId || ''}}); }
    await opened({file_id:artifact.file_id,revision_id:artifact.revision_id},'aca.artifacts'); view.artifactId = artifact.id; result = {artifact_id:artifact.id,file_id:artifact.file_id,revision_id:artifact.revision_id,sha256:artifact.sha256}; target = 'artifact:' + artifact.id;
  }
  else if (action === 'TERMINAL') { result = await terminal(ctx,a.command,ex.id); activate('aca.terminal'); view.terminal = {command:a.command,result:result.text}; target = 'control:terminal'; }
  else if (['NAVIGATE','OPEN_RESOURCE','BROWSER_HISTORY'].includes(action)) {
    const nav=action!=='BROWSER_HISTORY' ? await navigate(ctx,view,a,ex.id) : await browserHistory(ctx,view,a,ex.id);
    activate('aca.browser');view.browserTabs=nav.tabs;view.browserTabId=nav.tabId;result=nav.result;target='control:address';
  }
  else if (action === 'SAVE_NOTE') { textOf(a.text,4000); textOf(a.title,120); result = await ctx.sr.entities.ACAMemoryEntry.create({computer_id:ctx.c.id,agent_id:ctx.c.agent_id,session_id:ctx.session.id,kind:'TASK_NOTE',title:a.title,text:a.text,source_execution_id:ex.id}); activate(a.app_id || 'aca.memory'); }
  else if (action === 'SEARCH_WORKSPACE') { textOf(a.query,100); const list = (await entries(ctx)).filter(e=>e.kind==='FILE'); const hits=[]; for(const file of list.slice(0,50)) {const r=await readFile(ctx,{file_id:file.id}); const lines=r.text.split('\n'); lines.forEach((line,i)=>{if(hits.length<100 && line.toLowerCase().includes(a.query.toLowerCase())) hits.push({file_id:file.id,revision_id:r.revision.id,path:file.path,line:i+1,excerpt:line.slice(0,240)});});} result={hits,searched_files:Math.min(50,list.length),truncated:list.length>50}; activate('aca.research'); view.research=result; }
  else if (action === 'MKDIR') { result=await mkdir(ctx,a.path); activate('aca.files'); }
  else if (['COPY_FILE','MOVE_FILE','DELETE_FILE'].includes(action)) { const source=await readFile(ctx,a); if(action==='DELETE_FILE') await ctx.sr.entities.ACAWorkspaceEntry.update(source.file.id,{deleted:true}); else if(action==='COPY_FILE') {const r=await writeFile(ctx,a.destination,source.text,ex.id); result={file_id:r.file.id,revision_id:r.revision.id};} else {const dest=pathOf(a.destination); if((await entries(ctx)).some(e=>e.path===dest)) fail('PATH_CONFLICT'); const parent=dest.slice(0,dest.lastIndexOf('/')); if(!(await entries(ctx)).some(e=>e.path===parent && e.kind==='DIRECTORY')) fail('DIRECTORY_NOT_FOUND'); await ctx.sr.entities.ACAWorkspaceEntry.update(source.file.id,{path:dest}); result={path:dest};} activate('aca.files'); }
  else if (action === 'OPEN_JOB') { const job=(await jobs(ctx)).find(j=>j.id===a.job_id); if(!job) fail('JOB_NOT_FOUND'); activate('aca.jobs'); view.jobId=job.id; result={job_id:job.id,code:job.code}; }
  else if (action === 'LIST_FILES') { result={files:await entries(ctx)}; activate('aca.files'); }
  else if (action === 'LIST_JOBS') { view.jobsSnapshot=await jobs(ctx); result={count:view.jobsSnapshot.length}; activate('aca.jobs'); }
  else if (action === 'READ_HISTORY') { result={session_id:ctx.session.id,events_count:ctx.session.events_count}; activate('aca.activity'); }
  else if (action === 'READ_WALLET') { result=await wallet(ctx); view.walletSnapshot=result; activate('aca.wallet'); }
  else if (action === 'INSPECT_TOOLS') { result=toolNetwork(); activate('aca.tools'); }
  else fail('ACTION_UNAVAILABLE','This capability is not enabled in ACA V0.1');
  return {view,result,target};
}