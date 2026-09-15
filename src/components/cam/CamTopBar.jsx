import React from 'react';
import { Download, Eye, EyeOff, Film, Plus, Store, Upload } from 'lucide-react';
import { shortKaspaAddress } from '@/lib/useKcc20Wallet';

export default function CamTopBar({ logo, address, onHome, onUpload, onDownload, onExportVideo, videoExport, onExit, canExport, fusionOn, onToggleFusion, uiHidden, onToggleUi, mode, onModePick, canSeq }) {
  const goPanel = (id) => {
    if (fusionOn) onToggleFusion();
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }));
  };
  return (
    <>
      <header className="cm-fusion-head">
        <div className="cm-head-left">
          <button onClick={onHome} className="cm-head-ghost" title="Back to landing"><Store /> Store</button>
          <button onClick={onToggleUi} className="cm-head-ghost" title={uiHidden ? 'Show editor controls' : 'Hide UI'}>{uiHidden ? <EyeOff /> : <Eye />}<span>{uiHidden ? 'Show UI' : 'Hide UI'}</span></button>
        </div>
        <div className="cm-head-title"><img src={logo} alt="CAM" /><strong>Camera Studio</strong></div>
        <div className="cm-head-actions">
          <button onClick={onUpload}><Upload /> Media</button>
          <button onClick={onDownload} disabled={!canExport}><Download /> Export</button>
          {onExportVideo && <button onClick={onExportVideo} disabled={!canExport || videoExport != null} className={videoExport != null ? 'active' : ''}><Film /> {videoExport != null ? `MP4 ${Math.round(videoExport * 100)}%` : 'Export MP4'}</button>}
          <button onClick={onExit}><Store /> Exit to Store</button>
        </div>
      </header>
      <div className="cm-menu-row">
        <button onClick={onUpload} className="cm-tool-add"><Plus /> Add media</button>
        <button onClick={() => goPanel('cam-inspector')}>Effects</button>
        <button onClick={() => goPanel('cam-clips')}>Clips</button>
        <button onClick={() => goPanel('cam-nodes')}>Nodes</button>
        <button onClick={onToggleFusion} className={fusionOn ? 'active' : ''}>Fusion</button>
        <div className="cm-mode-pill">
          <button className={mode !== 'seq' ? 'active' : ''} onClick={() => mode !== 'seq' && onModePick?.('move')}>Move</button>
          <button className={mode === 'seq' ? 'active' : ''} disabled={!canSeq} onClick={() => (mode === 'seq' ? onModePick?.('move') : onModePick?.('seq'))}>Sequence</button>
        </div>
        <b>{shortKaspaAddress(address)} · Local workspace — saved on device</b>
      </div>
    </>
  );
}