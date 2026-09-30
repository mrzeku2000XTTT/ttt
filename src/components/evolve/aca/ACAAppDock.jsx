import React from 'react';
import {Folder,FileText,Table,Code,Terminal,Search,BookOpen,Package,Briefcase,Network,Wallet,Brain,Activity,Globe} from 'lucide-react';
const icons={files:Folder,editor:FileText,data:Table,code:Code,terminal:Terminal,research:Search,documents:BookOpen,artifacts:Package,jobs:Briefcase,tools:Network,wallet:Wallet,memory:Brain,activity:Activity,browser:Globe};
export default function ACAAppDock({aca}) {
  return <nav className="aca-dock">{aca.apps.map(app=>{const Icon=icons[app.app_id.split('.')[1]];return <button key={app.app_id} data-aca-target={'app:'+app.app_id} className={'aca-btn '+(aca.view.activeApp===app.app_id?'aca-cyan':'')} disabled={aca.disabled || !aca.computer?.current_session_id} onClick={()=>aca.action('OPEN_APP',{app_id:app.app_id})}><Icon size={14}/><span>{app.name.toUpperCase()}</span></button>;})}</nav>;
}