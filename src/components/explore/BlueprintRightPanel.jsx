import React, { useState } from "react";
import { Trash2, X } from "lucide-react";
import { COLORS } from "./blueprintConstants";

export default function BlueprintRightPanel({
  selected, onUpdateElement, onDeleteElement, onClose, isMobile
}) {
  if (!selected) {
    return (
      <div className="w-56 flex-shrink-0 border-l hidden lg:flex flex-col items-center justify-center" style={{ background: COLORS.PANEL_BG, borderColor: COLORS.BORDER }}>
        <p className="text-[12px] text-center px-4" style={{ color: COLORS.TEXT_MED }}>
          Select an element to edit its properties
        </p>
      </div>
    );
  }

  const inputStyle = {
    background: '#f9fafb', border: `1px solid ${COLORS.BORDER}`, color: COLORS.TEXT_DARK,
    fontFamily: "'Inter', system-ui, sans-serif",
  };

  const label = { color: `${COLORS.TEXT_MED}`, fontSize: '10px', fontWeight: 600, display: 'block', marginBottom: '3px' };

  const Panel = (
    <>
      <div className="flex items-center justify-between mb-3 px-3 pt-3">
        <p className="text-[10px] font-bold uppercase" style={{ color: COLORS.TEXT_MED, letterSpacing: '0.1em' }}>Properties</p>
        <div className="flex items-center gap-1">
          <button onClick={() => onDeleteElement(selected.id)} className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
            <Trash2 className="w-3 h-3" style={{ color: '#dc2626' }} />
          </button>
          {isMobile && (
            <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: '#f3f4f6' }}>
              <X className="w-3.5 h-3.5" style={{ color: COLORS.TEXT_DARK }} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3">
        {selected.type !== 'image' && selected.type !== 'video' && selected.type !== 'box' && (
          <div>
            <label style={label}>Content</label>
            <textarea
              value={selected.content}
              onChange={e => onUpdateElement(selected.id, { content: e.target.value })}
              rows={selected.type === 'text' ? 3 : 2}
              className="w-full text-[12px] p-2 rounded-md outline-none resize-none"
              style={inputStyle}
            />
          </div>
        )}

        {(selected.type === 'image' || selected.type === 'video') && (
          <div>
            <label style={label}>{selected.type === 'video' ? 'Video URL' : 'Image URL'}</label>
            <input
              type="text"
              value={selected.content}
              onChange={e => onUpdateElement(selected.id, { content: e.target.value })}
              className="w-full text-[11px] p-2 rounded-md outline-none"
              style={inputStyle}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label style={label}>Width</label>
            <input type="number" value={selected.width} onChange={e => onUpdateElement(selected.id, { width: parseInt(e.target.value) || 100 })} className="w-full text-[12px] p-2 rounded-md outline-none" style={inputStyle} />
          </div>
          {selected.type !== 'image' && selected.type !== 'video' && selected.type !== 'box' && (
            <div>
              <label style={label}>Font size</label>
              <input type="number" value={selected.fontSize} onChange={e => onUpdateElement(selected.id, { fontSize: parseInt(e.target.value) || 14 })} className="w-full text-[12px] p-2 rounded-md outline-none" style={inputStyle} />
            </div>
          )}
        </div>

        {selected.type !== 'image' && selected.type !== 'video' && selected.type !== 'box' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label style={label}>Weight</label>
              <select value={selected.fontWeight} onChange={e => onUpdateElement(selected.id, { fontWeight: parseInt(e.target.value) })} className="w-full text-[12px] p-2 rounded-md outline-none" style={inputStyle}>
                <option value={400}>Regular</option>
                <option value={600}>Semibold</option>
                <option value={700}>Bold</option>
              </select>
            </div>
            <div>
              <label style={label}>Text color</label>
              <input type="color" value={selected.color?.startsWith('#') && selected.color.length === 7 ? selected.color : '#1f2937'} onChange={e => onUpdateElement(selected.id, { color: e.target.value })} className="w-full h-9 rounded-md cursor-pointer" style={inputStyle} />
            </div>
          </div>
        )}

        {(selected.type === 'button' || selected.type === 'box') && (
          <div>
            <label style={label}>Background</label>
            <input type="color" value={selected.bg?.startsWith('#') && selected.bg.length === 7 ? selected.bg : '#4F46E5'} onChange={e => onUpdateElement(selected.id, { bg: e.target.value })} className="w-full h-9 rounded-md cursor-pointer" style={inputStyle} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label style={label}>X</label>
            <input type="number" value={Math.round(selected.x)} onChange={e => onUpdateElement(selected.id, { x: parseInt(e.target.value) || 0 })} className="w-full text-[12px] p-2 rounded-md outline-none" style={inputStyle} />
          </div>
          <div>
            <label style={label}>Y</label>
            <input type="number" value={Math.round(selected.y)} onChange={e => onUpdateElement(selected.id, { y: parseInt(e.target.value) || 0 })} className="w-full text-[12px] p-2 rounded-md outline-none" style={inputStyle} />
          </div>
        </div>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} />
        <div className="relative w-full rounded-t-xl max-h-[65vh] overflow-hidden flex flex-col" style={{ background: COLORS.PANEL_BG }} onClick={e => e.stopPropagation()}>
          {Panel}
        </div>
      </div>
    );
  }

  return (
    <div className="w-56 flex-shrink-0 border-l flex flex-col" style={{ background: COLORS.PANEL_BG, borderColor: COLORS.BORDER }}>
      {Panel}
    </div>
  );
}