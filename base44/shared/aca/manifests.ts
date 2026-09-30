const definitions = [
  ['browser','Browser',['NAVIGATE','OPEN_RESOURCE'],['GENERAL INTERNET UNAVAILABLE']],
  ['files','Files',['LIST_FILES','OPEN_FILE','CREATE_FILE','COPY_FILE','MOVE_FILE','DELETE_FILE','MKDIR'],[]],
  ['editor','Editor',['OPEN_FILE','EDIT_FILE','SAVE_FILE','SAVE_AS','CREATE_FILE'],[]],
  ['data','Data',['OPEN_FILE','DATA_TRANSFORM','EXPORT_DATA'],[]],
  ['code','Code',['OPEN_FILE','EDIT_FILE','SAVE_FILE','SAVE_AS','CREATE_FILE'],['RUN UNAVAILABLE']],
  ['terminal','Terminal',['TERMINAL'],['ARBITRARY SHELL UNAVAILABLE']],
  ['research','Research',['SEARCH_WORKSPACE','SAVE_NOTE'],['EXTERNAL SEARCH UNAVAILABLE']],
  ['documents','Documents',['OPEN_FILE','CREATE_FILE','EDIT_FILE','SAVE_FILE','SAVE_AS'],['PDF / DOCX UNAVAILABLE']],
  ['artifacts','Artifacts',['CREATE_ARTIFACT','OPEN_ARTIFACT'],[]],
  ['jobs','Jobs',['LIST_JOBS','OPEN_JOB'],['CLAIM / SUBMIT UNAVAILABLE']],
  ['tools','Tools',[],['NO TOOL NETWORK CONNECTED']],
  ['wallet','Wallet',['READ_WALLET'],['PAYMENTS / TRANSFERS UNAVAILABLE']],
  ['memory','Memory',['SAVE_NOTE'],['SKILL LEARNING UNAVAILABLE']],
  ['activity','Activity',['READ_HISTORY'],[]],
];
export const APPS = definitions.map(([id,name,capabilities,limitations]) => ({ app_id: 'aca.' + id, name, version:'0.1.0', capabilities, permissions:['AGENT_WORKSPACE','ADMIN_CONTROL'], enabled:true, limitations }));
export function appOf(id) { return APPS.find(app => app.app_id === id); }
export const SKILLS = [
  {skill_id:'BASIC_FILE_MANAGEMENT',name:'Basic File Management',description:'Open, inspect, edit and save scoped workspace files.',required_capabilities:['OPEN_FILE','SAVE_FILE']},
  {skill_id:'CSV_INSPECTION',name:'CSV Inspection',description:'Inspect actual columns and rows before transforming.',required_capabilities:['OPEN_FILE']},
  {skill_id:'CSV_CLEANING',name:'CSV Cleaning',description:'Keep first valid SKU; normalize whitespace, SKU/category case and prices; verify preserved records.',required_capabilities:['DATA_TRANSFORM']},
];