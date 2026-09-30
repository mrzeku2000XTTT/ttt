import {fail} from './contracts.ts';
const COMMON=['app_id'];
const FILE=['file_id','path','revision_id',...COMMON];
export const FIELDS={
  START_SESSION:[],END_SESSION:[],OPEN_APP:COMMON,CLOSE_APP:COMMON,CREATE_FIXTURE:[],
  OPEN_FILE:FILE,CREATE_FILE:['path','text',...COMMON],SAVE_AS:['path','text',...COMMON],
  EDIT_FILE:['file_id','text','expected_revision_id',...COMMON],SAVE_FILE:['file_id','text','expected_revision_id',...COMMON],
  DATA_TRANSFORM:[...FILE,'output_path','expected_output_revision_id'],
  EXPORT_DATA:[...FILE,'output_path','search','sort_column','descending','filter_column','filter_value'],
  CREATE_ARTIFACT:FILE,OPEN_ARTIFACT:['artifact_id',...COMMON],TERMINAL:['command',...COMMON],
  NAVIGATE:['address','tab_id',...COMMON],OPEN_RESOURCE:['address','tab_id',...COMMON],BROWSER_HISTORY:['direction','tab_id',...COMMON],
  SAVE_NOTE:['title','text',...COMMON],SEARCH_WORKSPACE:['query',...COMMON],MKDIR:['path',...COMMON],
  COPY_FILE:[...FILE,'destination'],MOVE_FILE:[...FILE,'destination'],DELETE_FILE:FILE,
  OPEN_JOB:['job_id',...COMMON],READ_WALLET:COMMON,INSPECT_TOOLS:COMMON,LIST_FILES:COMMON,LIST_JOBS:COMMON,READ_HISTORY:COMMON,
};
export function validateAction(type,args) {
  const fields=FIELDS[type]; if(!fields)fail('ACTION_UNAVAILABLE');
  for(const [key,value] of Object.entries(args)){
    if(!fields.includes(key))fail('INVALID_INPUT','Unsupported parameter: '+key);
    if(key==='descending'){if(typeof value!=='boolean')fail('INVALID_INPUT');}
    else if(typeof value!=='string')fail('INVALID_INPUT','Expected text parameter: '+key);
  }
}