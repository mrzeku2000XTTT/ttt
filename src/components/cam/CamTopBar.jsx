import React from 'react';
import { Download, FolderOpen, Layers3, Store, Upload, Boxes } from 'lucide-react';
import { shortKaspaAddress } from '@/lib/useKcc20Wallet';

export default function CamTopBar({ logo, address, onHome, onUpload, onDownload, onExit, canExport, fusionOn, onToggleFusion }) {
  const goPanel = (id) => {
    if (fusionOn) onToggleFusion();
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }));
  };
  return (
    <>
      <header className="cm-fusion-head">
        <button onClick={onHome} className="cm-brand"><img src={logo} alt="CAM" /><strong>C<span>AM</span></strong></button>
        <nav>
          <button onClick={onUpload}><FolderOpen /> Media Pool</button>
          <button onClick={() => goPanel('cam-inspector')}><Layers3 /> Effects</button>
          <button onClick={() => goPanel('cam-clips')}>Clips</button>
          <button onClick={() => goPanel('cam-nodes')}>Nodes</button>
          <button onClick={onToggleFusion} className={fusionOn ? 'active' : ''}><Boxes /> Fusion</button>
        </nav>
        <div className="cm-head-actions"><span>{shortKaspaAddress(address)}</span><button onClick={onUpload}><Upload /> Upload</button><button onClick={onDownload} disabled={!canExport}><Download /> Export</button><button onClick={onExit}><Store /> Exit</button></div>
      </header>
      <div className="cm-menu-row"><span>File</span><span>Edit</span><span>View</span><span>Playback</span><span>Fusion</span><span>Workspace</span><b>{fusionOn ? 'CAM 3D / Fusion' : 'CAM 3D / Edited'}</b></div>
    </>
  );
}