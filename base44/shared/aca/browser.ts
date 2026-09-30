import {fail} from './contracts.ts';
import {resource} from './resources.ts';
import {writeFile,readFile} from './workspace.ts';
export async function navigate(ctx,view,a,executionId) {
  const tabs=[...(view.browserTabs || [])],id=a.tab_id || crypto.randomUUID(),i=tabs.findIndex(t=>t.id===id),old=tabs[i];
  if(i<0 && tabs.length>=8)fail('TAB_LIMIT');
  const r=await resource(ctx,a.address);
  const saved=await writeFile(ctx,`/downloads/resource_${executionId}.txt`,r.text,executionId);
  const snapshot={file_id:saved.file.id,revision_id:saved.revision.id,title:r.title};
  const history=[...(old?.history || []).slice(0,(old?.position ?? -1)+1),a.address];
  const snapshots=[...(old?.snapshots || []).slice(0,(old?.position ?? -1)+1),snapshot];
  const tab={id,address:a.address,history,snapshots,position:history.length-1,snapshot};
  if(i<0)tabs.push(tab);else tabs[i]=tab;
  return {tabs,tabId:id,result:{address:a.address,title:r.title,snapshot}};
}
export async function browserHistory(ctx,view,a,executionId) {
  if(!['back','forward','reload'].includes(a.direction))fail('INVALID_DIRECTION');
  const tabs=[...(view.browserTabs || [])],i=tabs.findIndex(t=>t.id===a.tab_id);if(i<0)fail('TAB_NOT_FOUND');
  const old=tabs[i],position=old.position+(a.direction==='reload'?0:a.direction==='back'?-1:1);
  if(position<0 || position>=old.history.length)fail('HISTORY_BOUNDARY');
  let snapshot=old.snapshots[position];
  if(a.direction==='reload'){
    const r=await resource(ctx,old.history[position]);const saved=await writeFile(ctx,`/downloads/resource_${executionId}.txt`,r.text,executionId);
    snapshot={file_id:saved.file.id,revision_id:saved.revision.id,title:r.title};
  }else await readFile(ctx,snapshot);
  const snapshots=[...old.snapshots];snapshots[position]=snapshot;
  tabs[i]={...old,position,address:old.history[position],snapshot,snapshots};
  return {tabs,tabId:old.id,result:{address:tabs[i].address,snapshot}};
}