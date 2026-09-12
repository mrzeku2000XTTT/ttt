import React, { useRef } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import Cam3DView from './Cam3DView';

export default function CamViewerDeck({ canvasRef, image, getFrame, label, onUpload, onFile, split, onSplit, max, onMax, media, manualOffset, camRig, onSelectAsset, refId, onOffset, onMoveAsset, onBeginAssetMove }) {
  const deck = useRef(null);
  const dragging = useRef(false);
  const startDrag = (e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); };
  const moveDrag = (e) => {
    if (!dragging.current || !deck.current) return;
    const r = deck.current.getBoundingClientRect();
    onSplit(Math.min(82, Math.max(18, ((e.clientX - r.left) / r.width) * 100)));
  };
  const endDrag = () => { dragging.current = false; };
  const maxBtn = (pane) => (
    <button onClick={() => onMax(max === pane ? null : pane)} title={max === pane ? 'Restore split view' : 'Fullscreen this viewer'}>
      {max === pane ? <Minimize2 /> : <Maximize2 />}
    </button>
  );
  return (
    <div ref={deck} className={`cm-view-deck ${max ? `is-max-${max}` : ''}`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}>
      <section className={`cm-viewer ${max === 'camera' ? 'is-hidden' : ''}`} style={max === 'media' ? { flex: '1 1 auto' } : { flex: `0 0 calc(${split}% - 3px)` }}>
        <div className="cm-viewer-title">
          <span>MediaIn1</span>
          <span className="cm-panel-tools"><span>2D Preview</span>{maxBtn('media')}</span>
        </div>
        <div className="cm-viewer-body"><canvas ref={canvasRef} width="1280" height="720" />{!image && <button onClick={onUpload} className="cm-empty-view">Drop, paste, or upload an image</button>}</div>
      </section>
      <div className={`cm-view-split ${max ? 'is-hidden' : ''}`} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} title="Drag to resize the split"><i /></div>
      <section className={`cm-viewer ${max === 'media' ? 'is-hidden' : ''}`} style={max === 'camera' ? { flex: '1 1 auto' } : { flex: `0 0 calc(${100 - split}% - 3px)` }}>
        <div className="cm-viewer-title">
          <span>Camera3D1</span>
          <span className="cm-panel-tools"><span>Perspective</span>{maxBtn('camera')}</span>
        </div>
        <div className="cm-viewer-body"><Cam3DView image={image} media={media} manualOffset={manualOffset} camRig={camRig} onSelectAsset={onSelectAsset} refId={refId} onOffset={onOffset} onMoveAsset={onMoveAsset} onBeginAssetMove={onBeginAssetMove} getFrame={getFrame} label={label} /></div>
      </section>
    </div>
  );
}