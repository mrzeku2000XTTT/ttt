import React from 'react';
import { Download, FolderOpen, Layers3, Store, Upload } from 'lucide-react';
import { shortKaspaAddress } from '@/lib/useKcc20Wallet';

export default function CamTopBar({ logo, address, onHome, onUpload, onDownload, onExit, canExport }) {
  return (
    <>
      <header className="cm-fusion-head">
        <button onClick={onHome} className="cm-brand"><img src={logo} alt="CAM" /><strong>C<span>AM</span></strong></button>
        <nav><button onClick={onUpload}><FolderOpen /> Media Pool</button><button onClick={() => document.getElementById('cam-inspector')?.scrollIntoView({ behavior: 'smooth' })}><Layers3 /> Effects</button><button onClick={() => document.getElementById('cam-clips')?.scrollIntoView({ behavior: 'smooth' })}>Clips</button><button onClick={() => document.getElementById('cam-nodes')?.scrollIntoView({ behavior: 'smooth' })} className="active">Nodes</button></nav>
        <div className="cm-head-actions"><span>{shortKaspaAddress(address)}</span><button onClick={onUpload}><Upload /> Upload</button><button onClick={onDownload} disabled={!canExport}><Download /> Export</button><button onClick={onExit}><Store /> Exit</button></div>
      </header>
      <div className="cm-menu-row"><span>File</span><span>Edit</span><span>View</span><span>Playback</span><span>Fusion</span><span>Workspace</span><b>CAM 3D / Edited</b></div>
    </>
  );
}