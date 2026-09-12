import React from 'react';
import Cam3DView from './Cam3DView';

export default function CamViewerDeck({ canvasRef, image, getFrame, label, onUpload, onFile }) {
  return (
    <div className="cm-view-deck" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}>
      <section className="cm-viewer"><div className="cm-viewer-title"><span>MediaIn1</span><span>2D Preview</span></div>
        <div className="cm-viewer-body"><canvas ref={canvasRef} width="1280" height="720" />{!image && <button onClick={onUpload} className="cm-empty-view">Drop, paste, or upload an image</button>}</div>
      </section>
      <section className="cm-viewer"><div className="cm-viewer-title"><span>Camera3D1</span><span>Perspective</span></div>
        <div className="cm-viewer-body"><Cam3DView image={image} getFrame={getFrame} label={label} /></div>
      </section>
    </div>
  );
}