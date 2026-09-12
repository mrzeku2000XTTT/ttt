import React, { useState } from 'react';
import { Cable, Plus, Trash2 } from 'lucide-react';

const TYPES = ['MediaIn', 'Transform', 'Camera3D', 'Renderer3D', 'MediaOut'];
export default function CamNodeToolbar({ onAdd, onDelete, onConnect, connecting }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="cm-node-toolbar">
      <div className="relative"><button onClick={() => setOpen((v) => !v)} title="Add node"><Plus /> Add Node</button>
        {open && <div className="cm-node-menu">{TYPES.map((type) => <button key={type} onClick={() => { onAdd(type); setOpen(false); }}>{type}</button>)}</div>}
      </div>
      <button onClick={onConnect} className={connecting ? 'is-active' : ''} title={connecting ? 'Choose an input port' : 'Connect selected node'}><Cable /> {connecting ? 'Choose input' : 'Connect'}</button>
      <button onClick={onDelete} title="Delete selected node"><Trash2 /> Delete</button>
    </div>
  );
}