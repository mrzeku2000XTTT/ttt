import React, { useRef } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import Cam3DView from './Cam3DView';
import CamSeparateLayersButton from './CamSeparateLayersButton';

export default function CamViewerDeck({ canvasRef, image, hasLayers, onSeparate, separating, separateElapsed, separateError, getFrame, label, onUpload, onFile, split, onSplit, max, onMax, media, manualOffset, camRig, onCameraRigMove, onCameraNavigate, onSelectAsset, refId, onOffset, onMoveAsset, onBeginAssetMove }) {
  const deck = useRef(null);
  const dragging = useRef(false);
  const pan = useRef(null);
  const full2d = split >= 99.5;
  const startDrag = (e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); };
  const moveDrag = (e) => {
    if (!dragging.current || !deck.current) return;
    const r = deck.current.getBoundingClientRect();
    onSplit(Math.min(100, Math.max(18, ((e.clientX - r.left) / r.width) * 100)));
  };
  const endDrag = () => { dragging.current = false; };
  const panStart = (e) => {
    if (!image) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const r = e.currentTarget.getBoundingClientRect();
    pan.current = { x: e.clientX, y: e.clientY, ox: manualOffset?.x || 0, oy: manualOffset?.y || 0, w: r.width, h: r.height };
  };
  const panMove = (e) => {
    const p = pan.current;
    if (!p) return;
    onOffset('x', Math.max(-1, Math.min(1, p.ox + ((e.clientX - p.x) / p.w) * 2)));
    onOffset('y', Math.max(-1, Math.min(1, p.oy - ((e.clientY - p.y) / p.h) * 2)));
  };
  const panEnd = () => { pan.current = null; };
  const maxBtn = (pane) => (
    <button onClick={() => onMax(max === pane ? null : pane)} title={max === pane ? 'Restore split view' : 'Fullscreen this viewer'}>
      {max === pane ? <Minimize2 /> : <Maximize2 />}
    </button>
  );
  return (
    <div ref={deck} className={`cm-view-deck ${max ? `is-max-${max}` : ''}`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}>
      <section className={`cm-viewer ${max === 'camera' ? 'is-hidden' : ''}`} style={max === 'media' || full2d ? { flex: '1 1 auto' } : { flex: `0 0 calc(${Math.min(split, 100)}% - 3px)` }}>
        <div className="cm-viewer-title">
          <span>Preview</span>
          <span className="cm-panel-tools">
            <button onClick={() => onSplit(full2d ? 50 : 100)} title={full2d ? 'Show the 3D rig split' : 'Collapse to 2D only'}>{full2d ? '3D' : '2D'}</button>
            <span>2D Preview</span>
            <CamSeparateLayersButton disabled={!image} busy={separating} elapsed={separateElapsed} onClick={onSeparate}/>{maxBtn('media')}
          </span>
        </div>
        <div className="cm-viewer-body">
          <div className="cm-2d-frame">
            <canvas ref={canvasRef} width="1280" height="720" />
            {image && (
              <div className="cm-2d-handles" onPointerDown={panStart} onPointerMove={panMove} onPointerUp={panEnd} onPointerCancel={panEnd}>
                <i className="cm-2d-h cm-2d-tl" /><i className="cm-2d-h cm-2d-tr" /><i className="cm-2d-h cm-2d-bl" /><i className="cm-2d-h cm-2d-br" />
                <span className="cm-2d-tag">Drag to reframe</span>
              </div>
            )}
          </div>
          {!image && !hasLayers && <button onClick={onUpload} className="cm-empty-view">Drop, paste, or upload an image</button>}
          {separateError && <div className="cm-separate-error">{separateError}</div>}
        </div>
      </section>
      <div className={`cm-view-split ${max || full2d ? 'is-hidden' : ''}`} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} title="Drag to resize the split"><i /></div>
      <section className={`cm-viewer ${max === 'media' || (full2d && max !== 'camera') ? 'is-hidden' : ''}`} style={max === 'camera' ? { flex: '1 1 auto' } : { flex: `0 0 calc(${100 - Math.min(split, 100)}% - 3px)` }}>
        <div className="cm-viewer-title">
          <span>Camera3D1</span>
          <span className="cm-panel-tools"><span>Perspective</span>{maxBtn('camera')}</span>
        </div>
        <div className="cm-viewer-body"><Cam3DView image={image} media={media} manualOffset={manualOffset} camRig={camRig} onCameraRigMove={onCameraRigMove} onCameraNavigate={onCameraNavigate} onSelectAsset={onSelectAsset} refId={refId} onOffset={onOffset} onMoveAsset={onMoveAsset} onBeginAssetMove={onBeginAssetMove} getFrame={getFrame} label={label} /></div>
      </section>
    </div>
  );
}