import React, { useEffect, useState } from 'react';
import { Type } from 'lucide-react';

export default function CamTextTools({ selected, onAdd, onEdit }) {
  const [text,setText]=useState('');
  useEffect(()=>{setText(selected?.kind==='text'?selected.text:'');},[selected?.id,selected?.text]);
  const editing=selected?.kind==='text';
  return <form className="cm-text-tools" onSubmit={e=>{e.preventDefault();if(!text.trim())return;editing?onEdit(selected.id,text):onAdd(text);}}>
    <Type size={16}/><input aria-label="Text layer content" maxLength={500} placeholder="Type a heading or title…" value={text} onChange={e=>setText(e.target.value)}/>
    <button disabled={!text.trim()}>{editing?'Update text':'Add text'}</button>
    {editing&&<button type="button" disabled={!text.trim()} onClick={()=>onAdd(text)}>New layer</button>}
  </form>;
}