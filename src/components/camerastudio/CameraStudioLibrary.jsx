import React, { useEffect, useMemo } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
export default function CameraStudioLibrary({ assets, selected, select, remove, close, add }) {
  const items = useMemo(() => assets.map(asset => ({ ...asset, url: URL.createObjectURL(asset.file) })), [assets]);
  useEffect(() => () => items.forEach(item => URL.revokeObjectURL(item.url)), [items]);
  return <aside className="camera-library" aria-label="Media library">
    <header><strong>Project / Visual layers</strong><button onClick={close} aria-label="Close library"><X size={16}/></button></header>
    <p>Every item is a visual layer. Select it, then drag or resize it directly on the canvas.</p>
    <div className="camera-library-grid">{items.map(item => <div className="camera-asset" key={item.id}>
      <button onClick={() => select(item.id)} aria-pressed={selected === item.id} title={item.name}>
        {item.file.type.startsWith('video/') ? <video src={item.url} muted playsInline preload="metadata"/> : <img src={item.url} alt={item.name}/>}
        <span>{item.name}</span>
      </button><button className="camera-asset-delete" onClick={() => remove(item.id)} aria-label={`Remove ${item.name}`}><Trash2 size={12}/></button>
    </div>)}</div>
    {!items.length && <p>Your media library is empty.</p>}
    <button className="camera-pill" onClick={add}><Plus size={14}/>Upload media</button>
    <p className="camera-library-note">Saved on this device only. No uploads to external services.</p>
  </aside>;
}