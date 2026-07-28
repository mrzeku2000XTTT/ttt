import React, { useRef } from "react";
import { COLORS } from "./blueprintConstants";

export default function BlueprintCanvas({
  elements, selectedId, zoom, pan, tool, previewMode,
  onSelectElement, onUpdateElement, onCanvasClick, onPanChange, onZoomChange
}) {
  const canvasRef = useRef(null);
  const dragRef = useRef(null);

  const startPan = (e) => {
    if (previewMode) return;
    if (tool !== 'pan' && e.target !== canvasRef.current && !e.target.dataset?.canvasBg) return;
    onCanvasClick();
    const startX = e.clientX, startY = e.clientY;
    const origPan = { ...pan };
    dragRef.current = { type: 'pan', startX, startY, origPan };

    const onMove = (ev) => {
      onPanChange({ x: origPan.x + (ev.clientX - startX), y: origPan.y + (ev.clientY - startY) });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      dragRef.current = null;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const startElementDrag = (e, el) => {
    if (previewMode || tool !== 'select') return;
    e.stopPropagation();
    onSelectElement(el.id);
    const startX = e.clientX, startY = e.clientY;
    const origX = el.x, origY = el.y;
    dragRef.current = { type: 'element', elId: el.id };

    const onMove = (ev) => {
      const dx = (ev.clientX - startX) / zoom;
      const dy = (ev.clientY - startY) / zoom;
      onUpdateElement(el.id, { x: Math.max(0, origX + dx), y: Math.max(0, origY + dy) });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      dragRef.current = null;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const onWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.002;
      onZoomChange(z => Math.min(3, Math.max(0.1, z + delta)));
    } else {
      onPanChange(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
  };

  const renderContent = (el) => {
    const baseStyle = { fontFamily: "'Inter', system-ui, sans-serif" };
    switch (el.type) {
      case 'heading':
        return <div style={{ ...baseStyle, fontSize: el.fontSize, fontWeight: el.fontWeight, color: el.color, lineHeight: 1.2 }}>{el.content}</div>;
      case 'text':
        return <div style={{ ...baseStyle, fontSize: el.fontSize, fontWeight: el.fontWeight, color: el.color, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{el.content}</div>;
      case 'button':
        return (
          <div style={{
            ...baseStyle, fontSize: el.fontSize, fontWeight: el.fontWeight,
            color: '#fff', background: el.bg, padding: '10px 24px',
            borderRadius: 8, textAlign: 'center', whiteSpace: 'nowrap',
          }}>{el.content}</div>
        );
      case 'box':
        return <div style={{ width: '100%', height: '100%', minHeight: 80, background: el.bg, borderRadius: 8, border: `1px solid ${COLORS.BORDER}` }} />;
      case 'image':
        return <img src={el.content} alt="" style={{ width: '100%', borderRadius: 8, display: 'block' }} draggable={false} />;
      case 'video':
        return el.content
          ? <video src={el.content} controls style={{ width: '100%', borderRadius: 8, display: 'block' }} />
          : <div style={{ ...baseStyle, fontSize: 12, color: COLORS.TEXT_MED, padding: '1rem', textAlign: 'center', background: '#f9fafb', borderRadius: 8, border: `2px dashed ${COLORS.BORDER}` }}>Video URL required</div>;
      default:
        return null;
    }
  };

  return (
    <div
      ref={canvasRef}
      onPointerDown={startPan}
      onWheel={onWheel}
      className="absolute inset-0 overflow-hidden"
      style={{ background: previewMode ? '#fff' : COLORS.CANVAS_BG, cursor: tool === 'pan' && !previewMode ? 'grab' : 'default', touchAction: 'none' }}
    >
      <div
        data-canvas-bg="true"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          position: 'absolute',
          width: '200%',
          height: '200%',
          minHeight: '100%',
        }}
      >
        {elements.map(el => {
          const isSelected = el.id === selectedId && !previewMode;
          return (
            <div
              key={el.id}
              onPointerDown={(e) => startElementDrag(e, el)}
              onClick={(e) => { e.stopPropagation(); if (!previewMode) onSelectElement(el.id); }}
              style={{
                position: 'absolute',
                left: el.x,
                top: el.y,
                width: el.width,
                maxWidth: '100%',
                outline: isSelected ? `2px solid ${COLORS.BLUE}` : 'none',
                outlineOffset: '2px',
                borderRadius: el.type === 'box' ? 8 : 0,
                cursor: previewMode ? 'default' : (tool === 'select' ? 'move' : 'default'),
                touchAction: 'none',
                userSelect: 'none',
              }}
            >
              {renderContent(el)}
            </div>
          );
        })}
      </div>
    </div>
  );
}